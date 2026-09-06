/*
# Property Rental Marketplace Schema

## Overview
Creates a complete schema for a house rental/sales marketplace that stores
information about property owners, tenants, property listings (with photos),
and lease agreements linking tenants to properties.

## New Tables

1. **owners** — People who list properties for rent or sale.
   - id (uuid, PK)
   - name (text, required)
   - email (text)
   - phone (text)
   - avatar_url (text) — optional profile photo URL
   - created_at (timestamp)

2. **tenants** — People who rent or express interest in properties.
   - id (uuid, PK)
   - name (text, required)
   - email (text)
   - phone (text)
   - created_at (timestamp)

3. **properties** — Property listings with photos and details.
   - id (uuid, PK)
   - owner_id (uuid, FK → owners) — who owns the listing
   - title (text, required)
   - description (text)
   - address (text, required)
   - city (text)
   - price (numeric, required) — monthly rent or sale price
   - listing_type (text: 'rent' | 'sale', default 'rent')
   - bedrooms (int)
   - bathrooms (int)
   - area (numeric, in sq ft)
   - image_url (text) — property photo URL
   - status (text: 'available' | 'rented' | 'sold', default 'available')
   - created_at (timestamp)

4. **leases** — Agreements linking a tenant to a property.
   - id (uuid, PK)
   - property_id (uuid, FK → properties, CASCADE delete)
   - tenant_id (uuid, FK → tenants, SET NULL on delete)
   - start_date (date)
   - end_date (date)
   - monthly_rent (numeric)
   - status (text: 'active' | 'ended' | 'pending', default 'active')
   - created_at (timestamp)

## Security
- RLS enabled on all four tables.
- This is a no-sign-in app, so all policies use `TO anon, authenticated`
  with `USING (true)` / `WITH CHECK (true)` — the data is intentionally
  shared/public for the marketplace.

## Notes
1. All tables use `gen_random_uuid()` for primary keys.
2. Foreign keys use ON DELETE CASCADE / SET NULL to maintain referential integrity.
3. Indexes added on foreign key columns and frequently filtered columns.
*/

-- Owners table
CREATE TABLE IF NOT EXISTS owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_owners" ON owners;
CREATE POLICY "anon_select_owners" ON owners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_owners" ON owners;
CREATE POLICY "anon_insert_owners" ON owners FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_owners" ON owners;
CREATE POLICY "anon_update_owners" ON owners FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_owners" ON owners;
CREATE POLICY "anon_delete_owners" ON owners FOR DELETE
  TO anon, authenticated USING (true);

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tenants" ON tenants;
CREATE POLICY "anon_select_tenants" ON tenants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tenants" ON tenants;
CREATE POLICY "anon_insert_tenants" ON tenants FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tenants" ON tenants;
CREATE POLICY "anon_update_tenants" ON tenants FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tenants" ON tenants;
CREATE POLICY "anon_delete_tenants" ON tenants FOR DELETE
  TO anon, authenticated USING (true);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES owners(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  address text NOT NULL,
  city text,
  price numeric NOT NULL DEFAULT 0,
  listing_type text NOT NULL DEFAULT 'rent' CHECK (listing_type IN ('rent', 'sale')),
  bedrooms int,
  bathrooms int,
  area numeric,
  image_url text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'sold')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_properties" ON properties;
CREATE POLICY "anon_select_properties" ON properties FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_properties" ON properties;
CREATE POLICY "anon_insert_properties" ON properties FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_properties" ON properties;
CREATE POLICY "anon_update_properties" ON properties FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_properties" ON properties;
CREATE POLICY "anon_delete_properties" ON properties FOR DELETE
  TO anon, authenticated USING (true);

-- Leases table
CREATE TABLE IF NOT EXISTS leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  monthly_rent numeric,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'pending')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leases" ON leases;
CREATE POLICY "anon_select_leases" ON leases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leases" ON leases;
CREATE POLICY "anon_insert_leases" ON leases FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_leases" ON leases;
CREATE POLICY "anon_update_leases" ON leases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_leases" ON leases;
CREATE POLICY "anon_delete_leases" ON leases FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(tenant_id);
