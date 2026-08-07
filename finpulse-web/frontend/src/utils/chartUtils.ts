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

  // Determine initial values to support front-end normalization if needed
  const initialPort = sorted[0]?.portfolioReturn || 100;
  const initialBench = sorted[0]?.benchmarkReturn || 100;

  const result: ProcessedChartPoint[] = [];
  let prevTime = 0;

  sorted.forEach(item => {
    const time = Math.floor(new Date(item.date).getTime() / 1000);

    // Skip duplicate or out-of-order timestamps to satisfy lightweight-charts assertion
    if (time <= prevTime) {
      return;
    }

    // Normalize to start at exactly 100 (in case backend is not perfectly normalized at the first element)
    const normalizedPort = (item.portfolioReturn / initialPort) * 100;
    const normalizedBench = (item.benchmarkReturn / initialBench) * 100;

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
