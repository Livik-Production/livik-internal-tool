'use client';

import { useState } from 'react';
import RolesTab from '../../../components/AdminPanel/RolesTab/RolesTab';
import RightsTab from '../../../components/AdminPanel/RightsTab/RightsTab';
import TabButton from '../../../components/Buttons/TabButton';

export default function RolesAndRightsPage() {
  const [activeTab, setActiveTab] = useState('roles');

  return (
    <div>
      <div className="px-2">
        <div className="flex items-end border-b border-gray-200 gap-1 overflow-x-auto no-scroll mb-3">
          <TabButton
            isActive={activeTab === 'roles'}
            onClick={() => setActiveTab('roles')}
          >
            Roles
          </TabButton>
          <TabButton
            isActive={activeTab === 'rights'}
            onClick={() => setActiveTab('rights')}
          >
            Rights
          </TabButton>
        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div
        key={activeTab}
        className="animate-dashboard-reveal"
      >
        {activeTab === 'roles' ? <RolesTab /> : <RightsTab />}
      </div>
    </div>
  );
}
