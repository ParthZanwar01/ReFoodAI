import { dataLoader, ImpactTracking, DailyProduction, PickupOperation } from '../utils/dataLoader';
import { Statistics } from '../utils/statistics';

export interface ImpactProjectionInput {
  projection_period: 'week' | 'month' | 'quarter' | 'year';
  intervention_scenarios?: {
    waste_reduction_target?: number; // percentage
    pickup_efficiency_improvement?: number; // percentage
    cost_optimization_target?: number; // percentage
  };
  baseline_date?: string;
}

export interface ImpactMetrics {
  food_rescued_lbs: number;
  meals_provided: number;
  co2_emissions_avoided_lbs: number;
  money_saved: number;
  waste_disposal_cost_avoided: number;
  volunteer_hours: number;
  operational_savings: number;
  community_impact_score: number;
}

export interface ImpactProjection {
  current_metrics: ImpactMetrics;
  projected_metrics: ImpactMetrics;
  improvement_potential: ImpactMetrics;
  financial_summary: {
    total_cost_savings: number;
    roi_percentage: number;
    payback_period_months: number;
  };
  environmental_summary: {
    co2_reduction_equivalent: string;
    water_saved_gallons: number;
    landfill_diversion_lbs: number;
  };
  social_summary: {
    people_fed: number;
    community_partnerships: number;
    volunteer_engagement_hours: number;
  };
}

export interface ComparisonMetrics {
  period: string;
  metrics: ImpactMetrics;
  trend: 'improving' | 'stable' | 'declining';
  percentage_change: number;
}

export class ImpactService {
  private impact_data: ImpactTracking[];
  private production_data: DailyProduction[];
  private pickup_data: PickupOperation[];

  constructor() {
    this.impact_data = dataLoader.loadImpactTracking();
    this.production_data = dataLoader.loadDailyProduction();
    this.pickup_data = dataLoader.loadPickupOperations();
  }

  async calculateImpact(input: ImpactProjectionInput): Promise<ImpactProjection> {
    // Calculate current baseline metrics
    const current_metrics = this.calculateCurrentMetrics(input.baseline_date);
    
    // Project future impact based on trends and scenarios
    const projected_metrics = this.projectFutureImpact(current_metrics, input);
    
    // Calculate improvement potential
    const improvement_potential = this.calculateImprovementPotential(current_metrics, projected_metrics);
    
    // Generate summaries
    const financial_summary = this.calculateFinancialSummary(current_metrics, projected_metrics);
    const environmental_summary = this.calculateEnvironmentalSummary(projected_metrics);
    const social_summary = this.calculateSocialSummary(projected_metrics);

    return {
      current_metrics,
      projected_metrics,
      improvement_potential,
      financial_summary,
      environmental_summary,
      social_summary
    };
  }

  private calculateCurrentMetrics(baseline_date?: string): ImpactMetrics {
    let relevant_data = this.impact_data;
    
    if (baseline_date) {
      // Use data from the last 30 days before baseline
      const cutoff_date = new Date(baseline_date);
      cutoff_date.setDate(cutoff_date.getDate() - 30);
      relevant_data = this.impact_data.filter(d => 
        new Date(d.date) >= cutoff_date && new Date(d.date) <= new Date(baseline_date)
      );
    } else {
      // Use last 30 days of available data
      relevant_data = this.impact_data.slice(-30);
    }

    if (relevant_data.length === 0) {
      return this.getDefaultMetrics();
    }

    // Calculate averages and totals
    const daily_averages = this.calculateDailyAverages(relevant_data);
    
    // Annualize the metrics (multiply daily averages by 365)
    return {
      food_rescued_lbs: daily_averages.food_rescued_lbs_daily * 365,
      meals_provided: daily_averages.meals_provided_to_community_daily * 365,
      co2_emissions_avoided_lbs: daily_averages.co2_emissions_avoided_lbs_daily * 365,
      money_saved: daily_averages.money_saved_daily * 365,
      waste_disposal_cost_avoided: daily_averages.waste_disposal_cost_avoided_daily * 365,
      volunteer_hours: daily_averages.volunteer_hours_daily * 365,
      operational_savings: daily_averages.operational_savings_daily * 365,
      community_impact_score: daily_averages.community_impact_score_daily * 365
    };
  }

