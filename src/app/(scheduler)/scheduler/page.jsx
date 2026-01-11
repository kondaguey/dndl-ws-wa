// src/app/(scheduler)/scheduler/page.jsx
import { createClient } from "@/src/lib/supabase/server"; // ✅ Using Server Client
import SchedulerClient from "./_components/SchedulerOrchestrator";

const parseLocalDate = (dateString) => {
  if (!dateString) return new Date().getTime();
  const parts = dateString.split("T")[0].split("-");
  return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
};

export default async function SchedulerPage() {
  const supabase = await createClient(); // ✅ Server Side

  // Logic from lines 84-97
  const [requests, bookouts] = await Promise.all([
    supabase
      .from("2_booking_requests")
      .select("start_date, end_date, status")
      // ✅ Your filters, preserved exactly
      .not("status", "in", "(archived,deleted,postponed,cinesonic)"),
    supabase.from("7_bookouts").select("start_date, end_date"),
  ]);

  // Logic from lines 99-118 (Data normalization)
  let allRanges = [];

  if (requests.data) {
    const realRanges = requests.data.map((b) => ({
      start: parseLocalDate(b.start_date),
      end: parseLocalDate(b.end_date),
      status: "booked",
    }));
    allRanges = [...allRanges, ...realRanges];
  }

  if (bookouts.data) {
    const blockedRanges = bookouts.data.map((b) => ({
      start: parseLocalDate(b.start_date),
      end: parseLocalDate(b.end_date),
      status: "booked",
    }));
    allRanges = [...allRanges, ...blockedRanges];
  }

  // Pass data to the Client Manager
  return <SchedulerClient initialBookedRanges={allRanges} />;
}
