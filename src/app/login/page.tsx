// src/app/login/page.tsx
"use client";

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../lib/firebase'; // Ensure this path is correct

// --- Styled Components ---
const Container = styled.div`
  max-width: 500px;
  margin: 4rem auto;
  padding: 2rem;
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.25rem;
  text-align: left;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.buttonBg};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accentColor}; /* Green accent */
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentColor}33;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.accentGradient}; /* Green gradient */
  color: ${({ theme }) => theme.primaryButtonTextColor};
  padding: 0.75rem 2rem;
  font-weight: 600;
  font-size: 1.1rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    background: ${({ theme }) => theme.accentGradientHover}; /* Darker green on hover */
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545; /* Red for errors */
  font-size: 0.9rem;
  margin-top: 1rem;
`;

const SuccessMessage = styled.p`
  color: #28a745; /* Green for success */
  font-size: 0.9rem;
  margin-top: 1rem;
`;

const LoginPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth = getAuth(app);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // TODO: After successful login, you MUST verify if the user has the 'admin' custom claim.
      // If not, they should be redirected to an unauthorized page or logged out.
      // This will require fetching the ID token and checking claims.
      router.push('/'); 
    } catch (firebaseError: any) {
      console.error('Auth Error:', firebaseError);
      let errorMessage = 'Invalid email or password. Please try again.';
      if (firebaseError.code.includes('auth/')) {
         errorMessage = 'Invalid email or password. Please try again.';
      }
      setError(errorMessage);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login - WaveForum Admin Portal</title>
        <meta name="description" content="Login to the WaveForum administrative portal." />
      </Head>
      <Container>
        <Title>Admin Login</Title>
        <Form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit">
            Login
          </Button>
        </Form>
      </Container>
    </>
  );
};

export default LoginPage;