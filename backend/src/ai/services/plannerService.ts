import { dataLoader, DailyProduction, MenuPlanning, ExternalFactor } from '../utils/dataLoader';
import { Statistics } from '../utils/statistics';

export interface PlannerInput {
  date: string;
  estimated_students: number;
  budget_constraint?: number;
  dietary_requirements?: string[];
  avoid_items?: string[];
  target_categories: string[];
}

export interface MenuRecommendation {
  menu_item: string;
  category: string;
  recommended_quantity: number;
  expected_waste: number;
  cost_per_serving: number;
  popularity_score: number;
  reasoning: string;
}

export interface PlannerResult {
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

export class PlannerService {
  private production_data: DailyProduction[];
  private menu_data: MenuPlanning[];
  private external_data: ExternalFactor[];

  constructor() {
    this.production_data = dataLoader.loadDailyProduction();
    this.menu_data = dataLoader.loadMenuPlanning();
    this.external_data = dataLoader.loadExternalFactors();
    
    console.log(`Loaded ${this.production_data.length} production records`);
    console.log(`Loaded ${this.menu_data.length} menu items`);
    console.log(`Loaded ${this.external_data.length} external factor records`);
    
    if (this.menu_data.length > 0) {
      console.log('Sample menu categories:', [...new Set(this.menu_data.map(m => m.menu_category))]);
      console.log('Sample menu items:', this.menu_data.slice(0, 3).map(m => m.dish_name));
    }
  }

  async optimizeMenu(input: PlannerInput): Promise<PlannerResult> {
    // Get available menu items for the target categories
    const available_items = this.getAvailableItems(input.target_categories, input.avoid_items || []);
    
    // Score each item based on multiple criteria
    const scored_items = available_items.map(item => this.scoreMenuItem(item, input));
    
    // Select optimal combination
    const selected_items = this.selectOptimalCombination(scored_items, input);
    
    // Generate recommendations with quantities
    const recommendations = selected_items.map(item => this.generateRecommendation(item, input));
    
    // Calculate totals and analysis
    const total_cost = recommendations.reduce((sum, r) => sum + (r.recommended_quantity * r.cost_per_serving), 0);
    const total_expected_waste = recommendations.reduce((sum, r) => sum + r.expected_waste, 0);
    const total_production = recommendations.reduce((sum, r) => sum + r.recommended_quantity, 0);
    const waste_percentage = (total_expected_waste / total_production) * 100;
    
    // Calculate cost savings compared to historical average
    const historical_waste_cost = this.calculateHistoricalWasteCost(input.target_categories);
    const projected_waste_cost = total_expected_waste * this.getAverageCostPerPound();
    const cost_savings = historical_waste_cost - projected_waste_cost;
    
    // Nutritional balance analysis
    const nutritional_balance = this.analyzeNutritionalBalance(recommendations);
    
    // Risk assessment
    const risk_assessment = this.assessRisks(recommendations, input);

    return {
      recommended_menu: recommendations,
      total_cost,
      total_expected_waste,
      waste_percentage,
      cost_savings: Math.max(0, cost_savings),
      nutritional_balance,
      risk_assessment
    };
  }

  private getAvailableItems(target_categories: string[], avoid_items: string[]): MenuPlanning[] {
    console.log('Filtering items for categories:', target_categories);
    console.log('Avoiding items:', avoid_items);
    
    const filtered = this.menu_data.filter(item => 
      target_categories.includes(item.menu_category) && 
      !avoid_items.includes(item.dish_name)
    );
    
    console.log(`Found ${filtered.length} available items out of ${this.menu_data.length} total`);
    
    return filtered;
  }

