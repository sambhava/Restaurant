import { useRef, useEffect } from 'react';

export default function CategoryTabs({ categories, activeCategory, onSelect }) {
    const tabsRef = useRef(null);

    useEffect(() => {
        // Auto-scroll active tab into view
        if (tabsRef.current) {
            const activeTab = tabsRef.current.querySelector('.cat-tab.active');
            if (activeTab) {
                activeTab.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                });
            }
        }
    }, [activeCategory]);

    const formatCategory = (cat) =>
        cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ');

    return (
        <div className="category-tabs-wrapper">
            <div className="category-tabs" ref={tabsRef}>
                <button
                    className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
                    onClick={() => onSelect('all')}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => onSelect(cat)}
                    >
                        {formatCategory(cat)}
                    </button>
                ))}
            </div>
        </div>
    );
}
