// src/app/users/page.tsx
"use client";

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  User as UserIcon, Loader, CheckCircle, XCircle, Ban, Eye, UserCheck, UserX
} from 'lucide-react';
import Link from 'next/link';

// --- Interfaces ---
interface Artist {
  id: number;
  user_id: string; // Firebase UID
  name: string;
  bio: string | null;
  artwork_path: string | null;
  created_at: string;
  status: 'active' | 'banned';
}

// --- Styled Components ---
const Container = styled.div`
  width: 100%; margin-left: auto; margin-right: auto; padding-left: 1.5rem; padding-right: 1.5rem;
  @media (min-width: 1024px) { max-width: 1024px; }
  padding-top: 2rem; padding-bottom: 4rem;
`;
const PageTitle = styled.h1`
  font-size: 2.5rem; font-weight: 700; color: ${({ theme }) => theme.text}; margin-bottom: 1.5rem; text-align: center;
  @media (min-width: 640px) { font-size: 3rem; }
`;
const PageSubtitle = styled.p`
  margin-top: 1rem; color: ${({ theme }) => theme.subtleText}; text-align: center; max-width: 48rem;
  margin-left: auto; margin-right: auto; margin-bottom: 3rem;
`;
const Message = styled.p`
  text-align: center; color: ${({ theme }) => theme.subtleText}; margin-top: 2rem; padding: 2rem;
  background-color: ${({ theme }) => theme.cardBg}; border: 1px solid ${({ theme }) => theme.borderColor}; border-radius: 8px;
`;
const Card = styled.div`
  background-color: ${({ theme }) => theme.cardBg}; border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
`;
const UserListContainer = styled.ul`
  list-style: none; padding: 0; margin-top: 1rem;
`;
const UserListItem = styled.li`
  display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
  &:last-child { border-bottom: none; }
`;
const UserAvatar = styled.img`
  width: 50px; height: 50px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.borderColor};
`;
const UserInfo = styled.div`
  flex-grow: 1; display: flex; flex-direction: column;
`;
const UserName = styled.span`
  font-weight: 600; color: ${({ theme }) => theme.text}; font-size: 1.1rem;
`;
const UserUID = styled.span`
  font-size: 0.85rem; color: ${({ theme }) => theme.subtleText};
`;
const UserStatus = styled.span<{ status: 'active' | 'banned' }>`
  font-size: 0.8rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 0.25rem;
  margin-left: 0.5rem; color: white;
  background-color: ${props => props.status === 'active' ? '#28a745' : '#dc3545'};
`;
const ActionButtonGroup = styled.div`
  display: flex; align-items: center; gap: 0.5rem;
`;
const ActionButton = styled.button`
  background: none; border: 1px solid ${({ theme }) => theme.borderColor};
  color: ${({ theme }) => theme.subtleText}; padding: 0.5rem; width: 36px; height: 36px;
  border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  &:hover { background-color: ${({ theme }) => theme.buttonHoverBg}; color: ${({ theme }) => theme.text}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
const BanButton = styled(ActionButton)`
  border-color: #dc3545; color: #dc3545;
  &:hover { background-color: #dc3545; color: white; }
`;
const ActivateButton = styled(ActionButton)`
  border-color: #28a745; color: #28a745;
  &:hover { background-color: #28a745; color: white; }
`;

const UsersPage: NextPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchArtists = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdTokenResult();
      if (!idToken.claims.admin) {
        setStatus('unauthorized');
        setErrorMessage('You do not have administrative privileges to view this page.');
        return;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${idToken.token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      const data: Artist[] = await response.json();
      setArtists(data);
      setStatus('success');
    } catch (error: any) {
      console.error('Error fetching artists:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to load artists.');
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchArtists();
      }
    }
  }, [user, loading, router]);

  const handleUpdateArtistStatus = async (userId: string, artistName: string, newStatus: 'active' | 'banned') => {
    if (!user || actionLoading) return;
    const confirmMessage = newStatus === 'banned'
      ? `Are you sure you want to BAN the artist "${artistName}" (UID: ${userId})? Their content will be hidden from Waveform.ink.`
      : `Are you sure you want to ACTIVATE the artist "${artistName}" (UID: ${userId})? Their content will become visible again.`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const idToken = await user.getIdToken();
      // CORRECTED: This now points to the correct endpoint with the user's UID.
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${newStatus} user.`);
      }
      alert(`Artist "${artistName}" status updated to "${newStatus}" successfully.`);
      fetchArtists(); // Refresh list
    } catch (error: any) {
      console.error(`Error updating artist status to ${newStatus}:`, error);
      alert(`Error updating artist status: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const renderContent = () => {
    if (status === 'loading') return <Message>Loading users...</Message>;
    if (status === 'unauthorized') return <Message style={{ color: '#dc3545', borderColor: '#dc3545' }}>{errorMessage}</Message>;
    if (status === 'error') return <Message style={{ color: '#dc3545', borderColor: '#dc3545' }}>Error: {errorMessage}</Message>;
    if (artists.length === 0) return <Message>No artists registered yet.</Message>;

    return (
      <Card>
        <UserListContainer>
          {artists.map(artist => (
            <UserListItem key={artist.id}>
              <UserAvatar src={artist.artwork_path || `https://placehold.co/50x50/383434/FFFFFF?text=${artist.name.substring(0,1)}`} alt={artist.name} />
              <UserInfo>
                <UserName>{artist.name} <UserStatus status={artist.status}>{artist.status.charAt(0).toUpperCase() + artist.status.slice(1)}</UserStatus></UserName>
                <UserUID>UID: {artist.user_id}</UserUID>
                {artist.bio && <UserUID>Bio: {artist.bio.substring(0, 50)}{artist.bio.length > 50 ? '...' : ''}</UserUID>}
              </UserInfo>
              <ActionButtonGroup>
                {artist.status === 'active' ? (
                  <BanButton onClick={() => handleUpdateArtistStatus(artist.user_id, artist.name, 'banned')} disabled={actionLoading} title="Ban Artist">
                    <UserX size={18} />
                  </BanButton>
                ) : (
                  <ActivateButton onClick={() => handleUpdateArtistStatus(artist.user_id, artist.name, 'active')} disabled={actionLoading} title="Activate Artist">
                    <UserCheck size={18} />
                  </ActivateButton>
                )}
              </ActionButtonGroup>
            </UserListItem>
          ))}
        </UserListContainer>
      </Card>
    );
  };

  return (
    <>
      <Head>
        <title>Manage Users - WaveForum Admin Portal</title>
        <meta name="description" content="Manage registered artists on the WaveForum platform." />
      </Head>
      <Container>
        <PageTitle>Manage Users</PageTitle>
        <PageSubtitle>View and manage all registered artists on WaveForum. Take actions like banning or activating users.</PageSubtitle>
        {renderContent()}
      </Container>
    </>
  );
};

export default UsersPage;