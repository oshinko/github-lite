import "./globals.css";

export const metadata = {
  title: "GitHub Lite",
  description: "Minimal Git hosting and browsing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
