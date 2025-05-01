import { dataLoader, DailyProduction, ExternalFactor } from '../utils/dataLoader';
import { Statistics } from '../utils/statistics';

export interface ForecastInput {
  menu_item: string;
  date: string;
  weather?: string;
  temperature?: number;
  special_event?: string;
  estimated_students?: number;
  quantity_to_prepare: number;
}

export interface ForecastResult {
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

export class ForecastModel {
  private production_data: DailyProduction[];
  private external_data: ExternalFactor[];
  private model_cache: Map<string, any> = new Map();

  constructor() {
    this.production_data = dataLoader.loadDailyProduction();
    this.external_data = dataLoader.loadExternalFactors();
  }

  // Main prediction function
  predict(input: ForecastInput): ForecastResult {
    const menu_item_data = this.getMenuItemData(input.menu_item);
    
    if (menu_item_data.length < 5) {
      // Fallback to category average if insufficient data
      return this.predictFromCategory(input);
    }

    // Prepare features for prediction
    const features = this.prepareFeatures(input, menu_item_data);
    const model = this.getOrTrainModel(input.menu_item);

    // Make prediction
    const predicted_waste_percentage = this.predictWastePercentage(features, model);
    const predicted_waste = (predicted_waste_percentage / 100) * input.quantity_to_prepare;

    // Calculate confidence intervals
    const confidence_interval = this.calculateConfidenceInterval(
      input.menu_item,
      predicted_waste_percentage
    );

    // Optimize recommended quantity
    const recommended_quantity = this.optimizeQuantity(input, predicted_waste_percentage);

    // Calculate potential savings
    const current_avg_waste = this.getAverageWastePercentage(input.menu_item);
    const potential_savings = Math.max(0, 
      (current_avg_waste - predicted_waste_percentage) / 100 * input.quantity_to_prepare
    );

    // Analyze factor influences
    const factors_influence = this.analyzeFactorInfluence(input, menu_item_data);

    return {
      predicted_waste,
      predicted_waste_percentage,
      confidence_interval: {
        lower: Math.max(0, predicted_waste + confidence_interval.lower),
        upper: predicted_waste + confidence_interval.upper
      },
      recommended_quantity,
      potential_savings,
      model_accuracy: model.accuracy,
      factors_influence
    };
  }

  private getMenuItemData(menu_item: string): DailyProduction[] {
    return this.production_data.filter(d => d.menu_item === menu_item);
  }

  private prepareFeatures(input: ForecastInput, historical_data: DailyProduction[]): number[] {
    const date = new Date(input.date);
    const day_of_week = date.getDay(); // 0 = Sunday, 6 = Saturday
    const month = date.getMonth(); // 0 = January, 11 = December
    
    // Get external factors for the date
    const external = this.external_data.find(e => e.date === input.date);
    
    // Encode categorical variables as numbers
    const weather_encoding = this.encodeWeather(input.weather || 'sunny');
    const special_event_encoding = this.encodeSpecialEvent(input.special_event || 'none');
    
    // Calculate historical averages for this item
    const avg_waste_percentage = this.getAverageWastePercentage(input.menu_item);
    const avg_students = historical_data.reduce((sum, d) => sum + d.estimated_students, 0) / historical_data.length;
    
    // Seasonal patterns
    const seasonal_factor = this.getSeasonalFactor(input.menu_item, month);
    
    return [
      day_of_week,
      month,
      weather_encoding,
      input.temperature || 65,
      special_event_encoding,
      (input.estimated_students || 1000) / 1000, // Normalize
      avg_waste_percentage,
      seasonal_factor,
      external?.student_population_factor || 1.0,
      external?.precipitation_inches || 0
    ];
  }

  private getOrTrainModel(menu_item: string): any {
    const cache_key = `model_${menu_item}`;
    
    if (this.model_cache.has(cache_key)) {
      return this.model_cache.get(cache_key);
    }

    const model = this.trainModel(menu_item);
    this.model_cache.set(cache_key, model);
    return model;
  }

  private trainModel(menu_item: string): any {
    const menu_item_data = this.getMenuItemData(menu_item);
    
    if (menu_item_data.length < 5) {
      return this.getCategoryModel(menu_item_data[0]?.category || 'Entree');
    }

    // Prepare training data
    const X: number[][] = [];
    const y: number[] = [];

    menu_item_data.forEach(record => {
      const features = this.prepareHistoricalFeatures(record);
      X.push(features);
      y.push(record.waste_percentage);
    });

    // Train multiple regression model
    const regression = Statistics.multipleRegression(X, y);
    
    // Calculate residuals for confidence intervals
    const residuals = y.map((actual, i) => {
      const predicted = this.predictWithCoefficients([1, ...X[i]], regression.coefficients);
      return actual - predicted;
    });

    // Cross-validation for accuracy
    const accuracy = this.crossValidateModel(X, y);

    return {
      coefficients: regression.coefficients,
      r2: regression.r2,
      residuals,
      accuracy,
      feature_importance: this.calculateFeatureImportance(X, y, regression.coefficients)
    };
  }

