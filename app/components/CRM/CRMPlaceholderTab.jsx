import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import PrimaryButton from '../Buttons/PrimaryButton';

export default function CRMPlaceholderTab({ activeTab, setActiveTab, handleAddLeadClick }) {
  return (
    <div className="h-full flex flex-col">
      {/* Top Bar (Search + Button) */}
      <div className="flex flex-col md:flex-row justify-end items-center gap-3 mb-6">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="pl-10 text-sm pr-10 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
          />
        </div>

        <PrimaryButton onClick={() => {
            if (activeTab === 'Opportunities') {
              handleAddLeadClick();
            } else {
              handleAddLeadClick();
            }
        }}>
          <span className="text-xl mr-1 leading-none">+</span>
          {activeTab === 'Interview' ? 'Add Interview' : `Add ${activeTab}`}
        </PrimaryButton>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#004475] mb-4 shadow-inner">
          <Sparkles size={28} />
        </div>
        <h3 className="text-lg font-black text-slate-950">{activeTab} tab is ready!</h3>
        <p className="text-sm font-semibold text-slate-500 max-w-sm mt-1 mb-6">
          We've set up the routing for this section. Fully custom controls and dynamic forms will render here.
        </p>
        <button
          onClick={() => setActiveTab('Dashboard')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer h-[42px]"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
