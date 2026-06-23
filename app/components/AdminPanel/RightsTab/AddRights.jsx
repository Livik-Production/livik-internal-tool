'use client';

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import CloseButton from '../../Buttons/CloseButton';
import PrimaryButton from '../../Buttons/PrimaryButton';
import Button from '../../Buttons/Button';
import CustomModalForm from '../../CustomModalForm';

const RightsModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'add',
  initialData = null,
}) => {
  const [formData, setFormData] = useState({
    module: '',
    displayName: '',
    rightName: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [moduleOptions, setModuleOptions] = useState([
    'HR Module ',
    'Finance Module',
    'Asset Module',
    'Admin Module ',
    'Payroll Module',
  ]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/dropdowns?type=modules');
        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            const activeOptions = result.data
              .filter(
                (item) => !item.status || item.status.toLowerCase() === 'active'
              )
              .map((item) => item.value || item.label);
            if (activeOptions.length > 0) {
              setModuleOptions(activeOptions);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching modules from lookup data:', err);
      }
    };
    fetchModules();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        module: initialData.module || '',
        displayName: initialData.displayName || '',
        rightName: initialData.rightName || '',
        description: initialData.description || '',
      });
    } else {
      setFormData({
        module: '',
        displayName: '',
        rightName: '',
        description: '',
      });
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'displayName') {
      // Allow any input while typing, validation will check format on submit
      setFormData((prev) => ({
        ...prev,
        displayName: value,
      }));
    } else if (name === 'rightName') {
      // Allow any input while typing, validation will check format on submit
      setFormData((prev) => ({
        ...prev,
        rightName: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.module ||
      !formData.displayName ||
      !formData.rightName ||
      !formData.description
    ) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        module: formData.module,
        displayName: formData.displayName,
        rightName: formData.rightName,
        description: formData.description,
      };
      await onSubmit(payload, mode, initialData?.id);
      handleReset();
      onClose();
    } catch (error) {
      console.error(
        `Error ${mode === 'add' ? 'adding' : 'updating'} rights:`,
        error
      );
      setError(
        error.message ||
          `Failed to ${mode === 'add' ? 'add' : 'update'} right. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      module: '',
      displayName: '',
      rightName: '',
      description: '',
    });
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const modalTitle = mode === 'add' ? 'Add New Right' : 'Edit Right';
  const submitButtonText = mode === 'add' ? 'Add Right' : 'Update Right';

  const renderFooter = (
    <div className="flex justify-end gap-3 w-full">
      <Button onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <PrimaryButton
        type="submit"
        form="rightsForm"
        disabled={isSubmitting}
        className="min-w-[120px]"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            {mode === 'add' ? 'Adding...' : 'Updating...'}
          </>
        ) : (
          submitButtonText
        )}
      </PrimaryButton>
    </div>
  );

  return (
    <CustomModalForm
      open={isOpen}
      onClose={handleClose}
      title={modalTitle}
      footer={renderFooter}
      widthClass="max-w-md"
    >
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <form id="rightsForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Module *
            </label>
            <div className="relative group">
              <select
                name="module"
                value={formData.module}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 appearance-none bg-white transition-all text-sm font-medium text-gray-700 pr-10"
                required
                disabled={isSubmitting}
              >
                <option value="">Select a module</option>
                {moduleOptions.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-focus-within:text-blue-500">
                <svg
                  className="h-4 w-4 transition-transform group-focus-within:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display Name *
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all text-sm font-medium text-gray-700 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="e.g., ADD_EMPLOYEE"
              required
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              Uppercase letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Right Name *
            </label>
            <input
              type="text"
              name="rightName"
              value={formData.rightName}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all text-sm font-medium text-gray-700 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="e.g., add_employee"
              required
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              Lowercase letters, numbers, and underscores only
              {mode === 'edit' && ' (Editable but must follow format)'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all text-sm resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="Description about the rights"
              required
              disabled={isSubmitting}
            />
          </div>

          {mode === 'edit' && initialData?.createdAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Created Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={new Date(initialData.createdAt).toLocaleDateString()}
                  readOnly
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-100 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed font-medium"
                />
              </div>
            </div>
          )}
        </form>
      </div>
    </CustomModalForm>
  );
};

export default RightsModal;
