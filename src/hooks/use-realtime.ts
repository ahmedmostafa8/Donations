"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface RealtimeOptions {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string; // e.g., "id=eq.1"
  onData: (payload: any) => void;
}

export function useRealtime({ table, event = "*", filter, onData }: RealtimeOptions) {
  const router = useRouter();

  useEffect(() => {
    // 1. Create a channel
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        {
          event: event,
          schema: "public",
          table: table,
          filter: filter,
        },
        (payload) => {
          console.log(`⚡ Real-time update from [${table}]:`, payload);
          // 2. Callback
          onData(payload);
          // 3. Refresh server data (Hybrid approach)
          router.refresh();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`✅ Connected to live updates for [${table}]`);
        }
      });

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, router, onData]);
}
