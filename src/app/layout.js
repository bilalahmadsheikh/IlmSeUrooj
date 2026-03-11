import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "Ilm Se Urooj - Find Your Perfect University in Pakistan",
  description: "Discover universities across Pakistan with our smart matching system. Compare NUST, LUMS, FAST, COMSATS and 24 more. Swipe right on your favorites!",
  keywords: "university Pakistan admission NUST LUMS FAST COMSATS GIKI engineering computer science medical business",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ilmseurooj.com'),
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    siteName: 'Ilm Se Urooj',
    title: 'Ilm Se Urooj — Find Your Perfect University in Pakistan',
    description: 'Smart university matching for Pakistani students. Compare NUST, LUMS, FAST, COMSATS and 24 more. Deadlines, merit calculators, scholarships — all in one place.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ilm Se Urooj — Find Your Perfect University in Pakistan',
    description: 'Smart university matching for Pakistani students. Compare 28 universities, track deadlines, calculate merit.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
