import React, { useState, useEffect } from 'react';
import { Search, X, SquarePen, Trash, Globe } from 'lucide-react';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';
import CustomTable from '../CustomTable';
import Pagination from '../Pagination';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [companySearchQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil((filteredCompanies || []).length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCompanies = (filteredCompanies || []).slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <div className="space-y-5 [animation-delay:100ms] animate-dashboard-reveal text-left">
      <div className="flex flex-col gap-3 px-1">
        {/* Main Column */}
        <div className="space-y-5 min-w-0">
          {/* Top Bar matching CRMLeadsTab */}
          <div>
            <div className="flex flex-col md:flex-row items-center gap-3 justify-end">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search companies, industry, person..."
                  value={companySearchQuery}
                  onChange={(e) => setCompanySearchQuery(e.target.value)}
                  className="pl-10 text-sm pr-10 py-2 border border-gray-300 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                />

                {companySearchQuery.trim() && (
                  <div className="absolute right-1 top-0.5">
                    <button
                      type="button"
                      onClick={() => setCompanySearchQuery('')}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {canControlCompanies && (
                <div className="flex items-center gap-2">
                  <PrimaryButton onClick={handleAddCompanyClick}>
                    <span className="text-xl mr-1 leading-none">+</span>
                    Add Company
                  </PrimaryButton>
                </div>
              )}
            </div>
          </div>

          {/* Companies Table matching CRMLeadsTab */}
          <div className="bg-white border border-gray-100 rounded-[18px] shadow-sm overflow-hidden">
            <CustomTable
              columns={[
                {
                  key: 'name',
                  label: 'Company Name',
                  render: (company) => (
                    <span
                      className="font-bold text-[#004475] hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCompanyClick(company);
                      }}
                    >
                      {company.name || 'N/A'}
                    </span>
                  ),
                },
                {
                  key: 'industry',
                  label: 'Industry',
                  render: (company) => company.industry || 'N/A',
                },
                {
                  key: 'contactName',
                  label: 'Contact Person',
                  render: (company) => company.contactName || 'N/A',
                },
                {
                  key: 'contactPhone',
                  label: 'Contact Phone',
                  render: (company) => company.contactPhone || 'N/A',
                },
                {
                  key: 'source',
                  label: 'Source',
                  render: (company) => {
                    const rawSource = company.source || 'Referral';
                    const normalizedSource =
                      SOURCE_KEYS.find(
                        (s) => s.toLowerCase() === rawSource.toLowerCase()
                      ) || rawSource;
                    const SourceIcon =
                      SOURCE_META[normalizedSource]?.icon || Globe;
                    return (
                      <div
                        className="flex items-center gap-1.5 justify-center"
                        title={normalizedSource || 'N/A'}
                      >
                        {company.source ? (
                          <span
                            className={`inline-flex items-center justify-center ${SOURCE_META[normalizedSource]?.color || ''}`}
                          >
                            <SourceIcon size={18} />
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: 'website',
                  label: 'Website',
                  render: (company) =>
                    company.website ? (
                      <a
                        href={
                          company.website.startsWith('http')
                            ? company.website
                            : `https://${company.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#004475] hover:underline"
                      >
                        {company.website}
                      </a>
                    ) : (
                      'N/A'
                    ),
                },
                {
                  key: 'city',
                  label: 'City',
                  render: (company) => company.city || 'N/A',
                },
              ]}
              data={paginatedCompanies}
              actions={(company) => (
                <div className="flex items-center justify-end gap-2">
                  {canControlCompanies && (
                    <>
                      <IconButton
                        title="Edit Company"
                        className="text-[#004475] hover:text-[#33a8d9]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCompanyClick(company);
                        }}
                      >
                        <SquarePen size={16} />
                      </IconButton>
                      <IconButton
                        title="Delete Company"
                        className="text-[#004475] hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompanyClick(company);
                        }}
                      >
                        <Trash size={16} />
                      </IconButton>
                    </>
                  )}
                </div>
              )}
              actionsHeader="Actions"
              actionsAlign="center"
              headerAlignment={{
                source: 'center',
                name: 'center',
                industry: 'center',
                contactName: 'center',
                contactPhone: 'center',
                website: 'center',
                city: 'center',
              }}
              cellAlignment={{
                source: 'center',
                name: 'center',
                industry: 'center',
                contactName: 'center',
                contactPhone: 'center',
                website: 'center',
                city: 'center',
              }}
              rowClassName={() => 'group hover:bg-[#f8fafc] transition-colors h-14'}
            />

            {/* Pagination Footer */}
            <div>
              <Pagination
                currentPage={safePage}
                totalItems={(filteredCompanies || []).length}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setPageSize}
                rowsPerPageOptions={[10, 20, 50, 100]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
