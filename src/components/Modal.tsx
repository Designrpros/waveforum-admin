// src/components/Modal.tsx
"use client";

import React from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';

// --- Styled Components ---
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
`;
const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 1rem; padding: 2rem; width: 90%;
  max-width: 500px; position: relative;
`;
const CloseButton = styled.button`
  position: absolute; top: 1rem; right: 1rem; background: none;
  border: none; color: ${({ theme }) => theme.subtleText};
  cursor: pointer; &:hover { color: ${({ theme }) => theme.text}; }
`;
const ModalTitle = styled.h3`
  font-size: 1.5rem; margin-top: 0; margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.text};
`;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}><X /></CloseButton>
        <ModalTitle>{title}</ModalTitle>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
};