'use client';

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setFontSize } from '../../store/slices/uiSlice';

export default function FontScaleHandler() {
  const dispatch = useDispatch();
  // Safe selector with fallback
  const fontSize = useSelector((state) => state.ui?.fontSize ?? 16);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem('app_font_size');

      if (savedSize) {
        const parsedSize = parseInt(savedSize, 10);
        if (!isNaN(parsedSize)) {
          dispatch(setFontSize(parsedSize));
        }
      }
    } catch (e) {}
  }, [dispatch]);

  // Apply font size to document root
  useEffect(() => {
    // Force application with !important to override any frameworks
    document.documentElement.style.setProperty(
      'font-size',
      `${fontSize}px`,
      'important'
    );
    localStorage.setItem('app_font_size', fontSize);
  }, [fontSize]);

  return null;
}
