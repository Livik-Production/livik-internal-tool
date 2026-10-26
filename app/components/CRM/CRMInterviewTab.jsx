import React, { useState, useEffect } from 'react';
import CustomTable from '../CustomTable';
import Pagination from '../Pagination';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';
import CustomModalForm from '../CustomModalForm';
import Button from '../Buttons/Button';
import Loader from '../Loader';
import CustomAlertForm from '../CustomAlertForm';
import { Search, Plus, Eye, SquarePen, Trash, Loader2, CheckCircle2, Circle, XCircle, X } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../Toast';
import FilterDropdown from '../Buttons/FilterDropdown';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../store/slices/authSlice';

export default function CRMInterviewTab({ interviewsList, refreshInterviews, isLoading }) {
  const authUser = useSelector(selectAuthUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [resultFilter, setResultFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState(null); // this will hold the group array
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Grouped Rounds State
  const [activeGroup, setActiveGroup] = useState([]);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [interviewers, setInterviewers] = useState([{ name: '', email: '' }]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobDescription: '',
    candidateName: '',
    date: '',
    time: '',
    interviewersName: '',
    interviewersEmail: '',
    companyName: '',
    result: 'Pending',
    organizerName: '',
    organizerPhone: '',
    organizerEmail: '',
    feedback: '',
    notes: ''
  });


  const populateFormForRound = (interview) => {
    setFormData(interview);
    const names = interview.interviewersName ? interview.interviewersName.split(',').map(s => s.trim()) : [];
    const emails = interview.interviewersEmail ? interview.interviewersEmail.split(',').map(s => s.trim()) : [];
    const parsedInterviewers = [];
    const maxLen = Math.max(names.length, emails.length);
    for(let i=0; i<maxLen; i++) {
      parsedInterviewers.push({ name: names[i] || '', email: emails[i] || '' });
    }
    if (parsedInterviewers.length === 0) parsedInterviewers.push({ name: '', email: '' });
    setInterviewers(parsedInterviewers);
  };

  const handleOpenModal = (mode = 'add', group = null) => {
    setModalMode(mode);
    if (group) {
      setActiveGroup(group);
      const latestIndex = group.length - 1;
      setActiveRoundIndex(latestIndex);
      populateFormForRound(group[latestIndex]);
    } else {
      setActiveGroup([]);
      setActiveRoundIndex(0);
      setFormData({
        title: '',
        description: '',
        jobDescription: '',
        candidateName: '',
        date: '',
        time: '',
        interviewersName: '',
        interviewersEmail: '',
        companyName: '',
        result: 'Pending',
        organizerName: '',
        organizerPhone: '',
        organizerEmail: '',
        feedback: '',
        notes: ''
      });
      setInterviewers([{ name: '', email: '' }]);
    }
    setShowModal(true);
  };
  
  const handleNextRoundClick = () => {
    const prevRound = activeGroup[activeGroup.length - 1];
    
    // Determine the base interview ID and next round number
    const baseId = prevRound.interviewId ? prevRound.interviewId.split('-R')[0] : '';
    const nextRoundNum = activeGroup.length + 1;
    const newInterviewId = baseId ? `${baseId}-R${nextRoundNum}` : '';

    const newRound = {
      title: prevRound.title || '',
      jobDescription: prevRound.jobDescription || '',
      candidateName: prevRound.candidateName || '',
      companyName: prevRound.companyName || '',
      description: '', // Interview Questions cleared
      date: '',
      time: '',
      interviewersName: '',
      interviewersEmail: '',
      result: 'Pending',
      organizerName: '', // Cleared
      organizerPhone: '',
      organizerEmail: '',
      feedback: '',
      notes: '',
      interviewId: newInterviewId
    };
    const newGroup = [...activeGroup, newRound];
    setActiveGroup(newGroup);
    setActiveRoundIndex(newGroup.length - 1);
    populateFormForRound(newRound);
  };

  const handleTabClick = (index) => {
    setActiveRoundIndex(index);
    populateFormForRound(activeGroup[index]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    let success = false;
    
    const payload = { ...formData, type: 'interview' };
    payload.interviewersName = interviewers.map(i => i.name).filter(Boolean).join(', ');
    payload.interviewersEmail = interviewers.map(i => i.email).filter(Boolean).join(', ');

    const currentRound = activeGroup[activeRoundIndex];
    const isNewRecord = !currentRound || !currentRound.id;

    try {
      if (isNewRecord || modalMode === 'add') {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showSuccessToast('Interview created successfully!');
          success = true;
        } else {
          showErrorToast('Failed to create interview.');
        }
      } else {
        // Edit existing round
        const res = await fetch(`/api/crm/${currentRound.id}?type=interview`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showSuccessToast('Interview updated successfully!');
          success = true;
        } else {
          showErrorToast('Failed to update interview.');
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
      showErrorToast('An error occurred while saving.');
    } finally {
      setIsSaving(false);
      setShowModal(false);
    }
    
    if (success) {
      setIsRefreshing(true);
      await refreshInterviews();
      setIsRefreshing(false);
    }
  };

  const handleDeleteClick = (group) => {
    setInterviewToDelete(group);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (interviewToDelete) {
      setIsDeleting(true);
      let success = false;
      try {
        // Delete all rounds in the group
        for (const round of interviewToDelete) {
           if (round.id) {
             await fetch(`/api/crm/${round.id}?type=interview`, { method: 'DELETE' });
           }
        }
        showSuccessToast('Interview group deleted successfully!');
        success = true;
      } catch (err) {
        console.error('Delete failed:', err);
        showErrorToast('An error occurred while deleting.');
      } finally {
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        setInterviewToDelete(null);
      }
      
      if (success) {
        setIsRefreshing(true);
        await refreshInterviews();
        setIsRefreshing(false);
      }
    }
  };

  const filteredGroups = interviewsList.filter(group => {
    const latest = group[group.length - 1];
    const matchesSearch = (latest.title || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                          (latest.jobDescription || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                          (latest.candidateName || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesResult = resultFilter === 'All' || latest.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, resultFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedGroups = filteredGroups.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const columns = [
    { key: 'title', label: 'Interview Title', render: (group) => (
      <span 
        className="font-bold text-[#004475] hover:underline cursor-pointer"
        onClick={() => handleOpenModal('view', group)}
      >
        {group[group.length - 1].title || 'N/A'}
      </span>
    )
    },
     { key: 'jobDescription', label: 'Job Description', render: (group) => group[group.length - 1].jobDescription || 'N/A' },
    { key: 'candidateName', label: 'Candidate', render: (group) => group[group.length - 1].candidateName },
    { key: 'companyName', label: 'Company', render: (group) => group[group.length - 1].companyName },
    { key: 'round', label: 'Rounds', render: (group) => `${group.length}` },
    { key: 'dateTime', label: 'Date & Time', render: (group) => {
        const latest = group[group.length - 1];
        return `${latest.date ? new Date(latest.date).toLocaleDateString() : ''} ${latest.time || ''}`;
    }},
    { key: 'result', label: 'Result', render: (group) => {
      const latest = group[group.length - 1];
      return (
        <span className={`px-1 py-1 rounded text-xs font-bold ${latest.result === 'Passed' ? 'bg-green-100 text-green-700' : latest.result === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {latest.result}
        </span>
      );
    }}
  ];

  const renderTabs = () => {
    if (activeGroup.length <= 1 && modalMode === 'add') return null;
    return (
      <div className="flex items-center gap-1.5 mb-4 bg-slate-100 p-1.5 rounded-xl overflow-x-auto">
        {activeGroup.map((round, index) => {
          const isActive = activeRoundIndex === index;
          const isPassed = round.result === 'Passed';
          const isFailed = round.result === 'Failed';
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleTabClick(index)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-white shadow-sm text-[#004475]' 
                  : 'text-gray-500 hover:bg-gray-200/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold border ${
                isActive ? 'border-[#004475] bg-blue-50/50' : 'border-gray-400'
              }`}>
                {index + 1}
              </div>
              <span>Round</span>
              {isPassed ? (
                <CheckCircle2 size={14} className="text-green-600" />
              ) : isFailed ? (
                <XCircle size={14} className="text-red-500" />
              ) : (
                <Circle size={12} className="text-yellow-500" fill="currentColor" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5 [animation-delay:100ms] animate-dashboard-reveal text-left">
      <div className="flex flex-col gap-3 px-1">
        {/* Main Column */}
        <div className="space-y-5 min-w-0">
          {/* Top Bar matching CRMLeadsTab */}
          <div>
            <div className="flex flex-col md:flex-row items-center gap-3 justify-end">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search interview title, job description, candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm pr-10 py-2 border border-gray-300 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                />
                {searchQuery && (
                  <div className="absolute right-1 top-0.5">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <FilterDropdown
                  options={[
                    { label: 'All Results', value: 'All' },
                    { label: 'Pending', value: 'Pending' },
                    { label: 'Passed', value: 'Passed' },
                    { label: 'Failed', value: 'Failed' },
                  ]}
                  value={resultFilter}
                  onChange={setResultFilter}
                  className="w-full md:w-40 z-50"
                />

                <PrimaryButton onClick={() => handleOpenModal('add')}>
                  <Plus className="h-4 w-4 mr-1 leading-none" />
                  Add Interview
                </PrimaryButton>
              </div>
            </div>
          </div>

          {/* Interviews Table matching CRMLeadsTab */}
          <div className="bg-white border border-gray-100 rounded-[18px] shadow-sm overflow-hidden">
            {(isLoading || isRefreshing) ? (
              <div className="flex flex-col items-center justify-center py-24 my-auto">
                <Loader label="Loading Interviews..." />
              </div>
            ) : (
              <>
                <CustomTable
                  columns={columns}
                  data={paginatedGroups}
                  rowKey="id"
                  actions={(group) => (
                    <div className="flex items-center justify-end gap-2">
                      <IconButton
                        title="Edit"
                        className="text-[#004475] hover:text-[#33a8d9]"
                        onClick={() => handleOpenModal('edit', group)}
                      >
                        <SquarePen size={16} />
                      </IconButton>
                      <IconButton
                        title="Delete"
                        className="text-[#004475] hover:text-red-700"
                        onClick={() => handleDeleteClick(group)}
                      >
                        <Trash size={16} />
                      </IconButton>
                    </div>
                  )}
                  actionsHeader="Actions"
                  actionsAlign="center"
                  headerAlignment={{
                    title: 'center',
                    jobDescription: 'center',
                    candidateName: 'center',
                    companyName: 'center',
                    round: 'center',
                    dateTime: 'center',
                    result: 'center',
                  }}
                  cellAlignment={{
                    title: 'center',
                    jobDescription: 'center',
                    candidateName: 'center',
                    companyName: 'center',
                    round: 'center',
                    dateTime: 'center',
                    result: 'center',
                  }}
                  rowClassName={() => 'group hover:bg-[#f8fafc] transition-colors h-14'}
                />

                {/* Pagination Footer */}
                <div>
                  <Pagination
                    currentPage={safePage}
                    totalItems={filteredGroups.length}
                    itemsPerPage={pageSize}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setPageSize}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <CustomModalForm
        open={showModal}
        onCancel={() => setShowModal(false)}
        title={modalMode === 'add' ? 'Add Interview' : modalMode === 'edit' ? 'Edit Interview' : 'View Interview'}
        widthClass="max-w-3xl"
      >
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4 bg-white text-left">
            {renderTabs()}
            <fieldset disabled={modalMode === 'view'} className="contents">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-[13px] text-gray-500 font-semibold block mb-1">Opportunity Title<span className="text-red-500 ml-1">*</span></label>
                <input required type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
              </div>
              <div>
                <label className="text-[13px] text-gray-500 font-semibold block mb-1">Job Description<span className="text-red-500 ml-1">*</span></label>
                <input required type="text" value={formData.jobDescription || ''} onChange={e => setFormData({...formData, jobDescription: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
              </div>
              <div>
                <label className="text-[13px] text-gray-500 font-semibold block mb-1">Company Name</label>
                <input type="text" value={formData.companyName || ''} onChange={e => setFormData({...formData, companyName: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
              </div>
              <div>
                <label className="text-[13px] text-gray-500 font-semibold block mb-1">Candidate Name <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.candidateName || ''} onChange={e => setFormData({...formData, candidateName: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
              </div>
              <div>
                <label className="text-[13px] text-gray-500 font-semibold block mb-1">Organizer Name</label>
                <input type="text" value={formData.organizerName || ''} onChange={e => setFormData({...formData, organizerName: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
              </div>
              
              <div>
                <label className="text-[13px] text-gray-500 font-semibold block mb-1">Date</label>
                <input type="date" value={formData.date ? String(formData.date).slice(0, 10) : ''} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
              </div>
              <div>
                <label className="text-[13px] text-gray-500 font-semibold block mb-1">Time</label>
                <input type="time" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
              </div>
              <div>
                <label className="text-[13px] text-gray-500 font-semibold block mb-1">Interview Result</label>
                <select 
                  value={formData.result || 'Pending'} 
                  onChange={e => setFormData({...formData, result: e.target.value})} 
                  disabled={activeGroup.length > 0 && activeRoundIndex !== activeGroup.length - 1}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Dynamic Interviewers Section */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[13px] text-gray-500 font-semibold block">Interviewers</label>
                  {modalMode !== 'view' && (
                    <button 
                      type="button" 
                      onClick={() => setInterviewers([...interviewers, { name: '', email: '' }])}
                      className="text-[#004475] flex items-center text-xs font-semibold"
                    >
                      <Plus size={14} className="mr-1" /> Add Interviewer
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {interviewers.map((inv, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-[12px] text-gray-500 block mb-1">Name</label>
                        <input 
                          type="text" 
                          value={inv.name} 
                          onChange={e => {
                            const newArr = [...interviewers];
                            newArr[index].name = e.target.value;
                            setInterviewers(newArr);
                          }} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium" 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[12px] text-gray-500 block mb-1">Email</label>
                        <input 
                          type="email" 
                          value={inv.email} 
                          onChange={e => {
                            const newArr = [...interviewers];
                            newArr[index].email = e.target.value;
                            setInterviewers(newArr);
                          }} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium" 
                        />
                      </div>
                      {modalMode !== 'view' && interviewers.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const newArr = interviewers.filter((_, i) => i !== index);
                            setInterviewers(newArr);
                          }}
                          className="mb-1 p-2 text-[#004475] hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            
              <div className="md:col-span-2">
                  <label className="text-[13px] text-gray-500 font-semibold block mb-1">Interview Feedback</label>
                  <textarea rows={3} value={formData.feedback || ''} onChange={e => setFormData({...formData, feedback: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
              </div>
               <div className="md:col-span-2">
                  <label className="text-[13px] text-gray-500 font-semibold block mb-1">Notes</label>
                  <textarea rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
                </div>
            </div>
            
            <div className="w-full">
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">Interview Questions</label>
              <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium" />
            </div>
          
            </fieldset>

          <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200 mt-2">
            <div>
              {modalMode !== 'add' && activeGroup.length > 0 && activeRoundIndex === activeGroup.length - 1 && (
                <Button 
                  type="button" 
                  disabled={activeGroup[activeRoundIndex].result === 'Pending' || activeGroup[activeRoundIndex].result === 'Failed'}
                  onClick={handleNextRoundClick} 
                  className="px-5 py-2 bg-[#004475] text-white font-bold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} className="inline mr-1" /> Next Round
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 border border-gray-800 hover:bg-slate-50 text-slate-705 font-bold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                Close
              </Button>
              {modalMode === 'view' && (
                <PrimaryButton type="button" onClick={() => setModalMode('edit')}>
                  Edit
                </PrimaryButton>
              )}
              {modalMode !== 'view' && (
                <PrimaryButton type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="animate-spin mr-2 inline" size={16} />}
                  {isSaving ? 'Saving...' : 'Save'}
                </PrimaryButton>
              )}
            </div>
          </div>
        </form>
      </CustomModalForm>

      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Interview Group"
        message="Are you sure you want to delete all rounds for this candidate? This action cannot be undone."
        type="danger"
        confirmText="Delete All Rounds"
        cancelText="Cancel"
        isSubmitting={isDeleting}
        details={
          interviewToDelete && interviewToDelete.length > 0 && (
            <div className="text-sm">
              <p className="font-bold">{interviewToDelete[0].title}</p>
              {interviewToDelete[0].candidateName && <p className="text-gray-500">Candidate: {interviewToDelete[0].candidateName}</p>}
              <p className="text-gray-500 mt-1">Rounds to delete: {interviewToDelete.length}</p>
            </div>
          )
        }
      />
    </div>
  );
}
