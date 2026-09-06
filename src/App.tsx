import { useState, useEffect, useCallback } from 'react';
import { Home, Building2, Users, UserCheck, Search, Plus, X, Bed, Bath, Maximize, MapPin, Phone, Mail, Trash2, Edit2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Property, Owner, Tenant, Lease, ListingType, PropertyStatus, LeaseStatus } from '@/types';
import {
  fetchProperties,
  fetchOwners,
  fetchTenants,
  fetchLeases,
  createProperty,
  createOwner,
  createTenant,
  createLease,
  updateProperty,
  deleteProperty,
  updateLeaseStatus,
  deleteLease,
} from '@/lib/api';

type Tab = 'listings' | 'owners' | 'tenants' | 'leases';
type ModalType = 'addProperty' | 'editProperty' | 'viewProperty' | 'addOwner' | 'addTenant' | 'addLease' | null;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const cities = [...new Set(properties.map((p) => p.city).filter(Boolean))] as string[];

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [props, own, ten, lea] = await Promise.all([
        fetchProperties(),
        fetchOwners(),
        fetchTenants(),
        fetchLeases(),
      ]);
      setProperties(props);
      setOwners(own);
      setTenants(ten);
      setLeases(lea);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadProperties = useCallback(async () => {
    try {
      const data = await fetchProperties({
        listingType: listingTypeFilter,
        status: statusFilter,
        city: cityFilter,
        search,
      });
      setProperties(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to filter properties');
    }
  }, [listingTypeFilter, statusFilter, cityFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => loadProperties(), 200);
    return () => clearTimeout(t);
  }, [loadProperties]);

  const stats = {
    totalProperties: properties.length,
    available: properties.filter((p) => p.status === 'available').length,
    owners: owners.length,
    tenants: tenants.length,
    activeLeases: leases.filter((l) => l.status === 'active').length,
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await deleteProperty(id);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete property');
    }
  };

  const handleDeleteLease = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lease?')) return;
    try {
      await deleteLease(id);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete lease');
    }
  };

  const handleLeaseStatusChange = async (id: string, status: string) => {
    try {
      await updateLeaseStatus(id, status);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update lease');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                <Home className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">EstateHub</h1>
                <p className="text-xs text-slate-500 leading-tight">Property Rental & Sales</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModal('addProperty')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Property
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={<Building2 className="w-5 h-5" />} label="Total Properties" value={stats.totalProperties} color="teal" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Available" value={stats.available} color="green" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Owners" value={stats.owners} color="blue" />
          <StatCard icon={<UserCheck className="w-5 h-5" />} label="Tenants" value={stats.tenants} color="amber" />
          <StatCard icon={<Home className="w-5 h-5" />} label="Active Leases" value={stats.activeLeases} color="cyan" />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-full sm:w-auto overflow-x-auto">
          <TabButton active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} icon={<Building2 className="w-4 h-4" />} label="Listings" />
          <TabButton active={activeTab === 'owners'} onClick={() => setActiveTab('owners')} icon={<Users className="w-4 h-4" />} label="Owners" />
          <TabButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} icon={<UserCheck className="w-4 h-4" />} label="Tenants" />
          <TabButton active={activeTab === 'leases'} onClick={() => setActiveTab('leases')} icon={<Home className="w-4 h-4" />} label="Leases" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'listings' ? (
          <ListingsTab
            properties={properties}
            search={search}
            setSearch={setSearch}
            listingTypeFilter={listingTypeFilter}
            setListingTypeFilter={setListingTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            cities={cities}
            onView={(p) => { setSelectedProperty(p); setModal('viewProperty'); }}
            onEdit={(p) => { setSelectedProperty(p); setModal('editProperty'); }}
            onDelete={handleDeleteProperty}
            onAdd={() => setModal('addProperty')}
          />
        ) : activeTab === 'owners' ? (
          <OwnersTab owners={owners} properties={properties} onAdd={() => setModal('addOwner')} />
        ) : activeTab === 'tenants' ? (
          <TenantsTab tenants={tenants} leases={leases} onAdd={() => setModal('addTenant')} />
        ) : (
          <LeasesTab
            leases={leases}
            properties={properties}
            tenants={tenants}
            onAdd={() => setModal('addLease')}
            onStatusChange={handleLeaseStatusChange}
            onDelete={handleDeleteLease}
          />
        )}
      </main>

      {/* Mobile Add Button */}
      <button
        onClick={() => {
          if (activeTab === 'listings') setModal('addProperty');
          else if (activeTab === 'owners') setModal('addOwner');
          else if (activeTab === 'tenants') setModal('addTenant');
          else setModal('addLease');
        }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-teal-700 transition-colors z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      {modal === 'addProperty' && (
        <PropertyFormModal
          owners={owners}
          onClose={() => setModal(null)}
          onSubmit={async (data) => {
            await createProperty(data);
            setModal(null);
            await loadAll();
          }}
        />
      )}
      {modal === 'editProperty' && selectedProperty && (
        <PropertyFormModal
          owners={owners}
          property={selectedProperty}
          onClose={() => setModal(null)}
          onSubmit={async (data) => {
            await updateProperty(selectedProperty.id, data);
            setModal(null);
            await loadAll();
          }}
        />
      )}
      {modal === 'viewProperty' && selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          leases={leases.filter((l) => l.property_id === selectedProperty.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'addOwner' && (
        <OwnerFormModal
          onClose={() => setModal(null)}
          onSubmit={async (data) => {
            await createOwner(data);
            setModal(null);
            await loadAll();
          }}
        />
      )}
      {modal === 'addTenant' && (
        <TenantFormModal
          onClose={() => setModal(null)}
          onSubmit={async (data) => {
            await createTenant(data);
            setModal(null);
            await loadAll();
          }}
        />
      )}
      {modal === 'addLease' && (
        <LeaseFormModal
          properties={properties}
          tenants={tenants}
          onClose={() => setModal(null)}
          onSubmit={async (data) => {
            await createLease(data);
            if (data.property_id) {
              await updateProperty(data.property_id, { status: 'rented' as PropertyStatus });
            }
            setModal(null);
            await loadAll();
          }}
        />
      )}
    </div>
  );
}

// --- Stat Card ---
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{value}</p>
          <p className="text-xs text-slate-500 leading-tight">{label}</p>
        </div>
      </div>
    </div>
  );
}

