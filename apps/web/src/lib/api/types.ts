export interface Memo {
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
  memo_groups?: { group_id: string }[];
}

export interface Group {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
}

export interface MemoListResponse {
  memos: Memo[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginResponse {
  user: { id: string; email: string };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export interface UploadResponse {
  memo_id: string;
  status: 'processing';
}

export interface ProcessingStatus {
  id: string;
  status: 'transcribing' | 'summarizing' | 'completed';
}
