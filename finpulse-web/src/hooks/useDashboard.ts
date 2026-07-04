import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import toast from 'react-hot-toast';

// TRANSACTIONS
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: dashboardService.getTransactions
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-holdings'] });
      toast.success('Transaction registered successfully');
    },
    onError: () => {
      toast.error('Failed to register transaction');
    }
  });
}

// WATCHLISTS
export function useWatchlists() {
  return useQuery({
    queryKey: ['watchlists'],
    queryFn: dashboardService.getWatchlists
  });
}

export function useCreateWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Watchlist created successfully');
    }
  });
}

export function useDeleteWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.deleteWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Watchlist deleted');
    }
  });
}

export function useAddWatchlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, item }: { listId: string; item: any }) => 
      dashboardService.addWatchlistItem(listId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Asset added to watchlist');
    }
  });
}

export function useRemoveWatchlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.removeWatchlistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Asset removed from watchlist');
    }
  });
}

// ADVANCED WATCHLIST HOOKS
export function useReorderWatchlistItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itemIds }: { id: string; itemIds: string[] }) =>
      dashboardService.reorderWatchlistItems(id, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    }
  });
}

export function useUpdateWatchlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      dashboardService.updateWatchlistItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Watchlist item updated');
    }
  });
}

export function useWatchlistAnalytics(id: string) {
  return useQuery({
    queryKey: ['watchlist-analytics', id],
    queryFn: () => dashboardService.getWatchlistAnalytics(id),
    enabled: !!id
  });
}

export function useWatchlistNotes(itemId: string) {
  return useQuery({
    queryKey: ['watchlist-notes', itemId],
    queryFn: () => dashboardService.getWatchlistItemNotes(itemId),
    enabled: !!itemId
  });
}

export function useAddWatchlistNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, note }: { itemId: string; note: any }) =>
      dashboardService.addWatchlistItemNote(itemId, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-notes', variables.itemId] });
      toast.success('Note added');
    }
  });
}

export function useUpdateWatchlistNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, noteId, note }: { itemId: string; noteId: string; note: any }) =>
      dashboardService.updateWatchlistItemNote(noteId, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-notes', variables.itemId] });
      toast.success('Note updated');
    }
  });
}

export function useDeleteWatchlistNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, noteId }: { itemId: string; noteId: string }) =>
      dashboardService.deleteWatchlistItemNote(noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-notes', variables.itemId] });
      toast.success('Note deleted');
    }
  });
}

export function useWatchlistTags(id: string) {
  return useQuery({
    queryKey: ['watchlist-tags', id],
    queryFn: () => dashboardService.getWatchlistTags(id),
    enabled: !!id
  });
}

export function useAddWatchlistTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      dashboardService.addWatchlistTag(id, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-tags', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Tag added');
    }
  });
}

export function useDeleteWatchlistTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tagId }: { id: string; tagId: string }) =>
      dashboardService.deleteWatchlistTag(tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-tags', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Tag deleted');
    }
  });
}

// ALERTS
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts-custom'],
    queryFn: dashboardService.getAlerts
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-custom'] });
      toast.success('Alert set successfully');
    }
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      dashboardService.updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-custom'] });
      toast.success('Alert updated successfully');
    }
  });
}

export function useToggleAlertStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { enabled?: boolean; status?: string } }) =>
      dashboardService.toggleAlertStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-custom'] });
    }
  });
}

export function useAlertHistory() {
  return useQuery({
    queryKey: ['alerts-history'],
    queryFn: dashboardService.getAlertHistory
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-custom'] });
      toast.success('Alert removed');
    }
  });
}

// SAVED SCREENERS
export function useSavedScreeners() {
  return useQuery({
    queryKey: ['saved-screeners'],
    queryFn: dashboardService.getSavedScreeners
  });
}

export function useSaveScreener() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.saveScreener,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-screeners'] });
      toast.success('Screener configurations saved');
    }
  });
}

// AI HISTORY
export function useAIHistory() {
  return useQuery({
    queryKey: ['ai-history'],
    queryFn: dashboardService.getAiHistory
  });
}

export function useSaveAIHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.addAiHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-history'] });
    }
  });
}

// RECENT SEARCHES
export function useRecentSearches() {
  return useQuery({
    queryKey: ['recent-searches'],
    queryFn: dashboardService.getRecentSearches
  });
}

export function useAddRecentSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.addRecentSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-searches'] });
    }
  });
}

// RECENT VIEWED ASSETS
export function useRecentViewed() {
  return useQuery({
    queryKey: ['recent-viewed'],
    queryFn: dashboardService.getRecentViewed
  });
}

export function useAddRecentViewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ symbol, name }: { symbol: string; name: string }) => 
      dashboardService.addRecentViewed(symbol, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-viewed'] });
    }
  });
}
