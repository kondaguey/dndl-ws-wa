"use client";

import { useEffect } from "react";
import { createClient } from "../../../../utils/supabase/client";

export default function ViewCounter({ slug }) {
  useEffect(() => {
    const incrementView = async () => {
      // 1. CHECK FOR BOTS
      // This regex looks for common bot names in the user agent string
      const isBot =
        /bot|google|baidu|bing|msn|duckduckgo|teoma|slurp|yandex/i.test(
          navigator.userAgent
        );

      // 2. IF IT IS A BOT, STOP HERE.
      if (isBot) {
        console.log("Bot detected, view not counted.");
        return;
      }

      // 3. IF NOT A BOT, COUNT THE VIEW
      const supabase = createClient();
      await supabase.rpc("increment_view", { page_slug: slug });
    };

    incrementView();
  }, [slug]);

  return null; // This component doesn't render anything visually
}
