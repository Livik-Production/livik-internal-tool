import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

// 🔹 Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 🔹 Create Prisma adapter
const adapter = new PrismaPg(pool);

// 🔹 PrismaClient MUST receive adapter in v7
const prisma = new PrismaClient({ adapter });

async function clearExistingData() {
  console.log(' Clearing existing data...');

  // Clear data in correct order to avoid foreign key constraints
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Education" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Employee" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RoleRights" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Rights" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" CASCADE;`);

  console.log('✅ Existing data cleared');
}

async function ensureEmployeeSequence() {
  console.log('🔁 Ensuring employee_number_seq exists...');

  await prisma.$executeRawUnsafe(`
    DROP SEQUENCE IF EXISTS employee_number_seq;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE SEQUENCE IF NOT EXISTS employee_number_seq
    START 1
    INCREMENT 1
    MINVALUE 1;
  `);
}

async function seedPermissions() {
  console.log('🔁 Seeding rights...');

  // Define all rights
  const rights = [
    // Admin Module - 6 rights
    {
      module: 'Admin',
      displayName: 'Admin Control Customers',
      rightName: 'admin_control_customers',
      description: 'Can create, update, delete customers in Admin module',
    },
    {
      module: 'Admin',
      displayName: 'Admin Control Roles',
      rightName: 'admin_control_roles',
      description: 'Can create, update, delete roles in Admin module',
    },
    {
      module: 'Admin',
      displayName: 'Admin Module',
      rightName: 'admin_module_access',
      description: 'Access to Admin module',
    },
    {
      module: 'Admin',
      displayName: 'Admin View Customers',
      rightName: 'admin_view_customers',
      description: 'Can view customers in Admin module',
    },
    {
      module: 'Admin',
      displayName: 'Admin View Dashboard',
      rightName: 'admin_view_dashboard',
      description: 'Can view Admin dashboard',
    },
    {
      module: 'Admin',
      displayName: 'Admin View Roles',
      rightName: 'admin_view_roles',
      description: 'Can view roles in Admin module',
    },

    // Asset Module - 6 rights
    {
      module: 'Asset',
      displayName: 'Asset Control All Assets',
      rightName: 'asset_control_assets',
      description: 'Can create, update, delete all assets',
    },
    {
      module: 'Asset',
      displayName: 'Asset Control Assignments',
      rightName: 'asset_control_assignments',
      description: 'Can create, update, delete asset assignments',
    },
    {
      module: 'Asset',
      displayName: 'Asset Module',
      rightName: 'asset_module_access',
      description: 'Access to Asset module',
    },
    {
      module: 'Asset',
      displayName: 'Asset View Assets',
      rightName: 'asset_view_assets',
      description: 'Can view assets',
    },
    {
      module: 'Asset',
      displayName: 'Asset View Assignments',
      rightName: 'asset_view_assignments',
      description: 'Can view asset assignments',
    },
    {
      module: 'Asset',
      displayName: 'Asset View Dashboard',
      rightName: 'asset_view_dashboard',
      description: 'Can view Asset dashboard',
    },

    // Dashboard - 1 right
    {
      module: 'Dashboard',
      displayName: 'View Main Dashboard',
      rightName: 'view_main_dashboard',
      description: 'Can view the main dashboard',
    },

    // Finance Module - 8 rights
    {
      module: 'Finance',
      displayName: 'Finance Control Expenses',
      rightName: 'finance_control_expenses',
      description: 'Can create, update, delete expenses',
    },
    {
      module: 'Finance',
      displayName: 'Finance Control Invoices',
      rightName: 'finance_control_invoices',
      description: 'Can create, update, delete invoices',
    },

    // Finance Module - 4 rights
    {
      module: 'Finance',
      displayName: 'Finance View Expenses',
      rightName: 'finance_view_expenses',
      description: 'Can view expenses',
    },
    {
      module: 'Finance',
      displayName: 'Finance View Invoices',
      rightName: 'finance_view_invoices',
      description: 'Can view invoices',
    },
    {
      module: 'Finance',
      displayName: 'Finance View Payments',
      rightName: 'finance_view_payments',
      description: 'Can view payments',
    },
    {
      module: 'Finance',
      displayName: 'Finance View Overview',
      rightName: 'finance_view_overview',
      description: 'Can view overview',
    },

    // Asset Module - 2 rights
    {
      module: 'Asset',
      displayName: 'Asset Tracking Module',
      rightName: 'asset_module',
      description: 'Access to Asset Tracking module',
    },
    {
      module: 'Asset',
      displayName: 'Asset Control All',
      rightName: 'asset_control_all',
      description: 'Can manage all assets',
    },

    // HR Module - 6 rights
    {
      module: 'HR',
      displayName: 'HR Module View All Employees',
      rightName: 'hr_module_view_all_employees',
      description: 'Can view all employees',
    },
    {
      module: 'HR',
      displayName: 'HR Module Control All Employees',
      rightName: 'hr_module_control_all_employees',
      description: 'Can create, update, and delete employees',
    },
    {
      module: 'HR',
      displayName: 'HR Module View Leave Requests',
      rightName: 'hr_module_view_leave_requests',
      description: 'Can view leave requests',
    },
    {
      module: 'HR',
      displayName: 'HR Module Approve Leave',
      rightName: 'hr_module_approve_leave',
      description: 'Can approve/reject leave requests',
    },
    {
      module: 'HR',
      displayName: 'HR Module View Letter',
      rightName: 'hr_module_view_letter',
      description: 'Can view letters',
    },
    {
      module: 'HR',
      displayName: 'HR Module View Pending Employees',
      rightName: 'hr_module_view_pending_employees',
      description: 'Can view pending employees',
    },

    // Employee Portal - 1 right
    {
      module: 'Employee Portal',
      displayName: 'Employee Portal',
      rightName: 'employee_portal',
      description: 'Access to employee self-service portal',
    },
    {
      module: 'Payroll Module',
      displayName: 'Payroll view Dashboard',
      rightName: 'payroll_view_dashboard',
      description: 'Access to employee self-service portal',
    },
    {
      module: 'Payroll Module',
      displayName: 'Payroll control PayrollData',
      rightName: 'payroll_control_payrolldata',
      description: 'Access to employee self-service portal',
    },
    {
      module: 'Payroll Module',
      displayName: 'Payroll view PayrollData',
      rightName: 'payroll_view_payrolldata',
      description: 'Access to employee self-service portal',
    },
    {
      module: 'Payroll Module',
      displayName: 'Payroll control SalarySetup',
      rightName: 'payroll_control_salarysetup',
      description: 'Access to employee self-service portal',
    },
    {
      module: 'Payroll Module',
      displayName: 'Payroll view SalarySetup',
      rightName: 'payroll_view_salarysetup',
      description: 'Access to employee self-service portal',
    },
  ];

  // Create rights
  for (const right of rights) {
    await prisma.rights.upsert({
      where: { rightName: right.rightName },
      update: right,
      create: right,
    });
  }

  console.log(`✅ ${rights.length} rights seeded successfully`);
}

