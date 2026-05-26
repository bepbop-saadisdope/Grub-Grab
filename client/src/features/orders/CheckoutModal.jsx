import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useCartStore } from '../cart/cartStore.js';
import { formatPrice } from '../cart/formatPrice.js';
import { placeOrder } from './ordersApi.js';
import {
  PHONE_ERROR,
  PHONE_MAX_LENGTH,
  PHONE_PLACEHOLDER,
  isValidPakistaniPhone,
} from '../../api/validatePhone.js';

const initialForm = { fullName: '', phoneNumber: '', deliveryAddress: '' };
const initialErrors = { fullName: '', phoneNumber: '', deliveryAddress: '' };

const validate = ({ fullName, phoneNumber, deliveryAddress }) => {
  const errs = { fullName: '', phoneNumber: '', deliveryAddress: '' };
  const name = fullName.trim();
  if (name.length < 2 || name.length > 100) {
    errs.fullName = 'Please enter your name (2–100 characters).';
  }
  if (!isValidPakistaniPhone(phoneNumber)) {
    errs.phoneNumber = PHONE_ERROR;
  }
  const addr = deliveryAddress.trim();
  if (addr.length < 5 || addr.length > 500) {
    errs.deliveryAddress = 'Please enter a delivery address.';
  }
  return errs;
};

export default function CheckoutModal() {
  const isOpen = useCartStore((s) => s.isCheckoutOpen);
  const items = useCartStore((s) => s.items);
  const closeCheckout = useCartStore((s) => s.closeCheckout);
  const closeCart = useCartStore((s) => s.closeCart);
  const clearCart = useCartStore((s) => s.clearCart);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [phase, setPhase] = useState('form'); // 'form' | 'submitting' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  const subtotal = items.reduce((n, i) => n + i.qty * i.Price, 0);
  const itemCount = items.reduce((n, i) => n + i.qty, 0);
  const isSubmitting = phase === 'submitting';

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !isSubmitting) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSubmitting]);

  useEffect(() => {
    if (isOpen && items.length === 0 && phase === 'form') {
      closeCheckout();
    }
  }, [isOpen, items.length, phase, closeCheckout]);

  const handleClose = () => {
    if (isSubmitting) return;
    closeCheckout();
    setPhase('form');
    setErrorMsg('');
    setOrderResult(null);
    setErrors(initialErrors);
  };

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'phoneNumber') {
      value = value.replace(/\D/g, '').slice(0, PHONE_MAX_LENGTH);
    }
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (v.fullName || v.phoneNumber || v.deliveryAddress) return;
    if (items.length === 0) return;

    setPhase('submitting');
    setErrorMsg('');
    try {
      const result = await placeOrder({ ...form, items });
      clearCart();
      closeCart();
      setOrderResult(result);
      setPhase('success');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setPhase('error');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden="true"
        className="fixed inset-0 z-[60] bg-coffee-900/70"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        aria-busy={isSubmitting}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
          {phase === 'success' ? (
            <SuccessPanel result={orderResult} onDone={handleClose} />
          ) : (
            <FormPanel
              form={form}
              errors={errors}
              errorMsg={phase === 'error' ? errorMsg : ''}
              isSubmitting={isSubmitting}
              itemCount={itemCount}
              subtotal={subtotal}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={handleClose}
            />
          )}
        </div>
      </div>
    </>
  );
}

