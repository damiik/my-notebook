import type { Metadata } from "next";
import { Special_Elite, Crete_Round } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ArticleProvider } from "@/context/ArticleContext";
import { AuthProvider } from "@/context/AuthContext";

// Mononoki font configuration
const mononoki = localFont({
  src: [
    {
      path: "../../public/fonts/mononoki-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/mononoki-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/mononoki-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/mononoki-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-mononoki",
  display: "swap",
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
        className={`${mononoki.variable} ${specialElite.variable} ${creteRound.variable} font-mono antialiased h-screen overflow-hidden`}
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