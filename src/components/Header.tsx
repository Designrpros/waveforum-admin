// src/components/Header.tsx
"use client";

import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Sun, Moon, Menu, X, LogOut, User as UserIcon, Settings, ListMusic } from 'lucide-react'; // Import ListMusic icon
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../lib/firebase';

// Main header wrapper
const StyledHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  background-color: ${({ theme }) => theme.headerBg};
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
  transition: background-color 0.3s ease;
`;

// Centering container
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1024px;
  margin-left: auto;
  margin-right: auto;
  padding: 1rem 1.5rem;
  gap: 1.5rem;
`;

// Logo styling
const LogoLink = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-decoration: none;
  flex-shrink: 0;
`;

// Container for navigation links on desktop - ALWAYS HIDDEN NOW
const DesktopNav = styled.nav`
  display: none; /* Always hidden */
`;

// Styling for individual desktop nav links (can be removed if DesktopNav is always hidden)
const NavLink = styled(Link)`
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.subtleText};
  text-decoration: none;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

// Container for right-side actions (auth buttons, theme toggle, menu)
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;

// Wrapper for desktop-only auth buttons to hide them on mobile - NOW ALWAYS HIDDEN
const DesktopAuthActions = styled.div`
  display: none; /* Always hidden */
`;

// Define shared styles for action buttons
const actionButtonStyles = css`
  background: none;
  border: 1px solid ${({ theme }) => theme.borderColor};
  color: ${({ theme }) => theme.text};
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.buttonHoverBg};
    border-color: ${({ theme }) => theme.buttonHoverBg};
  }
`;

const ActionButton = styled.button`
  ${actionButtonStyles}
`;

const ActionLink = styled(Link)`
  ${actionButtonStyles}
  text-decoration: none;
`;

const LoginRegisterButton = styled(ActionLink)`
    background-color: ${({ theme }) => theme.accentColor}; // Admin green
    color: ${({ theme }) => theme.primaryButtonTextColor};
    border-color: ${({ theme }) => theme.accentColor};

    &:hover {
      background-color: ${({ theme }) => theme.accentGradientHover}; // Darker green on hover
      border-color: ${({ theme }) => theme.accentGradientHover};
    }
`;

// Theme toggle button
const ThemeToggleButton = styled.button`
  background: transparent;
  border: 1px solid transparent;
  color: ${({ theme }) => theme.subtleText};
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.buttonHoverBg};
    color: ${({ theme }) => theme.text};
  }
`;

// Hamburger menu toggle - NOW ALWAYS DISPLAYED
const MenuToggle = styled.button`
  display: flex; /* Always display */
  background: none;
  border: none;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  z-index: 101;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
`;

// --- Mobile Navigation ---

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  transition: opacity 0.3s ease-in-out;
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
`;

const MobileNav = styled.nav<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 80%;
  max-width: 320px;
  height: 100vh;
  background-color: ${({ theme }) => theme.headerBg};
  padding: 6rem 1.5rem 2rem;
  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '100%')});
  transition: transform 0.3s ease-in-out;
  z-index: 100;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
`;

// Define shared styles for mobile nav items
const mobileNavLinkStyles = css`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-decoration: none;
  padding: 0.75rem 1rem;
  width: 100%;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;

  &:hover {
    background-color: ${({ theme }) => theme.buttonHoverBg};
  }
`;

// Apply styles to Link
const MobileNavLink = styled(Link)`
  ${mobileNavLinkStyles}
`;

// Apply styles to button
const MobileAuthButton = styled.button`
  ${mobileNavLinkStyles}
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
`;

const MobileMenuSeparator = styled.hr`
    width: 100%;
    border: none;
    border-top: 1px solid ${({ theme }) => theme.borderColor};
    margin: 1rem 0;
`;


// --- Component ---

interface HeaderProps {
  currentThemeName: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentThemeName, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleNavLinkClick = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    const auth = getAuth(app);
    try {
      await signOut(auth);
      handleNavLinkClick();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const renderAuthButtons = () => {
    if (loading) return null;
    
    return user ? (
        <>
            <ActionLink href="/settings">
                <UserIcon size={16} /> My Account
            </ActionLink>
            <ActionButton onClick={handleLogout}>
                <LogOut size={16} /> Logout
            </ActionButton>
        </>
    ) : (
        <LoginRegisterButton href="/login">
            Login
        </LoginRegisterButton>
    );
  };
  
  const renderMobileNavLinks = () => {
    if (loading) return null;

    return (
        <>
            <MobileNavLink href="/" onClick={handleNavLinkClick}>Dashboard</MobileNavLink>
            <MobileNavLink href="/pending-uploads" onClick={handleNavLinkClick}>Pending Uploads</MobileNavLink>
            <MobileNavLink href="/live-content" onClick={handleNavLinkClick}>Live Content</MobileNavLink>
            <MobileNavLink href="/users" onClick={handleNavLinkClick}>Users</MobileNavLink>
            <MobileNavLink href="/genres" onClick={handleNavLinkClick}>Genres</MobileNavLink>
            <MobileNavLink href="/playlists" onClick={handleNavLinkClick}>Playlists</MobileNavLink> {/* <-- ADDED */}
            <MobileMenuSeparator/>
            {user ? (
                <>
                    <MobileNavLink href="/settings" onClick={handleNavLinkClick}><Settings size={20} /> Settings</MobileNavLink>
                    <MobileAuthButton onClick={handleLogout}><LogOut size={20} /> Logout</MobileAuthButton>
                </>
            ) : (
                 <MobileNavLink href="/login" onClick={handleNavLinkClick}>Login</MobileNavLink>
            )}
        </>
    );
  }


  return (
    <>
      <StyledHeader>
        <Container>
          <LogoLink href="/" onClick={handleNavLinkClick}>
            Admin Portal
          </LogoLink>

          <DesktopNav>
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/pending-uploads">Pending Uploads</NavLink>
            <NavLink href="/live-content">Live Content</NavLink>
            <NavLink href="/users">Users</NavLink>
            <NavLink href="/genres">Genres</NavLink>
            <NavLink href="/playlists">Playlists</NavLink>
          </DesktopNav>

          <HeaderActions>
            <DesktopAuthActions>
                {renderAuthButtons()}
            </DesktopAuthActions>
            
            <ThemeToggleButton onClick={toggleTheme} aria-label="Toggle theme">
              {currentThemeName === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </ThemeToggleButton>

            <MenuToggle onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </MenuToggle>
          </HeaderActions>
        </Container>
      </StyledHeader>

      <MobileNav $isOpen={isMenuOpen}>
        {renderMobileNavLinks()}
      </MobileNav>

      <Overlay $isOpen={isMenuOpen} onClick={() => setIsMenuOpen(false)} />
    </>
  );
};