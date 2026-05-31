// app/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from '../store/slices/authSlice';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try fetching current user to check session
        const res = await dispatch(fetchCurrentUser());

        if (res.meta.requestStatus === 'fulfilled') {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      } catch (e) {
        router.replace('/login');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, dispatch]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Checking authentication...
      </div>
    );
  }

  return null;
}
