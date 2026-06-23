import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/layout/Navbar";
import MainWrapper from "@/components/layout/MainWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eternova — Preserve Your Love Stories",
  description: "A platform to preserve memories, love stories, and meaningful moments forever.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <MainWrapper>
              {children}
            </MainWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
