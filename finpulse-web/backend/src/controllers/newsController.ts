import type { Request, Response } from "express";
import { getNewsSentiment } from "../services/alphaVantageService.js";

export const fetchNewsSentiment = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getNewsSentiment();

    const feed = data.feed || [];

    const scores = feed
      .map((item: any) =>
        Number(item.overall_sentiment_score)
      )
      .filter((score: number) => !isNaN(score));

  const avgScore =
  scores.length > 0
    ? scores.reduce(
        (a: number, b: number) => a + b,
        0
      ) / scores.length
    : 0;

    let mood = "Neutral";

    if (avgScore > 0.15)
      mood = "Bullish";

    if (avgScore < -0.15)
      mood = "Bearish";

    const score = Math.min(
  100,
  Math.round(
    50 + (avgScore * 50)
  )
);

    const headlines = feed
      .slice(0, 5)
      .map((item: any) => item.title);

    res.json({
      mood,
      score,
      headlines,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch sentiment",
    });
  }
};