'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Users,
  ClipboardList,
  Briefcase,
  UserCheck,
  TrendingUp,
  Mail,
  MessageSquare,
  Clock,
  Eye,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import Loader from '../../../Loader';

export default function DashboardTab({ onNavigate }) {
  const [stats, setStats] = useState({
    totalApplications: 0,
    openApplications: 0,
    roleApplications: 0,
    activeJobOpenings: 0,
    totalEnquiries: 0,
    newEnquiriesToday: 0,
    candidatesToday: 0,
    openAppsToday: 0,
    roleAppsToday: 0,
  });

  const [recentApplications, setRecentApplications] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tcRes, jaRes, joRes, csRes] = await Promise.all([
          fetch('/api/talent-community').catch(() => ({
            json: () => ({ data: [] }),
          })),
          fetch('/api/job-applications').catch(() => ({
            json: () => ({ data: [] }),
          })),
          fetch('/api/job-openings?all=true').catch(() => ({
            json: () => ({ data: [] }),
          })),
          fetch('/api/contact-submissions').catch(() => ({
            json: () => ({ data: [] }),
          })),
        ]);

        const tcData = await tcRes.json();
        const jaData = await jaRes.json();
        const joData = await joRes.json();
        const csData = await csRes.json();

        const tcArray = tcData.data || [];
        const jaArray = jaData.data || [];
        const joArray = joData.data || [];
        const csArray = csData.data || [];

        const talentPoolCount = tcArray.length;
        const roleAppsCount = jaArray.length;
        const activeJobsCount = joArray.filter(
          (job) => job.status !== 'INACTIVE'
        ).length;

        // Calculate new enquiries today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newEnquiriesToday = csArray.filter(
          (enq) => new Date(enq.createdAt) >= today
        ).length;

        const openAppsToday = tcArray.filter(
          (app) => new Date(app.createdAt) >= today
        ).length;
        const roleAppsToday = jaArray.filter(
          (app) => new Date(app.createdAt) >= today
        ).length;

        setStats({
          totalApplications: talentPoolCount + roleAppsCount,
          openApplications: talentPoolCount,
          roleApplications: roleAppsCount,
          activeJobOpenings: activeJobsCount,
          totalEnquiries: csArray.length,
          newEnquiriesToday,
          candidatesToday: openAppsToday + roleAppsToday,
          openAppsToday,
          roleAppsToday,
        });

        // Set recent applications (combine and sort)
        const combinedApps = [
          ...jaArray.map((a) => ({ ...a, _type: 'role' })),
          ...tcArray.map((a) => ({ ...a, _type: 'open' })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentApplications(combinedApps);

        // Set recent enquiries
        setRecentEnquiries(
          csArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <Loader label="Loading dashboard data..." size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-dashboard-reveal h-full text-gray-800 pb-12">
      {/* ===== PAGE HEADER ===== */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Website Operations Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of Recruitment and Client Enquiries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* SECTION 1: RECRUITMENT / JOB OPENINGS     */}
      {/* ========================================= */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
          <Briefcase className="text-[#3b82f6]" size={24} />
          <h2 className="text-xl font-bold text-gray-900">
            Recruitment Overview
          </h2>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-[#eef2ff] text-[#3b82f6] rounded-lg">
                <Users size={20} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.totalApplications}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Total Applications
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-[#e0f2fe] text-[#0ea5e9] rounded-lg">
                <ClipboardList size={20} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.openApplications}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Open Applications
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-[#f3f4f6] text-gray-600 rounded-lg">
                <Briefcase size={20} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.roleApplications}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Role Applications
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-[#f3f4f6] text-gray-600 rounded-lg">
                <UserCheck size={20} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.activeJobOpenings}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Active Job Openings
            </p>
          </div>
        </div>

        {/* Today's Applications Summary */}
        <h3 className="text-2xl font-bold text-gray-900 text-center -mb-2 mt-2">
          Today's Application Summary
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <span className="text-gray-500 font-medium text-sm">
                No. of Candidates
              </span>
              <span className="font-bold text-gray-900 text-2xl">
                {loading ? '...' : stats.candidatesToday}
              </span>
            </div>
            <div className="h-10 w-px bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-gray-500 font-medium text-sm">
                Open Applications
              </span>
              <span className="font-bold text-[#3b82f6] text-2xl">
                {loading ? '...' : stats.openAppsToday}
              </span>
            </div>
            <div className="h-10 w-px bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-gray-500 font-medium text-sm">
                Role Based Applications
              </span>
              <span className="font-bold text-[#0ea5e9] text-2xl">
                {loading ? '...' : stats.roleAppsToday}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Applications List */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              Recent Applications
            </h3>
          </div>

          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-sm text-gray-500 p-4 bg-white border border-gray-200 rounded-xl">
                Loading recent applications...
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 bg-white border border-gray-200 rounded-xl">
                No recent applications found.
              </div>
            ) : (
              recentApplications.map((app, idx) => (
                <div
                  key={app.id || idx}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm relative overflow-hidden shrink-0"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${app._type === 'role' ? 'bg-[#2563eb]' : 'bg-green-500'}`}
                  ></div>

                  <div className="flex items-center gap-4 pl-3">
                    <div className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#475569] font-bold flex items-center justify-center uppercase">
                      {app.fullName ? app.fullName.substring(0, 2) : 'NA'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {app.fullName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
                        <span>APPLIED FOR</span>
                        <Briefcase size={10} className="text-gray-400" />
                        <span className="text-gray-600">
                          {app.appliedPosition || 'Talent Pool'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 pr-2">
                    <span className="px-3 py-1 bg-[#eef2ff] text-[#3b82f6] text-[10px] font-bold uppercase rounded-full text-center">
                      NEW
                    </span>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                        APPLIED ON
                      </p>
                      <p className="text-xs font-bold text-gray-900">
                        {new Date(app.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('Job Openings', {
                            subtab:
                              app._type === 'role'
                                ? 'Role Applications'
                                : 'Open Applications',
                            search: app.fullName,
                          });
                        }
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SECTION 2: CLIENT ENQUIRIES               */}
      {/* ========================================= */}
      <div className="flex flex-col gap-6 mt-6 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-center gap-3 pb-2">
          <MessageSquare className="text-purple-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">
            Client Enquiries Overview
          </h2>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                <Mail size={20} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.totalEnquiries}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Total Enquiries
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-orange-50 text-orange-500 rounded-lg">
                <Clock size={20} />
              </div>
              <div className="flex items-center gap-1 text-orange-500 text-sm font-semibold">
                <span>Today</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.newEnquiriesToday}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">
              New Enquiries
            </p>
          </div>
        </div>

        {/* Recent Enquiries List */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              Recent Enquiries
            </h3>
          </div>

          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-sm text-gray-500 p-4 bg-white border border-gray-200 rounded-xl">
                Loading recent enquiries...
              </div>
            ) : recentEnquiries.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 bg-white border border-gray-200 rounded-xl">
                No recent enquiries found.
              </div>
            ) : (
              recentEnquiries.map((enq, idx) => (
                <div
                  key={enq.id || idx}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm relative overflow-hidden shrink-0"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>

                  <div className="flex items-center gap-4 pl-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 font-bold flex items-center justify-center uppercase">
                      {enq.fullName ? enq.fullName.substring(0, 2) : 'NA'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {enq.fullName}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {enq.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {enq.phoneNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 pr-2">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                        SUBMITTED ON
                      </p>
                      <p className="text-xs font-bold text-gray-900">
                        {new Date(enq.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('Client Enquiries', {
                            search: enq.fullName,
                          });
                        }
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Eye size={14} /> View Message
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
