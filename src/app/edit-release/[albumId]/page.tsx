// src/app/edit-release/[albumId]/page.tsx
"use client";

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useCallback, ChangeEvent, useEffect, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  UploadCloud, Music, Image as ImageIcon,
  Info, CheckCircle, XCircle, Loader, PlusCircle, Trash2, X, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { genreList } from '../../../data/genres';

// --- Interfaces (matching backend response for edit) ---
interface Track {
  id: number | string; // ID can be number (existing) or string (new)
  title: string;
  track_number: number;
  audioPath?: string; // Optional for existing tracks, new ones will have file
  file?: File | null; // For new audio files (only for new tracks, or if replacing existing track by re-adding)
  originalFileName?: string; // To map new files to their metadata on backend
}

interface AlbumDetailsForEdit {
  id: number;
  title: string;
  artistName: string;
  artistUserId: string; // Firebase UID of the artist
  artwork: string; // URL of the existing artwork
  release_type: 'single' | 'album';
  release_date: string;
  description: string;
  licensing: 'cc' | 'proprietary';
  cc_type?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'unpublished';
  rejection_reason?: string | null;
  tracks: Track[];
  genres: string[]; // Array of genre names
}

// --- Styled Components (reusing from admin portal's upload/page.tsx for consistency) ---
const Section = styled.section`
  padding-top: 4rem;
  padding-bottom: 4rem;
  position: relative;
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
  padding-top: 2rem;
  padding-bottom: 4rem;
`;

const BackButton = styled(Link)`
  display: inline-flex; align-items: center; gap: 0.5rem; color: ${({ theme }) => theme.accentColor}; text-decoration: none; font-weight: 500; margin-bottom: 2rem;
  &:hover { color: ${({ theme }) => theme.text}; }
  svg { transition: transform 0.2s; }
  &:hover svg { transform: translateX(-3px); }
`;

const PageTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin-bottom: 1rem;
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


const EditForm = styled.form`
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
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

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.buttonBg};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accentColor};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentColor}33;
  }
`;

const FileDropArea = styled.div<{ $isDragActive: boolean }>`
  border: 2px dashed ${({ theme, $isDragActive }) => $isDragActive ? theme.accentColor : theme.borderColor};
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background-color: ${({ theme, $isDragActive }) => $isDragActive ? theme.buttonHoverBg : theme.buttonBg};
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  &:hover {
    background-color: ${({ theme }) => theme.buttonHoverBg};
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadIconWrapper = styled.div`
  color: ${({ theme }) => theme.subtleText};
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.accentGradient};
  color: ${({ theme }) => theme.primaryButtonTextColor};
  padding: 0.75rem 2rem;
  font-weight: 600;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const MessageContainer = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SuccessMessage = styled(MessageContainer)`
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
`;

const ErrorMessage = styled(MessageContainer)`
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
`;

const InfoMessage = styled(MessageContainer)`
  background-color: #cfe2ff;
  color: #055160;
  border: 1px solid #b6d4fe;
`;

const ArtworkPreview = styled.img`
  max-width: 150px;
  max-height: 150px;
  border-radius: 0.5rem;
  object-fit: cover;
  margin-top: 1rem;
  border: 1px solid ${({ theme }) => theme.borderColor};
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
  cursor: pointer;

  input[type="radio"] {
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid ${({ theme }) => theme.borderColor};
    border-radius: 50%;
    display: grid;
    place-content: center;
    transition: all 0.2s ease;

    &::before {
      content: "";
      width: 0.65rem;
      height: 0.65rem;
      border-radius: 50%;
      transform: scale(0);
      transition: transform 0.2s ease;
      background-color: ${({ theme }) => theme.accentColor};
    }

    &:checked {
      border-color: ${({ theme }) => theme.accentColor};
      &::before {
        transform: scale(1);
      }
    }
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const CheckboxOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.subtleText};
  cursor: pointer;

  input[type="checkbox"] {
    appearance: none;
    width: 1.1rem;
    height: 1.1rem;
    border: 2px solid ${({ theme }) => theme.borderColor};
    border-radius: 0.25rem;
    display: grid;
    place-content: center;
    transition: all 0.2s ease;

    &::before {
      content: "✓";
      font-size: 0.8rem;
      color: white;
      transform: scale(0);
      transition: transform 0.2s ease;
    }

    &:checked {
      background-color: ${({ theme }) => theme.accentColor};
      border-color: ${({ theme }) => theme.accentColor};
      &::before {
        transform: scale(1);
      }
    }
  }
`;

const AddTrackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background-color: ${({ theme }) => theme.buttonBg};
  color: ${({ theme }) => theme.text};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.buttonHoverBg};
  }
`;

const RemoveTrackButton = styled.button`
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(220, 53, 69, 0.1);
  }
`;

const InfoText = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.subtleText};
  margin-top: 0.5rem;
`;

const GenreInputWrapper = styled.div`
  position: relative;
`;

const GenreTagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.5rem;
  min-height: 40px;
`;

const GenreTag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${({ theme }) => theme.buttonBg};
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.9rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.subtleText};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const SuggestionsList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 0.5rem;
  position: absolute;
  width: 100%;
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.5rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
`;

const SuggestionItem = styled.li`
  padding: 0.75rem 1rem;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.buttonHoverBg};
  }
`;


interface EditReleasePageProps {
  params: {
    albumId: string;
  };
}

const EditReleasePage: NextPage<EditReleasePageProps> = ({ params }) => {
  const { albumId } = params;
  const router = useRouter();
  const { user, loading } = useAuth();
  const theme = useTheme();

  const [albumData, setAlbumData] = useState<AlbumDetailsForEdit | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<'idle' | 'success' | 'error'>('idle');


  // Form state (initialized from fetched albumData)
  const [releaseArtistName, setReleaseArtistName] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [releaseType, setReleaseType] = useState<'single' | 'album'>('single');
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [licensing, setLicensing] = useState<'cc' | 'proprietary'>('proprietary');
  const [ccType, setCcType] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreviewUrl, setArtworkPreviewUrl] = useState<string | null>(null);
  const [trackCounter, setTrackCounter] = useState(0);
  const [initialTrackIds, setInitialTrackIds] = useState<Set<number>>(new Set());


  const allGenres = useMemo(() => genreList.flatMap(group => group.options), []);

  useEffect(() => {
    if (genreInput) {
      const filtered = allGenres.filter(
        g => g.toLowerCase().includes(genreInput.toLowerCase()) && !genres.includes(g)
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [genreInput, genres, allGenres]);

  const handleAddGenre = (genre: string) => {
    if (genre && !genres.includes(genre)) {
      setGenres([...genres, genre]);
      setGenreInput('');
      setSuggestions([]);
    }
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setGenres(genres.filter(g => g !== genreToRemove));
  };


  const fetchAlbumDetails = async () => {
    if (!user) return;

    try {
      const idToken = await user.getIdTokenResult();
      if (!idToken.claims.admin) {
        setStatus('unauthorized');
        setErrorMessage('You do not have administrative privileges to view this page.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/albums/${albumId}/edit`, {
        headers: {
          'Authorization': `Bearer ${idToken.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: AlbumDetailsForEdit = await response.json();
      setAlbumData(data);

      // Populate form fields with fetched data
      setReleaseArtistName(data.artistName || '');
      setAlbumTitle(data.title || '');
      setReleaseType(data.release_type || 'single');
      setGenres(data.genres || []);
      setReleaseDate(data.release_date || '');
      setDescription(data.description || '');
      setLicensing(data.licensing || 'proprietary');
      setCcType(data.cc_type || null);
      setArtworkPreviewUrl(data.artwork || null);
      
      const initialTracks = data.tracks.map((track, index) => ({
        ...track,
        id: track.id,
        track_number: track.track_number || (index + 1),
        file: null // Existing tracks don't have a new file initially
      }));
      setTracks(initialTracks);
      setTrackCounter(initialTracks.length);
      setInitialTrackIds(new Set(data.tracks.map(t => t.id as number)));

      setStatus('success');
    } catch (error: any) {
      console.error('Error fetching album details for edit:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to load album details for editing.');
    }
  };

  useEffect(() => {
    if (!loading && albumId) {
      if (!user) {
        router.push('/login');
      } else {
        fetchAlbumDetails();
      }
    }
  }, [user, loading, router, albumId]);

  const handleArtworkFile = (file: File) => {
    setArtworkFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setArtworkPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // This function now only applies to new tracks being added
  const handleTrackFile = (trackId: string | number, file: File) => {
    if (typeof trackId === 'string' && trackId.startsWith('new-track-')) {
        setTracks(prevTracks =>
            prevTracks.map(track =>
                track.id === trackId ? { ...track, file: file, originalFileName: file.name } : track
            )
        );
    } else {
        alert("Audio file replacement for existing tracks is not supported via this edit interface. Please delete the track and re-add it as a new track if you need to update the audio.");
    }
  };

  const handleTrackTitleChange = (trackId: string | number, title: string) => {
    setTracks(prevTracks =>
      prevTracks.map(track =>
        track.id === trackId ? { ...track, title: title } : track
      )
    );
  };

  const addTrack = () => {
    setTrackCounter(prev => prev + 1);
    // New tracks get a string ID and a sequential track_number
    setTracks(prevTracks => [...prevTracks, { id: `new-track-${prevTracks.length + 1}`, title: '', track_number: prevTracks.length + 1, file: null, originalFileName: '' }]);
  };

  const removeTrack = (trackId: string | number) => {
    setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    setActionStatus('idle');
    setIsSaving(true);

    if (!user || !albumData) {
      setActionMessage('You must be logged in and album data must be loaded to update music.');
      setActionStatus('error');
      setIsSaving(false);
      return;
    }

    // Determine which tracks are new and which are to be deleted
    const newTracks = tracks.filter(t => typeof t.id === 'string' && t.file);
    const newTrackFiles = newTracks.map(t => t.file as File);
    
    // Create an array of metadata for new tracks, including originalFileName for backend lookup
    const newTrackMetadata = newTracks.map(t => ({
        id: t.id, // Temporary client-side ID
        title: t.title,
        track_number: t.track_number,
        originalFileName: t.originalFileName // Crucial for backend to link file to metadata
    }));

    const currentTrackIds = new Set(tracks.map(t => typeof t.id === 'number' ? t.id : -1).filter(id => id !== -1));
    const tracksToDelete = Array.from(initialTrackIds).filter(id => !currentTrackIds.has(id));

    // Prepare updated existing tracks (only those whose title or track_number changed)
    const updatedExistingTracks = tracks.filter(t => typeof t.id === 'number' && (
      albumData.tracks.find(original => original.id === t.id)?.title !== t.title ||
      albumData.tracks.find(original => original.id === t.id)?.track_number !== t.track_number
    ));
    
    const formData = new FormData();
    
    // Append metadata
    formData.append('artistName', releaseArtistName);
    formData.append('albumTitle', albumTitle);
    formData.append('releaseType', releaseType);
    formData.append('genres', genres.join(', '));
    formData.append('releaseDate', releaseDate);
    formData.append('description', description);
    formData.append('licensing', licensing);
    if (ccType) formData.append('ccType', ccType);
    
    // Pass current status and rejection reason (as admins can edit these)
    formData.append('status', albumData.status);
    formData.append('rejectionReason', albumData.rejection_reason || '');

    // Append new artwork if selected
    if (artworkFile) {
      formData.append('artwork', artworkFile);
    }

    // Append new track files
    newTrackFiles.forEach(file => {
      formData.append('newTracks', file); // Use 'newTracks' for new files
    });
    // Append metadata for new tracks
    formData.append('newTrackMetadata', JSON.stringify(newTrackMetadata));

    // Append IDs of tracks to delete
    formData.append('tracksToDelete', JSON.stringify(tracksToDelete));

    // Append updated existing tracks' metadata (titles and track numbers)
    formData.append('updatedExistingTracksMetadata', JSON.stringify(updatedExistingTracks));


    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/albums/${albumId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update album.');
      }

      setActionMessage('Album updated successfully!');
      setActionStatus('success');
      // Re-fetch album details to ensure UI reflects latest state
      fetchAlbumDetails(); 
    } catch (error: any) {
      console.error('Album update error:', error);
      setActionMessage(error.message || 'Failed to save changes. Please try again.');
      setActionStatus('error');
    } finally {
      setIsSaving(false);
    }
  };


  const renderContent = () => {
    if (status === 'loading') {
      return <Message>Loading album details...</Message>;
    }
    if (status === 'unauthorized') {
      return <Message style={{ color: '#dc3545', borderColor: '#dc3545' }}>{errorMessage}</Message>;
    }
    if (status === 'error') {
      return <Message style={{ color: '#dc3545', borderColor: '#dc3545' }}>Error: {errorMessage}</Message>;
    }
    if (!albumData) {
        return <Message>Album data not found.</Message>;
    }

    return (
      <EditForm onSubmit={handleSubmit} noValidate>
        <FormSectionTitle>Release Type</FormSectionTitle>
        <FormGroup>
          <RadioGroup>
            <RadioOption>
              <input type="radio" name="release-type" value="single" checked={releaseType === 'single'} onChange={() => setReleaseType('single')} />
              Single (One track release)
            </RadioOption>
            <RadioOption>
              <input type="radio" name="release-type" value="album" checked={releaseType === 'album'} onChange={() => setReleaseType('album')} />
              Album / EP (Multiple tracks)
            </RadioOption>
          </RadioGroup>
        </FormGroup>

        <FormSectionTitle>General Release Details</FormSectionTitle>
        <FormGroup>
          <Label htmlFor="release-artist-name">Artist Name(s)</Label>
          <Input type="text" id="release-artist-name" value={releaseArtistName} onChange={(e) => setReleaseArtistName(e.target.value)} placeholder="e.g., Aurora Bloom" required />
        </FormGroup>
        {releaseType === 'album' && (
          <FormGroup>
            <Label htmlFor="album-title">Album Title</Label>
            <Input type="text" id="album-title" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} placeholder="e.g., Celestial Harmonies" required={releaseType === 'album'} />
          </FormGroup>
        )}
        
        <FormGroup>
          <Label htmlFor="genres">Genres</Label>
          <GenreInputWrapper>
            <Input
              type="text"
              id="genres"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && suggestions.length > 0) {
                  e.preventDefault();
                  handleAddGenre(suggestions[0]);
                }
              }}
              placeholder="Type to search for genres..."
            />
            {suggestions.length > 0 && (
              <SuggestionsList>
                {suggestions.map(s => (
                  <SuggestionItem key={s} onClick={() => handleAddGenre(s)}>
                    {s}
                  </SuggestionItem>
                ))}
              </SuggestionsList>
            )}
          </GenreInputWrapper>
          <GenreTagContainer>
            {genres.map(g => (
              <GenreTag key={g}>
                {g}
                <RemoveTagButton type="button" onClick={() => handleRemoveGenre(g)}>
                  <X size={14} />
                </RemoveTagButton>
              </GenreTag>
            ))}
          </GenreTagContainer>
          <InfoText>Select one or more genres for your release.</InfoText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="release-date">Release Date</Label>
          <Input type="date" id="release-date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea id="description" value={description} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder="Tell us more about your release..." />
        </FormGroup>

        <FormSectionTitle>Album Artwork</FormSectionTitle>
        <FormGroup>
          <Label htmlFor="artwork-file">Artwork (JPG, PNG - Min. 1000x1000px)</Label>
          <FileDropArea $isDragActive={false /* isDragActive */} onDragEnter={() => {}} onDragLeave={() => {}} onDragOver={() => {}} onDrop={(e) => handleArtworkFile(e.dataTransfer.files[0])} onClick={() => document.getElementById('artwork-file')?.click()}>
            <FileInput type="file" id="artwork-file" accept="image/jpeg, image/png" onChange={(e) => handleArtworkFile(e.target.files?.[0] as File)} />
            <UploadIconWrapper><ImageIcon size={48} /></UploadIconWrapper>
            <p>Drag &amp; drop new artwork here, or click to browse</p>
            {artworkFile && <p style={{ color: theme.text }}>New file selected: {artworkFile.name}</p>}
            {artworkPreviewUrl && !artworkFile && <ArtworkPreview src={artworkPreviewUrl} alt="Current Artwork" />}
            {artworkPreviewUrl && artworkFile && <ArtworkPreview src={artworkPreviewUrl} alt="New Artwork Preview" />}
            {!artworkPreviewUrl && !artworkFile && <InfoText>No artwork uploaded yet.</InfoText>}
          </FileDropArea>
        </FormGroup>

        <FormSectionTitle>{releaseType === 'single' ? 'Track Details' : 'Tracks'}</FormSectionTitle>
        {tracks.map((track, index) => (
          <React.Fragment key={track.id}>
            {releaseType === 'album' && <h4 style={{ color: theme.text, marginBottom: '0.5rem', marginTop: index > 0 ? '1.5rem' : '0' }}>Track {index + 1}</h4>}
            <FormGroup>
              <Label htmlFor={`track-title-${track.id}`}>Track Title</Label>
              <Input type="text" id={`track-title-${track.id}`} value={track.title} onChange={(e) => handleTrackTitleChange(track.id, e.target.value)} placeholder={`e.g., Track ${index + 1} Title`} required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor={`audio-file-${track.id}`}>Audio File (MP3, WAV, FLAC)</Label>
              {track.audioPath && (
                <InfoText style={{ marginBottom: '0.5rem' }}>Current Audio: <a href={track.audioPath} target="_blank" rel="noopener noreferrer" style={{ color: theme.accentColor, textDecoration: 'underline' }}>{track.audioPath.split('/').pop()}</a></InfoText>
              )}
              {typeof track.id === 'string' && track.id.startsWith('new-track-') ? (
                <FileDropArea $isDragActive={false} onDragEnter={() => {}} onDragLeave={() => {}} onDragOver={() => {}} onDrop={(e) => handleTrackFile(track.id, e.dataTransfer.files[0])} onClick={() => document.getElementById(`audio-file-${track.id}`)?.click()}>
                  <FileInput type="file" id={`audio-file-${track.id}`} accept="audio/mpeg, audio/wav, audio/flac" onChange={(e) => handleTrackFile(track.id, e.target.files?.[0] as File)} />
                  <UploadIconWrapper><Music size={48} /></UploadIconWrapper>
                  <p>Drag &amp; drop audio for "{track.title || `Track ${index + 1}`}" here, or click to browse</p>
                  {track.file && <p style={{ color: theme.text }}>New file selected: {track.file.name}</p>}
                </FileDropArea>
              ) : (
                <InfoText>To update audio for an existing track, please remove it and add it as a new track.</InfoText>
              )}
            </FormGroup>
            {releaseType === 'album' && tracks.length > 1 && (
              <RemoveTrackButton type="button" onClick={() => removeTrack(track.id)}>
                <Trash2 size={20} /> Remove Track
              </RemoveTrackButton>
            )}
          </React.Fragment>
        ))}
        {releaseType === 'album' && (
          <AddTrackButton type="button" onClick={addTrack}>
            <PlusCircle size={20} /> Add Another Track
          </AddTrackButton>
        )}

        <FormSectionTitle>Licensing</FormSectionTitle>
        <FormGroup>
          <Label>Choose your licensing option:</Label>
          <RadioGroup>
            <RadioOption>
              <input type="radio" name="licensing" value="proprietary" checked={licensing === 'proprietary'} onChange={() => { setLicensing('proprietary'); setCcType(null); }} />
              Proprietary (Exclusive to Waveform.ink)
            </RadioOption>
            <RadioOption>
              <input type="radio" name="licensing" value="cc" checked={licensing === 'cc'} onChange={() => setLicensing('cc')} />
              Creative Commons (Commercial use allowed)
            </RadioOption>
          </RadioGroup>
        </FormGroup>
        {licensing === 'cc' && (
          <FormGroup>
            <Label>Creative Commons Type:</Label>
            <CheckboxGroup>
              <CheckboxOption>
                <input type="checkbox" value="BY" checked={ccType === 'BY'} onChange={() => setCcType(ccType === 'BY' ? null : 'BY')} />
                Attribution (BY)
              </CheckboxOption>
               <CheckboxOption>
                <input type="checkbox" value="BY-SA" checked={ccType === 'BY-SA'} onChange={() => setCcType(ccType === 'BY-SA' ? null : 'BY-SA')} />
                Attribution-ShareAlike (BY-SA)
              </CheckboxOption>
            </CheckboxGroup>
            {!ccType && <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.5rem' }}>Please select a Creative Commons type.</p>}
          </FormGroup>
        )}
        
        <SubmitButton type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
            </>
          ) : (
            <>
              <UploadCloud size={20} /> Save Changes
            </>
          )}
        </SubmitButton>

        {actionMessage && actionStatus === 'success' && (
          <SuccessMessage>
            <CheckCircle size={20} /> {actionMessage}
          </SuccessMessage>
        )}
        {actionMessage && actionStatus === 'error' && (
          <ErrorMessage>
            <XCircle size={20} /> {actionMessage}
          </ErrorMessage>
        )}
        {actionMessage && actionStatus === 'idle' && (
          <InfoMessage>
            <Info size={20} /> {actionMessage}
          </InfoMessage>
        )}
      </EditForm>
    );
  };


  return (
    <>
      <Head>
        <title>Edit Release - WaveForum Admin Portal</title>
        <meta name="description" content={`Edit details for album ${albumData?.title || ''}.`} />
      </Head>
      <Container>
        <BackButton href="#" onClick={() => router.back()}>
          <ChevronLeft size={20} /> Back
        </BackButton>
        <PageTitle>Edit Release</PageTitle>
        <PageSubtitle>Make changes to album metadata, artwork, and tracks.</PageSubtitle>
        {renderContent()}
      </Container>
    </>
  );
};

export default EditReleasePage;