  private prepareHistoricalFeatures(record: DailyProduction): number[] {
    const date = new Date(record.date);
    const day_of_week = date.getDay();
    const month = date.getMonth();
    
    const external = this.external_data.find(e => e.date === record.date);
    
    return [
      day_of_week,
      month,
      this.encodeWeather(record.weather),
      record.temperature_f,
      this.encodeSpecialEvent(record.special_event),
      record.estimated_students / 1000,
      this.getHistoricalAverage(record.menu_item, record.date),
      this.getSeasonalFactor(record.menu_item, month),
      external?.student_population_factor || 1.0,
      external?.precipitation_inches || 0
    ];
  }

  private predictWastePercentage(features: number[], model: any): number {
    const prediction = this.predictWithCoefficients([1, ...features], model.coefficients);
    return Math.max(0, Math.min(100, prediction)); // Clamp between 0-100%
  }

  private predictWithCoefficients(features: number[], coefficients: number[]): number {
    return features.reduce((sum, feature, i) => sum + feature * coefficients[i], 0);
  }

  private calculateConfidenceInterval(menu_item: string, prediction: number): { lower: number; upper: number } {
    const model = this.getOrTrainModel(menu_item);
    const std_residual = Math.sqrt(
      model.residuals.reduce((sum: number, r: number) => sum + r * r, 0) / model.residuals.length
    );
    
    // 95% confidence interval (±1.96 standard deviations)
    const margin = 1.96 * std_residual;
    
    return {
      lower: -margin,
      upper: margin
    };
  }

  private optimizeQuantity(input: ForecastInput, predicted_waste_percentage: number): number {
    // Target a specific waste percentage (e.g., 5%) by adjusting quantity
    const target_waste_percentage = 5;
    const adjustment_factor = predicted_waste_percentage > target_waste_percentage 
      ? (100 - target_waste_percentage) / (100 - predicted_waste_percentage)
      : 1;
    
    return Math.round(input.quantity_to_prepare * adjustment_factor);
  }

  private analyzeFactorInfluence(input: ForecastInput, historical_data: DailyProduction[]): any {
    // Analyze correlation between factors and waste
    const weather_data = historical_data.map(d => this.encodeWeather(d.weather));
    const waste_data = historical_data.map(d => d.waste_percentage);
    const day_data = historical_data.map(d => new Date(d.date).getDay());
    const event_data = historical_data.map(d => this.encodeSpecialEvent(d.special_event));
    const month_data = historical_data.map(d => new Date(d.date).getMonth());

    return {
      weather_impact: Math.abs(Statistics.correlation(weather_data, waste_data)) * 100,
      day_of_week_impact: Math.abs(Statistics.correlation(day_data, waste_data)) * 100,
      seasonal_impact: Math.abs(Statistics.correlation(month_data, waste_data)) * 100,
      event_impact: Math.abs(Statistics.correlation(event_data, waste_data)) * 100
    };
  }

  // Utility methods
  private encodeWeather(weather: string): number {
    const weather_map: { [key: string]: number } = {
      'sunny': 1,
      'cloudy': 2,
      'rainy': 3,
      'stormy': 4
    };
    return weather_map[weather.toLowerCase()] || 1;
  }

  private encodeSpecialEvent(event: string): number {
    const event_map: { [key: string]: number } = {
      'none': 0,
      'holiday': 1,
      'orientation': 2,
      'exam_week': 3,
      'spring_break': 4,
      'sports_game': 5,
      'graduation': 6
    };
    return event_map[event.toLowerCase()] || 0;
  }

  private getAverageWastePercentage(menu_item: string): number {
    const data = this.getMenuItemData(menu_item);
    if (data.length === 0) return 15; // Default assumption
    
    return data.reduce((sum, d) => sum + d.waste_percentage, 0) / data.length;
  }

  private getSeasonalFactor(menu_item: string, month: number): number {
    const data = this.getMenuItemData(menu_item);
    const seasonal_data = data.filter(d => new Date(d.date).getMonth() === month);
    
    if (seasonal_data.length === 0) return 1;
    
    const seasonal_avg = seasonal_data.reduce((sum, d) => sum + d.waste_percentage, 0) / seasonal_data.length;
    const overall_avg = data.reduce((sum, d) => sum + d.waste_percentage, 0) / data.length;
    
    return seasonal_avg / overall_avg;
  }

  private getHistoricalAverage(menu_item: string, before_date: string): number {
    const data = this.getMenuItemData(menu_item)
      .filter(d => d.date < before_date)
      .slice(-10); // Last 10 occurrences
    
    if (data.length === 0) return 15; // Default
    
    return data.reduce((sum, d) => sum + d.waste_percentage, 0) / data.length;
  }

