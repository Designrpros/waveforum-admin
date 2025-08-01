// src/app/settings/page.tsx
"use client";

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, ChangeEvent, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  User, Lock, Bell, CreditCard, Shield, Loader, CheckCircle, XCircle
} from 'lucide-react';

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
`;

const SettingsLayout = styled(Container)`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-top: 2rem;
  padding-bottom: 4rem;

  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const Sidebar = styled.aside`
  width: 100%;
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 1rem;
  padding: 1.5rem;
  flex-shrink: 0;

  @media (min-width: 1024px) {
    width: 250px;
    position: sticky;
    top: 6rem;
  }
`;

const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SidebarNavLink = styled.a<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: ${({ theme, $isActive }) => ($isActive ? theme.primaryButtonTextColor : theme.text)};
  background-color: ${({ theme, $isActive }) => ($isActive ? theme.accentGradient.replace('linear-gradient(to right, ', '').split(', ')[0] : 'transparent')};
  font-weight: ${({ $isActive }) => ($isActive ? '600' : '500')};
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme, $isActive }) => ($isActive ? theme.accentGradient.replace('linear-gradient(to right, ', '').split(', ')[1] : theme.buttonHoverBg)};
    color: ${({ theme, $isActive }) => ($isActive ? theme.primaryButtonTextColor : theme.text)};
  }
`;

const MainContent = styled.div`
  flex-grow: 1;
  width: 100%;
`;

const SettingsSectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1.5rem;
  margin-top: 2rem;

  &:first-of-type {
    margin-top: 0;
  }
`;

const SettingsCard = styled.div`
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
`;

const FormGroup = styled.div`
  margin-bottom: 0.5rem;
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
    border-color: ${({ theme }) => theme.accentGradient.replace('linear-gradient(to right, ', '').split(', ')[0]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentGradient.replace('linear-gradient(to right, ', '').split(', ')[0].replace(')', ', 0.2)')};
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
    border-color: ${({ theme }) => theme.accentGradient.replace('linear-gradient(to right, ', '').split(', ')[0]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentGradient.replace('linear-gradient(to right, ', '').split(', ')[0].replace(')', ', 0.2)')};
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

const SecondaryButton = styled(Button)`
  background-color: ${({ theme }) => theme.buttonBg};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.borderColor};

  &:hover {
    background-color: ${({ theme }) => theme.buttonHoverBg};
  }
`;

const DangerButton = styled(Button)`
  background-color: #dc3545;
  color: white;
  border: none;

  &:hover {
    background-color: #c82333;
  }
`;

const AvatarPreview = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 2px solid ${({ theme }) => theme.borderColor};
`;

const CheckboxOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  margin-bottom: 0.5rem;

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
      background-color: ${({ theme }) => theme.accentGradient.replace('linear-gradient(to right, ', '').split(', ')[0]};
      border-color: ${({ theme }) => theme.accentGradient.replace('linear-gradient(to right, ', '').split(', ')[0]};
      &::before {
        transform: scale(1);
      }
    }
  }
