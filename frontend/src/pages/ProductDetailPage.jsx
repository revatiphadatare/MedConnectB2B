import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, ordersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PageLoader } from '../components/common/UIComponents';
import { Package, ArrowLeft, ShoppingCart, AlertTriangle, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

export default function ProductDetailPage() {
  const { id }   = useParams();
  const { user, isRole } = useAuth();
  const navigate = useNavigate();

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [qty,      setQty]      = useState(0); // start 0, set after product loads
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    productsAPI.getById(id)
      .then(r => {
        const p = r.data.data;
        setProduct(p);
        // Set initial qty to minOrderQty so user never has to worry about minimum
        setQty(p.minOrderQty || 1);
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleQtyChange = (val) => {
    const num = Number(val);
    if (isNaN(num) || num < 0) return;
    setQty(num);
  };

  const increaseQty = () => setQty(q => q + (product?.minOrderQty || 1));
  const decreaseQty = () => setQty(q => Math.max(product?.minOrderQty || 1, q - (product?.minOrderQty || 1)));

  const handleOrder = async () => {
    if (!product) return;

    // Validate minimum order qty
    if (qty < product.minOrderQty) {
      toast.error(`Minimum order quantity is ${product.minOrderQty} units`);
      setQty(product.minOrderQty);
      return;
    }

    if (qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setOrdering(true);
    try {
      const res = await ordersAPI.create({
        sellerId: product.manufacturer._id,
        items: [{
          product:  product._id,
          quantity: qty,
        }],
        shippingAddress: {
          name:    user?.company?.name    || user?.name    || '',
          street:  user?.company?.address?.street  || '',
          city:    user?.company?.address?.city    || '',
          state:   user?.company?.address?.state   || '',
          pincode: user?.company?.address?.pincode || '',
          phone:   user?.company?.phone   || '',
        },
        paymentTerms: 'Net 30',
      });
      toast.success('Order placed successfully!');
      navigate(`/orders/${res.data.data._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Order failed. Please try again.';
      toast.error(msg);
    } finally {
      setOrdering(false);
    }
  };

  if (loading)   return <PageLoader/>;
  if (!product)  return (
    <div className="text-center py-20">
      <p className="text-slate-400">Product not found</p>
      <button onClick={() => navigate(-1)} className="btn-secondary btn-sm mt-4">Go Back</button>
    </div>
  );

  const ptr        = Number(product.pricing?.ptr)        || 0;
  const gstPct     = Number(product.pricing?.gstPercent) || 12;
  const subtotal   = ptr * qty;
  const gstAmount  = (subtotal * gstPct) / 100;
  const total      = subtotal + gstAmount;

  const canOrder   = isRole('pharmacy', 'hospital', 'distributor') && user?.isApproved;
  const qtyOk      = qty >= product.minOrderQty;

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
        <ArrowLeft className="w-4 h-4"/> Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Product Info ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-start gap-5">
              <div className="w-24 h-24 rounded-2xl bg-brand-500/10 border border-brand-500/20
                flex items-center justify-center flex-shrink-0">
                <Package className="w-10 h-10 text-brand-400"/>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold font-display text-white">{product.name}</h1>
                    <p className="text-slate-400 mt-1">{product.genericName}</p>
                  </div>
                  <StatusBadge status={product.status}/>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.category        && <span className="badge-blue capitalize">{product.category}</span>}
                  {product.strength        && <span className="badge-teal">{product.strength}</span>}
                  {product.packSize        && <span className="badge-gray">{product.packSize}</span>}
                  {product.schedule        && <span className="badge-gray">Schedule {product.schedule}</span>}
                  {product.requiresPrescription && <span className="badge-yellow">Rx Required</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-white font-display">Product Details</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {[
                ['Brand',         product.brand],
                ['SKU',           product.sku           || '—'],
                ['Batch No.',     product.batchNumber   || '—'],
                ['Manufacturer',  product.manufacturer?.company?.name || product.manufacturer?.name || '—'],
                ['GST',           `${gstPct}%`],
                ['Min. Order Qty',`${product.minOrderQty} units`],
                ['Available Stock', product.stock],
                ['HSN Code',      product.hsn           || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-slate-500 text-xs">{k}</p>
                  <p className="text-slate-200 font-medium mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {product.description && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-300 leading-relaxed">{product.description}</p>
              </div>
            )}
            {product.storageConditions && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Storage Conditions</p>
                <p className="text-sm text-slate-300">{product.storageConditions}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Order Panel ──────────────────────────────── */}
        <div>
          <div className="card sticky top-4 space-y-4">
            <h3 className="text-sm font-semibold text-white font-display">Pricing</h3>

            <div className="space-y-2 text-sm">
              {[
                ['MRP',              `₹${product.pricing?.mrp || 0}`],
                ['PTR (Your Price)', `₹${ptr}`],
                ['PTS',              `₹${product.pricing?.pts || 0}`],
                ['GST',              `${gstPct}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 font-mono font-medium">{v}</span>
                </div>
              ))}
            </div>

            {/* Order section for buyers */}
            {canOrder ? (
              <div className="space-y-4 pt-2 border-t border-white/5">

                {/* Quantity input with +/- buttons */}
                <div className="form-group">
                  <label className="label">
                    Quantity
                    <span className="ml-1 text-slate-500 normal-case font-normal">
                      (min {product.minOrderQty} units)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button onClick={decreaseQty}
                      className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center
                        text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0">
                      <Minus className="w-4 h-4"/>
                    </button>
                    <input
                      type="number"
                      className="input text-center font-mono font-bold text-white"
                      value={qty}
                      min={product.minOrderQty}
                      onChange={e => handleQtyChange(e.target.value)}
                      onBlur={() => {
                        // On blur, snap to minOrderQty if below
                        if (qty < product.minOrderQty) {
                          setQty(product.minOrderQty);
                          toast('Quantity set to minimum order quantity', { icon: 'ℹ️' });
                        }
                      }}
                    />
                    <button onClick={increaseQty}
                      className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center
                        text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0">
                      <Plus className="w-4 h-4"/>
                    </button>
                  </div>

                  {/* Qty validation feedback */}
                  {qty > 0 && !qtyOk && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3"/>
                      Minimum is {product.minOrderQty} units
                    </p>
                  )}
                </div>

                {/* Order total breakdown */}
                {qty > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GST ({gstPct}%)</span>
                      <span className="font-mono">₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white pt-1.5 border-t border-white/10">
                      <span>Total</span>
                      <span className="font-mono text-brand-400">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Stock warning */}
                {product.stock > 0 && product.stock < qty && (
                  <div className="flex items-center gap-2 text-xs text-yellow-400 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0"/>
                    Only {product.stock} units in stock. Seller may contact you about availability.
                  </div>
                )}

                <button
                  onClick={handleOrder}
                  disabled={ordering || !qtyOk || qty <= 0}
                  className="btn-primary w-full justify-center btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ordering
                    ? <><Spinner size="sm"/> Placing Order...</>
                    : <><ShoppingCart className="w-4 h-4"/> Place Order</>
                  }
                </button>

                <p className="text-xs text-slate-600 text-center">
                  Payment terms: Net 30 days
                </p>
              </div>
            ) : !user?.isApproved && user?.role !== 'admin' ? (
              <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
                ⏳ Your account is pending approval. Contact admin to activate ordering.
              </div>
            ) : isRole('manufacturer') ? (
              <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 text-center">
                Manufacturers cannot place orders. Switch to a buyer account.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
