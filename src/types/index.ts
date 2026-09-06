export interface Owner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export type ListingType = 'rent' | 'sale';
export type PropertyStatus = 'available' | 'rented' | 'sold';

export interface Property {
  id: string;
  owner_id: string | null;
  title: string;
  description: string | null;
  address: string;
  city: string | null;
  price: number;
  listing_type: ListingType;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  image_url: string | null;
  status: PropertyStatus;
  created_at: string;
  owner?: Owner | null;
}

export type LeaseStatus = 'active' | 'ended' | 'pending';

export interface Lease {
  id: string;
  property_id: string | null;
  tenant_id: string | null;
  start_date: string | null;
  end_date: string | null;
  monthly_rent: number | null;
  status: LeaseStatus;
  created_at: string;
  property?: Property | null;
  tenant?: Tenant | null;
}

export interface PropertyInput {
  owner_id: string | null;
  title: string;
  description: string;
  address: string;
  city: string;
  price: number;
  listing_type: ListingType;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image_url: string;
  status: PropertyStatus;
}

export interface OwnerInput {
  name: string;
  email: string;
  phone: string;
}

export interface TenantInput {
  name: string;
  email: string;
  phone: string;
}

export interface LeaseInput {
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  status: LeaseStatus;
}
