import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { addImpact, getImpact } from '../utils/api';

export default function ImpactScreen() {
  const [impacts, setImpacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [lbs, setLbs] = useState('');
  const [co2, setCo2] = useState('');
  const [meals, setMeals] = useState('');

  const fetchImpacts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getImpact();
      setImpacts(res.impacts);
    } catch (e) {
      setError('Failed to load impact data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpacts();
  }, []);

  const handleAdd = async () => {
    setAdding(true);
    setError('');
    try {
      const data = { lbs, co2, meals };
      await addImpact(data);
      setLbs('');
      setCo2('');
      setMeals('');
      fetchImpacts();
    } catch (e) {
      setError('Failed to add impact data');
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Impact Report</Text>
      <View style={styles.formBox}>
        <Text style={styles.label}>Lbs Saved:</Text>
        <TextInput
          style={styles.input}
          value={lbs}
          onChangeText={setLbs}
          placeholder="Enter lbs saved"
          placeholderTextColor="#CBD5E1"
        />
        <Text style={styles.label}>CO₂ Saved:</Text>
        <TextInput
          style={styles.input}
          value={co2}
          onChangeText={setCo2}
          placeholder="Enter CO₂ saved"
          placeholderTextColor="#CBD5E1"
        />
        <Text style={styles.label}>Meals Saved:</Text>
        <TextInput
          style={styles.input}
          value={meals}
          onChangeText={setMeals}
          placeholder="Enter meals saved"
          placeholderTextColor="#CBD5E1"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
          <Text style={styles.addBtnText}>{adding ? 'Adding...' : 'Add Impact'}</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <Text style={styles.heading2}>Recent Impact Entries</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3DC86F" />
      ) : (
        <FlatList
          data={impacts}
          keyExtractor={item => item.id?.toString() || item.created_at}
          renderItem={({ item }) => (
            <View style={styles.impactItem}>
              <Text style={styles.impactText}>Lbs Saved: {item.data?.lbs}</Text>
              <Text style={styles.impactText}>CO₂ Saved: {item.data?.co2}</Text>
              <Text style={styles.impactText}>Meals Saved: {item.data?.meals}</Text>
              <Text style={styles.impactText}>Created: {item.created_at}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.impactText}>No impact entries yet.</Text>}
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
  addBtn: {
    backgroundColor: '#3DC86F',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  addBtnText: {
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
  impactItem: {
    backgroundColor: '#245C47',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  impactText: {
    color: '#CBD5E1',
    fontSize: 15,
  },
}); 