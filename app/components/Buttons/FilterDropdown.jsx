'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

/**
 * Standard FilterDropdown component used across the HR module.
 * It uses createPortal to avoid clipping by parent containers with overflow-hidden.
 */
const FilterDropdown = ({
  options,
  value,
  onChange = () => {},
  placeholder,
  className = '',
  disabled = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideTrigger =
        dropdownRef.current && dropdownRef.current.contains(event.target);
      const clickedInsideList =
        listRef.current && listRef.current.contains(event.target);
      if (!clickedInsideTrigger && !clickedInsideList) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  // Position for the portal
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updateCoords();
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`flex items-center justify-between w-full border rounded-lg px-3 py-2.5 text-sm transition-colors shadow-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          error
            ? 'border-red-400 ring-4 ring-red-500/10'
            : 'border-gray-300 focus:border-blue-500'
        } ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
            : 'bg-white text-gray-900 hover:border-gray-400'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {!disabled && (
          <ChevronDown
            size={14}
            className={`ml-2 text-gray-900 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={listRef}
            className="fixed z-[10000] mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
          >
            <div
              className="max-h-[160px] overflow-y-auto"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    option.disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : value === option.value
                        ? 'bg-blue-50 text-blue-600 font-bold'
                        : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default FilterDropdown;
