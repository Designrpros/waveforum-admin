// src/types/styled.d.ts
import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    body: string;
    text: string;
    subtleText: string;
    cardBg: string;
    headerBg: string;
    borderColor: string;
    buttonBg: string;
    buttonHoverBg: string;
    imageOpacity: string;
    accentGradient: string; // Green gradient
    accentColor: string; // Green accent color
    secondaryButtonBorderColor?: string;
    primaryButtonTextColor?: string;
    primaryGreen?: string; // New variable for the admin's primary color
    accentGradientHover?: string;
  }
}