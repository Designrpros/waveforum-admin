// src/app/live-content/page.tsx
"use client";

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle, XCircle, Loader, Music, Image as ImageIcon,
  ChevronDown, ChevronRight, Play, Pause, BookOpen, EyeOff, Edit
} from 'lucide-react';
import Link from 'next/link';

// --- Interfaces to match backend response ---
interface Track {
  id: number;
  title: string;
  track_number: number;
  audioPath: string;
}

interface Album {
  id: number;
  title: string;
  artistName: string;
  artwork: string;
  release_type: 'single' | 'album';
  release_date: string;
  description: string;
  licensing: 'cc' | 'proprietary';
  cc_type?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'unpublished';
  tracks: Track[];
}

// --- Styled Components (reusing from admin portal theme) ---
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

const AlbumListItem = styled.div`
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden; /* For rounded corners on sub-elements */
`;

const AlbumHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  cursor: pointer;
  background-color: ${({ theme }) => theme.cardBg};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.buttonHoverBg};
  }
`;

const ArtworkPreview = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.borderColor};
`;

const AlbumInfo = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const AlbumTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const AlbumSubtitle = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.subtleText};
`;

const AlbumDetails = styled.div`
  padding: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.borderColor};
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DetailRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};

  span {
    font-weight: 600;
    color: ${({ theme }) => theme.subtleText};
  }
`;

const TrackList = styled.div`
  margin-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.borderColor};
  padding-top: 1rem;
`;

const TrackItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
`;

const AudioPlayerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;

  audio {
    width: 100%;
    max-width: 300px; /* Limit player width */
    height: 30px;
  }
`;

const PlayPauseButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.borderColor};
  color: ${({ theme }) => theme.text};
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.buttonHoverBg};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
  border-top: 1px solid ${({ theme }) => theme.borderColor};
  padding-top: 1.5rem;
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

const UnpublishButton = styled(Button)`
  background-color: #ffc107; /* Orange for unpublish */
  color: #343a40; /* Dark text for contrast */
  border: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #e0a800;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

// MODIFIED: EditLink is now a styled Link with conditional styling for disabled state
const EditLink = styled(Link)<{ $disabled?: boolean }>`
  ${Button} /* Inherit base button styles */
  background-color: ${({ theme, $disabled }) => $disabled ? theme.buttonBg : theme.buttonBg};
  color: ${({ theme, $disabled }) => $disabled ? theme.subtleText : theme.text};
  border: 1px solid ${({ theme, $disabled }) => $disabled ? theme.borderColor : theme.borderColor};
  text-decoration: none; /* Remove underline from Link */
  pointer-events: ${({ $disabled }) => $disabled ? 'none' : 'auto'}; /* Disable clicks */
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'}; /* Change cursor */
  opacity: ${({ $disabled }) => $disabled ? 0.6 : 1}; /* Reduce opacity when disabled */

  &:hover {
    background-color: ${({ theme, $disabled }) => $disabled ? theme.buttonBg : theme.buttonHoverBg};
  }
`;


