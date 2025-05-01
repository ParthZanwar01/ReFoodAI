import { dataLoader, PickupOperation, ExternalFactor } from '../utils/dataLoader';
import { Statistics } from '../utils/statistics';

export interface PickupOptimizationInput {
  date: string;
  available_locations: string[];
  available_drivers: string[];
  estimated_food_volume: number;
  priority_destinations?: string[];
  time_constraints?: {
    earliest_pickup: string;
    latest_pickup: string;
  };
}

export interface OptimizedPickup {
  pickup_id: string;
  source_location: string;
  destination_partner: string;
  recommended_time: string;
  estimated_volume: number;
  estimated_duration: number;
  transport_cost: number;
  driver_assignment: string;
  priority_score: number;
  efficiency_score: number;
}

export interface RouteOptimization {
  route_id: string;
  driver: string;
  locations: string[];
  total_distance: number;
  total_time: number;
  total_volume: number;
  total_cost: number;
  pickups: OptimizedPickup[];
}

export interface TrackerResult {
  optimized_routes: RouteOptimization[];
  total_volume_rescued: number;
  total_meals_equivalent: number;
  total_co2_savings: number;
  total_transport_cost: number;
  efficiency_metrics: {
    avg_pickup_time: number;
    cost_per_pound: number;
    meals_per_dollar: number;
    co2_per_pickup: number;
  };
  recommendations: {
    optimal_timing: string[];
    cost_saving_tips: string[];
    efficiency_improvements: string[];
  };
}

export class TrackerService {
  private pickup_data: PickupOperation[];
  private external_data: ExternalFactor[];

  constructor() {
    this.pickup_data = dataLoader.loadPickupOperations();
    this.external_data = dataLoader.loadExternalFactors();
  }

  async optimizePickups(input: PickupOptimizationInput): Promise<TrackerResult> {
    // Analyze historical patterns for the locations
    const location_insights = this.analyzeLocationPatterns(input.available_locations);
    
    // Generate optimized pickup suggestions
    const pickup_suggestions = this.generatePickupSuggestions(input, location_insights);
    
    // Optimize routes for multiple drivers
    const optimized_routes = this.optimizeRoutes(pickup_suggestions, input.available_drivers);
    
    // Calculate totals and metrics
    const totals = this.calculateTotals(optimized_routes);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(input, location_insights);

    return {
      optimized_routes,
      total_volume_rescued: totals.volume,
      total_meals_equivalent: totals.meals,
      total_co2_savings: totals.co2,
      total_transport_cost: totals.cost,
      efficiency_metrics: this.calculateEfficiencyMetrics(totals),
      recommendations
    };
  }

  private analyzeLocationPatterns(locations: string[]): Map<string, any> {
    const patterns = new Map<string, any>();

    locations.forEach(location => {
      const location_data = this.pickup_data.filter(p => p.source_location === location);
      
      if (location_data.length === 0) {
        patterns.set(location, this.getDefaultLocationPattern());
        return;
      }

      // Calculate averages and patterns
      const avg_volume = location_data.reduce((sum, p) => sum + p.quantity_lbs, 0) / location_data.length;
      const avg_distance = location_data.reduce((sum, p) => sum + p.distance_miles, 0) / location_data.length;
      const avg_cost = location_data.reduce((sum, p) => sum + p.transport_cost, 0) / location_data.length;
      
      // Peak times analysis
      const time_distribution = this.analyzeTimeDistribution(location_data);
      
      // Day of week patterns
      const day_patterns = this.analyzeDayPatterns(location_data);
      
      // Food type preferences
      const food_types = this.analyzeFoodTypes(location_data);
      
      // Destination partnerships
      const destinations = this.analyzeDestinations(location_data);
      
      // Success rate
      const success_rate = location_data.filter(p => p.pickup_status === 'completed').length / location_data.length;

      patterns.set(location, {
        avg_volume,
        avg_distance,
        avg_cost,
        time_distribution,
        day_patterns,
        food_types,
        destinations,
        success_rate,
        historical_count: location_data.length
      });
    });

    return patterns;
  }

