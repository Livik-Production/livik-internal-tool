'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TabButton from '../../Buttons/TabButton';
import PendingTab from './PendingTab';
import HistoryTab from './HistoryTab';
import HolidayCalenderTab from './HolidayCalenderTab';
import LeaveRequestForm from '../LeaveRequestForm';
import PermissionRequestForm from '../PermissionRequestForm';
import Button from '../../Buttons/Button';

export default function LeaveSection({ initialTab = 'pending' }) {
  const authUser = useSelector((s) => s.auth.user);

  const [activeLeaveTab, setActiveLeaveTab] = useState(initialTab);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (t) => {
    setActiveLeaveTab(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'leave');
    params.set('subtab', t);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setActiveLeaveTab(initialTab);
  }, [initialTab]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [historyLeaves, setHistoryLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFormMode, setLeaveFormMode] = useState('add');
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [permissionFormMode, setPermissionFormMode] = useState('add');
  const [selectedPermission, setSelectedPermission] = useState(null);

  // useEffect removed as logic moved to PendingTab

  const mapLeaveForForm = (leave) => {
    if (leave.isPermission) {
      return {
        id: leave.id,
        date: leave.date,
        startTime: leave.startTime,
        endTime: leave.endTime,
        reason: leave.reason,
        remarks: leave.remarks,
        isPermission: true,
      };
    }
    return {
      id: leave.id,
      type: leave.leaveType?.toLowerCase(),
      from: leave.startDate,
      to: leave.endDate,
      reason: leave.reason,
      document: leave.attachment || null,
      isHalfDay: leave.isHalfDay || false,
      halfDayPeriod: leave.halfDayPeriod || '',
    };
  };

  const fetchLeaves = useCallback(async () => {
    if (!authUser?.id) return;

    setIsLoading(true);
    try {
      const [leaveRes, permRes] = await Promise.all([
        fetch(`/api/leave?employeeId=${authUser.id}`),
        fetch(`/api/permission?employeeId=${authUser.id}`),
      ]);

      if (!leaveRes.ok || !permRes.ok) throw new Error('Failed to fetch data');

      const [leaveData, permData] = await Promise.all([
        leaveRes.json(),
        permRes.json(),
      ]);

      const combined = [
        ...(Array.isArray(leaveData) ? leaveData : []),
        ...(Array.isArray(permData)
          ? permData.map((p) => ({ ...p, isPermission: true }))
          : []),
      ];

      // Sort by creation date or start date
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setPendingLeaves(combined.filter((l) => l.status === 'PENDING'));
      setHistoryLeaves(combined.filter((l) => l.status !== 'PENDING'));
    } catch (e) {
      console.error(e);
      setPendingLeaves([]);
      setHistoryLeaves([]);
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const openAddForm = () => {
    setLeaveFormMode('add');
    setSelectedLeave(null);
    setShowLeaveForm(true);
  };

  const openEditForm = (leave) => {
    setLeaveFormMode('edit');
    setSelectedLeave(leave);
    setShowLeaveForm(true);
  };

  const closeForm = () => {
    setShowLeaveForm(false);
    setSelectedLeave(null);
  };

  const openPermissionForm = (mode = 'add', data = null) => {
    setPermissionFormMode(mode);
    setSelectedPermission(data);
    setShowPermissionForm(true);
  };

  const closePermissionForm = () => {
    setShowPermissionForm(false);
    setSelectedPermission(null);
  };

  const handleSuccess = async () => {
    await fetchLeaves();
    closeForm();
  };

  const handlePermissionSuccess = async () => {
    await fetchLeaves();
    closePermissionForm();
  };

  return (
    <div>
      <div className="flex items-center justify-end"></div>

      <div className="flex space-x-1.5 border-b border-gray-300 mb-2.5 bg-white sticky top-0 z-20 pt-1 overflow-x-auto no-scroll">
        {['pending', 'history', 'holiday'].map((t) => (
          <TabButton
            key={t}
            isActive={activeLeaveTab === t}
            onClick={() => handleTabChange(t)}
          >
            {t === 'pending'
              ? 'Pendings'
              : t === 'history'
                ? 'History'
                : 'Holiday Calendar'}
          </TabButton>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeLeaveTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{
            duration: 0.25,
            ease: 'easeInOut',
          }}
        >
        {activeLeaveTab === 'pending' && (
          <PendingTab
            data={pendingLeaves}
            isLoading={isLoading}
            onView={(item) => {
              if (item.isPermission) {
                setPermissionFormMode('view');
                setSelectedPermission(mapLeaveForForm(item));
                setShowPermissionForm(true);
              } else {
                setLeaveFormMode('view');
                setSelectedLeave(mapLeaveForForm(item));
                setShowLeaveForm(true);
              }
            }}
            onEdit={(item) => {
              if (item.isPermission) {
                setPermissionFormMode('edit');
                setSelectedPermission(mapLeaveForForm(item));
                setShowPermissionForm(true);
              } else {
                setLeaveFormMode('edit');
                setSelectedLeave(mapLeaveForForm(item));
                setShowLeaveForm(true);
              }
            }}
            onDeleteSuccess={fetchLeaves}
            onApplyLeave={openAddForm}
            onApplyPermission={() => openPermissionForm()}
          />
        )}

        {activeLeaveTab === 'history' && (
          <HistoryTab data={historyLeaves} isLoading={isLoading} />
        )}

        {activeLeaveTab === 'holiday' && <HolidayCalenderTab />}
        </motion.div>
      </AnimatePresence>

      {showLeaveForm && (
        <LeaveRequestForm
          mode={leaveFormMode}
          initialData={selectedLeave}
          onSuccess={handleSuccess}
          onClose={closeForm}
        />
      )}

      {showPermissionForm && (
        <PermissionRequestForm
          mode={permissionFormMode}
          initialData={selectedPermission}
          onSuccess={handlePermissionSuccess}
          onClose={closePermissionForm}
        />
      )}
    </div>
  );
}
