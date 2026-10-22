'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CRMMultiSelectDropdown({ label, options, selected, onChange, className = 'w-40' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  };

  const displayLabel = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 bg-white hover:border-gray-400 shadow-sm transition-colors"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={14} className={`ml-2 text-gray-900 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-45 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto py-1">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="w-3.5 h-3.5 rounded border-gray-300 accent-[#004475] cursor-pointer"
                />
                <span className="truncate">{opt}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full text-xs font-bold text-red-500 hover:bg-red-50 py-2 border-t border-gray-100 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
