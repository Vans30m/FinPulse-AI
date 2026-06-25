import { useQuery }
from "@tanstack/react-query";

import {
  fetchGlobalMarkets
}
from "../services/marketService";

export function useGlobalMarkets() {

  return useQuery({
    queryKey: ["globalMarkets"],

    queryFn:
      fetchGlobalMarkets,

    refetchInterval: 30000,
  });
}