`;

const InfoText = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.subtleText};
  margin-top: 0.5rem;
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


const SettingsPage: NextPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [activeSection, setActiveSection] = useState('profile');
  
  const [adminName, setAdminName] = useState(''); // Renamed from artistName
  const [adminBio, setAdminBio] = useState(''); // Renamed from bio
  const [adminAvatarFile, setAdminAvatarFile] = useState<File | null>(null); // Renamed from avatarFile
  const [adminAvatarPreviewUrl, setAdminAvatarPreviewUrl] = useState<string | null>(null); // Renamed from avatarPreviewUrl

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const [profileSaveStatus, setProfileSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Effect for authentication and admin claim redirection
  useEffect(() => {
    const checkAdminStatusAndLoadProfile = async () => {
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
          
          // Fetch admin profile (assuming a simple endpoint like /api/admin/profile exists,
          // or we can reuse /api/artist/profile for logged-in user if backend allows admin access there)
          // For now, let's use the existing /api/artist/profile assuming admin can also have an artist profile.
          // In a more robust system, you might have a dedicated /api/admin/profile endpoint.
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artist/profile`, {
            headers: { 'Authorization': `Bearer ${idTokenResult.token}` }
          });
          if (!response.ok) throw new Error('Failed to fetch admin profile');
          const data = await response.json();
          setAdminName(data.name || '');
          setAdminBio(data.bio || '');
          setAdminAvatarPreviewUrl(data.artwork || null);

        } catch (error: any) {
          console.error("Error loading admin profile:", error);
          alert(`Error loading profile: ${error.message}`);
          router.push('/login'); // Redirect on severe error
        }
      }
    };
    checkAdminStatusAndLoadProfile();
  }, [user, loading, router]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdminAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminAvatarPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveStatus('loading');
    setProfileMessage(null);

    if (!user) {
      setProfileMessage('You must be logged in to update your profile.');
      setProfileSaveStatus('error');
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();
      formData.append('name', adminName);
      formData.append('bio', adminBio);
      if (adminAvatarFile) {
        formData.append('artwork', adminAvatarFile);
      }

      // Reusing the artist profile update endpoint. For a truly separate admin profile,
      // you'd need a dedicated endpoint in your backend's admin routes.
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artist/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update profile.');
      }

      setProfileMessage('Profile updated successfully!');
      setProfileSaveStatus('success');

    } catch (error: any) {
      console.error('Profile update error:', error);
      setProfileMessage(error.message || 'Failed to save changes. Please try again.');
      setProfileSaveStatus('error');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password change functionality not implemented yet.');
    // In a real app, you'd use Firebase Auth's updatePassword here
    // and handle re-authentication if required.
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  if (loading || !user) {
    return (
      <Container>
        <SettingsSectionTitle>Loading...</SettingsSectionTitle>
        <p style={{ textAlign: 'center', color: theme.subtleText }}>Checking authentication status.</p>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Settings - WaveForum Admin Portal</title>
        <meta name="description" content="Manage your WaveForum admin account settings." />
      </Head>
      <SettingsLayout>
        <Sidebar>
          <SidebarNav>
            <SidebarNavLink href="#profile" $isActive={activeSection === 'profile'} onClick={() => setActiveSection('profile')}>
              <User size={20} /> My Profile
            </SidebarNavLink>
            <SidebarNavLink href="#security" $isActive={activeSection === 'security'} onClick={() => setActiveSection('security')}>
              <Lock size={20} /> Security
            </SidebarNavLink>
            <SidebarNavLink href="#notifications" $isActive={activeSection === 'notifications'} onClick={() => setActiveSection('notifications')}>
              <Bell size={20} /> Notifications
            </SidebarNavLink>
            {/* These sections are more relevant for a user/artist portal, but kept as placeholders */}
            <SidebarNavLink href="#subscription" $isActive={activeSection === 'subscription'} onClick={() => setActiveSection('subscription')}>
              <CreditCard size={20} /> Subscription & Billing
            </SidebarNavLink>
            <SidebarNavLink href="#data-privacy" $isActive={activeSection === 'data-privacy'} onClick={() => setActiveSection('data-privacy')}>
              <Shield size={20} /> Data & Privacy
            </SidebarNavLink>
          </SidebarNav>
        </Sidebar>

        <MainContent>
          <section id="profile">
            <SettingsSectionTitle>My Profile</SettingsSectionTitle>
            <SettingsCard>
              <form onSubmit={handleProfileSave}>
                <FormGroup>
                  <Label htmlFor="admin-avatar">Admin Avatar</Label>
                  {adminAvatarPreviewUrl ? <AvatarPreview src={adminAvatarPreviewUrl} alt="Admin Avatar" /> : <InfoText>No avatar uploaded.</InfoText>}
                  <Input type="file" id="admin-avatar" accept="image/*" onChange={handleAvatarChange} />
                  <InfoText>Upload a square image (min. 500x500px).</InfoText>
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="admin-name">Admin Name</Label>
                  <Input
                    type="text"
                    id="admin-name"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="admin-bio">Bio (Optional)</Label>
                  <Textarea
                    id="admin-bio"
                    value={adminBio}
                    onChange={(e) => setAdminBio(e.target.value)}
                    placeholder="Tell us about your role or interests."
                  />
                </FormGroup>
                <PrimaryButton type="submit" disabled={profileSaveStatus === 'loading'}>
                  {profileSaveStatus === 'loading' ? (
                    <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  Save Profile
                </PrimaryButton>
                {profileMessage && profileSaveStatus === 'success' && (
                  <SuccessMessage><CheckCircle size={20} /> {profileMessage}</SuccessMessage>
                )}
                {profileMessage && profileSaveStatus === 'error' && (
                  <ErrorMessage><XCircle size={20} /> {profileMessage}</ErrorMessage>
                )}
              </form>
            </SettingsCard>
          </section>

          <section id="security">
            <SettingsSectionTitle>Account Security</SettingsSectionTitle>
            <SettingsCard>
              <form onSubmit={handlePasswordChange}>
                <FormGroup>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    type="password"
                    id="confirm-new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </FormGroup>
                <PrimaryButton type="submit">Change Password</PrimaryButton>
              </form>
              <hr style={{ border: `0.5px solid ${theme.borderColor}`, margin: '1rem 0' }} />
              <FormGroup>
                <Label>Two-Factor Authentication (2FA)</Label>
                <CheckboxOption>
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  />
                  Enable 2FA
                </CheckboxOption>
                <InfoText>Add an extra layer of security to your account.</InfoText>
                {twoFactorEnabled && <SecondaryButton type="button" style={{ marginTop: '1rem' }}>Setup 2FA</SecondaryButton>}
              </FormGroup>
            </SettingsCard>
          </section>

          <section id="notifications">
            <SettingsSectionTitle>Notification Preferences</SettingsSectionTitle>
            <SettingsCard>
              <FormGroup>
                <Label>Email Notifications</Label>
                <CheckboxOption>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={() => setEmailNotifications(!emailNotifications)}
                  />
                  Receive email updates on system alerts, new uploads, and critical actions.
                </CheckboxOption>
              </FormGroup>
              <FormGroup>
                <Label>In-App Notifications</Label>
                <CheckboxOption>
                  <input
                    type="checkbox"
                    checked={inAppNotifications}
                    onChange={() => setInAppNotifications(!inAppNotifications)}
                  />
                  Receive in-app alerts for important updates and messages.
                </CheckboxOption>
              </FormGroup>
              <PrimaryButton type="button">Save Notification Settings</PrimaryButton>
            </SettingsCard>
          </section>

          {/* Subscription & Data/Privacy sections are more for artist/user accounts,
              but can be kept as placeholders or removed if not applicable for admins.
              For an admin portal, "Data & Privacy" might involve audit logs, not personal data export.
          */}
          <section id="subscription">
            <SettingsSectionTitle>Subscription & Billing</SettingsSectionTitle>
            <SettingsCard>
              <FormGroup>
                <Label>Current Plan</Label>
                <InfoText>This section is typically for artist accounts.</InfoText>
                <PrimaryButton type="button" style={{ marginTop: '1rem' }} disabled>Upgrade to Premium</PrimaryButton>
              </FormGroup>
              <hr style={{ border: `0.5px solid ${theme.borderColor}`, margin: '1rem 0' }} />
              <FormGroup>
                <Label>Payment Methods</Label>
                <InfoText>No payment methods on file.</InfoText>
                <SecondaryButton type="button" style={{ marginTop: '1rem' }} disabled>Add Payment Method</SecondaryButton>
              </FormGroup>
              <FormGroup>
                <Label>Billing History</Label>
                <InfoText>View your past invoices and payment history.</InfoText>
                <SecondaryButton type="button" style={{ marginTop: '1rem' }} disabled>View Billing History</SecondaryButton>
              </FormGroup>
            </SettingsCard>
          </section>

          <section id="data-privacy">
            <SettingsSectionTitle>Data & Privacy</SettingsSectionTitle>
            <SettingsCard>
              <FormGroup>
                <Label>Export My Data</Label>
                <InfoText>Download a copy of your WaveForum Admin data (e.g., action logs).</InfoText>
                <SecondaryButton type="button" style={{ marginTop: '1rem' }}>Export Data</SecondaryButton>
              </FormGroup>
              <FormGroup>
                <Label>Delete My Account</Label>
                <InfoText>Permanently delete your admin account. This action cannot be undone.</InfoText>
                <DangerButton type="button" style={{ marginTop: '1.5rem' }}>Delete Account</DangerButton>
              </FormGroup>
            </SettingsCard>
          </section>
        </MainContent>
      </SettingsLayout>
    </>
  );
};

export default SettingsPage;