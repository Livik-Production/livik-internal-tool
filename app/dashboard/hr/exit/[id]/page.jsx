'use client';

import { useState, useEffect, React } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LogOut, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import PrimaryButton from '../../../../../app/components/Buttons/PrimaryButton';
import Loader from '../../../../../app/components/Loader';

export default function EmployeeExitPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

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
    if (!id) return;
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/employees/${id}`);
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
  }, [id]);

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
      const res = await fetch(`/api/employees/${id}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit exit information');
      }

      alert('Employee exit information processed successfully. Status updated to Inactive.');
      router.push('/dashboard/hr');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit exit information');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader label="Loading employee details..." fullScreen />;
  }

  if (error || !employee) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-10 bg-white rounded-2xl border border-red-100 shadow-sm text-center">
        <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error || 'Employee not found'}</p>
        <button
          onClick={() => router.push('/dashboard/hr')}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to HR Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 space-y-4">
      {/* Header Block */}
      <div className="bg-white rounded-2xl shadow-sm p-4 m-0.5 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl">
              <LogOut size={28} />
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
          <button
            onClick={() => router.push('/dashboard/hr')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </button>
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
              Clearance Checklist
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
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

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/hr')}
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
