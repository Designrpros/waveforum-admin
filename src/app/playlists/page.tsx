// src/app/playlists/page.tsx
"use client";

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ListMusic, PlusCircle, Loader, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '../../components/Modal'; // Assuming a reusable Modal component exists

// --- Styled Components ---
const Container = styled.div`
  width: 100%; margin-left: auto; margin-right: auto; padding: 2rem 1.5rem 4rem;
  @media (min-width: 1024px) { max-width: 1024px; }
`;
const PageHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 2rem;
`;
const PageTitle = styled.h1`
  font-size: 2.5rem; font-weight: 700; color: ${({ theme }) => theme.text};
`;
const Button = styled.button`
  display: inline-flex; align-items: center; justify-content: center;
  gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.5rem;
  font-weight: 600; cursor: pointer; transition: all 0.2s ease;
  background: ${({ theme }) => theme.accentGradient};
  color: ${({ theme }) => theme.primaryButtonTextColor};
  border: none;
  &:hover { opacity: 0.9; }
`;
const PlaylistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
`;
const PlaylistCard = styled(Link)`
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.75rem; padding: 1.5rem; text-decoration: none;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; aspect-ratio: 1 / 1;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0,0,0,0.1);
  }
`;
const CardIcon = styled.div`
  color: ${({ theme }) => theme.accentColor}; margin-bottom: 1rem;
`;
const CardTitle = styled.p`
  font-weight: 600; color: ${({ theme }) => theme.text};
`;
const Message = styled.p`
  text-align: center; color: ${({ theme }) => theme.subtleText};
  margin-top: 2rem; padding: 2rem; background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor}; border-radius: 8px;
`;
const Form = styled.form` display: flex; flex-direction: column; gap: 1rem; `;
const Input = styled.input`
  width: 100%; padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.5rem; background-color: ${({ theme }) => theme.buttonBg};
  color: ${({ theme }) => theme.text}; font-size: 1rem;
`;
const Textarea = styled.textarea`
  width: 100%; padding: 0.75rem 1rem; min-height: 80px; resize: vertical;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.5rem; background-color: ${({ theme }) => theme.buttonBg};
  color: ${({ theme }) => theme.text}; font-size: 1rem;
`;
const CheckboxContainer = styled.label`
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.9rem; color: ${({ theme }) => theme.subtleText}; cursor: pointer;
`;

// --- Interfaces ---
interface Playlist {
  id: string;
  name: string;
  artwork?: string;
}

const AdminPlaylistsPage: NextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const fetchPlaylists = async () => {
    if (!user) return;
    setStatus('loading');
    try {
      const idToken = await user.getIdToken();
      // This endpoint fetches playlists for the currently logged-in user (the admin)
      const response = await fetch('http://51.175.105.40:8080/api/playlists', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch playlists.');
      const data = await response.json();
      setPlaylists(data);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchPlaylists();
      }
    }
  }, [user, loading, router]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlaylistName.trim()) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('http://51.175.105.40:8080/api/playlists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDesc,
          isPublic: isPublic,
        }),
      });
      if (!response.ok) throw new Error('Failed to create playlist.');

      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setIsPublic(true);
      setIsCreateModalOpen(false);
      fetchPlaylists(); // Refresh the list
    } catch (error) {
      alert('Error creating playlist. Please try again.');
      console.error(error);
    }
  };

  const renderContent = () => {
    if (status === 'loading') return <Message>Loading playlists...</Message>;
    if (status === 'error') return <Message>Could not load playlists.</Message>;

    return (
      <PlaylistGrid>
        {playlists.map(playlist => (
          <PlaylistCard key={playlist.id} href={`/playlists/${playlist.id}`}>
            {playlist.artwork ? <img src={playlist.artwork} alt={playlist.name} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.75rem'}}/> : <CardIcon><ListMusic size={48} /></CardIcon>}
            <CardTitle>{playlist.name}</CardTitle>
          </PlaylistCard>
        ))}
      </PlaylistGrid>
    );
  };

  return (
    <>
      <Head>
        <title>Manage Playlists - WaveForum Admin</title>
      </Head>
      <Container>
        <PageHeader>
          <PageTitle>Curated Playlists</PageTitle>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle size={20} /> New Playlist
          </Button>
        </PageHeader>
        {playlists.length === 0 && status === 'success' ? (
            <Message>No curated playlists found. Create one to get started!</Message>
        ) : (
            renderContent()
        )}
      </Container>
      
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Curated Playlist"
      >
        <Form onSubmit={handleCreatePlaylist}>
          <Input type="text" placeholder="Playlist Name (e.g., Waveform Weekly)" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} required />
          <Textarea placeholder="A short description for the playlist..." value={newPlaylistDesc} onChange={(e) => setNewPlaylistDesc(e.target.value)} />
          <CheckboxContainer>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Make playlist public (visible to all users)
          </CheckboxContainer>
          <Button type="submit">Create</Button>
        </Form>
      </Modal>
    </>
  );
};

export default AdminPlaylistsPage;