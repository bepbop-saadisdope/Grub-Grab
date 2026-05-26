import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { getCategories, getItems } from './menuApi.js';
import CategorySection from './CategorySection.jsx';
import CategoryTabs from './CategoryTabs.jsx';

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState(new Map());
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const [cats, items] = await Promise.all([getCategories(), getItems()]);
      const grouped = new Map();
      for (const it of items) {
        const list = grouped.get(it.CategoryID) || [];
        list.push(it);
        grouped.set(it.CategoryID, list);
      }
      const sortedCats = [...cats].sort(
        (a, b) => (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0)
      );
      setCategories(sortedCats);
      setItemsByCategory(grouped);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-raspberry-900">
        <Loader2 className="animate-spin" size={42} />
        <p className="mt-4 font-bold">Loading the goodness…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto my-16 bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro p-6 text-center">
        <AlertTriangle className="mx-auto text-berry-500" size={42} />
        <h2 className="mt-3 text-xl font-black text-raspberry-900">
          We couldn't load the menu
        </h2>
        <p className="mt-2 text-coffee-700">{errorMsg}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 bg-berry-500 text-blush-50 font-bold px-5 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-blush-50">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl text-raspberry-900 leading-none italic uppercase tracking-tight">
            The Full Menu
          </h2>
          <p className="mt-2 text-coffee-700 font-medium">
            Tap a section below to jump · scroll to browse
          </p>
        </div>
      </div>

      <CategoryTabs categories={categories} />

      {categories.map((cat, idx) => {
        const variant = idx % 2 === 0 ? 'dark' : 'light';
        const panelClass =
          variant === 'dark' ? 'bg-raspberry-900' : 'bg-blush-50';
        return (
          <div
            key={cat.CategoryID}
            id={`category-${cat.CategoryID}`}
            data-category-id={cat.CategoryID}
            className={`${panelClass} scroll-mt-16`}
          >
            <div className="max-w-6xl mx-auto px-4 py-12">
              <CategorySection
                category={cat}
                items={itemsByCategory.get(cat.CategoryID)}
                variant={variant}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
