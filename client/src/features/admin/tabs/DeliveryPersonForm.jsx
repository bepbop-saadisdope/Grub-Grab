import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import AdminModal from '../components/AdminModal.jsx';
import FormField from '../components/FormField.jsx';
import { createDeliveryPerson } from '../api/deliveryPersons.js';
import {
  PHONE_ERROR,
  PHONE_MAX_LENGTH,
  PHONE_PLACEHOLDER,
  isValidPakistaniPhone,
} from '../../../api/validatePhone.js';
import {
  CNIC_ERROR,
  CNIC_MAX_LENGTH,
  CNIC_PLACEHOLDER,
  formatCnicAsType,
  isValidCnic,
} from '../../../api/validateCnic.js';

const empty = {
  fullName: '',
  phoneNumber: '',
  cnic: '',
  password: '',
  city: '',
  address: '',
  vehicleType: '',
  vehicleNumber: '',
};

const validate = (f) => {
  const errs = {};
  if (!f.fullName.trim() || f.fullName.length > 100) {
    errs.fullName = 'Full name is required (max 100 characters).';
  }
  if (!isValidPakistaniPhone(f.phoneNumber)) {
    errs.phoneNumber = PHONE_ERROR;
  }
  if (!isValidCnic(f.cnic)) {
    errs.cnic = CNIC_ERROR;
  }
  if (f.password.length < 6) {
    errs.password = 'Password must be at least 6 characters.';
  }
  if (f.city && f.city.length > 50) errs.city = 'City is too long (max 50).';
  if (f.address && f.address.length > 500)
    errs.address = 'Address is too long (max 500).';
  if (f.vehicleType && f.vehicleType.length > 50)
    errs.vehicleType = 'Too long (max 50).';
  if (f.vehicleNumber && f.vehicleNumber.length > 20)
    errs.vehicleNumber = 'Too long (max 20).';
  return errs;
};

export default function DeliveryPersonForm({ isOpen, onClose, onSaved }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(empty);
    setErrors({});
    setErrorMsg('');
  }, [isOpen]);

  const set = (field) => (e) => {
    let value = e.target.value;
    if (field === 'phoneNumber') {
      value = value.replace(/\D/g, '').slice(0, PHONE_MAX_LENGTH);
    } else if (field === 'cnic') {
      value = formatCnicAsType(value);
    }
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        cnic: form.cnic.trim(),
      };
      if (form.city.trim()) payload.city = form.city.trim();
      if (form.address.trim()) payload.address = form.address.trim();
      if (form.vehicleType.trim()) payload.vehicleType = form.vehicleType.trim();
      if (form.vehicleNumber.trim())
        payload.vehicleNumber = form.vehicleNumber.trim();

      await createDeliveryPerson(payload);
      onSaved?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add delivery person.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add delivery person"
      busy={submitting}
    >
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 bg-raspberry-50 border-2 border-raspberry-700 rounded-md p-3 text-raspberry-900"
          >
            <AlertTriangle
              size={18}
              strokeWidth={2.5}
              className="text-raspberry-700 shrink-0 mt-0.5"
            />
            <p className="text-sm font-bold">{errorMsg}</p>
          </div>
        )}

        <FormField
          id="fullName"
          label="Full Name"
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
          disabled={submitting}
          maxLength={100}
          autoComplete="name"
        />

        <FormField
          id="phoneNumber"
          label="Phone Number"
          value={form.phoneNumber}
          onChange={set('phoneNumber')}
          error={errors.phoneNumber}
          disabled={submitting}
          maxLength={PHONE_MAX_LENGTH}
          inputMode="numeric"
          autoComplete="off"
          placeholder={PHONE_PLACEHOLDER}
        />

        <FormField
          id="cnic"
          label="CNIC"
          value={form.cnic}
          onChange={set('cnic')}
          error={errors.cnic}
          disabled={submitting}
          maxLength={CNIC_MAX_LENGTH}
          inputMode="numeric"
          autoComplete="off"
          placeholder={CNIC_PLACEHOLDER}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          disabled={submitting}
          autoComplete="new-password"
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="vehicleType"
            label="Vehicle Type"
            value={form.vehicleType}
            onChange={set('vehicleType')}
            error={errors.vehicleType}
            disabled={submitting}
            maxLength={50}
            placeholder="Motorcycle"
          />
          <FormField
            id="vehicleNumber"
            label="Vehicle #"
            value={form.vehicleNumber}
            onChange={set('vehicleNumber')}
            error={errors.vehicleNumber}
            disabled={submitting}
            maxLength={20}
            placeholder="LHR-1234"
          />
        </div>

        <FormField
          id="city"
          label="City"
          value={form.city}
          onChange={set('city')}
          error={errors.city}
          disabled={submitting}
          maxLength={50}
        />

        <FormField
          id="address"
          label="Address"
          value={form.address}
          onChange={set('address')}
          error={errors.address}
          disabled={submitting}
          multiline
          maxLength={500}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 font-bold text-coffee-900 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-raspberry-600 text-blush-50 font-display italic uppercase tracking-wide px-5 py-2 rounded-md border-4 border-coffee-800 shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-retro-sm transition-transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-retro"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={16} strokeWidth={2.5} />
                Add rider
              </>
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
