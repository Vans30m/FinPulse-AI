import { useQuery }
from "@tanstack/react-query";

import {
  getDomesticScreener,
}
from "../services/marketService";

export function useDomesticScreener(
  type: string
) {
  return useQuery({
    queryKey: [
      "domestic-screener",
      type,
    ],

    queryFn: () =>
      getDomesticScreener(
        type
      ),

    refetchInterval: 60000,
  });
}