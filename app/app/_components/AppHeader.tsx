'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function AppHeader() {
  const sb = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [sb]);

  const logout = async () => {
    await sb.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-zinc-400">
        {email ? `Signed in as ${email}` : 'Signed in'}
      </div>
      <button
        onClick={logout}
        className="text-sm underline text-zinc-300 hover:text-cyan-400"
      >
        Logout
      </button>
    </div>
  );
}


// 'use client';

// export default function AppHeader() {
//   return <div className="bg-red-500 text-white p-2">LOGOUT PLACEHOLDER</div>;
// }