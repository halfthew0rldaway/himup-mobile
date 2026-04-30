import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Calendar, DollarSign, FileText, MapPin, Hash, Loader2, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { assetService } from '@/services';
import { format } from 'date-fns';
import type { Asset } from '@/types';
import { W, stickyHeader, sectionLabel } from '@/lib/design';

const STATUS_BADGE: Record<string, { background: string; color: string }> = {
  active:      { background: '#f0fdf4', color: '#15803d' },
  maintenance: { background: '#fffbeb', color: '#b45309' },
  disposed:    { background: '#fef2f2', color: '#b91c1c' },
  stock:       { background: '#eff6ff', color: '#1d4ed8' },
  inactive:    { background: W.gray100, color: W.gray600 },
};

const getStatusIcon = (s: string) => {
  if (s === 'active') return <CheckCircle size={22} color="#16a34a" />;
  if (s === 'maintenance') return <Wrench size={22} color="#b45309" />;
  if (s === 'disposed' || s === 'disposal') return <XCircle size={22} color="#b91c1c" />;
  return <Package size={22} color="#6b7280" />;
};
const getIconBg = (s: string) => ({ active: '#f0fdf4', maintenance: '#fffbeb', disposed: '#fef2f2', disposal: '#fef2f2', stock: '#eff6ff' }[s] || W.gray100);

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: asset, isLoading } = useQuery<Asset>({
    queryKey: ['asset', id],
    queryFn: () => assetService.getOne(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !asset) {
    return (
      <div style={{ minHeight: '100%', background: W.gray50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
      </div>
    );
  }

  const badge = STATUS_BADGE[asset.status] || { background: W.gray100, color: W.gray600 };

  return (
    <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
      {/* Header */}
      <div style={{ ...stickyHeader, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color={W.gray600} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: W.orange600 }}>{asset.asset_tag}</span>
          <div style={{ fontSize: 13, fontWeight: 600, color: W.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, flexShrink: 0, ...badge }}>{asset.status}</span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Hero card */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: getIconBg(asset.status), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {getStatusIcon(asset.status)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: W.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</p>
            {asset.brand?.name && <p style={{ fontSize: 13, color: W.gray500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.brand.name}</p>}
            {asset.asset_type?.name && (
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 500, color: W.orange700, background: W.orange50, padding: '2px 8px', borderRadius: 20 }}>
                {asset.asset_type.name}
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
          <p style={{ ...sectionLabel }}>Asset Info</p>
          {[
            { icon: Hash,        l: 'Asset Tag',   v: asset.asset_tag },
            { icon: Hash,        l: 'Serial No.',  v: asset.serial_number },
            { icon: MapPin,      l: 'Branch',      v: asset.branch?.name },
            { icon: Calendar,    l: 'Purchased',   v: asset.purchase_date ? format(new Date(asset.purchase_date), 'dd MMM yyyy') : null },
            { icon: DollarSign,  l: 'Cost',        v: asset.purchase_cost ? `Rp ${Number(asset.purchase_cost).toLocaleString('id-ID')}` : null },
          ].filter(i => i.v).map(({ icon: Icon, l, v }) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Icon size={14} color={W.gray400} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: W.gray500, width: 80, flexShrink: 0 }}>{l}</span>
              <span style={{ fontSize: 13, color: W.gray700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {asset.notes && (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <FileText size={14} color={W.gray400} /><p style={{ ...sectionLabel, marginBottom: 0 }}>Notes</p>
            </div>
            <p style={{ fontSize: 13, color: W.gray600, lineHeight: 1.6 }}>{asset.notes}</p>
          </div>
        )}

        {/* Maintenance CTA — matching web's orange button */}
        <button onClick={() => navigate(`/maintenance/create?asset_id=${asset.id}`)} className="press"
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${W.gray100b}`, borderRadius: 12, padding: 14, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wrench size={18} color="#b45309" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: W.gray900 }}>Request Maintenance</p>
            <p style={{ fontSize: 12, color: W.gray500, marginTop: 2 }}>Submit a maintenance request for this asset</p>
          </div>
        </button>
      </div>
    </div>
  );
};
