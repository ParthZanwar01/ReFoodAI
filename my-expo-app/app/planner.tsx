import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { runPlanner, getPlans } from '../utils/api';

export default function PlannerScreen() {
  const [params, setParams] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const res = await getPlans();
      setHistory(res.planners);
    } catch (e) {
      setHistory([]);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const input = { params: params.split(',').map(p => p.trim()).filter(Boolean) };
      const res = await runPlanner(input);
      setResult(res.result);
      fetchHistory();
    } catch (e) {
      setError('Failed to run planner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Action Planner</Text>
      <Text style={styles.label}>Enter parameters (comma separated):</Text>
      <TextInput
        style={styles.input}
        value={params}
        onChangeText={setParams}
        placeholder="e.g. location, time, volume"
        placeholderTextColor="#CBD5E1"
      />
      <TouchableOpacity style={styles.runBtn} onPress={handleRun} disabled={loading}>
        <Text style={styles.runBtnText}>{loading ? 'Running...' : 'Run Planner'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Planner Result</Text>
          <Text style={styles.resultText}>Plan: {result.plan}</Text>
          <Text style={styles.resultText}>Details: {JSON.stringify(result.details)}</Text>
        </View>
      )}
      <Text style={styles.heading2}>Recent Plans</Text>
      {fetchingHistory ? (
        <ActivityIndicator size="large" color="#3DC86F" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id?.toString() || item.created_at}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <Text style={styles.historyText}>Parameters: {JSON.parse(item.input).params?.join(', ')}</Text>
              <Text style={styles.historyText}>Plan: {JSON.parse(item.result).plan}</Text>
              <Text style={styles.historyText}>At: {item.created_at}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.historyText}>No plans yet.</Text>}
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
  label: {
    color: '#CBD5E1',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#245C47',
    color: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  runBtn: {
    backgroundColor: '#3DC86F',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 18,
    alignItems: 'center',
  },
  runBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: '#E53E3E',
    fontSize: 16,
    marginTop: 12,
  },
  resultBox: {
    backgroundColor: '#245C47',
    borderRadius: 12,
    padding: 18,
    marginTop: 18,
    marginBottom: 18,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultText: {
    color: '#CBD5E1',
    fontSize: 16,
    marginBottom: 4,
  },
  heading2: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 32,
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: '#245C47',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  historyText: {
    color: '#CBD5E1',
    fontSize: 15,
  },
}); 