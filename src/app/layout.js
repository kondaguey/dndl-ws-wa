import "./globals.css";
import { Nunito_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Navbar from "../components/marketing/Navbar";
import Footer from "../components/marketing/Footer";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata = {
  title: {
    template: "%s | Dan Lewis",
    default: "Daniel (not Day) Lewis",
  },
  description:
    "Portfolio of sorts and thoughts of Daniel Lewis, Artist and Entrepreneur.",
  icons: {
    icon: "/icon.png", // The file you just added
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${nunito.className} 
          antialiased 
          min-h-screen 
          flex flex-col 
          
          /* --- CREME TO GRAY GRADIENT --- */
          /* 1. Direction: Top to Bottom (bg-gradient-to-b) */
          /* 2. Start: Warm off-white/creme (from-stone-50) */
          /* 3. End: Neutral light gray (to-gray-200) */
          bg-gradient-to-b from-stone-50 via-gray-100 to-gray-200
          
          bg-fixed
          
          /* Dark Slate Text for Contrast */
          text-slate-900
          
          /* Teal Selection Highlight */
          selection:bg-teal-600 selection:text-white
        `}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <div className="flex flex-col min-h-screen relative z-10">
            <Navbar />
            <main className="flex-grow pt-32 md:pt-40">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
