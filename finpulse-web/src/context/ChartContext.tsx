import {
  createContext,
  useContext,
  useState,
} from "react";

export interface ChartAsset {
  symbol: string;
  yahooSymbol: string;
  name: string;
  exchange: string;
  type: string;
}

interface ChartContextType {
  selectedAsset: ChartAsset | null;

  chartOpen: boolean;

  openChart: (
    asset: ChartAsset
  ) => void;

  closeChart: () => void;
}

const ChartContext =
  createContext<ChartContextType>(
    {} as ChartContextType
  );

export function ChartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    selectedAsset,
    setSelectedAsset,
  ] =
    useState<ChartAsset | null>(
      null
    );

  const [
    chartOpen,
    setChartOpen,
  ] = useState(false);

  const openChart = (
    asset: ChartAsset
  ) => {
    setSelectedAsset(asset);

    setChartOpen(true);
  };

  const closeChart = () => {
    setChartOpen(false);
  };

  return (
    <ChartContext.Provider
      value={{
        selectedAsset,
        chartOpen,
        openChart,
        closeChart,
      }}
    >
      {children}
    </ChartContext.Provider>
  );
}

export const useChart = () =>
  useContext(ChartContext);