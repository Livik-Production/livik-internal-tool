import React from 'react';

const BondDetails = ({ form, setField, errors, isView }) => {
  const documentOptions = [
    { id: 'sslc', label: 'SSLC Certificate' },
    { id: 'hsc', label: 'HSC Certificate' },
    { id: 'degree', label: 'Degree Certificate' },
    // { id: "aadhaar", label: "Aadhaar Copy" },
    // { id: "pan", label: "PAN Copy" },
    // { id: "experience", label: "Experience Letters" },
    // { id: "resume", label: "Resume" },
    // { id: "photos", label: "Passport Photos" },
    // { id: "bank", label: "Bank Details" },
    // { id: "other", label: "Other Documents" },
  ];

  const handleDocumentChange = (docId, isChecked) => {
    const currentDocs = form.documentsCollected || [];
    let updatedDocs;

    if (isChecked) {
      updatedDocs = [...currentDocs, docId];
    } else {
      updatedDocs = currentDocs.filter((id) => id !== docId);
    }

    setField('documentsCollected', updatedDocs);
  };

  const isDocumentChecked = (docId) => {
    return (form.documentsCollected || []).includes(docId);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <h3 className={isView ? "font-bold text-xl text-gray-800 mb-4 border-b pb-2" : "text-lg font-semibold mb-4"}>Bond & Documents Details</h3>
          {!isView && (
            <label className="ml-4 flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={!!form.bondNotRequired}
                onChange={(e) => {
                  const v = !!e.target.checked;
                  setField('bondNotRequired', v);
                  if (v) {
                    // Clear bond fields when bond is not required
                    setField('bondDuration', '');
                    setField('documentsCollected', []);
                  }
                }}
                className="h-4 w-4 rounded cursor-pointer"
              />
              <span className="ml-2">Bond not required</span>
            </label>
          )}
        </div>
        {/* Bond Duration */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center">
              <span>Bond Duration : </span>
              <div className="flex items-center ml-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={form.bondDuration || ''}
                  onChange={(e) => setField('bondDuration', e.target.value)}
                  readOnly={isView}
                  disabled={isView || !!form.bondNotRequired}
                  className={`px-3 py-1 border rounded-md text-sm outline-none w-24 ${errors.bondDuration
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-blue-400'
                    } ${isView || form.bondNotRequired ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g., 2.5"
                />
                <span className="ml-2">years</span>
              </div>
              {!form.bondNotRequired && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </div>
          </label>
          {errors.bondDuration && (
            <p className="mt-1 text-sm text-red-600">{errors.bondDuration}</p>
          )}
        </div>

        {/* Documents Collected */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Original Documents Collected
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {documentOptions.map((doc) => (
              <div key={doc.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`doc-${doc.id}`}
                  checked={isDocumentChecked(doc.id)}
                  onChange={(e) =>
                    handleDocumentChange(doc.id, e.target.checked)
                  }
                  readOnly={isView}
                  disabled={isView || !!form.bondNotRequired}
                  className={`h-4 w-4 rounded ${isView ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                />
                <label
                  htmlFor={`doc-${doc.id}`}
                  className={`ml-2 text-sm ${isView ? 'text-gray-600' : 'text-gray-700'
                    }`}
                >
                  {doc.label}
                </label>
              </div>
            ))}
          </div>
          {errors.documentsCollected && (
            <p className="mt-1 text-sm text-red-600">
              {errors.documentsCollected}
            </p>
          )}
        </div>

        {/* Remarks */}
        {(!isView || (isView && form.bondRemarks)) && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              value={form.bondRemarks || ''}
              onChange={(e) => setField('bondRemarks', e.target.value)}
              readOnly={isView}
              disabled={isView}
              rows="4"
              className={`mt-1 w-full px-3 py-2 border rounded-md text-sm outline-none ${errors.bondRemarks
                ? 'border-red-500 focus:ring-red-400'
                : 'border-gray-300 focus:ring-blue-400'
                } ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Any additional remarks"
            />
            {errors.bondRemarks && (
              <p className="mt-1 text-sm text-red-600">{errors.bondRemarks}</p>
            )}
          </div>
        )}

        {/* Bond Status Summary (View Mode Only) */}
        {isView && form.bondDuration && (
          <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Bond Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Duration:</p>
                <p className="font-semibold">{form.bondDuration} years</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documents Collected:</p>
                <p className="font-semibold">
                  {(form.documentsCollected || []).length} documents
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BondDetails;
