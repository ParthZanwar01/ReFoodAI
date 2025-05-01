import { dataLoader } from '../utils/dataLoader';

export interface UploadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  detected_format: string;
  preview_data: any[];
  statistics: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    columns_detected: string[];
  };
}

export interface SmartCategorization {
  suggested_category: 'daily_production' | 'pickup_operations' | 'external_factors' | 'menu_planning' | 'impact_tracking' | 'unknown';
  confidence: number;
  reasoning: string;
  column_mapping: { [key: string]: string };
  required_columns_missing: string[];
}

export class UploadService {
  private production_data = dataLoader.loadDailyProduction();
  private pickup_data = dataLoader.loadPickupOperations();
  private external_data = dataLoader.loadExternalFactors();
  private menu_data = dataLoader.loadMenuPlanning();
  private impact_data = dataLoader.loadImpactTracking();

  // Smart CSV categorization
  categorizeCsv(csvContent: string): SmartCategorization {
    const lines = csvContent.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Define expected columns for each data type
    const patterns = {
      daily_production: {
        required: ['date', 'menu_item', 'quantity'],
        optional: ['category', 'waste', 'served', 'weather'],
        keywords: ['production', 'menu', 'waste', 'served', 'quantity']
      },
      pickup_operations: {
        required: ['date', 'location', 'quantity'],
        optional: ['pickup', 'destination', 'partner', 'driver', 'cost'],
        keywords: ['pickup', 'destination', 'partner', 'transport', 'collection']
      },
      external_factors: {
        required: ['date'],
        optional: ['weather', 'temperature', 'holiday', 'event', 'student'],
        keywords: ['weather', 'temperature', 'holiday', 'event', 'external']
      },
      menu_planning: {
        required: ['dish', 'category'],
        optional: ['cost', 'prep', 'popularity', 'nutrition', 'allergen'],
        keywords: ['menu', 'dish', 'recipe', 'ingredient', 'allergen']
      },
      impact_tracking: {
        required: ['date'],
        optional: ['cost', 'saved', 'rescued', 'co2', 'meals', 'community'],
        keywords: ['impact', 'saved', 'rescued', 'co2', 'meals', 'community']
      }
    };

    let best_match = 'unknown' as any;
    let highest_confidence = 0;
    let best_reasoning = '';
    let best_mapping: { [key: string]: string } = {};
    let missing_columns: string[] = [];

    // Score each pattern
    for (const [category, pattern] of Object.entries(patterns)) {
      const score = this.calculatePatternScore(headers, pattern);
      const mapping = this.mapColumns(headers, pattern);
      const missing = this.findMissingColumns(headers, pattern);
      
      if (score.confidence > highest_confidence) {
        highest_confidence = score.confidence;
        best_match = category;
        best_reasoning = score.reasoning;
        best_mapping = mapping;
        missing_columns = missing;
      }
    }

    return {
      suggested_category: best_match,
      confidence: highest_confidence,
      reasoning: best_reasoning,
      column_mapping: best_mapping,
      required_columns_missing: missing_columns
    };
  }

  // Validate CSV data
  validateCsv(csvContent: string, expected_category?: string): UploadValidationResult {
    const lines = csvContent.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);
    const dataLines = lines.slice(1);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Detect format if not provided
    let detected_format = expected_category;
    if (!detected_format) {
      const categorization = this.categorizeCsv(csvContent);
      detected_format = categorization.suggested_category;
      
      if (categorization.confidence < 0.7) {
        warnings.push(`Low confidence (${Math.round(categorization.confidence * 100)}%) in format detection. Please verify the data type.`);
      }
    }

    // Basic validation
    if (lines.length < 2) {
      errors.push('CSV must contain at least a header row and one data row');
    }

    if (headers.length === 0) {
      errors.push('No headers detected in CSV');
    }

    // Parse preview data
    const preview_data = dataLines.slice(0, 5).map((line, index) => {
      try {
        const values = this.parseCSVLine(line);
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      } catch (error) {
        errors.push(`Error parsing line ${index + 2}: ${error}`);
        return null;
      }
    }).filter(row => row !== null);

    // Validate data quality
    let valid_rows = 0;
    let invalid_rows = 0;

    dataLines.forEach((line, index) => {
      try {
        const values = this.parseCSVLine(line);
        
        // Check for correct number of columns
        if (values.length !== headers.length) {
          warnings.push(`Line ${index + 2}: Expected ${headers.length} columns, found ${values.length}`);
          invalid_rows++;
          return;
        }

        // Category-specific validation
        const isValidRow = this.validateRowByCategory(values, headers, detected_format || 'unknown');
        if (isValidRow) {
          valid_rows++;
        } else {
          invalid_rows++;
        }

      } catch (error) {
        errors.push(`Error processing line ${index + 2}: ${error}`);
        invalid_rows++;
      }
    });