async function seedRoles() {
  console.log('🔁 Seeding roles...');

  // Get all rights
  const allRights = await prisma.rights.findMany();

  // Define roles with exact names as in your database
  const roles = [
    {
      displayName: 'Employee',
      roleName: 'EMPLOYEE',
      description: 'Regular employee with access to Dashboard and Portal',
      rights: allRights
        .filter(
          (p) =>
            p.rightName === 'view_main_dashboard' ||
            p.rightName === 'employee_portal'
        )
        .map((p) => p.id),
    },
    {
      displayName: 'Admin',
      roleName: 'ADMIN',
      description: 'Administrator with full access',
      rights: allRights.map((p) => p.id),
    },
    {
      displayName: 'hr_admin',
      roleName: 'HR_ADMIN',
      description: 'Human Resources Administrator',
      rights: allRights
        .filter(
          (p) =>
            p.rightName.startsWith('hr_') ||
            p.rightName.startsWith('asset_') ||
            p.rightName === 'finance_view_expenses' ||
            p.rightName === 'view_main_dashboard' ||
            p.rightName === 'employee_portal'
        )
        .map((p) => p.id),
    },
  ];

  // Create roles
  for (const roleData of roles) {
    const { rights, ...roleInfo } = roleData;

    // Create or update the role
    const role = await prisma.role.upsert({
      where: { roleName: roleInfo.roleName },
      update: roleInfo,
      create: roleInfo,
    });

    // Handle rights association via RoleRights
    // Clear existing rights for this role
    await prisma.roleRights.deleteMany({
      where: { roleId: role.id },
    });

    // Add new rights
    await prisma.roleRights.createMany({
      data: rights.map((rightId) => ({
        roleId: role.id,
        rightId: rightId,
      })),
    });
  }

  console.log(`✅ ${roles.length} roles seeded successfully`);
}

