import { useEffect, useState } from 'react';
import {
  ArrowDown,
  Beef,
  Drumstick,
  Flame,
  Loader2,
  Sparkles,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { getItems } from '../menu/menuApi.js';
import MenuCard from '../menu/MenuCard.jsx';

const NEW_ARRIVAL_COUNT = 4;

export default function HomePage() {
  const [newItems, setNewItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getItems()
      .then((items) => {
        if (cancelled) return;
        // Featured items first (admin-pinned), newest-by-MenuItemID for the rest.
        const isFeatured = (i) => i.IsFeatured === true || i.IsFeatured === 1;
        const featured = items
          .filter(isFeatured)
          .sort((a, b) => b.MenuItemID - a.MenuItemID);
        const fallback = items
          .filter((i) => !isFeatured(i))
          .sort((a, b) => b.MenuItemID - a.MenuItemID);
        setNewItems([...featured, ...fallback].slice(0, NEW_ARRIVAL_COUNT));
      })
      .catch(() => {
        // Silently no-op; the menu below will show a proper error.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToMenu = () => {
    document.getElementById('menu-start')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Hero onBrowse={scrollToMenu} />
      <NewArrivals items={newItems} />
      <FeatureStrip />
    </>
  );
}

function Hero({ onBrowse }) {
  return (
    <section className="relative bg-blush-50 overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute -top-12 -right-12 w-72 h-72 bg-berry-100 rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-raspberry-50 rounded-full blur-3xl opacity-70 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 grid sm:grid-cols-5 gap-8 items-center">
        <div className="sm:col-span-3">
          <h1 className="font-display text-7xl sm:text-9xl text-raspberry-900 leading-none tracking-tight">
            GRUB
          </h1>
          <p className="mt-2 font-display italic uppercase text-2xl sm:text-3xl text-berry-500">
            Grab the goodness
          </p>
          <p className="mt-6 text-lg text-coffee-900 max-w-md leading-relaxed">
            Lahore's loudest fast-food spot. Smashed beef, fire wings, fried
            chicken — done loud, done right.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBrowse}
              className="flex items-center gap-2 bg-raspberry-600 text-blush-50 font-display italic uppercase tracking-wide text-xl px-6 py-3 rounded-md border-4 border-coffee-800 shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-retro-sm transition-transform"
            >
              <UtensilsCrossed size={22} strokeWidth={2.5} />
              Browse the menu
              <ArrowDown size={20} strokeWidth={2.5} />
            </button>
            <span className="text-coffee-700 font-bold flex items-center gap-1">
              <Star size={16} className="fill-berry-500 text-berry-500" />
              <Star size={16} className="fill-berry-500 text-berry-500" />
              <Star size={16} className="fill-berry-500 text-berry-500" />
              <Star size={16} className="fill-berry-500 text-berry-500" />
              <Star size={16} className="fill-berry-500 text-berry-500" />
              <span className="ml-2 text-sm">FAST-NU certified bites</span>
            </span>
          </div>
        </div>

        {/* Cartoon character cluster */}
        <div className="sm:col-span-2 flex items-center justify-center">
          <div className="relative">
            <div className="w-56 h-56 sm:w-64 sm:h-64 bg-raspberry-700 border-4 border-coffee-800 rounded-full shadow-retro flex items-center justify-center transform rotate-6">
              <Beef size={140} strokeWidth={1.75} className="text-blush-50" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-berry-500 border-4 border-coffee-800 rounded-full shadow-retro-sm flex items-center justify-center transform -rotate-12">
              <Flame
                size={48}
                strokeWidth={2.5}
                className="text-blush-50"
              />
            </div>
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-blush-50 border-4 border-coffee-800 rounded-full shadow-retro-sm flex items-center justify-center transform rotate-12">
              <Drumstick
                size={36}
                strokeWidth={2.5}
                className="text-raspberry-700"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewArrivals({ items }) {
  if (items.length === 0) {
    return (
      <section className="bg-raspberry-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHead label="New Arrivals" tagline="Fresh off the grill" />
          <div className="flex items-center justify-center py-8 text-blush-200">
            <Loader2 className="animate-spin mr-2" size={20} />
            <span className="font-bold">Cooking up something fresh…</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-raspberry-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHead label="New Arrivals" tagline="Fresh off the grill" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <MenuCard key={item.MenuItemID} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHead({ label, tagline }) {
  return (
    <header className="flex items-center justify-between mb-6 pb-3 border-b-4 border-berry-500">
      <div className="flex items-center gap-3">
        <span className="bg-berry-500 text-blush-50 p-2 rounded-lg shadow-retro-sm">
          <Sparkles size={22} strokeWidth={2.5} />
        </span>
        <h2 className="font-display italic uppercase text-3xl sm:text-4xl text-blush-50 tracking-tight">
          {label}
        </h2>
      </div>
      <span className="hidden sm:inline italic font-bold text-berry-300 text-sm">
        {tagline}
      </span>
    </header>
  );
}

function FeatureStrip() {
  const features = [
    { Icon: Flame, title: 'Fire Wings', body: '5 sauces, ready in 12 minutes.' },
    { Icon: Beef, title: 'Smashed Beef', body: 'Single or double — your call.' },
    { Icon: Drumstick, title: 'Fried Chicken', body: 'Crispy, juicy, never dry.' },
  ];
  return (
    <section className="bg-blush-50 py-12 border-b-4 border-coffee-800">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {features.map(({ Icon, title, body }) => (
          <div
            key={title}
            className="bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro p-5 flex items-start gap-3"
          >
            <span className="bg-raspberry-700 text-blush-50 p-2.5 rounded-lg shadow-retro-sm shrink-0">
              <Icon size={26} strokeWidth={2.5} />
            </span>
            <div>
              <h3 className="font-display italic uppercase text-xl text-raspberry-900 leading-none">
                {title}
              </h3>
              <p className="mt-1 text-coffee-700 font-medium text-sm">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
