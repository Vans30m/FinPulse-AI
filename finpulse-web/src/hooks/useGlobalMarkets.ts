import { useQuery }
from "@tanstack/react-query";

import {
  fetchGlobalMarkets
}
from "../services/marketService";

export function useGlobalMarkets() {

  return useQuery({
    queryKey: ["globalMarkets"],
    queryFn: fetchGlobalMarkets,
    refetchInterval: false, // Disabled automatic polling
    refetchOnWindowFocus: false, // Disabled background refetches on window focus
    staleTime: Infinity, // Keep data fresh indefinitely once loaded
  });
}