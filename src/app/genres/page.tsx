// src/app/genres/page.tsx
"use client";

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  List, PlusCircle, Trash2, Loader, CheckCircle, XCircle
} from 'lucide-react';

// --- Interfaces ---
interface Genre {
  id: number;
  name: string;
}

// --- Styled Components ---
const Container = styled.div`
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  @media (min-width: 1024px) {
    max-width: 1024px;
  }
  padding-top: 2rem;
  padding-bottom: 4rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1.5rem;
  text-align: center;
  @media (min-width: 640px) {
    font-size: 3rem;
  }
`;

const PageSubtitle = styled.p`
  margin-top: 1rem;
  color: ${({ theme }) => theme.subtleText};
  text-align: center;
  max-width: 48rem;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 3rem;
`;

const Message = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.subtleText};
  margin-top: 2rem;
  padding: 2rem;
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 8px;
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
`;

const FormSectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
  padding-bottom: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
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
    border-color: ${({ theme }) => theme.accentColor};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentColor}33;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background: ${({ theme }) => theme.accentGradient};
  color: ${({ theme }) => theme.primaryButtonTextColor};
  border: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const GenreListContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 1rem;
`;

const GenreListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
  &:last-child {
    border-bottom: none;
  }
`;

const GenreName = styled.span`
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
`;

const DeleteButton = styled(Button)`
  background-color: #dc3545; /* Red for delete */
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem; /* Smaller radius for list item button */

  &:hover {
    background-color: #c82333;
  }
`;

const StatusMessage = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SuccessMessage = styled(StatusMessage)`
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
`;

const ErrorMessage = styled(StatusMessage)`
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
`;


const GenresPage: NextPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const theme = useTheme();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [newGenreName, setNewGenreName] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [actionLoading, setActionLoading] = useState(false);


  const fetchGenres = async () => {
    if (!user) return; // Wait for user to be loaded

    try {
      const idToken = await user.getIdTokenResult();
      if (!idToken.claims.admin) {
        setStatus('unauthorized');
        setErrorMessage('You do not have administrative privileges to view this page.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/genres`, {
        headers: {
          'Authorization': `Bearer ${idToken.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: Genre[] = await response.json();
      setGenres(data);
      setStatus('success');
    } catch (error: any) {
      console.error('Error fetching genres:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to load genres.');
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login'); // Redirect to login if not authenticated
      } else {
        fetchGenres();
      }
    }
  }, [user, loading, router]);

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    setActionStatus('idle');
    if (!newGenreName.trim()) {
      setActionMessage('Genre name cannot be empty.');
      setActionStatus('error');
      return;
    }
    if (!user || actionLoading) return;

    setActionLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/genres`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newGenreName.trim() }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to add genre.');
      }

      setActionMessage('Genre added successfully!');
      setActionStatus('success');
      setNewGenreName('');
      fetchGenres(); // Refresh list
    } catch (error: any) {
      console.error('Add genre error:', error);
      setActionMessage(error.message || 'Failed to add genre.');
      setActionStatus('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGenre = async (genreId: number) => {
    if (!user || actionLoading) return;

    if (!window.confirm('Are you sure you want to delete this genre? This will remove it from all associated albums.')) {
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    setActionStatus('idle');
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/genres/${genreId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete genre.');
      }

      setActionMessage('Genre deleted successfully!');
      setActionStatus('success');
      fetchGenres(); // Refresh list
    } catch (error: any) {
      console.error('Delete genre error:', error);
      setActionMessage(error.message || 'Failed to delete genre.');
      setActionStatus('error');
    } finally {
      setActionLoading(false);
    }
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <Message>Loading genres...</Message>;
    }
    if (status === 'unauthorized') {
      return <Message style={{ color: '#dc3545', borderColor: '#dc3545' }}>{errorMessage}</Message>;
    }
    if (status === 'error') {
      return <Message style={{ color: '#dc3545', borderColor: '#dc3545' }}>Error: {errorMessage}</Message>;
    }

    return (
      <>
        <Card>
          <FormSectionTitle>Add New Genre</FormSectionTitle>
          <form onSubmit={handleAddGenre}>
            <FormGroup>
              <Label htmlFor="new-genre-name">Genre Name</Label>
              <Input
                type="text"
                id="new-genre-name"
                value={newGenreName}
                onChange={(e) => setNewGenreName(e.target.value)}
                placeholder="e.g., Synthwave"
                required
                disabled={actionLoading}
              />
            </FormGroup>
            <PrimaryButton type="submit" disabled={actionLoading}>
              {actionLoading ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <PlusCircle size={20} />} Add Genre
            </PrimaryButton>
            {actionMessage && actionStatus === 'success' && (
              <SuccessMessage><CheckCircle size={20} /> {actionMessage}</SuccessMessage>
            )}
            {actionMessage && actionStatus === 'error' && (
              <ErrorMessage><XCircle size={20} /> {actionMessage}</ErrorMessage>
            )}
          </form>
        </Card>

        <Card>
          <FormSectionTitle>Existing Genres</FormSectionTitle>
          {genres.length === 0 ? (
            <Message>No genres available. Add some using the form above!</Message>
          ) : (
            <GenreListContainer>
              {genres.map(genre => (
                <GenreListItem key={genre.id}>
                  <GenreName>{genre.name}</GenreName>
                  <DeleteButton onClick={() => handleDeleteGenre(genre.id)} disabled={actionLoading}>
                    <Trash2 size={16} /> Delete
                  </DeleteButton>
                </GenreListItem>
              ))}
            </GenreListContainer>
          )}
        </Card>
      </>
    );
  };

  return (
    <>
      <Head>
        <title>Manage Genres - WaveForum Admin Portal</title>
        <meta name="description" content="Add and remove music genres from the platform." />
      </Head>
      <Container>
        <PageTitle>Manage Genres</PageTitle>
        <PageSubtitle>Control the list of genres available for artists to categorize their music.</PageSubtitle>
        {renderContent()}
      </Container>
    </>
  );
};

export default GenresPage;