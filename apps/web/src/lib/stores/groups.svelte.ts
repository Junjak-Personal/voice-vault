import { api } from '$lib/api/client.js';
import type { Group } from '$lib/api/types.js';

function createGroupStore() {
  let groups = $state<Group[]>([]);
  let loading = $state(false);

  return {
    get groups() { return groups; },
    get loading() { return loading; },

    async fetch() {
      loading = true;
      try {
        groups = await api.get<Group[]>('/groups');
      } finally {
        loading = false;
      }
    },

    async create(name: string, description?: string, color?: string) {
      const group = await api.post<Group>('/groups', { name, description, color });
      groups = [group, ...groups];
      return group;
    },

    async update(id: string, data: { name?: string; description?: string; color?: string }) {
      const updated = await api.patch<Group>(`/groups/${id}`, data);
      groups = groups.map((g) => (g.id === id ? updated : g));
      return updated;
    },

    async remove(id: string) {
      await api.delete(`/groups/${id}`);
      groups = groups.filter((g) => g.id !== id);
    },
  };
}

export const groupStore = createGroupStore();
