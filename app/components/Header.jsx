'use client';

import React from 'react';
import PrimaryButton from './Buttons/PrimaryButton';
import { Icon, UserPlus, UsersIcon } from 'lucide-react';
import NotificationBell from './NotificationBell';
export default function Header({ employeeCount, onAdd }) {
  return (
    <header className="bg-white rounded-xl shadow-md p-2  m-0.5 border border-gray-200">
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-xl">
            <UsersIcon size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HR Module</h1>
            <p className="text-sm text-gray-900 mt-1">
              Manage employees, approvals, and quick actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Active employees
            </span>
            <span className="text-4xl font-extrabold text-gray-900 tracking-tight text-center">
              {employeeCount}
            </span>
          </div>

          <PrimaryButton onClick={onAdd} className="px-4 py-3">
            <UserPlus size={17} />
            Add Employee
          </PrimaryButton>

          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
