import { api } from '$lib/api/client.js';
import type { Memo, MemoListResponse } from '$lib/api/types.js';

function createMemoStore() {
  let memos = $state<Memo[]>([]);
  let total = $state(0);
  let page = $state(1);
  let loading = $state(false);
  let searchInput = $state('');
  let appliedQuery = $state('');
  let selectedGroupId = $state<string | null>(null);

  return {
    get memos() { return memos; },
    get total() { return total; },
    get page() { return page; },
    get loading() { return loading; },
    get searchInput() { return searchInput; },
    set searchInput(v: string) { searchInput = v; },
    get appliedQuery() { return appliedQuery; },
    get selectedGroupId() { return selectedGroupId; },
    set selectedGroupId(v: string | null) { selectedGroupId = v; },

    async fetch(p = 1) {
      loading = true;
      try {
        const params = new URLSearchParams({ page: String(p), limit: '20' });
        if (appliedQuery) params.set('search', appliedQuery);
        if (selectedGroupId) params.set('group_id', selectedGroupId);
        const res = await api.get<MemoListResponse>(`/memos?${params}`);
        memos = res.memos;
        total = res.total;
        page = res.page;
      } finally {
        loading = false;
      }
    },

    applySearch() {
      appliedQuery = searchInput;
      this.fetch(1);
    },

    resetSearch() {
      searchInput = '';
      appliedQuery = '';
      this.fetch(1);
    },

    async deleteMemo(id: string) {
      await api.delete(`/memos/${id}`);
      memos = memos.filter((m) => m.id !== id);
      total--;
    },
  };
}

export const memoStore = createMemoStore();