  private generatePickupSuggestions(input: PickupOptimizationInput, patterns: Map<string, any>): OptimizedPickup[] {
    const suggestions: OptimizedPickup[] = [];
    let pickup_counter = 1;

    input.available_locations.forEach(location => {
      const pattern = patterns.get(location);
      if (!pattern) return;

      // Determine optimal pickup time based on historical data
      const optimal_time = this.calculateOptimalTime(pattern, input);
      
      // Estimate volume based on historical averages and current conditions
      const estimated_volume = this.estimateVolume(pattern, input);
      
      // Select best destination partner
      const destination = this.selectBestDestination(pattern, input.priority_destinations);
      
      // Calculate priority score
      const priority_score = this.calculatePriorityScore(location, pattern, input);
      
      // Estimate costs and efficiency
      const transport_cost = this.estimateTransportCost(location, destination, estimated_volume);
      const efficiency_score = this.calculateEfficiencyScore(pattern, estimated_volume, transport_cost);
      
      suggestions.push({
        pickup_id: `PU${new Date(input.date).getTime()}_${pickup_counter++}`,
        source_location: location,
        destination_partner: destination,
        recommended_time: optimal_time,
        estimated_volume,
        estimated_duration: this.estimateDuration(location, destination, estimated_volume),
        transport_cost,
        driver_assignment: '', // Will be assigned in route optimization
        priority_score,
        efficiency_score
      });
    });

    return suggestions.sort((a, b) => b.priority_score - a.priority_score);
  }

  private optimizeRoutes(pickups: OptimizedPickup[], drivers: string[]): RouteOptimization[] {
    const routes: RouteOptimization[] = [];
    const remaining_pickups = [...pickups];

    drivers.forEach((driver, index) => {
      if (remaining_pickups.length === 0) return;

      const route = this.createOptimalRoute(driver, remaining_pickups);
      routes.push(route);

      // Remove assigned pickups
      route.pickups.forEach(pickup => {
        const index = remaining_pickups.findIndex(p => p.pickup_id === pickup.pickup_id);
        if (index > -1) remaining_pickups.splice(index, 1);
      });
    });

    // Handle any remaining pickups by adding to existing routes or creating new ones
    if (remaining_pickups.length > 0) {
      remaining_pickups.forEach(pickup => {
        const best_route = routes.reduce((best, route) => 
          route.total_time < best.total_time ? route : best
        );
        best_route.pickups.push(pickup);
        pickup.driver_assignment = best_route.driver;
        this.updateRouteMetrics(best_route);
      });
    }

    return routes;
  }

  private createOptimalRoute(driver: string, available_pickups: OptimizedPickup[]): RouteOptimization {
    // Use greedy algorithm to create route - can be improved with more sophisticated algorithms
    const route_pickups: OptimizedPickup[] = [];
    const max_pickups_per_route = 4; // Reasonable limit
    const max_total_volume = 200; // lbs
    
    // Start with highest priority pickup
    let current_location = 'depot'; // Starting point
    let total_volume = 0;
    let total_time = 0;
    
    for (let i = 0; i < max_pickups_per_route && available_pickups.length > 0; i++) {
      // Find best next pickup (closest and highest priority)
      const best_pickup = this.findBestNextPickup(current_location, available_pickups, total_volume, max_total_volume);
      
      if (!best_pickup) break;
      
      best_pickup.driver_assignment = driver;
      route_pickups.push(best_pickup);
      
      current_location = best_pickup.destination_partner;
      total_volume += best_pickup.estimated_volume;
      total_time += best_pickup.estimated_duration;
      
      // Remove from available pickups
      const index = available_pickups.findIndex(p => p.pickup_id === best_pickup.pickup_id);
      if (index > -1) available_pickups.splice(index, 1);
    }

    const locations = route_pickups.map(p => p.source_location);
    const total_distance = this.calculateTotalDistance(locations);
    const total_cost = route_pickups.reduce((sum, p) => sum + p.transport_cost, 0);

    return {
      route_id: `RT_${driver}_${Date.now()}`,
      driver,
      locations,
      total_distance,
      total_time,
      total_volume,
      total_cost,
      pickups: route_pickups
    };
  }

