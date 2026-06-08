'use client';
import { useState } from 'react';
import { Globe } from 'lucide-react';
import TabButton from '../../../components/Buttons/TabButton';
import ContactSubmissionsTab from '../../../components/AdminPanel/WebsiteOperations/contact-submissions/ContactSubmissionsTab';
import JobOpeningsTab from '../../../components/AdminPanel/WebsiteOperations/job-openings/JobOpeningsTab';
import JobApplicationsTab from '../../../components/AdminPanel/WebsiteOperations/job-applications/JobApplicationsTab';
import TalentCommunityTab from '../../../components/AdminPanel/WebsiteOperations/talent-community/TalentCommunityTab';
import DashboardTab from '../../../components/AdminPanel/WebsiteOperations/dashboard/DashboardTab';

const TABS = ['Dashboard', 'Job Openings', 'Client Enquiries'];

export default function LivikSiteOperationsManagement() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [navigationState, setNavigationState] = useState(null);

  const handleNavigate = (tab, payload) => {
    setNavigationState(payload);
    setActiveTab(tab);
  };

  return (
    <div className="h-full flex flex-col space-y-1.5 min-h-0">
      {/* ===== HEADER CARD ===== */}
      <div className="bg-white shadow-sm rounded-2xl px-4 py-3 m-0.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-xl">
            <Globe size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Website Operations
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage website content including contact submissions, job
              openings, applications, and talent community.
            </p>
          </div>
        </div>
      </div>

      {/* ===== CONTENT CARD (TABS + CONTENT) ===== */}
      <div className="flex-1 flex flex-col bg-white shadow-sm rounded-2xl mt-1.5 m-0.5 min-h-0 pb-3">
        {/* ===== TABS NAVIGATION ===== */}
        <div className="flex shrink-0 items-end border-b border-gray-200 gap-1 overflow-x-auto no-scroll m-2">
          {TABS.map((tab) => (
            <TabButton
              key={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className="whitespace-nowrap"
            >
              {tab}
            </TabButton>
          ))}
        </div>

        {/* ===== MAIN CONTENT AREA ===== */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-3 min-h-0">
          <div className="w-full h-full">
            {activeTab === 'Dashboard' && (
              <DashboardTab onNavigate={handleNavigate} />
            )}
            {activeTab === 'Job Openings' && (
              <JobOpeningsTab
                navigationState={navigationState}
                clearNavigationState={() => setNavigationState(null)}
              />
            )}
            {activeTab === 'Client Enquiries' && (
              <ContactSubmissionsTab
                navigationState={navigationState}
                clearNavigationState={() => setNavigationState(null)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
