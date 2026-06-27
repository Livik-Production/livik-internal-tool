'use client';

import { useState, useEffect } from 'react';
import { X, SquarePen } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomAlertForm from '../../CustomAlertForm';
import { showSuccessToast, showErrorToast } from '../../Toast';
import CustomModalForm from '../../CustomModalForm';

export default function RightsSelectionModal({
  isOpen,
  onClose,
  mode = 'add',
  roleData = {},
  onSave,
  onCancel,
  onEdit,
}) {
  const [moduleRights, setModuleRights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);

  const {
    id = null,
    displayName = '',
    roleName = '',
    selectedRights = [],
    effectiveDate = '',
    description = '',
  } = roleData;

  const [formData, setFormData] = useState({
    roleName: displayName || roleName,
    selectedRights: selectedRights,
    effectiveDate: effectiveDate,
    description: description,
  });

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';

  useEffect(() => {
    setFormData({
      roleName: displayName || roleName,
      selectedRights: selectedRights,
      effectiveDate: effectiveDate || getTodayDate(),
      description: description,
    });
  }, [displayName, roleName, selectedRights, effectiveDate, description]);

  useEffect(() => {
    if (isOpen) {
      fetchRights();
    } else {
      setModuleRights([]);
      setLoading(true);
      setSaving(false);
    }
  }, [isOpen]);

  const fetchRights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rights');

      if (!response.ok) {
        throw new Error(`Failed to fetch rights: ${response.status}`);
      }

      const rightsData = await response.json();
      const groupedByModule = {};
      rightsData.forEach((right) => {
        const rawModule = right.module || 'General';
        const trimmedModule = rawModule.trim();
        const lowerModule = trimmedModule.toLowerCase();

        if (!groupedByModule[lowerModule]) {
          groupedByModule[lowerModule] = {
            originalModule: trimmedModule,
            rights: new Set(),
          };
        }
        if (right.displayName) {
          groupedByModule[lowerModule].rights.add(right.displayName.trim());
        }
      });

      const moduleRightsArray = Object.values(groupedByModule).map((group) => ({
        module: group.originalModule,
        rights: Array.from(group.rights),
      }));

      setModuleRights(moduleRightsArray);
    } catch (error) {
      console.error('Error fetching rights:', error);
      showErrorToast('Failed to load rights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const convertDisplayNameToRoleName = (displayName) => {
    if (!displayName) return '';

    return displayName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  const modalTitle = isViewMode
    ? 'View Role'
    : isEditMode
      ? 'Edit Role'
      : 'Add New Role';

  const moduleSelectionState = {};
  moduleRights.forEach((mod) => {
    const moduleRightsList = mod.rights;
    const selectedModuleRights = moduleRightsList.filter((right) =>
      formData.selectedRights.includes(right)
    );

    if (selectedModuleRights.length === 0) {
      moduleSelectionState[mod.module] = 'none';
    } else if (selectedModuleRights.length === moduleRightsList.length) {
      moduleSelectionState[mod.module] = 'all';
    } else {
      moduleSelectionState[mod.module] = 'some';
    }
  });

  const handleFieldChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    if (field === 'roleName' && roleData.onRoleNameChange) {
      roleData.onRoleNameChange(value);
    } else if (field === 'effectiveDate' && roleData.onEffectiveDateChange) {
      roleData.onEffectiveDateChange(value);
    } else if (field === 'description' && roleData.onDescriptionChange) {
      roleData.onDescriptionChange(value);
    } else if (field === 'selectedRights' && roleData.onRightsChange) {
      roleData.onRightsChange(value);
    }
  };

  const toggleRight = (right) => {
    if (isViewMode) return;

    const newRights = formData.selectedRights.includes(right)
      ? formData.selectedRights.filter((r) => r !== right)
      : [...formData.selectedRights, right];

    handleFieldChange('selectedRights', newRights);
  };

  const toggleModule = (moduleName) => {
    if (isViewMode) return;

    const module = moduleRights.find((mod) => mod.module === moduleName);
    if (!module) return;

    const moduleRightNames = module.rights;
    const allModuleRightsSelected = moduleRightNames.every((right) =>
      formData.selectedRights.includes(right)
    );

    let newRights;
    if (allModuleRightsSelected) {
      newRights = formData.selectedRights.filter(
        (right) => !moduleRightNames.includes(right)
      );
    } else {
      newRights = [...formData.selectedRights];
      moduleRightNames.forEach((right) => {
        if (!newRights.includes(right)) {
          newRights.push(right);
        }
      });
    }

    handleFieldChange('selectedRights', newRights);
  };

  const handleSave = async () => {
    if (!formData.roleName.trim()) {
      showErrorToast('Please enter a role name');
      return;
    }

    const generatedRoleName = convertDisplayNameToRoleName(formData.roleName);

    const alertMessage =
      `Display Name: ${formData.roleName}\n` +
      `Role Name: ${generatedRoleName}\n` +
      `No. of Rights: ${formData.selectedRights.length}\n` +
      `Effective Date: ${formData.effectiveDate}\n` +
      `Description: ${formData.description || 'No description provided'}`;

    setConfirmModalData({
      title: isEditMode ? 'Confirm Role Update' : 'Confirm Role Creation',
      message: isEditMode
        ? 'Are you sure you want to update this role with the following details?'
        : 'Are you sure you want to create a new role with the following details?',
      details: (
        <div className="space-y-1">
          <p>
            <span className="font-semibold">Display Name:</span>{' '}
            {formData.roleName}
          </p>
          <p>
            <span className="font-semibold">Role Name:</span>{' '}
            {generatedRoleName}
          </p>
          <p>
            <span className="font-semibold">Rights:</span>{' '}
            {formData.selectedRights.length} selected
          </p>
          <p>
            <span className="font-semibold">Effective Date:</span>{' '}
            {formData.effectiveDate}
          </p>
          <p className="truncate">
            <span className="font-semibold">Description:</span>{' '}
            {formData.description || 'N/A'}
          </p>
        </div>
      ),
    });
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    const generatedRoleName = convertDisplayNameToRoleName(formData.roleName);
    setSaving(true);
    try {
      const rolePayload = {
        displayName: formData.roleName,
        roleName: generatedRoleName,
        description: formData.description || null,
        rights: formData.selectedRights,
      };

      let savedRole;
      let response;

      if (isEditMode && id) {
        rolePayload.id = id;
        response = await fetch('/api/roles', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rolePayload),
        });
      } else {
        response = await fetch('/api/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rolePayload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save role');
      }
      savedRole = await response.json();

      if (onSave) {
        onSave({
          id: savedRole.id,
          roleName: formData.roleName,
          selectedRights: formData.selectedRights,
          effectiveDate: formData.effectiveDate,
          description: formData.description,
          noOfRights: formData.selectedRights.length,
        });
      }
    } catch (error) {
      console.error('Error saving role:', error);
      showErrorToast(`Failed to save role: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  if (!isOpen) return null;

  const renderFooter = (
    <div className="flex justify-end gap-3 w-full">
      {!isViewMode ? (
        <>
          <Button onClick={handleCancel} disabled={saving}>
            CANCEL
          </Button>
          <PrimaryButton
            onClick={handleSave}
            disabled={
              !formData.roleName || !formData.effectiveDate || loading || saving
            }
            className="min-w-[140px]"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                {isEditMode ? 'SAVING...' : 'CREATING...'}
              </>
            ) : isEditMode ? (
              'SAVE CHANGES'
            ) : (
              'CREATE ROLE'
            )}
          </PrimaryButton>
        </>
      ) : (
        <>
          <Button onClick={handleCancel}>CLOSE</Button>
          {isViewMode && onEdit && (
            <PrimaryButton onClick={onEdit} className="gap-2">
              <SquarePen size={18} />
              EDIT DETAILS
            </PrimaryButton>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <CustomModalForm
        open={isOpen}
        onClose={handleCancel}
        title={modalTitle}
        footer={renderFooter}
        widthClass="max-w-6xl"
      >
        <div className="p-4">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  Role Name{' '}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium">
                    {formData.roleName || 'Not specified'}
                  </div>
                ) : (
                  <div>
                    <input
                      value={formData.roleName}
                      onChange={(e) =>
                        handleFieldChange('roleName', e.target.value)
                      }
                      placeholder="Enter role name (e.g., Admin, Manager, Viewer)"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      disabled={isViewMode}
                    />
                    {formData.roleName && !isViewMode && (
                      <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                        Role code will be:{' '}
                        <span className="font-mono font-bold text-gray-700">
                          {convertDisplayNameToRoleName(formData.roleName)}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  Effective Date{' '}
                  {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium">
                    {formData.effectiveDate
                      ? formatDateForDisplay(formData.effectiveDate)
                      : 'Not set'}
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                      type="date"
                      value={formData.effectiveDate || getTodayDate()}
                      onChange={(e) =>
                        handleFieldChange('effectiveDate', e.target.value)
                      }
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-white"
                      disabled={isViewMode}
                      min={getTodayDate()}
                    />
                  </div>
                )}
                {!isViewMode && !formData.effectiveDate && (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Defaults to today's date
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-wider">
                {formData.selectedRights.length} Rights Selected
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-gray-500">
                Loading module configuration...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {moduleRights.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {moduleRights.slice(0, 2).map((module) => (
                    <ModuleSection
                      key={module.module}
                      module={module}
                      selectedRights={formData.selectedRights}
                      moduleSelectionState={moduleSelectionState}
                      isViewMode={isViewMode}
                      onToggleModule={() => toggleModule(module.module)}
                      onToggleRight={toggleRight}
                    />
                  ))}
                </div>
              )}

              {moduleRights.length > 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {moduleRights.slice(2, 4).map((module) => (
                    <ModuleSection
                      key={module.module}
                      module={module}
                      selectedRights={formData.selectedRights}
                      moduleSelectionState={moduleSelectionState}
                      isViewMode={isViewMode}
                      onToggleModule={() => toggleModule(module.module)}
                      onToggleRight={toggleRight}
                    />
                  ))}
                </div>
              )}

              {moduleRights.length > 4 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {moduleRights.slice(4).map((module) => (
                    <ModuleSection
                      key={module.module}
                      module={module}
                      selectedRights={formData.selectedRights}
                      moduleSelectionState={moduleSelectionState}
                      isViewMode={isViewMode}
                      onToggleModule={() => toggleModule(module.module)}
                      onToggleRight={toggleRight}
                    />
                  ))}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Description{' '}
                  {!isViewMode && (
                    <span className="text-gray-400 font-normal ml-1">
                      (Optional)
                    </span>
                  )}
                </label>
                {isViewMode ? (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm min-h-[100px] leading-relaxed">
                    {formData.description ||
                      'No additional description provided for this role.'}
                  </div>
                ) : (
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleFieldChange('description', e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-none min-h-[100px]"
                    disabled={isViewMode}
                    rows={3}
                    placeholder="Tell us what this role is for..."
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </CustomModalForm>

      <CustomAlertForm
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSave}
        title={confirmModalData?.title}
        message={confirmModalData?.message}
        type="info"
        confirmText={isEditMode ? 'Update Role' : 'Create Role'}
        cancelText="Cancel"
        details={confirmModalData?.details}
      />
    </>
  );
}

function ModuleSection({
  module,
  selectedRights,
  moduleSelectionState,
  isViewMode,
  onToggleModule,
  onToggleRight,
}) {
  return (
    <div className="border rounded-lg p-3 h-[240px] flex flex-col border-gray-200">
      <div className="flex items-center gap-3 font-semibold mb-2 text-gray-700 p-1 rounded">
        {!isViewMode ? (
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded w-full">
            <input
              type="checkbox"
              checked={moduleSelectionState[module.module] === 'all'}
              ref={(el) => {
                if (el) {
                  el.indeterminate =
                    moduleSelectionState[module.module] === 'some';
                }
              }}
              onChange={onToggleModule}
              className="h-4 w-4 accent-blue-600"
              disabled={isViewMode}
            />
            <span className="flex-1">{module.module}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {module.rights.length} rights
            </span>
          </label>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="flex-1">{module.module}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {module.rights.length} rights
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="space-y-1 pl-2">
          {module.rights.map((right, index) => (
            <RightItem
              key={right}
              right={right}
              index={index}
              isSelected={selectedRights.includes(right)}
              isViewMode={isViewMode}
              onToggle={() => onToggleRight(right)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RightItem({ right, index, isSelected, isViewMode, onToggle }) {
  const hasBorder = index >= 5;

  return (
    <div
      className={`flex items-start gap-2 text-xs p-1 rounded ${
        hasBorder ? 'border-t border-gray-100 pt-1 mt-1' : ''
      }`}
    >
      {!isViewMode ? (
        <label className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 w-full p-0.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="h-3 w-3 accent-blue-600 mt-0.5 flex-shrink-0"
            disabled={isViewMode}
          />
          <span
            className="text-gray-600 break-words min-w-0 leading-tight"
            title={right}
          >
            {right}
          </span>
        </label>
      ) : (
        <div className="flex items-start gap-2 w-full p-1">
          <div
            className={`h-3 w-3 rounded border flex items-center justify-center mt-0.5 flex-shrink-0 ${
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : 'bg-gray-100 border-gray-300'
            }`}
          >
            {isSelected && (
              <svg
                className="w-1.5 h-1.5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <span
            className={`text-gray-600 break-words min-w-0 leading-tight ${
              isSelected ? 'font-medium' : 'text-gray-400'
            }`}
            title={right}
          >
            {right}
          </span>
        </div>
      )}
    </div>
  );
}
