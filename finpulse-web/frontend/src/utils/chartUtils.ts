export interface ChartPoint {
  date: string;
  portfolioReturn: number;
  benchmarkReturn: number;
}

export interface ProcessedChartPoint {
  time: number; // UNIX timestamp in seconds
  portfolioReturn: number;
  benchmarkReturn: number;
  difference: number;
}

/**
 * Parses, formats, and calculates differences for cumulative return data points.
 * Returns times as UNIX timestamps in seconds and filters out duplicates.
 */
export function processCumulativeData(series: ChartPoint[]): ProcessedChartPoint[] {
  if (!series || series.length === 0) return [];

  // Sort series chronologically to ensure normalization is correct
  const sorted = [...series].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const result: ProcessedChartPoint[] = [];
  let prevTime = 0;

  sorted.forEach(item => {
    const time = Math.floor(new Date(item.date).getTime() / 1000);

    // Skip duplicate or out-of-order timestamps to satisfy lightweight-charts assertion
    if (time <= prevTime) {
      return;
    }

    // The API values are cumulative percentage returns, not index prices.
    // Convert them to a 100-based display index without dividing by the first return.
    const normalizedPort = 100 + item.portfolioReturn;
    const normalizedBench = 100 + item.benchmarkReturn;

    result.push({
      time,
      portfolioReturn: Math.round(normalizedPort * 100) / 100,
      benchmarkReturn: Math.round(normalizedBench * 100) / 100,
      difference: Math.round((normalizedPort - normalizedBench) * 100) / 100,
    });

    prevTime = time;
  });

  return result;
}
