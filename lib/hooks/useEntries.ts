'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

export type EntryListItem = {
  id: string;
  title: string | null;
  mood: string | null;
  created_at: string;
};

export function useEntries() {
  const sb = createClient();

  return useQuery<EntryListItem[]>({
    queryKey: ['entries'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('entries')
        .select('id, title, mood, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}
