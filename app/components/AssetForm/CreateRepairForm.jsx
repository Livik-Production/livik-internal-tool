'use client';

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import CloseButton from '../Buttons/CloseButton';
import FilterDropdown from '../Buttons/FilterDropdown';
import PrimaryButton from '../Buttons/PrimaryButton';
import Button from '../Buttons/Button';
import CustomModalForm from '../CustomModalForm';

export default function RepairForm({
  mode = 'add',
  assetId,
  assetTag,
  assetModel,
  repairData = null,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    issueType: 'Hardware',
    issue: '',
    reportDate: new Date().toISOString().split('T')[0],
    vendor: '',
    cost: '',
    completedDate: '',
    actualCost: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (
      repairData &&
      (mode === 'edit' || mode === 'view' || mode === 'update')
    ) {
      setFormData({
        id: repairData.id,
        issueType: repairData.issueType || 'Hardware',
        issue: repairData.issue || repairData.shortDescription || '',
        reportDate:
          repairData.reportDate ||
          repairData.date ||
          new Date().toISOString().split('T')[0],
        vendor: repairData.vendor || '',
        cost: repairData.cost || repairData.estimatedCost || '',
        completedDate: repairData.completedDate || '',
        actualCost: repairData.actualCost || '',
      });
    }
  }, [repairData, mode]);

  const validateForm = () => {
    const newErrors = {};

    if (mode === 'update') {
      if (!formData.completedDate) {
        newErrors.completedDate = 'Completion date is required';
      }
    } else {
      if (!formData.issue.trim()) {
        newErrors.issue = 'Short description is required';
      }

      if (!formData.reportDate) {
        newErrors.reportDate = 'Date is required';
      }

      if (!formData.vendor.trim()) {
        newErrors.vendor = 'Vendor is required';
      }
    }

    if (formData.cost && isNaN(parseFloat(formData.cost))) {
      newErrors.cost = 'Cost must be a valid number';
    }

    if (formData.actualCost && isNaN(parseFloat(formData.actualCost))) {
      newErrors.actualCost = 'Actual cost must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'view') {
      onCancel();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let submitData = {};

      if (mode === 'update') {
        submitData = {
          id: repairData.id,
          requestId: repairData.requestId,
          status: 'Completed',
          completedDate: formData.completedDate,
          actualCost: formData.actualCost
            ? parseFloat(formData.actualCost)
            : null,
        };
      } else {
        submitData = {
          id: repairData?.id,
          requestId: repairData?.requestId,
          status: repairData?.status || 'Reported',
          issueType: formData.issueType,
          issue: formData.issue,
          reportDate: formData.reportDate,
          vendor: formData.vendor,
          cost: formData.cost ? parseFloat(formData.cost) : 0,
        };
      }

      if (onSubmit) {
        await onSubmit(submitData);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({
        submit: `Failed to ${
          mode === 'edit' ? 'update' : mode === 'update' ? 'update' : 'create'
        } repair record.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    if (mode === 'view') return;

    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'edit':
        return 'Edit Repair Record';
      case 'update':
        return 'Mark Repair as Completed';
      case 'view':
        return 'View Repair Details';
      default:
        return 'Create Repair Record';
    }
  };

  const isReadOnly = mode === 'view';
  const isUpdateMode = mode === 'update';
  const isEditMode = mode === 'edit';

  return (
    <CustomModalForm
      open={true}
      onClose={onCancel}
      widthClass="max-w-md p-2"
      title={
        <div>
          <h2 className="text-lg font-bold text-gray-800">{getTitle()}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {assetTag} • {assetModel}
            {repairData?.requestId && ` • ${repairData.requestId}`}
          </p>
          {isUpdateMode && repairData?.issue && (
            <p className="text-sm text-gray-600 mt-1">{repairData.issue}</p>
          )}
        </div>
      }
      footer={
        !isReadOnly ? (
          <div className="flex gap-3 justify-center items-center w-full">
            <PrimaryButton
              type="submit"
              form="repair-form"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isUpdateMode
                    ? 'Completing...'
                    : mode === 'edit'
                      ? 'Updating...'
                      : 'Creating...'}
                </>
              ) : (
                <>
                  {isUpdateMode
                    ? 'Mark as Completed'
                    : mode === 'edit'
                      ? 'Update Record'
                      : 'Create Record'}
                </>
              )}
            </PrimaryButton>
            <Button onClick={onCancel} className="min-w-[80px]">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <Button onClick={onCancel} className="min-w-[80px]">
              Close
            </Button>
          </div>
        )
      }
    >
      <div className="p-2">
        <form id="repair-form" onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="space-y-4">
            {!isUpdateMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date of Giving to Repair *
                  </label>
                  <input
                    type="date"
                    name="reportDate"
                    value={formData.reportDate}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border rounded-md ${
                      errors.reportDate ? 'border-red-300' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.reportDate && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.reportDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vendor *
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border rounded-md ${
                      errors.vendor ? 'border-red-300' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.vendor && (
                    <p className="mt-1 text-xs text-red-600">{errors.vendor}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Issue Type
                    </label>
                    <div className="mt-1.5">
                      <FilterDropdown
                        label=""
                        options={[
                          { value: 'Hardware', label: 'Hardware' },
                          { value: 'Software', label: 'Software' },
                          { value: 'Other', label: 'Other' },
                        ]}
                        value={formData.issueType}
                        onChange={(val) =>
                          handleChange({
                            target: { name: 'issueType', value: val },
                          })
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Estimated Cost
                    </label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 text-sm border rounded-md ${
                        errors.cost ? 'border-red-300' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50' : ''}`}
                    />
                    {errors.cost && (
                      <p className="mt-1 text-xs text-red-600">{errors.cost}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Short Description *
                  </label>
                  <textarea
                    name="issue"
                    value={formData.issue}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    rows="3"
                    className={`w-full px-3 py-2 text-sm border rounded-md ${
                      errors.issue ? 'border-red-300' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.issue && (
                    <p className="mt-1 text-xs text-red-600">{errors.issue}</p>
                  )}
                </div>
              </>
            )}

            {isUpdateMode && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Completion Date *
                    </label>
                    <input
                      type="date"
                      name="completedDate"
                      value={formData.completedDate}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-md ${
                        errors.completedDate
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    />
                    {errors.completedDate && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.completedDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Actual Cost
                    </label>
                    <input
                      type="number"
                      name="actualCost"
                      value={formData.actualCost}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 text-sm border rounded-md ${
                        errors.actualCost ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.actualCost && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.actualCost}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> Marking this repair as completed will
                    change its status and cannot be undone.
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </CustomModalForm>
  );
}
