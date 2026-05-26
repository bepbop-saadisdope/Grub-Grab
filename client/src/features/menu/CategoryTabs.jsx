import { useEffect, useRef, useState } from 'react';

const sectionId = (categoryId) => `category-${categoryId}`;

export default function CategoryTabs({ categories }) {
  const [activeId, setActiveId] = useState(categories[0]?.CategoryID ?? null);
  const tabsContainerRef = useRef(null);
  const tabRefs = useRef(new Map());

  // Scrollspy: highlight the category whose section is currently in view.
  useEffect(() => {
    if (!categories.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top that is currently intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = Number(visible[0].target.dataset.categoryId);
          if (Number.isInteger(id)) setActiveId(id);
        }
      },
      // Trigger when a section's top is roughly at the tab-bar's bottom edge.
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );

    categories.forEach((c) => {
      const el = document.getElementById(sectionId(c.CategoryID));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  // Keep the active tab in view inside the horizontally-scrollable tabs bar.
  useEffect(() => {
    const node = tabRefs.current.get(activeId);
    if (node && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const nodeLeft = node.offsetLeft;
      const nodeRight = nodeLeft + node.offsetWidth;
      const viewLeft = container.scrollLeft;
      const viewRight = viewLeft + container.clientWidth;
      if (nodeLeft < viewLeft || nodeRight > viewRight) {
        container.scrollTo({
          left: nodeLeft - container.clientWidth / 2 + node.offsetWidth / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [activeId]);

  const handleClick = (categoryId) => {
    const el = document.getElementById(sectionId(categoryId));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!categories.length) return null;

  return (
    <nav
      aria-label="Menu sections"
      className="sticky top-0 z-30 bg-blush-50 border-b-4 border-coffee-800 shadow-retro-sm"
    >
      <div
        ref={tabsContainerRef}
        className="max-w-6xl mx-auto px-2 sm:px-4 flex overflow-x-auto scroll-smooth"
      >
        {categories.map((c) => {
          const isActive = c.CategoryID === activeId;
          return (
            <button
              key={c.CategoryID}
              ref={(node) => {
                if (node) tabRefs.current.set(c.CategoryID, node);
                else tabRefs.current.delete(c.CategoryID);
              }}
              type="button"
              onClick={() => handleClick(c.CategoryID)}
              className={`flex items-center px-4 py-3 font-display italic uppercase tracking-tight text-sm sm:text-base whitespace-nowrap border-b-4 transition-colors ${
                isActive
                  ? 'text-raspberry-900 border-raspberry-600'
                  : 'text-coffee-700 border-transparent hover:text-raspberry-900 hover:border-berry-300'
              }`}
            >
              {c.CategoryName}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
