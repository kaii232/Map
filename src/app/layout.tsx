import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: { default: "InVEST", template: "%s – InVEST" },
  description:
    "The InVEST team will provide the essential predictive and quantitative understanding of geohazards in Southeast Asia to reduce risk and impacts and to save lives and infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background dark text-neutral-300 antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
