'use client';

import { SquarePen, UploadCloud, FileText, Loader2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from '../Buttons/Button';
import PrimaryButton from '../Buttons/PrimaryButton';
import { uploadAssetDocument } from '../../actions/uploadAssetDocument';
import { toast } from 'react-toastify';

const assetTypeConfigs = {
  Laptop: {
    keyword: 'LAP',
    specs: [
      {
        name: 'IP',
        label: 'IP Address',
        type: 'text',
        placeholder: '192.168.1.10',
      },
      {
        name: 'OS',
        label: 'Operating System',
        type: 'text',
        placeholder: 'Windows 11',
      },
      {
        name: 'CPU',
        label: 'CPU',
        type: 'text',
        placeholder: 'Intel i7-12700H',
      },
      {
        name: 'MAC',
        label: 'MAC Address',
        type: 'text',
        placeholder: 'AA:BB:CC:DD:EE:FF',
      },
      { name: 'RAM', label: 'RAM', type: 'text', placeholder: '16GB' },
      {
        name: 'Storage',
        label: 'Storage',
        type: 'text',
        placeholder: '512GB SSD',
      },
      {
        name: 'Antivirus',
        label: 'Antivirus',
        type: 'text',
        placeholder: 'Windows Defender',
      },
    ],
  },
  Mobile: {
    keyword: 'MB',
    specs: [
      {
        name: 'OS',
        label: 'Operating System',
        type: 'text',
        placeholder: 'iOS',
      },
      { name: 'RAM', label: 'RAM', type: 'text', placeholder: '6GB' },
      {
        name: 'IMEI',
        label: 'IMEI Number',
        type: 'text',
        placeholder: '123456789012345',
      },
      { name: 'Storage', label: 'Storage', type: 'text', placeholder: '256GB' },
      {
        name: 'OSVersion',
        label: 'OS Version',
        type: 'text',
        placeholder: '17.0',
      },
    ],
  },
  TV: {
    keyword: 'TV',
    specs: [
      {
        name: 'OS',
        label: 'Operating System',
        type: 'text',
        placeholder: 'Tizen',
      },
      {
        name: 'OSVersion',
        label: 'OS Version',
        type: 'text',
        placeholder: '7.0',
      },
      {
        name: 'Resolution',
        label: 'Resolution',
        type: 'text',
        placeholder: '4K UHD',
      },
      {
        name: 'ScreenSize',
        label: 'Screen Size',
        type: 'text',
        placeholder: '65 inches',
      },
    ],
  },
  Keyboard: {
    keyword: 'KB',
    specs: null,
  },
  Monitor: {
    keyword: 'MN',
    specs: [
      {
        name: 'Resolution',
        label: 'Resolution',
        type: 'text',
        placeholder: '1920x1080',
      },
      {
        name: 'ScreenSize',
        label: 'Screen Size',
        type: 'text',
        placeholder: '24 inches',
      },
      {
        name: 'PanelType',
        label: 'Panel Type',
        type: 'text',
        placeholder: 'IPS, TN, VA',
      },
    ],
  },
  Mouse: {
    keyword: 'MS',
    specs: null,
  },
  Printer: {
    keyword: 'PR',
    specs: [
      {
        name: 'Type',
        label: 'Printer Type',
        type: 'text',
        placeholder: 'Laser, Inkjet',
      },
      {
        name: 'Connectivity',
        label: 'Connectivity',
        type: 'text',
        placeholder: 'WiFi, USB, Ethernet',
      },
      {
        name: 'PaperSize',
        label: 'Paper Size',
        type: 'text',
        placeholder: 'A4, Letter',
      },
    ],
  },
  Tablet: {
    keyword: 'TB',
    specs: [
      {
        name: 'OS',
        label: 'Operating System',
        type: 'text',
        placeholder: 'Android, iPadOS',
      },
      { name: 'RAM', label: 'RAM', type: 'text', placeholder: '8GB' },
      { name: 'Storage', label: 'Storage', type: 'text', placeholder: '128GB' },
      {
        name: 'ScreenSize',
        label: 'Screen Size',
        type: 'text',
        placeholder: '10.9 inches',
      },
    ],
  },
  Chair: {
    keyword: 'CHR',
    specs: [
      {
        name: 'Material',
        label: 'Material',
        type: 'text',
        placeholder: 'Leather, Mesh, Fabric',
      },
      {
        name: 'Color',
        label: 'Color',
        type: 'text',
        placeholder: 'Black, Gray',
      },
      {
        name: 'Adjustable',
        label: 'Adjustable Height',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },
  Table: {
    keyword: 'TBL',
    specs: [
      {
        name: 'Dimensions',
        label: 'Dimensions (LxWxH)',
        type: 'text',
        placeholder: '120x60x75 cm',
      },
      {
        name: 'Material',
        label: 'Material',
        type: 'text',
        placeholder: 'Wood, Metal, Glass',
      },
    ],
  },
  Camera: {
    keyword: 'CAM',
    specs: [
      {
        name: 'Resolution',
        label: 'Resolution',
        type: 'text',
        placeholder: '4K, 1080p',
      },
      {
        name: 'Type',
        label: 'Camera Type',
        type: 'text',
        placeholder: 'DSLR, Mirrorless, WebCam',
      },
    ],
  },
  Other: {
    keyword: 'OTH',
    specs: [],
  },
};

const generateAssetTag = (assetType, existingAssets = []) => {
  const config = assetTypeConfigs[assetType] || assetTypeConfigs['Other'];
  const prefix = `${config.keyword}-`;
  const padding = 3;
  const yearSuffix = String(new Date().getFullYear()).slice(-2);
  const suffix = `-${yearSuffix}`;

  const relevantAssets = existingAssets.filter((asset) => {
    const tag = asset.assetTag || asset.tag;
    return tag && tag.startsWith(prefix) && tag.endsWith(suffix);
  });

  if (relevantAssets.length === 0) {
    return `${prefix}${String(1).padStart(padding, '0')}${suffix}`;
  }

  let maxSeq = 0;
  relevantAssets.forEach((asset) => {
    const tag = asset.assetTag || asset.tag;
    if (tag && tag.startsWith(prefix) && tag.endsWith(suffix)) {
      let temp = tag.slice(prefix.length);
      temp = temp.slice(0, -suffix.length);
      const seq = parseInt(temp, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSequence = maxSeq + 1;
  return `${prefix}${String(nextSequence).padStart(padding, '0')}${suffix}`;
};

const AssetDocumentUpload = ({
  label,
  value,
  onUpload,
  onRemove,
  isView,
  assetTag,
  documentType,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isView) return;
    try {
      setUploading(true);
      setError('');
      const url = await uploadAssetDocument(file, assetTag, documentType);
      onUpload(url);
      toast.success(`${label} uploaded successfully`);
    } catch (err) {
      const msg = err.message || 'Upload failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
    toast.success(`${label} removed successfully`);
  };

  const isImage = value && (
    value.toLowerCase().endsWith('.jpg') || 
    value.toLowerCase().endsWith('.jpeg') || 
    value.toLowerCase().endsWith('.png') || 
    value.toLowerCase().endsWith('.webp') ||
    value.includes('.jpg') ||
    value.includes('.jpeg') ||
    value.includes('.png') ||
    value.includes('.webp')
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-xs font-semibold text-gray-600 block">
        {label}
      </span>

      <div className={`
        relative group rounded-xl border-2 border-dashed transition-all duration-300 min-h-[160px] flex flex-col items-center justify-center p-4
        ${value ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}
        ${uploading ? 'opacity-70 animate-pulse cursor-wait' : ''}
        ${isView ? 'bg-gray-50' : 'cursor-pointer'}
      `}>
        {value ? (
          <div className="relative w-full h-full flex items-center justify-center group/img">
            {isImage ? (
              <img src={value} alt={label} className="max-h-[140px] rounded-lg shadow-sm object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <FileText size={48} className="text-[#33a8d9]" />
                <span className="text-xs text-blue-600 font-bold tracking-wider">
                  VIEW DOCUMENT
                </span>
              </div>
            )}

            {!isView && (
              <button
                onClick={handleRemove}
                type="button"
                className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-600 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-50 shadow-md z-10"
                title={`Remove ${label}`}
              >
                <Trash2 size={14} />
              </button>
            )}

            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-0 cursor-pointer"
              title="Open in new tab"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              {uploading ? (
                <Loader2 size={24} className="text-[#33a8d9] animate-spin" />
              ) : (
                <UploadCloud size={24} className="text-[#33a8d9]" />
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
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        )}
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium bg-red-50 px-2 py-1 rounded">{error}</p>}
    </div>
  );
};

const AssetForm = ({
  assetType,
  branch = 'DGL',
  onSubmit,
  onCancel,
  onEdit,
  onBack,
  isViewMode = false,
  initialData = null,
  existingAssets = [],
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    assetTag: '',
    deviceType: assetType,
    brand: '',
    modelName: '',
    serialNumber: '',
    vendor: '',
    purchaseDate: '',
    purchaseCost: '',
    warrantyUntil: '',
    invoiceFile: '',
    warrantyFile: '',
    notes: '',
    specs: {},
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const config = assetTypeConfigs[assetType];
      let initialSpecs = {};

      if (config && config.specs) {
        config.specs.forEach((spec) => {
          initialSpecs[spec.name] =
            spec.type === 'checkbox' ? spec.defaultValue || false : '';
        });
      }

      const newAssetTag = generateAssetTag(assetType, existingAssets);

      setFormData({
        assetTag: newAssetTag,
        deviceType: assetType,
        brand: '',
        modelName: '',
        serialNumber: '',
        vendor: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: '',
        warrantyUntil: '',
        invoiceFile: '',
        warrantyFile: '',
        notes: '',
        specs: initialSpecs,
      });
    }
  }, [assetType, initialData, existingAssets]);

  const handleChange = (e) => {
    if (isViewMode) return;
    const { name, value, type, checked } = e.target;

    if (name.startsWith('specs.')) {
      const specField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        specs: {
          ...prev.specs,
          [specField]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const config = assetTypeConfigs[assetType] || { specs: [] };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(70vh-120px)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white [&::-webkit-scrollbar-thumb]:rounded-full">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Branch Section */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                Branch
              </h3>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Branch
                <input
                  value={branch}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-gray-50 cursor-not-allowed"
                  readOnly
                  disabled
                />
              </label>
            </div>

            <div className="md:col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                Basic Information
              </h3>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Asset Tag
                <input
                  name="assetTag"
                  value={formData.assetTag}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none bg-gray-50 cursor-not-allowed"
                  readOnly={true}
                  disabled={true}
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Asset Type
                <input
                  value={assetType}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-gray-50 cursor-not-allowed"
                  readOnly
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Brand {!isViewMode && '*'}
                <input
                  name="brand"
                  value={formData.brand || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="e.g., Dell, Apple, Samsung"
                  required={!isViewMode}
                  readOnly={isViewMode}
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Model Name {!isViewMode && '*'}
                <input
                  name="modelName"
                  value={formData.modelName || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="e.g., XPS 15, iPhone 15, QLED 65"
                  required={!isViewMode}
                  readOnly={isViewMode}
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Serial Number {!isViewMode && '*'}
                <input
                  name="serialNumber"
                  value={formData.serialNumber || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="SN123456"
                  required={!isViewMode}
                  readOnly={isViewMode}
                />
              </label>
            </div>

            <div className="md:col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                Purchase Information
              </h3>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Vendor
                <input
                  name="vendor"
                  value={formData.vendor || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="e.g., Dell Inc., Apple Store"
                  readOnly={isViewMode}
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Purchase Date
                <input
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  readOnly={isViewMode}
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Purchase Cost
                <input
                  name="purchaseCost"
                  type="number"
                  value={formData.purchaseCost || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="1500"
                  step="0.01"
                  min="0"
                  readOnly={isViewMode}
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Warranty Until
                <input
                  name="warrantyUntil"
                  type="date"
                  value={formData.warrantyUntil || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  readOnly={isViewMode}
                />
              </label>
            </div>

            <div className="space-y-1 md:col-span-1">
              <AssetDocumentUpload
                label="Invoice Document"
                value={formData.invoiceFile || ''}
                onUpload={(url) => setFormData((prev) => ({ ...prev, invoiceFile: url }))}
                onRemove={() => setFormData((prev) => ({ ...prev, invoiceFile: '' }))}
                isView={isViewMode}
                assetTag={formData.assetTag}
                documentType="invoice"
              />
            </div>

            <div className="space-y-1 md:col-span-1">
              <AssetDocumentUpload
                label="Warranty Document"
                value={formData.warrantyFile || ''}
                onUpload={(url) => setFormData((prev) => ({ ...prev, warrantyFile: url }))}
                onRemove={() => setFormData((prev) => ({ ...prev, warrantyFile: '' }))}
                isView={isViewMode}
                assetTag={formData.assetTag}
                documentType="warranty"
              />
            </div>

            {config.specs && config.specs.length > 0 && (
              <>
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                    {assetType} Specifications
                  </h3>
                </div>

                {config.specs.map((spec) => (
                  <div key={spec.name} className="space-y-1">
                    <label className="text-xs text-gray-600 block">
                      {spec.label}
                      {spec.type === 'checkbox' ? (
                        <div className="mt-1 flex items-center">
                          <input
                            name={`specs.${spec.name}`}
                            type="checkbox"
                            checked={formData.specs[spec.name] || false}
                            onChange={handleChange}
                            className={`rounded ${
                              isViewMode
                                ? 'cursor-not-allowed opacity-50'
                                : 'cursor-pointer'
                            }`}
                            disabled={isViewMode}
                          />
                        </div>
                      ) : (
                        <input
                          name={`specs.${spec.name}`}
                          type={spec.type}
                          value={formData.specs[spec.name] || ''}
                          onChange={handleChange}
                          className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                            isViewMode
                              ? 'bg-gray-100 cursor-not-allowed'
                              : 'bg-white'
                          }`}
                          placeholder={spec.placeholder}
                          readOnly={isViewMode}
                        />
                      )}
                    </label>
                  </div>
                ))}
              </>
            )}

            <div className="md:col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                Additional Information
              </h3>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-gray-600 block">
                Notes
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  rows={3}
                  placeholder={`Additional notes about this ${assetType.toLowerCase()}...`}
                  readOnly={isViewMode}
                />
              </label>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-auto pt-3 ">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && !isViewMode && (
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-[#1E90FF] hover:underline flex items-center gap-1 px-3 py-2 hover:bg-blue-50 rounded transition-colors"
              >
                ← Change Asset Type
              </button>
            )}
            {initialData?.createdAt && (
              <div className="flex flex-col text-[10px] text-gray-400 font-medium">
                <span>Created: {new Date(initialData.createdAt).toLocaleString()}</span>
                {initialData.updatedAt && (
                  <span>Updated: {new Date(initialData.updatedAt).toLocaleString()}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isViewMode ? (
              <>
                <Button onClick={onCancel} className="min-w-[100px]">
                  Cancel
                </Button>
                <PrimaryButton
                  onClick={handleSubmit}
                  className="min-w-[120px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : `${initialData ? 'Update' : 'Add'} ${assetType} Asset`}
                </PrimaryButton>
              </>
            ) : (
              <div className="flex items-center">
                {onEdit && (
                  <PrimaryButton
                    onClick={onEdit}
                    className="flex items-center gap-2 mr-3 font-medium min-w-[120px]"
                  >
                    <SquarePen size={16} />
                    Edit Asset Details
                  </PrimaryButton>
                )}
                <Button onClick={onCancel} className="min-w-[80px]">
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetForm;
