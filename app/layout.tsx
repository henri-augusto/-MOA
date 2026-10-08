import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MOA — Master of Arrangement",
  description:
    "Acervo curado de arranjos e partituras para orquestras, bandas e coros. Adquira arranjos prontos para a estante ou publique suas obras e receba a cada venda.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${jakarta.variable} antialiased`}
    >
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