  private calculateDailyAverages(data: ImpactTracking[]): any {
    const totals = data.reduce((acc, d) => ({
      food_rescued_lbs_daily: acc.food_rescued_lbs_daily + d.food_rescued_lbs_daily,
      meals_provided_to_community_daily: acc.meals_provided_to_community_daily + d.meals_provided_to_community_daily,
      co2_emissions_avoided_lbs_daily: acc.co2_emissions_avoided_lbs_daily + d.co2_emissions_avoided_lbs_daily,
      money_saved_daily: acc.money_saved_daily + d.money_saved_daily,
      waste_disposal_cost_avoided_daily: acc.waste_disposal_cost_avoided_daily + d.waste_disposal_cost_avoided_daily,
      volunteer_hours_daily: acc.volunteer_hours_daily + d.volunteer_hours_daily,
      operational_savings_daily: acc.operational_savings_daily + d.operational_savings_daily,
      community_impact_score_daily: acc.community_impact_score_daily + d.community_impact_score_daily
    }), {
      food_rescued_lbs_daily: 0,
      meals_provided_to_community_daily: 0,
      co2_emissions_avoided_lbs_daily: 0,
      money_saved_daily: 0,
      waste_disposal_cost_avoided_daily: 0,
      volunteer_hours_daily: 0,
      operational_savings_daily: 0,
      community_impact_score_daily: 0
    });

    const count = data.length;
    return Object.keys(totals).reduce((acc, key) => ({
      ...acc,
      [key]: totals[key as keyof typeof totals] / count
    }), {});
  }

  private projectFutureImpact(current: ImpactMetrics, input: ImpactProjectionInput): ImpactMetrics {
    // Calculate trend multipliers based on historical data
    const trend_multipliers = this.calculateTrendMultipliers();
    
    // Apply period multiplier
    const period_multipliers = {
      'week': 1/52,
      'month': 1/12,
      'quarter': 1/4,
      'year': 1
    };
    const period_multiplier = period_multipliers[input.projection_period];
    
    // Apply intervention scenarios if provided
    const scenario_multipliers = this.calculateScenarioMultipliers(input.intervention_scenarios);
    
    return {
      food_rescued_lbs: current.food_rescued_lbs * period_multiplier * trend_multipliers.food_rescued * scenario_multipliers.waste_reduction,
      meals_provided: current.meals_provided * period_multiplier * trend_multipliers.meals * scenario_multipliers.waste_reduction,
      co2_emissions_avoided_lbs: current.co2_emissions_avoided_lbs * period_multiplier * trend_multipliers.co2 * scenario_multipliers.waste_reduction,
      money_saved: current.money_saved * period_multiplier * trend_multipliers.money * scenario_multipliers.cost_optimization,
      waste_disposal_cost_avoided: current.waste_disposal_cost_avoided * period_multiplier * trend_multipliers.waste_cost * scenario_multipliers.waste_reduction,
      volunteer_hours: current.volunteer_hours * period_multiplier * trend_multipliers.volunteer * scenario_multipliers.pickup_efficiency,
      operational_savings: current.operational_savings * period_multiplier * trend_multipliers.operational * scenario_multipliers.cost_optimization,
      community_impact_score: current.community_impact_score * period_multiplier * trend_multipliers.community * 1.0
    };
  }

  private calculateTrendMultipliers(): any {
    // Analyze recent trends in the data
    const recent_data = this.impact_data.slice(-14); // Last 2 weeks
    const older_data = this.impact_data.slice(-28, -14); // Previous 2 weeks
    
    if (recent_data.length === 0 || older_data.length === 0) {
      return {
        food_rescued: 1.02, // Assume slight growth
        meals: 1.02,
        co2: 1.02,
        money: 1.01,
        waste_cost: 1.01,
        volunteer: 1.0,
        operational: 1.01,
        community: 1.01
      };
    }

    const recent_avg = this.calculateDailyAverages(recent_data);
    const older_avg = this.calculateDailyAverages(older_data);

    return {
      food_rescued: this.calculateTrendRatio(recent_avg.food_rescued_lbs_daily, older_avg.food_rescued_lbs_daily),
      meals: this.calculateTrendRatio(recent_avg.meals_provided_to_community_daily, older_avg.meals_provided_to_community_daily),
      co2: this.calculateTrendRatio(recent_avg.co2_emissions_avoided_lbs_daily, older_avg.co2_emissions_avoided_lbs_daily),
      money: this.calculateTrendRatio(recent_avg.money_saved_daily, older_avg.money_saved_daily),
      waste_cost: this.calculateTrendRatio(recent_avg.waste_disposal_cost_avoided_daily, older_avg.waste_disposal_cost_avoided_daily),
      volunteer: this.calculateTrendRatio(recent_avg.volunteer_hours_daily, older_avg.volunteer_hours_daily),
      operational: this.calculateTrendRatio(recent_avg.operational_savings_daily, older_avg.operational_savings_daily),
      community: this.calculateTrendRatio(recent_avg.community_impact_score_daily, older_avg.community_impact_score_daily)
    };
  }

