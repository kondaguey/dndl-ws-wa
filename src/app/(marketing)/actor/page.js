"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  Star,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  Mic2,
  FileSignature,
  Zap,
  CheckCircle2,
  Gem,
  Handshake,
  Smartphone,
  Quote,
  Video as VideoIcon,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function ActorPage() {
  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden flex flex-col items-center pb-32">
      {/* =========================================
          1. HERO & ORIGIN STORY
      ========================================= */}
      <section
        id="training"
        className="w-full max-w-[1400px] px-4 md:px-6 pt-12 md:pt-24"
      >
        <div className="relative group rounded-[2.5rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-xl overflow-hidden p-6 md:p-16 flex flex-col lg:flex-row items-center gap-12">
          {/* Ambient Background Orbs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] -z-10 pointer-events-none" />

          {/* HEADSHOT with Spinning Portal Ring */}
          <div className="relative flex-shrink-0 w-72 h-72 md:w-[450px] md:h-[450px]">
            <div className="absolute inset-0 rounded-full border border-teal-500/20 md:border-teal-500/10 scale-110 animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-0 rounded-full border border-indigo-500/20 md:border-indigo-500/10 scale-105 animate-[spin_15s_linear_infinite_reverse]" />

            <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-[6px] border-white">
              <Image
                src="/images/dndl-headshot.webp"
                alt="Daniel Lewis Headshot"
                fill
                className="object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-700"
                priority
              />
            </div>
          </div>

          {/* TEXT CONTENT */}
          <div className="flex-1 text-center md:text-left space-y-8 z-10">
            <h1 className="text-4xl md:text-7xl font-black uppercase leading-[0.9] text-slate-900 tracking-tighter">
              Acting <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">
                Career
              </span>
            </h1>

            <div className="space-y-6 text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
              <p>
                I earned a BFA in Acting from The Theatre School at DePaul a
                year after The Hollywood Reporter ranked us the{" "}
                <a
                  href="https://www.hollywoodreporter.com/news/general-news/top-25-drama-schools-world-558898/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="inline-block border-b-2 border-teal-200 text-teal-900 font-bold">
                    17th best acting school
                  </span>
                </a>{" "}
                in the world. But once I hit the{" "}
                <em>
                  <strong>real world</strong>
                </em>
                , everything changed...
              </p>

              <div className="relative p-8 bg-white/50 rounded-2xl border-l-4 border-teal-400 shadow-sm">
                <p className="italic text-slate-800 text-lg">
                  "You know acting school doesn’t mean anything, right?"
                </p>
                <div className="mt-2 text-xs font-black uppercase tracking-widest text-teal-400">
                  — Some battle-scarred, but also really jaded and perpetually
                  pissed off actor I met at a gym in East LA one time (He was
                  70% right, tho)
                </div>
              </div>

              <p>
                Regardless, I hit the professional scene hard. I signed with
                Chicago’s leading talent agency and earned my SAG card doing
                national theatrical tours, regional commercials, and delivering
                the "hahas" ala a KFC spot. But the industry had other plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          2. STATS BAR
      ========================================= */}
      <section className="w-full max-w-[1200px] px-4 py-12 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <StatCard
            number={100}
            label="Audiobooks"
            suffix="+"
            icon={<BookOpen size={20} />}
          />
          <StatCard
            number={2000}
            label="Positive Reviews"
            suffix="+"
            icon={<Users size={20} />}
          />
          <StatCard
            number={100000}
            label="Listeners"
            suffix="+"
            icon={<Mic2 size={20} />}
          />
          <StatCard
            number={300}
            label="Generated (k)"
            suffix="k+"
            icon={<Gem size={20} />}
          />
        </div>
      </section>

      {/* =========================================
          3. THE PIVOT (POLAROID + TAPE)
      ========================================= */}
      <section id="career" className="w-full max-w-[1100px] px-6 mx-auto mb-24">
        <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-24">
          {/* TEXT SIDE */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100">
              The Pivot
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase leading-none">
              From Screen <br /> to (mostly){" "}
              <span className="text-teal-600">The Mic</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              In 2018, everything changed during a Groundlings improv class when
              my instructor (Flo from Progressive's brother-in-law, fun fact)
              told me during a feedback session:
            </p>
            <p className="text-2xl font-serif italic text-slate-800 bg-gradient-to-r from-teal-50 to-transparent p-6 border-l-4 border-teal-400 rounded-r-xl">
              “You got a really great voice, man.”
            </p>
            <p className="text-slate-500 text-lg font-medium">
              So I pivoted. Since then, I’ve recorded over{" "}
              <strong className="text-slate-900">100 audiobooks</strong> with
              thousands of outstanding reviews (minus the unhinged negative
              ones, which almost all authors and narrators have to put up with,
              btw).
            </p>
          </div>

          {/* POLAROID SIDE - MAXIMALIST TAPE EFFECT */}
          <div className="relative group cursor-pointer perspective-1000 mt-12 md:mt-0">
            {/* THE SCOTCH TAPE */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-white/30 backdrop-blur-[2px] border-l border-r border-white/40 rotate-[-3deg] shadow-sm z-30 pointer-events-none opacity-80 mix-blend-hard-light"></div>

            {/* THE POLAROID CARD */}
            {/* Added 'w-72 mx-auto' to ensure fixed width on mobile */}
            <div className="relative bg-white p-3 pb-16 rounded shadow-[0_20px_50px_rgba(0,0,0,0.15)] rotate-3 group-hover:rotate-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] w-72 md:w-[320px] mx-auto border border-slate-100">
              {/* Image Container */}
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden filter contrast-110">
                <Image
                  src="/images/dndl-website-pd.webp"
                  alt="Chicago PD Role"
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>

              {/* Caption */}
              <div className="absolute bottom-4 left-0 right-0 text-center font-handwriting text-slate-800 opacity-90 font-bold rotate-[-1deg]">
                First TV Appearance
                <br />
                <span className="text-xs font-normal text-slate-500">
                  Chicago P.D.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          4. MEDIA GALLERY (VIDEO + REVIEWS)
      ========================================= */}
      <section
        id="feedback"
        className="w-full max-w-[1400px] px-4 md:px-6 mb-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* LEFT: Praise & Video Container */}
          <div className="relative rounded-[2.5rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-xl p-8 md:p-10 space-y-8 flex flex-col">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase text-slate-900 leading-none">
                  Daniel (not Day) Lewis: Audiobook Actor
                </h2>
                <h3 className="text-teal-600 font-bold uppercase tracking-widest text-[12px] mt-1">
                  Author Testimonials
                </h3>
              </div>
            </div>

            {/* VIDEO PLAYER */}
            <div className="relative group overflow-hidden rounded-[1.5rem] bg-slate-900 shadow-lg aspect-video w-full">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>
              <div className="relative h-full w-full flex items-center justify-center bg-black">
                <div className="absolute top-4 left-4 z-20 bg-white/10 backdrop-blur-md pl-2 pr-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 flex items-center gap-2">
                  <VideoIcon size={12} /> Video Praise
                </div>
                <video
                  key="video-praise"
                  className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                  controls
                  preload="metadata"
                  poster="/images/dndl-praise-poster.webp"
                >
                  <source src="https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/videos/never-far-author-testimonial.mp4.mp4" />
                </video>
              </div>
            </div>

            {/* TESTIMONIALS */}
            <div className="space-y-4 flex-grow">
              <div className="relative p-5 bg-white/50 rounded-2xl border border-white shadow-sm">
                <Quote
                  className="absolute top-4 left-4 text-indigo-200 rotate-180"
                  size={20}
                />
                <p className="relative z-10 text-slate-700 font-serif italic text-sm leading-relaxed pl-6">
                  “Daniel did a fantastic job bringing my books to life in
                  audio. He handled multiple voices seamlessly and delivered a
                  strong, engaging performance. A pleasure to work with from
                  start to finish!”
                </p>
                <div className="mt-2 pl-6 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  — Eva Ashwood, Author
                </div>
              </div>

              <div className="relative p-5 bg-white/50 rounded-2xl border border-white shadow-sm">
                <Quote
                  className="absolute top-4 left-4 text-teal-200 rotate-180"
                  size={20}
                />
                <p className="relative z-10 text-slate-700 font-serif italic text-sm leading-relaxed pl-6">
                  “Fellow authors, If you’re looking for a professional narrator
                  to create your audiobook, you should give strong consideration
                  to working with Daniel Lewis (no, not Daniel Day Lewis). Dan
                  did an outstanding job narrating my last novel Right There in
                  Black and White. It was a true performance... Dan was also a
                  joy to collaborate with—professional, communicative, and
                  genuinely passionate about the craft. If you want your
                  audiobook to resonate with listeners and stand out from the
                  crowd, Dan Lewis is the narrator to trust.”
                </p>
                <div className="mt-2 pl-6 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  — Jim Christ, Author of “Right There in Black and White”
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Book Carousel */}
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-stone-100 to-gray-100 border border-white p-8 flex flex-col justify-between items-center shadow-lg h-full min-h-[600px] overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 z-10 w-full text-center">
              Featured Releases
            </h3>
            <div className="flex-grow flex items-center justify-center w-full py-8">
              <Carousel />
            </div>
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* =========================================
          5. WHY ME GRID
      ========================================= */}
      <section id="whyme" className="w-full max-w-[1200px] px-6 mb-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase text-slate-900 mb-4 tracking-tight">
            Why work with me?
          </h2>
          <p className="text-slate-500 text-xl">
            It's about the business of getting <em>YOUR</em> book done right, on
            time, and without headache.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WhyCard
            icon={<FileSignature size={28} />}
            title="Clear Contract"
            desc="Streamlined process. No ambiguity. Keeps production perfectly on schedule."
          />
          <WhyCard
            icon={<Zap size={28} />}
            title="Smooth Onboarding"
            desc="My 15-minute sample covers tone and character voices others ignore."
          />
          <WhyCard
            icon={<CheckCircle2 size={28} />}
            title="Market-Ready"
            desc="No ACX QC rejections. Files ready for upload on or before schedule."
          />
          <WhyCard
            icon={<Mic2 size={28} />}
            title="Pro Studio"
            desc="Quiet environment, iPad Pro M2, Stellar X2 mic, Izotope RX 11."
          />
          <WhyCard
            icon={<Gem size={28} />}
            title="Fair Rate"
            desc="Refined production process allows for very competitive PFH rates."
          />
          <WhyCard
            icon={<Handshake size={28} />}
            title="Partnerships"
            desc="Long-term deals for series and bundles with bigger savings."
          />
        </div>
      </section>

      {/* =========================================
          6. BOOKING 2.0 / APP TEASER
      ========================================= */}
      <section className="w-full max-w-[1000px] px-6 mb-32">
        <div className="relative overflow-hidden rounded-[3rem] p-1 bg-gradient-to-br from-teal-300 via-indigo-300 to-pink-300 shadow-2xl shadow-indigo-100">
          <div className="bg-white/95 rounded-[2.8rem] p-12 md:p-20 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-white z-10" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl z-0" />

            <div className="relative z-20 flex flex-col items-center">
              {/* Floating Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-3xl flex items-center justify-center mb-8 shadow-xl transform -rotate-6 transition-transform hover:rotate-0 duration-500">
                <Smartphone size={36} />
              </div>

              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-4">
                Booking 2.0 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-500">
                  Smart Calendar
                </span>
              </h2>

              <p className="text-slate-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed font-medium">
                I’ve built a <strong>comprehensive smart scheduler</strong>{" "}
                designed specifically for audio production. It handles solo
                bookings instantly and intelligently routes dual, duet, and
                multi-cast projects to ensure seamless coordination.
              </p>

              <a
                href="/scheduler"
                target="_blank"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-full hover:bg-teal-600 hover:scale-105 hover:shadow-teal-500/20 transition-all shadow-xl"
              >
                Enter Your Project Details Now <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          7. FLOATING AUDIO PLAYER (STICKY)
      ========================================= */}
      <div className="fixed bottom-2 left-2 right-2 md:bottom-6 md:left-4 md:right-4 z-50 flex justify-center pointer-events-none">
        {/* FIX: Increased max-width for desktop (max-w-3xl) to make it wider */}
        <div className="pointer-events-auto w-full max-w-sm md:max-w-3xl">
          <AudioPlayer />
        </div>
      </div>
    </div>
  );
}

