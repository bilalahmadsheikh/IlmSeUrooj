import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "UniMatch - Find Your Perfect University in Pakistan",
  description: "Discover universities across Pakistan with our smart matching system. Swipe right on your favorites! Like UCAS, but for Pakistan.",
  keywords: "university, Pakistan, admission, NUST, LUMS, FAST, COMSATS, engineering, computer science",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
