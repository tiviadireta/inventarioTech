import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Inventário VD',
  description: 'Sistema para consulta de inventário, dispositivos móveis e credenciais.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-[#121212] text-zinc-100 min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
