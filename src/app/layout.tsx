import type { Metadata } from 'next';
import { DemoProvider } from '@/components/provider';
import '@fontsource-variable/inter';
import 'katex/dist/katex.min.css';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/icon.svg' },
  title: 'Axiom — A clearer path to your potential',
  description:
    'A focused TMUA and ESAT revision workspace. Practice with purpose, build your study plan and understand your progress.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
