import React from 'react';
import { Search, X, SquarePen, Trash, Globe } from 'lucide-react';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';
import CustomTable from '../CustomTable';
import { SOURCE_META, SOURCE_KEYS } from '../../../utils/crmUtils';

export default function CRMCompaniesTab({
  companySearchQuery,
  setCompanySearchQuery,
  canControlCompanies,
  handleAddCompanyClick,
  handleViewCompanyClick,
  handleEditCompanyClick,
  handleDeleteCompanyClick,
  filteredCompanies,
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Top Bar (Search + Button) */}
      <div className="flex flex-col md:flex-row justify-end items-center gap-3 mb-6">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search companies, industry, person..."
            value={companySearchQuery}
            onChange={(e) => setCompanySearchQuery(e.target.value)}
            className="pl-10 text-sm pr-10 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
          />

          {companySearchQuery.trim() && (
            <button
              type="button"
              onClick={() => setCompanySearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {canControlCompanies && (
          <PrimaryButton onClick={handleAddCompanyClick}>
            <span className="text-xl mr-1 leading-none">+</span>
            Add Company
          </PrimaryButton>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        <CustomTable
          columns={[
            { key: 'name', label: 'Company Name', render: (company) => (
              <span
                className="font-bold text-[#004475] hover:underline cursor-pointer"
                onClick={(e) => { e.stopPropagation(); handleViewCompanyClick(company); }}
              >
                {company.name || 'N/A'}
              </span>
            )},
            { key: 'industry', label: 'Industry', render: (company) => company.industry || 'N/A' },
            { key: 'contactName', label: 'Contact Person', render: (company) => company.contactName || 'N/A' },
            { key: 'contactPhone', label: 'Contact Phone', render: (company) => company.contactPhone || 'N/A' },
            { key: 'source', label: 'Source', render: (company) => {
              const rawSource = company.source || 'Referral';
              const normalizedSource = SOURCE_KEYS.find(s => s.toLowerCase() === rawSource.toLowerCase()) || rawSource;
              const SourceIcon = SOURCE_META[normalizedSource]?.icon || Globe;
              return (
                <div className="flex items-center gap-1.5 justify-center" title={normalizedSource || 'N/A'}>
                  {company.source ? (
                    <span className={`inline-flex items-center justify-center ${SOURCE_META[normalizedSource]?.color || ''}`}>
                     <SourceIcon size={18} />
                    </span>
                  ) : 'N/A'}
                </div>
              );
            }},
            { key: 'website', label: 'Website', render: (company) => company.website ? <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-[#004475] hover:underline">{company.website}</a> : 'N/A' },
            { key: 'city', label: 'City', render: (company) => company.city || 'N/A' },
          ]}
          data={filteredCompanies}
          actions={(company) => (
            <div className="flex items-center justify-end gap-2">
              {canControlCompanies && (
                <>
                  <IconButton title="Edit Company" className="text-[#004475] hover:text-[#33a8d9]" onClick={(e) => { e.stopPropagation(); handleEditCompanyClick(company); }}>
                    <SquarePen size={16} />
                  </IconButton>
                  <IconButton title="Delete Company" className="text-[#004475] hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDeleteCompanyClick(company); }}>
                    <Trash size={16} />
                  </IconButton>
                </>
              )}
            </div>
          )}
          actionsHeader="Actions"
          headerAlignment={{ source: 'center' }}
        />
      </div>
    </div>
  );
}
