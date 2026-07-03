// src/hooks/useStockScreener.ts

import { useReducer, useMemo } from 'react';
import type {
  StockRecord,
  ScreenerFilterState,
  ScreenerState,
} from '../types/screener';

const initialFilters: ScreenerFilterState = {
  search: '',
  sectors: [],
  industries: [],
  exchanges: [],
  marketCap: { min: null, max: null },
  peRatio: { min: null, max: null },
  roe: { min: null, max: null },
  rsi: { min: null, max: null },
  aiScore: { min: null, max: null },
  aiSignals: [],
};

const initialState: Omit<ScreenerState, 'viewMode' | 'compareList'> = {
  filters: initialFilters,
  sortBy: 'marketCap',
  sortOrder: 'desc',
};

type ScreenerAction =
  | { type: 'SET_FILTER'; payload: Partial<ScreenerFilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_SORT'; payload: { field: keyof StockRecord; order?: 'asc' | 'desc' } };

function screenerReducer(
  state: Omit<ScreenerState, 'viewMode' | 'compareList'>,
  action: ScreenerAction
): Omit<ScreenerState, 'viewMode' | 'compareList'> {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET_FILTERS':
      return { ...state, filters: initialFilters };
    case 'SET_SORT': {
      const order = action.payload.order || 
        (state.sortBy === action.payload.field && state.sortOrder === 'desc' ? 'asc' : 'desc');
      return { ...state, sortBy: action.payload.field, sortOrder: order };
    }
    default:
      return state;
  }
}

export function useStockScreener(stockUniverse: StockRecord[]) {
  const [state, dispatch] = useReducer(screenerReducer, initialState);

  // Multi-Dimensional Filtering Logic Engine
  const filteredStocks = useMemo(() => {
    return stockUniverse.filter((stock) => {
      const f = state.filters;

      // 1. Omnibox Text Search (Ticker or Company Name)
      if (f.search && !stock.ticker.toLowerCase().includes(f.search.toLowerCase()) && 
          !stock.name.toLowerCase().includes(f.search.toLowerCase())) return false;

      // 2. Multi-Select Categorical Arrays
      if (f.sectors.length > 0 && !f.sectors.includes(stock.sector)) return false;
      if (f.industries.length > 0 && !f.industries.includes(stock.industry)) return false;
      if (f.exchanges.length > 0 && !f.exchanges.includes(stock.exchange)) return false;
      if (f.aiSignals.length > 0 && !f.aiSignals.includes(stock.aiSignal)) return false;

      // Helper function for continuous numerical values
      const checkRange = (val: number | null, range: { min: number | null; max: number | null }) => {
        if (val === null) {
          // If a numerical filter is actively applied, exclude null values
          return range.min === null && range.max === null;
        }
        if (range.min !== null && val < range.min) return false;
        if (range.max !== null && val > range.max) return false;
        return true;
      };

      // 3. Range Sliders Evaluation
      if (!checkRange(stock.marketCap, f.marketCap)) return false;
      if (!checkRange(stock.peRatio, f.peRatio)) return false;
      if (!checkRange(stock.roe, f.roe)) return false;
      if (!checkRange(stock.rsi, f.rsi)) return false;
      if (!checkRange(stock.aiScore, f.aiScore)) return false;

      return true;
    }).sort((a, b) => {
      // 4. Client-side Sorting Implementation
      const valA = a[state.sortBy];
      const valB = b[state.sortBy];

      if (valA === null) return state.sortOrder === 'asc' ? -1 : 1;
      if (valB === null) return state.sortOrder === 'asc' ? 1 : -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return state.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return state.sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [stockUniverse, state.filters, state.sortBy, state.sortOrder]);

  return {
    filters: state.filters,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    filteredStocks,
    setFilter: (payload: Partial<ScreenerFilterState>) => dispatch({ type: 'SET_FILTER', payload }),
    resetFilters: () => dispatch({ type: 'RESET_FILTERS' }),
    setSort: (field: keyof StockRecord, order?: 'asc' | 'desc') => dispatch({ type: 'SET_SORT', payload: { field, order } }),
  };
}