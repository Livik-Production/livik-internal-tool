import { Linkedin, Globe, Mail } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export const SOURCE_META = {
  LinkedIn: { icon: Linkedin, color: 'text-[#0a66c2]' },
  Website: { icon: Globe, color: 'text-emerald-600' },
  'Email': { icon: Mail, color: 'text-orange-500' },
  WhatsApp: { icon: FaWhatsapp, color: 'text-[#25D366]' },
};
export const SOURCE_KEYS = Object.keys(SOURCE_META);

export const formatTime24Hours = (timeStr) => {
  if (!timeStr) return '';

  const [hourStr, minStr] = timeStr.split(':');
  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);

  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const formatTimeAMPM = (timeStr) => {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

export const formatDateTime = (dateVal) => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Lead status styling mapper
export const getLeadDesign = (status) => {
  switch (status?.toLowerCase()) {
    case 'qualified':
      return {
        barBg: 'bg-blue-500',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-600',
      };
    case 'contacted':
      return {
        barBg: 'bg-orange-500',
        badgeBg: 'bg-orange-50',
        badgeText: 'text-orange-600',
      };
    case 'won':
      return {
        barBg: 'bg-emerald-500',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-600',
      };
    case 'new':
    case 'lead':
    default:
      return {
        barBg: 'bg-gray-400',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-600',
      };
  }
};

export const CRM_CHART_DATA = [
  { month: 'Jan', percentage: 20, revenue: '₹2.4L' },
  { month: 'Feb', percentage: 45, revenue: '₹5.4L' },
  { month: 'Mar', percentage: 35, revenue: '₹4.2L' },
  { month: 'Apr', percentage: 70, revenue: '₹8.4L' },
  { month: 'May', percentage: 85, revenue: '₹10.2L' },
  { month: 'Jun', percentage: 100, revenue: '₹12.0L' },
];
