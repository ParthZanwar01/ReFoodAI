import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { createPickup, getPickups } from '../utils/api';

export default function TrackerScreen() {
  const [pickups, setPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [volume, setVolume] = useState('');

  const fetchPickups = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPickups();
      setPickups(res.pickups);
    } catch (e) {
      setError('Failed to load pickups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const data = { location, time, volume };
      await createPickup(data);
      setLocation('');
      setTime('');
      setVolume('');
      fetchPickups();
    } catch (e) {
      setError('Failed to create pickup');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Pickup Tracker</Text>
      <View style={styles.formBox}>
        <Text style={styles.label}>Location:</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter pickup location"
          placeholderTextColor="#CBD5E1"
        />
        <Text style={styles.label}>Time:</Text>
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={setTime}
          placeholder="Enter pickup time"
          placeholderTextColor="#CBD5E1"
        />
        <Text style={styles.label}>Volume:</Text>
        <TextInput
          style={styles.input}
          value={volume}
          onChangeText={setVolume}
          placeholder="Enter pickup volume"
          placeholderTextColor="#CBD5E1"
        />
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={creating}>
          <Text style={styles.createBtnText}>{creating ? 'Creating...' : 'Create Pickup'}</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <Text style={styles.heading2}>Recent Pickups</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3DC86F" />
      ) : (
        <FlatList
          data={pickups}
          keyExtractor={item => item.id?.toString() || item.updated_at}
          renderItem={({ item }) => (
            <View style={styles.pickupItem}>
              <Text style={styles.pickupText}>Location: {item.details?.location}</Text>
              <Text style={styles.pickupText}>Time: {item.details?.time}</Text>
              <Text style={styles.pickupText}>Volume: {item.details?.volume}</Text>
              <Text style={styles.pickupText}>Status: {item.status}</Text>
              <Text style={styles.pickupText}>Updated: {item.updated_at}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.pickupText}>No pickups yet.</Text>}
        />
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
  createBtn: {
    backgroundColor: '#3DC86F',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: '#E53E3E',
    fontSize: 16,
    marginTop: 12,
  },
  heading2: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 32,
    marginBottom: 12,
  },
  pickupItem: {
    backgroundColor: '#245C47',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  pickupText: {
    color: '#CBD5E1',
    fontSize: 15,
  },
}); 