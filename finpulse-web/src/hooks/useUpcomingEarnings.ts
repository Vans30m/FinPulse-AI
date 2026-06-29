import { useQuery } from "@tanstack/react-query";
import { getUpcomingEarnings } from "../services/marketService";
import type { UpcomingEarning } from "../types/earnings";

export function useUpcomingEarnings(market: string) {
  return useQuery<UpcomingEarning[]>({
    queryKey: ["earnings", market],
    queryFn: () => getUpcomingEarnings(market),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!market
  });
}