    // Generate suggestions
    if (detected_format && detected_format !== 'unknown') {
      suggestions.push(`Consider mapping columns to standard format for ${detected_format} data`);
    }

    if (invalid_rows > 0) {
      suggestions.push('Review data format and fix validation errors before uploading');
    }

    if (valid_rows > 0 && invalid_rows === 0) {
      suggestions.push('Data looks good! Ready for processing.');
    }

    return {
      isValid: errors.length === 0 && invalid_rows === 0,
      errors,
      warnings,
      suggestions,
      detected_format: detected_format || 'unknown',
      preview_data,
      statistics: {
        total_rows: dataLines.length,
        valid_rows,
        invalid_rows,
        columns_detected: headers
      }
    };
  }

  // Generate insights from uploaded data
  generateUploadInsights(csvContent: string, category: string): any {
    const lines = csvContent.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);
    const dataLines = lines.slice(1);

    const insights: any = {
      data_summary: {
        total_records: dataLines.length,
        columns: headers.length,
        date_range: null,
        completeness: 0
      },
      quality_assessment: {
        missing_values: 0,
        duplicate_rows: 0,
        outliers: [],
        consistency_issues: []
      },
      recommendations: []
    };

    // Analyze data quality
    const parsed_data = dataLines.map(line => {
      const values = this.parseCSVLine(line);
      const row: any = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    // Calculate completeness
    let total_cells = parsed_data.length * headers.length;
    let filled_cells = 0;
    let missing_values = 0;

    parsed_data.forEach(row => {
      headers.forEach(header => {
        if (row[header] && row[header].trim() !== '') {
          filled_cells++;
        } else {
          missing_values++;
        }
      });
    });

    insights.data_summary.completeness = Math.round((filled_cells / total_cells) * 100);
    insights.quality_assessment.missing_values = missing_values;

    // Find date range
    const date_columns = headers.filter(h => 
      h.toLowerCase().includes('date') || h.toLowerCase().includes('time')
    );
    
    if (date_columns.length > 0) {
      const dates = parsed_data
        .map(row => row[date_columns[0]])
        .filter(date => date && date.trim() !== '')
        .map(date => new Date(date))
        .filter(date => !isNaN(date.getTime()));

      if (dates.length > 0) {
        insights.data_summary.date_range = {
          start: new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0],
          end: new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0],
          span_days: Math.ceil((Math.max(...dates.map(d => d.getTime())) - Math.min(...dates.map(d => d.getTime()))) / (1000 * 60 * 60 * 24))
        };
      }
    }

    // Detect duplicates
    const row_strings = parsed_data.map(row => JSON.stringify(row));
    const unique_rows = new Set(row_strings);
    insights.quality_assessment.duplicate_rows = row_strings.length - unique_rows.size;

    // Category-specific insights
    if (category === 'daily_production') {
      insights.production_insights = this.analyzeProductionData(parsed_data);
    } else if (category === 'pickup_operations') {
      insights.pickup_insights = this.analyzePickupData(parsed_data);
    }

    // Generate recommendations
    if (insights.data_summary.completeness < 80) {
      insights.recommendations.push('Consider filling missing values to improve data quality');
    }

    if (insights.quality_assessment.duplicate_rows > 0) {
      insights.recommendations.push(`Remove ${insights.quality_assessment.duplicate_rows} duplicate rows`);
    }

    if (insights.data_summary.date_range && insights.data_summary.date_range.span_days > 365) {
      insights.recommendations.push('Large date range detected - consider breaking into smaller chunks for better performance');
    }

    return insights;
  }

  // Helper methods
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

  private calculatePatternScore(headers: string[], pattern: any): { confidence: number; reasoning: string } {
    let score = 0;
    let matches: string[] = [];
    
    // Check required columns
    const required_matches = pattern.required.filter((req: string) =>
      headers.some(h => h.includes(req) || req.includes(h))
    );
    score += (required_matches.length / pattern.required.length) * 0.6;
    matches.push(...required_matches);

    // Check optional columns
    const optional_matches = pattern.optional.filter((opt: string) =>
      headers.some(h => h.includes(opt) || opt.includes(h))
    );
    score += (optional_matches.length / pattern.optional.length) * 0.3;
    matches.push(...optional_matches);

    // Check keyword presence
    const keyword_matches = pattern.keywords.filter((keyword: string) =>
      headers.some(h => h.includes(keyword))
    );
    score += (keyword_matches.length / pattern.keywords.length) * 0.1;

    const reasoning = `Matched ${matches.length} relevant columns: ${matches.join(', ')}`;
    
    return { confidence: Math.min(score, 1), reasoning };
  }

  private mapColumns(headers: string[], pattern: any): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    [...pattern.required, ...pattern.optional].forEach((expected: string) => {
      const match = headers.find(h => 
        h.includes(expected) || expected.includes(h) || 
        this.calculateSimilarity(h, expected) > 0.7
      );
      if (match) {
        mapping[expected] = match;
      }
    });

    return mapping;
  }

  private findMissingColumns(headers: string[], pattern: any): string[] {
    return pattern.required.filter((req: string) =>
      !headers.some(h => h.includes(req) || req.includes(h))
    );
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private validateRowByCategory(values: string[], headers: string[], category: string): boolean {
    // Basic non-empty validation
    const non_empty_values = values.filter(v => v && v.trim() !== '').length;
    if (non_empty_values < headers.length * 0.5) { // At least 50% filled
      return false;
    }

    // Category-specific validation
    switch (category) {
      case 'daily_production':
        return this.validateProductionRow(values, headers);
      case 'pickup_operations':
        return this.validatePickupRow(values, headers);
      case 'external_factors':
        return this.validateExternalRow(values, headers);
      default:
        return true; // Basic validation passed
    }
  }

  private validateProductionRow(values: string[], headers: string[]): boolean {
    // Look for date column
    const date_index = headers.findIndex(h => h.toLowerCase().includes('date'));
    if (date_index >= 0) {
      const date_value = values[date_index];
      if (!this.isValidDate(date_value)) return false;
    }

    // Look for quantity columns
    const quantity_indices = headers
      .map((h, i) => ({ header: h, index: i }))
      .filter(({ header }) => header.toLowerCase().includes('quantity') || header.toLowerCase().includes('lbs'))
      .map(({ index }) => index);

    for (const index of quantity_indices) {
      const value = values[index];
      if (value && !this.isValidNumber(value)) return false;
    }

    return true;
  }

  private validatePickupRow(values: string[], headers: string[]): boolean {
    // Similar validation logic for pickup data
    return true; // Simplified for now
  }

  private validateExternalRow(values: string[], headers: string[]): boolean {
    // Similar validation logic for external factors
    return true; // Simplified for now
  }

  private isValidDate(dateString: string): boolean {
    if (!dateString || dateString.trim() === '') return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private isValidNumber(numberString: string): boolean {
    if (!numberString || numberString.trim() === '') return false;
    return !isNaN(parseFloat(numberString));
  }

  private analyzeProductionData(data: any[]): any {
    // Find waste patterns
    const waste_columns = Object.keys(data[0] || {}).filter(key => 
      key.toLowerCase().includes('waste') || key.toLowerCase().includes('wasted')
    );

    if (waste_columns.length > 0) {
      const waste_values = data
        .map(row => parseFloat(row[waste_columns[0]]))
        .filter(val => !isNaN(val));

      if (waste_values.length > 0) {
        const avg_waste = waste_values.reduce((sum, val) => sum + val, 0) / waste_values.length;
        const high_waste_items = data.filter(row => {
          const waste = parseFloat(row[waste_columns[0]]);
          return !isNaN(waste) && waste > avg_waste * 1.5;
        }).length;

        return {
          avg_waste_percentage: Math.round(avg_waste * 100) / 100,
          high_waste_items_count: high_waste_items,
          total_items_analyzed: waste_values.length
        };
      }
    }

    return {
      message: 'No waste data detected for analysis'
    };
  }

  private analyzePickupData(data: any[]): any {
    // Find pickup patterns
    const quantity_columns = Object.keys(data[0] || {}).filter(key => 
      key.toLowerCase().includes('quantity') || key.toLowerCase().includes('lbs')
    );

    if (quantity_columns.length > 0) {
      const quantities = data
        .map(row => parseFloat(row[quantity_columns[0]]))
        .filter(val => !isNaN(val));

      if (quantities.length > 0) {
        const total_rescued = quantities.reduce((sum, val) => sum + val, 0);
        const avg_pickup = total_rescued / quantities.length;

        return {
          total_food_rescued_lbs: Math.round(total_rescued),
          avg_pickup_size_lbs: Math.round(avg_pickup),
          total_pickups: quantities.length
        };
      }
    }

    return {
      message: 'No pickup quantity data detected for analysis'
    };
  }

  // Public utility methods
  getSupportedFormats(): string[] {
    return ['daily_production', 'pickup_operations', 'external_factors', 'menu_planning', 'impact_tracking'];
  }

  getRequiredColumns(format: string): string[] {
    const requirements: { [key: string]: string[] } = {
      daily_production: ['date', 'menu_item', 'quantity_prepared', 'quantity_served', 'quantity_wasted'],
      pickup_operations: ['date', 'pickup_time', 'source_location', 'destination_partner', 'quantity_lbs'],
      external_factors: ['date', 'weather_condition', 'temperature_f'],
      menu_planning: ['dish_name', 'menu_category', 'ingredient_cost_per_serving'],
      impact_tracking: ['date', 'food_rescued_lbs_daily', 'money_saved_daily']
    };

    return requirements[format] || [];
  }
}

export const uploadService = new UploadService(); 