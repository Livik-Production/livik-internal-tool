import React from 'react';
import CustomModalForm from '../CustomModalForm';
import Button from '../Buttons/Button';
import PrimaryButton from '../Buttons/PrimaryButton';
import { UploadCloud, X } from 'lucide-react';

export default function CRMCompanyModal({
  showModal, setShowModal, modalMode, handleSave,
  formCompany, setFormCompany, 
  formCompanyEmail, setFormCompanyEmail,
  formCompanyWebsite, setFormCompanyWebsite, 
  formCompanyLinkedin, setFormCompanyLinkedin, 
  formCompanyAddress, setFormCompanyAddress,
  formExpectedRevenue, setFormExpectedRevenue,
  formCompanyIndustry, setFormCompanyIndustry,
  formCompanyCity, setFormCompanyCity,
  formCompanyState, setFormCompanyState,
  formCompanyCountry, setFormCompanyCountry,
  formCompanyContactName, setFormCompanyContactName,
  formCompanyContactPhone, setFormCompanyContactPhone,
  formCompanyDocumentUrl, setFormCompanyDocumentUrl,
  formCompanySource, setFormCompanySource,
  isSubmitting
}) {
  return (
    <CustomModalForm
      open={showModal}
      onCancel={() => setShowModal(false)}
      title={modalMode === 'edit' ? 'Edit Company Details' : modalMode === 'view' ? 'Company Details' : 'Add Company Details'}
      widthClass="max-w-3xl"
    >
      <form onSubmit={handleSave} className="p-6 flex flex-col gap-6 bg-white text-left">
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Company Email
              </label>
              <input
                type="email"
                value={formCompanyEmail}
                onChange={(e) => setFormCompanyEmail(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-slate-700 block">
                  Website URL
                </label>
                {modalMode === 'view' && formCompanyWebsite && (
                  <a href={formCompanyWebsite.startsWith('http') ? formCompanyWebsite : `https://${formCompanyWebsite}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-100 transition-colors flex items-center gap-1">
                    View Website &rarr;
                  </a>
                )}
              </div>
              <input
                type="text"
                value={formCompanyWebsite}
                onChange={(e) => setFormCompanyWebsite(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-805 px-3 py-2 rounded-lg transition-colors placeholder:text-slate-400 disabled:bg-gray-100 disabled:text-gray-500"

              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-slate-700 block">
                  LinkedIn URL
                </label>
                {modalMode === 'view' && formCompanyLinkedin && (
                  <a href={formCompanyLinkedin.startsWith('http') ? formCompanyLinkedin : `https://${formCompanyLinkedin}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-100 transition-colors flex items-center gap-1">
                    View LinkedIn &rarr;
                  </a>
                )}
              </div>
              <input
                type="text"
                value={formCompanyLinkedin}
                onChange={(e) => setFormCompanyLinkedin?.(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-805 px-3 py-2 rounded-lg transition-colors placeholder:text-slate-400 disabled:bg-gray-100 disabled:text-gray-500"

              />
            </div>
            
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Industry
              </label>
              <input
                type="text"
                value={formCompanyIndustry}
                onChange={(e) => setFormCompanyIndustry(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
             <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Source
              </label>
              <select
                value={formCompanySource}
                onChange={(e) => setFormCompanySource?.(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Select Source</option>
                <option value="website">Website</option>
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                value={formCompanyContactName}
                onChange={(e) => setFormCompanyContactName(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"

              />
            </div>
            
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Contact Person Phone
              </label>
              <input
                type="text"
                value={formCompanyContactPhone}
                onChange={(e) => setFormCompanyContactPhone(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"
  
              />
            </div>
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Company Address
              </label>
              <input
                type="text"
                value={formCompanyAddress}
                onChange={(e) => setFormCompanyAddress(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"

              />
            </div>
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                City
              </label>
              <input
                type="text"
                value={formCompanyCity}
                onChange={(e) => setFormCompanyCity(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"

              />
            </div>
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                State
              </label>
              <input
                type="text"
                value={formCompanyState}
                onChange={(e) => setFormCompanyState(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"

              />
            </div>
            <div>
              <label className="text-[13px] text-gray-500 font-semibold block mb-1">
                Country
              </label>
              <input
                type="text"
                value={formCompanyCountry}
                onChange={(e) => setFormCompanyCountry(e.target.value)}
                disabled={modalMode === 'view'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none disabled:bg-gray-100 disabled:text-gray-500"

              />
            </div>
           
          </div>
          
          <div className="mt-8 flex justify-center w-full">
            <div className="w-full max-w-sm">
              <label className="text-[13px] text-gray-500 font-semibold block mb-2 text-center">
                Document Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="company-document-upload"
                  disabled={modalMode === 'view'}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if(file) {
                      // Store a blob URL so it can be previewed
                      const fileUrl = URL.createObjectURL(file);
                      setFormCompanyDocumentUrl(fileUrl);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="company-document-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-sm font-semibold text-gray-700 w-full flex items-center justify-center gap-2">
                    {formCompanyDocumentUrl ? (
                      <>
                        <span 
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer truncate max-w-full block"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(formCompanyDocumentUrl, '_blank');
                          }}
                        >
                          {formCompanyDocumentUrl.startsWith('blob:') 
                            ? 'Document_Preview.pdf' 
                            : formCompanyDocumentUrl.split('?')[0].split('/').pop() || 'View Document'}
                        </span>
                        {modalMode !== 'view' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormCompanyDocumentUrl('');
                              // Reset the input value so the same file can be re-selected if needed
                              const fileInput = document.getElementById('company-document-upload');
                              if (fileInput) fileInput.value = '';
                            }}
                            className="text-[#004475] rounded-full p-1 ml-1"
                            title="Remove document"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </>
                    ) : 'Upload Document'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Click to browse files
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Save and Cancel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <div className="flex justify-end gap-3 shrink-0">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowModal(false)}
              className="px-5 py-2 border border-gray-800 hover:bg-slate-50 text-slate-705 font-bold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {modalMode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {modalMode !== 'view' && (
              <PrimaryButton
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{modalMode === 'edit' ? 'Updating...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>{modalMode === 'edit' ? 'Update Company' : 'Save Company'}</span>
                  </>
                )}
              </PrimaryButton>
            )}
          </div>
        </div>
      </form>
    </CustomModalForm>
  );
}
