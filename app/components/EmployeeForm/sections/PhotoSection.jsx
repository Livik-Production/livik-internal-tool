'use client';

import { useState } from 'react';
import { uploadEmployeeDocument } from '../../../actions/uploadEmployeeDocument';
import { deleteEmployeeDocument } from '../../../actions/deleteEmployeeDocument';
import { Camera, CreditCard, IdCard, Trash2, UploadCloud, FileText, Loader2, Plus } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../Toast';

/**
 * Reusable Document Upload Component
 */
function DocumentUpload({
  label,
  value,
  onUpload,
  onRemove,
  isView,
  icon: Icon,
  folder = 'employee-documents',
  accept = "image/jpeg,image/png,image/webp,application/pdf"
}) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  if (isView && !value) return null;

  const handleFileChange = async (file) => {
    if (!file || isView) return;
    try {
      setUploading(true);
      setError('');
      const url = await uploadEmployeeDocument(file, folder);
      onUpload(url);
      showSuccessToast(`${label} uploaded successfully`);
    } catch (err) {
      const msg = err.message || 'Upload failed';
      setError(msg);
      showErrorToast(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value || removing) return;
    try {
      setRemoving(true);
      setError('');
      await deleteEmployeeDocument(value);
      onRemove();
      showSuccessToast(`${label} removed successfully`);
    } catch (err) {
      const msg = err.message || 'Failed to remove';
      setError(msg);
      showErrorToast(msg);
    } finally {
      setRemoving(false);
    }
  };

  const isPDF = value?.toLowerCase().endsWith('.pdf');

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
        <Icon size={16} className="text-blue-500" />
        {label}
      </label>

      <div className={`
        relative group rounded-xl border-2 border-dashed transition-all duration-300 min-h-[160px] flex flex-col items-center justify-center p-4
        ${value ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}
        ${uploading ? 'opacity-70 animate-pulse cursor-wait' : ''}
        ${isView ? 'bg-gray-50' : 'cursor-pointer'}
      `}>
        {value ? (
          <div className="relative w-full h-full flex items-center justify-center group/img">
            {isPDF ? (
              <div className="flex flex-col items-center gap-2 p-4">
                <FileText size={48} className="text-blue-500" />
                <span className="text-xs text-blue-600 font-medium truncate max-w-[150px]">View Document</span>
              </div>
            ) : (
              <img src={value} alt={label} className="max-h-[140px] rounded-lg shadow-sm object-contain" />
            )}

            {!isView && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(); }}
                type="button"
                disabled={removing}
                className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-600 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-50 shadow-md z-10 disabled:cursor-not-allowed"
                title={`Remove ${label}`}
              >
                {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}

            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-0"
              title="Open in new tab"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              {uploading ? (
                <Loader2 size={24} className="text-blue-500 animate-spin" />
              ) : (
                <UploadCloud size={24} className="text-blue-500" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-600">
              {uploading ? 'Uploading...' : `Upload ${label}`}
            </p>
            <p className="text-[11px] text-gray-400 mt-1.5">Max 5MB (JPG, PNG, PDF)</p>
          </div>
        )}

        {!isView && !value && !uploading && (
          <input
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        )}
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium bg-red-50 px-2 py-1 rounded">{error}</p>}
    </div>
  );
}