  private scoreMenuItem(item: MenuPlanning, input: PlannerInput): any {
    // Get historical performance data
    const historical_data = this.production_data.filter(d => d.menu_item === item.dish_name);
    
    let waste_score = 5; // Default if no historical data
    let popularity_score = item.popularity_score;
    
    if (historical_data.length > 0) {
      const avg_waste = historical_data.reduce((sum, d) => sum + d.waste_percentage, 0) / historical_data.length;
      waste_score = Math.max(1, 10 - (avg_waste / 10)); // Convert to 1-10 scale (lower waste = higher score)
    }

    // Cost efficiency score
    const cost_score = Math.max(1, 10 - (item.ingredient_cost_per_serving * 2)); // Favor lower cost items
    
    // Preparation complexity score
    const prep_score = this.getPreparationScore(item.prep_difficulty);
    
    // Shelf life score
    const shelf_life_score = Math.min(10, item.shelf_life_hours / 4); // Favor items with good shelf life
    
    // Day of week adjustment
    const day_adjustment = this.getDayOfWeekAdjustment(item.dish_name, input.date);
    
    // Season appropriateness
    const season_score = this.getSeasonScore(item.season_appropriateness, input.date);
    
    // Calculate composite score
    const composite_score = (
      waste_score * 0.3 +
      popularity_score * 0.25 +
      cost_score * 0.2 +
      prep_score * 0.1 +
      shelf_life_score * 0.1 +
      season_score * 0.05
    ) * day_adjustment;

    return {
      ...item,
      scores: {
        waste_score,
        popularity_score,
        cost_score,
        prep_score,
        shelf_life_score,
        season_score,
        composite_score
      },
      historical_data
    };
  }

  private selectOptimalCombination(scored_items: any[], input: PlannerInput): any[] {
    // Sort by composite score
    const sorted_items = scored_items.sort((a, b) => b.scores.composite_score - a.scores.composite_score);
    
    const selected: any[] = [];
    const category_counts = new Map<string, number>();
    let total_cost = 0;
    
    // Ensure balanced selection across categories
    const target_per_category = Math.ceil(8 / input.target_categories.length); // Target ~8 items total
    
    for (const item of sorted_items) {
      const current_count = category_counts.get(item.menu_category) || 0;
      const estimated_cost = this.estimateItemCost(item, input.estimated_students);
      
      // Check constraints
      if (current_count < target_per_category && 
          selected.length < 12 && // Max items limit
          (!input.budget_constraint || total_cost + estimated_cost <= input.budget_constraint)) {
        
        selected.push(item);
        category_counts.set(item.menu_category, current_count + 1);
        total_cost += estimated_cost;
      }
    }
    
    // Ensure we have at least one item from each target category
    for (const category of input.target_categories) {
      if (!category_counts.has(category)) {
        const fallback_item = sorted_items.find(item => 
          item.menu_category === category && !selected.includes(item)
        );
        if (fallback_item) {
          selected.push(fallback_item);
        }
      }
    }

    return selected;
  }

  private generateRecommendation(item: any, input: PlannerInput): MenuRecommendation {
    // Calculate recommended quantity based on popularity and student count
    const base_quantity = this.calculateBaseQuantity(item, input.estimated_students);
    
    // Adjust for historical waste patterns
    let waste_adjustment = 1.0;
    if (item.historical_data.length > 0) {
      const avg_waste_percentage = item.historical_data.reduce((sum: number, d: any) => sum + d.waste_percentage, 0) / item.historical_data.length;
      waste_adjustment = Math.max(0.7, 1 - (avg_waste_percentage / 100));
    }
    
    const recommended_quantity = Math.round(base_quantity * waste_adjustment);
    const expected_waste = recommended_quantity * (this.getExpectedWastePercentage(item) / 100);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(item, waste_adjustment, input);

    return {
      menu_item: item.dish_name,
      category: item.menu_category,
      recommended_quantity,
      expected_waste,
      cost_per_serving: item.ingredient_cost_per_serving,
      popularity_score: item.popularity_score,
      reasoning
    };
  }

  private calculateBaseQuantity(item: any, estimated_students: number): number {
    // Base calculation on popularity and typical serving patterns
    const popularity_factor = item.popularity_score / 10;
    const category_factor = this.getCategoryDemandFactor(item.menu_category);
    
    return Math.round(estimated_students * popularity_factor * category_factor * 0.3); // ~30% of students per popular item
  }

  private getExpectedWastePercentage(item: any): number {
    if (item.historical_data.length > 0) {
      return item.historical_data.reduce((sum: number, d: any) => sum + d.waste_percentage, 0) / item.historical_data.length;
    }
    
    // Category-based defaults
    const category_defaults: { [key: string]: number } = {
      'Entree': 12,
      'Side': 15,
      'Dessert': 20,
      'Beverage': 8,
      'Salad': 18
    };
    
    return category_defaults[item.menu_category] || 15;
  }

