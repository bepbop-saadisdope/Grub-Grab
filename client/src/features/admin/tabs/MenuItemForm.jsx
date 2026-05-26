import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import AdminModal from '../components/AdminModal.jsx';
import FormField from '../components/FormField.jsx';
import { createMenuItem, updateMenuItem } from '../api/menu.js';

const empty = {
  itemName: '',
  categoryId: '',
  price: '',
  description: '',
  imageURL: '',
  isAvailable: true,
};

const validate = (form) => {
  const errs = {};
  const name = String(form.itemName || '').trim();
  if (name.length < 1 || name.length > 100) {
    errs.itemName = 'Name is required (max 100 characters).';
  }
  const cat = Number(form.categoryId);
  if (!Number.isInteger(cat) || cat <= 0) {
    errs.categoryId = 'Pick a category.';
  }
  const price = Number(form.price);
  if (!Number.isFinite(price) || price < 0) {
    errs.price = 'Price must be a non-negative number.';
  }
  if (form.description && String(form.description).length > 500) {
    errs.description = 'Description is too long (max 500).';
  }
  if (form.imageURL && String(form.imageURL).length > 255) {
    errs.imageURL = 'Image URL is too long (max 255).';
  }
  return errs;
};

export default function MenuItemForm({
  isOpen,
  onClose,
  onSaved,
  categories,
  item, // null = create, object = edit
}) {
  const isEdit = !!item;
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      setForm({
        itemName: item.ItemName ?? '',
        categoryId: String(item.CategoryID ?? ''),
        price: String(item.Price ?? ''),
        description: item.Description ?? '',
        imageURL: item.ImageURL ?? '',
        isAvailable: !!item.IsAvailable,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
    setErrorMsg('');
  }, [isOpen, item]);

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
      const payload = {
        itemName: form.itemName.trim(),
        categoryId: Number(form.categoryId),
        price: Number(form.price),
      };
      if (form.description?.trim()) payload.description = form.description.trim();
      if (form.imageURL?.trim()) payload.imageURL = form.imageURL.trim();
      if (isEdit) payload.isAvailable = !!form.isAvailable;

      if (isEdit) {
        await updateMenuItem(item.MenuItemID, payload);
      } else {
        await createMenuItem(payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save menu item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit · ${item?.ItemName ?? 'Item'}` : 'Add menu item'}
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
          id="itemName"
          label="Item Name"
          value={form.itemName}
          onChange={set('itemName')}
          error={errors.itemName}
          disabled={submitting}
          maxLength={100}
        />

        <div>
          <label
            htmlFor="categoryId"
            className="block text-sm font-black text-coffee-900 mb-1.5 uppercase tracking-wide"
          >
            Category
          </label>
          <select
            id="categoryId"
            value={form.categoryId}
            onChange={set('categoryId')}
            disabled={submitting}
            className={`w-full bg-blush-50 border-2 ${
              errors.categoryId ? 'border-raspberry-700' : 'border-coffee-800'
            } rounded-md px-3 py-2 text-raspberry-900 font-medium focus:outline-none focus:ring-2 focus:ring-raspberry-300 disabled:opacity-60`}
          >
            <option value="">Select a category…</option>
            {(categories || []).map((c) => (
              <option key={c.CategoryID} value={c.CategoryID}>
                {c.CategoryName}
                {c.IsActive === false ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm font-bold text-raspberry-700">
              {errors.categoryId}
            </p>
          )}
        </div>

        <FormField
          id="price"
          label="Price (Rs.)"
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={set('price')}
          error={errors.price}
          disabled={submitting}
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
          id="imageURL"
          label="Image URL"
          value={form.imageURL}
          onChange={set('imageURL')}
          error={errors.imageURL}
          disabled={submitting}
          maxLength={255}
          placeholder="https://…"
        />

        {isEdit && (
          <label className="flex items-center gap-2 font-bold text-coffee-900">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={set('isAvailable')}
              disabled={submitting}
              className="w-4 h-4 accent-raspberry-700"
            />
            Available
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
                {isEdit ? 'Save changes' : 'Add item'}
              </>
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
