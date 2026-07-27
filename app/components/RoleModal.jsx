'use client';
import CustomModalForm from './CustomModalForm';

/* ---------- RIGHTS GROUPS (Mock, replace with DB later) ---------- */
export const RIGHTS_GROUPS = [
  {
    group: 'Configuration Rights',
    items: [
      'Department & Designation',
      'Roles & Rights',
      'General Config',
      'Leave Config',
      'Holiday Config',
    ],
  },
  {
    group: 'Employee Rights',
    items: [
      'Suspend Employee',
      'View Logs Employee',
      'Bulk Upload Data Employee',
      'Approve Face Re-register',
      'Modify Logs',
      'Add/Update Employee',
      'View Employee List',
      'Shift Management',
      'Live Tracking',
      'Organization Chart',
      'Terminate Employee',
    ],
  },
  {
    group: 'General Rights',
    items: [
      'Stats',
      'Create Broadcast',
      'View Timesheets',
      'Download Timesheets',
      'E-Locker',
      'Manage Task',
      'Manage Lead',
      'Manage Assign Lead',
    ],
  },
  {
    group: 'Leave Rights',
    items: ['Create Types Leave', 'Assign Leave', 'Approve Leave'],
  },
  {
    group: 'Location Rights',
    items: ['Reset Fence Radius', 'Add Fence Admin', 'Face Device'],
  },
  {
    group: 'Report Rights',
    items: ['Attendance Report', 'Logs Report', 'Leave Report'],
  },
];

/* ---------- MODAL ---------- */
export default function RoleModal({
  open,
  mode = 'add', // add | edit
  roleName,
  setRoleName,
  selectedRights,
  setSelectedRights,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  const toggleRight = (right) => {
    setSelectedRights((prev) =>
      prev.includes(right) ? prev.filter((r) => r !== right) : [...prev, right]
    );
  };

  const renderFooter = (
    <div className="flex justify-end gap-3 w-full">
      <button
        onClick={onClose}
        className="px-5 py-2 rounded-md border text-sm hover:bg-gray-50 transition-colors font-medium text-gray-700"
      >
        CANCEL
      </button>
      <button
        onClick={onConfirm}
        className="px-6 py-2 rounded-md bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm"
      >
        CONFIRM
      </button>
    </div>
  );

  return (
    <CustomModalForm
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Role' : 'Add Role'}
      footer={renderFooter}
      widthClass="max-w-6xl"
    >
      <div className="p-6">
        {/* Role Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter role name"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
          />
        </div>

        {/* Rights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RIGHTS_GROUPS.map((group) => (
            <div key={group.group} className="space-y-4">
              <div className="font-bold text-gray-900 border-b border-gray-100 pb-2">{group.group}</div>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-3 text-sm cursor-pointer group"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedRights.includes(item)}
                        onChange={() => toggleRight(item)}
                        className="peer h-4 w-4 cursor-pointer accent-blue-600 rounded border-gray-300 transition-all"
                      />
                    </div>
                    <span className="text-gray-600 group-hover:text-blue-600 transition-colors">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CustomModalForm>
  );
}
