export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export enum account_type {
  unknown = 'unknown',
}

type TableDefinition<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type HoldingsRow = Record<string, unknown>;

type DividendDataRow = Record<string, unknown>;

type UserSettingsRow = {
  account_type: account_type | null;
} & Record<string, unknown>;

type RoadmapHistoriesRow = Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      holdings: TableDefinition<HoldingsRow>;
      dividend_data: TableDefinition<DividendDataRow>;
      user_settings: TableDefinition<UserSettingsRow>;
      roadmap_histories: TableDefinition<RoadmapHistoriesRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_type: account_type;
    };
    CompositeTypes: Record<string, never>;
  };
};