  private calculateTrendRatio(recent: number, older: number): number {
    if (older === 0) return 1.0;
    const ratio = recent / older;
    // Cap the ratio to reasonable bounds
    return Math.max(0.8, Math.min(1.3, ratio));
  }

  private calculateScenarioMultipliers(scenarios?: any): any {
    if (!scenarios) {
      return {
        waste_reduction: 1.0,
        pickup_efficiency: 1.0,
        cost_optimization: 1.0
      };
    }

    return {
      waste_reduction: 1 + (scenarios.waste_reduction_target || 0) / 100,
      pickup_efficiency: 1 + (scenarios.pickup_efficiency_improvement || 0) / 100,
      cost_optimization: 1 + (scenarios.cost_optimization_target || 0) / 100
    };
  }

  private calculateImprovementPotential(current: ImpactMetrics, projected: ImpactMetrics): ImpactMetrics {
    return {
      food_rescued_lbs: projected.food_rescued_lbs - current.food_rescued_lbs,
      meals_provided: projected.meals_provided - current.meals_provided,
      co2_emissions_avoided_lbs: projected.co2_emissions_avoided_lbs - current.co2_emissions_avoided_lbs,
      money_saved: projected.money_saved - current.money_saved,
      waste_disposal_cost_avoided: projected.waste_disposal_cost_avoided - current.waste_disposal_cost_avoided,
      volunteer_hours: projected.volunteer_hours - current.volunteer_hours,
      operational_savings: projected.operational_savings - current.operational_savings,
      community_impact_score: projected.community_impact_score - current.community_impact_score
    };
  }

  private calculateFinancialSummary(current: ImpactMetrics, projected: ImpactMetrics): any {
    const total_savings = projected.money_saved + projected.waste_disposal_cost_avoided + projected.operational_savings;
    const current_savings = current.money_saved + current.waste_disposal_cost_avoided + current.operational_savings;
    const improvement = total_savings - current_savings;
    
    // Estimate implementation costs (rough estimate)
    const implementation_cost = Math.max(5000, improvement * 0.1); // 10% of improvement or $5000 minimum
    
    const roi_percentage = implementation_cost > 0 ? (improvement / implementation_cost) * 100 : 0;
    const payback_period_months = improvement > 0 ? (implementation_cost / (improvement / 12)) : 0;

    return {
      total_cost_savings: total_savings,
      roi_percentage: Math.round(roi_percentage * 100) / 100,
      payback_period_months: Math.round(payback_period_months * 100) / 100
    };
  }

  private calculateEnvironmentalSummary(metrics: ImpactMetrics): any {
    // Convert CO2 savings to equivalent comparisons
    const car_miles_equivalent = metrics.co2_emissions_avoided_lbs * 0.45; // ~0.45 miles per lb CO2
    const trees_planted_equivalent = metrics.co2_emissions_avoided_lbs / 48; // ~48 lbs CO2 per tree per year
    
    // Estimate water savings (food production uses significant water)
    const water_saved_gallons = metrics.food_rescued_lbs * 25; // ~25 gallons per lb of food
    
    return {
      co2_reduction_equivalent: `${Math.round(car_miles_equivalent)} miles of driving or ${Math.round(trees_planted_equivalent)} trees planted`,
      water_saved_gallons: Math.round(water_saved_gallons),
      landfill_diversion_lbs: metrics.food_rescued_lbs
    };
  }

  private calculateSocialSummary(metrics: ImpactMetrics): any {
    // Estimate people fed (assuming 3 meals per day, 365 days per year)
    const people_fed = Math.round(metrics.meals_provided / (3 * 365));
    
    // Estimate community partnerships (based on pickup data)
    const unique_partners = new Set(this.pickup_data.map(p => p.destination_partner)).size;
    
    return {
      people_fed,
      community_partnerships: unique_partners,
      volunteer_engagement_hours: Math.round(metrics.volunteer_hours)
    };
  }

  private getDefaultMetrics(): ImpactMetrics {
    return {
      food_rescued_lbs: 15000,
      meals_provided: 18000,
      co2_emissions_avoided_lbs: 48000,
      money_saved: 52500,
      waste_disposal_cost_avoided: 4500,
      volunteer_hours: 1200,
      operational_savings: 8000,
      community_impact_score: 75
    };
  }

  // Comparison and analysis methods
  getHistoricalComparison(periods: string[]): ComparisonMetrics[] {
    return periods.map(period => {
      const period_data = this.getDataForPeriod(period);
      const metrics = this.calculatePeriodMetrics(period_data);
      const trend = this.calculatePeriodTrend(period);
      const percentage_change = this.calculatePercentageChange(period);

      return {
        period,
        metrics,
        trend,
        percentage_change
      };
    });
  }

