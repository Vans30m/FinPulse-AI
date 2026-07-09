import API_BASE_URL from "../config/api";

const API_BASE = `${API_BASE_URL}/api`;

function getHeaders() {
  const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token') || '';
  const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
  const userId = storedUser.id || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (userId) headers['X-User-Id'] = userId;
  return headers;
}

export const dashboardService = {
  // TRANSACTIONS
  async getTransactions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/portfolio/transactions`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async addTransaction(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/portfolio/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add transaction');
    return res.json();
  },

  async deleteTransaction(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/portfolio/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
    return res.json();
  },

  // WATCHLISTS
  async getWatchlists(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/watchlists`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch watchlists');
    return res.json();
  },

  async createWatchlist(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create watchlist');
    }
    return res.json();
  },

  async deleteWatchlist(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete watchlist');
    }
    return res.json();
  },

  async addWatchlistItem(listId: string, item: any): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/${listId}/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add watchlist item');
    }
    return res.json();
  },

  async removeWatchlistItem(itemId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/items/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to remove watchlist item');
    return res.json();
  },

  // ALERTS
  async getAlerts(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/alerts-custom`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async createAlert(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts-custom`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create alert');
    return res.json();
  },

  async updateAlert(id: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts-custom/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update alert');
    return res.json();
  },

  async toggleAlertStatus(id: string, data: { enabled?: boolean; status?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts-custom/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update alert status');
    return res.json();
  },

  async getAlertHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/alerts-custom/history`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch alert history');
    return res.json();
  },

  async deleteAlert(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts-custom/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete alert');
    return res.json();
  },

  // SAVED SCREENERS
  async getSavedScreeners(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/saved-screeners`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch screeners');
    return res.json();
  },

  async saveScreener(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/saved-screeners`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save screener');
    return res.json();
  },

  async deleteScreener(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/saved-screeners/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete screener');
    return res.json();
  },

  // AI HISTORY
  async getAiHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/ai-chat/history`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch AI history');
    return res.json();
  },

  async addAiHistory(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/ai-chat/history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save AI history');
    return res.json();
  },

  async toggleAiHistoryFavorite(id: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/ai-chat/history/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update AI history log');
    return res.json();
  },

  async clearAiHistory(): Promise<any> {
    const res = await fetch(`${API_BASE}/ai-chat/history`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear AI history');
    return res.json();
  },

  // RECENT SEARCHES
  async getRecentSearches(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/recent/searches`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch searches');
    return res.json();
  },

  async addRecentSearch(query: string): Promise<any> {
    const res = await fetch(`${API_BASE}/recent/searches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('Failed to add search log');
    return res.json();
  },

  async clearRecentSearches(): Promise<any> {
    const res = await fetch(`${API_BASE}/recent/searches`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear search logs');
    return res.json();
  },

  // RECENT VIEWED ASSETS
  async getRecentViewed(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/recent/viewed`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch viewed assets');
    return res.json();
  },

  async addRecentViewed(symbol: string, name: string): Promise<any> {
    const res = await fetch(`${API_BASE}/recent/viewed`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ symbol, name })
    });
    if (!res.ok) throw new Error('Failed to save viewed asset log');
    return res.json();
  },

  async clearRecentViewed(): Promise<any> {
    const res = await fetch(`${API_BASE}/recent/viewed`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear viewed assets history');
    return res.json();
  },

  // ADVANCED WATCHLIST EXTRA APIS
  async reorderWatchlistItems(id: string, itemIds: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/${id}/reorder`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ itemIds })
    });
    if (!res.ok) throw new Error('Failed to reorder watchlist items');
    return res.json();
  },

  async updateWatchlistItem(itemId: string, data: { notes?: string; pinned?: boolean; favorite?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/items/${itemId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update watchlist item');
    return res.json();
  },

  async getWatchlistAnalytics(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/${id}/analytics`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch watchlist analytics');
    return res.json();
  },

  async getWatchlistAIRankings(id: string): Promise<{ symbol: string; score: number; reason: string }[]> {
    const res = await fetch(`${API_BASE}/watchlists/${id}/ai-rankings`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch AI rankings');
    return res.json();
  },

  async getWatchlistItemNotes(itemId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/watchlists/items/${itemId}/notes`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch watchlist item notes');
    return res.json();
  },

  async addWatchlistItemNote(itemId: string, note: { title: string; description: string; pinned?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/items/${itemId}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(note)
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
  },

  async updateWatchlistItemNote(noteId: string, note: { title?: string; description?: string; pinned?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/items/notes/${noteId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(note)
    });
    if (!res.ok) throw new Error('Failed to update note');
    return res.json();
  },

  async deleteWatchlistItemNote(noteId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/items/notes/${noteId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete note');
    return res.json();
  },

  async getWatchlistTags(id: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/watchlists/${id}/tags`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch tags');
    return res.json();
  },

  async addWatchlistTag(id: string, name: string): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/${id}/tags`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to add tag');
    return res.json();
  },

  async deleteWatchlistTag(tagId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlists/tags/${tagId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete tag');
    return res.json();
  }
};
