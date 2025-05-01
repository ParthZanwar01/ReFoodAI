import { forecastService } from './forecastService';
import { plannerService } from './plannerService';
import { trackerService } from './trackerService';
import { impactService } from './impactService';
import { dataLoader } from '../utils/dataLoader';
import { Statistics } from '../utils/statistics';

export interface DashboardOverview {
  summary_stats: {
    total_menu_items_tracked: number;
    total_pickups_completed: number;
    avg_waste_percentage: number;
    total_impact_score: number;
  };
  recent_trends: {
    waste_trend: 'improving' | 'stable' | 'worsening';
    pickup_efficiency_trend: 'improving' | 'stable' | 'worsening';
    cost_savings_trend: 'improving' | 'stable' | 'worsening';
  };
  alerts: AlertItem[];
  quick_insights: InsightItem[];
}

export interface AlertItem {
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  action_required?: string;
}

export interface InsightItem {
  category: 'forecast' | 'planner' | 'tracker' | 'impact';
  title: string;
  value: string;
  change_percentage?: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PerformanceMetrics {
  waste_reduction: {
    current_month: number;
    previous_month: number;
    target: number;
    performance: 'ahead' | 'on_track' | 'behind';
  };
  cost_savings: {
    current_month: number;
    previous_month: number;
    target: number;
    performance: 'ahead' | 'on_track' | 'behind';
  };
  pickup_efficiency: {
    current_success_rate: number;
    previous_success_rate: number;
    target: number;
    performance: 'ahead' | 'on_track' | 'behind';
  };
  environmental_impact: {
    co2_saved_current: number;
    co2_saved_previous: number;
    target: number;
    performance: 'ahead' | 'on_track' | 'behind';
  };
}

export interface TopItemsAnalysis {
  most_problematic_items: Array<{
    menu_item: string;
    avg_waste_percentage: number;
    frequency: number;
    estimated_annual_cost: number;
  }>;
  best_performing_items: Array<{
    menu_item: string;
    avg_waste_percentage: number;
    frequency: number;
    efficiency_score: number;
  }>;
  upcoming_high_risk: Array<{
    menu_item: string;
    scheduled_date: string;
    risk_level: 'high' | 'medium' | 'low';
    predicted_waste: number;
  }>;
}

export class DashboardService {
  private production_data = dataLoader.loadDailyProduction();
  private pickup_data = dataLoader.loadPickupOperations();
  private impact_data = dataLoader.loadImpactTracking();

  async getDashboardOverview(): Promise<DashboardOverview> {
    // Get summary statistics
    const summary_stats = this.calculateSummaryStats();
    
    // Analyze recent trends
    const recent_trends = await this.analyzeRecentTrends();
    
    // Generate alerts
    const alerts = await this.generateAlerts();
    
    // Create quick insights
    const quick_insights = await this.generateQuickInsights();

    return {
      summary_stats,
      recent_trends,
      alerts,
      quick_insights
    };
  }

  private calculateSummaryStats(): any {
    const unique_menu_items = new Set(this.production_data.map(d => d.menu_item)).size;
    const completed_pickups = this.pickup_data.filter(p => p.pickup_status === 'completed').length;
    const avg_waste = this.production_data.reduce((sum, d) => sum + d.waste_percentage, 0) / this.production_data.length;
    const avg_impact = this.impact_data.reduce((sum, d) => sum + d.community_impact_score_daily, 0) / this.impact_data.length;

    return {
      total_menu_items_tracked: unique_menu_items,
      total_pickups_completed: completed_pickups,
      avg_waste_percentage: Math.round(avg_waste * 100) / 100,
      total_impact_score: Math.round(avg_impact * 100) / 100
    };
  }

  private async analyzeRecentTrends(): Promise<any> {
    // Analyze last 2 weeks vs previous 2 weeks
    const recent_production = this.production_data.slice(-14);
    const previous_production = this.production_data.slice(-28, -14);
    
    const recent_pickups = this.pickup_data.slice(-14);
    const previous_pickups = this.pickup_data.slice(-28, -14);
    
    const recent_impact = this.impact_data.slice(-14);
    const previous_impact = this.impact_data.slice(-28, -14);

    // Waste trend
    const recent_waste_avg = recent_production.reduce((sum, d) => sum + d.waste_percentage, 0) / recent_production.length;
    const previous_waste_avg = previous_production.reduce((sum, d) => sum + d.waste_percentage, 0) / previous_production.length;
    const waste_trend = this.getTrend(recent_waste_avg, previous_waste_avg, 'lower_better');

    // Pickup efficiency trend
    const recent_success_rate = recent_pickups.filter(p => p.pickup_status === 'completed').length / recent_pickups.length;
    const previous_success_rate = previous_pickups.filter(p => p.pickup_status === 'completed').length / previous_pickups.length;
    const pickup_trend = this.getTrend(recent_success_rate, previous_success_rate, 'higher_better');

    // Cost savings trend
    const recent_savings = recent_impact.reduce((sum, d) => sum + d.money_saved_daily, 0) / recent_impact.length;
    const previous_savings = previous_impact.reduce((sum, d) => sum + d.money_saved_daily, 0) / previous_impact.length;
    const savings_trend = this.getTrend(recent_savings, previous_savings, 'higher_better');

    return {
      waste_trend,
      pickup_efficiency_trend: pickup_trend,
      cost_savings_trend: savings_trend
    };
  }

