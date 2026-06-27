'use client';

import React, { useState } from 'react';
import {
  User,
  Settings,
  Zap,
  FlaskConical,
  Megaphone,
  LogOut,
  Bell,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';

export default function NotificationDropdown({ user, onLogout, onClose }) {
  const [betaEnabled, setBetaEnabled] = useState(false);

  const name = user?.name || 'User';
  const designation = user?.designation || 'Team Member';
  const avatar = user?.photo;
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div className="absolute right-0 mt-3 w-[340px] bg-white border border-gray-100 rounded-[24px] shadow-2xl z-50 overflow-hidden animate-dashboard-reveal origin-top-right">
      {/* Profile Header */}
      <div className="p-6 pb-4 flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gray-50 flex-shrink-0 flex items-center justify-center bg-[#004475] text-white">
          {avatar && !avatarError ? (
            <Image
              src={avatar}
              alt={name}
              fill
              className="object-cover"
              onError={() => setAvatarError(true)}
              unoptimized
            />
          ) : (
            <span className="text-xl font-bold uppercase">
              {name ? name.charAt(0) : '?'}
            </span>
          )}
        </div>
        <div className="overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-500 font-medium truncate">
            {designation}
          </p>
        </div>
      </div>

      <div className="px-3">
        {/* Menu Items */}
        <div className="space-y-1">
          <MenuItem icon={<User size={18} />} label="My Account" />
          <MenuItem icon={<Settings size={18} />} label="Company settings" />
        </div>

        <div className="my-3 border-t border-gray-50 px-2" />

        <div className="my-3 border-t border-gray-50 px-2" />

        <div
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-red-100">
            <LogOut size={18} />
          </div>
          <span className="text-sm font-semibold">Log out</span>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, badge, badgeColor }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
          {icon}
        </div>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {badge && (
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
