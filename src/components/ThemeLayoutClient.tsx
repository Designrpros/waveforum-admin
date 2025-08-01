// src/components/ThemeLayoutClient.tsx
"use client";

import { useState, useEffect } from 'react';
import styled, { createGlobalStyle, ThemeProvider, DefaultTheme } from 'styled-components';
import { Header } from './Header';
import { Footer } from './Footer';

// --- Theme Definition for WaveForum Admin Portal (Green Accent) ---
const lightTheme: DefaultTheme = {
  body: '#f8f8f8', // Lighter background
  text: '#212529', // Dark text
  subtleText: '#6c757d', // Muted text
  cardBg: '#ffffff', // White cards
  headerBg: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white header
  borderColor: '#dee2e6', // Light gray border
  buttonBg: '#e9ecef', // Light gray button background
  buttonHoverBg: '#ced4da', // Slightly darker gray on hover
  imageOpacity: '0.8',
  accentGradient: 'linear-gradient(to right, #28a745, #218838)', // Green gradient
  accentColor: '#28a745', // Green accent color
  secondaryButtonBorderColor: '#adb5bd',
  primaryButtonTextColor: '#FFFFFF',
  primaryGreen: '#28a745',
  accentGradientHover: '#218838',
};

const darkTheme: DefaultTheme = {
  body: '#2c3e50', // Dark background
  text: '#ecf0f1', // Light text
  subtleText: '#bdc3c7', // Muted light text
  cardBg: '#34495e', // Darker cards
  headerBg: 'rgba(52, 73, 94, 0.9)', // Slightly transparent dark header
  borderColor: '#495057', // Darker gray border
  buttonBg: '#4f6277', // Dark button background
  buttonHoverBg: '#607d8b', // Lighter dark gray on hover
  imageOpacity: '0.15',
  accentGradient: 'linear-gradient(to right, #2ecc71, #27ae60)', // Lighter green gradient
  accentColor: '#2ecc71', // Lighter green accent color
  secondaryButtonBorderColor: '#6c757d',
  primaryButtonTextColor: '#FFFFFF',
  primaryGreen: '#2ecc71',
  accentGradientHover: '#27ae60',
};

// --- Global Styles ---
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background-color: ${({ theme }) => theme.body} !important;
    color: ${({ theme }) => theme.text} !important;
    transition: background-color 0.3s ease, color 0.3s ease;
    font-family: 'Inter', sans-serif;
  }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 80px; /* Space for a fixed footer if needed */

  /* Layer 1: Admin background image */
  &::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-size: cover;
    background-position: center;
    opacity: ${({ theme }) => theme.imageOpacity};
    z-index: -2;
    transition: opacity 0.5s ease;
  }
`;

interface ThemeLayoutClientProps {
  children: React.ReactNode;
}

export function ThemeLayoutClient({ children }: ThemeLayoutClientProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); 
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setTheme(mediaQuery.matches ? 'dark' : 'light');
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  if (!hasMounted) {
    return null;
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <PageWrapper>
        <Header currentThemeName={theme} toggleTheme={toggleTheme} />
        <main style={{ flexGrow: 1 }}>
          {children}
        </main>
        <Footer />
      </PageWrapper>
    </ThemeProvider>
  );
}