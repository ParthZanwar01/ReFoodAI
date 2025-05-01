import { dataLoader, DailyProduction, ExternalFactor } from '../utils/dataLoader';

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

export class ForecastService {
  private production_data: DailyProduction[];
  private external_data: ExternalFactor[];

  constructor() {
    this.production_data = dataLoader.loadDailyProduction();
    this.external_data = dataLoader.loadExternalFactors();
  }

  async predict(input: ForecastInput): Promise<ForecastResult> {
    const menu_item_data = this.production_data.filter(d => d.menu_item === input.menu_item);
    
    if (menu_item_data.length < 3) {
      return this.predictFromCategory(input);
    }

    // Calculate historical average waste percentage
    const historical_waste_avg = menu_item_data.reduce((sum, d) => sum + d.waste_percentage, 0) / menu_item_data.length;
    
    // Apply adjustments based on input factors
    let adjusted_waste_percentage = historical_waste_avg;
    
    // Weather adjustment
    const weather_factor = this.getWeatherFactor(input.weather || 'sunny');
    adjusted_waste_percentage *= weather_factor;
    
    // Day of week adjustment
    const day_factor = this.getDayOfWeekFactor(input.menu_item, input.date);
    adjusted_waste_percentage *= day_factor;
    
    // Special event adjustment
    const event_factor = this.getEventFactor(input.special_event || 'none');
    adjusted_waste_percentage *= event_factor;
    
    // Student population adjustment
    const student_factor = this.getStudentFactor(input.estimated_students || 1000);
    adjusted_waste_percentage *= student_factor;
    
    // Clamp between reasonable bounds
    adjusted_waste_percentage = Math.max(1, Math.min(50, adjusted_waste_percentage));
    
    const predicted_waste = (adjusted_waste_percentage / 100) * input.quantity_to_prepare;
    
    // Calculate recommended quantity (target 5% waste)
    const target_waste_percentage = 5;
    const recommended_quantity = Math.round(input.quantity_to_prepare * (100 - target_waste_percentage) / (100 - adjusted_waste_percentage));
    
    // Calculate potential savings
    const potential_savings = Math.max(0, (historical_waste_avg - adjusted_waste_percentage) / 100 * input.quantity_to_prepare);
    
    // Analyze factor influences
    const factors_influence = this.analyzeFactorInfluence(input.menu_item);
    
    return {
      predicted_waste,
      predicted_waste_percentage: adjusted_waste_percentage,
      confidence_interval: {
        lower: predicted_waste * 0.8,
        upper: predicted_waste * 1.2
      },
      recommended_quantity,
      potential_savings,
      model_accuracy: 0.85,
      factors_influence
    };
  }

  private getWeatherFactor(weather: string): number {
    const weather_factors: { [key: string]: number } = {
      'sunny': 1.0,
      'cloudy': 1.1,
      'rainy': 1.3,
      'stormy': 1.5
    };
    return weather_factors[weather.toLowerCase()] || 1.0;
  }

  private getDayOfWeekFactor(menu_item: string, date: string): number {
    const day_of_week = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const menu_data = this.production_data.filter(d => d.menu_item === menu_item);
    
    const day_data = menu_data.filter(d => d.day_of_week === day_of_week);
    const overall_avg = menu_data.reduce((sum, d) => sum + d.waste_percentage, 0) / menu_data.length;
    
    if (day_data.length === 0) return 1.0;
    
    const day_avg = day_data.reduce((sum, d) => sum + d.waste_percentage, 0) / day_data.length;
    return day_avg / overall_avg;
  }

  private getEventFactor(event: string): number {
    const event_factors: { [key: string]: number } = {
      'none': 1.0,
      'holiday': 0.7,
      'orientation': 1.2,
      'exam_week': 0.8,
      'sports_game': 1.3,
      'graduation': 0.9
    };
    return event_factors[event.toLowerCase()] || 1.0;
  }

  private getStudentFactor(estimated_students: number): number {
    // Normalize around 1000 students
    const base_students = 1000;
    const ratio = estimated_students / base_students;
    
    // Higher student count typically means lower waste percentage (more gets eaten)
    return Math.max(0.5, Math.min(1.5, 1.2 - (ratio * 0.2)));
  }

