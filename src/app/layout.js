import "./globals.css";
import { Nunito_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";

const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito" });

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunito.className} antialiased bg-[linear-gradient(to_bottom_right,#fafaf9,#f0f9f9,#eef2ff)] text-slate-800 selection:bg-teal-200`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
