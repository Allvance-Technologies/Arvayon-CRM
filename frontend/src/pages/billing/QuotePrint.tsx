import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function QuotePrint() {
    const { id } = useParams();
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/quotes/${id}`)
            .then(res => setQuote(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading document...</div>;
    if (!quote) return <div className="p-10 text-center text-red-500">Quote not found.</div>;

    /* ── Dynamic data ─────────────────────────────────────── */
    const project = quote.project || {};
    const client = project.client || quote.client || {};
    const items = quote.items || [];

    const subtotal = Number(quote.subtotal || 0);
    const tax = Number(quote.tax || 0);
    const discount = Number(quote.discount || 0);
    const total = Number(quote.total_amount || subtotal + tax - discount);

    const issuedDate = quote.created_at
        ? new Date(quote.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')
        : '--';
    const dueDate = quote.valid_until
        ? new Date(quote.valid_until).toLocaleDateString('en-GB').replace(/\//g, '-')
        : '--';

    const discountPct = subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0;

    return (
        <>
            <style>{`
                @media print {
                    body { margin: 0; }
                    .no-print { display: none !important; }
                    @page { size: A4; margin: 0; }
                }
                body { background: #f3f4f6; font-family: Arial, sans-serif; }
            `}</style>

            {/* Print button */}
            <div className="no-print flex justify-center mt-6 mb-2">
                <button
                    onClick={() => window.print()}
                    className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-700 transition flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print / Save as PDF
                </button>
            </div>

            {/* ── A4 Page ─────────────────────────────────────────── */}
            <div
                className="bg-white mx-auto shadow-2xl print:shadow-none"
                style={{ width: '210mm', minHeight: '297mm', padding: '12mm 14mm', boxSizing: 'border-box' }}
            >
                {/* ── Header Row ── */}
                <div className="flex justify-between items-start mb-3">
                    {/* Title + QAT info */}
                    <div>
                        <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px' }}>QUATATION</h1>
                        <table style={{ fontSize: '11px', fontWeight: 700, lineHeight: '1.8' }}>
                            <tbody>
                                <tr><td style={{ paddingRight: '12px' }}>QAT NO</td><td>: {quote.quote_number}</td></tr>
                                <tr><td>ISSUED DATE</td><td>: {issuedDate}</td></tr>
                                <tr><td>DUE DATE</td><td>: {dueDate}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Logo */}
                    <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
                        <img
                            src="/arvayon-logo.png"
                            alt="ARVAYON PRO BUILD STUDIO"
                            style={{
                                height: '130px',
                                width: 'auto',
                                display: 'block',
                                marginLeft: 'auto',
                                marginBottom: '-10px',
                                clipPath: 'inset(12% 0 12% 0)'
                            }}
                        />
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '2px solid #000', marginBottom: '10px' }} />

                {/* ── Address Row ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '16px' }}>
                    {/* Static company address */}
                    <div>
                        <p style={{ fontWeight: 800, marginBottom: '4px', fontSize: '12px' }}>ARVAYON &nbsp; PRO BUILD STUDIO</p>
                        <p>Ramanputhur junction,</p>
                        <p>Nagercoil,</p>
                        <p>Arvayonprobuildstudio@gmail.com ,</p>
                        <p>+91 9363035048</p>
                        <p>+91 9363735048.</p>
                    </div>

                    {/* Dynamic client address */}
                    <div style={{ minWidth: '200px' }}>
                        <p style={{ fontWeight: 800, marginBottom: '4px', fontSize: '12px' }}>ISSUED TO :</p>
                        <p style={{ fontWeight: 600 }}>{client.name || 'Client Name'}</p>
                        <p>{client.address || project.location || ''}</p>
                        <p>{client.phone || ''}</p>
                    </div>
                </div>

                {/* ── Line Items Table ── */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '0' }}>
                    <thead>
                        <tr style={{ background: '#d0d0d0' }}>
                            {['PRODUCT', 'QUANTITY', 'PRICE', 'AREA / Sqft', 'TOTAL'].map((h, i) => (
                                <th key={h} style={{
                                    border: '1px solid #999', padding: '8px 6px',
                                    fontWeight: 800, textAlign: i === 0 ? 'left' : 'center',
                                    fontSize: '11px', letterSpacing: '0.5px'
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, i: number) => {
                            // Check if description has a newline — first line = product name
                            const lines = (item.description || '').split('\n');
                            const productName = lines[0];
                            return (
                                <tr key={i}>
                                    <td style={{ border: '1px solid #999', padding: '10px 8px', fontWeight: 700, verticalAlign: 'top' }}>{productName}</td>
                                    <td style={{ border: '1px solid #999', padding: '10px 6px', textAlign: 'center', fontWeight: 600, verticalAlign: 'top' }}>{item.quantity}</td>
                                    <td style={{ border: '1px solid #999', padding: '10px 6px', textAlign: 'center', fontWeight: 600, verticalAlign: 'top' }}>₹{Number(item.unit_price).toFixed(2)}</td>
                                    <td style={{ border: '1px solid #999', padding: '10px 6px', textAlign: 'center', fontWeight: 600, verticalAlign: 'top' }}>{item.area_sqft || project.area || '—'}</td>
                                    <td style={{ border: '1px solid #999', padding: '10px 6px', textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            );
                        })}
                        {/* Description sub-row — only if first item has extra text */}
                        {items[0] && items[0].description?.includes('\n') && (
                            <tr>
                                <td colSpan={5} style={{ border: '1px solid #999', padding: '10px 12px', fontSize: '10px', color: '#444', textAlign: 'center', lineHeight: '1.6' }}>
                                    {items[0].description.substring(items[0].description.indexOf('\n') + 1)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* ── Payment Terms + Totals ── */}
                <div style={{ display: 'flex', gap: '0', marginTop: '0', border: '1px solid #999', borderTop: 'none' }}>
                    {/* Static payment terms */}
                    <div style={{ flex: 1, padding: '10px 10px', fontSize: '10.5px', borderRight: '1px solid #999' }}>
                        <p style={{ fontWeight: 800, marginBottom: '8px', fontSize: '11.5px' }}>Payment Terms &amp; Conditions</p>
                        <p style={{ fontWeight: 700, marginBottom: '3px' }}>1. Advance Payment</p>
                        <p style={{ marginBottom: '8px', color: '#333' }}>50% of the total project cost shall be paid as an advance before commencement of the project.</p>
                        <p style={{ fontWeight: 700, marginBottom: '3px' }}>2. Balance Payment</p>
                        <p style={{ marginBottom: '8px', color: '#333' }}>The remaining 50% shall be paid prior to final project handover / delivery.</p>
                        <p style={{ fontWeight: 700, marginBottom: '3px' }}>3. Revisions</p>
                        <p style={{ color: '#333' }}>Any revisions beyond the agreed package limit will be charged at 15% of the total project cost per revision.</p>
                    </div>

                    {/* Dynamic totals */}
                    <div style={{ width: '220px', fontSize: '11px' }}>
                        {[
                            { label: 'SUB TOTAL', value: `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                            { label: 'TAX', value: tax > 0 ? `₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '0' },
                            { label: `DISCOUNT${discountPct > 0 ? `(${discountPct}%)` : ''}`, value: discount > 0 ? `₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—' },
                            { label: 'TOTAL', value: `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, bold: true },
                        ].map((row, i) => (
                            <div key={row.label} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '9px 12px',
                                borderBottom: i < 3 ? '1px solid #ccc' : 'none',
                                fontWeight: row.bold ? 900 : 600,
                                fontSize: row.bold ? '13px' : '11px'
                            }}>
                                <span>{row.label}</span>
                                <span>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── NOTE ── */}
                <p style={{ fontWeight: 800, fontSize: '11px', marginTop: '10px' }}>NOTE : UNLIMITED REVISION</p>

                {/* ── Bank + Signature ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                    {/* Static bank details */}
                    <div style={{ fontSize: '11px', fontWeight: 700, lineHeight: '1.9' }}>
                        <p><strong>AC NO :</strong> 093901000320462</p>
                        <p><strong>IFSC &nbsp;&nbsp;&nbsp;&nbsp;:</strong> IOB0000939</p>
                        <p><strong>Name &nbsp;:</strong> Abishek Raja</p>
                    </div>

                    {/* Static signature block */}
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '32px' }}>For Arvayon Probuild Studio</p>
                        {/* Signature placeholder line */}
                        <div style={{ borderBottom: '1.5px solid #555', width: '130px', marginBottom: '4px' }}></div>
                        <p style={{ fontSize: '10px', fontWeight: 600, color: '#444', letterSpacing: '1px' }}>proprietor</p>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{ marginTop: '24px', borderTop: '1.5px solid #ccc', paddingTop: '10px', textAlign: 'center', fontSize: '9.5px', fontWeight: 600, color: '#555' }}>
                    <p>Ramanputhur Junction , Nagercoil</p>
                    <p style={{ marginTop: '2px' }}>+91 9363035048, +91 9363735048 &nbsp;|&nbsp; arvayonprobuiidstudio@gmail.com &nbsp;|&nbsp; www.arvayonpbs.com</p>
                </div>
            </div>

            <div className="no-print mb-16" />
        </>
    );
}
