// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../app/globals.css"; // Ensure this path is correct relative to this file
import StyledComponentsRegistry from "../lib/registry";
import { ThemeLayoutClient } from '../components/ThemeLayoutClient';
import { AuthProvider } from '../context/AuthContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WaveForum Admin Portal",
  description: "Administrative dashboard for WaveForum content and user management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <AuthProvider>
            <ThemeLayoutClient>
              {children}
            </ThemeLayoutClient>
          </AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}