  private generateReasoning(item: any, waste_adjustment: number, input: PlannerInput): string {
    const reasons: string[] = [];
    
    if (item.scores.popularity_score >= 8) {
      reasons.push("high popularity score");
    }
    
    if (item.scores.waste_score >= 7) {
      reasons.push("low historical waste");
    }
    
    if (waste_adjustment < 0.9) {
      reasons.push("adjusted for waste reduction");
    }
    
    if (item.scores.cost_score >= 7) {
      reasons.push("cost-effective");
    }
    
    if (item.scores.season_score >= 8) {
      reasons.push("seasonal appropriateness");
    }
    
    return `Selected due to: ${reasons.join(', ') || 'balanced performance across metrics'}`;
  }

  private analyzeNutritionalBalance(recommendations: MenuRecommendation[]): any {
    const balance = {
      protein_items: 0,
      carb_items: 0,
      vegetable_items: 0,
      dessert_items: 0
    };

    recommendations.forEach(rec => {
      const itemName = rec.menu_item.toLowerCase();
      
      // Count protein items based on dish names
      if (itemName.includes('chicken') || itemName.includes('beef') || itemName.includes('fish') || 
          itemName.includes('salmon') || itemName.includes('tofu') || itemName.includes('eggs') ||
          itemName.includes('shrimp') || itemName.includes('pork') || itemName.includes('lamb')) {
        balance.protein_items++;
      }
      
      // Count carb items
      if (itemName.includes('pasta') || itemName.includes('rice') || itemName.includes('bread') ||
          itemName.includes('noodles') || itemName.includes('pizza') || itemName.includes('burrito') ||
          itemName.includes('sandwich') || itemName.includes('pancakes') || itemName.includes('toast')) {
        balance.carb_items++;
      }
      
      // Count vegetable items
      if (itemName.includes('salad') || itemName.includes('veggie') || itemName.includes('vegetable') ||
          itemName.includes('spinach') || itemName.includes('kale') || itemName.includes('broccoli') ||
          itemName.includes('avocado') || itemName.includes('quinoa')) {
        balance.vegetable_items++;
      }
      
      // Count dessert items
      if (itemName.includes('cake') || itemName.includes('chocolate') || itemName.includes('dessert') ||
          itemName.includes('parfait') || itemName.includes('pudding') || itemName.includes('muffin') ||
          itemName.includes('tiramisu') || itemName.includes('baklava')) {
        balance.dessert_items++;
      }
    });

    return balance;
  }

  private assessRisks(recommendations: MenuRecommendation[], input: PlannerInput): any {
    const high_risk_items: string[] = [];
    const safe_items: string[] = [];
    const weather_considerations: string[] = [];

    recommendations.forEach(rec => {
      if (rec.expected_waste / rec.recommended_quantity > 0.15) {
        high_risk_items.push(rec.menu_item);
      } else {
        safe_items.push(rec.menu_item);
      }
    });

    // Weather-based considerations
    const external_factor = this.external_data.find(e => e.date === input.date);
    if (external_factor) {
      if (external_factor.weather_condition.toLowerCase().includes('rain')) {
        weather_considerations.push("Rainy weather may reduce foot traffic");
      }
      if (external_factor.temperature_f > 80) {
        weather_considerations.push("Hot weather favors cold items and beverages");
      }
      if (external_factor.temperature_f < 50) {
        weather_considerations.push("Cold weather increases demand for hot items");
      }
    }

    return {
      high_risk_items,
      safe_items,
      weather_considerations
    };
  }

  // Utility methods
  private getPreparationScore(difficulty: string): number {
    const difficulty_scores: { [key: string]: number } = {
      'easy': 10,
      'medium': 7,
      'hard': 4,
      'very hard': 2
    };
    return difficulty_scores[difficulty.toLowerCase()] || 7;
  }

