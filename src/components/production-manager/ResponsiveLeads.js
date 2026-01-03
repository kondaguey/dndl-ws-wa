"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../utils/supabase/client";
import {
  MessageCircle,
  Clock,
  ExternalLink,
  MoreHorizontal,
  User,
  Briefcase,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ResponsiveLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    // FIXED: Pointing to the new numbered table
    const { data, error } = await supabase
      .from("1_responsive_leads")
      .select("*")
      .order("days_dormant", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", JSON.stringify(error, null, 2));
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black uppercase text-slate-900">
            Responsive Leads
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {leads.length} Active Conversations
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <MoreHorizontal size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase animate-pulse">
            Checking CRM...
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8 text-slate-300 text-xs font-bold uppercase">
            No leads found
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {lead.full_name?.charAt(0) || "L"}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">
                      {lead.full_name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {lead.company_name}
                    </p>
                  </div>
                </div>
                {lead.days_dormant > 3 && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-black uppercase px-2 py-1 rounded-md">
                    {lead.days_dormant}d Silent
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-3 pl-10">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      lead.status === "active" ? "bg-green-400" : "bg-slate-300"
                    }`}
                  />
                  {lead.last_reply}
                </div>
                <a
                  href={`mailto:${lead.email}`}
                  className="ml-auto text-xs font-black uppercase text-indigo-500 hover:text-indigo-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Reply <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