  private getCategoryModel(category: string): any {
    // Fallback model based on category averages
    const category_data = this.production_data.filter(d => d.category === category);
    const avg_waste = category_data.reduce((sum, d) => sum + d.waste_percentage, 0) / category_data.length;
    
    return {
      coefficients: [avg_waste], // Simple average
      r2: 0.5,
      residuals: [0],
      accuracy: 0.7,
      feature_importance: []
    };
  }

  private predictFromCategory(input: ForecastInput): ForecastResult {
    const category = this.production_data.find(d => d.menu_item === input.menu_item)?.category || 'Entree';
    const category_avg = this.production_data
      .filter(d => d.category === category)
      .reduce((sum, d) => sum + d.waste_percentage, 0) / 
      this.production_data.filter(d => d.category === category).length;

    const predicted_waste = (category_avg / 100) * input.quantity_to_prepare;

    return {
      predicted_waste,
      predicted_waste_percentage: category_avg,
      confidence_interval: { lower: -5, upper: 5 },
      recommended_quantity: input.quantity_to_prepare * 0.95,
      potential_savings: 0,
      model_accuracy: 0.7,
      factors_influence: { weather_impact: 0, day_of_week_impact: 0, seasonal_impact: 0, event_impact: 0 }
    };
  }

  private crossValidateModel(X: number[][], y: number[]): number {
    const folds = 5;
    const fold_size = Math.floor(X.length / folds);
    let total_accuracy = 0;

    for (let i = 0; i < folds; i++) {
      const start = i * fold_size;
      const end = start + fold_size;
      
      const X_train = [...X.slice(0, start), ...X.slice(end)];
      const y_train = [...y.slice(0, start), ...y.slice(end)];
      const X_test = X.slice(start, end);
      const y_test = y.slice(start, end);

      const model = Statistics.multipleRegression(X_train, y_train);
      
      const predictions = X_test.map(features => 
        this.predictWithCoefficients([1, ...features], model.coefficients)
      );

      const mse = predictions.reduce((sum, pred, idx) => 
        sum + Math.pow(pred - y_test[idx], 2), 0) / predictions.length;
      const accuracy = Math.max(0, 1 - Math.sqrt(mse) / 20); // Normalize by expected range
      
      total_accuracy += accuracy;
    }

    return total_accuracy / folds;
  }

  private calculateFeatureImportance(X: number[][], y: number[], coefficients: number[]): number[] {
    return coefficients.slice(1).map(coef => Math.abs(coef)); // Skip intercept
  }

  // Public utility methods
  getMenuItemInsights(menu_item: string): any {
    const data = this.getMenuItemData(menu_item);
    if (data.length === 0) return null;

    const waste_percentages = data.map(d => d.waste_percentage);
    const stats = Statistics.summary(waste_percentages);
    
    // Trend analysis
    const dates = data.map(d => new Date(d.date).getTime());
    const trend = Statistics.linearRegression(
      dates.map((_, i) => i), 
      waste_percentages
    );

    // Seasonal analysis
    const seasonal = Statistics.seasonalDecompose(waste_percentages, 7); // Weekly seasonality

    return {
      statistics: stats,
      trend: {
        direction: trend.slope > 0 ? 'increasing' : 'decreasing',
        strength: Math.abs(trend.slope),
        r2: trend.r2
      },
      seasonality: seasonal,
      best_day: this.getBestDayForItem(menu_item),
      worst_day: this.getWorstDayForItem(menu_item)
    };
  }

  private getBestDayForItem(menu_item: string): string {
    const data = this.getMenuItemData(menu_item);
    const day_averages = new Map<string, number[]>();

    data.forEach(d => {
      if (!day_averages.has(d.day_of_week)) {
        day_averages.set(d.day_of_week, []);
      }
      day_averages.get(d.day_of_week)!.push(d.waste_percentage);
    });

    let best_day = '';
    let lowest_waste = Infinity;

    day_averages.forEach((wastes, day) => {
      const avg = wastes.reduce((sum, w) => sum + w, 0) / wastes.length;
      if (avg < lowest_waste) {
        lowest_waste = avg;
        best_day = day;
      }
    });

    return best_day;
  }

  private getWorstDayForItem(menu_item: string): string {
    const data = this.getMenuItemData(menu_item);
    const day_averages = new Map<string, number[]>();

    data.forEach(d => {
      if (!day_averages.has(d.day_of_week)) {
        day_averages.set(d.day_of_week, []);
      }
      day_averages.get(d.day_of_week)!.push(d.waste_percentage);
    });

    let worst_day = '';
    let highest_waste = -1;

    day_averages.forEach((wastes, day) => {
      const avg = wastes.reduce((sum, w) => sum + w, 0) / wastes.length;
      if (avg > highest_waste) {
        highest_waste = avg;
        worst_day = day;
      }
    });

    return worst_day;
  }
} 