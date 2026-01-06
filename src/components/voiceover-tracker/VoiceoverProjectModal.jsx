"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  X,
  Wand2,
  ClipboardPaste,
  Save,
  FileText,
  Megaphone,
  Link as LinkIcon,
  User,
  DollarSign,
  Loader2,
  ArrowLeft,
  Plus,
  Clock,
} from "lucide-react";

const supabase = createClient();

export default function VoiceoverProjectModal({
  isOpen,
  onClose,
  project = null,
  onSave,
}) {
  const [step, setStep] = useState(1);
  const [magicText, setMagicText] = useState("");
  const [formData, setFormData] = useState(initialFormState());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setStep(2);
        setFormData(mapProjectToForm(project));
      } else {
        setStep(1);
        setFormData(initialFormState());
        setMagicText("");
      }
    }
  }, [isOpen, project]);

  function initialFormState() {
    return {
      client_name: "",
      project_title: "",
      role: "",
      audition_link: "",
      file_link: "",
      due_date: "",
      due_time: "17:00",
      notes: "",
      specs: "",
      direction: "",
      status: "inbox",
      rate: "",
    };
  }

  function mapProjectToForm(item) {
    let dDate = "",
      dTime = "17:00";
    if (item.due_date) {
      const d = new Date(item.due_date);
      dDate = d.toISOString().split("T")[0];
      dTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return {
      client_name: item.client_name || "",
      project_title: item.project_title || "",
      role: item.role || "",
      audition_link: item.audition_link || "",
      file_link: item.file_link || "",
      due_date: dDate,
      due_time: dTime,
      notes: item.notes || "",
      specs: item.specs || "",
      direction: item.direction || "",
      status: item.status || "inbox",
      rate: item.rate || "",
    };
  }

  const handleMagicParse = () => {
    if (!magicText) return;

    // DETECT FORMAT
    // IDIOM emails usually start with "Project Name:"
    // ASP Dashboard usually has "Talent Role Information" or "Audition Deadline"
    if (
      magicText.includes("Audition Deadline") ||
      magicText.includes("Talent Role Information")
    ) {
      parseASPBlob();
    } else {
      parseIDIOMBlob();
    }
    setStep(2);
  };

  const parseIDIOMBlob = () => {
    const extract = (l, e) => {
      try {
        return magicText
          .match(new RegExp(`${l}[\\s\\S]*?(${e}|$)`, "i"))[0]
          .replace(new RegExp(l, "i"), "")
          .replace(new RegExp(e, "i"), "")
          .trim();
      } catch (e) {
        return "";
      }
    };

    // Date Logic for Idiom (Example: "Monday, January 6th")
    const dateMatch = magicText.match(/Audition Due Date:\s*\n\s*(.*?)\s*\n/i);
    let d = "",
      t = "17:00";
    if (dateMatch && dateMatch[1]) {
      let clean = dateMatch[1]
        .replace(/\(.*\)/, "")
        .trim()
        .replace(/(\d+)(st|nd|rd|th)/, "$1");
      const obj = new Date(clean);
      if (!isNaN(obj)) {
        d = obj.toISOString().split("T")[0];
        t = `${String(obj.getHours()).padStart(2, "0")}:${String(obj.getMinutes()).padStart(2, "0")}`;
      }
    }

    setFormData((prev) => ({
      ...prev,
      client_name: "IDIOM",
      project_title:
        (magicText.match(/Project Name:\s*\n\s*(.*?)\s*\n/i) ||
          [])[1]?.trim() || "",
      rate:
        (magicText.match(/Intended Rate:\s*\n\s*(.*?)\s*\n/i) ||
          [])[1]?.trim() || "",
      due_date: d,
      due_time: t,
      specs: extract("Talent Specs/Directions:", "Audio/Video Samples"),
      direction: `LABEL: ${extract("Label File:", "Name Slate:")}`,
      notes: `SESSION: ${extract("Session/Shoot Info:", "Conflicts:")}`,
    }));
  };

  // --- REWRITTEN ASP PARSER FOR DASHBOARD FORMAT ---
  const parseASPBlob = () => {
    // Helper to grab text between two strings
    const extract = (startStr, endStr) => {
      try {
        const regex = new RegExp(`${startStr}[\\s\\S]*?(${endStr}|$)`, "i");
        const match = magicText.match(regex);
        if (!match) return "";
        return match[0]
          .replace(new RegExp(startStr, "i"), "")
          .replace(new RegExp(endStr, "i"), "")
          .trim();
      } catch (e) {
        return "";
      }
    };

    // 1. PROJECT TITLE
    // Look for "Project Name" followed by the value
    let title = (magicText.match(/Project Name\s*\n\s*(.*?)\s*\n/i) ||
      [])[1]?.trim();
    // Fallback if "Project Name" isn't found (older format)
    if (!title) {
      title = (magicText.match(/Role\s*\n\s*Role\s*\n\s*(.*?)\s*\n/i) ||
        [])[1]?.trim();
    }

    // 2. ROLE
    // Handles the double "Role\nRole" issue
    const role = (magicText.match(/Role\s*\n(?:\s*Role\s*\n)?\s*(.*?)\s*\n/i) ||
      [])[1]?.trim();

    // 3. DATE
    const dateMatch = magicText.match(/Audition Deadline\s*\n\s*(.*?)\s*\n/i);
    let d = "";
    if (dateMatch) {
      const obj = new Date(dateMatch[1].trim());
      if (!isNaN(obj)) d = obj.toISOString().split("T")[0];
    }

    // 4. TIME
    // Handles "8:00 AM" or "5:00 PM"
    const timeMatch = magicText.match(
      /Audition Due Time \(Pacific\)\s*\n\s*(.*?)\s*\n/i
    );
    let t = "17:00"; // Default
    if (timeMatch) {
      const rawTime = timeMatch[1].trim(); // e.g., "8:00 AM"
      const [timePart, modifier] = rawTime.split(" ");
      let [h, m] = timePart.split(":");

      if (h === "12") h = "00";
      if (modifier === "PM") h = parseInt(h, 10) + 12;

      t = `${String(h).padStart(2, "0")}:${m}`;
    }

    // 5. DIRECTION & LABELING
    // We combine "Direction", "Audition Slate", AND "Audition Upload" (where the file name is)
    const directionSection = extract("Direction", "Audition Slate");
    const slateSection = extract("Audition Slate", "Additional Notes");
    // Capture the file naming instructions at the bottom
    const uploadInstructions = extract("Audition Upload", "Terms of Use"); // or end of string

    const fullDirection = [
      directionSection,
      slateSection ? `SLATE:\n${slateSection}` : null,
      uploadInstructions
        ? `\n----------------\nLABELING & UPLOAD:\n${uploadInstructions}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    setFormData((prev) => ({
      ...prev,
      client_name: "ASP",
      project_title: title || "",
      role: role || "",
      rate: extract("Rate Breakdown", "Media Use"),
      due_date: d,
      due_time: t,
      specs: extract("Specs", "Due"),
      direction: fullDirection,
      notes: extract("Additional Notes", "File Uploads"), // Good for usage terms
    }));
  };

  const handleSave = async () => {
    // 1. Basic Validation
    if (!formData.project_title) {
      alert("Project Title is required.");
      return;
    }

    setLoading(true);

    try {
      // 2. Safe Date Parsing
      let finalTimestamp = null;

      if (formData.due_date) {
        // Combine date and time (default to 17:00 if time is missing)
        const timeStr = formData.due_time || "17:00";
        const dateObj = new Date(`${formData.due_date}T${timeStr}`);

        // Check if date is valid before converting
        if (isNaN(dateObj.getTime())) {
          throw new Error(
            "Invalid Date/Time format. Please check the deadline."
          );
        }

        finalTimestamp = dateObj.toISOString();
      }

      // 3. Prepare Payload
      const payload = {
        ...formData,
        due_date: finalTimestamp,
        due_time: undefined,
      };

      delete payload.due_time;

      let error;

      // 4. Supabase Operation
      if (project?.id) {
        const res = await supabase
          .from("11_voiceover_tracker")
          .update(payload)
          .eq("id", project.id);
        error = res.error;
      } else {
        const res = await supabase
          .from("11_voiceover_tracker")
          .insert([payload]);
        error = res.error;
      }

      if (error) throw error;

      onSave();
      onClose();
    } catch (err) {
      console.error("Save Error:", err);
      alert(err.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0f172a] z-20 shrink-0">
          <h2 className="text-2xl font-black uppercase text-white tracking-wide flex items-center gap-3">
            {step === 1 ? (
              <Wand2 className="text-indigo-400" size={24} />
            ) : project ? (
              <FileText className="text-blue-400" size={24} />
            ) : (
              <Plus className="text-green-400" size={24} />
            )}
            {step === 1
              ? "Magic Sorter"
              : project
                ? "Edit Project"
                : "New Audition"}
          </h2>
          <div className="flex items-center gap-3">
            {step === 2 && !project && (
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold uppercase text-slate-400 hover:text-white px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-all hover:rotate-90"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* STEP 1: MAGIC */}
        {step === 1 && (
          <div className="p-12 text-center flex flex-col h-full bg-[#0f172a]">
            <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse border border-indigo-500/20">
              <Wand2 size={40} />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">
              Let's Get Sorted.
            </h3>
            <p className="text-base font-medium text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
              Paste the text from{" "}
              <span className="text-indigo-400 font-bold">ASP</span> or{" "}
              <span className="text-purple-400 font-bold">IDIOM</span>. I'll
              handle the data entry.
            </p>
            <textarea
              autoFocus
              className="w-full flex-grow min-h-[250px] bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-xs md:text-sm font-mono text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none mb-8 shadow-inner placeholder:text-slate-600 transition-all"
              placeholder="Paste email or dashboard text here..."
              value={magicText}
              onChange={(e) => setMagicText(e.target.value)}
            />
            <div className="flex gap-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-5 rounded-2xl font-bold uppercase text-sm tracking-widest text-slate-400 hover:text-white border-2 border-slate-800 hover:bg-slate-800 transition-all"
              >
                Skip / Manual Entry
              </button>
              <button
                onClick={handleMagicParse}
                disabled={!magicText}
                className="flex-[2] py-5 rounded-2xl font-black uppercase text-sm tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <ClipboardPaste size={18} /> Parse & Create Project
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FORM */}
        {step === 2 && (
          <div className="overflow-y-auto custom-scrollbar p-8 space-y-12 bg-[#0f172a] pb-32">
            {/* 1. LOGISTICS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: Core Info */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="label">Project Title</label>
                  <input
                    className="input text-lg font-black tracking-wide"
                    value={formData.project_title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project_title: e.target.value,
                      })
                    }
                    placeholder="e.g. Nike Fall Campaign"
                  />
                </div>
                <div>
                  <label className="label">Client</label>
                  <div className="relative">
                    <select
                      className="input appearance-none cursor-pointer"
                      value={formData.client_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          client_name: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Client...</option>
                      <option value="ASP">ASP</option>
                      <option value="IDIOM">IDIOM</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      ▼
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">Role Name</label>
                  <div className="relative group">
                    <User
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                    />
                    <input
                      className="input pl-11"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      placeholder="Character Name..."
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Audition Link</label>
                  <div className="relative group">
                    <LinkIcon
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                    />
                    <input
                      className="input pl-11 font-mono text-xs text-blue-300"
                      value={formData.audition_link}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          audition_link: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Files Link</label>
                  <div className="relative group">
                    <LinkIcon
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                    />
                    <input
                      className="input pl-11 font-mono text-xs text-blue-300"
                      value={formData.file_link}
                      onChange={(e) =>
                        setFormData({ ...formData, file_link: e.target.value })
                      }
                      placeholder="Dropbox/Drive..."
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: Time Card */}
              <div className="lg:col-span-4 bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2 text-red-400">
                  <Clock size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Deadline
                  </span>
                </div>
                <div>
                  <label className="label text-slate-400">Due Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label text-slate-400">Time</label>
                  <input
                    type="time"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                    value={formData.due_time}
                    onChange={(e) =>
                      setFormData({ ...formData, due_time: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-slate-800/50" />

            {/* 2. CREATIVE STACK */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <FileText size={20} />
                  </div>
                  <span className="text-sm font-black uppercase text-blue-100 tracking-[0.2em]">
                    Specs & Character
                  </span>
                </div>
                <textarea
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-base text-slate-200 leading-relaxed min-h-[160px] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-600"
                  value={formData.specs}
                  onChange={(e) =>
                    setFormData({ ...formData, specs: e.target.value })
                  }
                  placeholder="Paste character specs, gender, age, tone here..."
                />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <Megaphone size={20} />
                  </div>
                  <span className="text-sm font-black uppercase text-purple-100 tracking-[0.2em]">
                    Direction & Slating
                  </span>
                </div>
                <textarea
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-base text-slate-200 leading-relaxed min-h-[160px] focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-600"
                  value={formData.direction}
                  onChange={(e) =>
                    setFormData({ ...formData, direction: e.target.value })
                  }
                  placeholder="File naming, slate instructions, number of takes..."
                />
              </div>
            </div>

            <div className="w-full h-px bg-slate-800/50" />

            {/* 3. FINANCE STACK */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                  <DollarSign size={20} />
                </div>
                <span className="text-sm font-black uppercase text-green-100 tracking-[0.2em]">
                  Finance & Notes
                </span>
              </div>
              <textarea
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-sm font-mono text-green-100/90 leading-relaxed min-h-[120px] focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all placeholder:text-slate-600"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Rate details, usage terms, session fee..."
              />
            </div>
          </div>
        )}

        {/* FOOTER */}
        {step === 2 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#0f172a] border-t border-slate-800 z-30 flex gap-4 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
            <button
              onClick={onClose}
              className="px-8 py-4 rounded-xl font-bold uppercase text-sm tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-4 bg-white text-black font-black uppercase text-sm tracking-widest rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-wait"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {project ? "Update Project" : "Save to Tracker"}
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
        .label {
          @apply block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2 ml-1;
        }
        .input {
          @apply w-full bg-slate-950 border-2 border-slate-800/80 rounded-xl px-5 py-4 text-white font-bold text-sm outline-none transition-all focus:border-indigo-500 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-700;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
          border: 2px solid #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
