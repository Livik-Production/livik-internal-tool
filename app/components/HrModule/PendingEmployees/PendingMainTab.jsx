'use client';

import { useState } from 'react';
import TabButton from '../../Buttons/TabButton';
import PendingEmployees from './PendingEmployees';
import DocumentApprovalsTable from './DocumentApprovalsTable';
import { UserCheck, FileText } from 'lucide-react';

export default function PendingMainTab(props) {
  const [activeSubTab, setActiveSubTab] = useState('employees'); // employees | documents

  const subTabs = [
    { id: 'employees', label: 'Pending Employees' },
    { id: 'documents', label: 'Document Approvals' },
  ];

  return (
    <div className="space-y-4 animate-dashboard-reveal">
      {/* Sub-tabs Header */}
      <div className="sticky top-0 z-20 bg-white pt-2 pb-1 border-b border-gray-200 px-1">
        <nav className="flex space-x-1 overflow-x-auto no-scroll">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabButton
                key={tab.id}
                isActive={activeSubTab === tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className="flex items-center gap-2"
              >
                {tab.label}
              </TabButton>
            );
          })}
        </nav>
      </div>

      {/* Sub-tab Content */}
      <div key={activeSubTab} className="mt-2">
        {activeSubTab === 'employees' ? (
          <PendingEmployees {...props} searchElement={props.searchElement} searchQuery={props.searchQuery} />
        ) : (
          <DocumentApprovalsTable searchElement={props.searchElement} searchQuery={props.searchQuery} />
        )}
      </div>
    </div>
  );
}
