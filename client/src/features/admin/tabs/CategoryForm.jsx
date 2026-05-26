import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import AdminModal from '../components/AdminModal.jsx';
import FormField from '../components/FormField.jsx';
import { createCategory, updateCategory } from '../api/categories.js';

const empty = {
  categoryName: '',
  description: '',
  displayOrder: '',
  isActive: true,
};

const validate = (form) => {
  const errs = {};
  const name = String(form.categoryName || '').trim();
  if (name.length < 1 || name.length > 100) {
    errs.categoryName = 'Name is required (max 100 characters).';
  }
  if (form.description && String(form.description).length > 500) {
    errs.description = 'Description is too long (max 500).';
  }
  if (form.displayOrder !== '' && form.displayOrder !== null) {
    const ord = Number(form.displayOrder);
    if (!Number.isInteger(ord) || ord < 0) {
      errs.displayOrder = 'Display order must be a non-negative integer.';
    }
  }
  return errs;
};

export default function CategoryForm({
  isOpen,
  onClose,
  onSaved,
  category, // null = create, object = edit
}) {
  const isEdit = !!category;
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (category) {
      setForm({
        categoryName: category.CategoryName ?? '',
        description: category.Description ?? '',
        displayOrder: String(category.DisplayOrder ?? ''),
        isActive: !!category.IsActive,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
    setErrorMsg('');
  }, [isOpen, category]);

  const set = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
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
      const payload = { categoryName: form.categoryName.trim() };
      if (form.description?.trim()) payload.description = form.description.trim();
      if (form.displayOrder !== '' && form.displayOrder !== null) {
        payload.displayOrder = Number(form.displayOrder);
      }
      if (isEdit) payload.isActive = !!form.isActive;

      if (isEdit) {
        await updateCategory(category.CategoryID, payload);
      } else {
        await createCategory(payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit · ${category?.CategoryName ?? 'Category'}` : 'Add category'}
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
          id="categoryName"
          label="Category Name"
          value={form.categoryName}
          onChange={set('categoryName')}
          error={errors.categoryName}
          disabled={submitting}
          maxLength={100}
        />

        <FormField
          id="description"
          label="Description"
          value={form.description}
          onChange={set('description')}
          error={errors.description}
          disabled={submitting}
          multiline
          maxLength={500}
        />

        <FormField
          id="displayOrder"
          label="Display Order"
          type="number"
          min="0"
          step="1"
          value={form.displayOrder}
          onChange={set('displayOrder')}
          error={errors.displayOrder}
          disabled={submitting}
        />

        {isEdit && (
          <label className="flex items-center gap-2 font-bold text-coffee-900">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={set('isActive')}
              disabled={submitting}
              className="w-4 h-4 accent-raspberry-700"
            />
            Active
          </label>
        )}

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
                {isEdit ? 'Save changes' : 'Add category'}
              </>
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
