import type { Metadata } from "next";
import { Geist, Geist_Mono, Special_Elite, Crete_Round } from "next/font/google";
import "./globals.css";
import { ArticleProvider } from "@/context/ArticleContext";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-special-elite",
});

const creteRound = Crete_Round({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-crete-round",
});

export const metadata: Metadata = {
  title: "MyNotebook - Knowledge Graph",
  description: "Faceted knowledge graph application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${specialElite.variable} ${creteRound.variable} antialiased h-screen overflow-hidden`}
      >
        <AuthProvider>
          <ArticleProvider>
            {children}
          </ArticleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}