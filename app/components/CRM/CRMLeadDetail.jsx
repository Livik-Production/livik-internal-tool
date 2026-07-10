import React from 'react';
import {
  Search, Plus, Users, CheckCircle, Handshake, TrendingUp, TrendingDown,
  CalendarCheck, Mail, Phone, XCircle, ArrowRight, Sparkles, DollarSign,
  ChevronDown, AlertCircle, SquarePen, Trash, X, ArrowUpDown, Building2,
  User, LogOut, MapPin, Globe, UsersRound
} from 'lucide-react';
import NotificationBell from '../NotificationBell';

import TabButton from '../Buttons/TabButton';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';

export default function CRMLeadDetail({
  selectedLeadDetail,
  setSelectedLeadDetail,
  canControlCrm,
  setFormMoveStatus,
  setShowMoveCustomerModal,
  detailTab,
  setDetailTab,
  formatTime24Hours,
  formatTimeAMPM,
  activitySearchTerm,
  setActivitySearchTerm,
  activitySortOrder,
  setActivitySortOrder,
  handleLogNewActivityLeadClick,
  leadActivities,
  handleViewLeadClick,
  handleEditActivityClick,
  handleDeleteActivity,
  handleEditLeadClick,
  handleDeleteLead
}) {
  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto  animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white rounded-2xl shadow-sm p-3 m-0.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
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
          <NotificationBell />
        </div>
      </div>

      {/* Header Actions Row */}
      <div className="flex items-center justify-between mb-6 w-50">
        <button
          onClick={() => setSelectedLeadDetail(null)}
          className="flex items-center gap-2 text-slate-800 hover:text-slate-950 font-bold text-lg cursor-pointer transition-colors group"
        >
          <svg className="w-5 h-5 ml-2 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Lead Detail</span>
        </button>
       
      </div>

      {/* Core Content Grid */}
      <div className="space-y-6 w-full p-1">
        
        {/* Top Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col gap-4">
            
            {/* Top Section - Company Info & Move Button */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center text-green-700 shrink-0">
                  <Building2 className="w-8 h-8" />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedLeadDetail.company}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {/* <span className="w-1 h-1 bg-gray-400 rounded-full mx-1"></span> */}
                      <span>{selectedLeadDetail.companyEmail || 'No Company Email'}</span>
                   
                  
                    {selectedLeadDetail.companyWebsite ? (
                      <a href={selectedLeadDetail.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedLeadDetail.companyWebsite}
                      </a>
                    ) : (
                      <span>No Website</span>
                      )}
                         <span className="font-medium text-gray-600">
                           Lead ID: {selectedLeadDetail.leadId}
                           <span className="font-normal text-gray-400 ml-1">
                             (Last Contact: {selectedLeadDetail.date ? `${new Date(selectedLeadDetail.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} at ${formatTime24Hours(selectedLeadDetail.time) || ''}`.trim() : 'N/A'})
                           </span>
                         </span>
                  
                  </div>
                </div>
              </div>

                {/* Right Section - Move Customer & Interaction Buttons */}
              <div className="flex flex-col items-end gap-3 shrink-0 mt-4 lg:mt-0">
                {canControlCrm && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormMoveStatus(selectedLeadDetail.status || 'Won');
                      setShowMoveCustomerModal(true);
                    }}
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-all shadow-sm whitespace-nowrap h-fit"
                  >
                    <LogOut className="w-4 h-4" />
                    Move Customer
                  </button>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2 ">
                  <button className="bg-white hover:bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                    <Phone className="w-3.5 h-3.5 text-[#004475]" />
                    {/* <span className="text-xs font-semibold text-[#004475]">Call</span> */}
                  </button>
                  <button className="bg-white hover:bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                    <Mail className="w-3.5 h-3.5 text-[#004475]" />
                    {/* <span className="text-xs font-semibold text-[#004475]">Email</span> */}
                  </button>
                  <button className="bg-white hover:bg-green-50 border border-green-200 px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {/* <span className="text-xs font-semibold text-green-600">WhatsApp</span> */}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Switcher Details Sub-Tabs */}
        <div className="flex shrink-0 flex-col md:flex-row md:items-center gap-4 border-b border-gray-300 w-full mb-6">
          <div className="flex items-center overflow-x-auto gap-1.5">
            {['Log Activity', 'Company Details'].map((tab) => (
              <TabButton
                key={tab}
                isActive={detailTab === tab}
                onClick={() => setDetailTab(tab)}
              >
                {tab}
              </TabButton>
            ))}
          </div>
        </div>

        {/* Left-Right Info Grid */}
        {detailTab === 'Company Details' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Profile Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#33a8d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Company Profile
                </h3>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Company Name</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {selectedLeadDetail.company}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Company Address</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {selectedLeadDetail.companyAddress || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Company Email</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {selectedLeadDetail.companyEmail || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Website URL</span>
                  {selectedLeadDetail.companyWebsite ? (
                    <a
                      href={selectedLeadDetail.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-blue-600 hover:underline mt-1 block w-max"
                    >
                      {selectedLeadDetail.companyWebsite}
                    </a>
                  ) : (
                    <span className="text-sm font-bold text-slate-800 mt-1 block">N/A</span>
                  )}
                </div>
              </div>

              {/* Lead Acquisition & Metadata Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#33a8d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Lead Acquisition
                </h3>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Source</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {selectedLeadDetail.source || 'Referral'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Industry</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {selectedLeadDetail.industry || 'SaaS & Technology'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Annual Revenue</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {selectedLeadDetail.annualRevenue || '$10M - $25M'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Lead Date & Time</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {selectedLeadDetail.date ? (
                      `${new Date(selectedLeadDetail.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} at ${formatTimeAMPM(selectedLeadDetail.time) || '10:00 AM'}`
                    ) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Assigned representative details Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#33a8d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Assigned Personnel Details
                </h3>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Category</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block capitalize">
                    {selectedLeadDetail.employeeType || 'Employee'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Representative Profile</span>
                  {selectedLeadDetail.employeeDetailsText ? (
                    <pre className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3.5 rounded-xl whitespace-pre-wrap mt-1 shadow-inner leading-relaxed">
                      {selectedLeadDetail.employeeDetailsText}
                    </pre>
                  ) : (
                    <span className="text-sm font-bold text-slate-800 mt-1 block">
                      Name: {selectedLeadDetail.assignedTo || 'Jane Smith'} (Default Assigned Representative)
                    </span>
                  )}
                </div>
              </div>

              {/* Notes & Activity Details Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 md:col-span-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#33a8d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Activity Details
                </h3>
                <p className="text-sm font-semibold text-slate-750 whitespace-pre-wrap leading-relaxed">
                  {selectedLeadDetail.notes || 'No initial setup notes logged for this lead.'}
                </p>
              </div>

            </div>

            {/* Bottom Analytics Card with circular score gauge */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-6">
              {/* Gauge */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg width="100%" height="100%" viewBox="0 0 40 40" className="-rotate-90">
                  <circle cx="20" cy="20" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="transparent"
                    stroke="#004475"
                    strokeWidth="4"
                    strokeDasharray="100.53"
                    strokeDashoffset={100.53 - (100.53 * (selectedLeadDetail.leadScore || 82)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-sm font-black text-slate-850">
                  {selectedLeadDetail.leadScore || 82}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Lead Score Analytics
                </h4>
                <p className="text-sm font-semibold text-slate-700 leading-snug mt-1.5">
                  High purchase intent detected. Engagement rate is 14% above average for this sector.
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[9px] font-black uppercase bg-slate-50 text-slate-650 px-2 py-0.5 rounded border border-slate-100">
                    High Frequency
                  </span>
                  <span className="text-[9px] font-black uppercase bg-slate-50 text-slate-650 px-2 py-0.5 rounded border border-slate-100">
                    Key Stakeholder
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailTab === 'Log Activity' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Log Activity Section Header & Controls */}
            <div>
              <div className="flex flex-col md:flex-row justify-end items-end  mb-4 gap-4">
               
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Search activities..."
                      value={activitySearchTerm}
                      onChange={(e) => setActivitySearchTerm(e.target.value)}
                      className="pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#33a8d9]/20 focus:border-[#33a8d9] outline-none transition-all w-64 h-[42px] bg-gray-50/50 hover:bg-white font-medium"
                    />
                    {activitySearchTerm && (
                      <div className="absolute right-2 top-1.5">
                        <IconButton
                          onClick={() => setActivitySearchTerm('')}
                          title="Clear search"
                          className="p-1"
                        >
                          <X size={15} />
                        </IconButton>
                      </div>
                    )}
                  </div>

                  {/* Sort Button */}
                  <PrimaryButton
                    onClick={() => setActivitySortOrder(activitySortOrder === 'newest' ? 'oldest' : 'newest')}
                    className="h-[42px]"
                  >
                    <ArrowUpDown size={16} /> Date: {activitySortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  </PrimaryButton>

                  {/* Log Activity Button */}
                  {canControlCrm && (
                    <PrimaryButton onClick={handleLogNewActivityLeadClick} className="h-[42px]">
                      <Plus size={16} /> Log Activity
                    </PrimaryButton>
                  )}

                  
                </div>
              </div>

              {/* Custom Activity Log Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-300 mt-2 max-h-[45vh]">
                  <table className="min-w-full divide-y divide-gray-200 table-auto">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap text-left w-[100px]">
                          ID
                        </th>
                        <th scope="col" className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap text-center w-[120px]">
                          Date
                        </th>
                        <th scope="col" className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap text-center w-[80px]">
                          Time
                        </th>
                       
                        <th scope="col" className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap text-center min-w-[200px]">
                          POC Details
                        </th>
                        <th scope="col" className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap text-center min-w-[200px]">
                          Representative Assignment
                        </th>
                        <th scope="col" className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap text-center min-w-[150px]">
                          Reminder
                        </th>
                         <th scope="col" className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap text-center min-w-[200px]">
                          Activity Details
                        </th>
                        <th scope="col" className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap text-right w-[100px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leadActivities.length > 0 ? (
                        leadActivities.map((row) => (
                          <tr key={row.id} className="transition-colors select-none hover:bg-gray-50">
                            <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap text-left font-mono font-bold">
                              <button
                                onClick={() => handleViewLeadClick(selectedLeadDetail)}
                                className="text-blue-600 hover:underline hover:text-blue-800 font-bold text-left cursor-pointer transition-colors"
                                title="View Lead Details Form"
                              >
                                {String(row.id).slice(-5)}
                              </button>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap text-center font-semibold">
                              {row.date}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap text-center font-medium">
                              {formatTime24Hours(row.time)}
                            </td>
                           
                            <td className="px-5 py-4 text-sm text-gray-700 whitespace-normal break-words text-center max-w-xs">
                              <span className="font-bold text-gray-900 block">{row.pocName}</span>
                              <span className="text-xs text-gray-500 block mt-0.5">Dept: {row.pocDept || 'N/A'}</span>
                               </td>
                            <td className="px-5 py-4 text-sm text-gray-700 whitespace-normal break-words text-center max-w-xs">
                              <span className="font-bold text-gray-900 block">{row.repName}</span>
                              <span className="text-xs text-gray-500 block">Role: {row.repRole || 'N/A'}</span>
                         
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700 whitespace-normal break-words text-center max-w-xs">
                              <span className="font-bold text-gray-900 block">{row.reminderName || 'N/A'}</span>
                              <span className="text-xs text-gray-500 block">Date: {row.reminderDate || 'N/A'}</span>
                            </td>
                             <td className="px-5 py-4 text-sm text-gray-700 whitespace-normal break-words text-center max-w-md">
                              {row.data}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap text-right">
                              {!row.isInitial ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  {canControlCrm && (
                                    <>
                                      <IconButton
                                        onClick={() => handleEditActivityClick(row)}
                                        title="Edit Activity"
                                        className="hover:bg-blue-50 hover:text-blue-600 transition-colors p-1.5 rounded-lg"
                                      >
                                        <SquarePen size={14} />
                                      </IconButton>
                                      <IconButton
                                        onClick={() => handleDeleteActivity(row)}
                                        title="Delete Activity"
                                        className="hover:bg-red-50 hover:text-red-600 transition-colors p-1.5 rounded-lg"
                                      >
                                        <Trash size={14} />
                                      </IconButton>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  {canControlCrm && (
                                    <>
                                      <IconButton
                                        onClick={() => handleEditLeadClick(selectedLeadDetail)}
                                        title="Edit Lead Details"
                                        className="hover:bg-blue-50 hover:text-blue-600 transition-colors p-1.5 rounded-lg"
                                      >
                                        <SquarePen size={14} />
                                      </IconButton>
                                      <IconButton
                                        onClick={() => handleDeleteLead(selectedLeadDetail.id)}
                                        title="Delete Lead"
                                        className="hover:bg-red-50 hover:text-red-600 transition-colors p-1.5 rounded-lg"
                                      >
                                        <Trash size={14} />
                                      </IconButton>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-gray-500 font-semibold bg-white rounded-b-xl">
                            No activities logged for this lead yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
