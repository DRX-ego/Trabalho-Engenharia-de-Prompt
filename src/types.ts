export interface NeoConfig {
  size: number;
  radius: number;
  distance: number;
  intensity: number;
  blur: number;
  color: string;
  gradient: boolean;
  shape: 'flat' | 'concave' | 'convex' | 'pressed';
  glassmorphism: boolean;
  glassBlur: number;
  glassOpacity: number;
}

export interface Preset {
  id?: string;
  userId: string;
  name: string;
  config: NeoConfig;
  createdAt: string;
}

export interface HistoryEntry {
  id?: string;
  userId: string;
  config: NeoConfig;
  timestamp: string;
}