  private getDayOfWeekAdjustment(dish_name: string, date: string): number {
    const day_of_week = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const historical_data = this.production_data.filter(d => 
      d.menu_item === dish_name && d.day_of_week === day_of_week
    );

    if (historical_data.length === 0) return 1.0;

    const all_data = this.production_data.filter(d => d.menu_item === dish_name);
    const day_avg = historical_data.reduce((sum, d) => sum + d.waste_percentage, 0) / historical_data.length;
    const overall_avg = all_data.reduce((sum, d) => sum + d.waste_percentage, 0) / all_data.length;

    // Lower waste on this day = higher adjustment factor
    return Math.max(0.5, Math.min(1.5, overall_avg / day_avg));
  }

  private getSeasonScore(season_appropriateness: string, date: string): number {
    const month = new Date(date).getMonth();
    const season = this.getSeasonFromMonth(month);
    
    if (season_appropriateness.toLowerCase().includes(season.toLowerCase())) {
      return 10;
    }
    if (season_appropriateness.toLowerCase() === 'all_season') {
      return 8;
    }
    return 5;
  }

  private getSeasonFromMonth(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private estimateItemCost(item: any, estimated_students: number): number {
    const base_quantity = this.calculateBaseQuantity(item, estimated_students);
    return base_quantity * item.ingredient_cost_per_serving;
  }

  private getCategoryDemandFactor(category: string): number {
    const factors: { [key: string]: number } = {
      'breakfast': 0.7,
      'lunch': 0.8,
      'dinner': 0.9
    };
    return factors[category] || 0.7;
  }

  private calculateHistoricalWasteCost(categories: string[]): number {
    // Since our production data might not have the exact category mapping,
    // we'll estimate based on overall historical waste patterns
    const total_waste_cost = this.production_data.reduce((sum, d) => 
      sum + (d.quantity_wasted * this.getAverageCostPerPound()), 0
    );

    if (this.production_data.length === 0) return 0;

    const avg_waste_per_day = total_waste_cost / this.production_data.length;
    
    // Scale by the number of categories requested (more categories = potentially more waste)
    return avg_waste_per_day * (categories.length / 3); // 3 is total meal categories
  }

  private getAverageCostPerPound(): number {
    // Estimated average cost per pound of food waste
    return 3.50;
  }

  // Public utility methods
  getMenuSuggestions(constraints: {
    max_prep_time?: number;
    dietary_restrictions?: string[];
    cost_limit?: number;
  }): MenuPlanning[] {
    let filtered_items = this.menu_data;

    if (constraints.max_prep_time) {
      filtered_items = filtered_items.filter(item => 
        item.preparation_time_hours <= constraints.max_prep_time!
      );
    }

    if (constraints.cost_limit) {
      filtered_items = filtered_items.filter(item => 
        item.ingredient_cost_per_serving <= constraints.cost_limit!
      );
    }

    if (constraints.dietary_restrictions) {
      filtered_items = filtered_items.filter(item => {
        const allergens = item.allergens.toLowerCase();
        return !constraints.dietary_restrictions!.some(restriction => 
          allergens.includes(restriction.toLowerCase())
        );
      });
    }

    return filtered_items.sort((a, b) => b.popularity_score - a.popularity_score);
  }

  getCategoryInsights(): any {
    const categories = [...new Set(this.menu_data.map(item => item.menu_category))];
    
    return categories.map(category => {
      const category_items = this.menu_data.filter(item => item.menu_category === category);
      const avg_popularity = category_items.reduce((sum, item) => sum + item.popularity_score, 0) / category_items.length;
      const avg_cost = category_items.reduce((sum, item) => sum + item.ingredient_cost_per_serving, 0) / category_items.length;
      const avg_prep_time = category_items.reduce((sum, item) => sum + item.preparation_time_hours, 0) / category_items.length;
      
      // Get historical waste data for this category
      const historical_data = this.production_data.filter(d => d.category === category);
      const avg_waste = historical_data.length > 0 
        ? historical_data.reduce((sum, d) => sum + d.waste_percentage, 0) / historical_data.length
        : 0;

      return {
        category,
        item_count: category_items.length,
        avg_popularity,
        avg_cost,
        avg_prep_time,
        avg_waste_percentage: avg_waste
      };
    }).sort((a, b) => a.avg_waste_percentage - b.avg_waste_percentage);
  }
}

export const plannerService = new PlannerService(); 