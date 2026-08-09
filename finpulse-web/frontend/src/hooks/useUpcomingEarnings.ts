import { useQuery } from "@tanstack/react-query";
import { getUpcomingEarnings } from "../services/marketService";
import type { UpcomingEarning } from "../types/earnings";

export function useUpcomingEarnings(market: string) {
  return useQuery<UpcomingEarning[]>({
    queryKey: ["earnings", market],
    queryFn: () => getUpcomingEarnings(market),

    // Speed & reliability improvements:
    // Backend earningsCache TTL is 12 hours (data almost never changes intra-day)
    // staleTime matches that — so switching country tabs is instant (no refetch if < 12h old)
    // No refetchInterval — earnings calendars don't need real-time polling
    staleTime: 60 * 60 * 1000,    // 1 hour — earnings dates don't change mid-day
    gcTime: 12 * 60 * 60 * 1000,  // Keep in React Query cache for 12 hours (matches backend)
    retry: 1,                       // Only retry once on failure (was 2)
    refetchOnWindowFocus: false,
    refetchInterval: false,         // No background polling — earnings are not real-time data
    enabled: !!market,
  });
}
