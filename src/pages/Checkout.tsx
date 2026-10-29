import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAppContext } from '../store/AppContext';
import { useT } from '../i18n/useT';
import { SalesHistoryItem } from '../store/types';

export default function Checkout() {
  const navigate = useNavigate();
  const { 
    settings, cart, clearCart, addSale, updateProduct, 
    customers, addCustomer, updateCustomer, 
    activeStaff, updateActiveStaff, sales,
    billingStartTime, billingPayScreenTime, setBillingPayScreenTime
  } = useAppContext();
  const { t } = useT();

  // Wizard state
  const [step, setStep] = useState<'details' | 'payment' | 'receipt'>('details');

  // Details state
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(activeStaff || (settings.staffMembers && settings.staffMembers[0]) || '');

  // Payment state
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  // Receipt state
  const [completedSale, setCompletedSale] = useState<SalesHistoryItem | null>(null);
  const [receiptCustomerDue, setReceiptCustomerDue] = useState<number>(0);

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const pendingBillNumber = `INV-${1000 + sales.length + 1}`;

  // Auto-fill customer name if phone matches
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const existing = customers.find(c => c.phone === customerPhone);
      if (existing) {
        setCustomerName(existing.name);
      }
    }
  }, [customerPhone, customers]);

  // TODO(L10N): Currency formatting (₹) and UPI payment method are currently India-specific. Make configurable for other markets.
  // Generate QR for Payment step
  useEffect(() => {
    if (cartTotal === 0 && step !== 'receipt') {
      navigate('/billing');
      return;
    }

    if (step === 'payment' && settings.upiId) {
      const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.shopName)}&am=${cartTotal.toFixed(2)}&tn=Bill%20${pendingBillNumber}&cu=INR`;
      QRCode.toDataURL(upiLink, { width: 300, margin: 2, color: { dark: '#091426', light: '#ffffff' }})
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Failed to generate QR code', err));
    }
  }, [step, cartTotal, settings.upiId, settings.shopName, navigate, pendingBillNumber]);

  const handleNextToPayment = () => {
    if (selectedStaff) updateActiveStaff(selectedStaff);
    if (settings.benchmarkMode) {
      setBillingPayScreenTime(Date.now());
    }
    setStep('payment');
  };

  const handleMarkAsPaid = async (method: 'UPI' | 'Cash' | 'Credit') => {
    // Generate Bill Number
    const billNumber = pendingBillNumber;

    let finalCustomerId = undefined;
    const finalCustomerName = customerName.trim() || t('checkout.walk_in_customer');
    const finalCustomerPhone = customerPhone.trim();
    let newOutstandingBalance = 0;

    // Link or create customer
    if (finalCustomerPhone) {
      const existing = customers.find(c => c.phone === finalCustomerPhone);
      if (existing) {
        finalCustomerId = existing.id;
        const updatedBalance = method === 'Credit' ? existing.outstandingBalance + cartTotal : existing.outstandingBalance;
        newOutstandingBalance = updatedBalance;
        await updateCustomer({ ...existing, outstandingBalance: updatedBalance, lastTransactionDate: new Date().toISOString() });
      } else if (customerName.trim()) {
        const updatedBalance = method === 'Credit' ? cartTotal : 0;
        newOutstandingBalance = updatedBalance;
        const newCust = {
          id: Date.now().toString(),
          name: finalCustomerName,
          phone: finalCustomerPhone,
          outstandingBalance: updatedBalance,
          lastTransactionDate: new Date().toISOString()
        };
        await addCustomer(newCust);
        finalCustomerId = newCust.id;
      }
    }

    setReceiptCustomerDue(newOutstandingBalance);

    const savedTime = Date.now();
    const durationMs = billingStartTime ? savedTime - billingStartTime : undefined;
    
    let itemCount: number | undefined = undefined;
    let msFirstTapToPayScreen: number | undefined = undefined;
    let msFirstTapToSaved: number | undefined = undefined;

    if (settings.benchmarkMode && billingStartTime) {
      itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      msFirstTapToSaved = savedTime - billingStartTime;
      if (billingPayScreenTime) {
        msFirstTapToPayScreen = billingPayScreenTime - billingStartTime;
      }
    }

    const sale: SalesHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      total: cartTotal,
      items: [...cart],
      paymentMethod: method,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      staffName: selectedStaff,
      billNumber,
      billingDurationMs: durationMs,
      itemCount,
      msFirstTapToPayScreen,
      msFirstTapToSaved
    };

    // 1. Decrement stock
    for (const item of cart) {
      await updateProduct({ ...item.product, stock: Math.max(0, item.product.stock - item.quantity) });
    }

    // 2. Save Sale
    await addSale(sale);
    setCompletedSale(sale);

    // 3. Clear cart and move to receipt
    clearCart();
    setStep('receipt');
  };

  const printReceipt = () => {
    window.print();
  };

  const smsReceipt = () => {
    if (!completedSale?.customerPhone) {
      alert(t('checkout.alert_no_phone'));
      return;
    }
    const msg = t('checkout.sms_message', { shopName: settings.shopName, billNumber: completedSale.billNumber || '', total: completedSale.total });
    window.open(`sms:${completedSale.customerPhone}?body=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-secondary-container">
      
      {/* HIDE NAV IN PRINT */}
      <header className="no-print sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm flex items-center px-screen-margin-mobile py-space-sm h-16 gap-3">
        {step !== 'receipt' ? (
          <button onClick={() => step === 'payment' ? setStep('details') : navigate(-1)} className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary active:scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <div className="w-10 h-10"></div>
        )}
        <h1 className="text-headline-md font-headline-md text-primary">
          {step === 'details' && t('checkout.order_details')}
          {step === 'payment' && t('checkout.payment')}
          {step === 'receipt' && t('checkout.receipt')}
        </h1>
      </header>

      <main className="flex-1 p-screen-margin-mobile flex flex-col items-center">
        
        {/* STEP 1: DETAILS */}
        {step === 'details' && (
          <div className="w-full flex flex-col gap-space-md mt-4 max-w-md">
            <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant shadow-sm">
              <h2 className="text-label-lg text-primary mb-3">{t('checkout.customer_info')}</h2>
              
              <label className="block text-label-sm text-on-surface-variant mb-1">{t('checkout.phone_number')}</label>
              <input 
                type="tel" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder={t('checkout.phone_placeholder')}
                className="w-full p-3 mb-4 border border-outline-variant rounded-lg bg-surface-container-low text-primary focus:border-secondary-container outline-none"
              />

              <label className="block text-label-sm text-on-surface-variant mb-1">{t('checkout.customer_name')}</label>
              <input 
                type="text" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder={t('checkout.customer_name_placeholder')}
                className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary focus:border-secondary-container outline-none"
              />
            </div>

            <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant shadow-sm">
              <h2 className="text-label-lg text-primary mb-3">{t('checkout.staff_member')}</h2>
              
              {settings.staffMembers && settings.staffMembers.length > 0 ? (
                <select 
                  value={selectedStaff} 
                  onChange={e => setSelectedStaff(e.target.value)}
                  className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary outline-none"
                >
                  <option value="">{t('checkout.select_staff')}</option>
                  {settings.staffMembers.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <p className="text-body-sm text-error">{t('checkout.no_staff_notice')}</p>
              )}
            </div>

            <button 
              onClick={handleNextToPayment}
              className="mt-4 w-full h-14 bg-secondary-container text-on-secondary-fixed font-label-lg rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              {t('checkout.next_payment')}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* STEP 2: PAYMENT */}
        {step === 'payment' && (
          <div className="w-full flex flex-col h-full items-center max-w-md mt-4">
            <div className="w-full bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant flex flex-col items-center mb-space-lg">
              <h2 className="text-label-lg text-on-surface-variant mb-1">{t('checkout.total_amount')}</h2>
              <span className="text-display-currency text-primary font-extrabold mb-space-md tracking-tight">₹{cartTotal}</span>
              
              {settings.upiId ? (
                <div className="flex flex-col items-center mb-space-sm">
                  <div className="bg-white p-2 rounded-xl border-2 border-primary shadow-sm mb-2">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt={t('checkout.qr_code_alt')} className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 bg-surface-container-low animate-pulse rounded-lg"></div>
                    )}
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono tracking-wider">{settings.upiId}</span>
                </div>
              ) : (
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant text-center mb-space-sm">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">qr_code_scanner</span>
                  <p className="text-body-sm text-on-surface-variant">{t('checkout.no_upi_notice')}</p>
                </div>
              )}
              
              <p className="text-label-sm text-on-surface-variant">{t('checkout.scan_to_pay', { shopName: settings.shopName })}</p>
            </div>

            <div className="w-full flex flex-col gap-2 mt-auto">
              {(!customerPhone.trim() || !customerName.trim()) && (
                <p className="text-error text-center text-label-sm">{t('checkout.credit_requirement')}</p>
              )}
              <div className="w-full flex gap-space-sm">
                <button 
                  onClick={() => handleMarkAsPaid('Cash')}
                  className="flex-1 h-14 bg-surface-container-highest text-primary font-label-lg rounded-xl flex items-center justify-center gap-2 active:scale-95 border border-outline-variant shadow-sm"
                >
                  <span className="material-symbols-outlined">payments</span>
                  {t('checkout.pay_cash')}
                </button>
                
                <button 
                  disabled={!settings.upiId}
                  onClick={() => handleMarkAsPaid('UPI')}
                  className={`flex-1 h-14 font-label-lg rounded-xl flex flex-col items-center justify-center shadow-md border ${!settings.upiId ? 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed border-outline-variant' : 'bg-primary text-on-primary active:scale-95 border-primary flex-row gap-2'}`}
                >
                  {settings.upiId ? (
                    <>
                      <span className="material-symbols-outlined">check_circle</span>
                      {t('checkout.pay_upi')}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">block</span>
                        <span>{t('checkout.pay_upi')}</span>
                      </div>
                      <span className="text-[9px] font-normal tracking-tight">{t('checkout.add_id_settings')}</span>
                    </>
                  )}
                </button>
              </div>
              <button 
                disabled={!customerPhone.trim() || !customerName.trim()}
                onClick={() => handleMarkAsPaid('Credit')}
                className={`w-full h-14 font-label-lg rounded-xl flex items-center justify-center gap-2 border shadow-sm ${(!customerPhone.trim() || !customerName.trim()) ? 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed' : 'bg-tertiary-container text-on-tertiary-container active:scale-95'}`}
              >
                <span className="material-symbols-outlined">menu_book</span>
                {t('checkout.pay_credit')}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: RECEIPT */}
        {step === 'receipt' && completedSale && (
          <div className="w-full flex flex-col items-center max-w-md w-full pb-8">
            
            {/* PRINTABLE AREA */}
            <div id="printable-receipt" className="w-full bg-white text-black p-6 rounded-xl shadow-md border border-gray-200 text-sm font-mono mb-6">
              <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
                {settings.logo && (
                  <img src={settings.logo} alt={settings.shopName} className="w-16 h-16 object-contain mx-auto mb-2" />
                )}
                <h2 className="text-xl font-bold uppercase">{settings.shopName}</h2>
                {settings.address && <p className="whitespace-pre-line mt-1">{settings.address}</p>}
                {settings.phone && <p>Ph: {settings.phone}</p>}
              </div>

              <div className="flex justify-between mb-1">
                <span>{t('checkout.receipt_bill_no')}</span>
                <span className="font-bold">{completedSale.billNumber}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>{t('checkout.receipt_date')}</span>
                <span>{new Date(completedSale.timestamp).toLocaleString()}</span>
              </div>
              {completedSale.staffName && (
                <div className="flex justify-between mb-1">
                  <span>{t('checkout.receipt_cashier')}</span>
                  <span>{completedSale.staffName}</span>
                </div>
              )}
              <div className="flex justify-between mb-4 border-b border-dashed border-gray-400 pb-4">
                <span>{t('checkout.receipt_customer')}</span>
                <span className="text-right">
                  {completedSale.customerName}<br/>
                  {completedSale.customerPhone}
                </span>
              </div>

              <div className="w-full mb-2 flex font-bold border-b border-dashed border-gray-400 pb-2">
                <span className="flex-1">{t('checkout.receipt_item')}</span>
                <span className="w-12 text-center">{t('checkout.receipt_qty')}</span>
                <span className="w-20 text-right">{t('checkout.receipt_total')}</span>
              </div>
              
              {completedSale.items.map((item, idx) => (
                <div key={idx} className="w-full flex mb-2">
                  <span className="flex-1 pr-2 truncate">{t(item.product.name)}</span>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <span className="w-20 text-right">{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              <div className="border-t border-dashed border-gray-400 mt-4 pt-4 flex justify-between items-center text-base font-bold">
                <span>{t('checkout.receipt_grand_total')}</span>
                <span>Rs. {completedSale.total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mt-2">
                <span>{t('checkout.receipt_pay_mode')}</span>
                <span>{completedSale.paymentMethod}</span>
              </div>

              {completedSale.paymentMethod === 'Credit' && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-400 font-bold text-center">
                  <p>{t('checkout.receipt_added_credit', { amount: completedSale.total.toFixed(2) })}</p>
                  <p>{t('checkout.receipt_total_due', { amount: receiptCustomerDue.toFixed(2) })}</p>
                </div>
              )}

              <div className="text-center border-t border-dashed border-gray-400 mt-6 pt-4 text-xs">
                <p>{t('checkout.receipt_thank_you')}</p>
              </div>
            </div>
            
            {/* NO PRINT AREA */}
            <div className="no-print w-full flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={printReceipt}
                  className="flex-1 h-12 bg-surface-container-high text-primary font-bold rounded-xl flex items-center justify-center gap-2 border border-outline-variant"
                >
                  <span className="material-symbols-outlined">print</span>
                  {t('checkout.print')}
                </button>
                <button 
                  onClick={smsReceipt}
                  className="flex-1 h-12 bg-surface-container-high text-primary font-bold rounded-xl flex items-center justify-center gap-2 border border-outline-variant"
                >
                  <span className="material-symbols-outlined">sms</span>
                  {t('checkout.send_sms')}
                </button>
              </div>
              
              <button 
                onClick={() => navigate('/billing')}
                className="w-full h-14 bg-secondary-container text-on-secondary-fixed font-bold rounded-xl flex items-center justify-center mt-2 shadow-sm"
              >
                {t('checkout.done_new_sale')}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
