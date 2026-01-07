import "./globals.css";
import { Nunito_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
// You imported Navbar/Footer but didn't use them here.
// That is fine if they are used in your sub-layouts (like MarketingLayout).

const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito" });

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
    url: "https://danielnotdaylewis.com",
  },
};

export default function RootLayout({ children }) {
  return (
    // FIX: Added 'data-scroll-behavior="smooth"' to silence the Next.js warning
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link
          rel="preconnect"
          href="https://gpjgvdpicjqrerqqzhyx.supabase.co"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://gpjgvdpicjqrerqqzhyx.supabase.co"
        />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`${nunito.className} antialiased bg-[#fafaf9] md:bg-[linear-gradient(to_bottom_right,#fafaf9,#f0f9f9,#eef2ff)] text-slate-800 selection:bg-teal-200`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
