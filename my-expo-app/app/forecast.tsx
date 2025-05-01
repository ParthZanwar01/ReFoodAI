import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { runForecast, getForecasts } from '../utils/api';

export default function ForecastScreen() {
  const [features, setFeatures] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const res = await getForecasts();
      setHistory(res.forecasts);
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
      const input = { features: features.split(',').map(f => f.trim()).filter(Boolean) };
      const res = await runForecast(input);
      setResult(res.result);
      fetchHistory();
    } catch (e) {
      setError('Failed to run forecast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Forecast Studio</Text>
      <Text style={styles.label}>Enter features (comma separated):</Text>
      <TextInput
        style={styles.input}
        value={features}
        onChangeText={setFeatures}
        placeholder="e.g. day, menu, weather, event"
        placeholderTextColor="#CBD5E1"
      />
      <TouchableOpacity style={styles.runBtn} onPress={handleRun} disabled={loading}>
        <Text style={styles.runBtnText}>{loading ? 'Running...' : 'Run Forecast'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Prediction Result</Text>
          <Text style={styles.resultText}>Prediction: {result.prediction}</Text>
          <Text style={styles.resultText}>SHAP: {JSON.stringify(result.shap)}</Text>
          <Text style={styles.resultText}>Chart: {JSON.stringify(result.chart)}</Text>
        </View>
      )}
      <Text style={styles.heading2}>Recent Forecasts</Text>
      {fetchingHistory ? (
        <ActivityIndicator size="large" color="#3DC86F" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id?.toString() || item.created_at}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <Text style={styles.historyText}>Features: {JSON.parse(item.input).features?.join(', ')}</Text>
              <Text style={styles.historyText}>Prediction: {JSON.parse(item.result).prediction}</Text>
              <Text style={styles.historyText}>At: {item.created_at}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.historyText}>No forecasts yet.</Text>}
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