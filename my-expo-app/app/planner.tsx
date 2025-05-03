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
import { runPlanner, getPlans } from '../utils/api';

interface MenuRecommendation {
  menu_item: string;
  category: string;
  recommended_quantity: number;
  expected_waste: number;
  cost_per_serving: number;
  popularity_score: number;
  reasoning: string;
}

interface PlannerResult {
  recommended_menu: MenuRecommendation[];
  total_cost: number;
  total_expected_waste: number;
  waste_percentage: number;
  cost_savings: number;
  nutritional_balance: {
    protein_items: number;
    carb_items: number;
    vegetable_items: number;
    dessert_items: number;
  };
  risk_assessment: {
    high_risk_items: string[];
    safe_items: string[];
    weather_considerations: string[];
  };
}

interface PlanHistory {
  id: string;
  input: any;
  result: PlannerResult;
  created_at: string;
}

export default function PlannerScreen() {
  // Form inputs
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedStudents, setEstimatedStudents] = useState('1000');
  const [budgetConstraint, setBudgetConstraint] = useState('');
  const [targetCategories, setTargetCategories] = useState<string[]>(['lunch', 'dinner']);
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([]);
  const [avoidItems, setAvoidItems] = useState('');
  
  // State
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<PlanHistory[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  // Available categories and dietary options
  const menuCategories = [
    { label: '🌅 Breakfast', value: 'breakfast' },
    { label: '🍽️ Lunch', value: 'lunch' },
    { label: '🌙 Dinner', value: 'dinner' }
  ];

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
    'Nut-Free', 'Low-Sodium', 'Low-Fat', 'Halal', 'Kosher'
  ];

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const res = await getPlans();
      setHistory(res.plans);
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
    if (!date) {
      Alert.alert('Missing Input', 'Please select a date');
      return false;
    }
    if (!estimatedStudents || isNaN(Number(estimatedStudents)) || Number(estimatedStudents) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of students');
      return false;
    }
    if (targetCategories.length === 0) {
      Alert.alert('Missing Input', 'Please select at least one menu category');
      return false;
    }
    if (budgetConstraint && (isNaN(Number(budgetConstraint)) || Number(budgetConstraint) <= 0)) {
      Alert.alert('Invalid Input', 'Please enter a valid budget constraint or leave it empty');
      return false;
    }
    return true;
  };

  const handleRunPlanner = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const input = {
        date: date,
        estimated_students: Number(estimatedStudents),
        budget_constraint: budgetConstraint ? Number(budgetConstraint) : undefined,
        dietary_requirements: dietaryRequirements.length > 0 ? dietaryRequirements : undefined,
        avoid_items: avoidItems ? avoidItems.split(',').map(item => item.trim()).filter(Boolean) : undefined,
        target_categories: targetCategories
      };
      
      console.log('Sending planner input:', input);
      const res = await runPlanner(input);
      console.log('Planner response:', res);
      
      if (res && res.result) {
        // Validate the result structure
        const result = res.result;
        if (!result.recommended_menu || !Array.isArray(result.recommended_menu)) {
          setError('Invalid menu recommendations received from server');
          return;
        }
        
        setResult(result);
        fetchHistory();
      } else {
        setError('No menu plan received from server');
      }
    } catch (e: any) {
      console.error('Planner error:', e);
      if (e.message?.includes('fetch')) {
        setError('Failed to connect to server. Please check if the backend is running.');
      } else if (e.message?.includes('JSON')) {
        setError('Server returned invalid data format');
      } else {
        setError(e.message || 'Failed to generate menu plan');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryValue: string) => {
    setTargetCategories(prev => 
      prev.includes(categoryValue) 
        ? prev.filter(c => c !== categoryValue)
        : [...prev, categoryValue]
    );
  };

  const toggleDietary = (dietary: string) => {
    setDietaryRequirements(prev => 
      prev.includes(dietary) 
        ? prev.filter(d => d !== dietary)
        : [...prev, dietary]
    );
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

  const getCostSavingsColor = (savings: number) => {
    if (savings > 100) return '#10B981';
    if (savings > 50) return '#3DC86F';
    if (savings > 0) return '#F59E0B';
    return '#6B7280';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Action Planner</Text>
        <Text style={styles.subtitle}>AI-Powered Menu Optimization</Text>
      </View>

      {/* Input Form */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Planning Parameters</Text>
        
        {/* Date and Students */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#6B7280"
            />
            <Text style={styles.dayInfo}>{getDayOfWeek(date)}</Text>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Students *</Text>
            <TextInput
              style={styles.input}
              value={estimatedStudents}
              onChangeText={setEstimatedStudents}
              placeholder="1000"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Budget Constraint */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Budget Limit (optional)</Text>
          <TextInput
            style={styles.input}
            value={budgetConstraint}
            onChangeText={setBudgetConstraint}
            placeholder="Enter budget in dollars"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
        </View>

        {/* Target Categories */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Menu Categories *</Text>
          <Text style={styles.subLabel}>Select categories to include in your menu</Text>
          <View style={styles.chipContainer}>
            {menuCategories.map(category => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.chip,
                  targetCategories.includes(category.value) && styles.chipSelected
                ]}
                onPress={() => toggleCategory(category.value)}
              >
                <Text style={[
                  styles.chipText,
                  targetCategories.includes(category.value) && styles.chipTextSelected
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dietary Requirements */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dietary Requirements (optional)</Text>
          <Text style={styles.subLabel}>Select any dietary restrictions to consider</Text>
          <View style={styles.chipContainer}>
            {dietaryOptions.map(dietary => (
              <TouchableOpacity
                key={dietary}
                style={[
                  styles.chip,
                  dietaryRequirements.includes(dietary) && styles.chipSelected
                ]}
                onPress={() => toggleDietary(dietary)}
              >
                <Text style={[
                  styles.chipText,
                  dietaryRequirements.includes(dietary) && styles.chipTextSelected
                ]}>
                  {dietary}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Avoid Items */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Items to Avoid (optional)</Text>
          <TextInput
            style={styles.input}
            value={avoidItems}
            onChangeText={setAvoidItems}
            placeholder="e.g. Pizza, Pasta, Sushi (comma separated)"
            placeholderTextColor="#6B7280"
            multiline
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity 
          style={[styles.generateButton, loading && styles.generateButtonDisabled]} 
          onPress={handleRunPlanner}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.generateButtonText}>🎯 Generate Optimal Menu</Text>
          )}
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        ) : null}
      </View>

      {/* Results */}
      {result && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>📊 Menu Plan Results</Text>
          
          {/* Key Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Cost</Text>
              <Text style={styles.metricValue}>
                ${(result.total_cost || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Expected Waste</Text>
              <Text style={[styles.metricValue, { color: getWasteLevel(result.waste_percentage || 0).color }]}>
                {getWasteLevel(result.waste_percentage || 0).emoji} {(result.waste_percentage || 0).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Cost Savings</Text>
              <Text style={[styles.metricValue, { color: getCostSavingsColor(result.cost_savings || 0) }]}>
                ${(result.cost_savings || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Recommended Menu */}
          <View style={styles.menuContainer}>
            <Text style={styles.subsectionTitle}>🍽️ Recommended Menu</Text>
            {(result.recommended_menu || []).map((item, index) => (
              <View key={index} style={styles.menuItem}>
                <View style={styles.menuItemHeader}>
                  <Text style={styles.menuItemName}>{item.menu_item || 'Unknown Item'}</Text>
                  <Text style={styles.menuItemCategory}>{item.category || 'Unknown'}</Text>
                </View>
                <View style={styles.menuItemDetails}>
                  <Text style={styles.menuItemDetail}>
                    Quantity: {item.recommended_quantity || 0} servings
                  </Text>
                  <Text style={styles.menuItemDetail}>
                    Cost: ${(item.cost_per_serving || 0).toFixed(2)}/serving
                  </Text>
                  <Text style={styles.menuItemDetail}>
                    Popularity: {((item.popularity_score || 0) * 10).toFixed(1)}/10
                  </Text>
                  <Text style={styles.menuItemDetail}>
                    Expected Waste: {(item.expected_waste || 0).toFixed(1)} lbs
                  </Text>
                </View>
                <Text style={styles.menuItemReasoning}>{item.reasoning || 'No reasoning provided'}</Text>
              </View>
            ))}
          </View>

          {/* Nutritional Balance */}
          <View style={styles.nutritionContainer}>
            <Text style={styles.subsectionTitle}>🥗 Nutritional Balance</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Protein</Text>
                <Text style={styles.nutritionValue}>{result.nutritional_balance?.protein_items || 0}</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Carbs</Text>
                <Text style={styles.nutritionValue}>{result.nutritional_balance?.carb_items || 0}</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Vegetables</Text>
                <Text style={styles.nutritionValue}>{result.nutritional_balance?.vegetable_items || 0}</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Desserts</Text>
                <Text style={styles.nutritionValue}>{result.nutritional_balance?.dessert_items || 0}</Text>
              </View>
            </View>
          </View>

          {/* Risk Assessment */}
          <View style={styles.riskContainer}>
            <Text style={styles.subsectionTitle}>⚠️ Risk Assessment</Text>
            
            {(result.risk_assessment?.high_risk_items || []).length > 0 && (
              <View style={styles.riskSection}>
                <Text style={styles.riskTitle}>High Risk Items:</Text>
                {(result.risk_assessment.high_risk_items || []).map((item, index) => (
                  <Text key={index} style={styles.riskItem}>• {item}</Text>
                ))}
              </View>
            )}
            
            {(result.risk_assessment?.safe_items || []).length > 0 && (
              <View style={styles.riskSection}>
                <Text style={styles.riskTitle}>Safe Items:</Text>
                {(result.risk_assessment.safe_items || []).map((item, index) => (
                  <Text key={index} style={styles.riskItem}>• {item}</Text>
                ))}
              </View>
            )}
            
            {(result.risk_assessment?.weather_considerations || []).length > 0 && (
              <View style={styles.riskSection}>
                <Text style={styles.riskTitle}>Weather Considerations:</Text>
                {(result.risk_assessment.weather_considerations || []).map((consideration, index) => (
                  <Text key={index} style={styles.riskItem}>• {consideration}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* History */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>📈 Recent Plans</Text>
        {fetchingHistory ? (
          <ActivityIndicator size="large" color="#3DC86F" />
        ) : history.length > 0 ? (
          history.slice(0, 5).map((plan, index) => {
            try {
              const input = typeof plan.input === 'string' ? JSON.parse(plan.input) : plan.input;
              const result = typeof plan.result === 'string' ? JSON.parse(plan.result) : plan.result;
              
              return (
                <View key={plan.id || index} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(plan.created_at).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyWaste}>
                      {(result?.waste_percentage || 0).toFixed(1)}% waste
                    </Text>
                  </View>
                  <Text style={styles.historyDetails}>
                    {input?.estimated_students || 0} students • 
                    ${(result?.total_cost || 0).toFixed(2)} budget • 
                    {result?.recommended_menu?.length || 0} items
                  </Text>
                  <Text style={styles.historyCategories}>
                    Categories: {input?.target_categories?.join(', ') || 'None'}
                  </Text>
                </View>
              );
            } catch (e) {
              return (
                <View key={plan.id || index} style={styles.historyItem}>
                  <Text style={styles.historyDate}>Invalid plan data</Text>
                </View>
              );
            }
          })
        ) : (
          <Text style={styles.noHistoryText}>No plans generated yet. Create your first optimized menu!</Text>
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#475569',
  },
  dayInfo: {
    fontSize: 14,
    color: '#3DC86F',
    marginTop: 4,
    fontStyle: 'italic',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  chipSelected: {
    backgroundColor: '#3DC86F',
    borderColor: '#3DC86F',
  },
  chipText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#3DC86F',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#FEF2F2',
    fontSize: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  menuContainer: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  menuItemCategory: {
    fontSize: 12,
    color: '#3DC86F',
    fontWeight: '500',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  menuItemDetails: {
    marginBottom: 8,
  },
  menuItemDetail: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  menuItemReasoning: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  nutritionContainer: {
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3DC86F',
  },
  riskContainer: {
    marginBottom: 24,
  },
  riskSection: {
    marginBottom: 16,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  riskItem: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 4,
    paddingLeft: 8,
  },
  historyContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
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
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyWaste: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3DC86F',
  },
  historyDetails: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 4,
  },
  historyCategories: {
    fontSize: 14,
    color: '#94A3B8',
  },
  noHistoryText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
}); 