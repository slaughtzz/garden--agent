import './globals.css';

export const metadata = { title: 'Garden Agent', description: 'A garden tended by an AI agent' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="pixel" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
