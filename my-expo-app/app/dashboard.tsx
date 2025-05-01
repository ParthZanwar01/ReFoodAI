import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getDashboard } from '../utils/api';

export default function DashboardScreen() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getDashboard()
      .then(setData)
      .catch(e => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3DC86F" /></View>;
  if (error) return <View style={styles.container}><Text style={styles.error}>{error}</Text></View>;
  if (!data) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.heading}>Dashboard</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Uploads</Text>
          <Text style={styles.statValue}>{data.uploads}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pickups</Text>
          <Text style={styles.statValue}>{data.pickups}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Lbs</Text>
          <Text style={styles.statValue}>{data.totalLbs}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CO₂ Saved</Text>
          <Text style={styles.statValue}>{data.totalCO2}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Meals Saved</Text>
          <Text style={styles.statValue}>{data.totalMeals}</Text>
        </View>
      </View>
      <Text style={styles.subtext}>Welcome, {user?.email}! Here's your mission control for today.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#184C3A',
  },
  contentContainer: {
    padding: 32,
    paddingBottom: 60,
  },
  heading: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#245C47',
    borderRadius: 18,
    padding: 24,
    minWidth: 160,
    alignItems: 'center',
    marginBottom: 16,
    flex: 1,
  },
  statLabel: {
    color: '#CBD5E1',
    fontSize: 16,
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtext: {
    color: '#CBD5E1',
    fontSize: 18,
    marginTop: 24,
  },
  error: {
    color: '#E53E3E',
    fontSize: 18,
    marginTop: 32,
  },
}); 