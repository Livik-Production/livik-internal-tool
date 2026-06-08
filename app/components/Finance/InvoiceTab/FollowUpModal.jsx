'use client';

import React, { useState } from 'react';
import CustomModalForm from '../../CustomModalForm';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import {
  Calendar,
  Clock,
  MessageSquare,
  History,
  Plus,
  Trash2,
  SquarePen,
} from 'lucide-react';

export default function FollowUpModal({
  open,
  onClose,
  invoice,
  followUps = [],
  onAddFollowUp,
  onDeleteFollowUp,
  onEditFollowUp,
  mode = 'full', // 'history' | 'entry' | 'full'
}) {
  const [editingLogId, setEditingLogId] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newEntry.notes.trim()) return;

    if (editingLogId) {
      onEditFollowUp(invoice.id, editingLogId, {
        ...newEntry,
      });
      setEditingLogId(null);
    } else {
      onAddFollowUp(invoice.id, {
        ...newEntry,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      });
    }

    if (mode === 'entry' && !editingLogId) {
      onClose();
    }

    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      notes: '',
    });
  };

  const handleEditClick = (log) => {
    setEditingLogId(log.id);
    setNewEntry({
      date: log.date,
      time: log.time,
      notes: log.notes,
    });
    // Scroll to top of modal to see form if needed
    const formElement = document.getElementById('follow-up-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingLogId(null);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      notes: '',
    });
  };

  const showForm = mode === 'entry' || mode === 'full' || editingLogId;
  const showHistory = mode === 'history' || mode === 'full';

  return (
    <CustomModalForm
      open={open}
      onClose={onClose}
      title={
        mode === 'entry'
          ? `Add Follow-up: ${invoice?.invoiceNumber}`
          : mode === 'history'
            ? `Follow-up History: ${invoice?.invoiceNumber}`
            : `Follow-up: ${invoice?.invoiceNumber}`
      }
      icon={mode === 'entry' ? <Plus size={24} /> : <History size={24} />}
      widthClass={mode === 'full' ? 'max-w-3xl' : 'max-w-2xl'}
    >
      <div className="p-5">
        {/* Entry Form */}
        {showForm && (
          <form
            id="follow-up-form"
            onSubmit={handleSubmit}
            className={`${showHistory ? 'mb-6' : ''} ${editingLogId ? 'bg-yellow-50/50 border-yellow-200/50' : 'bg-blue-50/50 border-blue-100/50'} p-3 rounded-2xl border shadow-sm transition-colors duration-300`}
          >
            <h4
              className={`text-sm font-bold ${editingLogId ? 'text-yellow-700' : 'text-blue-900'} mb-4 flex items-center gap-2`}
            >
              <MessageSquare size={16} />{' '}
              {editingLogId
                ? 'Edit Follow-up Details'
                : 'New Follow-up Details'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} /> Follow-up Date
                </label>
                <input
                  type="date"
                  required
                  value={newEntry.date}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, date: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} /> Exact Time
                </label>
                <input
                  type="time"
                  required
                  value={newEntry.time}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, time: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5 mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={12} /> Discussion Summary
              </label>
              <textarea
                required
                rows="4"
                placeholder="Briefly describe what was discussed or any commitments made..."
                value={newEntry.notes}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, notes: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm resize-none shadow-sm"
              />
            </div>
            <div className="flex justify-end pt-2 gap-3">
              {editingLogId && (
                <Button
                  type="button"
                  onClick={cancelEdit}
                  className="!px-6 shadow-none"
                >
                  Cancel Edit
                </Button>
              )}
              <PrimaryButton
                type="submit"
                className={`shadow-lg !px-8 hover:scale-[1.02] transition-transform ${editingLogId ? '!bg-yellow-600 hover:!bg-yellow-700' : ''}`}
              >
                {editingLogId ? 'Update' : 'Save'}
              </PrimaryButton>
            </div>
          </form>
        )}

        {/* Timeline View */}
        {showHistory && (
          <div className="mt-2">
            <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
              Timeline History ({followUps.length})
            </h4>

            <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {followUps.length === 0 ? (
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
                followUps.map((log) => (
                  <div
                    key={log.id}
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
                            {new Date(log.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1 border border-gray-100 shadow-xs whitespace-nowrap flex-shrink-0">
                            <Clock size={10} /> {log.time}
                          </span>
                          <p
                            className="text-sm text-gray-700 font-semibold truncate"
                            title={log.notes}
                          >
                            {log.notes}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => handleEditClick(log)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all scale-95"
                            title="Edit log"
                          >
                            <SquarePen size={15} />
                          </button>
                           {onDeleteFollowUp && (
                             <IconButton
                               onClick={() =>
                                 onDeleteFollowUp(invoice.id, log.id)
                               }
                               className="p-1.5 hover:bg-red-50 scale-95 text-red-500"
                               title="Delete log"
                             >
                               <Trash2 size={16} />
                             </IconButton>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
        <Button
          onClick={onClose}
          className="p-2 font-bold border border-gray-300 rounded-lg "
        >
          Close
        </Button>
      </div>
    </CustomModalForm>
  );
}
