import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { translations, t } from '@/i18n/translations';
import { submitOrder } from '@/lib/api';
import { sendOrderNotification } from '@/lib/telegram';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function OrderModal({ open, onClose }: Props) {
  const { lang } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const [form, setForm] = useState({ fullName: '', phone: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Majburiy maydon';
    if (!form.phone.trim()) errs.phone = 'Majburiy maydon';
    else if (!/^\+?[\d\s-]{9,}$/.test(form.phone.trim())) errs.phone = 'Telefon raqam noto\'g\'ri';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStatus('loading');
    const orderItems = items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      name: i.name,
      price: i.price,
    }));

    // Telegram (xato bo'lsa ham davom etadi)
    try {
      await sendOrderNotification({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        note: form.note.trim(),
        totalPrice,
        items: orderItems,
      });
    } catch (e) { console.error('Telegram error:', e); }

    // Supabase (xato bo'lsa ham davom etadi)
    try {
      await submitOrder({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        note: form.note.trim(),
        totalPrice,
        items: orderItems,
      });
    } catch { /* ignore */ }

    setStatus('success');
    clearCart();
    setTimeout(() => {
      onClose();
      setStatus('idle');
      setForm({ fullName: '', phone: '', note: '' });
    }, 2500);
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg border bg-background text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
      errors[field] ? 'border-destructive' : 'border-input'
    }`;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-popover rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="font-display text-xl font-bold">{t(translations.order.title, lang)}</h2>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {status === 'success' ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="font-display text-lg font-semibold">{t(translations.order.success, lang)}</p>
              <p className="text-sm text-muted-foreground mt-2">Tez orada siz bilan bog'lanamiz</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {status === 'error' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Xatolik yuz berdi. Qayta urinib ko'ring.
                </div>
              )}

              {/* Buyurtma ro'yxati */}
              <div className="bg-secondary/40 rounded-xl p-4 space-y-2">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-foreground/80">{item.name} × {item.quantity}</span>
                    <span className="font-medium">{(item.price * item.quantity).toLocaleString()} so'm</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2 border-t text-accent">
                  <span>Jami</span>
                  <span>{totalPrice.toLocaleString()} so'm</span>
                </div>
              </div>

              <div>
                <input
                  placeholder="Ism va familya *"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className={inputClass('fullName')}
                />
                {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <input
                  placeholder="Telefon raqam * (+998 XX XXX XX XX)"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className={inputClass('phone')}
                />
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
              </div>

              <textarea
                placeholder="Izoh (ixtiyoriy)"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />

              <button
                onClick={handleSubmit}
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                {status === 'loading' ? 'Yuborilmoqda...' : 'Buyurtma berish'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
