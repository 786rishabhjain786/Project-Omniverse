import './globals.css';

export const metadata = {
  title: 'Omniverse Cloud Hub',
  description: 'Full-stack Distributed Media & AI Intelligence System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
