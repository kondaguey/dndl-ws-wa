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
    template: "%s | Daniel Lewis",
    default: "Daniel (not Day) Lewis",
  },
  description: "A quasi-portfolio.",
  icons: {
    icon: "/icon.png",
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
          
          /* --- DREAMY GLOBAL BACKGROUND --- */
          /* 1. Base color is Stone-50 (Warm/Creamy White) to kill the harshness */
          /* 2. Gradient flows to soft Teal and Indigo hints */
          bg-gradient-to-br from-stone-50 via-teal-50/30 to-indigo-50/30
          
          /* Ensures the gradient covers the whole viewport and doesn't scroll away */
          bg-fixed
          
          /* Dark Slate Text for crisp contrast against the dreamy background */
          text-slate-800
          
          /* Teal Selection Highlight */
          selection:bg-teal-200 selection:text-teal-900
        `}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {/* Note on z-index: 
            This container ensures content sits above the fixed background 
            but keeps the layout flexible.
          */}
          <div className="flex flex-col min-h-screen relative z-10">
            <Navbar />

            {/* The children (Pages) are now responsible for their own top padding 
               (e.g., pt-32) to clear the fixed Navbar. 
            */}
            <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden">
              {children}
            </main>

            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
