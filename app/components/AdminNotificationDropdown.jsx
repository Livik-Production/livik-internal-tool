'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LayoutGrid,
  Users,
  FileText,
  Settings,
  Bell,
} from 'lucide-react';
import Image from 'next/image';

const getModuleIcon = (moduleName) => {
  switch (moduleName) {
    case 'Employee':
      return <Users size={16} />;
    case 'Invoice':
      return <FileText size={16} />;
    case 'System':
      return <Settings size={16} />;
    case 'Payroll':
      return <FileText size={16} />;
    default:
      return <LayoutGrid size={16} />;
  }
};

export default function AdminNotificationDropdown({
  notifications,
  onClose,
  onMarkAllRead,
  onViewAll,
  onNotificationClick,
}) {
  const [hoveredModule, setHoveredModule] = useState(null);

  // Group notifications by module (tag)
  const groupedNotifications = useMemo(() => {
    return notifications.reduce((acc, notif) => {
      const moduleName = notif.tag || 'System';
      if (!acc[moduleName]) acc[moduleName] = { unread: 0, items: [] };
      acc[moduleName].items.push(notif);
      if (!notif.isRead) acc[moduleName].unread += 1;
      return acc;
    }, {});
  }, [notifications]);

  const modules = Object.keys(groupedNotifications).sort(
    (a, b) => groupedNotifications[b].unread - groupedNotifications[a].unread
  );

  const activeNotifications = hoveredModule
    ? groupedNotifications[hoveredModule]?.items || []
    : [];

  return (
    <div className="relative flex animate-dashboard-reveal origin-top-right">
      {/* Main Dropdown (Modules List) */}
      <div className="w-[280px] bg-white border border-gray-300 rounded-sm shadow-2xl z-50 relative">
        <div className="p-5 pb-3 border-b border-gray-50 flex items-center justify-between rounded-t-[24px]">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bell size={20} className="text-blue-500" />
            Modules
          </h3>
        </div>

        <div className="py-2">
          {modules.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-sm">All caught up!</p>
              <p className="text-xs mt-1">No pending actions right now.</p>
            </div>
          ) : (
            modules.map((moduleName, idx) => {
              const data = groupedNotifications[moduleName];
              const total = data.items.length;
              const unread = data.unread;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredModule(moduleName)}
                  className={`px-4 py-3 cursor-pointer transition-all duration-200 border-b border-gray-50 last:border-0 relative ${hoveredModule === moduleName ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${unread > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {getModuleIcon(moduleName)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          {moduleName}
                        </h4>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                          {total} notification{total !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                          {unread}
                        </span>
                      )}
                      <ChevronRight
                        size={16}
                        className={`transition-colors ${hoveredModule === moduleName ? 'text-blue-500' : 'text-gray-300'}`}
                      />
                    </div>
                  </div>

                  {/* Side Flyout Panel aligned perfectly with this module */}
                  {hoveredModule === moduleName &&
                    activeNotifications.length > 0 && (
                      <div
                        className="absolute right-[100%] top-0 w-[380px] bg-white border border-gray-300 rounded-sm shadow-2xl overflow-hidden z-50 transition-all duration-300 opacity-100 translate-x-0"
                        onMouseEnter={() => setHoveredModule(hoveredModule)}
                      >
                        <div className="p-4 pb-3 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                          <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                            <span className="text-blue-500">
                              {getModuleIcon(hoveredModule)}
                            </span>
                            {hoveredModule} Actions
                          </h3>
                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {activeNotifications.length} items
                          </span>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto no-scrollbar py-2">
                          {activeNotifications.map((notif, nIdx) => (
                            <div
                              key={nIdx}
                              onClick={() =>
                                onNotificationClick &&
                                onNotificationClick(notif)
                              }
                              className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-50 last:border-0 relative"
                            >
                              <div className="flex gap-4 items-start">
                                <div className="relative">
                                  {notif.avatar ? (
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                                      <Image
                                        src={notif.avatar}
                                        alt="Avatar"
                                        width={40}
                                        height={40}
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                      {notif.icon || <AlertCircle size={18} />}
                                    </div>
                                  )}
                                  {notif.badgeIcon && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                                      {notif.badgeIcon}
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 pr-6">
                                  <h4 className="text-sm font-bold text-gray-900 truncate">
                                    {notif.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {notif.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                      <Clock size={10} />
                                      {notif.time}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {!notif.isRead && (
                                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between rounded-b-[24px]">
          <button
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1.5 px-2 py-1 rounded transition-colors"
          >
            <CheckCircle2 size={14} />
            Mark all read
          </button>
        </div>
      </div>
    </div>
  );
}
