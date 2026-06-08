'use client';

import { SquarePen } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from '../Buttons/Button';
import PrimaryButton from '../Buttons/PrimaryButton';

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
  const config = assetTypeConfigs[assetType];
  if (!config) return 'OTH-0001-25';

  const keyword = config.keyword;
  const currentYear = new Date().getFullYear().toString().slice(-2);

  const sameTypeAssets = existingAssets.filter(
    (asset) => asset.deviceType === assetType || asset.type === assetType
  );

  let maxSequence = 0;
  sameTypeAssets.forEach((asset) => {
    const assetTag = asset.assetTag || asset.tag;
    if (assetTag) {
      const match = assetTag.match(new RegExp(`^${keyword}-(\\d{4})-\\d{2}$`));
      if (match) {
        const sequence = parseInt(match[1]);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }
  });

  const nextSequence = maxSequence + 1;
  const sequenceStr = nextSequence.toString().padStart(4, '0');

  return `${keyword}-${sequenceStr}-${currentYear}`;
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

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Invoice File URL
                <input
                  name="invoiceFile"
                  value={formData.invoiceFile || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder={`invoices/${formData.assetTag}.pdf`}
                  readOnly={isViewMode}
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600 block">
                Warranty File URL
                <input
                  name="warrantyFile"
                  value={formData.warrantyFile || ''}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder={`warranties/${formData.assetTag}.pdf`}
                  readOnly={isViewMode}
                />
              </label>
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
          </div>

          <div className="flex items-center gap-4">
            {!isViewMode ? (
              <>
                <Button onClick={onCancel} className="min-w-[100px]">
                  Cancel
                </Button>
                <PrimaryButton onClick={handleSubmit} className="min-w-[120px]" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : `${initialData ? 'Update' : 'Add'} ${assetType} Asset`}
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
