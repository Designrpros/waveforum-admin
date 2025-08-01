// src/components/Footer.tsx
"use client";

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const StyledFooter = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.borderColor};
  background-color: ${({ theme }) => theme.headerBg};
  padding: 2rem 0;
  margin-top: auto; /* Pushes footer to the bottom */
`;

const Container = styled.div`
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  @media (min-width: 1024px) {
    max-width: 1024px;
  }
`;

const FooterContent = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  gap: 1.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    text-align: left;
  }
`;

const FooterText = styled.p`
  color: ${({ theme }) => theme.subtleText};
  font-size: 0.9rem;
`;

const FooterLinks = styled.div`
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
`;

const FooterLink = styled(Link)`
    transition: color 0.2s;
    text-decoration: none;
    color: ${({ theme }) => theme.subtleText};
    font-size: 0.9rem;
    &:hover {
        color: ${({ theme }) => theme.text};
    }
`;

export const Footer: React.FC = () => {
  return (
    <StyledFooter>
      <FooterContent>
        <FooterText>&copy; {new Date().getFullYear()} WaveForum Admin. All rights reserved.</FooterText>
        <FooterLinks>
          <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
          <FooterLink href="/terms-of-service">Terms of Service</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
        </FooterLinks>
      </FooterContent>
    </StyledFooter>
  );
};