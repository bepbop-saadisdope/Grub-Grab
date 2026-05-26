import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { listCategories, deleteCategory } from '../api/categories.js';
import CategoryForm from './CategoryForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmCat, setConfirmCat] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await listCategories();
      setCategories(Array.isArray(data) ? data : []);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      showInactive
        ? categories
        : categories.filter((c) => c.IsActive === true || c.IsActive === 1),
    [categories, showInactive]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (cat) => {
    setEditing(cat);
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const askDelete = (cat) => {
    setConfirmCat(cat);
    setConfirmError('');
  };
  const closeConfirm = () => {
    if (confirmBusy) return;
    setConfirmCat(null);
    setConfirmError('');
  };
  const confirmDelete = async () => {
    if (!confirmCat) return;
    setConfirmBusy(true);
    setConfirmError('');
    try {
      await deleteCategory(confirmCat.CategoryID);
      await load();
      setConfirmCat(null);
    } catch (err) {
      setConfirmError(err.message || 'Failed to delete.');
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="font-display italic uppercase text-3xl text-raspberry-900 leading-none">
          Categories
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-sm font-bold text-coffee-900">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 accent-raspberry-700"
            />
            Show inactive
          </label>
          <button
            type="button"
            onClick={load}
            disabled={status === 'loading'}
            aria-label="Refresh"
            className="bg-blush-50 border-2 border-coffee-800 text-raspberry-900 font-bold p-2 rounded-md hover:bg-blush-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={18}
              strokeWidth={2.5}
              className={status === 'loading' ? 'animate-spin' : ''}
            />
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-raspberry-600 text-blush-50 font-bold px-3 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Category
          </button>
        </div>
      </div>

      {status === 'loading' && categories.length === 0 ? (
        <LoadingState />
      ) : status === 'error' ? (
        <ErrorState message={errorMsg} onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyState />
      ) : (
        <CategoriesTable
          categories={visible}
          onEdit={openEdit}
          onDelete={askDelete}
        />
      )}

      <CategoryForm
        isOpen={formOpen}
        onClose={closeForm}
        onSaved={load}
        category={editing}
      />

      <ConfirmDialog
        isOpen={!!confirmCat}
        onClose={closeConfirm}
        onConfirm={confirmDelete}
        title="Soft-delete category?"
        message={
          confirmCat
            ? `Mark "${confirmCat.CategoryName}" as inactive? It will be hidden from the customer menu but kept for items already in this category.`
            : ''
        }
        confirmLabel="Soft-delete"
        destructive
        busy={confirmBusy}
        errorMsg={confirmError}
      />
    </div>
  );
}

function CategoriesTable({ categories, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro">
      <table className="w-full text-left">
        <thead className="bg-raspberry-900 text-blush-50">
          <tr>
            <Th>Name</Th>
            <Th className="hidden md:table-cell">Description</Th>
            <Th>Order</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-coffee-200">
          {categories.map((c) => {
            const active = c.IsActive === true || c.IsActive === 1;
            return (
              <tr key={c.CategoryID} className="hover:bg-blush-100">
                <Td>
                  <div className="font-black text-raspberry-900">
                    {c.CategoryName}
                  </div>
                </Td>
                <Td className="hidden md:table-cell text-coffee-700">
                  <span className="line-clamp-1 max-w-xs">
                    {c.Description || '—'}
                  </span>
                </Td>
                <Td className="text-coffee-700">{c.DisplayOrder ?? '—'}</Td>
                <Td>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wide ${
                      active
                        ? 'bg-raspberry-700 text-blush-50'
                        : 'bg-coffee-700 text-blush-50'
                    }`}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      aria-label={`Edit ${c.CategoryName}`}
                      className="inline-flex items-center gap-1 bg-raspberry-600 text-blush-50 font-bold px-2.5 py-1.5 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
                    >
                      <Pencil size={14} strokeWidth={2.5} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    {active && (
                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        aria-label={`Delete ${c.CategoryName}`}
                        className="inline-flex items-center gap-1 bg-berry-500 text-blush-50 font-bold px-2.5 py-1.5 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th
      className={`px-3 py-3 text-xs font-display italic uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = '' }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-raspberry-900">
      <Loader2 className="animate-spin" size={42} />
      <p className="mt-3 font-bold">Loading categories…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="max-w-md mx-auto my-12 bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro p-6 text-center">
      <AlertTriangle className="mx-auto text-berry-500" size={42} />
      <h2 className="mt-3 text-xl font-black text-raspberry-900">
        Couldn't load
      </h2>
      <p className="mt-2 text-coffee-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 bg-berry-500 text-blush-50 font-bold px-5 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <p className="font-display italic uppercase text-2xl text-raspberry-900">
        No categories
      </p>
      <p className="mt-2 text-coffee-700">
        Click <span className="font-black">Add Category</span> to create your first one.
      </p>
    </div>
  );
}
