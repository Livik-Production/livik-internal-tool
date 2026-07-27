import React from 'react';
import { UsersRound } from 'lucide-react';
import NotificationBell from '../NotificationBell';

export default function CRMHeader() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 m-0.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center gap-3">
        {/* Rounded square with blue gradient, flat modern CRM logo */}
        <div className="w-12 h-12 bg-blue-50 text-[#33a8d9] rounded-xl flex items-center justify-center shrink-0 shadow-md border border-blue-200/10">
          <UsersRound className="w-6 h-6 " strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track leads, opportunities, sales funnel, and customer relations.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* <PrimaryButton onClick={handleAddLeadClick}>
          <span className="text-xl mr-1">+</span>
          Add Lead
        </PrimaryButton> */}
        <NotificationBell />
      </div>
    </div>
  );
}
