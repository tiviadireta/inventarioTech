export interface AccessCredential {
  id: string;
  created_at: string;
  type: string | null;
  platform_name: string | null;
  email: string | null;
  password: string | null;
  observations: string | null;
}

export interface InventoryItem {
  id: string;
  created_at: string;
  equipment: string;
  brand_model: string;
  serial_number: string;
  status: string;
  user: string | null;
  location: string | null;
  acquisition_date: string | null;
  warranty_until: string | null;
  configuration: string | null;
  observations: string | null;
  microsoft_account: string | null;
}

export interface MobileDevice {
  id: string;
  created_at: string;
  number: string | null;
  operator: string | null;
  sector_user: string | null;
  responsible: string | null;
  chip_device: string | null;
  whatsapp_business: string | null;
  ownership: string | null;
  cpf_name: string | null;
  plan: string | null;
  period: string | null;
  date: string | null;
  type: string | null;
}