const LiveContentPage: NextPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const theme = useTheme();

  const [approvedAlbums, setApprovedAlbums] = useState<Album[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedAlbumIds, setExpandedAlbumIds] = useState<Set<number>>(new Set());
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [currentPlayingTrackId, setCurrentPlayingTrackId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);


  const fetchApprovedAlbums = async () => {
    if (!user) return;

    try {
      const idToken = await user.getIdTokenResult();
      if (!idToken.claims.admin) {
        setStatus('unauthorized');
        setErrorMessage('You do not have administrative privileges to view this page.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/content/approved`, {
        headers: {
          'Authorization': `Bearer ${idToken.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: Album[] = await response.json();
      setApprovedAlbums(data);
      setStatus('success');
    } catch (error: any) {
      console.error('Error fetching approved albums:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to load approved content.');
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchApprovedAlbums();
      }
    }
  }, [user, loading, router]);

  const toggleAlbumExpansion = (albumId: number) => {
    setExpandedAlbumIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(albumId)) {
        newSet.delete(albumId);
      } else {
        newSet.add(albumId);
      }
      return newSet;
    });
  };

  const handlePlayPause = (track: Track) => {
    if (currentPlayingAudio && currentPlayingTrackId === track.id) {
      currentPlayingAudio.pause();
      setCurrentPlayingAudio(null);
      setCurrentPlayingTrackId(null);
    } else {
      if (currentPlayingAudio) {
        currentPlayingAudio.pause();
      }
      const audio = new Audio(track.audioPath);
      audio.play();
      setCurrentPlayingAudio(audio);
      setCurrentPlayingTrackId(track.id);
      audio.onended = () => {
        setCurrentPlayingAudio(null);
        setCurrentPlayingTrackId(null);
      };
    }
  };

  const handleUnpublish = async (albumId: number, albumTitle: string) => {
    if (!user || actionLoading) return;

    if (!window.confirm(`Are you sure you want to unpublish "${albumTitle}"? It will no longer be visible on Waveform.ink.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/uploads/${albumId}/unpublish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unpublish album.');
      }

      alert('Album unpublished successfully!');
      fetchApprovedAlbums(); // Refresh the list
    } catch (error: any) {
      console.error('Unpublish error:', error);
      alert(`Error unpublishing album: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <Message>Loading approved content...</Message>;
    }
    if (status === 'unauthorized') {
      return <Message style={{ color: '#dc3545', borderColor: '#dc3545' }}>{errorMessage}</Message>;
    }
    if (status === 'error') {
      return <Message style={{ color: '#dc3545', borderColor: '#dc3545' }}>Error: {errorMessage}</Message>;
    }
    if (approvedAlbums.length === 0) {
      return <Message>No approved content found. Approve some pending uploads to see them here!</Message>;
    }

    return (
      <div>
        {approvedAlbums.map(album => (
          <AlbumListItem key={album.id}>
            <AlbumHeader onClick={() => toggleAlbumExpansion(album.id)}>
              <ArtworkPreview src={album.artwork} alt={album.title} />
              <AlbumInfo>
                <AlbumTitle>{album.title} ({album.release_type === 'single' ? 'Single' : 'Album'})</AlbumTitle>
                <AlbumSubtitle>by {album.artistName}</AlbumSubtitle>
                <AlbumSubtitle>Approved: {new Date(album.created_at).toLocaleDateString()}</AlbumSubtitle>
                <AlbumSubtitle>Status: {album.status.charAt(0).toUpperCase() + album.status.slice(1)}</AlbumSubtitle>
              </AlbumInfo>
              {expandedAlbumIds.has(album.id) ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
            </AlbumHeader>

            {expandedAlbumIds.has(album.id) && (
              <AlbumDetails>
                <DetailRow>
                  <span>Release Date:</span> {album.release_date}
                </DetailRow>
                <DetailRow>
                  <span>Description:</span> {album.description || 'No description provided.'}
                </DetailRow>
                <DetailRow>
                  <span>Licensing:</span> {album.licensing === 'cc' ? `Creative Commons (${album.cc_type})` : 'Proprietary'}
                </DetailRow>

                <TrackList>
                  <h4>Tracks:</h4>
                  {album.tracks.length > 0 ? (
                    album.tracks.map(track => (
                      <TrackItem key={track.id}>
                        <Music size={18} /> {track.track_number}. {track.title}
                        <AudioPlayerContainer>
                            <PlayPauseButton onClick={() => handlePlayPause(track)}>
                                {currentPlayingTrackId === track.id ? <Pause size={18} /> : <Play size={18} />}
                            </PlayPauseButton>
                            <audio controls src={track.audioPath} onPlay={() => setCurrentPlayingTrackId(track.id)} onPause={() => setCurrentPlayingTrackId(null)} onEnded={() => setCurrentPlayingTrackId(null)}>
                                Your browser does not support the audio element.
                            </audio>
                        </AudioPlayerContainer>
                      </TrackItem>
                    ))
                  ) : (
                    <p>No tracks found for this release.</p>
                  )}
                </TrackList>

                <ActionButtons>
                  <EditLink href={`/edit-release/${album.id}`} $disabled={actionLoading}> {/* NEW EDIT BUTTON */}
                    <Edit size={20} /> Edit
                  </EditLink>
                  <UnpublishButton onClick={() => handleUnpublish(album.id, album.title)} disabled={actionLoading}>
                    {actionLoading ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <EyeOff size={20} />} Unpublish
                  </UnpublishButton>
                </ActionButtons>
              </AlbumDetails>
            )}
          </AlbumListItem>
        ))}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Live Content - WaveForum Admin Portal</title>
        <meta name="description" content="Manage approved music content on Waveform.ink." />
      </Head>
      <Container>
        <PageTitle>Live Content</PageTitle>
        <PageSubtitle>View and manage all music currently approved and live on the Waveform.ink player.</PageSubtitle>
        {renderContent()}
      </Container>
    </>
  );
};

export default LiveContentPage;