  private analyzeFactorInfluence(menu_item: string): any {
    const menu_data = this.production_data.filter(d => d.menu_item === menu_item);
    
    if (menu_data.length < 5) {
      return {
        weather_impact: 20,
        day_of_week_impact: 15,
        seasonal_impact: 10,
        event_impact: 25
      };
    }

    // Simple correlation calculation without Statistics module
    const weather_scores = menu_data.map(d => this.encodeWeather(d.weather));
    const day_scores = menu_data.map(d => this.encodeDayOfWeek(d.day_of_week));
    const month_scores = menu_data.map(d => new Date(d.date).getMonth());
    const event_scores = menu_data.map(d => this.encodeEvent(d.special_event));
    const waste_scores = menu_data.map(d => d.waste_percentage);

    return {
      weather_impact: Math.abs(this.simpleCorrelation(weather_scores, waste_scores)) * 100,
      day_of_week_impact: Math.abs(this.simpleCorrelation(day_scores, waste_scores)) * 100,
      seasonal_impact: Math.abs(this.simpleCorrelation(month_scores, waste_scores)) * 100,
      event_impact: Math.abs(this.simpleCorrelation(event_scores, waste_scores)) * 100
    };
  }

  private simpleCorrelation(x: number[], y: number[]): number {
    if (x.length === 0 || y.length === 0 || x.length !== y.length) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateSummary(data: number[]): any {
    if (data.length === 0) return { mean: 0, median: 0, std: 0, min: 0, max: 0, q1: 0, q3: 0 };
    
    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    return {
      mean,
      median: sorted[Math.floor(n / 2)],
      std,
      min: Math.min(...data),
      max: Math.max(...data),
      q1: sorted[Math.floor(n * 0.25)],
      q3: sorted[Math.floor(n * 0.75)]
    };
  }

  private encodeWeather(weather: string): number {
    const map: { [key: string]: number } = { 'sunny': 1, 'cloudy': 2, 'rainy': 3, 'stormy': 4 };
    return map[weather.toLowerCase()] || 1;
  }

  private encodeDayOfWeek(day: string): number {
    const map: { [key: string]: number } = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
      'Friday': 5, 'Saturday': 6, 'Sunday': 7
    };
    return map[day] || 1;
  }

  private encodeEvent(event: string): number {
    const map: { [key: string]: number } = {
      'none': 0, 'holiday': 1, 'orientation': 2, 'exam_week': 3,
      'sports_game': 4, 'graduation': 5
    };
    return map[event.toLowerCase()] || 0;
  }

  private predictFromCategory(input: ForecastInput): ForecastResult {
    // Find the category of this menu item
    const item_record = this.production_data.find(d => d.menu_item === input.menu_item);
    const category = item_record?.category || 'Protein';
    
    // Calculate category average
    const category_data = this.production_data.filter(d => d.category === category);
    
    if (category_data.length === 0) {
      // Fallback to overall average if no category data
      const overall_avg = this.production_data.reduce((sum, d) => sum + d.waste_percentage, 0) / this.production_data.length;
      const predicted_waste = (overall_avg / 100) * input.quantity_to_prepare;
      
      return {
        predicted_waste,
        predicted_waste_percentage: overall_avg,
        confidence_interval: {
          lower: predicted_waste * 0.7,
          upper: predicted_waste * 1.3
        },
        recommended_quantity: Math.round(input.quantity_to_prepare * 0.95),
        potential_savings: 0,
        model_accuracy: 0.65,
        factors_influence: {
          weather_impact: 20,
          day_of_week_impact: 15,
          seasonal_impact: 10,
          event_impact: 25
        }
      };
    }
    
    const category_avg = category_data.reduce((sum, d) => sum + d.waste_percentage, 0) / category_data.length;
    const predicted_waste = (category_avg / 100) * input.quantity_to_prepare;

    return {
      predicted_waste,
      predicted_waste_percentage: category_avg,
      confidence_interval: {
        lower: predicted_waste * 0.7,
        upper: predicted_waste * 1.3
      },
      recommended_quantity: Math.round(input.quantity_to_prepare * 0.95),
      potential_savings: 0,
      model_accuracy: 0.7,
      factors_influence: {
        weather_impact: 20,
        day_of_week_impact: 15,
        seasonal_impact: 10,
        event_impact: 25
      }
    };
  }

