'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectEmployeesItems } from '../../../store/slices/employeesSlice';
import { X } from 'lucide-react';
import CloseButton from '../Buttons/CloseButton';
import PrimaryButton from '../Buttons/PrimaryButton';
import Button from '../Buttons/Button';
import IconButton from '../Buttons/IconButton';
import CustomModalForm from '../CustomModalForm';
import CustomAlertForm from '../CustomAlertForm';

export default function AddAssignForm({
  assets = [],
  onAssign,
  onClose,
  mode = 'add',
  assignmentData = null,
  preFilledAsset = null,
}) {
  const [formData, setFormData] = useState({
    assetTag: '',
    selectedAssetId: '',
    employeeName: '',
    employeeId: '', // This is the display ID (LK001)
    selectedEmployeeDbId: '', // This is the cuid for the database
    assignmentDate: new Date().toISOString().split('T')[0],
    assignmentNotes: '',
  });

  const [assetDetails, setAssetDetails] = useState({
    serialNo: '',
    productName: '',
    modelName: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNameAutoFilled, setIsNameAutoFilled] = useState(false);
  const [showAssignedAlert, setShowAssignedAlert] = useState(false);
  const [assignedEmployeeInfo, setAssignedEmployeeInfo] = useState(null);

  const [assetSuggestions, setAssetSuggestions] = useState([]);
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);

  const unassignedAssets = useMemo(() => {
    return assets.filter(
      (asset) =>
        (asset.status === 'Unassigned' || !asset.assignedTo) &&
        asset.status !== 'In Repair'
    );
  }, [assets]);

  // Get employees from Redux store
  const employeesFromRedux = useSelector(selectEmployeesItems);

  // Transform Redux employee data to match your form's expected structure
  const employees = useMemo(() => {
    return employeesFromRedux && employeesFromRedux.length > 0
      ? employeesFromRedux
          .filter((emp) => emp.status?.toUpperCase() === 'ACTIVE')
          .map((emp) => ({
            dbId: emp.__raw?.id || emp.id,
            empId: emp.id,
            name: emp.name || '',
            phone: emp.mobile || '',
            email: emp.email || '',
            role: emp.role || '',
            status: emp.status || 'Active',
          }))
      : [];
  }, [employeesFromRedux]);

  useEffect(() => {
    if (mode !== 'add' && assignmentData) {
      const asset = assets.find((a) => a.id === assignmentData.assetId);

      if (asset) {
        setFormData({
          assetTag: asset.assetTag || asset.tag || '',
          selectedAssetId: assignmentData.assetId || asset.id,
          employeeName: assignmentData.employeeName || '',
          employeeId: assignmentData.employeeId || '',
          selectedEmployeeDbId:
            assignmentData.employeeDbId || assignmentData.employeeId || '',
          assignmentDate:
            assignmentData.assignmentDate ||
            new Date().toISOString().split('T')[0],
          assignmentNotes: assignmentData.assignmentNotes || '',
        });

        setAssetDetails({
          serialNo: asset.serialNumber || asset.serial || '',
          productName: asset.modelName || asset.model || '',
          modelName: asset.modelName || asset.model || '',
        });

        if (assignmentData.employeeId) {
          setIsNameAutoFilled(true);
        }
      }
    } else if (mode === 'add' && assignmentData) {
      if (assignmentData.assetId) {
        const asset = assets.find((a) => a.id === assignmentData.assetId);

        if (asset) {
          if (assignmentData.assetDetails) {
            setFormData((prev) => ({
              ...prev,
              assetTag:
                assignmentData.assetDetails.assetTag ||
                asset.assetTag ||
                asset.tag ||
                '',
              selectedAssetId: asset.id,
            }));

            setAssetDetails({
              serialNo:
                assignmentData.assetDetails.serialNo ||
                asset.serialNumber ||
                asset.serial ||
                '',
              productName:
                assignmentData.assetDetails.productName ||
                asset.modelName ||
                asset.model ||
                '',
              modelName:
                assignmentData.assetDetails.modelName ||
                asset.modelName ||
                asset.model ||
                '',
            });
          } else {
            setFormData((prev) => ({
              ...prev,
              assetTag: asset.assetTag || asset.tag || '',
              selectedAssetId: asset.id,
            }));

            setAssetDetails({
              serialNo: asset.serialNumber || asset.serial || '',
              productName: asset.modelName || asset.model || '',
              modelName: asset.modelName || asset.model || '',
            });
          }
        }
      }
    }
  }, [mode, assignmentData, assets]);

  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (formData.employeeId.trim() || formData.employeeName.trim()) {
      const idTerm = formData.employeeId.toLowerCase();
      const nameTerm = formData.employeeName.toLowerCase();

      const filtered = employees.filter(
        (emp) =>
          (emp.empId?.toLowerCase().includes(idTerm) && idTerm.length > 0) ||
          (emp.name?.toLowerCase().includes(nameTerm) && nameTerm.length > 0)
      );
      setEmployeeSuggestions(filtered.slice(0, 5));
    } else {
      setEmployeeSuggestions([]);
    }
  }, [formData.employeeId, formData.employeeName, employees]);

  const handleSelectEmployee = (emp) => {
    setFormData((prev) => ({
      ...prev,
      employeeId: emp.empId,
      employeeName: emp.name,
      selectedEmployeeDbId: emp.dbId,
    }));
    setIsNameAutoFilled(true);
    setShowSuggestions(false);

    if (errors.employeeId) setErrors((prev) => ({ ...prev, employeeId: '' }));
    if (errors.employeeName)
      setErrors((prev) => ({ ...prev, employeeName: '' }));
  };

  useEffect(() => {
    if (formData.employeeId.trim() && mode !== 'view') {
      const foundEmployee = employees.find(
        (emp) =>
          emp.empId?.trim().toLowerCase() ===
          formData.employeeId.trim().toLowerCase()
      );

      if (foundEmployee) {
        if (formData.employeeName !== foundEmployee.name) {
          setFormData((prev) => ({
            ...prev,
            employeeName: foundEmployee.name || '',
            selectedEmployeeDbId: foundEmployee.dbId,
          }));
        } else if (!formData.selectedEmployeeDbId) {
          setFormData((prev) => ({
            ...prev,
            selectedEmployeeDbId: foundEmployee.dbId,
          }));
        }
        setIsNameAutoFilled(true);
      }
    }
  }, [
    formData.employeeId,
    employees,
    mode,
    formData.employeeName,
    formData.selectedEmployeeDbId,
  ]);

  // Handle asset tag input - fetch asset details
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.assetTag.trim() && mode !== 'view') {
        const foundAsset = assets.find(
          (asset) =>
            asset.assetTag?.trim().toLowerCase() ===
              formData.assetTag.trim().toLowerCase() ||
            asset.tag?.trim().toLowerCase() ===
              formData.assetTag.trim().toLowerCase()
        );

        if (foundAsset) {
          setAssetDetails({
            serialNo: foundAsset.serialNumber || foundAsset.serial || '',
            productName: foundAsset.modelName || foundAsset.model || '',
            modelName: foundAsset.modelName || foundAsset.model || '',
          });

          // Check if asset is already assigned
          const isDifferentAsset = mode === 'add' || (assignmentData && foundAsset.id !== assignmentData.assetId);
          if (isDifferentAsset && (foundAsset.status === 'Assigned' || foundAsset.assignedTo)) {
            setAssignedEmployeeInfo(foundAsset.assignedTo);
            setShowAssignedAlert(true);
            setFormData((prev) => ({
              ...prev,
              selectedAssetId: '',
              assetTag: '', // Clear the tag as it's invalid for assignment
            }));
            setAssetDetails({
              serialNo: '',
              productName: '',
              modelName: '',
            });
          }
        } else {
          setFormData((prev) => ({ ...prev, selectedAssetId: '' }));
          setAssetDetails({
            serialNo: '',
            productName: '',
            modelName: '',
          });
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.assetTag, assets, mode, assignmentData]);

  useEffect(() => {
    if (mode !== 'view') {
      if (formData.assetTag.trim()) {
        const term = formData.assetTag.toLowerCase();
        const filtered = unassignedAssets.filter(
          (asset) =>
            (asset.assetTag || asset.tag || '').toLowerCase().includes(term) ||
            (asset.type || asset.deviceType || '').toLowerCase().includes(term)
        );
        setAssetSuggestions(filtered);
      } else {
        setAssetSuggestions(unassignedAssets);
      }
    }
  }, [formData.assetTag, unassignedAssets, mode]);

  const handleSelectAsset = (asset) => {
    setFormData((prev) => ({
      ...prev,
      assetTag: asset.assetTag || asset.tag || '',
      selectedAssetId: asset.id,
    }));
    setAssetDetails({
      serialNo: asset.serialNumber || asset.serial || '',
      productName: asset.modelName || asset.model || '',
      modelName: asset.modelName || asset.model || '',
    });
    setShowAssetSuggestions(false);
    if (errors.assetTag) setErrors((prev) => ({ ...prev, assetTag: '' }));
  };

  const selectedAsset = assets.find(
    (asset) => asset.id === formData.selectedAssetId
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.selectedAssetId) {
      newErrors.assetTag = 'Please enter a valid Asset Tag';
    }

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Employee name is required';
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    } else {
      const employeeExists = employees.some(
        (emp) =>
          emp.empId?.trim().toLowerCase() ===
          formData.employeeId.trim().toLowerCase()
      );
      if (!employeeExists) {
        newErrors.employeeId = 'Employee ID not found';
      }
    }

    if (!formData.assignmentDate) {
      newErrors.assignmentDate = 'Assignment date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'view') {
      onClose();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (onAssign) {
        await onAssign(
          formData.selectedAssetId,
          formData.selectedEmployeeDbId || formData.employeeId,
          formData.employeeName,
          formData.assignmentDate,
          formData.assignmentNotes,
          mode === 'edit' ? assignmentData?.id : null
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    if (mode === 'view') return;

    const { name, value } = e.target;

    if (name === 'employeeName') {
      setIsNameAutoFilled(false);
    }

    if (name === 'assetTag') {
      setFormData((prev) => ({ ...prev, [name]: value, selectedAssetId: '' }));
      setAssetDetails({
        serialNo: '',
        productName: '',
        modelName: '',
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const getModeInfo = () => {
    switch (mode) {
      case 'edit':
        return {
          title: 'Edit Assignment',
          description: 'Update asset assignment details',
        };
      case 'view':
        return {
          title: 'Assignment Details',
        };
      default:
        return {
          title: 'Assign Asset',
        };
    }
  };

  const modeInfo = getModeInfo();

  // Find current employee details for display
  const currentEmployee = employees.find(
    (emp) =>
      emp.empId?.trim().toLowerCase() ===
      formData.employeeId.trim().toLowerCase()
  );

  // Render Form
  const renderForm = () => (
    <form id="assign-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Asset Tag Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Asset Tag <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="assetTag"
          value={formData.assetTag}
          onChange={handleChange}
          onFocus={() => setShowAssetSuggestions(true)}
          onBlur={() => setTimeout(() => setShowAssetSuggestions(false), 200)}
          placeholder="Select or enter asset tag"
          disabled={mode === 'view'}
          autoComplete="off"
          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
            errors.assetTag ? 'border-red-300' : 'border-gray-300'
          } ${
            mode === 'view'
              ? 'bg-gray-50 opacity-70 cursor-not-allowed'
              : 'bg-white'
          }`}
        />
        
        {/* Dropdown for Asset Tag */}
        {showAssetSuggestions && assetSuggestions.length > 0 && mode !== 'view' && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[60] max-h-[260px] overflow-y-auto">
            {assetSuggestions.map((asset) => (
              <div
                key={asset.id}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                onClick={() => handleSelectAsset(asset)}
              >
                <div className="text-sm font-semibold text-gray-800">
                  {asset.assetTag || asset.tag}
                </div>
                <div className="text-xs text-gray-500">
                  {asset.type || asset.deviceType || 'Unknown Type'} • {asset.brand || ''} {asset.modelName || asset.model || ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {errors.assetTag && (
          <p className="mt-1 text-xs text-red-600">{errors.assetTag}</p>
        )}
      </div>

      {/* Asset Details - Three fields in one line */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Serial No
          </label>
          <input
            type="text"
            value={assetDetails.serialNo}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm opacity-70 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name
          </label>
          <input
            type="text"
            value={assetDetails.productName}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm opacity-70 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Name
          </label>
          <input
            type="text"
            value={assetDetails.modelName}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm opacity-70 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Employee Details - 4 columns in one line */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Employee Details
        </h3>
        <div className="grid grid-cols-4 gap-4 relative">
          {/* Employee ID column - smaller width */}
          <div className="w-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Enter Employee ID"
              disabled={mode === 'view'}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                errors.employeeId ? 'border-red-300' : 'border-gray-300'
              } ${
                mode === 'view'
                  ? 'bg-gray-50 opacity-70 cursor-not-allowed'
                  : 'bg-white'
              }`}
            />
            {errors.employeeId && (
              <p className="mt-1 text-xs text-red-600">{errors.employeeId}</p>
            )}
          </div>

          {/* Full Name column */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="employeeName"
              value={formData.employeeName}
              onChange={handleChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Employee name will auto-fill"
              disabled={mode === 'view'}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                errors.employeeName
                  ? 'border-red-300'
                  : isNameAutoFilled && mode !== 'view'
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-300'
              } ${
                mode === 'view'
                  ? 'bg-gray-50 opacity-70 cursor-not-allowed'
                  : 'bg-white'
              }`}
            />
            {errors.employeeName && (
              <p className="mt-1 text-xs text-red-600">{errors.employeeName}</p>
            )}
          </div>

          {/* Suggestion Dropdown - Absolutely positioned */}
          {showSuggestions &&
            employeeSuggestions.length > 0 &&
            mode !== 'view' && (
              <div className="absolute top-full left-0 mt-1 w-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] max-h-48 overflow-y-auto">
                {employeeSuggestions.map((emp) => (
                  <div
                    key={emp.empId}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                    onClick={() => handleSelectEmployee(emp)}
                  >
                    <div className="text-sm font-semibold text-gray-800">
                      {emp.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {emp.empId} • {emp.role?.name || emp.role || 'Employee'}
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Phone Number column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={currentEmployee?.phone || ''}
              readOnly
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm opacity-70 cursor-not-allowed"
            />
          </div>

          {/* Email ID column - New column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email ID
            </label>
            <input
              type="text"
              value={currentEmployee?.email || ''}
              readOnly
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm opacity-70 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Assignment Details
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Date <span className="text-red-500">*</span>
          </label>
          <div className="w-48">
            <input
              type="date"
              name="assignmentDate"
              value={formData.assignmentDate}
              onChange={handleChange}
              disabled={mode === 'view'}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                errors.assignmentDate ? 'border-red-300' : 'border-gray-300'
              } ${
                mode === 'view'
                  ? 'bg-gray-50 opacity-70 cursor-not-allowed'
                  : 'bg-white'
              }`}
            />
          </div>
          {errors.assignmentDate && (
            <p className="mt-1 text-xs text-red-600">{errors.assignmentDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="assignmentNotes"
            value={formData.assignmentNotes}
            onChange={handleChange}
            disabled={mode === 'view'}
            placeholder="Add any notes about this assignment..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </form>
  );

  // Main Component Render
  return (
    <CustomModalForm
      open={true}
      onClose={onClose}
      widthClass="max-w-4xl"
      title={
        <div>
          <h2 className="text-lg font-bold text-gray-800">{modeInfo.title}</h2>
        </div>
      }
      footer={
        mode !== 'view' && (
          <div className="flex justify-center space-x-4 items-center w-full">
            <Button onClick={onClose} className="min-w-[100px]">
              Cancel
            </Button>

            <PrimaryButton
              type="submit"
              form="assign-form"
              disabled={
                isSubmitting ||
                !formData.selectedAssetId ||
                !formData.employeeId ||
                !formData.employeeName
              }
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {mode === 'edit' ? 'Updating...' : 'Assigning...'}
                </>
              ) : mode === 'edit' ? (
                'Update Assignment'
              ) : (
                'Confirm Assignment'
              )}
            </PrimaryButton>
          </div>
        )
      }
    >
      <div className="p-4">
        {mode === 'view' ? (
          <div className="space-y-4">
            <p className="text-gray-600">View mode content...</p>
          </div>
        ) : (
          renderForm()
        )}
      </div>
      <CustomAlertForm
        isOpen={showAssignedAlert}
        onClose={() => {
          setShowAssignedAlert(false);
          setAssignedEmployeeInfo(null);
        }}
        onConfirm={() => {
          setShowAssignedAlert(false);
          setAssignedEmployeeInfo(null);
        }}
        title="Asset Already Assigned"
        message="This asset is assigned already to another employee."
        details={
          assignedEmployeeInfo && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">
                Current Holder:
              </p>
              <p className="text-sm text-blue-700">
                {assignedEmployeeInfo.name} ({assignedEmployeeInfo.empId})
              </p>
            </div>
          )
        }
        type="warning"
        confirmText="OK"
      />
    </CustomModalForm>
  );
}
