import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  // Use SERVICE_ROLE_KEY to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Add this to .env.local!
  );

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("start_date", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Handle Updates (Approve/Reject)
export async function PATCH(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const body = await request.json();
  const { id, status } = body;

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);

  return NextResponse.json({ success: !error });
}

// Handle Deletes
export async function DELETE(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const { error } = await supabase.from("bookings").delete().eq("id", id);
  return NextResponse.json({ success: !error });
}
