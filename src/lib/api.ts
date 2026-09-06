import { supabase } from '@/lib/supabase';
import type { Property, PropertyInput, Owner, Lease, Tenant } from '@/types';

export async function fetchProperties(filters?: {
  listingType?: string;
  city?: string;
  status?: string;
  search?: string;
}): Promise<Property[]> {
  let query = supabase
    .from('properties')
    .select('*, owner:owners(*)')
    .order('created_at', { ascending: false });

  if (filters?.listingType && filters.listingType !== 'all') {
    query = query.eq('listing_type', filters.listingType);
  }
  if (filters?.city && filters.city !== 'all') {
    query = query.eq('city', filters.city);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Property[];
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, owner:owners(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Property | null;
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Property;
}

export async function updateProperty(
  id: string,
  input: Partial<PropertyInput>
): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Property;
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchOwners(): Promise<Owner[]> {
  const { data, error } = await supabase
    .from('owners')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Owner[];
}

export async function createOwner(
  input: Omit<Owner, 'id' | 'created_at' | 'avatar_url'>
): Promise<Owner> {
  const { data, error } = await supabase
    .from('owners')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Owner;
}

export async function fetchTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Tenant[];
}

export async function createTenant(
  input: Omit<Tenant, 'id' | 'created_at'>
): Promise<Tenant> {
  const { data, error } = await supabase
    .from('tenants')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Tenant;
}

export async function fetchLeases(): Promise<Lease[]> {
  const { data, error } = await supabase
    .from('leases')
    .select('*, property:properties(*), tenant:tenants(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Lease[];
}

export async function createLease(input: {
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  status: string;
}): Promise<Lease> {
  const { data, error } = await supabase
    .from('leases')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Lease;
}

export async function updateLeaseStatus(
  id: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('leases')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteLease(id: string): Promise<void> {
  const { error } = await supabase.from('leases').delete().eq('id', id);
  if (error) throw error;
}
