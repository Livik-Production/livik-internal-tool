'use client';

import React from 'react';
import AssetForm from '../AssetForm/AddAssetForms';
import CustomModalForm from '../CustomModalForm';

export default function AssetViewModal({ asset, onClose }) {
  if (!asset) return null;

  const formatDataForAssetForm = (asset) => {
    return {
      assetTag: asset.assetTag,
      deviceType: asset.deviceType,
      brand: asset.brand,
      modelName: asset.modelName,
      serialNumber: asset.serialNumber,
      vendor: asset.vendor,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      purchaseCost: asset.purchaseCost,
      warrantyUntil: asset.warrantyUntil
        ? asset.warrantyUntil.split('T')[0]
        : '',
      invoiceFile: asset.invoiceFile || '',
      warrantyFile: asset.warrantyFile || '',
      notes: asset.notes,
      specs: asset.specs || {},
    };
  };

  return (
    <CustomModalForm
      open={!!asset}
      onClose={onClose}
      widthClass="max-w-5xl"
      title={
        <div className="flex flex-col">
          <span>{asset.assetTag}</span>
          <span className="text-sm font-normal text-gray-500 mt-0.5">
            {asset.category?.name || asset.deviceType} • {asset.brand}{' '}
            {asset.modelName}
          </span>
        </div>
      }
    >
      <div className="p-3">
        <AssetForm
          assetType={asset.deviceType || asset.category?.name}
          onSubmit={null}
          onCancel={onClose}
          onBack={null}
          isViewMode={true}
          initialData={formatDataForAssetForm(asset)}
        />
      </div>
    </CustomModalForm>
  );
}
