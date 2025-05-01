export class Statistics {
  // Linear regression for trend analysis
  static linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((acc, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return acc + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    return { slope, intercept, r2 };
  }

  // Multiple linear regression for complex predictions
  static multipleRegression(X: number[][], y: number[]): { coefficients: number[]; r2: number } {
    // Add intercept column (all 1s) to X
    const XWithIntercept = X.map(row => [1, ...row]);
    const m = XWithIntercept.length;
    const n = XWithIntercept[0].length;

    // Create matrices
    const XT = this.transpose(XWithIntercept);
    const XTX = this.multiplyMatrices(XT, XWithIntercept);
    const XTy = this.multiplyMatrixVector(XT, y);

    // Solve normal equation: (X^T * X) * β = X^T * y
    const coefficients = this.solveLinearSystem(XTX, XTy);

    // Calculate R-squared
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < y.length; i++) {
      const predicted = this.predictWithCoefficients(XWithIntercept[i], coefficients);
      ssRes += Math.pow(y[i] - predicted, 2);
      ssTot += Math.pow(y[i] - yMean, 2);
    }

    const r2 = 1 - (ssRes / ssTot);

    return { coefficients, r2 };
  }

  // Time series decomposition for seasonality analysis
  static movingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(data[i]);
      } else {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
      }
    }
    return result;
  }

  // Exponential smoothing for forecasting
  static exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
      result.push(smoothed);
    }
    return result;
  }

  // Seasonal decomposition
  static seasonalDecompose(data: number[], seasonLength: number): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    const trend = this.movingAverage(data, seasonLength);
    const seasonal: number[] = [];
    const residual: number[] = [];

    // Calculate seasonal components
    for (let i = 0; i < data.length; i++) {
      const seasonIndex = i % seasonLength;
      if (!seasonal[seasonIndex]) seasonal[seasonIndex] = 0;
      if (trend[i] !== undefined) {
        seasonal[seasonIndex] += (data[i] - trend[i]);
      }
    }

    // Average seasonal components
    for (let i = 0; i < seasonal.length; i++) {
      seasonal[i] /= Math.floor(data.length / seasonLength);
    }

    // Calculate residuals
    for (let i = 0; i < data.length; i++) {
      const seasonIndex = i % seasonLength;
      residual[i] = data[i] - (trend[i] || 0) - seasonal[seasonIndex];
    }

    return { trend, seasonal, residual };
  }

  // Correlation analysis
  static correlation(x: number[], y: number[]): number {
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

  // Statistical summary
  static summary(data: number[]): {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
  } {
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

  // Outlier detection using IQR method
  static detectOutliers(data: number[]): { outliers: number[]; indices: number[] } {
    const stats = this.summary(data);
    const iqr = stats.q3 - stats.q1;
    const lowerBound = stats.q1 - 1.5 * iqr;
    const upperBound = stats.q3 + 1.5 * iqr;

    const outliers: number[] = [];
    const indices: number[] = [];

    data.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        indices.push(index);
      }
    });

    return { outliers, indices };
  }

  // Matrix operations
  private static transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  private static multiplyMatrices(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < b.length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private static multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));
  }

  private static solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // Gaussian elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Forward elimination
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j < n + 1; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }

    // Back substitution
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }

    return x;
  }

  private static predictWithCoefficients(features: number[], coefficients: number[]): number {
    return features.reduce((sum, feature, i) => sum + feature * coefficients[i], 0);
  }

  // Prediction intervals
  static predictionInterval(
    residuals: number[],
    confidence: number = 0.95
  ): { lower: number; upper: number } {
    const sorted = [...residuals].sort((a, b) => a - b);
    const alpha = 1 - confidence;
    const lowerIndex = Math.floor(alpha / 2 * sorted.length);
    const upperIndex = Math.floor((1 - alpha / 2) * sorted.length);

    return {
      lower: sorted[lowerIndex],
      upper: sorted[upperIndex]
    };
  }
} 