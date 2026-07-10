import {
  createContext,
  useContext,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { isIndexSymbol } from "../utils/assetUtils";

export interface ChartAsset {
  symbol: string;
  yahooSymbol: string;
  name: string;
  exchange: string;
  type: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

interface ChartContextType {
  selectedAsset: ChartAsset | null;

  chartOpen: boolean;

  openChart: (
    asset: ChartAsset
  ) => void;

  /**
   * Smart opener: navigates to /asset/:symbol for indices,
   * opens the premium chart modal for all other asset types.
   */
  openAsset: (asset: ChartAsset) => void;

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

  const navigate = useNavigate();

  const openChart = (
    asset: ChartAsset
  ) => {
    setSelectedAsset(asset);
    setChartOpen(true);
  };

  /**
   * Smart asset opener:
   * - Indices → navigate to /asset/:symbol (AssetDetails page)
   * - Everything else → open the premium AssetChartModal
   */
  const openAsset = (asset: ChartAsset) => {
    const symbol = asset.yahooSymbol || asset.symbol;
    if (isIndexSymbol(symbol)) {
      // Navigate to the full AssetDetails page for indices
      navigate(`/asset/${encodeURIComponent(symbol)}`, {
        state: {
          name: asset.name,
          price: asset.price,
          change: asset.change,
          changePercent: asset.changePercent,
          exchange: asset.exchange,
        },
      });
    } else {
      // Open the premium modal for stocks, crypto, forex, commodities
      setSelectedAsset(asset);
      setChartOpen(true);
    }
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
        openAsset,
        closeChart,
      }}
    >
      {children}
    </ChartContext.Provider>
  );
}

export const useChart = () =>
  useContext(ChartContext);