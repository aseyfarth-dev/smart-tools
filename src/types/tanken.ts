export interface RefuelEntry {
  datum: string; // DD.MM.YYYY
  ort: string;
  eurPerLiter: number;
  liter: number;
  preis: number;
  km: number;
  verbrauch: number | null; // formula result, may be empty
  globusRabatt: number | null;
}

export interface DashboardData {
  verbrauchAllTime: number | null;
  verbrauchLast100Days: number | null;
  recentEntries: RefuelEntry[];
  lastOrt: string | null;
  lastKm: number | null;
}
