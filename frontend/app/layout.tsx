import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ArunCore — All of Arun's Knowledge in one place",
  description:
    "Talk to ArunCore, the high-precision AI agent built by Arun Yadav. Ask me anything about my projects, skills, and experience in AI Systems Engineering.",
  openGraph: {
    title: "ArunCore — AI Digital Twin",
    description: "Talk to my AI directly. Ask about my RAG pipelines, scrapers, and AI projects.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
