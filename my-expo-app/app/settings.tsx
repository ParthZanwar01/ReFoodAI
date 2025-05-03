import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Alert, RefreshControl } from 'react-native';
import { updateSettings, getSettings } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

export default function SettingsScreen() {
  const { user, signOut } = useContext(AuthContext);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await getSettings();
      setSettings(res.settings);
      setOrg(res.settings?.data?.org || '');
      setEmail(res.settings?.data?.email || user?.email || '');
    } catch (e: any) {
      console.error('Settings fetch error:', e);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      const data = { org, email };
      await updateSettings(data);
      setSuccess('✅ Settings updated successfully!');
      Alert.alert(
        '🎉 Settings Updated!',
        'Your settings have been saved successfully.',
        [{ text: 'Great!', style: 'default' }]
      );
      fetchSettings();
    } catch (e: any) {
      console.error('Settings update error:', e);
      setError('❌ Failed to update settings');
      Alert.alert(
        '❌ Update Failed',
        'There was an error saving your settings. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      '🚪 Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  const onRefresh = () => {
    fetchSettings(true);
  };

  if (loading && !settings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3DC86F" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#3DC86F']}
          tintColor="#3DC86F"
        />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>⚙️ Account Settings</Text>
          <Text style={styles.subtitle}>
            Welcome, {user?.email?.split('@')[0]}! Manage your account preferences and profile.
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.refreshText}>{refreshing ? '🔄' : '⚡'} Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profile Information</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.email?.split('@')[0] || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏢 Organization</Text>
              <TextInput
                style={styles.input}
                value={org}
                onChangeText={setOrg}
                placeholder="Enter your organization name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📧 Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.updateButton, updating && styles.updateButtonDisabled]} 
              onPress={handleUpdate} 
              disabled={updating}
            >
              <Text style={styles.updateButtonText}>
                {updating ? '⏳ Updating...' : '💾 Save Changes'}
              </Text>
            </TouchableOpacity>

            {success && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleUpdate}>
                  <Text style={styles.retryText}>🔄 Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Account Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Account Management</Text>
        <View style={styles.accountCard}>
          <View style={styles.accountOption}>
            <View style={styles.accountOptionLeft}>
              <Text style={styles.accountIcon}>🔄</Text>
              <View style={styles.accountOptionDetails}>
                <Text style={styles.accountOptionTitle}>Refresh Data</Text>
                <Text style={styles.accountOptionDescription}>Reload settings from server</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.accountButton} onPress={onRefresh}>
              <Text style={styles.accountButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.accountOption}>
            <View style={styles.accountOptionLeft}>
              <Text style={styles.accountIcon}>🚪</Text>
              <View style={styles.accountOptionDetails}>
                <Text style={styles.accountOptionTitle}>Sign Out</Text>
                <Text style={styles.accountOptionDescription}>Sign out of your account</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.accountButton, styles.signOutButton]} onPress={handleSignOut}>
              <Text style={[styles.accountButtonText, styles.signOutButtonText]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Current Settings Display */}
      {settings && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Current Configuration</Text>
          <View style={styles.configCard}>
            <View style={styles.configItem}>
              <Text style={styles.configLabel}>Organization:</Text>
              <Text style={styles.configValue}>{settings?.data?.org || 'Not set'}</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={styles.configLabel}>Email:</Text>
              <Text style={styles.configValue}>{settings?.data?.email || user?.email || 'Not set'}</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={styles.configLabel}>Account Status:</Text>
              <Text style={[styles.configValue, styles.activeStatus]}>✅ Active</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#CBD5E1',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: '#3DC86F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 16,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#3DC86F',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 16,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#475569',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  updateButton: {
    backgroundColor: '#3DC86F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    backgroundColor: '#065F46',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  accountCard: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 20,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  accountOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  accountOptionDetails: {
    flex: 1,
  },
  accountOptionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountOptionDescription: {
    color: '#94A3B8',
    fontSize: 14,
  },
  accountButton: {
    backgroundColor: '#3DC86F',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  accountButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
  },
  signOutButtonText: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#475569',
    marginHorizontal: 0,
  },
  configCard: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  configLabel: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
  configValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  activeStatus: {
    color: '#10B981',
  },
}); 