  private findBestNextPickup(current_location: string, available: OptimizedPickup[], current_volume: number, max_volume: number): OptimizedPickup | null {
    const feasible = available.filter(p => current_volume + p.estimated_volume <= max_volume);
    
    if (feasible.length === 0) return null;

    // Score based on priority, efficiency, and proximity
    return feasible.reduce((best, pickup) => {
      const distance_penalty = this.getDistancePenalty(current_location, pickup.source_location);
      const composite_score = pickup.priority_score * 0.4 + pickup.efficiency_score * 0.4 - distance_penalty * 0.2;
      const best_score = (best as any).composite_score || 0;
      
      return composite_score > best_score 
        ? { ...pickup, composite_score } 
        : best;
    }, feasible[0]);
  }

  private calculateTotals(routes: RouteOptimization[]): any {
    const totals = {
      volume: 0,
      meals: 0,
      co2: 0,
      cost: 0
    };

    routes.forEach(route => {
      totals.volume += route.total_volume;
      totals.cost += route.total_cost;
      
      route.pickups.forEach(pickup => {
        totals.meals += pickup.estimated_volume * 2.5; // ~2.5 meals per pound
        totals.co2 += pickup.estimated_volume * 3.2; // ~3.2 lbs CO2 saved per pound
      });
    });

    return totals;
  }

  private calculateEfficiencyMetrics(totals: any): any {
    const total_pickups = totals.volume > 0 ? Math.ceil(totals.volume / 50) : 1; // Estimate pickup count
    
    return {
      avg_pickup_time: 25, // minutes - based on historical data
      cost_per_pound: totals.volume > 0 ? totals.cost / totals.volume : 0,
      meals_per_dollar: totals.cost > 0 ? totals.meals / totals.cost : 0,
      co2_per_pickup: total_pickups > 0 ? totals.co2 / total_pickups : 0
    };
  }

  private generateRecommendations(input: PickupOptimizationInput, patterns: Map<string, any>): any {
    const optimal_timing: string[] = [];
    const cost_saving_tips: string[] = [];
    const efficiency_improvements: string[] = [];

    // Analyze patterns for timing recommendations
    const peak_times = this.analyzePeakTimes(patterns);
    optimal_timing.push(`Best pickup window: ${peak_times.start} - ${peak_times.end}`);

    // Cost saving analysis
    const high_cost_locations = Array.from(patterns.entries())
      .filter(([_, pattern]) => pattern.avg_cost > 15)
      .map(([location, _]) => location);
    
    if (high_cost_locations.length > 0) {
      cost_saving_tips.push(`Consider consolidating pickups from: ${high_cost_locations.join(', ')}`);
    }

    // Efficiency analysis
    const low_efficiency_locations = Array.from(patterns.entries())
      .filter(([_, pattern]) => pattern.success_rate < 0.8)
      .map(([location, _]) => location);

    if (low_efficiency_locations.length > 0) {
      efficiency_improvements.push(`Improve coordination with: ${low_efficiency_locations.join(', ')}`);
    }

    // Weather considerations
    const weather_factor = this.external_data.find(e => e.date === input.date);
    if (weather_factor?.weather_condition.toLowerCase().includes('rain')) {
      efficiency_improvements.push("Allow extra time for rainy weather conditions");
    }

    return {
      optimal_timing,
      cost_saving_tips,
      efficiency_improvements
    };
  }

  // Utility methods
  private getDefaultLocationPattern(): any {
    return {
      avg_volume: 45,
      avg_distance: 5.2,
      avg_cost: 12.50,
      time_distribution: { peak_start: '14:00', peak_end: '16:00' },
      day_patterns: new Map([['Monday', 1.2], ['Wednesday', 1.1], ['Friday', 1.3]]),
      food_types: ['Mixed'],
      destinations: ['Local Food Bank'],
      success_rate: 0.85,
      historical_count: 0
    };
  }

