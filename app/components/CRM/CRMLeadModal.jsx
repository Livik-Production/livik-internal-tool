import React from 'react';
import CustomModalForm from '../CustomModalForm';

export default function CRMLeadModal(props) {
  const {
    showAddLeadModal, setShowAddLeadModal, modalMode, handleAddLead,
    formCompany, setFormCompany, formCompanyEmail, setFormCompanyEmail,
    formCompanyWebsite, setFormCompanyWebsite, formCompanyAddress, setFormCompanyAddress,
    formFirstName, setFormFirstName, formLastName, setFormLastName,
    formPocDepartment, setFormPocDepartment, formPhone, setFormPhone,
    formEmail, setFormEmail, pocDropdownRef, isPocDropdownOpen, setIsPocDropdownOpen,
    pocSearchQuery, setPocSearchQuery, filteredPocSuggestions,
    formEmployeeType, setFormEmployeeType, representativeDropdownRef,
    representativeSearch, setRepresentativeSearch, isRepresentativeDropdownOpen,
    setIsRepresentativeDropdownOpen, formEmployeeSelectedId, setFormEmployeeSelectedId,
    formEmployeeDetailsText, filteredSuggestions,
    formDate, setFormDate, formTime, setFormTime, reminderDropdownRef,
    formReminderName, setFormReminderName, isReminderDropdownOpen,
    setIsReminderDropdownOpen, filteredReminderPocSuggestions, formReminderDate,
    setFormReminderDate, formNotes, setFormNotes, currentEditingLead,
    formatDateTime, isSubmitting
  } = props;

  return (
    <CustomModalForm
      open={showAddLeadModal}
      onCancel={() => setShowAddLeadModal(false)}
      title={modalMode === 'view' ? 'Lead Details' : modalMode === 'edit' ? 'Edit Lead Details' : modalMode === 'logActivity' ? 'Log Activity' : modalMode === 'editActivity' ? 'Edit Activity' : 'Add Lead Details'}
      widthClass="max-w-5xl"
    >
      <form onSubmit={handleAddLead} id="lead-form" className="p-6 flex flex-col gap-6 bg-white text-left">
        <fieldset disabled={modalMode === 'view'} className="contents">
        
        {/* Company Details Section */}
        <div>
          <div className="border-b border-slate-200 pb-2 mb-4">
            <h3 className="text-lg font-bold text-gray-800">Company Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Company Email
              </label>
              <input
                type="email"
                placeholder="e.g. info@acmecorp.com"
                value={formCompanyEmail}
                onChange={(e) => setFormCompanyEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Website URL
              </label>
              <input
                type="text"
                placeholder="e.g. acmecorp.com"
                value={formCompanyWebsite}
                onChange={(e) => setFormCompanyWebsite(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Company Address
              </label>
              <input
                type="text"
                placeholder="e.g. 123 Tech Boulevard, Suite 500"
                value={formCompanyAddress}
                onChange={(e) => setFormCompanyAddress(e.target.value)}
                className="w-76 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* POC Details Section */}
        <div>
          <div className="border-b border-slate-200 pb-2 mb-4">
            <h3 className="text-lg font-bold text-gray-800">POC Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div className="relative" ref={pocDropdownRef}>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Johnathan"
                value={formFirstName}
                onFocus={() => {
                  setIsPocDropdownOpen(true);
                  setPocSearchQuery('');
                }}
                onChange={(e) => {
                  setFormFirstName(e.target.value);
                  setPocSearchQuery(e.target.value);
                  setIsPocDropdownOpen(true);
                }}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />

              {isPocDropdownOpen && filteredPocSuggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1">
                  {filteredPocSuggestions.map((poc, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFormFirstName(poc.firstName);
                        setFormLastName(poc.lastName);
                        setFormEmail(poc.email);
                        setFormPhone(poc.phone);
                        setFormPocDepartment(poc.pocDepartment);
                        setIsPocDropdownOpen(false);
                        setPocSearchQuery('');
                      }}
                      className="px-4 py-2 hover:bg-slate-50 text-sm font-semibold text-slate-755 cursor-pointer flex flex-col gap-0.5 border-b border-slate-50/50 last:border-b-0"
                    >
                      <span className="font-bold text-slate-700">{poc.name}</span>
                      {(poc.email || poc.phone) && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {poc.email} {poc.email && poc.phone ? '•' : ''} {poc.phone}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Miller"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-805 px-3 py-2 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Department
              </label>
              <input
                type="text"
                placeholder="e.g. Procurement"
                value={formPocDepartment}
                onChange={(e) => setFormPocDepartment(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9876543210"
                value={formPhone}
                maxLength={10}
                pattern="\d{10}"
                title="Mobile number must be exactly 10 digits"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormPhone(val);
                }}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. jm@acme.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-76 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Assigned Representative Section */}
        <div>
          <div className="border-b border-slate-200 pb-2 mb-4">
            <h3 className="text-lg font-bold text-gray-800">Representative Assignment</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-4">
              {/* Employee Type Radio Buttons */}
              <div>
                <span className="text-sm font-semibold text-slate-700 mb-2 block">
                  Personnel Category
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="employeeType"
                      value="employee"
                      checked={formEmployeeType === 'employee'}
                      onChange={() => setFormEmployeeType('employee')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Employee</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="employeeType"
                      value="contract"
                      checked={formEmployeeType === 'contract'}
                      onChange={() => setFormEmployeeType('contract')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Contract Employee</span>
                  </label>
                </div>
              </div>

              {/* Dropdown list of personnel */}
              <div className="relative" ref={representativeDropdownRef}>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                  Select Representative <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Search by ID or name..."
                  value={representativeSearch}
                  onFocus={() => {
                    setIsRepresentativeDropdownOpen(true);
                    setRepresentativeSearch('');
                  }}
                  onChange={(e) => {
                    setRepresentativeSearch(e.target.value);
                    setIsRepresentativeDropdownOpen(true);
                  }}
                  className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors cursor-pointer font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
                />

                {isRepresentativeDropdownOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1">
                    {filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setFormEmployeeSelectedId(emp.id);
                            setRepresentativeSearch(emp.name);
                            setIsRepresentativeDropdownOpen(false);
                          }}
                          className={`px-4 py-2 hover:bg-slate-50 text-sm font-semibold text-slate-755 cursor-pointer flex flex-col gap-0.5 border-b border-slate-50/50 last:border-b-0 ${
                            formEmployeeSelectedId === emp.id ? 'bg-[#004475]/5 text-[#004475]' : ''
                          }`}
                        >
                          <span className="font-bold">
                            {emp.name} {emp.empId ? `(${emp.empId})` : emp.contractEmpId ? `(${emp.contractEmpId})` : `(${emp.id})`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {emp.role} • {emp.department}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-slate-400 font-medium">
                        No personnel found matching "{representativeSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Textarea displaying employee details */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Selected Representative Profile (Auto-populated)
              </label>
              <textarea
                readOnly
                rows={4}
                value={formEmployeeDetailsText}
                placeholder="Profile details will show here once selected..."
                className="w-full bg-slate-50 border border-slate-300 text-sm font-mono text-slate-600 p-3 rounded-lg focus:outline-hidden resize-none cursor-not-allowed shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Lead Date & Time Section */}
        <div>
          <div className="border-b border-slate-200 pb-2 mb-4">
            <h3 className="text-lg font-bold text-gray-800">Lead Creation Date & Time</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                disabled={modalMode === 'edit' || modalMode === 'view' || modalMode === 'editActivity'}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors cursor-pointer font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                disabled={modalMode === 'edit' || modalMode === 'view' || modalMode === 'editActivity'}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors cursor-pointer font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
          </div>
        </div>
        {/* Reminder Section */}
        <div className="mt-6">
          <div className="border-b border-slate-200 pb-2 mb-4">
            <h3 className="text-lg font-bold text-gray-800">Reminder</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="relative" ref={reminderDropdownRef}>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Name
              </label>
              <input
                type="text"
                placeholder="e.g. Johnathan"
                value={formReminderName}
                onFocus={() => setIsReminderDropdownOpen(true)}
                onChange={(e) => {
                  setFormReminderName(e.target.value);
                  setIsReminderDropdownOpen(true);
                }}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />

              {isReminderDropdownOpen && filteredReminderPocSuggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1">
                  {filteredReminderPocSuggestions.map((poc, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFormReminderName(poc.name);
                        setIsReminderDropdownOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-slate-50 text-sm font-semibold text-slate-755 cursor-pointer flex flex-col gap-0.5 border-b border-slate-50/50 last:border-b-0"
                    >
                      <span className="font-bold text-slate-700">{poc.name}</span>
                      {(poc.email || poc.phone) && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {poc.email} {poc.email && poc.phone ? '•' : ''} {poc.phone}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Date
              </label>
              <input
                type="date"
                value={formReminderDate}
                onChange={(e) => setFormReminderDate(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-800 px-3 py-2 rounded-lg transition-colors cursor-pointer font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Activity Details / Notes Section */}
        <div>
          <div className="border-b border-slate-200 pb-2 mb-4">
            <h3 className="text-lg font-bold text-gray-800">Activity Details</h3>
          </div>
          <div>
            <textarea
              rows={3}
              placeholder="Log activity details"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-805 p-3 rounded-lg transition-colors placeholder-slate-400 font-medium disabled:bg-slate-50 disabled:text-slate-805 disabled:opacity-100 disabled:border-slate-200"
            />
          </div>
        </div>

        </fieldset>

        {/* Modal Save and Cancel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200">
          {modalMode === 'view' && currentEditingLead ? (
            <div className="flex flex-col gap-y-1 text-[11px] font-bold text-slate-400">
              <span>Created: {formatDateTime(currentEditingLead.createdAt)}{currentEditingLead.createdBy ? ` by ${currentEditingLead.createdBy}` : ''}</span>
              <span>Updated: {formatDateTime(currentEditingLead.updatedAt)}{currentEditingLead.updatedBy ? ` by ${currentEditingLead.updatedBy}` : ''}</span>
            </div>
          ) : (
            <div />
          )}
          <div className="flex justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowAddLeadModal(false)}
              className="px-5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-705 font-bold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {modalMode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {modalMode !== 'view' && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#004475]  text-white font-bold text-sm rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{modalMode === 'edit' ? 'Updating...' : (modalMode === 'logActivity' || modalMode === 'editActivity') ? (modalMode === 'editActivity' ? 'Updating Activity...' : 'Logging...') : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>{modalMode === 'edit' ? 'Update Lead' : modalMode === 'logActivity' ? 'Save Log Activity' : modalMode === 'editActivity' ? 'Update Activity' : 'Save Lead'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </CustomModalForm>
  );
}