/* =========================================
   INTERNAL COMPONENTS
   ========================================= */

function StatCard({ number, label, suffix, icon }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = number / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= number) {
        setCount(number);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [number]);

  const displayCount = Number.isInteger(number)
    ? Math.floor(count).toLocaleString()
    : count.toFixed(1);

  return (
    <div className="group relative bg-white/50 backdrop-blur-sm border border-white/60 rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/5 hover:bg-white/80">
      <div className="mb-3 text-slate-400 group-hover:text-teal-500 transition-colors duration-300 bg-slate-100 p-3 rounded-full group-hover:bg-teal-50">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1 leading-none">
        {displayCount}
        {suffix}
      </div>
      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] group-hover:text-teal-600/70 transition-colors">
        {label}
      </div>
    </div>
  );
}

function Carousel() {
  const slides = [
    {
      img: "/images/dndl-website-little-crush.webp",
      title: "A Little Crush",
      subtitle: "by Kelsie Rae",
      link: "https://www.audible.com/pd/A-Little-Crush-Audiobook/B0FH5JTBXF",
    },
    {
      img: "/images/never-far.png",
      title: "Never Far",
      subtitle: "by A.A. Dark and Alaska Angelini",
      link: "https://www.audible.com/pd/Never-Far-The-Foundation-of-Boston-Marks-Audiobook/B0F6GV9HLR",
    },
    {
      img: "/images/dndl-website-rtibw.webp",
      title: "Right There in Black & White",
      subtitle: "by Jim Christ",
      link: "https://www.amazon.com/Right-There-Black-White-Christ/dp/1958727601",
    },
  ];
  const [current, setCurrent] = useState(0);
  const next = () =>
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prev = () =>
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="relative w-full max-w-[320px] md:max-w-[400px] perspective-1000 z-10">
      <div className="relative aspect-[2/3] rounded-xl shadow-2xl bg-slate-900 border-[6px] border-white overflow-hidden transform transition-transform duration-500 hover:rotate-0 rotate-1">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
              idx === current
                ? "opacity-100 scale-100 z-10 translate-x-0"
                : "opacity-0 scale-95 z-0 translate-x-8"
            }`}
          >
            <Image
              src={slide.img}
              alt={slide.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-100"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white translate-y-2 hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-2xl font-bold leading-none mb-1 shadow-black drop-shadow-md">
                {slide.title}
              </h3>
              <p className="text-slate-300 text-sm mb-6 uppercase tracking-wider">
                {slide.subtitle}
              </p>
              <a
                href={slide.link}
                target="_blank"
                className="block w-full py-4 bg-white text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-teal-400 hover:text-white transition-colors text-center rounded-lg shadow-lg"
              >
                Listen on Audible
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute top-1/2 -left-4 md:-left-16 -translate-y-1/2 flex flex-col gap-4 z-20">
        <button
          onClick={prev}
          className="bg-white text-slate-900 p-4 rounded-full shadow-xl hover:scale-110 hover:text-teal-600 transition-all border border-slate-100"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      <div className="absolute top-1/2 -right-4 md:-right-16 -translate-y-1/2 flex flex-col gap-4 z-20">
        <button
          onClick={next}
          className="bg-white text-slate-900 p-4 rounded-full shadow-xl hover:scale-110 hover:text-teal-600 transition-all border border-slate-100"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

function AudioPlayer() {
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef(null);

  const tracks = [
    {
      title: "Emotional/Angsty",
      src: "/audio/demo_neverfar.mp3",
      explicit: true, // <--- THE FLAG
    },
    {
      title: "M/F Dialogue",
      src: "/audio/demo_filthy_rich_santas_female_dialogue.mp3",
    },

    { title: "Character Interaction", src: "/audio/demo-rtibw-amos-intro.mp3" },
  ];

  // Logic: Select Track & Play
  const playTrack = (src) => {
    if (activeTrack === src) {
      togglePlay();
    } else {
      setActiveTrack(src);
      setIsPlaying(true);
      setTimeout(() => audioRef.current.play(), 50);
    }
  };

  // Logic: Toggle Play/Pause
  const togglePlay = () => {
    if (!activeTrack) {
      playTrack(tracks[0].src);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Logic: Update Progress Bar
  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Logic: Load Duration
  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Logic: Seek
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Helper: Format Time
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Helper: Get Current Track Info
  const currentTrackObj = tracks.find((t) => t.src === activeTrack);
  const currentTitle = currentTrackObj?.title || "Select a Demo";
  const isExplicit = currentTrackObj?.explicit; // Check for flag

  return (
    <div className="bg-white/80 backdrop-blur-xl p-2 md:py-3 md:px-6 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-white/60 ring-1 ring-black/5 animate-fade-in-up">
      {/* Top Row: Play & Progress */}
      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-2">
        <button
          onClick={togglePlay}
          className={`flex-shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
            isPlaying
              ? "bg-teal-500 hover:scale-105 hover:bg-teal-400"
              : "bg-slate-900 hover:scale-105 hover:bg-slate-800"
          }`}
        >
          {isPlaying ? (
            <Pause size={18} className="md:w-6 md:h-6" fill="currentColor" />
          ) : (
            <Play
              size={18}
              className="ml-1 md:w-6 md:h-6"
              fill="currentColor"
            />
          )}
        </button>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-900">
                {currentTitle}
              </span>

              {/* --- WARNING LABEL --- */}
              {isExplicit && (
                <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100 animate-pulse">
                  <AlertCircle size={8} className="text-red-500" />
                  <span className="text-[6px] md:text-[8px] font-black uppercase text-red-500 tracking-wider">
                    Graphic
                  </span>
                </div>
              )}
            </div>

            <span className="text-[9px] font-mono font-medium text-slate-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 md:h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
          />
        </div>
      </div>

      {/* Bottom Row: Track Selectors */}
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {tracks.map((track) => (
          <button
            key={track.src}
            onClick={() => playTrack(track.src)}
            className={`py-1.5 px-1 md:py-2.5 rounded-xl text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1
                 ${
                   activeTrack === track.src
                     ? "bg-teal-50 text-teal-900 border-teal-200 shadow-sm"
                     : "bg-transparent border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                 }
               `}
          >
            {track.title}
            {/* Small red dot on the button itself if explicit */}
            {track.explicit && (
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <audio
        ref={audioRef}
        src={activeTrack}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
function WhyCard({ icon, title, desc }) {
  return (
    <div className="group relative bg-white/40 backdrop-blur-sm border border-white/60 p-8 rounded-3xl text-left transition-all duration-500 hover:-translate-y-2 hover:bg-white/80 hover:shadow-2xl hover:shadow-teal-900/5">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100/30 via-indigo-100/30 to-pink-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl -z-10" />
      <div className="w-14 h-14 mb-6 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm group-hover:scale-110 group-hover:text-indigo-600 transition-all duration-300 border border-slate-100">
        {icon}
      </div>
      <h4 className="font-bold text-xl mb-3 text-slate-900 group-hover:text-teal-900 transition-colors">
        {title}
      </h4>
      <p className="text-slate-500 text-lg leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
}
