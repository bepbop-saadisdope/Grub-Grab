import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react';
import {
  listMenuItems,
  deleteMenuItem,
  setMenuItemFeatured,
} from '../api/menu.js';
import { listCategories } from '../api/categories.js';
import { formatPrice } from '../../cart/formatPrice.js';
import { useAdminStore } from '../adminStore.js';
import MenuItemForm from './MenuItemForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function MenuTab() {
  const role = useAdminStore((s) => s.user?.role);
  const isSuperAdmin = role === 'SuperAdmin';

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const [togglingFeaturedId, setTogglingFeaturedId] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const [menuData, catData] = await Promise.all([
        listMenuItems(),
        listCategories(),
      ]);
      setItems(Array.isArray(menuData) ? menuData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleItems = useMemo(
    () =>
      showInactive
        ? items
        : items.filter((i) => i.IsAvailable === true || i.IsAvailable === 1),
    [items, showInactive]
  );

  const openCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };
  const openEdit = (item) => {
    setEditingItem(item);
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  const askDelete = (item) => {
    setConfirmItem(item);
    setConfirmError('');
  };
  const closeConfirm = () => {
    if (confirmBusy) return;
    setConfirmItem(null);
    setConfirmError('');
  };
  const confirmDelete = async () => {
    if (!confirmItem) return;
    setConfirmBusy(true);
    setConfirmError('');
    try {
      await deleteMenuItem(confirmItem.MenuItemID);
      await load();
      setConfirmItem(null);
    } catch (err) {
      setConfirmError(err.message || 'Failed to delete.');
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleToggleFeatured = async (item) => {
    const nextFeatured = !(item.IsFeatured === true || item.IsFeatured === 1);
    setTogglingFeaturedId(item.MenuItemID);
    setErrorMsg('');
    try {
      await setMenuItemFeatured(item.MenuItemID, nextFeatured);
      setItems((prev) =>
        prev.map((i) =>
          i.MenuItemID === item.MenuItemID ? { ...i, IsFeatured: nextFeatured } : i
        )
      );
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update featured status.');
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const featuredCount = items.filter(
    (i) => i.IsFeatured === true || i.IsFeatured === 1
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display italic uppercase text-3xl text-raspberry-900 leading-none">
            Menu
          </h1>
          {isSuperAdmin && (
            <p className="mt-1 text-xs font-bold text-coffee-700">
              <Star size={12} className="inline fill-berry-500 text-berry-500" />{' '}
              {featuredCount} featured · shown first on the homepage
            </p>
          )}
        </div>
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
            Add Item
          </button>
        </div>
      </div>

      {status === 'loading' && items.length === 0 ? (
        <LoadingState label="menu" />
      ) : status === 'error' ? (
        <ErrorState message={errorMsg} onRetry={load} />
      ) : visibleItems.length === 0 ? (
        <EmptyState />
      ) : (
        <ItemsTable
          items={visibleItems}
          onEdit={openEdit}
          onDelete={askDelete}
          isSuperAdmin={isSuperAdmin}
          onToggleFeatured={handleToggleFeatured}
          togglingFeaturedId={togglingFeaturedId}
        />
      )}

      <MenuItemForm
        isOpen={formOpen}
        onClose={closeForm}
        onSaved={load}
        categories={categories}
        item={editingItem}
      />

      <ConfirmDialog
        isOpen={!!confirmItem}
        onClose={closeConfirm}
        onConfirm={confirmDelete}
        title="Soft-delete item?"
        message={
          confirmItem
            ? `Mark "${confirmItem.ItemName}" as unavailable? It will be hidden from the customer menu but kept for order history.`
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

function ItemsTable({
  items,
  onEdit,
  onDelete,
  isSuperAdmin,
  onToggleFeatured,
  togglingFeaturedId,
}) {
  return (
    <div className="overflow-x-auto bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro">
      <table className="w-full text-left">
        <thead className="bg-raspberry-900 text-blush-50">
          <tr>
            <Th>Image</Th>
            <Th>Name</Th>
            <Th className="hidden md:table-cell">Category</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            {isSuperAdmin && <Th className="text-center">Featured</Th>}
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-coffee-200">
          {items.map((it) => {
            const available = it.IsAvailable === true || it.IsAvailable === 1;
            const featured = it.IsFeatured === true || it.IsFeatured === 1;
            const togglingFeatured = togglingFeaturedId === it.MenuItemID;
            return (
              <tr key={it.MenuItemID} className="hover:bg-blush-100">
                <Td>
                  <div className="w-12 h-12 rounded-md border-2 border-coffee-800 bg-gradient-to-br from-raspberry-700 to-berry-500 overflow-hidden flex items-center justify-center text-blush-50">
                    {it.ImageURL ? (
                      <img
                        src={it.ImageURL}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageOff size={18} />
                    )}
                  </div>
                </Td>
                <Td>
                  <div className="font-black text-raspberry-900">
                    {it.ItemName}
                  </div>
                  {it.Description && (
                    <div className="text-xs text-coffee-700 line-clamp-1 max-w-xs">
                      {it.Description}
                    </div>
                  )}
                </Td>
                <Td className="hidden md:table-cell text-coffee-700">
                  {it.CategoryName || '—'}
                </Td>
                <Td>
                  <span className="font-black text-raspberry-900 whitespace-nowrap">
                    {formatPrice(it.Price)}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wide ${
                      available
                        ? 'bg-raspberry-700 text-blush-50'
                        : 'bg-coffee-700 text-blush-50'
                    }`}
                  >
                    {available ? 'Active' : 'Inactive'}
                  </span>
                </Td>
                {isSuperAdmin && (
                  <Td className="text-center">
                    <button
                      type="button"
                      onClick={() => onToggleFeatured(it)}
                      disabled={togglingFeatured || !available}
                      aria-label={
                        featured
                          ? `Unfeature ${it.ItemName}`
                          : `Feature ${it.ItemName}`
                      }
                      title={
                        !available
                          ? 'Inactive items cannot be featured'
                          : featured
                          ? 'Click to unfeature'
                          : 'Click to feature on the homepage'
                      }
                      className="p-1.5 rounded-md hover:bg-blush-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {togglingFeatured ? (
                        <Loader2
                          size={20}
                          className="animate-spin text-coffee-700"
                        />
                      ) : (
                        <Star
                          size={20}
                          strokeWidth={2.5}
                          className={
                            featured
                              ? 'fill-berry-500 text-berry-500'
                              : 'text-coffee-400'
                          }
                        />
                      )}
                    </button>
                  </Td>
                )}
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(it)}
                      aria-label={`Edit ${it.ItemName}`}
                      className="inline-flex items-center gap-1 bg-raspberry-600 text-blush-50 font-bold px-2.5 py-1.5 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
                    >
                      <Pencil size={14} strokeWidth={2.5} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    {available && (
                      <button
                        type="button"
                        onClick={() => onDelete(it)}
                        aria-label={`Delete ${it.ItemName}`}
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

function LoadingState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-raspberry-900">
      <Loader2 className="animate-spin" size={42} />
      <p className="mt-3 font-bold">Loading {label}…</p>
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
        No items
      </p>
      <p className="mt-2 text-coffee-700">
        Click <span className="font-black">Add Item</span> to create your first menu item.
      </p>
    </div>
  );
}