// --- Tab Button ---
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-teal-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Listings Tab ---
function ListingsTab({
  properties,
  search,
  setSearch,
  listingTypeFilter,
  setListingTypeFilter,
  statusFilter,
  setStatusFilter,
  cityFilter,
  setCityFilter,
  cities,
  onView,
  onEdit,
  onDelete,
  onAdd,
}: {
  properties: Property[];
  search: string;
  setSearch: (v: string) => void;
  listingTypeFilter: string;
  setListingTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  cityFilter: string;
  setCityFilter: (v: string) => void;
  cities: string[];
  onView: (p: Property) => void;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, address, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <select
          value={listingTypeFilter}
          onChange={(e) => setListingTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Types</option>
          <option value="rent">For Rent</option>
          <option value="sale">For Sale</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="sold">Sold</option>
        </select>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12" />}
          title="No properties found"
          subtitle="Try adjusting your filters or add a new property."
          actionLabel="Add Property"
          onAction={onAdd}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onView={() => onView(property)}
              onEdit={() => onEdit(property)}
              onDelete={() => onDelete(property.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Property Card ---
function PropertyCard({ property, onView, onEdit, onDelete }: { property: Property; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    rented: 'bg-amber-100 text-amber-700',
    sold: 'bg-slate-200 text-slate-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 group">
      <div className="relative h-52 overflow-hidden cursor-pointer" onClick={onView}>
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[property.status]}`}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-600 text-white">
            {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">{property.title}</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="line-clamp-1">{property.address}{property.city ? `, ${property.city}` : ''}</span>
        </p>
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><Bed className="w-4 h-4 text-slate-400" /> {property.bedrooms}</span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-slate-400" /> {property.bathrooms}</span>
          )}
          {property.area != null && (
            <span className="flex items-center gap-1"><Maximize className="w-4 h-4 text-slate-400" /> {property.area} sqft</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-slate-900">
              ${property.price.toLocaleString()}
            </span>
            {property.listing_type === 'rent' && <span className="text-sm text-slate-500">/mo</span>}
          </div>
          <div className="flex gap-1">
            <button onClick={onView} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-teal-600 transition-colors" title="View">
              <Search className="w-4 h-4" />
            </button>
            <button onClick={onEdit} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="Edit">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {property.owner && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
              {property.owner.name.charAt(0)}
            </div>
            <span className="text-xs text-slate-500">Listed by {property.owner.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Owners Tab ---
function OwnersTab({ owners, properties, onAdd }: { owners: Owner[]; properties: Property[]; onAdd: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Property Owners</h2>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Owner
        </button>
      </div>
      {owners.length === 0 ? (
        <EmptyState icon={<Users className="w-12 h-12" />} title="No owners yet" subtitle="Add an owner to start listing properties." actionLabel="Add Owner" onAction={onAdd} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {owners.map((owner) => {
            const ownerProps = properties.filter((p) => p.owner_id === owner.id);
            return (
              <div key={owner.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                    {owner.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{owner.name}</h3>
                    {owner.email && <p className="text-sm text-slate-500 flex items-center gap-1 truncate"><Mail className="w-3.5 h-3.5" /> {owner.email}</p>}
                    {owner.phone && <p className="text-sm text-slate-500 flex items-center gap-1 truncate"><Phone className="w-3.5 h-3.5" /> {owner.phone}</p>}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{ownerProps.length}</span> propert{ownerProps.length === 1 ? 'y' : 'ies'} listed
                  </p>
                  {ownerProps.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ownerProps.slice(0, 3).map((p) => (
                        <span key={p.id} className="px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-600 truncate max-w-[140px]">
                          {p.title}
                        </span>
                      ))}
                      {ownerProps.length > 3 && <span className="px-2 py-1 text-xs text-slate-400">+{ownerProps.length - 3} more</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Tenants Tab ---
function TenantsTab({ tenants, leases, onAdd }: { tenants: Tenant[]; leases: Lease[]; onAdd: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Tenants</h2>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>
      {tenants.length === 0 ? (
        <EmptyState icon={<UserCheck className="w-12 h-12" />} title="No tenants yet" subtitle="Add a tenant to start creating leases." actionLabel="Add Tenant" onAction={onAdd} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenant) => {
            const tenantLeases = leases.filter((l) => l.tenant_id === tenant.id);
            return (
              <div key={tenant.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                    {tenant.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{tenant.name}</h3>
                    {tenant.email && <p className="text-sm text-slate-500 flex items-center gap-1 truncate"><Mail className="w-3.5 h-3.5" /> {tenant.email}</p>}
                    {tenant.phone && <p className="text-sm text-slate-500 flex items-center gap-1 truncate"><Phone className="w-3.5 h-3.5" /> {tenant.phone}</p>}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{tenantLeases.length}</span> lease{tenantLeases.length === 1 ? '' : 's'}
                  </p>
                  {tenantLeases.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {tenantLeases.slice(0, 3).map((l) => (
                        <div key={l.id} className="flex items-center gap-2 text-xs">
                          <LeaseStatusIcon status={l.status} />
                          <span className="text-slate-600 truncate">{l.property?.title || 'Unknown property'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Leases Tab ---
function LeasesTab({
  leases,
  properties,
  tenants,
  onAdd,
  onStatusChange,
  onDelete,
}: {
  leases: Lease[];
  properties: Property[];
  tenants: Tenant[];
  onAdd: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Lease Agreements</h2>
        <button
          onClick={onAdd}
          disabled={properties.length === 0 || tenants.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Create Lease
        </button>
      </div>
      {(properties.length === 0 || tenants.length === 0) && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
          You need at least one property and one tenant to create a lease.
        </div>
      )}
      {leases.length === 0 ? (
        <EmptyState icon={<Home className="w-12 h-12" />} title="No leases yet" subtitle="Create a lease to link a tenant to a property." actionLabel="Create Lease" onAction={onAdd} />
      ) : (
        <div className="space-y-3">
          {leases.map((lease) => {
            const prop = lease.property || properties.find((p) => p.id === lease.property_id);
            const tenant = lease.tenant || tenants.find((t) => t.id === lease.tenant_id);
            return (
              <div key={lease.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {prop?.image_url ? (
                        <img src={prop.image_url} alt={prop.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-slate-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{prop?.title || 'Unknown Property'}</h3>
                      <p className="text-sm text-slate-500 truncate">
                        Tenant: {tenant?.name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        {lease.start_date && <span>From: {new Date(lease.start_date).toLocaleDateString()}</span>}
                        {lease.end_date && <span>To: {new Date(lease.end_date).toLocaleDateString()}</span>}
                        {lease.monthly_rent != null && <span className="font-semibold text-slate-600">${lease.monthly_rent.toLocaleString()}/mo</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LeaseStatusBadge status={lease.status} />
                    <select
                      value={lease.status}
                      onChange={(e) => onStatusChange(lease.id, e.target.value)}
                      className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="ended">Ended</option>
                    </select>
                    <button onClick={() => onDelete(lease.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Lease Status Icon ---
function LeaseStatusIcon({ status }: { status: string }) {
  if (status === 'active') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (status === 'pending') return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  return <XCircle className="w-3.5 h-3.5 text-slate-400" />;
}

function LeaseStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    ended: 'bg-slate-200 text-slate-600',
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.ended}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

// --- Empty State ---
function EmptyState({ icon, title, subtitle, actionLabel, onAction }: { icon: React.ReactNode; title: string; subtitle: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{subtitle}</p>
      <button onClick={onAction} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
        <Plus className="w-4 h-4" /> {actionLabel}
      </button>
    </div>
  );
}

// --- Modal Shell ---
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// --- Form Field ---
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";

// --- Property Form Modal ---
function PropertyFormModal({ owners, property, onClose, onSubmit }: { owners: Owner[]; property?: Property; onClose: () => void; onSubmit: (data: any) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    owner_id: property?.owner_id || '',
    title: property?.title || '',
    description: property?.description || '',
    address: property?.address || '',
    city: property?.city || '',
    price: property?.price?.toString() || '',
    listing_type: property?.listing_type || 'rent',
    bedrooms: property?.bedrooms?.toString() || '',
    bathrooms: property?.bathrooms?.toString() || '',
    area: property?.area?.toString() || '',
    image_url: property?.image_url || '',
    status: property?.status || 'available',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit({
        owner_id: form.owner_id || null,
        title: form.title,
        description: form.description,
        address: form.address,
        city: form.city,
        price: parseFloat(form.price) || 0,
        listing_type: form.listing_type as ListingType,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        area: form.area ? parseFloat(form.area) : null,
        image_url: form.image_url || null,
        status: form.status as PropertyStatus,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save property');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={property ? 'Edit Property' : 'Add New Property'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}
        <Field label="Title">
          <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Modern Family Home" />
        </Field>
        <Field label="Owner">
          <select value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })} className={inputClass}>
            <option value="">No owner assigned</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={3} placeholder="Describe the property..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Address">
            <input required type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} placeholder="123 Main Street" />
          </Field>
          <Field label="City">
            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Austin" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price ($)">
            <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} placeholder="2500" min="0" />
          </Field>
          <Field label="Listing Type">
            <select value={form.listing_type} onChange={(e) => setForm({ ...form, listing_type: e.target.value as ListingType })} className={inputClass}>
              <option value="rent">For Rent</option>
              <option value="sale">For Sale</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Bedrooms">
            <input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className={inputClass} placeholder="3" min="0" />
          </Field>
          <Field label="Bathrooms">
            <input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className={inputClass} placeholder="2" min="0" />
          </Field>
          <Field label="Area (sqft)">
            <input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputClass} placeholder="1800" min="0" />
          </Field>
        </div>
        <Field label="Image URL">
          <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={inputClass} placeholder="https://..." />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PropertyStatus })} className={inputClass}>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="sold">Sold</option>
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">
            {submitting ? 'Saving...' : property ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// --- Property Detail Modal ---
function PropertyDetailModal({ property, leases, onClose }: { property: Property; leases: Lease[]; onClose: () => void }) {
  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    rented: 'bg-amber-100 text-amber-700',
    sold: 'bg-slate-200 text-slate-600',
  };
  return (
    <ModalShell title={property.title} onClose={onClose}>
      <div>
        {property.image_url && (
          <div className="rounded-xl overflow-hidden mb-4 h-56">
            <img src={property.image_url} alt={property.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[property.status]}`}>{property.status.charAt(0).toUpperCase() + property.status.slice(1)}</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-600 text-white">{property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}</span>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-4">
          ${property.price.toLocaleString()}{property.listing_type === 'rent' && <span className="text-base text-slate-500 font-normal">/mo</span>}
        </div>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">{property.description || 'No description available.'}</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {property.bedrooms != null && <div className="bg-slate-50 rounded-lg p-3 text-center"><Bed className="w-5 h-5 text-teal-600 mx-auto mb-1" /><p className="text-lg font-bold text-slate-900">{property.bedrooms}</p><p className="text-xs text-slate-500">Bedrooms</p></div>}
          {property.bathrooms != null && <div className="bg-slate-50 rounded-lg p-3 text-center"><Bath className="w-5 h-5 text-teal-600 mx-auto mb-1" /><p className="text-lg font-bold text-slate-900">{property.bathrooms}</p><p className="text-xs text-slate-500">Bathrooms</p></div>}
          {property.area != null && <div className="bg-slate-50 rounded-lg p-3 text-center"><Maximize className="w-5 h-5 text-teal-600 mx-auto mb-1" /><p className="text-lg font-bold text-slate-900">{property.area}</p><p className="text-xs text-slate-500">sqft</p></div>}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-4">
          <MapPin className="w-4 h-4 text-slate-400" />
          {property.address}{property.city ? `, ${property.city}` : ''}
        </div>
        {property.owner && (
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Owner</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold">{property.owner.name.charAt(0)}</div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{property.owner.name}</p>
                {property.owner.email && <p className="text-xs text-slate-500">{property.owner.email}</p>}
                {property.owner.phone && <p className="text-xs text-slate-500">{property.owner.phone}</p>}
              </div>
            </div>
          </div>
        )}
        {leases.length > 0 && (
          <div className="border-t border-slate-100 pt-4 mt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Lease History</h4>
            <div className="space-y-2">
              {leases.map((l) => (
                <div key={l.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <div className="text-sm text-slate-600">{l.tenant?.name || 'Unknown tenant'}</div>
                  <LeaseStatusBadge status={l.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// --- Owner Form Modal ---
function OwnerFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add owner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Add Owner" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}
        <Field label="Full Name">
          <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="John Smith" />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="john@email.com" />
        </Field>
        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+1 (555) 123-4567" />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add Owner'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// --- Tenant Form Modal ---
function TenantFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Add Tenant" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}
        <Field label="Full Name">
          <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Jane Doe" />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="jane@email.com" />
        </Field>
        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+1 (555) 987-6543" />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add Tenant'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// --- Lease Form Modal ---
function LeaseFormModal({ properties, tenants, onClose, onSubmit }: { properties: Property[]; tenants: Tenant[]; onClose: () => void; onSubmit: (data: any) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    property_id: '',
    tenant_id: '',
    start_date: today,
    end_date: '',
    monthly_rent: '',
    status: 'active' as LeaseStatus,
  });

  const selectedProperty = properties.find((p) => p.id === form.property_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit({
        property_id: form.property_id,
        tenant_id: form.tenant_id,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        monthly_rent: form.monthly_rent ? parseFloat(form.monthly_rent) : selectedProperty?.price || null,
        status: form.status,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create lease');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Create Lease" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}
        <Field label="Property">
          <select required value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })} className={inputClass}>
            <option value="">Select a property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.title} - {p.city || p.address}</option>)}
          </select>
        </Field>
        <Field label="Tenant">
          <select required value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })} className={inputClass}>
            <option value="">Select a tenant</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date">
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputClass} />
          </Field>
          <Field label="End Date">
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monthly Rent ($)">
            <input type="number" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} className={inputClass} placeholder={selectedProperty ? selectedProperty.price.toString() : '2500'} min="0" />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LeaseStatus })} className={inputClass}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="ended">Ended</option>
            </select>
          </Field>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Lease'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
