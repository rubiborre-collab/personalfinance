export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MovementType = 'income' | 'expense' | 'transfer';
export type CategoryKind = 'income' | 'expense';
export type FixedFlag = 'fixed' | 'variable';
export type AccountType = 'bank' | 'cash' | 'broker' | 'roboadvisor' | 'ewallet' | 'credit_card';

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          type: AccountType;
          opening_balance: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          type: AccountType;
          opening_balance?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          type?: AccountType;
          opening_balance?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          kind: CategoryKind;
          is_fixed: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          kind: CategoryKind;
          is_fixed?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          kind?: CategoryKind;
          is_fixed?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
      };
      movements: {
        Row: {
          id: string;
          owner_id: string;
          date: string;
          type: MovementType;
          amount: number;
          account_id: string | null;
          account_from_id: string | null;
          account_to_id: string | null;
          category_id: string | null;
          fixed_var: FixedFlag | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          date: string;
          type: MovementType;
          amount: number;
          account_id?: string | null;
          account_from_id?: string | null;
          account_to_id?: string | null;
          category_id?: string | null;
          fixed_var?: FixedFlag | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          date?: string;
          type?: MovementType;
          amount?: number;
          account_id?: string | null;
          account_from_id?: string | null;
          account_to_id?: string | null;
          category_id?: string | null;
          fixed_var?: FixedFlag | null;
          note?: string | null;
          created_at?: string;
        };
      };
      snapshots: {
        Row: {
          id: string;
          owner_id: string;
          account_id: string;
          date: string;
          balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          account_id: string;
          date: string;
          balance: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          account_id?: string;
          date?: string;
          balance?: number;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          owner_id: string;
          timezone: string;
          date_format: string;
          week_starts_on: string;
        };
        Insert: {
          owner_id: string;
          timezone?: string;
          date_format?: string;
          week_starts_on?: string;
        };
        Update: {
          owner_id?: string;
          timezone?: string;
          date_format?: string;
          week_starts_on?: string;
        };
      };
      day_notes: {
        Row: {
          id: string;
          owner_id: string;
          date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          date: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          date?: string;
          note?: string | null;
          created_at?: string;
        };
      };
      recurring_templates: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          type: MovementType;
          amount: number;
          day_of_month: number;
          account_id: string;
          category_id: string;
          fixed_var: FixedFlag | null;
          note: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          type: MovementType;
          amount: number;
          day_of_month: number;
          account_id: string;
          category_id: string;
          fixed_var?: FixedFlag | null;
          note?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          type?: MovementType;
          amount?: number;
          day_of_month?: number;
          account_id?: string;
          category_id?: string;
          fixed_var?: FixedFlag | null;
          note?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