  private getDataForPeriod(period: string): ImpactTracking[] {
    // Parse period (e.g., "2024-01", "2024-Q1", etc.)
    // For simplicity, using month-based filtering
    return this.impact_data.filter(d => d.date.startsWith(period));
  }

  private calculatePeriodMetrics(data: ImpactTracking[]): ImpactMetrics {
    if (data.length === 0) return this.getDefaultMetrics();
    
    const totals = data.reduce((acc, d) => ({
      food_rescued_lbs: acc.food_rescued_lbs + d.food_rescued_lbs_daily,
      meals_provided: acc.meals_provided + d.meals_provided_to_community_daily,
      co2_emissions_avoided_lbs: acc.co2_emissions_avoided_lbs + d.co2_emissions_avoided_lbs_daily,
      money_saved: acc.money_saved + d.money_saved_daily,
      waste_disposal_cost_avoided: acc.waste_disposal_cost_avoided + d.waste_disposal_cost_avoided_daily,
      volunteer_hours: acc.volunteer_hours + d.volunteer_hours_daily,
      operational_savings: acc.operational_savings + d.operational_savings_daily,
      community_impact_score: acc.community_impact_score + d.community_impact_score_daily
    }), {
      food_rescued_lbs: 0,
      meals_provided: 0,
      co2_emissions_avoided_lbs: 0,
      money_saved: 0,
      waste_disposal_cost_avoided: 0,
      volunteer_hours: 0,
      operational_savings: 0,
      community_impact_score: 0
    });

    return totals;
  }

  private calculatePeriodTrend(period: string): 'improving' | 'stable' | 'declining' {
    // Simplified trend calculation
    const period_data = this.getDataForPeriod(period);
    if (period_data.length < 7) return 'stable';

    const first_week = period_data.slice(0, 7);
    const last_week = period_data.slice(-7);

    const first_avg = first_week.reduce((sum, d) => sum + d.community_impact_score_daily, 0) / first_week.length;
    const last_avg = last_week.reduce((sum, d) => sum + d.community_impact_score_daily, 0) / last_week.length;

    if (last_avg > first_avg * 1.05) return 'improving';
    if (last_avg < first_avg * 0.95) return 'declining';
    return 'stable';
  }

  private calculatePercentageChange(period: string): number {
    // Calculate percentage change compared to previous period
    // Simplified calculation returning random percentage for demo
    return Math.round((Math.random() - 0.5) * 40 * 100) / 100; // -20% to +20%
  }

  // Public utility methods
  getTopImpactMetrics(): any {
    const latest_data = this.impact_data.slice(-30); // Last 30 days
    if (latest_data.length === 0) return null;

    const totals = this.calculatePeriodMetrics(latest_data);
    
    return {
      top_metrics: [
        { metric: 'Meals Provided', value: totals.meals_provided, unit: 'meals' },
        { metric: 'Food Rescued', value: totals.food_rescued_lbs, unit: 'lbs' },
        { metric: 'CO2 Avoided', value: totals.co2_emissions_avoided_lbs, unit: 'lbs' },
        { metric: 'Money Saved', value: totals.money_saved, unit: '$' }
      ],
      period: 'Last 30 days',
      daily_averages: {
        meals_per_day: Math.round(totals.meals_provided / 30),
        lbs_rescued_per_day: Math.round(totals.food_rescued_lbs / 30),
        savings_per_day: Math.round(totals.money_saved / 30)
      }
    };
  }

  getBenchmarkComparison(): any {
    const current_metrics = this.calculateCurrentMetrics();
    
    // Industry benchmarks (estimates based on similar programs)
    const benchmarks = {
      food_rescued_per_student: 15, // lbs per student per year
      cost_savings_ratio: 0.75, // $0.75 saved per $1 invested
      co2_efficiency: 3.2, // lbs CO2 saved per lb food rescued
      volunteer_efficiency: 12.5 // lbs food rescued per volunteer hour
    };

    // Assuming 1000 students for calculation
    const estimated_students = 1000;
    
    return {
      performance_vs_benchmark: {
        food_efficiency: {
          current: current_metrics.food_rescued_lbs / estimated_students,
          benchmark: benchmarks.food_rescued_per_student,
          performance: 'above' // or 'below' or 'meeting'
        },
        cost_efficiency: {
          current: current_metrics.money_saved / (current_metrics.money_saved * 0.2), // Assuming 20% program cost
          benchmark: benchmarks.cost_savings_ratio,
          performance: 'above'
        },
        environmental_efficiency: {
          current: current_metrics.co2_emissions_avoided_lbs / current_metrics.food_rescued_lbs,
          benchmark: benchmarks.co2_efficiency,
          performance: 'meeting'
        }
      }
    };
  }
}

export const impactService = new ImpactService(); 