async function seedEmployees() {
  console.log('🔁 Seeding employees...');

  // Get roles for assignment - using roleName (unique)
  const adminRole = await prisma.role.findUnique({
    where: { roleName: 'ADMIN' },
  });
  const hrAdminRole = await prisma.role.findUnique({
    where: { roleName: 'HR_ADMIN' },
  });
  const employeeRole = await prisma.role.findUnique({
    where: { roleName: 'EMPLOYEE' },
  });

  // Seed Subiramani - Admin (LK001)
  await prisma.employee.upsert({
    where: { email: 'subiramani.g.m@gmail.com' },
    update: {},
    create: {
      empId: 'LK001',
      firstName: 'SUBIRAMANI',
      lastName: 'G',
      dateOfBirth: new Date('2000-05-17'),
      gender: 'MALE',
      aadhaarNumber: '266013543602',
      panNumber: 'MQIPS2999J',
      email: 'subiramani.g.m@gmail.com',
      phoneNumber: '6381986147',
      emergencyContact: 'Brother - 9566567962',
      bloodGroup: 'O+',
      presentAddress: '4/25, Middle Street, Mandhithoppu, Kovilpatti - 628501',
      permanentAddress:
        '4/25, Middle Street, Mandhithoppu, Kovilpatti - 628501',
      designation: 'Technical Lead',
      department: 'Technical',
      dateOfJoining: new Date('2025-08-03'),
      workLocation: 'Dindigul',
      bankName: 'Indian Overseas Bank',
      accountNumber: '266001000007598',
      ifscCode: 'IOBA0002660',
      roleId: adminRole?.id,
      educationDetails: {
        create: [
          {
            institution: 'Nadar Higher Secondary School, Kovilpatti',
            qualification: 'HSC',
            yearCompleted: '2017',
          },
          {
            university: 'MANONMANIUM SUNDARANAR UNIVERSITY',
            institution: 'Government Arts and Science College, Kovilpatti',
            qualification: 'B.Sc',
            yearCompleted: '2020',
          },
        ],
      },
    },
  });

  console.log('✅ Subiramani (Admin) seeded successfully');

  // Seed Bavinthra Kumar - Employee (LK002)
  await prisma.employee.upsert({
    where: { email: 'bavinthirakumar@gmail.com' },
    update: {},
    create: {
      empId: 'LK002',
      firstName: 'BAVINTHIRA',
      lastName: 'KUMAR',
      dateOfBirth: new Date('2004-03-08'),
      gender: 'MALE',
      aadhaarNumber: '236205736423',
      panNumber: 'GOLPB1729C',
      email: 'bavinthirakumar@gmail.com',
      phoneNumber: '6374020069',
      emergencyContact: 'BROTHER - 8754858838',
      bloodGroup: 'A1+',
      presentAddress: '2/498-B, SARADHA NAGAR, SIVAKASI.-626124',
      permanentAddress: '2/498-B, SARADHA NAGAR, SIVAKASI.-626124',
      designation: 'SOFTWARE DEVELOPER',
      department: 'TECHNICAL',
      dateOfJoining: new Date('2025-09-10'),
      workLocation: 'Dindigul',
      bankName: 'STATE BANK OF INDIA',
      accountNumber: '41323516161',
      ifscCode: 'SBIN0000975',
      roleId: employeeRole?.id,
      educationDetails: {
        create: [
          {
            institution: 'MUSLIM HR SEC SCHOOL',
            qualification: 'HSC',
            yearCompleted: '2022',
          },
          {
            university: 'MANONMANIUM SUNDARANAR UNIVERSITY',
            institution: 'G.VENKATASWAMY NAIDU COLLEGE',
            qualification: 'BCA',
            yearCompleted: '2025',
          },
        ],
      },
    },
  });

  console.log('✅ Bavinthra Kumar seeded successfully');

  // Seed Prathip Kumar - hr_admin (LK003)
  await prisma.employee.upsert({
    where: { email: 'aswinudhaya10@gmail.com' },
    update: {},
    create: {
      empId: 'LK003',
      firstName: 'PRATHIP',
      lastName: 'KUMAR',
      dateOfBirth: new Date('2000-12-25'),
      gender: 'MALE',
      aadhaarNumber: '932917118090',
      panNumber: 'FKCPP7309L',
      email: 'aswinudhaya10@gmail.com',
      phoneNumber: '9025977023',
      emergencyContact: 'Father - 9944750807',
      bloodGroup: 'O+',
      presentAddress:
        'Plot.No : 20/A , Annai Nagar 3rd Street Extension Area, Ponnagaram, Dindigul - 624003',
      permanentAddress:
        'Plot.No : 20/A , Annai Nagar 3rd Street Extension Area, Ponnagaram, Dindigul - 624003',
      designation: 'Human Resources Manager',
      department: 'Administrative',
      dateOfJoining: new Date('2025-08-03'),
      workLocation: 'Dindigul',
      bankName: 'INDIAN BANK',
      accountNumber: '6753217844',
      ifscCode: 'IDIB000D018',
      roleId: hrAdminRole?.id,
      educationDetails: {
        create: [
          {
            institution: 'SSM Matric HR. Sec School, Dindigul',
            qualification: 'HSC',
            yearCompleted: '2018',
          },
          {
            university: 'ANNA UNIVERSITY',
            institution: 'PSNA COLLEGE OF ENGINEERING AND TECHNOLOGY',
            qualification: 'MBA',
            yearCompleted: '2024',
          },
        ],
      },
    },
  });

  console.log('✅ Prathip Kumar seeded successfully');
}

async function main() {
  console.log('🌱 Starting seed process...');
  console.log('===============================');

  try {
    // Optional: Uncomment if you want to clear existing data first
    // await clearExistingData();

    await ensureEmployeeSequence();
    await seedPermissions();
    await seedRoles();
    await seedEmployees();

    console.log('===============================');
    console.log('🎉 Seed completed successfully!');
    console.log('📊 Summary:');
    console.log('   - 14 Rights created');
    console.log('   - 3 Roles created (EMPLOYEE, ADMIN, HR_ADMIN)');
    console.log('   - 3 Employees created (LK001, LK002, LK003)');
    console.log('   - Employee sequence initialized');
    console.log('===============================');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((err) => {
    console.error('❌ Fatal error during seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
    await pool.end();
    console.log('✅ Database connections closed');
  });
