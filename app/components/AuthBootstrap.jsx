'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from '../../store/slices/authSlice';

export default function AuthBootstrap({ children }) {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.auth.status);

  useEffect(() => {
    // ✅ Ensures /me is called only once
    if (status === 'idle') {
      dispatch(fetchCurrentUser());
    }
  }, [status, dispatch]);

  return children;
}
