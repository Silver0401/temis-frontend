import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temis | Mobile",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="MobileFullViewContainer">{children}</div>;
}
