import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "בדרך הביתה",
  description: "מעקב יציאות לבני נוער — ההורים יודעים מתי יוצאים ומתי חוזרים",
  manifest: "/baderech-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "בדרך הביתה",
  },
  icons: {
    apple: "/baderech-apple-touch-icon.png",
    icon: "/baderech-icon-192.png",
  },
};

export default function BaderechLayout({ children }: { children: React.ReactNode }) {
  return children;
}