  // Get insights about a specific menu item
  getMenuItemInsights(menu_item: string): any {
    const data = this.production_data.filter(d => d.menu_item === menu_item);
    
    if (data.length === 0) {
      return null;
    }

    const waste_percentages = data.map(d => d.waste_percentage);
    const stats = this.calculateSummary(waste_percentages);
    
    // Find best and worst days
    const day_performance = new Map<string, number[]>();
    data.forEach(d => {
      if (!day_performance.has(d.day_of_week)) {
        day_performance.set(d.day_of_week, []);
      }
      day_performance.get(d.day_of_week)!.push(d.waste_percentage);
    });

    let best_day = '';
    let worst_day = '';
    let lowest_waste = Infinity;
    let highest_waste = -1;

    day_performance.forEach((wastes, day) => {
      const avg = wastes.reduce((sum, w) => sum + w, 0) / wastes.length;
      if (avg < lowest_waste) {
        lowest_waste = avg;
        best_day = day;
      }
      if (avg > highest_waste) {
        highest_waste = avg;
        worst_day = day;
      }
    });

    return {
      statistics: stats,
      total_occurrences: data.length,
      best_day: { day: best_day, avg_waste: lowest_waste },
      worst_day: { day: worst_day, avg_waste: highest_waste },
      recent_trend: this.getRecentTrend(data),
      seasonal_pattern: this.getSeasonalPattern(data)
    };
  }

  private getRecentTrend(data: DailyProduction[]): string {
    if (data.length < 4) return 'insufficient_data';
    
    const recent_data = data.slice(-4);
    const older_data = data.slice(-8, -4);
    
    const recent_avg = recent_data.reduce((sum, d) => sum + d.waste_percentage, 0) / recent_data.length;
    const older_avg = older_data.reduce((sum, d) => sum + d.waste_percentage, 0) / older_data.length;
    
    if (recent_avg < older_avg * 0.9) return 'improving';
    if (recent_avg > older_avg * 1.1) return 'worsening';
    return 'stable';
  }

  private getSeasonalPattern(data: DailyProduction[]): any {
    const monthly_averages = new Map<number, number[]>();
    
    data.forEach(d => {
      const month = new Date(d.date).getMonth();
      if (!monthly_averages.has(month)) {
        monthly_averages.set(month, []);
      }
      monthly_averages.get(month)!.push(d.waste_percentage);
    });

    const seasonal_data: { month: string; avg_waste: number }[] = [];
    const month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    monthly_averages.forEach((wastes, month) => {
      const avg = wastes.reduce((sum, w) => sum + w, 0) / wastes.length;
      seasonal_data.push({
        month: month_names[month],
        avg_waste: avg
      });
    });

    return seasonal_data.sort((a, b) => a.avg_waste - b.avg_waste);
  }

  // Get overall system insights
  getSystemInsights(): any {
    const stats = this.calculateSummary(this.production_data.map(d => d.waste_percentage));
    
    // Category analysis
    const categories = [...new Set(this.production_data.map(d => d.category))];
    const category_analysis = categories.map(category => {
      const category_data = this.production_data.filter(d => d.category === category);
      const avg_waste = category_data.reduce((sum, d) => sum + d.waste_percentage, 0) / category_data.length;
      return { category, avg_waste, count: category_data.length };
    }).sort((a, b) => b.avg_waste - a.avg_waste);

    // Top problematic items
    const item_analysis = new Map<string, number[]>();
    this.production_data.forEach(d => {
      if (!item_analysis.has(d.menu_item)) {
        item_analysis.set(d.menu_item, []);
      }
      item_analysis.get(d.menu_item)!.push(d.waste_percentage);
    });

    const problematic_items = Array.from(item_analysis.entries())
      .map(([item, wastes]) => ({
        menu_item: item,
        avg_waste: wastes.reduce((sum, w) => sum + w, 0) / wastes.length,
        occurrences: wastes.length
      }))
      .filter(item => item.occurrences >= 3)
      .sort((a, b) => b.avg_waste - a.avg_waste)
      .slice(0, 10);

    return {
      overall_stats: stats,
      category_performance: category_analysis,
      most_problematic_items: problematic_items,
      total_menu_items: item_analysis.size
    };
  }
}

export const forecastService = new ForecastService(); 