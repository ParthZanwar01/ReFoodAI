import * as fs from 'fs';
import * as path from 'path';

export interface DailyProduction {
  date: string;
  day_of_week: string;
  menu_item: string;
  category: string;
  quantity_prepared: number;
  quantity_served: number;
  quantity_wasted: number;
  waste_percentage: number;
  estimated_students: number;
  weather: string;
  special_event: string;
  temperature_f: number;
}

export interface PickupOperation {
  pickup_id: string;
  date: string;
  pickup_time: string;
  source_location: string;
  destination_partner: string;
  food_type: string;
  quantity_lbs: number;
  distance_miles: number;
  volunteer_driver: string;
  transport_cost: number;
  meals_equivalent: number;
  co2_saved_lbs: number;
  pickup_status: string;
}

export interface ExternalFactor {
  date: string;
  day_of_week: string;
  month: string;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_name: string;
  weather_condition: string;
  temperature_f: number;
  precipitation_inches: number;
  campus_event: string;
  student_population_factor: number;
  semester_status: string;
  local_event: string;
}

export interface MenuPlanning {
  week_start_date: string;
  menu_category: string;
  dish_name: string;
  dish_type: string;
  preparation_time_hours: number;
  ingredient_cost_per_serving: number;
  selling_price: number;
  shelf_life_hours: number;
  popularity_score: number;
  nutritional_category: string;
  season_appropriateness: string;
  prep_difficulty: string;
  equipment_needed: string;
  allergens: string;
}

export interface ImpactTracking {
  date: string;
  day_of_week: string;
  food_cost_daily: number;
  food_waste_cost_daily: number;
  food_rescued_lbs_daily: number;
  money_saved_daily: number;
  co2_emissions_avoided_lbs_daily: number;
  meals_provided_to_community_daily: number;
  volunteer_hours_daily: number;
  transport_costs_daily: number;
  operational_savings_daily: number;
  waste_disposal_cost_avoided_daily: number;
  active_partner_orgs_daily: number;
  community_impact_score_daily: number;
}

class DataLoader {
  private dataPath: string;

  constructor() {
    // Adjust path to point to the data directory in the project root
    this.dataPath = path.join(__dirname, '../../../../data');
  }

  private parseCSV<T>(filePath: string, parser: (row: string[]) => T): T[] {
    try {
      const fullPath = path.join(this.dataPath, filePath);
      const csvContent = fs.readFileSync(fullPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',');
      
      return lines.slice(1).map(line => {
        const values = this.parseCSVLine(line);
        return parser(values);
      });
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error);
      return [];
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  loadDailyProduction(): DailyProduction[] {
    return this.parseCSV('daily_food_production.csv', (row) => ({
      date: row[0],
      day_of_week: row[1],
      menu_item: row[2],
      category: row[3],
      quantity_prepared: parseFloat(row[4]) || 0,
      quantity_served: parseFloat(row[5]) || 0,
      quantity_wasted: parseFloat(row[6]) || 0,
      waste_percentage: parseFloat(row[7]) || 0,
      estimated_students: parseFloat(row[8]) || 0,
      weather: row[9],
      special_event: row[10],
      temperature_f: parseFloat(row[11]) || 0,
    }));
  }

  loadPickupOperations(): PickupOperation[] {
    return this.parseCSV('pickup_operations.csv', (row) => ({
      pickup_id: row[0],
      date: row[1],
      pickup_time: row[2],
      source_location: row[3],
      destination_partner: row[4],
      food_type: row[5],
      quantity_lbs: parseFloat(row[6]) || 0,
      distance_miles: parseFloat(row[7]) || 0,
      volunteer_driver: row[8],
      transport_cost: parseFloat(row[9]) || 0,
      meals_equivalent: parseFloat(row[10]) || 0,
      co2_saved_lbs: parseFloat(row[11]) || 0,
      pickup_status: row[12],
    }));
  }

  loadExternalFactors(): ExternalFactor[] {
    return this.parseCSV('external_factors.csv', (row) => ({
      date: row[0],
      day_of_week: row[1],
      month: row[2],
      is_weekend: row[3] === 'True',
      is_holiday: row[4] === 'True',
      holiday_name: row[5],
      weather_condition: row[6],
      temperature_f: parseFloat(row[7]) || 0,
      precipitation_inches: parseFloat(row[8]) || 0,
      campus_event: row[9],
      student_population_factor: parseFloat(row[10]) || 0,
      semester_status: row[11],
      local_event: row[12],
    }));
  }

  loadMenuPlanning(): MenuPlanning[] {
    return this.parseCSV('menu_planning.csv', (row) => ({
      week_start_date: row[0],
      menu_category: row[1],
      dish_name: row[2],
      dish_type: row[3],
      preparation_time_hours: parseFloat(row[4]) || 0,
      ingredient_cost_per_serving: parseFloat(row[5]) || 0,
      selling_price: parseFloat(row[6]) || 0,
      shelf_life_hours: parseFloat(row[7]) || 0,
      popularity_score: parseFloat(row[8]) || 0,
      nutritional_category: row[9],
      season_appropriateness: row[10],
      prep_difficulty: row[11],
      equipment_needed: row[12],
      allergens: row[13],
    }));
  }

  loadImpactTracking(): ImpactTracking[] {
    return this.parseCSV('impact_tracking.csv', (row) => ({
      date: row[0],
      day_of_week: row[1],
      food_cost_daily: parseFloat(row[2]) || 0,
      food_waste_cost_daily: parseFloat(row[3]) || 0,
      food_rescued_lbs_daily: parseFloat(row[4]) || 0,
      money_saved_daily: parseFloat(row[5]) || 0,
      co2_emissions_avoided_lbs_daily: parseFloat(row[6]) || 0,
      meals_provided_to_community_daily: parseFloat(row[7]) || 0,
      volunteer_hours_daily: parseFloat(row[8]) || 0,
      transport_costs_daily: parseFloat(row[9]) || 0,
      operational_savings_daily: parseFloat(row[10]) || 0,
      waste_disposal_cost_avoided_daily: parseFloat(row[11]) || 0,
      active_partner_orgs_daily: parseFloat(row[12]) || 0,
      community_impact_score_daily: parseFloat(row[13]) || 0,
    }));
  }

  // Utility methods for data analysis
  getDateRange(): { start: string; end: string } {
    const production = this.loadDailyProduction();
    const dates = production.map(p => p.date).sort();
    return {
      start: dates[0],
      end: dates[dates.length - 1]
    };
  }

  getAvailableMenuItems(): string[] {
    const production = this.loadDailyProduction();
    return [...new Set(production.map(p => p.menu_item))];
  }

  getAvailableCategories(): string[] {
    const production = this.loadDailyProduction();
    return [...new Set(production.map(p => p.category))];
  }
}

export const dataLoader = new DataLoader(); 