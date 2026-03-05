export interface Database {
  public: {
    Tables: {
      memos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          raw_transcript: string | null;
          summary_md: string | null;
          audio_path: string | null;
          duration_sec: number | null;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          raw_transcript?: string | null;
          summary_md?: string | null;
          audio_path?: string | null;
          duration_sec?: number | null;
          language?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          raw_transcript?: string | null;
          summary_md?: string | null;
          audio_path?: string | null;
          duration_sec?: number | null;
          language?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memos_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      memo_groups: {
        Row: {
          memo_id: string;
          group_id: string;
        };
        Insert: {
          memo_id: string;
          group_id: string;
        };
        Update: {
          memo_id?: string;
          group_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memo_groups_memo_id_fkey';
            columns: ['memo_id'];
            isOneToOne: false;
            referencedRelation: 'memos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memo_groups_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Memo = Database['public']['Tables']['memos']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type MemoGroup = Database['public']['Tables']['memo_groups']['Row'];