  private analyzeTimeDistribution(data: PickupOperation[]): any {
    const time_counts = new Map<string, number>();
    
    data.forEach(pickup => {
      const hour = pickup.pickup_time.split(':')[0];
      time_counts.set(hour, (time_counts.get(hour) || 0) + 1);
    });

    const peak_hour = Array.from(time_counts.entries())
      .reduce((max, [hour, count]) => count > max.count ? { hour, count } : max, { hour: '14', count: 0 });

    return {
      peak_start: `${peak_hour.hour}:00`,
      peak_end: `${parseInt(peak_hour.hour) + 2}:00`,
      distribution: Object.fromEntries(time_counts)
    };
  }

  private analyzeDayPatterns(data: PickupOperation[]): Map<string, number> {
    const day_volumes = new Map<string, number[]>();
    
    data.forEach(pickup => {
      const day = new Date(pickup.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!day_volumes.has(day)) day_volumes.set(day, []);
      day_volumes.get(day)!.push(pickup.quantity_lbs);
    });

    const day_averages = new Map<string, number>();
    const overall_avg = data.reduce((sum, p) => sum + p.quantity_lbs, 0) / data.length;
    
    day_volumes.forEach((volumes, day) => {
      const day_avg = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
      day_averages.set(day, day_avg / overall_avg); // Relative factor
    });

    return day_averages;
  }

