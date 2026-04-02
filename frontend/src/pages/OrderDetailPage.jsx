import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersAPI, invoicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, ConfirmModal, PageLoader } from '../components/common/UIComponents';
import {
  ArrowLeft, Truck, CheckCircle, XCircle,
  FileText, Eye, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const NEXT_STATUSES = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped:    ['delivered'],
};

const STATUS_ICONS = {
  pending:    '⏳',
  confirmed:  '✅',
  processing: '⚙️',
  shipped:    '🚚',
  delivered:  '📦',
  cancelled:  '❌',
};

export default function OrderDetailPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user, isRole } = useAuth();

  const [order,        setOrder]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(false);
  const [genLoading,   setGenLoading]   = useState(false);
  const [cancelModal,  setCancelModal]  = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [tracking,     setTracking]     = useState('');
  const [error,        setError]        = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getById(id);
      setOrder(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Order not found');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    setError('');
    try {
      const res = await ordersAPI.updateStatus(id, {
        status,
        trackingNumber: tracking || undefined,
        note: `Status updated to ${status}`,
      });
      setOrder(res.data.data);
      toast.success(`Order marked as ${status}`);
      setTracking('');
    } catch (e) {
      const msg = e.response?.data?.message || 'Update failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = async () => {
    setUpdating(true);
    try {
      const res = await ordersAPI.cancel(id, { reason: cancelReason || 'Cancelled by user' });
      setOrder(res.data.data);
      toast.success('Order cancelled');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cancel failed');
    } finally {
      setUpdating(false);
      setCancelModal(false);
    }
  };

  const generateInvoice = async () => {
    setGenLoading(true);
    setError('');
    try {
      // dueDate as ISO string — 30 days from now
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await invoicesAPI.create({
        orderId: id,
        dueDate,
        notes: '',
        terms: 'Payment due within 30 days. Late payment charges apply.',
      });

      toast.success('Invoice generated successfully!');

      // Navigate to the invoice detail page
      if (res.data.data?._id) {
        navigate(`/invoices/${res.data.data._id}`);
      } else {
        navigate('/invoices');
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to generate invoice';
      setError(msg);
      toast.error(msg);
    } finally {
      setGenLoading(false);
    }
  };

  if (loading) return <PageLoader/>;
  if (!order)  return null;

  // Safe seller/buyer check — compare string versions of IDs
  const userId      = user?._id?.toString();
  const sellerIdStr = (order.seller?._id || order.seller)?.toString();
  const buyerIdStr  = (order.buyer?._id  || order.buyer)?.toString();

  const isSeller = isRole('admin') || (!!userId && userId === sellerIdStr);
  const isBuyer  = !!userId && userId === buyerIdStr;

  const nextStatuses = NEXT_STATUSES[order.status] || [];
  const hasInvoice   = !!order.invoice;
  const fmt          = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  return (
    <div className="animate-fade-in space-y-5">
      <ConfirmModal
        open={cancelModal}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This cannot be undone."
        danger
        onConfirm={cancelOrder}
        onCancel={() => setCancelModal(false)}
      />

      <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
        <ArrowLeft className="w-4 h-4"/> Back to Orders
      </button>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0"/>
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 text-xs">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-mono mb-1">{order.orderNumber}</p>
            <h1 className="text-2xl font-bold font-display text-white">Order Details</h1>
            <p className="text-sm text-slate-400 mt-1">
              Placed {order.createdAt ? format(new Date(order.createdAt), 'dd MMMM yyyy, hh:mm a') : '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <StatusBadge status={order.status}/>
            <StatusBadge status={order.paymentStatus}/>
            {hasInvoice && (
              <Link
                to={`/invoices/${typeof order.invoice === 'object' ? order.invoice._id : order.invoice}`}
                className="btn-secondary btn-sm"
              >
                <Eye className="w-4 h-4"/> View Invoice
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT: Items + Details ──────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Items */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white font-display mb-4">Order Items</h3>
            <div className="space-y-3">
              {(order.items || []).map((item, i) => (
                <div key={i}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center
                    text-brand-400 text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.productName || '—'}</p>
                    <p className="text-xs text-slate-500">
                      Batch: {item.batchNumber || '—'} · GST: {item.gstPercent || 12}%
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono text-white">
                      ₹{Number(item.unitPrice || 0).toFixed(2)} × {item.quantity}
                    </p>
                    <p className="text-xs font-mono text-brand-400">
                      ₹{Number(item.total || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-sm">
              {[
                ['Subtotal',  fmt(order.subtotal)],
                ['GST',       fmt(order.totalGst)],
                ['Shipping',  fmt(order.shippingCharge)],
                ['Discount', `-${fmt(order.totalDiscount)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-mono text-slate-300">{v}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-white pt-2 border-t border-white/5">
                <span>Grand Total</span>
                <span className="font-mono text-brand-400 text-base">{fmt(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white font-display mb-3">Shipping Address</h3>
            {order.shippingAddress?.city ? (
              <div className="text-sm text-slate-400 space-y-0.5">
                {order.shippingAddress.name   && <p className="text-white font-medium">{order.shippingAddress.name}</p>}
                {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                <p>
                  {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(', ')}
                  {order.shippingAddress.pincode ? ` - ${order.shippingAddress.pincode}` : ''}
                </p>
                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No address provided</p>
            )}
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white font-display mb-4">Order Timeline</h3>
            <div className="space-y-3">
              {(order.history || []).map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10
                    flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    {STATUS_ICONS[h.status] || '•'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white capitalize">{h.status}</p>
                    {h.note && <p className="text-xs text-slate-500 mt-0.5">{h.note}</p>}
                    <p className="text-xs text-slate-600 mt-0.5">
                      {h.timestamp ? format(new Date(h.timestamp), 'dd MMM yyyy, hh:mm a') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Actions ─────────────────────────────── */}
        <div className="space-y-4">

          {/* Parties */}
          <div className="card space-y-4">
            {[['Buyer', order.buyer], ['Seller', order.seller]].map(([role, party]) => (
              <div key={role}>
                <p className="label">{role}</p>
                <p className="text-sm font-semibold text-white">
                  {party?.company?.name || party?.name || '—'}
                </p>
                <p className="text-xs text-slate-500">{party?.email || '—'}</p>
              </div>
            ))}
            {order.trackingNumber && (
              <div>
                <p className="label">Tracking #</p>
                <p className="text-sm font-mono text-brand-400">{order.trackingNumber}</p>
              </div>
            )}
            <div>
              <p className="label">Payment Terms</p>
              <p className="text-sm text-slate-300">{order.paymentTerms || 'Net 30'}</p>
            </div>
          </div>

          {/* ── Seller: Update Status ─────────────────── */}
          {isSeller && nextStatuses.length > 0 &&
            !['delivered', 'cancelled'].includes(order.status) && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-white font-display">Update Status</h3>
              {['confirmed', 'processing'].includes(order.status) && (
                <div className="form-group">
                  <label className="label">Tracking Number (optional)</label>
                  <input
                    className="input"
                    placeholder="AWB123456"
                    value={tracking}
                    onChange={e => setTracking(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                {nextStatuses.filter(s => s !== 'cancelled').map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={updating}
                    className="btn-primary w-full justify-center capitalize"
                  >
                    {updating
                      ? <Spinner size="sm"/>
                      : <><Truck className="w-4 h-4"/> Mark as {s}</>
                    }
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Seller: Generate Invoice ──────────────── */}
          {isSeller && order.status === 'delivered' && !hasInvoice && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-white font-display">Invoice</h3>
              <p className="text-xs text-slate-500">
                Order is delivered. Generate a GST invoice for the buyer.
              </p>
              <button
                onClick={generateInvoice}
                disabled={genLoading}
                className="btn-primary w-full justify-center"
              >
                {genLoading
                  ? <><Spinner size="sm"/> Generating...</>
                  : <><FileText className="w-4 h-4"/> Generate Invoice</>
                }
              </button>
            </div>
          )}

          {/* Invoice already generated */}
          {hasInvoice && (
            <div className="card border-green-500/20 bg-green-500/5 space-y-3">
              <h3 className="text-sm font-semibold text-green-400 font-display flex items-center gap-2">
                <CheckCircle className="w-4 h-4"/> Invoice Generated
              </h3>
              <Link
                to={`/invoices/${typeof order.invoice === 'object' ? order.invoice._id : order.invoice}`}
                className="btn-secondary w-full justify-center"
              >
                <Eye className="w-4 h-4"/> View Invoice
              </Link>
            </div>
          )}

          {/* ── Buyer / Admin: Cancel ─────────────────── */}
          {(isBuyer || isRole('admin')) &&
            ['pending', 'confirmed'].includes(order.status) && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-white font-display">Cancel Order</h3>
              <textarea
                className="input text-xs"
                rows={2}
                placeholder="Reason for cancellation…"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
              <button
                onClick={() => setCancelModal(true)}
                className="btn-danger w-full justify-center"
              >
                <XCircle className="w-4 h-4"/> Cancel Order
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
