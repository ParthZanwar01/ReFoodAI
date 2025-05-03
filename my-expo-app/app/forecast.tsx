import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { runForecast, getForecasts } from '../utils/api';

interface ForecastResult {
  predicted_waste: number;
  predicted_waste_percentage: number;
  confidence_interval: { lower: number; upper: number };
  recommended_quantity: number;
  potential_savings: number;
  model_accuracy: number;
  factors_influence: {
    weather_impact: number;
    day_of_week_impact: number;
    seasonal_impact: number;
    event_impact: number;
  };
}

interface PredictionHistory {
  id: string;
  input: any;
  result: ForecastResult;
  created_at: string;
}

export default function ForecastScreen() {
  // Form inputs
  const [menuItem, setMenuItem] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('sunny');
  const [temperature, setTemperature] = useState('65');
  const [specialEvent, setSpecialEvent] = useState('none');
  const [estimatedStudents, setEstimatedStudents] = useState('1000');
  const [quantityToPrepare, setQuantityToPrepare] = useState('');
  
  // State
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  // Popular menu items from your actual CSV data
  const menuItems = [
    'Margherita Pizza', 'Lentil Soup', 'Veggie Burrito', 'Caesar Salad', 'Beef Tacos',
    'Turkey Sandwich', 'Vegetarian Pasta', 'Grilled Chicken Breast', 'Quinoa Salad',
    'Chocolate Brownie', 'Fruit Parfait', 'Penne Alfredo', 'Stir‑Fry Vegetables',
    'Cheese Burger', 'Roast Beef', 'Baked Salmon', 'Greek Yogurt Cup', 'Mashed Potatoes',
    'Lemonade', 'Iced Tea'
  ];

  const weatherOptions = [
    { label: 'Sunny ☀️', value: 'sunny' },
    { label: 'Cloudy ☁️', value: 'cloudy' },
    { label: 'Rainy 🌧️', value: 'rainy' },
    { label: 'Stormy ⛈️', value: 'stormy' }
  ];

  const eventOptions = [
    { label: 'No Special Event', value: 'none' },
    { label: 'Holiday 🎉', value: 'holiday' },
    { label: 'Orientation Week 🎓', value: 'orientation' },
    { label: 'Exam Week 📚', value: 'exam_week' },
    { label: 'Sports Game 🏈', value: 'sports_game' },
    { label: 'Graduation 🎓', value: 'graduation' }
  ];

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

  const validateInputs = () => {
    if (!menuItem) {
      Alert.alert('Missing Input', 'Please select a menu item');
      return false;
    }
    if (!quantityToPrepare || isNaN(Number(quantityToPrepare)) || Number(quantityToPrepare) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid quantity to prepare');
      return false;
    }
    if (isNaN(Number(estimatedStudents)) || Number(estimatedStudents) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of students');
      return false;
    }
    if (isNaN(Number(temperature))) {
      Alert.alert('Invalid Input', 'Please enter a valid temperature');
      return false;
    }
    return true;
  };

  const handleRunForecast = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const input = {
        menu_item: menuItem,
        date: date,
        weather: weather,
        temperature: Number(temperature),
        special_event: specialEvent,
        estimated_students: Number(estimatedStudents),
        quantity_to_prepare: Number(quantityToPrepare)
      };
      
      const res = await runForecast(input);
      
      if (res && res.predicted_waste !== undefined) {
        setResult(res);
        fetchHistory();
      } else {
        setError('Invalid response from server');
      }
    } catch (e: any) {
      console.error('Forecast error:', e);
      setError(e.message || 'Failed to run forecast prediction');
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getWasteLevel = (percentage: number) => {
    if (percentage < 8) return { label: 'Excellent', color: '#10B981', emoji: '🟢' };
    if (percentage < 15) return { label: 'Good', color: '#3DC86F', emoji: '🟡' };
    if (percentage < 25) return { label: 'Moderate', color: '#F59E0B', emoji: '🟠' };
    return { label: 'High Risk', color: '#EF4444', emoji: '🔴' };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔮 Forecast Studio</Text>
        <Text style={styles.subtitle}>AI-Powered Food Waste Prediction</Text>
      </View>

      {/* Input Form */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Prediction Parameters</Text>
        
        {/* Menu Item Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Menu Item *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={menuItem}
              onValueChange={setMenuItem}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#CBD5E1"
            >
              <Picker.Item label="Select a menu item..." value="" />
              {menuItems.map(item => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Date and Day Info */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748B"
          />
          {date && (
            <Text style={styles.dayInfo}>📅 {getDayOfWeek(date)}</Text>
          )}
        </View>

        {/* Weather Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weather Conditions</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={weather}
              onValueChange={setWeather}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#CBD5E1"
            >
              {weatherOptions.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Temperature */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Temperature (°F)</Text>
          <TextInput
            style={styles.input}
            value={temperature}
            onChangeText={setTemperature}
            placeholder="65"
            keyboardType="numeric"
            placeholderTextColor="#64748B"
          />
        </View>

        {/* Special Events */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Special Events</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={specialEvent}
              onValueChange={setSpecialEvent}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#CBD5E1"
            >
              {eventOptions.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Student Population */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estimated Students</Text>
          <TextInput
            style={styles.input}
            value={estimatedStudents}
            onChangeText={setEstimatedStudents}
            placeholder="1000"
            keyboardType="numeric"
            placeholderTextColor="#64748B"
          />
        </View>

        {/* Quantity to Prepare */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity to Prepare (lbs) *</Text>
          <TextInput
            style={styles.input}
            value={quantityToPrepare}
            onChangeText={setQuantityToPrepare}
            placeholder="100"
            keyboardType="numeric"
            placeholderTextColor="#64748B"
          />
        </View>

        {/* Run Forecast Button */}
        <TouchableOpacity 
          style={[styles.forecastBtn, loading && styles.forecastBtnDisabled]} 
          onPress={handleRunForecast} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.forecastBtnText}>🚀 Run AI Prediction</Text>
          )}
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}
      </View>

                {/* Results Display */}
      {result && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>🎯 Prediction Results</Text>
          

          
          {/* Main Prediction Card */}
          <View style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionTitle}>Waste Prediction</Text>
              <View style={styles.wasteIndicator}>
                <Text style={styles.wasteLevel}>
                  {getWasteLevel(result.predicted_waste_percentage || 0).emoji} {getWasteLevel(result.predicted_waste_percentage || 0).label}
                </Text>
              </View>
            </View>
            
            <View style={styles.predictionStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{(result.predicted_waste || 0).toFixed(1)} lbs</Text>
                <Text style={styles.statLabel}>Predicted Waste</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{(result.predicted_waste_percentage || 0).toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Waste Percentage</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{result.recommended_quantity || 0} lbs</Text>
                <Text style={styles.statLabel}>Recommended Qty</Text>
              </View>
            </View>

            {/* Confidence Interval */}
            {result.confidence_interval && (
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceTitle}>📊 Confidence Range</Text>
                <Text style={styles.confidenceText}>
                  {(result.confidence_interval.lower || 0).toFixed(1)} - {(result.confidence_interval.upper || 0).toFixed(1)} lbs
                </Text>
                <Text style={styles.accuracyText}>
                  Model Accuracy: {((result.model_accuracy || 0.85) * 100).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          {/* Factor Influence */}
          {result.factors_influence && (
            <View style={styles.factorsCard}>
              <Text style={styles.factorsTitle}>🧠 AI Factor Analysis</Text>
              <View style={styles.factorsList}>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>🌤️ Weather Impact</Text>
                  <Text style={styles.factorValue}>{(result.factors_influence.weather_impact || 0).toFixed(1)}%</Text>
                </View>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>📅 Day of Week</Text>
                  <Text style={styles.factorValue}>{(result.factors_influence.day_of_week_impact || 0).toFixed(1)}%</Text>
                </View>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>🍂 Seasonal Effect</Text>
                  <Text style={styles.factorValue}>{(result.factors_influence.seasonal_impact || 0).toFixed(1)}%</Text>
                </View>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>🎉 Event Impact</Text>
                  <Text style={styles.factorValue}>{(result.factors_influence.event_impact || 0).toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          )}

          {/* Savings Potential */}
          {(result.potential_savings || 0) > 0 && (
            <View style={styles.savingsCard}>
              <Text style={styles.savingsTitle}>💰 Potential Savings</Text>
              <Text style={styles.savingsAmount}>${((result.potential_savings || 0) * 3.5).toFixed(2)}</Text>
              <Text style={styles.savingsText}>
                By following AI recommendations, you could save {(result.potential_savings || 0).toFixed(1)} lbs of food
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Prediction History */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>📈 Recent Predictions</Text>
        {fetchingHistory ? (
          <ActivityIndicator size="large" color="#3DC86F" />
        ) : history.length > 0 ? (
          <View>
            {history.slice(0, 5).map((item, index) => {
              try {
                const input = typeof item.input === 'string' ? JSON.parse(item.input) : item.input;
                const result = typeof item.result === 'string' ? JSON.parse(item.result) : item.result;
                return (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyMenuItem}>{input.menu_item || 'Unknown Item'}</Text>
                      <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.historyStats}>
                      <Text style={styles.historyText}>
                        🎯 {(result.predicted_waste_percentage?.toFixed(1) || result.prediction || '0')}% waste predicted
                      </Text>
                      <Text style={styles.historyText}>
                        📊 {input.quantity_to_prepare || 'N/A'} lbs planned
                      </Text>
                    </View>
                  </View>
                );
              } catch (e) {
                return (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyText}>Error parsing history item</Text>
                  </View>
                );
              }
            })}
          </View>
        ) : (
          <Text style={styles.noHistoryText}>No predictions yet. Run your first forecast above! 🚀</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#334155',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  pickerContainer: {
    backgroundColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  picker: {
    color: '#fff',
    height: 50,
    backgroundColor: '#334155',
  },
  pickerItem: {
    color: '#fff',
    backgroundColor: '#334155',
  },
  dayInfo: {
    color: '#3DC86F',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  forecastBtn: {
    backgroundColor: '#3DC86F',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  forecastBtnDisabled: {
    backgroundColor: '#475569',
  },
  forecastBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    marginBottom: 24,
  },
  predictionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3DC86F',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  wasteIndicator: {
    backgroundColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  wasteLevel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  predictionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#3DC86F',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  confidenceContainer: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  confidenceTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  confidenceText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  accuracyText: {
    color: '#3DC86F',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  factorsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  factorsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  factorsList: {
    gap: 12,
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  factorLabel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  factorValue: {
    color: '#3DC86F',
    fontSize: 14,
    fontWeight: '700',
  },
  savingsCard: {
    backgroundColor: '#065F46',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  savingsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  savingsAmount: {
    color: '#34D399',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  savingsText: {
    color: '#A7F3D0',
    fontSize: 14,
    textAlign: 'center',
  },
  historyContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  historyItem: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyMenuItem: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    color: '#64748B',
    fontSize: 12,
  },
  historyStats: {
    gap: 4,
  },
  historyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  noHistoryText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 