  private getTrend(recent: number, previous: number, direction: 'higher_better' | 'lower_better'): 'improving' | 'stable' | 'worsening' {
    const change_percentage = ((recent - previous) / previous) * 100;
    const threshold = 5; // 5% threshold for significant change

    if (Math.abs(change_percentage) < threshold) return 'stable';
    
    if (direction === 'higher_better') {
      return change_percentage > 0 ? 'improving' : 'worsening';
    } else {
      return change_percentage < 0 ? 'improving' : 'worsening';
    }
  }

  private async generateAlerts(): Promise<AlertItem[]> {
    const alerts: AlertItem[] = [];

    // High waste items alert
    const high_waste_items = this.identifyHighWasteItems();
    if (high_waste_items.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'High Waste Items Detected',
        message: `${high_waste_items.length} menu items showing waste >25%: ${high_waste_items.slice(0, 3).join(', ')}`,
        priority: 'high',
        action_required: 'Review forecast settings and consider menu adjustments'
      });
    }

    // Failed pickups alert
    const recent_failed_pickups = this.pickup_data.slice(-7).filter(p => p.pickup_status === 'failed');
    if (recent_failed_pickups.length > 2) {
      alerts.push({
        type: 'error',
        title: 'Multiple Failed Pickups',
        message: `${recent_failed_pickups.length} failed pickups in the last week`,
        priority: 'high',
        action_required: 'Check pickup logistics and partner availability'
      });
    }

    // Cost efficiency alert
    const avg_cost_per_pound = this.calculateAverageCostPerPound();
    if (avg_cost_per_pound > 5.0) {
      alerts.push({
        type: 'warning',
        title: 'High Operating Costs',
        message: `Average cost per pound rescued is $${avg_cost_per_pound.toFixed(2)}`,
        priority: 'medium',
        action_required: 'Review route optimization and operational efficiency'
      });
    }

    // Positive impact alert
    const recent_impact = this.impact_data.slice(-7);
    const total_meals_this_week = recent_impact.reduce((sum, d) => sum + d.meals_provided_to_community_daily, 0);
    if (total_meals_this_week > 500) {
      alerts.push({
        type: 'success',
        title: 'Exceptional Week!',
        message: `${Math.round(total_meals_this_week)} meals provided to community this week`,
        priority: 'low'
      });
    }

