import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Discount On Tools - Digital Products & OTT Subscriptions',
  description: 'Get the best deals on digital subscriptions - Netflix, Spotify, ChatGPT, Canva and more!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
