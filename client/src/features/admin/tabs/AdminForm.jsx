import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import AdminModal from '../components/AdminModal.jsx';
import FormField from '../components/FormField.jsx';
import { createAdmin } from '../api/users.js';
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
  email: '',
  phoneNumber: '',
  password: '',
  cnic: '',
};

const validate = (f) => {
  const errs = {};
  if (!f.fullName.trim() || f.fullName.length > 100) {
    errs.fullName = 'Full name is required (max 100 characters).';
  }
  const email = f.email.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
    errs.email = 'Please enter a valid email.';
  }
  if (!isValidPakistaniPhone(f.phoneNumber)) {
    errs.phoneNumber = PHONE_ERROR;
  }
  if (f.password.length < 6) {
    errs.password = 'Password must be at least 6 characters.';
  }
  if (!isValidCnic(f.cnic)) {
    errs.cnic = CNIC_ERROR;
  }
  return errs;
};

export default function AdminForm({ isOpen, onClose, onSaved }) {
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
      await createAdmin({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        cnic: form.cnic.trim(),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add admin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add admin"
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
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          disabled={submitting}
          maxLength={100}
          autoComplete="off"
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
          placeholder={PHONE_PLACEHOLDER}
          autoComplete="off"
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
          placeholder={CNIC_PLACEHOLDER}
          autoComplete="off"
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
                Add admin
              </>
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
