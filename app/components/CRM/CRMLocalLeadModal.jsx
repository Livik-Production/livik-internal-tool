import React, { useState, useEffect } from 'react';
import CustomModalForm from '../CustomModalForm';
import Button from '../Buttons/Button';
import PrimaryButton from '../Buttons/PrimaryButton';
import CloseButton from '../Buttons/CloseButton';
import { History, Calendar, Clock, SquarePen, Trash2, Loader2, Plus, X } from 'lucide-react';

export default function CRMLocalLeadModal(props) {
  const {
    showModal,
    setShowModal,
    modalMode, // 'add' | 'edit' | 'view'
    setModalMode,
    handleSave,
    formData,
    setFormData,
    isSubmitting,
    employeesList = [],
    authUser,
  } = props;

  const [showFollowUp, setShowFollowUp] = useState(false);
  const [editingFollowUpIndex, setEditingFollowUpIndex] = useState(-1);
  const [currentFollowUp, setCurrentFollowUp] = useState({ date: '', time: '', notes: '' });

  const handleSaveFollowUp = () => {
    if (!currentFollowUp.date) return;
    const currentList = Array.isArray(formData.followUps) ? formData.followUps : [];
    if (editingFollowUpIndex >= 0) {
      const updated = [...currentList];
      updated[editingFollowUpIndex] = currentFollowUp;
      setFormData({ ...formData, followUps: updated });
    } else {
      setFormData({ ...formData, followUps: [...currentList, currentFollowUp] });
    }
    setCurrentFollowUp({ date: '', time: '', notes: '' });
    setEditingFollowUpIndex(-1);
    setShowFollowUp(false);
  };

  const handleEditFollowUp = (index) => {
    const list = formData.followUps || [];
    setCurrentFollowUp(list[index] || { date: '', time: '', notes: '' });
    setEditingFollowUpIndex(index);
    setShowFollowUp(true);
  };

  const handleDeleteFollowUp = (index) => {
    const list = formData.followUps || [];
    const updated = list.filter((_, i) => i !== index);
    setFormData({ ...formData, followUps: updated });
    if (editingFollowUpIndex === index) {
      setEditingFollowUpIndex(-1);
      setCurrentFollowUp({ date: '', time: '', notes: '' });
      setShowFollowUp(false);
    }
  };

  useEffect(() => {
    if (!showModal) {
      setShowFollowUp(false);
      setEditingFollowUpIndex(-1);
      setCurrentFollowUp({ date: '', time: '', notes: '' });
    }
  }, [showModal]);

  const title =
    modalMode === 'view'
      ? 'Local Lead Details'
      : modalMode === 'edit'
      ? 'Edit Local Lead Details'
      : 'Add Local Lead Details';

  return (
    <CustomModalForm
      open={showModal}
      onCancel={() => setShowModal(false)}
      title={title}
      widthClass="max-w-5xl"
    >
      <form onSubmit={handleSave} id="local-lead-form" className="p-6 flex flex-col gap-6 bg-white text-left">
        <fieldset disabled={modalMode === 'view'} className="contents">
          {/* Main Grid: matching CRMLeadModal layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {/* Lead Name * */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Lead Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.leadName || ''}
                onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>

            {/* Phone Number * */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                pattern="\d{10}"
                title="Mobile number must be exactly 10 digits"
                value={formData.phoneNumber || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, phoneNumber: val });
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>

            {/* WhatsApp Number (no icon) */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.whatsapp || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, whatsapp: val });
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>

            {/* LinkedIn URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[13px] text-gray-500 font-semibold block">
                  LinkedIn URL
                </label>
                {modalMode === 'view' && formData.linkedinUrl && (
                  <a
                    href={formData.linkedinUrl.startsWith('http') ? formData.linkedinUrl : `https://${formData.linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center hover:bg-blue-100 transition-colors"
                  >
                    View LinkedIn <span className="ml-1">→</span>
                  </a>
                )}
              </div>
              <input
                type="text"
                value={formData.linkedinUrl || ''}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                disabled={modalMode === 'view'}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>

            {/* Source (only text input, not select) */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Source
              </label>
              <input
                type="text"
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>

            {/* Visibility (Everyone / Show for me) */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Visibility
              </label>
              <select
                value={formData.visibility || 'Everyone'}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              >
                <option value="Everyone">Show for everyone</option>
                <option value="Show for me">Show for me</option>
              </select>
            </div>

            {/* Keywords */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Keywords
              </label>
              <input
                type="text"
                value={formData.keywords || ''}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>

            {/* Lead Owner * */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Lead Owner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.leadOwner || ''}
                onChange={(e) => setFormData({ ...formData, leadOwner: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>

            {/* Date * */}
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date ? formData.date.slice(0, 10) : ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 transition-all font-medium"
              />
            </div>
          </div>

          {/* Notes Section: matching CRMLeadModal layout */}
          <div>
            <label className="text-[13px] text-gray-500 font-semibold block mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={modalMode === 'view'}
              className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-805 p-3 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
            />
          </div>

          {/* Timeline History Section */}
          {modalMode && modalMode !== 'add' && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                Timeline History ({formData.followUps ? formData.followUps.length : 0})
              </h4>

              <div className="space-y-4 max-h-[152px] overflow-y-auto pr-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 custom-scrollbar">
                {!formData.followUps || formData.followUps.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="text-gray-400 mb-2 flex justify-center animate-bounce">
                      <History size={40} opacity={0.3} />
                    </div>
                    <p className="text-sm text-gray-500 font-bold">
                      No follow-ups recorded yet.
                    </p>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight font-medium">
                      Be the first to log a client interaction.
                    </p>
                  </div>
                ) : (
                  formData.followUps.map((log, index) => (
                    <div
                      key={index}
                      className="relative pl-12 animate-in fade-in slide-in-from-left-4 duration-500"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute left-0 top-1.5 w-7 h-7 bg-white border-2 border-blue-500 rounded-full z-10 flex items-center justify-center shadow-sm">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                      </div>

                      <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden flex items-center">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <div className="flex justify-between items-center w-full pl-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1 border border-blue-100 shadow-xs whitespace-nowrap flex-shrink-0">
                              <Calendar size={10} />{' '}
                              {log.date ? new Date(log.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }) : 'N/A'}
                            </span>
                            {log.time && (
                              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1 border border-gray-100 shadow-xs whitespace-nowrap flex-shrink-0">
                                <Clock size={10} /> {log.time}
                              </span>
                            )}
                            <p
                              className="text-sm text-gray-700 font-semibold truncate"
                              title={log.notes}
                            >
                              {log.notes || 'N/A'}
                            </p>
                          </div>
                          {modalMode !== 'view' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditFollowUp(index)}
                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all scale-95"
                                title="Edit log"
                              >
                                <SquarePen size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFollowUp(index)}
                                className="p-1.5 hover:bg-red-50 scale-95 text-red-500"
                                title="Delete log"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Next Follow Up Drawer */}
          {showFollowUp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#004475]">
                    <Calendar size={18} />
                    <h3 className="text-sm font-bold">
                      {editingFollowUpIndex >= 0 ? 'Edit Follow Up' : 'Schedule Next Follow Up'}
                    </h3>
                  </div>
                  <CloseButton
                    onClick={() => {
                      setShowFollowUp(false);
                      setEditingFollowUpIndex(-1);
                      setCurrentFollowUp({ date: '', time: '', notes: '' });
                    }}
                  />
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={currentFollowUp.date ? currentFollowUp.date.slice(0, 10) : ''}
                      onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, date: e.target.value })}
                      className="w-48 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors cursor-pointer font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                      Note
                    </label>
                    <textarea
                      rows={3}
                      value={currentFollowUp.notes || ''}
                      onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, notes: e.target.value })}
                      placeholder="Follow up note..."
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-805 p-3 rounded-lg transition-colors placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3.5 flex justify-end gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFollowUp(false);
                      setEditingFollowUpIndex(-1);
                      setCurrentFollowUp({ date: '', time: '', notes: '' });
                    }}
                    className="px-5 py-2 border border-gray-800 hover:bg-slate-100 text-slate-705 font-bold text-sm rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFollowUp}
                    disabled={!currentFollowUp.date}
                    className="px-5 py-2 bg-[#004475] text-white font-bold text-sm rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {editingFollowUpIndex >= 0 ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </fieldset>

        {/* Modal Footer: Three Buttons matching CRMLeadModal */}
        <div className="flex  sm:flex-row sm:items-center justify-end gap-4 pt-2 border-t border-slate-200">


          <div className="flex justify-end gap-3 shrink-0">
            {/* Button 1: Next Follow Up */}
            {modalMode !== 'view' && (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowFollowUp(!showFollowUp)}
                className="px-5 py-2 bg-[#004475] text-white border-transparent font-bold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Next Follow Up
              </Button>
            )}

            {/* Button 2: Cancel / Close */}
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowModal(false)}
              className="px-5 py-2 border border-gray-800 hover:bg-slate-50 text-slate-705 font-bold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {modalMode === 'view' ? 'Close' : 'Cancel'}
            </Button>

            {modalMode === 'view' && setModalMode && (
              <PrimaryButton
                type="button"
                onClick={() => setModalMode('edit')}
              >
                Edit
              </PrimaryButton>
            )}

            {/* Button 3: Save / Update Lead */}
            {modalMode !== 'view' && (
              <PrimaryButton
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 inline" size={16} />
                    <span>{modalMode === 'edit' ? 'Updating...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>{modalMode === 'edit' ? 'Update Lead' : 'Save Lead'}</span>
                  </>
                )}
              </PrimaryButton>
            )}
          </div>
        </div>
      </form>
    </CustomModalForm>
  );
}
