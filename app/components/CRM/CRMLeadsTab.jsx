import React from 'react';
import { Search, Plus, Building2, User, Mail, Phone, MapPin, Globe, Trash, SquarePen } from 'lucide-react';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';

export default function CRMLeadsTab({
  leadsList,
  searchQuery,
  setSearchQuery,
  canControlCrm,
  handleAddLeadClick,
  counts,
  filteredLeads,
  getLeadDesign,
  setSelectedLeadDetail,
  handleLogNewActivityLeadClick,
  handleEditLeadClick,
  handleDeleteLead,
  formatDateTime
}) {
  return (
    <div className="space-y-6 [animation-delay:100ms] animate-dashboard-reveal text-left px-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        {/* Left */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Leads Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Total {leadsList.length} Active Prospects
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={16} />
            </span>

            <input
              type="text"
              placeholder="Search by name, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm font-semibold text-gray-700 placeholder-gray-400 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:outline-hidden transition-all"
            />
          </div>

          {canControlCrm && (
            <PrimaryButton onClick={handleAddLeadClick}>
              <Plus size={16} />
              Add Lead
            </PrimaryButton>
          )}
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="flex gap-3">
        
      </div>

      {/* Status Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white p-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <span className="text-xs font-bold text-[#004475] uppercase tracking-wider">New</span>
          <span className="text-2xl font-black text-[#004475] mt-2 transition-transform group-hover:scale-105">{counts.New || 0}</span>
        </div>
        <div className="relative overflow-hidden bg-white p-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <span className="text-xs font-bold text-[#004475] uppercase tracking-wider">Contacted</span>
          <span className="text-2xl font-black text-[#004475] mt-2 transition-transform group-hover:scale-105">{counts.Contacted || 0}</span>
        </div>
        <div className="relative overflow-hidden bg-white p-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <span className="text-xs font-bold text-[#004475] uppercase tracking-wider">Qualified</span>
          <span className="text-2xl font-black text-[#004475] mt-2 transition-transform group-hover:scale-105">{counts.Qualified || 0}</span>
        </div>
        <div className="relative overflow-hidden bg-white p-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <span className="text-xs font-bold text-[#004475] uppercase tracking-wider">Won</span>
          <span className="text-2xl font-black text-blue-600 mt-2 transition-transform group-hover:scale-105">{counts.Won || 0}</span>
        </div>
      </div>

      {/* Leads List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
        {filteredLeads.map((lead) => {
          const design = getLeadDesign(lead.status);
          return (
            <div
              key={lead.id}
              onClick={() => setSelectedLeadDetail(lead)}
              className="bg-white p-6 rounded-[18px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#004475]/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col gap-4 relative overflow-hidden"
            >
              {/* Header: Icon, Company Name, Status Badge, Actions */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-[#f0f4f8] text-[#004475] group-hover:bg-[#004475] group-hover:text-white transition-colors`}>
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#004475] transition-colors">{lead.company}</h4>
                    <span className={`inline-block mt-1 px-1 ${design.bg} ${design.text} text-[10px] font-bold uppercase tracking-wider rounded-md`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {canControlCrm && (
                    <>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogNewActivityLeadClick(lead);
                        }}
                        className="text-[#004475] hover:text-[#33a8d9] hover:bg-[#33a8d9]/10 transition-all p-2 rounded-lg"
                        title="Log Activity"
                      >
                        <Plus size={16} />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLeadClick(lead);
                        }}
                        className="text-[#004475] hover:text-[#33a8d9] hover:bg-[#33a8d9]/10 transition-all p-2 rounded-lg"
                        title="Edit Lead"
                      >
                        <SquarePen size={16} />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLead(lead.id);
                        }}
                        className="text-[#004475] hover:text-[#33a8d9] hover:bg-[#33a8d9]/10 transition-all p-2 rounded-lg"
                        title="Delete Lead"
                      >
                        <Trash size={16} />
                      </IconButton>
                    </>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-[#f0f4f8] my-1" />

              {/* Details: Contact Person, Email, Mobile */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 text-[#004475] mb-1">
                    <User size={14} className="shrink-0" />
                    <span className="text-sm font-bold truncate">{lead.name || 'N/A'}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium pl-6 truncate">{lead.title || 'Project Lead'}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 text-[#004475] mb-1">
                    <Mail size={14} className="shrink-0" />
                    <span className="text-sm font-bold truncate">{lead.email || 'N/A'}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium pl-6">Email</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 text-[#004475] mb-1">
                    <Phone size={14} className="shrink-0" />
                    <span className="text-sm font-bold truncate">{lead.phone || 'N/A'}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium pl-6">Mobile</span>
                </div>
              </div>
              
              <div className="h-px w-full bg-[#f0f4f8] my-1" />

              {/* Address & Website */}
              <div className="grid grid-cols-2 gap-4 pb-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-start gap-2 text-[#004475] mb-1">
                    <span className="mt-0.5 shrink-0"><MapPin size={14} /></span>
                    <span className="text-sm font-bold leading-tight line-clamp-2">{lead.companyAddress || lead.location || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 text-[#004475] mb-1">
                    <span className="shrink-0"><Globe size={14} /></span>
                    <span className="text-sm font-bold truncate text-[#33a8d9] hover:underline">{lead.companyWebsite || 'N/A'}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium pl-6">Website</span>
                </div>
              </div>

              {/* Last Contacted */}
              <div className="absolute bottom-4 left-6">
                <span className="inline-flex items-center px-2.5 py-1 bg-[#f0f4f8] text-[#004475] text-[10px] font-bold rounded border border-[#33a8d9]/20">
                  Last Contacted: {formatDateTime(lead.updatedAt) || 'N/A'}
                </span>
              </div>
              <div className="h-4" /> {/* Padding bottom hack for absolutely positioned elements */}
            </div>
          );
        })}
        {filteredLeads.length === 0 && (
          <div className="col-span-1 xl:col-span-2 text-center py-12 text-gray-500 border border-dashed border-[#33a8d9]/30 rounded-[18px]">
            No leads found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
