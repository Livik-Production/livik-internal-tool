'use client';

import { useState, useEffect } from 'react';
import RightsTable from './RightsTable';
import RightsModal from './AddRights';
import Loader from '../../../components/Loader';
import CustomAlertForm from '../../../components/CustomAlertForm';

export default function RightsTab() {
  const [rights, setRights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedRight, setSelectedRight] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [rightToDelete, setRightToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canEdit = true; // Temporary fix for undefined variable
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showAlert = (title, message, type = 'success') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  useEffect(() => {
    fetchRights();
  }, []);

  const fetchRights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rights');

      if (!response.ok) {
        throw new Error(`Failed to fetch rights: ${response.status}`);
      }

      const data = await response.json();
      setRights(data);
    } catch (error) {
      console.error('Error fetching rights:', error);
      showAlert(
        'Failed to Load',
        'Failed to load rights. Please try again.',
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddRight = () => {
    setModalMode('add');
    setSelectedRight(null);
    setShowModal(true);
  };

  const handleEditRight = (id, rightData) => {
    setModalMode('edit');
    setSelectedRight(rightData);
    setShowModal(true);
  };

  const handleModalSubmit = async (formData, mode, rightId) => {
    try {
      if (mode === 'add') {
        const response = await fetch('/api/rights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to add right');
        }

        showAlert('Right Added', 'Right added successfully!', 'success');
      } else if (mode === 'edit' && rightId) {
        const response = await fetch(`/api/rights/${rightId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update right');
        }

        showAlert('Right Updated', 'Right updated successfully!', 'success');
      }

      await fetchRights();
      setShowModal(false);

      return Promise.resolve();
    } catch (error) {
      console.error(
        `Error ${mode === 'add' ? 'adding' : 'updating'} right:`,
        error
      );
      throw error;
    }
  };

  const handleDeleteRight = (id) => {
    if (!canEdit) return;
    const right = rights.find((r) => r.id === id);
    if (!right) return;
    setRightToDelete(right);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRight = async () => {
    if (!rightToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/rights/${rightToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete right');
      }

      await fetchRights();
      setShowDeleteConfirm(false);
      setRightToDelete(null);
    } catch (error) {
      console.error('Error deleting right:', error);
      showAlert(
        'Delete Failed',
        error.message || 'Failed to delete right. Please try again.',
        'danger'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewRight = (right) => {
    showAlert(
      'Right Details',
      `ID: ${right.id}\nModule: ${right.module}\nDisplay Name: ${right.displayName}\nRight Name: ${right.rightName}\nDescription: ${right.description}\nCreated: ${new Date(right.createdAt).toLocaleDateString()}`,
      'info'
    );
  };

  const filteredRights = rights.filter((right) => {
    const matchesSearch =
      searchTerm === '' ||
      right.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      right.rightName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      right.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule =
      selectedModule === 'all' ||
      right.module?.toLowerCase().trim().replace(/\s+/g, ' ') ===
        selectedModule.toLowerCase().trim().replace(/\s+/g, ' ');

    return matchesSearch && matchesModule;
  });

  // Get unique module values from the actual data
  const uniqueModulesFromData = [
    ...new Set(rights.map((right) => right.module).filter(Boolean)),
  ];

  // Create module options combining "all" option with actual data modules
  const moduleOptions = ['all', ...uniqueModulesFromData.sort()];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Loader label="Loading rights..." size="md" fullScreen={false} />
      </div>
    );
  }

  return (
    <div>
      <RightsTable
        rights={filteredRights}
        onEditRight={handleEditRight}
        onDeleteRight={handleDeleteRight}
        onViewRight={handleViewRight}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedModule={selectedModule}
        onModuleChange={setSelectedModule}
        moduleOptions={moduleOptions}
        onAddRight={handleAddRight}
        totalRights={rights.length}
        filteredCount={filteredRights.length}
      />

      <RightsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialData={selectedRight}
      />

      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteRight}
        title="Delete Right"
        message={`Are you sure you want to delete right "${rightToDelete?.displayName}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isDeleting}
        details={
          rightToDelete && (
            <div className="text-sm">
              <p className="font-bold">{rightToDelete.rightName}</p>
              <p className="text-gray-500">{rightToDelete.module}</p>
            </div>
          )
        }
      />

      <CustomAlertForm
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText="OK"
        cancelText="Close"
      />
    </div>
  );
}
