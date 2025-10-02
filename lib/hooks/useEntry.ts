'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

export type Entry = {
  id: string;
  title: string | null;
  body: string | null;
  mood: string | null;
  created_at: string;
  image_url: string | null; // ⬅️ added
};

export function useEntry(id?: string) {
  const sb = createClient();

  return useQuery<Entry>({
    queryKey: ['entry', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await sb
        .from('entries')
        .select('id, title, body, mood, created_at, image_url') // ⬅️ added
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data as Entry;
    },
    refetchOnWindowFocus: false,
  });
}
