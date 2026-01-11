import Link from "next/link";
import { CheckCircle2, Clapperboard, Mail } from "lucide-react";

export default function SuccessMessage({ isCinesonic }) {
  if (isCinesonic) {
    return (
      <div className="w-full max-w-lg bg-indigo-50/90 backdrop-blur-2xl border border-indigo-100 p-12 rounded-[3rem] text-center animate-fade-in-up z-20">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8 text-indigo-600">
          <Clapperboard size={40} />
        </div>
        <h2 className="text-3xl font-black uppercase text-indigo-900 mb-6 tracking-tight">
          CineSonic Request Received
        </h2>
        <p className="text-slate-600 text-base mb-8 font-medium leading-relaxed">
          Multi-voice projects require a tailored approach. I'll reach out via
          email shortly.
        </p>
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm mb-10 flex items-center justify-center gap-3">
          <Mail size={16} className="text-indigo-500" />
          <span className="font-bold text-slate-700 text-sm">
            Keep an eye on your inbox.
          </span>
        </div>
        <Link
          href="/"
          className="inline-block px-10 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-full hover:bg-indigo-700 text-xs shadow-xl"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-white/70 backdrop-blur-2xl border border-white/60 p-12 rounded-[3rem] text-center animate-fade-in-up z-20">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-4xl font-black uppercase text-slate-900 mb-6 tracking-tight">
        Received
      </h2>
      <p className="text-slate-500 text-lg mb-10 font-medium">
        I'll review the details and email you within{" "}
        <strong className="text-slate-900">24 hours</strong>.
      </p>
      <Link
        href="/"
        className="inline-block px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-full hover:bg-teal-600 text-xs shadow-xl"
      >
        Return Home
      </Link>
    </div>
  );
}
