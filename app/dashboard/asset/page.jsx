'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OverviewForm from '../../components/AssetForm/OverviewForm';
import AssignmentForm from '../../components/AssetForm/AssignmentForm';
import AssetsForm from '../../components/AssetForm/AssetForm';
import AssetForm from '../../components/AssetForm/AddAssetForms';
import CreateRepairForm from '../../components/AssetForm/CreateRepairForm';
import RepairHistoryTable from '../../components/AssetForm/RepairTable';
import CustomModalForm from '../../components/CustomModalForm';
import {
  fetchAssets,
  selectAssetsItems,
  selectAssetsStatus,
  selectAssetsError,
  addAsset,
  updateAsset,
  deleteAsset,
} from '../../../store/slices/assetsSlice';
import { useMemo } from 'react';
import { Package } from 'lucide-react';
import TabButton from '../../components/Buttons/TabButton';
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Loader from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

// Tab definitions with rights
const TAB_CONFIG = [
  {
    id: 'overview',
    label: 'Dashboard',
    right: 'asset_view_dashboard',
    controlRight: 'asset_control_all',
  },
  {
    id: 'assets',
    label: 'All Assets',
    right: 'asset_view_assets',
    controlRight: 'asset_control_assets',
  },
  {
    id: 'assignments',
    label: 'Assignments',
    right: 'asset_view_assignments',
    controlRight: 'asset_control_assignments',
  },
];

