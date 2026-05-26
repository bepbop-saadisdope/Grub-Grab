import {
  Beef,
  Drumstick,
  Sandwich,
  Wheat,
  Flame,
  Salad,
  UtensilsCrossed,
} from 'lucide-react';
import MenuCard from './MenuCard.jsx';

function pickIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('beef')) return Beef;
  if (n.includes('chicken') || n.includes('tender')) return Drumstick;
  if (n.includes('wing')) return Flame;
  if (n.includes('wrap') || n.includes('sandwich')) return Sandwich;
  if (n.includes('fries')) return Wheat;
  if (n.includes('side') || n.includes('extra')) return Salad;
  return UtensilsCrossed;
}

export default function CategorySection({ category, items, variant = 'light' }) {
  const Icon = pickIcon(category.CategoryName);

  if (!items || items.length === 0) return null;

  const isDark = variant === 'dark';
  const headerText = isDark ? 'text-blush-50' : 'text-raspberry-900';
  const underline = isDark ? 'border-berry-500' : 'border-raspberry-700';
  const iconChip = isDark
    ? 'bg-berry-500 text-blush-50'
    : 'bg-raspberry-900 text-blush-50';

  return (
    <section>
      <div className={`flex items-center gap-3 mb-8 pb-3 border-b-4 ${underline}`}>
        <span className={`p-2 rounded-lg shadow-retro-sm ${iconChip}`}>
          <Icon size={26} strokeWidth={2.5} />
        </span>
        <h2
          className={`font-display italic uppercase tracking-tight text-3xl sm:text-4xl ${headerText}`}
        >
          {category.CategoryName}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <MenuCard key={item.MenuItemID} item={item} />
        ))}
      </div>
    </section>
  );
}
