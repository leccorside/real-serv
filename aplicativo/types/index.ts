export interface User {
  id: string;
  re?: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type PointType = 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA';

export interface TimeRecord {
  id: string;
  userId: string;
  timestamp: string; // ISO 8601
  type: PointType;
  location?: {
    latitude: number;
    longitude: number;
  };
  photo?: string;
  synced: boolean;
}
