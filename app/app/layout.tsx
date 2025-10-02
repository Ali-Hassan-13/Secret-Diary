import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClientSSR } from "@/lib/supabase-server";
import BrandHeader from "../_components/BrandHeader";
import AppHeader from "./_components/AppHeader";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sb = await createServerClientSSR();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <BrandHeader />
        <AppHeader />
        {children}
      </div>
    </main>
  );
}
