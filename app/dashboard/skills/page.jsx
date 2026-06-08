'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '../../components/Loader';

export default function SkillsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/hr?tab=skills');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-transparent">
      <Loader label="Redirecting to HR Module..." size="lg" />
    </div>
  );
}
