export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DataEntry {
  _id?: string;
  B1: string;
  B2: string;
  B3: string;
  detail: string;
}

export interface DataWithPercentage {
  value: string;
  percentage: number;
  count?: number;
  totalCount?: number;
}

export interface GroupedB3Detail {
  detail: string;
  count: number;
  totalCount: number;
  percentage: number;
  configuredPercentage?: number;
}

export interface PhoneBrand {
  _id?: string;
  name: string;
  percentage: number;
}

export interface ImportResponse {
  message: string;
  count: number;
}

export interface ApiError {
  error: string;
} 