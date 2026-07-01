'use client';

import { useState, useEffect } from 'react';
import CloseButton from '../Buttons/CloseButton';
import TabButton from '../Buttons/TabButton';
import PrimaryButton from '../Buttons/PrimaryButton';
import Button from '../Buttons/Button';
import CustomModalForm from '../CustomModalForm';

export default function ViewForm({
  onClose,
  defaultTab = 'assigned',
  isAssigned,
  assetData,
  employeeData,
  assignmentData,
}) {
  const [viewTab, setViewTab] = useState(defaultTab);

  // Set the default tab when component mounts or defaultTab
  useEffect(() => {
    setViewTab(defaultTab);
  }, [defaultTab]);

  // Use props instead of static data
  const data = {
    employeeId: employeeData?.empId || employeeData?.id || 'N/A',
    employeeName: employeeData?.name || 'N/A',
    email: employeeData?.email || 'N/A',
    phone: employeeData?.phoneNumber || employeeData?.mobile || 'N/A',
    assignmentDate: assignmentData?.assignmentDate
      ? new Date(assignmentData.assignmentDate).toLocaleDateString()
      : 'N/A',
    assignmentNotes: assignmentData?.assignmentNotes || 'No notes available',
    assetTag: assetData?.assetTag || assetData?.tag || 'N/A',
    assetType: assetData?.deviceType || assetData?.type || 'N/A',
    assetModel: assetData?.modelName || assetData?.model || 'N/A',
    assetSerial: assetData?.serialNumber || assetData?.serial || 'N/A',
  };

  const history = assetData?.specs?.assignmentHistory || [];

  const daysAssigned = assignmentData?.assignmentDate
    ? Math.ceil(
        (new Date() - new Date(assignmentData.assignmentDate)) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <CustomModalForm
      open={true}
      onClose={onClose}
      widthClass="max-w-3xl"
      title={
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pr-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Assignment Details
              </h2>
              <p className="text-sm text-gray-600">
                View asset assignment information
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scroll border-b border-gray-200">
            {defaultTab === 'assigned' ? (
              <>
                <TabButton
                  isActive={viewTab === 'assigned'}
                  onClick={() => setViewTab('assigned')}
                >
                  Current Assignment
                </TabButton>
                <TabButton
                  isActive={viewTab === 'unassigned'}
                  onClick={() => setViewTab('unassigned')}
                >
                  Assignment History
                </TabButton>
              </>
            ) : (
              <TabButton isActive={true} onClick={() => {}}>
                Assignment History
              </TabButton>
            )}
          </div>
        </div>
      }
      footer={
        <div className="flex justify-center gap-4 items-center w-full">
          <PrimaryButton onClick={onClose} className="min-w-[100px]">
            Confirm
          </PrimaryButton>
          <Button onClick={onClose} className="min-w-[100px]">
            Cancel
          </Button>
        </div>
      }
    >
      <div className="p-6">
        {viewTab === 'assigned' ? (
          // Assigned Tab - Full details view
          <div className="space-y-6">
            {/* Employee Details */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">
                Employee Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1 text-left">
                      Employee ID
                    </p>
                    <p className="text-sm font-medium text-gray-900 text-left">
                      {data.employeeId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Email ID
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {data.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Full Name
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {data.employeeName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1 text-right">
                      Phone Number
                    </p>
                    <p className="text-sm font-medium text-gray-900 text-right">
                      {data.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Details */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">
                Asset Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1 text-left">
                      Asset Tag
                    </p>
                    <p className="text-sm font-medium text-gray-900 text-left">
                      {data.assetTag}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Type
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {data.assetType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Model
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {data.assetModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1 text-right">
                      Serial
                    </p>
                    <p className="text-sm font-medium text-gray-900 text-right">
                      {data.assetSerial}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">
                Assignment Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 w-fit">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Assignment Date
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {data.assignmentDate} ({daysAssigned} days)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{data.assignmentNotes}</p>
              </div>
            </div>
          </div>
        ) : (
          // Unassigned Tab - Only Assignment History
          <div>
            {/* Assignment History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-900">
                  Assignment History
                </h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded">
                  {history.length} previous assignments
                </span>
              </div>

              <div className="space-y-4">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Assigned to:{' '}
                          {record.assignedTo ||
                            `${record.employeeName} (${record.employeeId})`}
                        </p>
                        <p className="text-xs text-gray-600">
                          Asset: {data.assetTag} - {data.assetModel}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {record.status ||
                          (record.returnedDate ? 'Completed' : 'Active')}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                            From Date
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {record.fromDate ||
                              (record.assignedDate
                                ? new Date(
                                    record.assignedDate
                                  ).toLocaleDateString()
                                : 'N/A')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                            To Date
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {record.toDate ||
                              (record.returnedDate
                                ? new Date(
                                    record.returnedDate
                                  ).toLocaleDateString()
                                : 'Current')}
                            {record.days && ` (${record.days} days)`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(record.notes || record.assignmentNotes) && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-gray-700">
                          {record.notes || record.assignmentNotes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomModalForm>
  );
}
