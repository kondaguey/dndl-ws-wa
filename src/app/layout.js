import "./globals.css";
import { Nunito_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Navbar from "@/src/components/ui/Navbar"; // Ensure Navbar is imported
import Footer from "@/src/components/ui/Footer"; // Ensure Footer is imported

const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito" });

// 🚨 THIS IS THE FIX FOR "Document doesn't have a <title>"
export const metadata = {
  title: {
    template: "%s | Daniel Lewis",
    default: "Daniel Lewis | Creative",
  },
  description:
    "The creative portfolio and blog of Daniel Lewis, voice actor, writer, and entrepreneur.",
  openGraph: {
    title: "Daniel Lewis",
    description: "Voice Actor & Creative",
    type: "website",
    locale: "en_US",
    url: "https://yourwebsite.com", // Replace with actual URL
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning={true}
        className={`${nunito.className} antialiased bg-[linear-gradient(to_bottom_right,#fafaf9,#f0f9f9,#eef2ff)] text-slate-800 selection:bg-teal-200`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Added Navbar and Footer here so they persist on all pages */}
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
