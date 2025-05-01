import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { updateSettings, getSettings } from '../utils/api';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSettings();
      setSettings(res.settings);
      setOrg(res.settings?.data?.org || '');
      setEmail(res.settings?.data?.email || '');
    } catch (e) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    setError('');
    try {
      const data = { org, email };
      await updateSettings(data);
      fetchSettings();
    } catch (e) {
      setError('Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>
      <View style={styles.formBox}>
        <Text style={styles.label}>Organization:</Text>
        <TextInput
          style={styles.input}
          value={org}
          onChangeText={setOrg}
          placeholder="Enter organization name"
          placeholderTextColor="#CBD5E1"
        />
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          placeholderTextColor="#CBD5E1"
        />
        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={updating}>
          <Text style={styles.updateBtnText}>{updating ? 'Updating...' : 'Update Settings'}</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3DC86F" />
      ) : (
        <View style={styles.currentSettings}>
          <Text style={styles.currentTitle}>Current Settings</Text>
          <Text style={styles.currentText}>Organization: {settings?.data?.org || 'Not set'}</Text>
          <Text style={styles.currentText}>Email: {settings?.data?.email || 'Not set'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    backgroundColor: '#184C3A',
  },
  heading: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  formBox: {
    backgroundColor: '#245C47',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#184C3A',
    color: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  updateBtn: {
    backgroundColor: '#3DC86F',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: '#E53E3E',
    fontSize: 16,
    marginTop: 12,
  },
  currentSettings: {
    backgroundColor: '#245C47',
    borderRadius: 12,
    padding: 18,
  },
  currentTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  currentText: {
    color: '#CBD5E1',
    fontSize: 16,
    marginBottom: 4,
  },
}); 