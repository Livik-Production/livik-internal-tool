'use client';

import { useState, useEffect, React } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import PrimaryButton from '../Buttons/PrimaryButton';
import Loader from '../Loader';
import { showSuccessToast, showErrorToast } from '../Toast';

export default function EmployeeExitForm({ employeeId, onSuccess, onCancel }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    exitType: 'RESIGNATION',
    resignationDate: '',
    lastWorkingDay: '',
    reason: '',
    employeeFeedback: '',
    hrRemarks: '',
    isAssetsReturned: false,
    isHandoverCompleted: false,
  });

  useEffect(() => {
    if (!employeeId) return;
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/employees/${employeeId}`);
        if (!res.ok) throw new Error('Failed to fetch employee details');
        const data = await res.json();
        setEmployee(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [employeeId]);

  const calculateBondDuration = (start, end) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    const diffTime = Math.abs(e - s);
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    const rounded = Math.round(diffYears * 2) / 2;
    return rounded > 0 ? rounded : null;
  };

  const submittedDocs = [];
  if (employee?.docSSLCCollected) submittedDocs.push('SSLC');
  if (employee?.docHSCCollected) submittedDocs.push('HSC');
  if (employee?.docDegreeCollected) submittedDocs.push('Degree');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit exit information');
      }

      showSuccessToast('Employee exit information processed successfully.');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      showErrorToast(err.message || 'Failed to submit exit information');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader label="Loading employee details..." />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6 max-w-xl mx-auto my-10 bg-white rounded-2xl border border-red-100 shadow-sm text-center">
        <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error || 'Employee not found'}</p>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 space-y-4">
      {/* Header Block */}
      <div className="bg-white rounded-2xl shadow-sm p-4 m-3.5 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Employee Exit Clearance
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Process exit details and clearances for {employee.firstName}{' '}
                {employee.lastName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded-2xl p-6 overflow-y-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Employee Name
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={`${employee.firstName || ''} ${employee.lastName || ''}`}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Employee ID
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={employee.empId || 'N/A'}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Exit Type *
              </label>
              <select
                required
                name="exitType"
                value={formData.exitType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800 font-medium cursor-pointer"
              >
                <option value="RESIGNATION">Resignation</option>
                <option value="TERMINATION">Termination</option>
                <option value="ABSCONDING">Absconding</option>
                <option value="RETIREMENT">Retirement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Resignation Date
              </label>
              <input
                type="date"
                name="resignationDate"
                value={formData.resignationDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Last Working Date *
              </label>
              <input
                type="date"
                required
                name="lastWorkingDay"
                value={formData.lastWorkingDay}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Detailed Reason for Exit *
            </label>
            <textarea
              name="reason"
              required
              rows={2}
              value={formData.reason}
              onChange={handleChange}
              placeholder="State the detailed reason for the exit..."
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Employee Feedback
              </label>
              <textarea
                name="employeeFeedback"
                rows={3}
                value={formData.employeeFeedback}
                onChange={handleChange}
                placeholder="Feedback provided by the employee during exit interview..."
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                HR Remarks
              </label>
              <textarea
                name="hrRemarks"
                rows={3}
                value={formData.hrRemarks}
                onChange={handleChange}
                placeholder="HR's internal notes or remarks..."
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Submitted Items (To be returned)
            </span>
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-orange-800 mb-1">
                    Original Documents
                  </span>
                  {submittedDocs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {submittedDocs.map(doc => (
                        <span key={doc} className="px-2 py-1 bg-white border border-orange-200 text-orange-700 text-xs font-medium rounded-md shadow-sm">
                          {doc}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-orange-600/70">No original documents submitted</span>
                  )}
                </div>
                <div>
                  <span className="block text-xs font-semibold text-orange-800 mb-1">
                    Bond Details
                  </span>
                  {calculateBondDuration(employee?.bondStartDate, employee?.bondEndDate) ? (
                    <div className="text-sm text-orange-700 font-medium bg-white px-3 py-1.5 rounded-md border border-orange-200 inline-block shadow-sm">
                      {calculateBondDuration(employee.bondStartDate, employee.bondEndDate)} Year{calculateBondDuration(employee.bondStartDate, employee.bondEndDate) > 1 ? 's' : ''} 
                      <span className="font-normal text-orange-600 ml-1">
                        ({new Date(employee.bondStartDate).toLocaleDateString('en-GB')} - {new Date(employee.bondEndDate).toLocaleDateString('en-GB')})
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-orange-600/70">No active bond found</span>
                  )}
                </div>
              </div>
            </div>

            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Clearance Checklist
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    name="isAssetsReturned"
                    checked={formData.isAssetsReturned}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                  />
                  <span>All Company Assets Returned</span>
                </label>
                {(employee?.assetAssignments || []).length > 0 ? (
                  <div className="pl-3 pr-2 py-2 border-l-2 border-blue-200 ml-2 max-h-32 overflow-y-auto space-y-2">
                    {(employee.assetAssignments || []).map((assignment) => (
                      <div key={assignment.id} className="text-xs flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">
                            {`${assignment.asset?.brand || ''} ${assignment.asset?.modelName || ''}`.trim() || assignment.asset?.deviceType || 'Unknown Asset'}
                          </span>
                          <span className="text-gray-500 text-[10px] uppercase">
                            {assignment.asset?.category?.name || 'Asset'} • {assignment.asset?.assetTag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pl-4 ml-2 mt-1 text-xs text-gray-400 font-medium">
                    No active assets assigned
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors h-fit">
                  <input
                    type="checkbox"
                    name="isHandoverCompleted"
                    checked={formData.isHandoverCompleted}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                  />
                  <span>Work Handover Completed</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 inline-flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                'Submit Exit'
              )}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