export default function AssetPage() {
  const dispatch = useDispatch();
  const assets = useSelector(selectAssetsItems);
  const assetsStatus = useSelector(selectAssetsStatus);
  const assetsError = useSelector(selectAssetsError);

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [activeTab, setActiveTab] = useState('');

  const authUser = useSelector((state) => state.auth.user);

  // ── Rights computation ──────────────────────────────────────────────────────
  const { visibleTabs, isViewOnly, isAdmin } = useMemo(() => {
    if (!authUser) return { visibleTabs: [], isViewOnly: true, isAdmin: false };

    const { role } = authUser;
    const rawRights = authUser.rights || [];
    const normalizedRights = rawRights.map((r) => String(r).toLowerCase());

    const roleName = (role?.name || role?.roleName || '').toUpperCase();
    const isAdmin =
      roleName === 'ADMIN' ||
      roleName === 'SUPER_ADMIN' ||
      normalizedRights.includes('all_access');

    const checkRight = (r) => normalizedRights.includes(r.toLowerCase());

    // Legacy/Module-level checks
    const hasModuleAccess =
      isAdmin ||
      checkRight('asset_module') ||
      checkRight('asset_module_access');
    const hasGlobalControl = isAdmin || checkRight('asset_control_all');

    // Filter tabs based on granular or global rights
    const tabs = TAB_CONFIG.filter((tab) => {
      if (hasGlobalControl) return true;
      return checkRight(tab.right) || checkRight(tab.controlRight);
    });

    // Determine if active tab is view only
    const currentTabConfig =
      TAB_CONFIG.find((t) => t.id === activeTab) || tabs[0];
    let activeIsViewOnly = true;

    if (currentTabConfig) {
      if (hasGlobalControl) {
        activeIsViewOnly = false;
      } else {
        const hasControl = checkRight(currentTabConfig.controlRight);
        const hasView = checkRight(currentTabConfig.right);
        activeIsViewOnly = hasView && !hasControl;
      }
    }

    return { visibleTabs: tabs, isViewOnly: activeIsViewOnly, isAdmin };
  }, [authUser, activeTab]);

  const canEditAllAssets = !isViewOnly;

  // Add Asset Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('DGL');
  const [showAssetForm, setShowAssetForm] = useState(false);

  // View/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit'
  const [activeModalTab, setActiveModalTab] = useState('details'); // For view mode tabs

  // Repair Form State
  const [showRepairForm, setShowRepairForm] = useState(false);

  // Edit Completion State
  const [editCompleted, setEditCompleted] = useState(false);

  // New Category State
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Asset Categories State (Dynamic)
  const [assetCategories, setAssetCategories] = useState([]);
  const [categoriesStatus, setCategoriesStatus] = useState('idle');
  const [categoriesError, setCategoriesError] = useState(null);

  // Fetch asset categories on component mount
  useEffect(() => {
    const fetchAssetCategories = async () => {
      if (categoriesStatus === 'idle') {
        setCategoriesStatus('loading');
        try {
          const response = await fetch('/api/asset-categories');
          if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
          }
          const data = await response.json();
          setAssetCategories(data);
          setCategoriesStatus('succeeded');
        } catch (error) {
          console.error('Error fetching asset categories:', error);
          setCategoriesError(error.message);
          setCategoriesStatus('failed');
          // Fallback to empty array if API fails
          setAssetCategories([]);
        }
      }
    };

    fetchAssetCategories();
  }, [categoriesStatus]);

  // Fetch assets on component mount
  useEffect(() => {
    if (assetsStatus === 'idle') {
      dispatch(fetchAssets());
    }
  }, [assetsStatus, dispatch]);

  // Set initial active tab
  useEffect(() => {
    if (
      visibleTabs.length > 0 &&
      (!activeTab || !visibleTabs.find((t) => t.id === activeTab))
    ) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  if (assetsStatus === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error loading assets</h3>
        <p className="text-red-600 text-sm mt-1">{assetsError}</p>
        <button
          onClick={() => dispatch(fetchAssets())}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (visibleTabs.length === 0 && authUser) {
    return (
      <div className="flex items-center justify-center p-10 text-gray-500">
        You do not have access to the Asset Tracking module.
      </div>
    );
  }

  // Helper function to get category ID by name
  const getCategoryIdByName = (categoryName) => {
    if (!categoryName) return 'other-id';

    const foundCategory = assetCategories.find(
      (cat) => cat.name === categoryName
    );

    return foundCategory ? foundCategory.id : 'other-id';
  };

  // Helper function to get category name by ID
  const getCategoryNameById = (categoryId) => {
    if (!categoryId) return 'Other';

    const foundCategory = assetCategories.find((cat) => cat.id === categoryId);

    return foundCategory ? foundCategory.name : 'Other';
  };

  // Open Add Asset Modal
  const openAdd = () => {
    // Only open if categories are loaded
    if (categoriesStatus === 'succeeded') {
      setIsAddOpen(true);
      setSelectedAssetType('');
      setShowAssetForm(false);
    } else if (categoriesStatus === 'loading') {
      alert('Please wait while categories are loading...');
    } else {
      alert('Failed to load asset categories. Please try again later.');
    }
  };

  const closeAdd = () => {
    setIsAddOpen(false);
    setSelectedAssetType('');
    setSelectedBranch('DGL');
    setShowAssetForm(false);
  };

  const handleNextToForm = () => {
    if (selectedAssetType) {
      setShowAssetForm(true);
    }
  };

  const handleBackToTypeSelection = () => {
    setShowAssetForm(false);
  };

  // Handle New Category Creation
  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const response = await fetch('/api/asset-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }

      const createdCategory = await response.json();

      // Update local state
      setAssetCategories((prev) =>
        [...prev, createdCategory].sort((a, b) => a.name.localeCompare(b.name))
      );

      // Select the newly created category
      setSelectedAssetType(createdCategory.name);

      // Reset form
      setNewCategoryName('');
      setShowNewCategoryForm(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.message || 'Failed to create category. Please try again.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Handle Asset Form Submission (Add new asset)
  const handleAssetSubmit = async (formData) => {
    try {
      const categoryId = getCategoryIdByName(selectedAssetType);

      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetTag: formData.assetTag,
          categoryId: categoryId,
          deviceType: selectedAssetType,
          brand: formData.brand,
          modelName: formData.modelName,
          serialNumber: formData.serialNumber,
          vendor: formData.vendor,
          purchaseDate: formData.purchaseDate,
          purchaseCost: parseFloat(formData.purchaseCost),
          warrantyUntil: formData.warrantyUntil,
          invoiceFile: formData.invoiceFile,
          warrantyFile: formData.warrantyFile,
          notes: formData.notes,
          specs: formData.specs || {},
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create asset');
      }
      const newAsset = await response.json();
      const categoryName = getCategoryNameById(newAsset.categoryId);

      const formattedAsset = {
        id: newAsset.id,
        tag: newAsset.assetTag ?? '',
        categoryId: newAsset.categoryId ?? '',
        category: categoryName,
        deviceType: newAsset.deviceType ?? '',
        brand: newAsset.brand ?? '',
        model: newAsset.modelName ?? '',
        serial: newAsset.serialNumber ?? '',
        vendor: newAsset.vendor ?? '',
        purchaseDate: newAsset.purchaseDate ?? null,
        cost: newAsset.purchaseCost ?? 0,
        warrantyUntil: newAsset.warrantyUntil ?? null,
        invoiceFile: newAsset.invoiceFile ?? '',
        warrantyFile: newAsset.warrantyFile ?? '',
        notes: newAsset.notes ?? '',
        specs: newAsset.specs ?? {},
        __raw: newAsset,
      };

      dispatch(addAsset(formattedAsset));
      closeAdd();
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Failed to create asset. Please try again.');
    }
  };

  const handleAssetUpdate = async (formData) => {
    if (!selectedAsset) return;

    try {
      const response = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetTag: formData.assetTag,
          brand: formData.brand,
          modelName: formData.modelName,
          serialNumber: formData.serialNumber,
          vendor: formData.vendor,
          purchaseDate: formData.purchaseDate,
          purchaseCost: parseFloat(formData.purchaseCost),
          warrantyUntil: formData.warrantyUntil,
          invoiceFile: formData.invoiceFile,
          warrantyFile: formData.warrantyFile,
          notes: formData.notes,
          specs: formData.specs || {},
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update asset');
      }

      const updatedAsset = await response.json();

      // Get category name from ID for display
      const categoryName = getCategoryNameById(updatedAsset.categoryId);

      // Format the updated asset for Redux store
      const formattedAsset = {
        id: updatedAsset.id,
        tag: updatedAsset.assetTag ?? '',
        categoryId: updatedAsset.categoryId ?? '',
        category: categoryName, // Use the dynamically fetched category name
        deviceType: updatedAsset.deviceType ?? '',
        brand: updatedAsset.brand ?? '',
        model: updatedAsset.modelName ?? '',
        serial: updatedAsset.serialNumber ?? '',
        vendor: updatedAsset.vendor ?? '',
        purchaseDate: updatedAsset.purchaseDate ?? null,
        cost: updatedAsset.purchaseCost ?? 0,
        warrantyUntil: updatedAsset.warrantyUntil ?? null,
        invoiceFile: updatedAsset.invoiceFile ?? '',
        warrantyFile: updatedAsset.warrantyFile ?? '',
        notes: updatedAsset.notes ?? '',
        specs: updatedAsset.specs ?? {},
        __raw: updatedAsset,
      };

      // Dispatch to Redux store
      dispatch(updateAsset(formattedAsset));

      // Show success message
      setEditCompleted(true);

      // Close modal after 1.5 seconds
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('Failed to update asset. Please try again.');
    }
  };

  // Open View Modal
  const openView = (asset) => {
    setSelectedAsset(asset.__raw); // Use the raw data from API
    setModalMode('view');
    setActiveModalTab('details');
    setIsModalOpen(true);
    setEditCompleted(false); // Reset edit completed state
  };

  // Open Edit Modal
  const openEdit = (asset) => {
    setSelectedAsset(asset.__raw); // Use the raw data from API
    setModalMode('edit');
    setIsModalOpen(true);
    setEditCompleted(false); // Reset edit completed state
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
    setModalMode('view');
    setActiveModalTab('details');
    setEditCompleted(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete asset? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      // Dispatch to Redux store
      dispatch(deleteAsset(id));

      if (selectedAsset && selectedAsset.id === id) {
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete asset. Please try again.');
    }
  };

  const handleAssign = async (assetId, empId, empName, assignDate, notes) => {
    try {
      const response = await fetch('/api/asset-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId,
          employeeId: empId,
          assignedDate: assignDate,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign asset');
      }

      // Refresh assets list
      dispatch(fetchAssets());
    } catch (error) {
      console.error('Error assigning asset:', error);
      alert(error.message || 'Failed to assign asset. Please try again.');
    }
  };

  const handleUnassign = async (assignmentId) => {
    try {
      const response = await fetch('/api/asset-assignment/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          returnDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign asset');
      }

      // Refresh assets list
      dispatch(fetchAssets());
    } catch (error) {
      console.error('Error unassigning asset:', error);
      alert(error.message || 'Failed to unassign asset. Please try again.');
    }
  };

  // Handle Create Repair
  const handleCreateRepair = async (repairData) => {
    try {
      // The API call is already handled in the CreateRepairForm component
      // We just need to refresh the asset data to show the new repair
      dispatch(fetchAssets());

      // Also update the selected asset if it's currently open
      if (selectedAsset) {
        const response = await fetch(`/api/assets/${selectedAsset.id}`);
        if (response.ok) {
          const updatedAsset = await response.json();
          setSelectedAsset(updatedAsset);
        }
      }

      setShowRepairForm(false);
    } catch (error) {
      console.error('Error handling repair creation:', error);
    }
  };

  // Handle Edit Repair
  const handleEditRepair = (repair) => {
    // Implement edit repair functionality here
    alert(`Edit repair ${repair.requestId} - This would open edit form`);
  };

  // Handle Delete Repair
  const handleDeleteRepair = (repairId) => {
    // Implement delete repair functionality here
    if (confirm('Are you sure you want to delete this repair record?')) {
      // Add actual delete logic here
    }
  };

  // Format data for AssetForm component
  const formatDataForAssetForm = (asset) => {
    if (!asset) return null;

    return {
      assetTag: asset.assetTag || asset.tag,
      deviceType: asset.deviceType || asset.type,
      brand: asset.brand,
      modelName: asset.modelName || asset.model,
      serialNumber: asset.serialNumber || asset.serial,
      vendor: asset.vendor,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      purchaseCost: asset.purchaseCost || asset.cost,
      warrantyUntil: asset.warrantyUntil
        ? asset.warrantyUntil.split('T')[0]
        : '',
      invoiceFile: asset.invoiceFile || '',
      warrantyFile: asset.warrantyFile || '',
      notes: asset.notes,
      specs: asset.specs || {},
    };
  };

  // Component for loading state in Add Asset Modal
  const CategoryLoadingState = () => (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    </div>
  );

  // Component for error state in Add Asset Modal
  const CategoryErrorState = () => (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-semibold">
            Error loading categories
          </h3>
          <p className="text-red-600 text-sm mt-1">{categoriesError}</p>
          <button
            onClick={() => setCategoriesStatus('idle')}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
        <div className="text-center text-gray-500">
          <p>You can still add assets using default categories</p>
          <select
            value={selectedAssetType}
            onChange={(e) => setSelectedAssetType(e.target.value)}
            className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white transition-all duration-200"
          >
            <option value="">-- Select an asset type --</option>
            <option value="Other">Other</option>
          </select>
          <button
            onClick={handleNextToForm}
            disabled={!selectedAssetType}
            className={`mt-6 px-6 py-3 rounded-lg font-medium transition-colors ${selectedAssetType
              ? 'bg-[#1E90FF] text-white hover:bg-[#1873cc]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      key={assetsStatus === 'loading'}
      className="text-left h-full flex flex-col min-h-0 animate-dashboard-reveal"
    >
      {assetsStatus === 'loading' ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 m-0.5 flex flex-col items-center justify-center min-h-[400px]">
          <Loader label="Loading assets..." size="md" fullScreen={false} />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm p-3 m-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-xl">
                  <Package size={30} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Asset Tracking
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Track company hardware and electronic devices.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="bg-white px-3 py-1 rounded-full shadow text-sm font-medium">
                    {assets.length}
                  </div>
                </div>

                {isViewOnly && (
                  <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                    <span className="text-xs text-yellow-700 font-medium">
                      View Only
                    </span>
                  </div>
                )}

                <PrimaryButton
                  onClick={openAdd}
                  disabled={isViewOnly || categoriesStatus === 'loading'}
                >
                  {categoriesStatus === 'loading'
                    ? 'Loading...'
                    : '+ Add Asset'}
                </PrimaryButton>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm m-0.5 mt-1.5 min-h-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 w-full px-2.5 pt-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scroll w-full md:w-auto">
                {visibleTabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    isActive={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </TabButton>
                ))}
              </div>
            </div>
            {/* <div
              key={activeTab}
              className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1 animate-dashboard-reveal min-h-0"
            >
              {activeTab === 'overview' && (
                <OverviewForm assets={assets} isViewOnly={isViewOnly} />
              )}
              {activeTab === 'assignments' && (
                <AssignmentForm
                  assets={assets}
                  onViewDetail={openView}
                  onUnassign={handleUnassign}
                  onAssign={handleAssign}
                  isViewOnly={isViewOnly}
                />
              )}
              {activeTab === 'assets' && (
                <div className="p-2.5">
                  <AssetsForm
                    assets={assets}
                    onViewDetail={openView}
                    onEdit={openEdit}
                    onAssign={handleAssign}
                    onDelete={handleDelete}
                    isViewOnly={isViewOnly}
                  />
                </div>
              )}
            </div> */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  duration: 0.25,
                  ease: 'easeInOut',
                }}
                className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1"
              >
                {activeTab === 'overview' && (
                  <OverviewForm assets={assets} isViewOnly={isViewOnly} />
                )}

                {activeTab === 'assignments' && (
                  <AssignmentForm
                    assets={assets}
                    onViewDetail={openView}
                    onUnassign={handleUnassign}
                    onAssign={handleAssign}
                    isViewOnly={isViewOnly}
                  />
                )}

                {activeTab === 'assets' && (
                  <div className="p-2.5">
                    <AssetsForm
                      assets={assets}
                      onViewDetail={openView}
                      onEdit={openEdit}
                      onAssign={handleAssign}
                      onDelete={handleDelete}
                      isViewOnly={isViewOnly}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Asset Details Modal (View/Edit) */}
          <CustomModalForm
            open={isModalOpen}
            onClose={closeModal}
            widthClass="max-w-5xl"
            title={
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between pr-8">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedAsset?.assetTag || selectedAsset?.tag} Details
                  </h2>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto no-scroll border-b border-gray-200">
                  <TabButton
                    isActive={activeModalTab === 'details'}
                    onClick={() => setActiveModalTab('details')}
                  >
                    Details
                  </TabButton>
                  <TabButton
                    isActive={activeModalTab === 'assignment'}
                    onClick={() => setActiveModalTab('assignment')}
                  >
                    Assignment History
                  </TabButton>
                  <TabButton
                    isActive={activeModalTab === 'repair'}
                    onClick={() => setActiveModalTab('repair')}
                  >
                    Repair History
                  </TabButton>
                </div>
              </div>
            }
          >
            <div className="p-6">
              {/* Edit Mode */}
              {modalMode === 'edit' && selectedAsset && (
                <>
                  {editCompleted ? (
                    <div className="text-center py-8">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg
                          className="h-6 w-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Asset Updated Successfully!
                      </h3>
                      <p className="text-gray-600">
                        Your changes have been saved.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Closing automatically...
                      </p>
                    </div>
                  ) : (
                    <AssetForm
                      assetType={
                        selectedAsset?.deviceType || selectedAsset?.type
                      }
                      onSubmit={handleAssetUpdate}
                      onCancel={closeModal}
                      onBack={null}
                      isViewMode={false}
                      initialData={formatDataForAssetForm(selectedAsset)}
                      existingAssets={assets}
                    />
                  )}
                </>
              )}

              {/* View Mode - Show Tab Content */}
              {modalMode === 'view' && selectedAsset && (
                <div key={activeModalTab} className="animate-dashboard-reveal">
                  {activeModalTab === 'details' && (
                    <div>
                      <AssetForm
                        assetType={
                          selectedAsset?.deviceType || selectedAsset?.type
                        }
                        onSubmit={null}
                        onCancel={closeModal}
                        onEdit={!isViewOnly ? () => setModalMode('edit') : null}
                        onBack={null}
                        isViewMode={true}
                        initialData={formatDataForAssetForm(selectedAsset)}
                        existingAssets={assets}
                      />
                    </div>
                  )}

                  {activeModalTab === 'assignment' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Assignment History
                      </h3>
                      {selectedAsset.assignments &&
                        selectedAsset.assignments.length > 0 ? (
                        <div className="space-y-3">
                          {selectedAsset.assignments.map(
                            (assignment, index) => (
                              <div
                                key={index}
                                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-semibold text-gray-900">
                                      {assignment.employee?.firstName}{' '}
                                      {assignment.employee?.lastName}
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                      ({assignment.employee?.empId})
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(
                                      assignment.assignedDate
                                    ).toLocaleDateString()}
                                    {assignment.returnDate && (
                                      <>
                                        {' to '}
                                        {new Date(
                                          assignment.returnDate
                                        ).toLocaleDateString()}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                          <p className="text-gray-500 italic">
                            No assignment history found
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeModalTab === 'repair' && (
                    <div>
                      <RepairHistoryTable
                        repairs={selectedAsset.repairs || []}
                        assetId={selectedAsset.id}
                        assetSpecs={selectedAsset.specs || {}}
                        assetTag={selectedAsset.assetTag || selectedAsset.tag}
                        assetModel={
                          selectedAsset.modelName || selectedAsset.model
                        }
                        onEditRepair={handleEditRepair}
                        onDeleteRepair={handleDeleteRepair}
                        onRepairAdded={handleCreateRepair}
                        onRepairUpdated={handleCreateRepair}
                        canEdit={canEditAllAssets}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CustomModalForm>

          {/* Add Asset Modal */}
          <CustomModalForm
            open={isAddOpen}
            onClose={closeAdd}
            widthClass="max-w-5xl"
            title={
              showAssetForm
                ? `Add ${selectedAssetType} Asset`
                : 'Select Asset Type'
            }
          >
            <div className="p-6">
              {!showAssetForm ? (
                <div>
                  {categoriesStatus === 'loading' && <CategoryLoadingState />}

                  {categoriesStatus === 'failed' && <CategoryErrorState />}

                  {categoriesStatus === 'succeeded' && (
                    <>
                      <p className="text-gray-600 mb-6 text-center">
                        Select the type of asset you want to add
                      </p>

                      <div className="max-w-md mx-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch *
                        </label>
                        <select
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white transition-all duration-200 mb-4"
                        >
                          <option value="DGL">DGL</option>
                          <option value="Other">Other</option>
                        </select>

                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Asset Type *
                          </label>
                          {isAdmin && !showNewCategoryForm && (
                            <button
                              onClick={() => setShowNewCategoryForm(true)}
                              className="text-xs text-[#004475] cursor-pointer font-xl"
                            >
                              + Create New Type
                            </button>
                          )}
                        </div>

                        {isAdmin && showNewCategoryForm ? (
                          <div className="p-4 bg-gray-50 rounded-lg border border-blue-100 mb-4 transition-all duration-300">
                            <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                              New Asset Type Name
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) =>
                                  setNewCategoryName(e.target.value)
                                }
                                placeholder="e.g. Webcam, Headphones, Server"
                                className="flex-1 px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                autoFocus
                              />
                              <button
                                onClick={handleCreateCategory}
                                disabled={
                                  isCreatingCategory || !newCategoryName.trim()
                                }
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${newCategoryName.trim()
                                  ? 'bg-[#004475] text-white  shadow-sm'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }`}
                              >
                                {isCreatingCategory ? '...' : 'Create'}
                              </button>
                              <button
                                onClick={() => {
                                  setShowNewCategoryForm(false);
                                  setNewCategoryName('');
                                }}
                                className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <select
                            value={selectedAssetType}
                            onChange={(e) =>
                              setSelectedAssetType(e.target.value)
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white transition-all duration-200"
                          >
                            <option value="">-- Select an asset type --</option>
                            {assetCategories.map((category) => (
                              <option key={category.id} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        )}

                        <div className="mt-8 flex justify-center">
                          <PrimaryButton
                            onClick={handleNextToForm}
                            disabled={!selectedAssetType}
                          >
                            Next
                          </PrimaryButton>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={handleBackToTypeSelection}
                          className="mr-3 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
                          title="Back to type selection"
                        >
                          ←
                        </button>
                        <div className="flex items-center">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Adding {selectedAssetType}
                            </h3>
                            <p className="text-xs text-gray-500">
                              Fill in the details below
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {selectedAssetType}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <AssetForm
                      assetType={selectedAssetType}
                      branch={selectedBranch}
                      onSubmit={handleAssetSubmit}
                      onCancel={closeAdd}
                      onBack={handleBackToTypeSelection}
                      isViewMode={false}
                      initialData={null}
                      existingAssets={assets}
                    />
                  </div>
                </div>
              )}
            </div>
          </CustomModalForm>

          {/* Create Repair Form Modal */}
          {showRepairForm && selectedAsset && (
            <CreateRepairForm
              assetId={selectedAsset.id}
              assetTag={selectedAsset.assetTag || selectedAsset.tag}
              assetModel={selectedAsset.modelName || selectedAsset.model}
              onSubmit={handleCreateRepair}
              onCancel={() => setShowRepairForm(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