    return alerts.sort((a, b) => {
      const priority_order = { 'high': 3, 'medium': 2, 'low': 1 };
      return priority_order[b.priority] - priority_order[a.priority];
    });
  }

  private async generateQuickInsights(): Promise<InsightItem[]> {
    const insights: InsightItem[] = [];

    // Forecast insight
    const system_insights = forecastService.getSystemInsights();
    const worst_category = system_insights.category_performance[0];
    insights.push({
      category: 'forecast',
      title: 'Highest Waste Category',
      value: `${worst_category.category} (${worst_category.avg_waste.toFixed(1)}%)`,
      trend: 'down'
    });

    // Planner insight
    const category_insights = plannerService.getCategoryInsights();
    const most_efficient_category = category_insights.reduce((best: any, cat: any) => 
      cat.avg_waste_percentage < best.avg_waste_percentage ? cat : best
    );
    insights.push({
      category: 'planner',
      title: 'Most Efficient Category',
      value: `${most_efficient_category.category}`,
      trend: 'up'
    });

    // Tracker insight
    const system_performance = trackerService.getSystemPerformance();
    insights.push({
      category: 'tracker',
      title: 'Pickup Success Rate',
      value: `${(system_performance.overall_success_rate * 100).toFixed(1)}%`,
      trend: system_performance.overall_success_rate > 0.85 ? 'up' : 'down'
    });

    // Impact insight
    const top_impact = impactService.getTopImpactMetrics();
    if (top_impact) {
      insights.push({
        category: 'impact',
        title: 'Daily Meals Provided',
        value: `${top_impact.daily_averages.meals_per_day}`,
        trend: 'up'
      });
    }

    return insights;
  }

  private identifyHighWasteItems(): string[] {
    const item_averages = new Map<string, number[]>();
    
    this.production_data.forEach(d => {
      if (!item_averages.has(d.menu_item)) {
        item_averages.set(d.menu_item, []);
      }
      item_averages.get(d.menu_item)!.push(d.waste_percentage);
    });

    const high_waste_items: string[] = [];
    item_averages.forEach((wastes, item) => {
      const avg_waste = wastes.reduce((sum, w) => sum + w, 0) / wastes.length;
      if (avg_waste > 25 && wastes.length >= 3) { // At least 3 occurrences
        high_waste_items.push(item);
      }
    });

    return high_waste_items;
  }

  private calculateAverageCostPerPound(): number {
    const total_cost = this.pickup_data.reduce((sum, p) => sum + p.transport_cost, 0);
    const total_volume = this.pickup_data.reduce((sum, p) => sum + p.quantity_lbs, 0);
    return total_volume > 0 ? total_cost / total_volume : 0;
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const current_month_data = this.getCurrentMonthData();
    const previous_month_data = this.getPreviousMonthData();

    // Waste reduction metrics
    const current_waste = this.calculateAverageWaste(current_month_data.production);
    const previous_waste = this.calculateAverageWaste(previous_month_data.production);
    const waste_target = 12; // 12% target waste

    // Cost savings metrics
    const current_savings = this.calculateTotalSavings(current_month_data.impact);
    const previous_savings = this.calculateTotalSavings(previous_month_data.impact);
    const savings_target = 15000; // $15,000 monthly target

    // Pickup efficiency metrics
    const current_pickup_rate = this.calculateSuccessRate(current_month_data.pickups);
    const previous_pickup_rate = this.calculateSuccessRate(previous_month_data.pickups);
    const pickup_target = 0.90; // 90% success rate target

    // Environmental impact metrics
    const current_co2 = this.calculateTotalCO2(current_month_data.impact);
    const previous_co2 = this.calculateTotalCO2(previous_month_data.impact);
    const co2_target = 5000; // 5,000 lbs CO2 monthly target

    return {
      waste_reduction: {
        current_month: current_waste,
        previous_month: previous_waste,
        target: waste_target,
        performance: this.getPerformanceLevel(current_waste, waste_target, 'lower_better')
      },
      cost_savings: {
        current_month: current_savings,
        previous_month: previous_savings,
        target: savings_target,
        performance: this.getPerformanceLevel(current_savings, savings_target, 'higher_better')
      },
      pickup_efficiency: {
        current_success_rate: current_pickup_rate,
        previous_success_rate: previous_pickup_rate,
        target: pickup_target,
        performance: this.getPerformanceLevel(current_pickup_rate, pickup_target, 'higher_better')
      },
      environmental_impact: {
        co2_saved_current: current_co2,
        co2_saved_previous: previous_co2,
        target: co2_target,
        performance: this.getPerformanceLevel(current_co2, co2_target, 'higher_better')
      }
    };
  }

  private getCurrentMonthData(): any {
    const now = new Date();
    const current_month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    return {
      production: this.production_data.filter(d => d.date.startsWith(current_month)),
      pickups: this.pickup_data.filter(d => d.date.startsWith(current_month)),
      impact: this.impact_data.filter(d => d.date.startsWith(current_month))
    };
  }

  private getPreviousMonthData(): any {
    const now = new Date();
    const prev_month = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previous_month = prev_month.getFullYear() + '-' + String(prev_month.getMonth() + 1).padStart(2, '0');
    
    return {
      production: this.production_data.filter(d => d.date.startsWith(previous_month)),
      pickups: this.pickup_data.filter(d => d.date.startsWith(previous_month)),
      impact: this.impact_data.filter(d => d.date.startsWith(previous_month))
    };
  }

  private calculateAverageWaste(data: any[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.waste_percentage, 0) / data.length;
  }

  private calculateTotalSavings(data: any[]): number {
    return data.reduce((sum, d) => sum + d.money_saved_daily + d.operational_savings_daily, 0);
  }

  private calculateSuccessRate(data: any[]): number {
    if (data.length === 0) return 0;
    return data.filter(d => d.pickup_status === 'completed').length / data.length;
  }

  private calculateTotalCO2(data: any[]): number {
    return data.reduce((sum, d) => sum + d.co2_emissions_avoided_lbs_daily, 0);
  }

  private getPerformanceLevel(current: number, target: number, direction: 'higher_better' | 'lower_better'): 'ahead' | 'on_track' | 'behind' {
    const ratio = current / target;
    
    if (direction === 'higher_better') {
      if (ratio >= 1.1) return 'ahead';
      if (ratio >= 0.9) return 'on_track';
      return 'behind';
    } else {
      if (ratio <= 0.9) return 'ahead';
      if (ratio <= 1.1) return 'on_track';
      return 'behind';
    }
  }

  async getTopItemsAnalysis(): Promise<TopItemsAnalysis> {
    // Analyze most problematic items
    const item_stats = new Map<string, any>();
    
    this.production_data.forEach(d => {
      if (!item_stats.has(d.menu_item)) {
        item_stats.set(d.menu_item, {
          wastes: [],
          total_waste_cost: 0,
          frequency: 0
        });
      }
      
      const stats = item_stats.get(d.menu_item);
      stats.wastes.push(d.waste_percentage);
      stats.total_waste_cost += d.quantity_wasted * 3.5; // Estimated cost per lb
      stats.frequency += 1;
    });

    // Most problematic items
    const most_problematic = Array.from(item_stats.entries())
      .map(([item, stats]) => ({
        menu_item: item,
        avg_waste_percentage: stats.wastes.reduce((sum: number, w: number) => sum + w, 0) / stats.wastes.length,
        frequency: stats.frequency,
        estimated_annual_cost: stats.total_waste_cost * (365 / stats.frequency)
      }))
      .filter(item => item.frequency >= 3)
      .sort((a, b) => b.avg_waste_percentage - a.avg_waste_percentage)
      .slice(0, 10);

    // Best performing items
    const best_performing = Array.from(item_stats.entries())
      .map(([item, stats]) => ({
        menu_item: item,
        avg_waste_percentage: stats.wastes.reduce((sum: number, w: number) => sum + w, 0) / stats.wastes.length,
        frequency: stats.frequency,
        efficiency_score: 100 - (stats.wastes.reduce((sum: number, w: number) => sum + w, 0) / stats.wastes.length)
      }))
      .filter(item => item.frequency >= 3)
      .sort((a, b) => a.avg_waste_percentage - b.avg_waste_percentage)
      .slice(0, 10);

    // Upcoming high risk (mock data for next week)
    const upcoming_high_risk = most_problematic.slice(0, 5).map((item, index) => ({
      menu_item: item.menu_item,
      scheduled_date: this.getNextWeekDate(index),
      risk_level: item.avg_waste_percentage > 25 ? 'high' : item.avg_waste_percentage > 15 ? 'medium' : 'low',
      predicted_waste: Math.round(item.avg_waste_percentage * 0.8) // Assume 80 lbs planned
    })) as Array<{
      menu_item: string;
      scheduled_date: string;
      risk_level: 'high' | 'medium' | 'low';
      predicted_waste: number;
    }>;

    return {
      most_problematic_items: most_problematic,
      best_performing_items: best_performing,
      upcoming_high_risk
    };
  }

  private getNextWeekDate(dayOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + 7 + dayOffset);
    return date.toISOString().split('T')[0];
  }

  // Utility method for getting comprehensive system status
  async getSystemStatus(): Promise<any> {
    const overview = await this.getDashboardOverview();
    const performance = await this.getPerformanceMetrics();
    const top_items = await this.getTopItemsAnalysis();

    return {
      overview,
      performance,
      top_items,
      system_health: {
        data_freshness: this.checkDataFreshness(),
        api_status: 'operational',
        last_updated: new Date().toISOString()
      }
    };
  }

  private checkDataFreshness(): 'fresh' | 'stale' | 'outdated' {
    const latest_production = new Date(Math.max(...this.production_data.map(d => new Date(d.date).getTime())));
    const latest_pickup = new Date(Math.max(...this.pickup_data.map(d => new Date(d.date).getTime())));
    const latest_impact = new Date(Math.max(...this.impact_data.map(d => new Date(d.date).getTime())));
    
    const now = new Date();
    const day_ms = 24 * 60 * 60 * 1000;
    
    const oldest_latest = new Date(Math.min(latest_production.getTime(), latest_pickup.getTime(), latest_impact.getTime()));
    const days_old = (now.getTime() - oldest_latest.getTime()) / day_ms;
    
    if (days_old <= 1) return 'fresh';
    if (days_old <= 7) return 'stale';
    return 'outdated';
  }
}

export const dashboardService = new DashboardService(); 