function FormPanel({
  form,
  errors,
  errorMsg,
  isSubmitting,
  itemCount,
  subtotal,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <>
      <header className="flex items-center justify-between px-5 py-4 bg-raspberry-900 text-blush-50 border-b-4 border-coffee-800">
        <h2 className="font-display italic uppercase tracking-tight text-2xl">
          Confirm Order
        </h2>
        {!isSubmitting && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="bg-berry-500 text-blush-50 rounded-md p-1.5 shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
      </header>

      <form
        onSubmit={onSubmit}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
      >
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 bg-raspberry-50 border-2 border-raspberry-700 rounded-md p-3 text-raspberry-900"
          >
            <AlertTriangle
              size={20}
              strokeWidth={2.5}
              className="text-raspberry-700 shrink-0 mt-0.5"
            />
            <p className="text-sm font-bold">{errorMsg}</p>
          </div>
        )}

        <Field
          id="fullName"
          label="Full Name"
          value={form.fullName}
          onChange={onChange('fullName')}
          error={errors.fullName}
          disabled={isSubmitting}
          autoComplete="name"
          maxLength={100}
        />

        <Field
          id="phoneNumber"
          label="Phone Number"
          value={form.phoneNumber}
          onChange={onChange('phoneNumber')}
          error={errors.phoneNumber}
          disabled={isSubmitting}
          autoComplete="tel"
          inputMode="numeric"
          maxLength={PHONE_MAX_LENGTH}
          placeholder={PHONE_PLACEHOLDER}
        />

        <Field
          id="deliveryAddress"
          label="Delivery Address"
          value={form.deliveryAddress}
          onChange={onChange('deliveryAddress')}
          error={errors.deliveryAddress}
          disabled={isSubmitting}
          autoComplete="street-address"
          maxLength={500}
          multiline
        />

        <div className="flex items-center justify-between border-t-2 border-coffee-200 pt-3">
          <span className="text-coffee-900 font-bold">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
          <span className="font-display text-2xl text-raspberry-900">
            {formatPrice(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 font-bold text-coffee-900 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-raspberry-600 text-blush-50 font-display italic uppercase tracking-wide text-lg px-5 py-2.5 rounded-md border-4 border-coffee-800 shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-retro-sm transition-transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-retro"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Placing order…
              </>
            ) : (
              'Confirm Order'
            )}
          </button>
        </div>
      </form>
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  multiline,
  ...rest
}) {
  const baseClass =
    'w-full bg-blush-50 border-2 border-coffee-800 rounded-md px-3 py-2 text-raspberry-900 font-medium focus:outline-none focus:border-raspberry-700 focus:ring-2 focus:ring-raspberry-300 disabled:opacity-60 disabled:cursor-not-allowed';
  const errorClass = error ? 'border-raspberry-700' : '';
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-black text-coffee-900 mb-1.5 uppercase tracking-wide"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows={2}
          className={`${baseClass} ${errorClass} resize-none`}
          {...rest}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${baseClass} ${errorClass}`}
          {...rest}
        />
      )}
      {error && (
        <p className="mt-1 text-sm font-bold text-raspberry-700">{error}</p>
      )}
    </div>
  );
}

function SuccessPanel({ result, onDone }) {
  const orderId = result?.orderId ?? '?';
  const status = result?.orderStatus ?? 'Pending';

  return (
    <div className="px-6 py-10 text-center">
      <div className="relative inline-flex items-center justify-center mb-4 animate-bounce-in">
        <div className="absolute inset-0 bg-berry-200 rounded-full blur-2xl opacity-70" />
        <div className="relative bg-blush-50 border-4 border-coffee-800 rounded-full p-4 shadow-retro">
          <CheckCircle2
            size={72}
            strokeWidth={2.5}
            className="text-raspberry-700"
          />
        </div>
      </div>

      <h2 className="font-display italic uppercase text-3xl sm:text-4xl text-raspberry-900 leading-none">
        Order Placed!
      </h2>
      <p className="mt-3 text-coffee-900 font-bold">
        Order #{orderId} · {status}
      </p>
      <p className="mt-1 text-coffee-700">
        We'll bring the goodness to your door.
      </p>

      <button
        type="button"
        onClick={onDone}
        className="mt-6 bg-raspberry-700 text-blush-50 font-display italic uppercase tracking-wide text-lg px-8 py-2.5 rounded-md border-4 border-coffee-800 shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-retro-sm transition-transform"
      >
        Done
      </button>
    </div>
  );
}