function PhotoSection({ form, setField, isView }) {
  const [newLabel, setNewLabel] = useState('');
  const [uploadingOther, setUploadingOther] = useState(false);
  const [selectedOtherFile, setSelectedOtherFile] = useState(null);

  const handleAddOtherDocument = async () => {
    if (!newLabel.trim()) {
      showErrorToast('Please enter a document label first');
      return;
    }
    if (!selectedOtherFile) {
      showErrorToast('Please select a file first');
      return;
    }

    try {
      setUploadingOther(true);
      const url = await uploadEmployeeDocument(selectedOtherFile, 'employee-other');
      const updatedProofs = [...(form.proofs || []), { label: newLabel, url }];
      setField('proofs', updatedProofs);
      setNewLabel('');
      setSelectedOtherFile(null);
      showSuccessToast('Additional document added');
    } catch (err) {
      showErrorToast('Failed to upload document');
    } finally {
      setUploadingOther(false);
    }
  };

  const handleRemoveOtherDocument = async (index, url) => {
    try {
      const updatedProofs = form.proofs.filter((_, i) => i !== index);
      setField('proofs', updatedProofs);

      const deletedQueue = form.deletedDocuments || [];
      setField('deletedDocuments', [...deletedQueue, url]);

      showSuccessToast('Click Save Changes to apply permanently.');
    } catch (err) {
      showErrorToast('Failed to remove document');
    }
  };

  return (
    <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-5 rounded-2xl border border-gray-300 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          Employee Photos & Documents
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Photo */}
          <DocumentUpload
            label="Employee Photo"
            value={form.photo}
            onUpload={(url) => setField('photo', url)}
            onRemove={() => setField('photo', '')}
            isView={isView}
            icon={Camera}
            folder="employee-photos"
          />

          {/* Aadhaar Card */}
          <DocumentUpload
            label="Aadhaar Card"
            value={form.aadhaarCard}
            onUpload={(url) => setField('aadhaarCard', url)}
            onRemove={() => setField('aadhaarCard', '')}
            isView={isView}
            icon={IdCard}
            folder="employee-aadhaar"
          />

          {/* PAN Card */}
          <DocumentUpload
            label="PAN Card"
            value={form.panCard}
            onUpload={(url) => setField('panCard', url)}
            onRemove={() => setField('panCard', '')}
            isView={isView}
            icon={CreditCard}
            folder="employee-pan"
          />
        </div>

        {/* Other Attachments Section */}
        {(!isView || (form.proofs && form.proofs.length > 0)) && (
          <div className="mt-5 border-t border-gray-200 pt-4">
            <h4 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
              <div className="" />
              Other Attachments
            </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {form.proofs && form.proofs.map((proof, index) => {
              const label = proof.label || proof.proofLabel || 'Untitled Proof';
              const url = proof.url || proof.documentUrl;
              return (
                <div key={index} className="flex flex-col p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-400">
                      <FileText size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold text-gray-800 truncate">{label}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DOCUMENT</div>
                    </div>
                  </div>

                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-2 text-sm font-semibold text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Upload
                  </a>

                  {!isView && (
                    <button
                      onClick={() => handleRemoveOtherDocument(index, url)}
                      className="absolute top-2 right-2 p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}

            {!isView && (
              <div className="flex flex-col p-4 border-2 border-dashed border-blue-200 rounded-xl bg-[#f8fafc] shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full border border-blue-200 flex items-center justify-center bg-white text-blue-400">
                    <Plus size={12} className="stroke-[3]" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Add Attachment</span>
                </div>

                <input
                  type="text"
                  placeholder="Document Label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white placeholder-gray-400"
                />

                <div className="flex gap-2 relative">
                  <div className="flex-1 relative flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-500 font-bold text-xs cursor-pointer hover:bg-gray-50 truncate">
                    <UploadCloud size={14} className="flex-shrink-0" />
                    <span className="truncate">{selectedOtherFile ? selectedOtherFile.name : 'SELECT'}</span>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setSelectedOtherFile(e.target.files?.[0])}
                      disabled={uploadingOther}
                    />
                  </div>
                  <button
                    onClick={handleAddOtherDocument}
                    disabled={uploadingOther}
                    className="px-4 py-2 bg-[#7595a8] text-white rounded-lg text-xs font-bold hover:bg-[#607e8f] transition-colors disabled:opacity-70 flex items-center justify-center min-w-[70px]"
                  >
                    {uploadingOther ? <Loader2 size={14} className="animate-spin" /> : 'Upload'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {!isView && (
          <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <CreditCard size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-800">Document Requirements</h4>
              <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                Please ensure all documents are clear and legible. Supported formats: JPG and PDF.
                Maximum file size should not exceed 5MB per document.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhotoSection;
