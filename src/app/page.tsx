// src/app/page.tsx
"use client";

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useEffect, useState, useCallback } from 'react'; // Added useState and useCallback
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Users, CheckCircle, XCircle, Loader,
  BarChart2, Settings, List, Plus
} from 'lucide-react';
import Link from 'next/link';

// --- Styled Components (no changes) ---
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

const DashboardSectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1.5rem;
  margin-top: 2rem;

  &:first-of-type {
    margin-top: 0;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    background-color: ${({ theme }) => theme.buttonHoverBg};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.accentGradient};
  color: white;
  flex-shrink: 0;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const CardDescription = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.subtleText};
  line-height: 1.4;
`;

const StatCard = styled(Card)`
  text-align: center;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const StatNumber = styled.p`
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.accentColor};
  line-height: 1;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
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


// --- Page Component ---
const HomePage: NextPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth(); // Assuming useAuth provides user and loading state
  const theme = useTheme();

  // State variables for dashboard statistics
  const [pendingUploadsCount, setPendingUploadsCount] = useState<number | null>(null);
  const [totalTracksCount, setTotalTracksCount] = useState<number | null>(null);
  const [registeredArtistsCount, setRegisteredArtistsCount] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Effect for authentication and admin claim redirection
  useEffect(() => {
    const checkAdminStatusAndFetchData = async () => {
      if (!loading) {
        if (!user) {
          router.push('/login');
          return;
        }

        try {
          const idTokenResult = await user.getIdTokenResult();
          if (!idTokenResult.claims.admin) {
            alert('Access Denied: You do not have administrative privileges.');
            router.push('/'); // Redirect to a generic unauthorized page or the public homepage
            return;
          }

          // If user is admin, proceed to fetch dashboard data
          await fetchDashboardData(idTokenResult.token);

        } catch (error: any) {
          console.error('Authentication or data fetch error:', error);
          setFetchError(error.message || 'Failed to authenticate or load dashboard data.');
          router.push('/login'); // Redirect on severe error
        } finally {
          setDataLoading(false);
        }
      }
    };

    checkAdminStatusAndFetchData();
  }, [user, loading, router]); // Dependencies for this effect

  // Function to fetch dashboard data
  const fetchDashboardData = useCallback(async (idToken: string) => {
    setDataLoading(true);
    setFetchError(null);
    try {
      const headers = { 'Authorization': `Bearer ${idToken}` };

      // Fetch Pending Uploads Count
      const pendingRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/uploads/pending`, { headers });
      const pendingData = await pendingRes.json();
      if (!pendingRes.ok) throw new Error(pendingData.message || 'Failed to fetch pending uploads.');
      setPendingUploadsCount(pendingData.length); // Assuming response is an array of albums

      // Fetch Registered Artists Count
      const artistsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users`, { headers });
      const artistsData = await artistsRes.json();
      if (!artistsRes.ok) throw new Error(artistsData.message || 'Failed to fetch artists.');
      setRegisteredArtistsCount(artistsData.length); // Assuming response is an array of artists

      // Fetch Total Tracks Count (by getting all approved albums and summing their tracks)
      const approvedAlbumsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/content/approved`, { headers });
      const approvedAlbumsData = await approvedAlbumsRes.json();
      if (!approvedAlbumsRes.ok) throw new Error(approvedAlbumsData.message || 'Failed to fetch approved albums.');
      
      let totalTracks = 0;
      if (Array.isArray(approvedAlbumsData)) {
          approvedAlbumsData.forEach((album: any) => {
              if (album.tracks && Array.isArray(album.tracks)) {
                  totalTracks += album.tracks.length;
              }
          });
      }
      setTotalTracksCount(totalTracks);

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setFetchError(error.message || 'Failed to load dashboard statistics.');
    } finally {
      setDataLoading(false);
    }
  }, []); // useCallback dependencies, empty as it uses idToken passed from effect

  // Combined loading state for initial auth check and data fetching
  if (loading || dataLoading) {
    return (
      <Container>
        <DashboardSectionTitle>Loading...</DashboardSectionTitle>
        <Message>Checking authentication status and admin permissions...</Message>
      </Container>
    );
  }

  // If `user` is null (after loading), it means they were redirected by the effect
  if (!user) {
    return null; // The useEffect should have already triggered a router.push('/login')
  }

  // If there's a fetch error after authentication, display it
  if (fetchError) {
    return (
      <Container>
        <DashboardSectionTitle>Error</DashboardSectionTitle>
        <Message style={{ color: '#dc3545', borderColor: '#dc3545' }}>{fetchError}</Message>
      </Container>
    );
  }

  // If we reach here, `user` is defined, they are an admin, and data has been fetched
  return (
    <>
      <Head>
        <title>Dashboard - WaveForum Admin Portal</title>
        <meta name="description" content="Admin dashboard for WaveForum content and user management." />
      </Head>
      <Container>
        <DashboardSectionTitle>Admin Dashboard</DashboardSectionTitle>
        
        <Grid>
          <StatCard>
            <StatNumber>{pendingUploadsCount !== null ? pendingUploadsCount : <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />}</StatNumber>
            <StatLabel>Pending Uploads</StatLabel>
            <Link href="/pending-uploads" style={{ marginTop: '1rem', color: theme.accentColor, textDecoration: 'underline' }}>View All</Link>
          </StatCard>
          <StatCard>
            <StatNumber>{totalTracksCount !== null ? totalTracksCount : <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />}</StatNumber>
            <StatLabel>Total Tracks</StatLabel>
            <Link href="/live-content" style={{ marginTop: '1rem', color: theme.accentColor, textDecoration: 'underline' }}>Manage</Link> {/* Link to Live Content for managing all tracks */}
          </StatCard>
          <StatCard>
            <StatNumber>{registeredArtistsCount !== null ? registeredArtistsCount : <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />}</StatNumber>
            <StatLabel>Registered Artists</StatLabel>
            <Link href="/users" style={{ marginTop: '1rem', color: theme.accentColor, textDecoration: 'underline' }}>Manage</Link>
          </StatCard>
        </Grid>

        <DashboardSectionTitle>Quick Actions</DashboardSectionTitle>
        <Grid>
          <Link href="/pending-uploads" passHref>
            <Card style={{ cursor: 'pointer' }}>
              <CardHeader>
                <IconWrapper><FileText size={20} /></IconWrapper>
                <CardTitle>Review New Uploads</CardTitle>
              </CardHeader>
              <CardDescription>Approve or reject recently submitted music and artwork.</CardDescription>
            </Card>
          </Link>
          <Link href="/users" passHref>
            <Card style={{ cursor: 'pointer' }}>
              <CardHeader>
                <IconWrapper><Users size={20} /></IconWrapper>
                <CardTitle>Manage Users</CardTitle>
              </CardHeader>
              <CardDescription>View and manage artist accounts, including suspensions.</CardDescription>
            </Card>
          </Link>
          <Link href="/genres" passHref>
            <Card style={{ cursor: 'pointer' }}>
              <CardHeader>
                <IconWrapper><List size={20} /></IconWrapper>
                <CardTitle>Manage Genres</CardTitle>
              </CardHeader>
              <CardDescription>Add, edit, or remove music genres from the platform.</CardDescription>
            </Card>
          </Link>
          <Link href="/settings" passHref>
            <Card style={{ cursor: 'pointer' }}>
              <CardHeader>
                <IconWrapper><Settings size={20} /></IconWrapper>
                <CardTitle>Admin Settings</CardTitle>
              </CardHeader>
              <CardDescription>Configure portal settings and your admin profile.</CardDescription>
            </Card>
          </Link>
        </Grid>

        {/* Placeholder for recent activity feed or other admin-specific insights */}
        <DashboardSectionTitle>Recent Activity</DashboardSectionTitle>
        <Card>
          <CardDescription>
            No recent activity to display.
            {/* Example:
            <ul>
              <li>[Admin Name] approved "Song Title" by [Artist Name] (5 mins ago)</li>
              <li>[Admin Name] rejected "Album Title" by [Artist Name] (1 hour ago)</li>
            </ul>
            */}
          </CardDescription>
        </Card>
      </Container>
    </>
  );
};

export default HomePage;