  private analyzeFoodTypes(data: PickupOperation[]): string[] {
    const type_counts = new Map<string, number>();
    
    data.forEach(pickup => {
      type_counts.set(pickup.food_type, (type_counts.get(pickup.food_type) || 0) + 1);
    });

    return Array.from(type_counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, _]) => type);
  }

  private analyzeDestinations(data: PickupOperation[]): string[] {
    const dest_counts = new Map<string, number>();
    
    data.forEach(pickup => {
      dest_counts.set(pickup.destination_partner, (dest_counts.get(pickup.destination_partner) || 0) + 1);
    });

    return Array.from(dest_counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([dest, _]) => dest);
  }

  private calculateOptimalTime(pattern: any, input: PickupOptimizationInput): string {
    const peak_start = pattern.time_distribution.peak_start;
    
    // Apply constraints if provided
    if (input.time_constraints) {
      const earliest = input.time_constraints.earliest_pickup;
      const latest = input.time_constraints.latest_pickup;
      
      if (peak_start < earliest) return earliest;
      if (peak_start > latest) return latest;
    }
    
    return peak_start;
  }

  private estimateVolume(pattern: any, input: PickupOptimizationInput): number {
    let base_volume = pattern.avg_volume;
    
    // Adjust for day of week
    const day = new Date(input.date).toLocaleDateString('en-US', { weekday: 'long' });
    const day_factor = pattern.day_patterns.get(day) || 1.0;
    
    // Apply external factors
    const external = this.external_data.find(e => e.date === input.date);
    const student_factor = external?.student_population_factor || 1.0;
    
    return Math.round(base_volume * day_factor * student_factor);
  }

  private selectBestDestination(pattern: any, priorities?: string[]): string {
    if (priorities && priorities.length > 0) {
      const priority_match = pattern.destinations.find((dest: string) => 
        priorities.some(p => dest.toLowerCase().includes(p.toLowerCase()))
      );
      if (priority_match) return priority_match;
    }
    
    return pattern.destinations[0] || 'Local Food Bank';
  }

  private calculatePriorityScore(location: string, pattern: any, input: PickupOptimizationInput): number {
    let score = 50; // Base score
    
    // Higher volume = higher priority
    score += Math.min(30, pattern.avg_volume);
    
    // Success rate bonus
    score += pattern.success_rate * 20;
    
    // Historical frequency bonus
    score += Math.min(10, pattern.historical_count);
    
    return Math.min(100, score);
  }

  private estimateTransportCost(source: string, destination: string, volume: number): number {
    // Simplified cost calculation
    const base_cost = 8.0; // Base pickup cost
    const distance_cost = this.getEstimatedDistance(source, destination) * 0.5; // $0.50/mile
    const volume_cost = volume * 0.1; // $0.10/lb
    
    return Math.round((base_cost + distance_cost + volume_cost) * 100) / 100;
  }

  private estimateDuration(source: string, destination: string, volume: number): number {
    const travel_time = this.getEstimatedDistance(source, destination) * 2; // 2 min/mile
    const loading_time = Math.max(15, volume * 0.5); // 0.5 min/lb, min 15 min
    
    return Math.round(travel_time + loading_time);
  }

  private calculateEfficiencyScore(pattern: any, volume: number, cost: number): number {
    let score = 50;
    
    // Cost efficiency
    const cost_per_pound = cost / volume;
    score += Math.max(0, 20 - cost_per_pound * 2);
    
    // Volume efficiency
    score += Math.min(30, volume * 0.5);
    
    return Math.min(100, score);
  }

  private getEstimatedDistance(source: string, destination: string): number {
    // Simplified distance estimation - in real implementation, use mapping API
    const distance_matrix: { [key: string]: number } = {
      'default': 5.5
    };
    
    return distance_matrix[`${source}-${destination}`] || distance_matrix.default;
  }

  private getDistancePenalty(from: string, to: string): number {
    const distance = this.getEstimatedDistance(from, to);
    return Math.min(20, distance * 2); // Penalty increases with distance
  }

  private calculateTotalDistance(locations: string[]): number {
    if (locations.length <= 1) return 0;
    
    let total = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      total += this.getEstimatedDistance(locations[i], locations[i + 1]);
    }
    return total;
  }

  private updateRouteMetrics(route: RouteOptimization): void {
    route.total_volume = route.pickups.reduce((sum, p) => sum + p.estimated_volume, 0);
    route.total_cost = route.pickups.reduce((sum, p) => sum + p.transport_cost, 0);
    route.total_time = route.pickups.reduce((sum, p) => sum + p.estimated_duration, 0);
    route.total_distance = this.calculateTotalDistance(route.locations);
  }

  private analyzePeakTimes(patterns: Map<string, any>): { start: string; end: string } {
    const all_peak_starts = Array.from(patterns.values())
      .map(p => p.time_distribution.peak_start)
      .map(time => parseInt(time.split(':')[0]));

    const avg_peak_hour = Math.round(all_peak_starts.reduce((sum, hour) => sum + hour, 0) / all_peak_starts.length);
    
    return {
      start: `${avg_peak_hour}:00`,
      end: `${avg_peak_hour + 2}:00`
    };
  }

  // Public utility methods
  getLocationInsights(location: string): any {
    const location_data = this.pickup_data.filter(p => p.source_location === location);
    
    if (location_data.length === 0) {
      return { error: 'No historical data available for this location' };
    }

    const volumes = location_data.map(p => p.quantity_lbs);
    const costs = location_data.map(p => p.transport_cost);
    const stats = Statistics.summary(volumes);
    
    return {
      location,
      total_pickups: location_data.length,
      volume_stats: stats,
      avg_transport_cost: costs.reduce((sum, c) => sum + c, 0) / costs.length,
      success_rate: location_data.filter(p => p.pickup_status === 'completed').length / location_data.length,
      most_common_destination: this.analyzeFoodTypes(location_data)[0],
      peak_pickup_time: this.analyzeTimeDistribution(location_data).peak_start
    };
  }

  getSystemPerformance(): any {
    const all_volumes = this.pickup_data.map(p => p.quantity_lbs);
    const all_costs = this.pickup_data.map(p => p.transport_cost);
    const volume_stats = Statistics.summary(all_volumes);
    const cost_stats = Statistics.summary(all_costs);
    
    const total_meals = this.pickup_data.reduce((sum, p) => sum + p.meals_equivalent, 0);
    const total_co2 = this.pickup_data.reduce((sum, p) => sum + p.co2_saved_lbs, 0);
    const success_rate = this.pickup_data.filter(p => p.pickup_status === 'completed').length / this.pickup_data.length;

    return {
      volume_statistics: volume_stats,
      cost_statistics: cost_stats,
      total_meals_rescued: total_meals,
      total_co2_saved: total_co2,
      overall_success_rate: success_rate,
      total_operations: this.pickup_data.length,
      avg_cost_per_pound: cost_stats.mean / volume_stats.mean
    };
  }
}

export const trackerService = new TrackerService(); 