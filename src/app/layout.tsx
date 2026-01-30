
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({ subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: "تطبيق التبرعات",
  description: "إدارة مالية ذكية للتبرعات",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Donation App",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/donate.png",
    apple: "/donate.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${vazir.className} bg-gray-50 text-gray-900 antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
