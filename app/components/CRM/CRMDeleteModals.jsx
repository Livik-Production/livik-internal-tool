import React from 'react';
import { AlertCircle } from 'lucide-react';
import CustomAlertForm from '../CustomAlertForm';

export default function CRMDeleteModals({
  showDeleteConfirm,
  setShowDeleteConfirm,
  confirmDeleteLead,
  leadToDelete,
  isSubmitting,

  showCompanyDeleteConfirm,
  setShowCompanyDeleteConfirm,
  confirmDeleteCompany,
  companyToDelete,
  isDeletingCompany,

  showActivityDeleteConfirm,
  setShowActivityDeleteConfirm,
  confirmDeleteActivity,
  isDeletingActivity,
}) {
  return (
    <>
      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteLead}
        title="Delete Lead"
        message={`Are you sure you want to delete lead "${leadToDelete?.name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isSubmitting}
        details={
          leadToDelete && (
            <div className="text-sm">
              <p className="font-bold">{leadToDelete.company}</p>
              <p className="text-gray-500">ID: {leadToDelete.id}</p>
            </div>
          )
        }
      />

      <CustomAlertForm
        isOpen={showCompanyDeleteConfirm}
        onClose={() => setShowCompanyDeleteConfirm(false)}
        onConfirm={confirmDeleteCompany}
        isSubmitting={isDeletingCompany}
        title="Delete Company"
        message={`Are you sure you want to delete ${companyToDelete?.name}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        icon={<AlertCircle className="w-6 h-6 text-red-600" />}
        details={
          companyToDelete && (
            <div className="text-sm">
              <p className="font-bold">{companyToDelete.name}</p>
              {companyToDelete.email && <p className="text-gray-500">{companyToDelete.email}</p>}
            </div>
          )
        }
      />

      <CustomAlertForm
        isOpen={showActivityDeleteConfirm}
        onClose={() => setShowActivityDeleteConfirm(false)}
        onConfirm={confirmDeleteActivity}
        isSubmitting={isDeletingActivity}
        title="Delete Logged Activity"
        message="Are you sure you want to delete this logged activity? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
