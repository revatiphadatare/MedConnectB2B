import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoicesAPI } from '../utils/api';
import { PageLoader, StatusBadge } from '../components/common/UIComponents';
import {
  ArrowLeft, Download, Printer, CheckCircle,
  FileText, Building2, Phone, Mail, MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── Print / PDF styles injected into document ─────────────
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #invoice-print-area,
  #invoice-print-area * { visibility: visible !important; }
  #invoice-print-area {
    position: fixed !important;
    top: 0 !important; left: 0 !important;
    width: 100% !important; height: auto !important;
    background: white !important;
    color: black !important;
    font-family: Arial, sans-serif !important;
    font-size: 12px !important;
    padding: 20mm !important;
    z-index: 99999 !important;
  }
  #invoice-print-area .no-print { display: none !important; }
  @page { margin: 10mm; size: A4; }
}
`;

export default function InvoiceDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [invoice,   setInvoice]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [showPay,   setShowPay]   = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    // Inject print styles once
    const styleEl = document.createElement('style');
    styleEl.id    = 'invoice-print-style';
    styleEl.innerHTML = PRINT_STYLE;
    if (!document.getElementById('invoice-print-style')) {
      document.head.appendChild(styleEl);
    }
    return () => {
      const el = document.getElementById('invoice-print-style');
      if (el) el.remove();
    };
  }, []);

  useEffect(() => {
    invoicesAPI.getById(id)
      .then(r => setInvoice(r.data.data))
      .catch(() => { toast.error('Invoice not found'); navigate('/invoices'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    // Use browser's native print-to-PDF
    window.print();
    toast.success('Use "Save as PDF" in the print dialog to download');
  };

  const handlePayment = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return; }
    if (amt > invoice.amountDue) { toast.error(`Amount exceeds due: ${fmt(invoice.amountDue)}`); return; }
    setPaying(true);
    try {
      const r = await invoicesAPI.updatePayment(id, { amountPaid: amt });
      setInvoice(r.data.data);
      setPayAmount('');
      setShowPay(false);
      toast.success('Payment recorded!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Payment failed');
    } finally { setPaying(false); }
  };

  if (loading) return <PageLoader/>;
  if (!invoice) return null;

  const seller = invoice.seller;
  const buyer  = invoice.buyer;

  return (
    <div className="animate-fade-in space-y-4">

      {/* Top action bar — hidden in print */}
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4"/> Back
        </button>
        <div className="flex gap-2">
          {invoice.amountDue > 0 && (
            <button onClick={() => setShowPay(p => !p)} className="btn-secondary btn-sm">
              <CheckCircle className="w-4 h-4"/> Record Payment
            </button>
          )}
          <button onClick={handlePrint} className="btn-secondary btn-sm">
            <Printer className="w-4 h-4"/> Print
          </button>
          <button onClick={handleDownloadPDF} className="btn-primary btn-sm">
            <Download className="w-4 h-4"/> Download PDF
          </button>
        </div>
      </div>

      {/* Payment recording panel — hidden in print */}
      {showPay && (
        <div className="no-print card border-green-500/20 bg-green-500/5">
          <h3 className="text-sm font-semibold text-white font-display mb-3">Record Payment Received</h3>
          <div className="flex gap-3 items-end">
            <div className="form-group flex-1">
              <label className="label">Amount Received ₹</label>
              <input
                type="number" min="0.01" step="0.01"
                className="input"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder={`Max: ${fmt(invoice.amountDue)}`}
              />
            </div>
            <button onClick={handlePayment} disabled={paying} className="btn-primary">
              {paying ? <Spinner size="sm"/> : 'Record'}
            </button>
            <button onClick={() => setShowPay(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* ── INVOICE DOCUMENT ────────────────────────────── */}
      <div
        id="invoice-print-area"
        ref={printRef}
        className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header strip */}
        <div style={{ background: '#0f4c5c', padding: '24px 32px' }}
          className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <div style={{
                width:'36px', height:'36px', background:'#1e9daa',
                borderRadius:'8px', display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0
              }}>
                <FileText style={{ color:'white', width:'18px', height:'18px' }}/>
              </div>
              <span style={{ color:'white', fontSize:'22px', fontWeight:'800', letterSpacing:'-0.5px' }}>
                MedChain
              </span>
            </div>
            <p style={{ color:'#94a3b8', fontSize:'11px', marginTop:'2px' }}>
              B2B Pharmaceutical Platform
            </p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ color:'white', fontSize:'28px', fontWeight:'800', letterSpacing:'-1px' }}>
              INVOICE
            </p>
            <p style={{ color:'#1e9daa', fontFamily:'monospace', fontSize:'13px', fontWeight:'700' }}>
              {invoice.invoiceNumber}
            </p>
            <div style={{ marginTop:'8px' }}>
              <StatusBadge status={invoice.paymentStatus}/>
            </div>
          </div>
        </div>

        {/* Dates row */}
        <div style={{
          background:'#f8fafc', borderBottom:'1px solid #e2e8f0',
          padding:'12px 32px', display:'flex', gap:'32px', flexWrap:'wrap'
        }}>
          {[
            ['Issue Date', invoice.issueDate ? format(new Date(invoice.issueDate), 'dd MMM yyyy') : format(new Date(invoice.createdAt), 'dd MMM yyyy')],
            ['Due Date',   invoice.dueDate   ? format(new Date(invoice.dueDate),   'dd MMM yyyy') : '30 days from issue'],
            ['Order #',    invoice.order?.orderNumber || '—'],
            ['PO / Ref',   invoice.order?.orderNumber || '—'],
          ].map(([l, v]) => (
            <div key={l}>
              <p style={{ fontSize:'10px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px' }}>{l}</p>
              <p style={{ fontSize:'12px', fontWeight:'600', color:'#1e293b', marginTop:'2px' }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Seller / Buyer addresses */}
        <div style={{
          padding:'24px 32px', display:'grid',
          gridTemplateColumns:'1fr 1fr', gap:'24px',
          borderBottom:'1px solid #e2e8f0'
        }}>
          {[['From (Seller)', seller], ['To (Buyer)', buyer]].map(([label, party]) => (
            <div key={label}>
              <p style={{
                fontSize:'10px', color:'#94a3b8',
                textTransform:'uppercase', letterSpacing:'0.5px',
                marginBottom:'8px', fontWeight:'700'
              }}>{label}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <p style={{ fontSize:'15px', fontWeight:'700', color:'#1e293b' }}>
                  {party?.company?.name || party?.name || '—'}
                </p>
                {party?.company?.gstNumber && (
                  <p style={{ fontSize:'11px', color:'#64748b' }}>
                    GSTIN: {party.company.gstNumber}
                  </p>
                )}
                {party?.company?.drugLicense && (
                  <p style={{ fontSize:'11px', color:'#64748b' }}>
                    Drug Lic: {party.company.drugLicense}
                  </p>
                )}
                {party?.company?.address && (
                  <p style={{ fontSize:'11px', color:'#64748b', display:'flex', gap:'4px' }}>
                    {[party.company.address.street, party.company.address.city,
                      party.company.address.state, party.company.address.pincode
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
                {party?.company?.phone && (
                  <p style={{ fontSize:'11px', color:'#64748b' }}>Ph: {party.company.phone}</p>
                )}
                {party?.email && (
                  <p style={{ fontSize:'11px', color:'#64748b' }}>{party.email}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Items table */}
        <div style={{ padding:'24px 32px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
            <thead>
              <tr style={{ background:'#0f4c5c' }}>
                {['#','Description','HSN','Qty','Unit','Rate','Disc','GST%','CGST','SGST','Amount'].map(h => (
                  <th key={h} style={{
                    padding:'8px 10px', color:'white', fontWeight:'700',
                    textAlign: h === '#' ? 'center' : ['Qty','Rate','Disc','GST%','CGST','SGST','Amount'].includes(h) ? 'right' : 'left',
                    fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.3px'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding:'8px 10px', textAlign:'center', color:'#64748b' }}>{i + 1}</td>
                  <td style={{ padding:'8px 10px', fontWeight:'600', color:'#1e293b' }}>
                    {item.description}
                    {item.batchNumber && (
                      <span style={{ display:'block', fontSize:'10px', color:'#94a3b8', fontWeight:'400' }}>
                        Batch: {item.batchNumber}
                      </span>
                    )}
                  </td>
                  <td style={{ padding:'8px 10px', color:'#64748b', fontSize:'11px' }}>{item.hsn || '—'}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:'600' }}>{item.quantity}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', color:'#64748b' }}>{item.unit || 'Nos'}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'monospace' }}>₹{Number(item.rate || 0).toFixed(2)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', color:'#ef4444', fontFamily:'monospace' }}>
                    {item.discount > 0 ? `-₹${Number(item.discount).toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right', color:'#64748b' }}>{item.gstPercent}%</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'monospace', color:'#64748b' }}>₹{Number(item.cgst || 0).toFixed(2)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'monospace', color:'#64748b' }}>₹{Number(item.sgst || 0).toFixed(2)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'monospace', fontWeight:'700', color:'#1e293b' }}>₹{Number(item.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{
          padding:'0 32px 24px',
          display:'flex', justifyContent:'flex-end'
        }}>
          <div style={{
            width:'320px', background:'#f8fafc',
            border:'1px solid #e2e8f0', borderRadius:'12px',
            overflow:'hidden'
          }}>
            {[
              ['Subtotal',       fmt(invoice.subtotal),   '#1e293b', false],
              ['CGST',           fmt(invoice.totalCgst),  '#64748b', false],
              ['SGST',           fmt(invoice.totalSgst),  '#64748b', false],
              invoice.discount > 0
                ? ['Discount',   `-${fmt(invoice.discount)}`, '#ef4444', false]
                : null,
            ].filter(Boolean).map(([l, v, color, bold]) => (
              <div key={l} style={{
                display:'flex', justifyContent:'space-between',
                padding:'8px 16px', borderBottom:'1px solid #e2e8f0'
              }}>
                <span style={{ fontSize:'12px', color:'#64748b' }}>{l}</span>
                <span style={{ fontSize:'12px', fontFamily:'monospace', color, fontWeight: bold ? '700' : '400' }}>{v}</span>
              </div>
            ))}
            <div style={{
              display:'flex', justifyContent:'space-between',
              padding:'12px 16px', background:'#0f4c5c'
            }}>
              <span style={{ fontSize:'13px', color:'white', fontWeight:'700' }}>Grand Total</span>
              <span style={{ fontSize:'15px', fontFamily:'monospace', color:'#1e9daa', fontWeight:'800' }}>
                {fmt(invoice.grandTotal)}
              </span>
            </div>
            {invoice.amountPaid > 0 && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 16px', borderBottom:'1px solid #e2e8f0' }}>
                  <span style={{ fontSize:'12px', color:'#64748b' }}>Amount Paid</span>
                  <span style={{ fontSize:'12px', fontFamily:'monospace', color:'#22c55e', fontWeight:'600' }}>{fmt(invoice.amountPaid)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 16px' }}>
                  <span style={{ fontSize:'12px', color:'#64748b' }}>Balance Due</span>
                  <span style={{ fontSize:'12px', fontFamily:'monospace', color: invoice.amountDue > 0 ? '#ef4444' : '#22c55e', fontWeight:'700' }}>
                    {fmt(invoice.amountDue)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Amount in words */}
        <div style={{ padding:'0 32px 16px' }}>
          <p style={{ fontSize:'11px', color:'#64748b' }}>
            <strong>Amount in words:</strong> {amountInWords(invoice.grandTotal)}
          </p>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div style={{
            padding:'16px 32px', background:'#f8fafc',
            borderTop:'1px solid #e2e8f0', display:'grid',
            gridTemplateColumns: invoice.notes && invoice.terms ? '1fr 1fr' : '1fr',
            gap:'16px'
          }}>
            {invoice.notes && (
              <div>
                <p style={{ fontSize:'10px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:'700', marginBottom:'4px' }}>Notes</p>
                <p style={{ fontSize:'11px', color:'#475569', lineHeight:'1.5' }}>{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p style={{ fontSize:'10px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:'700', marginBottom:'4px' }}>Terms & Conditions</p>
                <p style={{ fontSize:'11px', color:'#475569', lineHeight:'1.5' }}>{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding:'16px 32px', background:'#0f4c5c',
          display:'flex', justifyContent:'space-between',
          alignItems:'center', flexWrap:'wrap', gap:'8px'
        }}>
          <p style={{ fontSize:'11px', color:'#94a3b8' }}>
            Generated by MedChain · medchain-pharma.web.app
          </p>
          <p style={{ fontSize:'11px', color:'#94a3b8' }}>
            This is a computer generated invoice. No signature required.
          </p>
        </div>
      </div>

    </div>
  );
}

// ── Convert number to Indian words ─────────────────────────
function amountInWords(amount) {
  if (!amount) return 'Zero Rupees Only';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  const numToWords = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n/10)] + ' ' + ones[n%10] + ' ';
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred ' + numToWords(n%100);
    if (n < 100000) return numToWords(Math.floor(n/1000)) + 'Thousand ' + numToWords(n%1000);
    if (n < 10000000) return numToWords(Math.floor(n/100000)) + 'Lakh ' + numToWords(n%100000);
    return numToWords(Math.floor(n/10000000)) + 'Crore ' + numToWords(n%10000000);
  };

  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);
  let words    = numToWords(rupees).trim();
  if (paise > 0) words += ` and ${numToWords(paise).trim()} Paise`;
  return words + ' Only';
}
