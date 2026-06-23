import { NextResponse } from 'next/server';

export function proxy(req) {
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();

  const authSession = req.cookies.get('auth_session')?.value;

  // 🔐 Protect dashboard and API routes
  const isDashboard = pathname.startsWith('/dashboard');
  const isApi = pathname.startsWith('/api');
  const isAuthApi = pathname.startsWith('/api/auth');
 const isCronApi = pathname.startsWith('/api/cron');

const isPublicApi =
  ((pathname === '/api/contact-submissions' ||
    pathname === '/api/contact-submissions/') &&
    (req.method === 'POST' || req.method === 'OPTIONS')) ||
  pathname === '/api/login-admin' ||
  pathname === '/api/login-admin/' ||
  isCronApi;

  if (isDashboard || (isApi && !isAuthApi && !isPublicApi)) {
    if (!authSession) {
      if (isApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    let session;
    try {
      session = JSON.parse(authSession);
    } catch {
      if (isApi) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // minimal validation
    const isAdmin = !session?.roleId && session?.roleName === 'Admin';
    const isPasswordReset = pathname === '/api/employees/password';

    if (!session?.employeeId && !isAdmin && !isPasswordReset) {
      if (isApi) {
        return NextResponse.json({ error: 'Session invalid' }, { status: 401 });
      }
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    /**
     * 🔐 SECURITY: Route-based access control
     * Check if the user has rights for the requested module
     */
    const rights = session?.rights || [];
    const roleName = session?.roleName?.toUpperCase();
    const isSuperAdmin =
      roleName === 'SUPER_ADMIN' ||
      roleName === 'SUPER ADMIN' ||
      roleName === 'SUPERADMIN' ||
      roleName === 'ADMIN';
    const hasAllAccess = isSuperAdmin || rights.includes('ALL_ACCESS');

    if (!hasAllAccess) {
      // Logic for Dashboard
      if (isDashboard) {
        const routeMap = {
          '/dashboard/admin/livik-site-operations': [
            'website_ops',
            'site_operations',
            'livik_site',
          ],
          '/dashboard/admin': ['admin'],
          '/dashboard/hr': ['hr'],
          '/dashboard/staffing': ['staffing'],
          '/dashboard/payroll': ['payroll'],
          '/dashboard/finance': ['finance'],
          '/dashboard/asset': ['asset'],
          '/dashboard/settings': ['settings'],
        };

        let matchedRoute = null;
        for (const route of Object.keys(routeMap)) {
          if (pathname.startsWith(route)) {
            if (!matchedRoute || route.length > matchedRoute.length) {
              matchedRoute = route;
            }
          }
        }

        if (matchedRoute) {
          const rightKeywords = routeMap[matchedRoute];
          const hasRight = rights.some((r) =>
            rightKeywords.some((keyword) => r.toLowerCase().includes(keyword))
          );
          if (!hasRight) {
            return new NextResponse(
              `<html>
                <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #f3f4f6;">
                  <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <h1 style="color: #ef4444; margin-bottom: 1rem;">403 - Not Authorized</h1>
                    <p style="color: #4b5563; font-size: 1.125rem;">You are not authorized to access this page.</p>
                    <a href="/dashboard" style="display: inline-block; margin-top: 1.5rem; padding: 0.5rem 1rem; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Back to Dashboard</a>
                  </div>
                </body>
              </html>`,
              {
                status: 403,
                headers: { 'content-type': 'text/html' },
              }
            );
          }
        }
      }

      // Logic for API
      if (isApi) {
        // Exclude password reset endpoint from HR rights check
        if (pathname === '/api/employees/password') {
          return NextResponse.next();
        }

        // 🔓 Allow employees to see their own salary setup, payslips, profile, and leaves
        const isSalarySetup = pathname === '/api/payroll/salary-setup';
        const isPayslip = pathname === '/api/hr/payslip';
        const isPayrollData = pathname === '/api/payroll/data';
        // Allow GET for balance, but GET/POST/PUT for leave (except approvals)
        const isLeaveApi =
          (pathname === '/api/leave' ||
            pathname.startsWith('/api/leave/') ||
            pathname === '/api/leave/balance') &&
          !pathname.endsWith('/approve') &&
          !pathname.endsWith('/reject');
        const isHolidayFetch =
          pathname === '/api/hr/holidays' && req.method === 'GET';
        const isOwnEmployeeFetch =
          pathname.startsWith('/api/employees/') &&
          (req.method === 'GET' || req.method === 'PUT' || req.method === 'PATCH' || (req.method === 'POST' && pathname.includes('/documents')));
        const isAttendanceApi = pathname.startsWith('/api/hr/attendance');

        if (
          session.employeeId &&
          (isSalarySetup ||
            isPayslip ||
            isPayrollData ||
            isOwnEmployeeFetch ||
            isLeaveApi ||
            isHolidayFetch ||
            isAttendanceApi)
        ) {
          // 1. Always allow global fetches
          if (isHolidayFetch) return NextResponse.next();

          // 2. Allow if targetId matches session.employeeId (works for GET and detail URLs)
          const searchParams = req.nextUrl.searchParams;
          // Derive targetId from URL intelligently. Supports paths like:
          // - /api/employees/{id}
          // - /api/employees/{id}/documents
          const parts = pathname.split('/').filter(Boolean);
          let targetId = searchParams.get('employeeId') || null;
          if (!targetId) {
            if (parts.length >= 3 && parts[1] === 'employees') {
              // parts example: ['api','employees','EMP001','documents']
              // Employee id is always the segment after 'employees'
              const empIndex = parts.indexOf('employees') + 1;
              targetId = parts[empIndex] || null;
            } else {
              targetId = pathname.split('/').pop();
            }
          }

          // Allow explicit fetches on payroll/attendance by employee ID
          if (targetId === session.employeeId || targetId === session.empId || targetId === session.contractEmpId) {
            return NextResponse.next();
          }

          // Allow employees to POST their own documents (upload) to
          // /api/employees/{id}/documents even though it's a POST route.
          // This keeps uploads possible for regular employees while still
          // protecting other POST actions on /api/employees.
          if (
            req.method === 'POST' &&
            pathname.match(/^\/api\/employees\/[^/]+\/documents\/?$/) &&
            (targetId === session.employeeId || targetId === session.empId || targetId === session.contractEmpId)
          ) {
            return NextResponse.next();
          }

          // 3. Fallback: Allow for Employees (case-insensitive)
          // Also allow POST/PUT for any logged-in user for Leave API (API handles validation)
          if (
            roleName === 'EMPLOYEE' ||
            (isLeaveApi &&
              (req.method === 'POST' ||
                req.method === 'PUT' ||
                req.method === 'DELETE'))
          ) {
            return NextResponse.next();
          }
        }

        const apiRouteMap = {
          '/api/job-applications': [
            'website_ops',
            'site_operations',
            'livik_site',
          ],
          '/api/job-openings': ['website_ops', 'site_operations', 'livik_site'],
          '/api/talent-community': [
            'website_ops',
            'site_operations',
            'livik_site',
          ],
          '/api/contact-submissions': [
            'website_ops',
            'site_operations',
            'livik_site',
          ],
          '/api/projects': ['staffing', 'hr'],
          '/api/skills': ['hr'],
          '/api/employees': ['hr'],
          '/api/leave': ['hr'],
          '/api/expense': ['finance'],
          '/api/invoices': ['finance'],
          '/api/payments': ['finance'],
          '/api/assets': ['asset'],
          '/api/asset-assignment': ['asset'],
          '/api/asset-categories': ['asset'],
          '/api/customers': ['admin'],
          '/api/rights': ['admin'],
          '/api/roles': ['admin'],
          '/api/role-rights': ['admin'],
          '/api/payroll': ['payroll'],
          '/api/hr': ['hr'],
        };

        // Special handling for payroll to support granular control/view
        if (pathname.startsWith('/api/payroll')) {
          const isGet = req.method === 'GET';
          const hasControl =
            hasAllAccess ||
            rights.some(
              (r) =>
                r.toLowerCase() === 'payroll_control' ||
                (r.toLowerCase().startsWith('payroll_control_') &&
                  r.toLowerCase().includes('payroll'))
            );
          const hasView =
            hasControl ||
            rights.some(
              (r) =>
                r.toLowerCase() === 'payroll_view' ||
                (r.toLowerCase().startsWith('payroll_view_') &&
                  r.toLowerCase().includes('payroll'))
            );

          if (!hasView || (!isGet && !hasControl)) {
            return NextResponse.json(
              {
                error: 'Forbidden',
                message: 'You do not have sufficient rights for this operation',
              },
              { status: 403 }
            );
          }
          return NextResponse.next();
        }

        // Special handling for assets to support granular control/view
        if (
          pathname.startsWith('/api/assets') ||
          pathname.startsWith('/api/asset-assignment') ||
          pathname.startsWith('/api/asset-categories')
        ) {
          const isGet = req.method === 'GET';
          const hasGlobalControl =
            hasAllAccess ||
            rights.some((r) => r.toLowerCase() === 'asset_control_all');

          let hasView = hasGlobalControl;
          let hasControl = hasGlobalControl;

          if (pathname.startsWith('/api/assets')) {
            hasView =
              hasView ||
              rights.some(
                (r) =>
                  r.toLowerCase() === 'asset_view_assets' ||
                  r.toLowerCase() === 'asset_control_assets'
              );
            hasControl =
              hasControl ||
              rights.some((r) => r.toLowerCase() === 'asset_control_assets');
          } else if (pathname.startsWith('/api/asset-assignment')) {
            hasView =
              hasView ||
              rights.some(
                (r) =>
                  r.toLowerCase() === 'asset_view_assignments' ||
                  r.toLowerCase() === 'asset_control_assignments'
              );
            hasControl =
              hasControl ||
              rights.some(
                (r) => r.toLowerCase() === 'asset_control_assignments'
              );
          } else if (pathname.startsWith('/api/asset-categories')) {
            hasView =
              hasView ||
              rights.some((r) => {
                const lr = r.toLowerCase();
                return (
                  lr.startsWith('asset_') ||
                  lr === 'asset_module' ||
                  lr === 'asset_module_access'
                );
              });
            // Only admins or global control can modify categories
            hasControl = hasGlobalControl;
          }

          if (!hasView || (!isGet && !hasControl)) {
            return NextResponse.json(
              {
                error: 'Forbidden',
                message: 'You do not have sufficient rights for this operation',
              },
              { status: 403 }
            );
          }
          return NextResponse.next();
        }

        let matchedApiRoute = null;
        for (const route of Object.keys(apiRouteMap)) {
          if (pathname.startsWith(route)) {
            if (!matchedApiRoute || route.length > matchedApiRoute.length) {
              matchedApiRoute = route;
            }
          }
        }

        if (matchedApiRoute) {
          const rightKeywords = apiRouteMap[matchedApiRoute];
          const hasRight = rights.some((r) =>
            rightKeywords.some((keyword) => r.toLowerCase().includes(keyword))
          );
          if (!hasRight) {
            return NextResponse.json(
              {
                error: 'Forbidden',
                message: 'You are not authorized to access this API',
              },
              { status: 403 }
            );
          }
        }
      }
    }

  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
