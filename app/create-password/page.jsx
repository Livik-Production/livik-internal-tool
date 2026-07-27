import { Suspense } from 'react';
import CreatePasswordClient from './CreatePasswordClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
      <CreatePasswordClient />
    </Suspense>
  );
}
