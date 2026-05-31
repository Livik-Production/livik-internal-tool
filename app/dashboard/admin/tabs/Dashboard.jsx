'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  Briefcase,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Loader from '../../../components/Loader';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = '#33a8d9',
  subValue,
}) => (
  <div
    className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer"
    style={{ borderTopColor: color }}
  >
    {/* Premium Shine Effect */}
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

    <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
      <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
        {title}
      </span>
      <p className="text-[13px] text-gray-500 font-medium mb-4">
        System Overview
      </p>
      <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
        {value}
      </h3>
      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
        <Icon
          size={14}
          className="text-[#33a8d9] group-hover:text-white transition-colors"
        />
        <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
          {subValue}
        </span>
      </div>
    </div>
  </div>
);

const ActivityItem = ({ title, subtitle, date, icon: Icon, iconBg }) => (
  <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors group">
    <div className={`p-2 rounded-lg ${iconBg}`}>
      <Icon size={18} className="text-[#004475]" />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-gray-800 group-hover:text-[#33a8d9] transition-colors">
        {title}
      </h4>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
    <div className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wider">
      {date}
    </div>
  </div>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    customers: 0,
    roles: 0,
    rights: 0,
  });
  const [recentItems, setRecentItems] = useState({
    employees: [],
    customers: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [empRes, custRes, rolesRes, rightsRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/customers'),
          fetch('/api/roles'),
          fetch('/api/rights'),
        ]);

        const emps = await empRes.json();
        const custs = await custRes.json();
        const roles = await rolesRes.json();
        const rights = await rightsRes.json();

        setStats({
          employees: Array.isArray(emps) ? emps.length : 0,
          customers: Array.isArray(custs) ? custs.length : 0,
          roles: Array.isArray(roles) ? roles.length : 0,
          rights: Array.isArray(rights) ? rights.length : 0,
        });

        // Filter and sort for recent items (last 5)
        if (Array.isArray(emps)) {
          setRecentItems((prev) => ({
            ...prev,
            employees: emps.slice(0, 5).map((e) => ({
              id: e.id,
              name: `${e.firstName} ${e.lastName}`,
              subtitle: e.designation || 'Employee',
              date: e.createdAt
                ? new Date(e.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Recently',
              icon: UserCheck,
              bg: 'bg-blue-50',
            })),
          }));
        }

        if (Array.isArray(custs)) {
          setRecentItems((prev) => ({
            ...prev,
            customers: custs.slice(0, 5).map((c) => ({
              id: c.id,
              name: c.companyName || c.clientName || 'Customer',
              subtitle: c.city || 'Client',
              date: c.createdAt
                ? new Date(c.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Recently',
              icon: Briefcase,
              bg: 'bg-green-50',
            })),
          }));
        }
      } catch (error) {
        console.error('Dashboard Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
        <Loader
          label="Loading administrative stats..."
          size="lg"
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <div className="space-y-4 animate-fadeIn">
        {/* ===== STATS GRID ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 md:mt-4">
          <StatCard
            title="Total Employees"
            value={stats.employees}
            icon={Users}
            color="#33a8d9"
            subValue="Registered staff"
          />
          <StatCard
            title="Active Customers"
            value={stats.customers}
            icon={Briefcase}
            color="#33a8d9"
            subValue="B2B client accounts"
          />
          <StatCard
            title="System Roles"
            value={stats.roles}
            icon={Shield}
            color="#33a8d9"
            subValue="Access control groups"
          />
          <StatCard
            title="Defined Rights"
            value={stats.rights}
            icon={UserCheck}
            color="#33a8d9"
            subValue="Granular permissions"
          />
        </div>

        {/* ===== RECENT ACTIVITY SECTIONS ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
          {/* Recent Employees */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#004475] flex items-center gap-2">
                <Users size={20} className="text-[#33a8d9]" />
                Recent Employees
              </h3>
              <button className="text-[#33a8d9] hover:text-[#004475] text-sm font-semibold flex items-center gap-1 transition-colors">
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="flex-1 space-y-1 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {recentItems.employees.length > 0 ? (
                recentItems.employees.map((item) => (
                  <ActivityItem
                    key={item.id}
                    title={item.name}
                    subtitle={item.subtitle}
                    date={item.date}
                    icon={item.icon}
                    iconBg={item.bg}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Users size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No recent employees found</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Customers */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#004475] flex items-center gap-2">
                <Briefcase size={20} className="text-[#33a8d9]" />
                Recent Customers
              </h3>
              <button className="text-[#33a8d9] hover:text-[#004475] text-sm font-semibold flex items-center gap-1 transition-colors">
                Manage Data <ArrowRight size={14} />
              </button>
            </div>
            <div className="flex-1 space-y-1 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {recentItems.customers.length > 0 ? (
                recentItems.customers.map((item) => (
                  <ActivityItem
                    key={item.id}
                    title={item.name}
                    subtitle={item.subtitle}
                    date={item.date}
                    icon={item.icon}
                    iconBg={item.bg}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Briefcase size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No recent customers found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== QUICK LINKS / FOOTER ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 bg-gradient-to-r from-[#004475] to-[#33a8d9] rounded-[22px] text-white flex items-center justify-between group cursor-pointer overflow-hidden relative shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="relative z-10 font-bold block">
              <p className="text-white/80 text-[10px] uppercase tracking-wider font-semibold mb-1">
                RBAC System
              </p>
              <span className="text-lg">Configure Roles</span>
            </div>
            <Shield
              size={50}
              className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500"
            />
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-[#004475] transition-all">
              <ExternalLink size={16} />
            </div>
          </div>

          <div className="p-5 bg-white border border-gray-100 rounded-[22px] text-[#004475] flex items-center justify-between group cursor-pointer overflow-hidden relative shadow-sm hover:shadow-md transition-all duration-300">
            <div className="relative z-10 font-bold block">
              <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                Client Data
              </p>
              <span className="text-lg">Customer Hub</span>
            </div>
            <Briefcase
              size={50}
              className="absolute -right-4 -bottom-4 opacity-5 text-[#33a8d9] group-hover:scale-125 transition-transform duration-500"
            />
            <div className="w-8 h-8 rounded-full bg-[#33a8d9]/10 text-[#33a8d9] flex items-center justify-center group-hover:bg-[#33a8d9] group-hover:text-white transition-all">
              <ExternalLink size={16} />
            </div>
          </div>

          <div className="p-5 bg-[#33a8d9] rounded-[22px] text-white flex items-center justify-between group cursor-pointer overflow-hidden relative shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="relative z-10 font-bold block">
              <p className="text-white/80 text-[10px] uppercase tracking-wider font-semibold mb-1">
                Onboarding
              </p>
              <span className="text-lg">Add New User</span>
            </div>
            <Users
              size={50}
              className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500"
            />
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-[#33a8d9] transition-all">
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
