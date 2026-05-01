// Types shared across the mobile app

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  department?: { id: number; name: string };
  branch?: { id: number; name: string };
  email_verified_at?: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  requester?: { id: number; name: string; email: string };
  pic?: { id: number; name: string; email: string };
  category?: { id: number; name: string };
  branch?: { id: number; name: string };
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  serial_number?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'disposed';
  purchase_date?: string;
  purchase_cost?: number;
  asset_type?: { id: number; name: string };
  brand?: { id: number; name: string };
  branch?: { id: number; name: string };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetMaintenance {
  id: number;
  title?: string;
  maintenance_type?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'scheduled' | 'in_progress' | 'cancelled';
  scheduled_date?: string;
  maintenance_date?: string;
  completed_date?: string;
  cost?: number;
  asset: Asset;
  requested_by?: { id: number; name: string };
  created_at: string;
}

export interface Comment {
  id: number;
  body?: string;
  comment?: string;
  content?: string;
  user: { id: number; name: string };
  created_at: string;
}

export interface Attachment {
  id: number;
  filename: string;
  url: string;
  mime_type: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
