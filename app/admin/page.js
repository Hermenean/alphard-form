import { Suspense } from 'react';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="notice">Se incarca...</div>}>
      <AdminClient />
    </Suspense>
  );
}
