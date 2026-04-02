import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import useAuthStore from '../store/authStore';

// ─── Date Helpers ───────────────────────────────────────
function getStartOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Keep 7 days ago helper for range
function getStartOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function getStartOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDate(d) {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// ─── SVG Bezier Curve Line Chart ──────────────────────────
function SmoothLineChart({ data, color = '#E8A54B', height = 180 }) {
    if (!data || data.length === 0) {
        return <div className="chart-empty">No data for this range</div>;
    }
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const paddingX = 40;
    const paddingY = 25;
    const chartW = 550;
    const chartH = height - 20;

    const points = data.map((d, i) => ({
        x: paddingX + (i / Math.max(data.length - 1, 1)) * (chartW - paddingX * 2),
        y: chartH - (d.value / maxVal) * (chartH - paddingY * 2) - paddingY,
    }));

    // Generate cubic Bezier path
    let pathD = '';
    if (points.length > 0) {
        pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cpX1 = p0.x + (p1.x - p0.x) / 2;
            const cpY1 = p0.y;
            const cpX2 = p0.x + (p1.x - p0.x) / 2;
            const cpY2 = p1.y;
            pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
        }
    }
    const areaD = pathD ? pathD + ` L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z` : '';

    // Interactive pointer state (default to the last point)
    const [activeIndex, setActiveIndex] = useState(points.length - 1);

    // Make sure activeIndex stays in bounds if data length changes
    if (activeIndex >= points.length) {
        setActiveIndex(points.length - 1);
    }

    const activePoint = points[activeIndex] || points[points.length - 1] || { x: 0, y: 0 };
    const activeData = data[activeIndex] || data[data.length - 1] || { label: '', value: 0 };

    const handlePointerMove = (clientX, rect, svgWidth) => {
        const relativeX = (clientX / rect.width) * svgWidth;
        let closestIdx = 0;
        let minDiff = Infinity;
        points.forEach((p, idx) => {
            const diff = Math.abs(p.x - relativeX);
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = idx;
            }
        });
        setActiveIndex(closestIdx);
    };

    const handleMouseMove = (e) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        handlePointerMove(clientX, rect, chartW);
    };

    const handleTouchMove = (e) => {
        if (e.touches && e.touches[0]) {
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            const clientX = e.touches[0].clientX - rect.left;
            handlePointerMove(clientX, rect, chartW);
        }
    };

    // Calculate clamped tooltip coordinates
    const tooltipX = Math.max(10, Math.min(chartW - 130, activePoint.x - 60));
    const isNearTop = activePoint.y < 50;
    const tooltipY = isNearTop ? activePoint.y + 15 : activePoint.y - 42;

    return (
        <div className="chart-container" style={{ position: 'relative', width: '100%' }}>
            <svg 
                viewBox={`0 0 ${chartW} ${height}`} 
                className="line-chart-svg"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                style={{ cursor: 'crosshair', overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id="smoothAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                </defs>

                {/* Subgrid horizontal lines */}
                {[0, 0.5, 1].map((frac, i) => {
                    const y = chartH - frac * (chartH - paddingY * 2) - paddingY;
                    return (
                        <line key={i} x1={paddingX} y1={y} x2={chartW - paddingX} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                    );
                })}

                {/* Area fill */}
                {areaD && <path d={areaD} fill="url(#smoothAreaGrad)" />}

                {/* Curve Line */}
                {pathD && <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                {/* Vertical Indicator Guide Line */}
                {points.length > 0 && (
                    <line 
                        x1={activePoint.x} 
                        y1={paddingY} 
                        x2={activePoint.x} 
                        y2={chartH} 
                        stroke="var(--text-dim)" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                        opacity="0.6"
                    />
                )}

                {/* Intersect Tooltip Point */}
                {points.length > 0 && (
                    <g style={{ transition: 'all 0.1s ease-out' }}>
                        <circle cx={activePoint.x} cy={activePoint.y} r="6" fill="#FFFFFF" stroke={color} strokeWidth="3" />
                        {/* Tooltip box */}
                        <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                            <rect width="120" height="32" rx="6" fill="#1C1B1F" opacity="0.9" />
                            <text x="60" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="500" opacity="0.8">
                                {activeData.date || activeData.label || 'Revenue'}
                            </text>
                            <text x="60" y="24" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700">
                                ₹{Math.round(activeData.value).toLocaleString('en-IN')}
                            </text>
                        </g>
                    </g>
                )}

                {/* Labels */}
                {points.map((p, i) => (
                    <g key={i}>
                        {(data.length <= 12 || i % Math.ceil(data.length / 8) === 0) && (
                            <text x={p.x} y={chartH + 12} textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontWeight="500">
                                {data[i].label}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        </div>
    );
}

// Fallback images map if menu items don't have images uploaded
const getItemImageFallback = (name, index) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('burger')) {
        return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop';
    } else if (lowerName.includes('pizza')) {
        return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop';
    } else if (lowerName.includes('coffee') || lowerName.includes('tea') || lowerName.includes('drink') || lowerName.includes('shake')) {
        return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop';
    } else if (lowerName.includes('tikka') || lowerName.includes('paneer') || lowerName.includes('curry')) {
        return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&auto=format&fit=crop';
    } else if (lowerName.includes('sandwich') || lowerName.includes('bread') || lowerName.includes('toast')) {
        return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&auto=format&fit=crop';
    } else if (lowerName.includes('salad')) {
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&auto=format&fit=crop';
    } else if (lowerName.includes('fries') || lowerName.includes('potato') || lowerName.includes('finger')) {
        return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=200&auto=format&fit=crop'; // fallback
};

// ─── Main Analytics Page ────────────────────────────────
export default function AnalyticsPage() {
    const restaurantId = useAuthStore((s) => s.restaurantId);
    
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const availableMonths = [];
    for (let i = 0; i <= currentMonthIdx; i++) {
        availableMonths.push({
            index: i,
            name: monthNames[i],
            year: currentYear
        });
    }

    const [range, setRange] = useState(() => `month-${new Date().getMonth()}`);
    const [stats, setStats] = useState({
        revenue: 0,
        revenueTrendPct: 0,
        orderCount: 0,
        ordersTrendPct: 0,
        avgOrderValue: 0,
        avgMonthlyRevenue: 0,
        topItems: [],
        revenueTrend: [],
        peakHours: [],
        categoryBreakdown: [],
        tableLeaderboard: [],
        vegPercentage: 50,
    });
    const [loading, setLoading] = useState(true);
    const [trendingIndex, setTrendingIndex] = useState(0);

    useEffect(() => {
        setTrendingIndex(0);
    }, [range]);

    useEffect(() => {
        if (!restaurantId) return;
        setLoading(true);
        fetchAnalytics();
    }, [restaurantId, range]);

    async function fetchAnalytics() {
        try {
            const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
            const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
            
            // ── Fetch Menu Items Map (To get actual uploaded images, categories, isVeg) ──
            const menuSnap = await getDocs(menuRef);
            const menuItemsMap = {};
            menuSnap.docs.forEach(doc => {
                const data = doc.data();
                menuItemsMap[doc.id] = {
                    image: data.image || null,
                    category: data.category || 'Other',
                    price: data.price || 0,
                    isVeg: data.isVeg !== undefined ? data.isVeg : true
                };
            });

            const now = new Date();
            let startDate;
            let endDate = now;
            let prevStartDate;
            let prevEndDate;

            if (range === 'today') {
                startDate = getStartOfDay(now);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                
                prevStartDate = new Date(startDate);
                prevStartDate.setDate(prevStartDate.getDate() - 1);
                prevEndDate = new Date(endDate);
                prevEndDate.setDate(prevEndDate.getDate() - 1);
            } else if (range === 'week') {
                startDate = getStartOfWeek(now);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                
                prevStartDate = new Date(startDate);
                prevStartDate.setDate(prevStartDate.getDate() - 7);
                prevEndDate = new Date(endDate);
                prevEndDate.setDate(prevEndDate.getDate() - 7);
            } else if (range.startsWith('month-')) {
                const monthIdx = parseInt(range.split('-')[1], 10);
                startDate = new Date(now.getFullYear(), monthIdx, 1, 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), monthIdx + 1, 0, 23, 59, 59, 999);
                
                prevStartDate = new Date(now.getFullYear(), monthIdx - 1, 1, 0, 0, 0, 0);
                prevEndDate = new Date(now.getFullYear(), monthIdx, 0, 23, 59, 59, 999);
            } else {
                startDate = getStartOfMonth(now);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                
                prevStartDate = new Date(startDate);
                prevStartDate.setMonth(prevStartDate.getMonth() - 1);
                prevEndDate = new Date(endDate);
                prevEndDate.setMonth(prevEndDate.getMonth() - 1);
            }

            const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            const startTs = Timestamp.fromDate(startOfYear);
            const endTs = Timestamp.fromDate(endDate);
            
            const q = query(
                ordersRef, 
                where('orderedAt', '>=', startTs), 
                where('orderedAt', '<=', endTs), 
                orderBy('orderedAt', 'asc')
            );
            const snap = await getDocs(q);
            const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Split into current period, previous period, and monthly revenues
            const currentPeriodOrders = [];
            const previousPeriodOrders = [];
            const monthlyRevenues = Array(12).fill(0);

            const startMs = startDate.getTime();
            const endMs = endDate.getTime();
            const prevStartMs = prevStartDate.getTime();
            const prevEndMs = prevEndDate.getTime();

            allOrders.forEach(o => {
                const date = o.orderedAt.toDate ? o.orderedAt.toDate() : new Date(o.orderedAt);
                const time = date.getTime();
                
                if (date.getFullYear() === now.getFullYear()) {
                    monthlyRevenues[date.getMonth()] += o.total || 0;
                }

                if (time >= startMs && time <= endMs) {
                    currentPeriodOrders.push(o);
                } else if (time >= prevStartMs && time <= prevEndMs) {
                    previousPeriodOrders.push(o);
                }
            });

            // Calculate current period stats
            const currentRevenue = currentPeriodOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            const currentOrders = currentPeriodOrders.length;
            const currentAvg = currentOrders > 0 ? currentRevenue / currentOrders : 0;

            // Calculate previous period stats
            const prevRevenue = previousPeriodOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            const prevOrders = previousPeriodOrders.length;

            // Calculate percentage trends
            let revenueTrendPct = 0;
            if (prevRevenue > 0) {
                revenueTrendPct = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
            } else if (currentRevenue > 0) {
                revenueTrendPct = 100;
            }

            let ordersTrendPct = 0;
            if (prevOrders > 0) {
                ordersTrendPct = ((currentOrders - prevOrders) / prevOrders) * 100;
            } else if (currentOrders > 0) {
                ordersTrendPct = 100;
            }

            const activeMonths = monthlyRevenues.filter((rev, idx) => idx <= now.getMonth());
            const avgMonthlyRevenue = activeMonths.reduce((sum, r) => sum + r, 0) / Math.max(activeMonths.length, 1);

            const revenueTrendArray = buildRevenueTrend(currentPeriodOrders, range, startDate, endDate);

            // ── Peak Hours ──
            const hourCounts = Array(24).fill(0);
            currentPeriodOrders.forEach(o => {
                if (o.orderedAt) {
                    const date = o.orderedAt.toDate ? o.orderedAt.toDate() : new Date(o.orderedAt);
                    hourCounts[date.getHours()]++;
                }
            });
            const peakHours = [];
            for (let h = 8; h <= 23; h++) {
                peakHours.push({
                    label: `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`,
                    value: hourCounts[h],
                });
            }

            // ── Category Breakdown ──
            const catCounts = {};
            currentPeriodOrders.forEach(o => {
                if (o.items && Array.isArray(o.items)) {
                    o.items.forEach(item => {
                        const id = item.itemId || '';
                        const cat = menuItemsMap[id]?.category || item.category || 'Other';
                        const categoryFormatted = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase().trim();
                        catCounts[categoryFormatted] = (catCounts[categoryFormatted] || 0) + (item.quantity || 1);
                    });
                }
            });
            
            const totalCatItems = Object.values(catCounts).reduce((a, b) => a + b, 0);
            const categoryBreakdown = Object.entries(catCounts)
                .map(([label, value]) => ({ 
                    label, 
                    value,
                    percentage: totalCatItems > 0 ? Math.round((value / totalCatItems) * 100) : 0
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 4);

            // ── Veg vs Non-veg Breakdown ──
            let vegCount = 0;
            let nonVegCount = 0;
            currentPeriodOrders.forEach(o => {
                if (o.items && Array.isArray(o.items)) {
                    o.items.forEach(item => {
                        const id = item.itemId || '';
                        const isVeg = menuItemsMap[id]?.isVeg ?? true;
                        if (isVeg) vegCount += item.quantity || 1;
                        else nonVegCount += item.quantity || 1;
                    });
                }
            });
            const vegPercentage = (vegCount + nonVegCount) > 0 ? Math.round((vegCount / (vegCount + nonVegCount)) * 100) : 50;

            // ── Table Activity Leaderboard ──
            const tableStats = {};
            currentPeriodOrders.forEach(o => {
                const t = o.tableNumber ? `Table ${o.tableNumber}` : 'Takeaway';
                if (!tableStats[t]) {
                    tableStats[t] = { table: t, orders: 0, revenue: 0 };
                }
                tableStats[t].orders++;
                tableStats[t].revenue += o.total || 0;
            });
            const tableLeaderboard = Object.values(tableStats)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            // ── Top Items (Trending) ──
            const itemCounts = {};
            currentPeriodOrders.forEach(o => {
                if (o.items && Array.isArray(o.items)) {
                    o.items.forEach(item => {
                        const id = item.itemId || '';
                        const name = item.name || 'Unknown';
                        if (!itemCounts[name]) {
                            itemCounts[name] = { 
                                name, 
                                count: 0, 
                                revenue: 0, 
                                image: menuItemsMap[id]?.image || null,
                                price: menuItemsMap[id]?.price || item.price || 0,
                            };
                        }
                        itemCounts[name].count += item.quantity || 1;
                        itemCounts[name].revenue += item.subtotal || 0;
                        if (menuItemsMap[id]?.image) {
                            itemCounts[name].image = menuItemsMap[id].image;
                        }
                    });
                }
            });
            const topItems = Object.values(itemCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 8);

            setStats({
                revenue: currentRevenue,
                revenueTrendPct: revenueTrendPct,
                orderCount: currentOrders,
                ordersTrendPct: ordersTrendPct,
                avgOrderValue: currentAvg,
                avgMonthlyRevenue: avgMonthlyRevenue,
                topItems,
                revenueTrend: revenueTrendArray,
                peakHours,
                categoryBreakdown,
                tableLeaderboard,
                vegPercentage,
            });
        } catch (err) {
            console.error('Analytics error:', err);
        } finally {
            setLoading(false);
        }
    }

    function buildRevenueTrend(orders, range, startDate, now) {
        if (range === 'today') {
            const hourly = {};
            for (let h = 8; h <= 23; h++) {
                hourly[h] = 0;
            }
            orders.forEach(o => {
                if (o.orderedAt && o.total) {
                    const date = o.orderedAt.toDate ? o.orderedAt.toDate() : new Date(o.orderedAt);
                    const h = date.getHours();
                    if (hourly[h] !== undefined) hourly[h] += o.total;
                }
            });
            return Object.entries(hourly).map(([h, val]) => {
                const label = `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`;
                return {
                    label,
                    date: `Today, ${label}`,
                    value: Math.round(val),
                };
            });
        } else if (range === 'week') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const daily = {};
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(d.getDate() + i);
                const dateStr = formatDate(d);
                daily[dateStr] = { label: days[d.getDay()], date: dateStr, value: 0 };
            }
            orders.forEach(o => {
                if (o.orderedAt && o.total) {
                    const date = o.orderedAt.toDate ? o.orderedAt.toDate() : new Date(o.orderedAt);
                    const key = formatDate(date);
                    if (daily[key]) daily[key].value += o.total;
                }
            });
            return Object.values(daily).map(d => ({ ...d, value: Math.round(d.value) }));
        } else {
            const dailyMap = {};
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(now.getFullYear(), now.getMonth(), i);
                const dateStr = formatDate(d);
                dailyMap[dateStr] = { label: `${i}`, date: dateStr, value: 0 };
            }
            orders.forEach(o => {
                if (o.orderedAt && o.total) {
                    const date = o.orderedAt.toDate ? o.orderedAt.toDate() : new Date(o.orderedAt);
                    const key = formatDate(date);
                    if (dailyMap[key]) dailyMap[key].value += o.total;
                }
            });
            return Object.values(dailyMap).map(d => ({ ...d, value: Math.round(d.value) }));
        }
    }

    const trendingItems = stats.topItems.map((item, index) => {
        return {
            name: item.name,
            orders: item.count,
            price: item.price,
            image: item.image || getItemImageFallback(item.name, index),
        };
    });

    const currentTrendingItem = trendingItems[trendingIndex] || null;

    const nextTrending = () => {
        if (trendingItems.length > 0) {
            setTrendingIndex((prev) => (prev + 1) % trendingItems.length);
        }
    };

    const prevTrending = () => {
        if (trendingItems.length > 0) {
            setTrendingIndex((prev) => (prev - 1 + trendingItems.length) % trendingItems.length);
        }
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="loader-spinner"></div>
                <p>Crunching numbers...</p>
            </div>
        );
    }

    const barColors = ['bg-orange', 'bg-blue', 'bg-purple', 'bg-green'];

    const getTrendSubtext = () => {
        if (range === 'today') return 'vs yesterday';
        if (range === 'week') return 'vs previous week';
        return 'vs previous month';
    };

    const currentMonthName = monthNames[new Date().getMonth()];

    return (
        <div className="analytics-page dashboard-theme">
            {/* Header Component */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1 className="dashboard-title">Analytics</h1>
                </div>
            </header>

            {/* Sub-header Filter Bar */}
            <div className="analytics-filter-bar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '22px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 24px',
                boxShadow: 'var(--shadow)',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div className="filter-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span className="filter-label" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Date Range:</span>
                    <div className="range-buttons" style={{ display: 'flex', background: 'var(--bg)', padding: '4px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)', gap: '4px', alignItems: 'center' }}>
                        <button 
                            className="range-tab-btn"
                            style={{
                                background: range === 'today' ? 'var(--surface)' : 'transparent',
                                border: 'none',
                                padding: '6px 18px',
                                fontSize: '12px',
                                fontWeight: 700,
                                borderRadius: 'var(--radius-pill)',
                                cursor: 'pointer',
                                color: range === 'today' ? 'var(--accent)' : 'var(--text-muted)',
                                boxShadow: range === 'today' ? '0 2px 8px rgba(139, 115, 85, 0.06)' : 'none',
                                transition: 'all var(--transition)'
                            }}
                            onClick={() => setRange('today')}
                        >
                            Today
                        </button>
                        <button 
                            className="range-tab-btn"
                            style={{
                                background: range === 'week' ? 'var(--surface)' : 'transparent',
                                border: 'none',
                                padding: '6px 18px',
                                fontSize: '12px',
                                fontWeight: 700,
                                borderRadius: 'var(--radius-pill)',
                                cursor: 'pointer',
                                color: range === 'week' ? 'var(--accent)' : 'var(--text-muted)',
                                boxShadow: range === 'week' ? '0 2px 8px rgba(139, 115, 85, 0.06)' : 'none',
                                transition: 'all var(--transition)'
                            }}
                            onClick={() => setRange('week')}
                        >
                            This Week
                        </button>
                        
                        {/* Select Dropdown for Months */}
                        <select
                            value={range.startsWith('month-') ? range : `month-${new Date().getMonth()}`}
                            onChange={(e) => setRange(e.target.value)}
                            style={{
                                background: range.startsWith('month-') ? 'var(--surface)' : 'transparent',
                                border: 'none',
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 700,
                                borderRadius: 'var(--radius-pill)',
                                cursor: 'pointer',
                                color: range.startsWith('month-') ? 'var(--accent)' : 'var(--text-muted)',
                                boxShadow: range.startsWith('month-') ? '0 2px 8px rgba(139, 115, 85, 0.06)' : 'none',
                                transition: 'all var(--transition)',
                                outline: 'none',
                                fontFamily: 'var(--font)'
                            }}
                        >
                            {availableMonths.map((m) => (
                                <option key={m.index} value={`month-${m.index}`}>
                                    {m.index === new Date().getMonth() ? `This Month (${m.name})` : m.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="filter-right">
                    <span className="last-updated" style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 500 }}>
                        Last updated: {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                
                {/* Left/Center Column */}
                <div className="dashboard-left-col">
                    
                    {/* Top Stats Cards */}
                    <div className="metrics-row">
                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-title">Total Revenue</span>
                                <span className="metric-icon revenue-bg">🪙</span>
                            </div>
                            <div className="metric-body">
                                <h2 className="metric-value">₹{stats.revenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</h2>
                                <div className={`metric-trend ${stats.revenueTrendPct >= 0 ? 'trend-up' : 'trend-down'}`}>
                                    <span className="trend-arrow">{stats.revenueTrendPct >= 0 ? '↗' : '↘'}</span>
                                    <span className="trend-percentage">{Math.abs(stats.revenueTrendPct).toFixed(1)}%</span>
                                    <span className="trend-subtext">{getTrendSubtext()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-title">Total Customers</span>
                                <span className="metric-icon customers-bg">👥</span>
                            </div>
                            <div className="metric-body">
                                <h2 className="metric-value">{Math.round(stats.orderCount * 2.4).toLocaleString('en-IN')}</h2>
                                <div className={`metric-trend ${stats.ordersTrendPct >= 0 ? 'trend-up' : 'trend-down'}`}>
                                    <span className="trend-arrow">{stats.ordersTrendPct >= 0 ? '↗' : '↘'}</span>
                                    <span className="trend-percentage">{Math.abs(stats.ordersTrendPct).toFixed(1)}%</span>
                                    <span className="trend-subtext">{getTrendSubtext()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-title">Total Orders</span>
                                <span className="metric-icon orders-bg">📋</span>
                            </div>
                            <div className="metric-body">
                                <h2 className="metric-value">{stats.orderCount}</h2>
                                <div className={`metric-trend ${stats.ordersTrendPct >= 0 ? 'trend-up' : 'trend-down'}`}>
                                    <span className="trend-arrow">{stats.ordersTrendPct >= 0 ? '↗' : '↘'}</span>
                                    <span className="trend-percentage">{Math.abs(stats.ordersTrendPct).toFixed(1)}%</span>
                                    <span className="trend-subtext">{getTrendSubtext()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Revenue Card */}
                    <div className="monthly-revenue-card">
                        <div className="monthly-rev-header">
                            <div className="monthly-rev-title-area">
                                <h3 className="card-sec-title">Revenue Analysis</h3>
                                <div className="avg-monthly-value-box">
                                    <span className="avg-monthly-label">Average Monthly Income ({currentYear})</span>
                                    <h2 className="avg-monthly-value">₹{stats.avgMonthlyRevenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</h2>
                                    <div className={`monthly-growth ${stats.revenueTrendPct >= 0 ? 'trend-up' : 'trend-down'}`}>
                                        <span className="trend-arrow">{stats.revenueTrendPct >= 0 ? '↗' : '↘'}</span>
                                        <span className="trend-percentage">{Math.abs(stats.revenueTrendPct).toFixed(1)}%</span>
                                        <span className="trend-subtext">vs previous period</span>
                                    </div>
                                </div>
                            </div>
                            <div className="monthly-rev-chart-labels">
                                <span className="income-badge">Total income</span>
                                <h4 className="income-value">₹{stats.revenue.toLocaleString('en-IN', {maximumFractionDigits:0})}</h4>
                            </div>
                        </div>

                        <div className="bezier-chart-container">
                            <SmoothLineChart data={stats.revenueTrend} color="#E8A54B" height={180} />
                        </div>
                    </div>

                    {/* Bottom Row Grid */}
                    <div className="bottom-row-grid">
                        
                        {/* Category Popularity (Replaces Customers by Location) */}
                        <div className="location-card">
                            <h3 className="card-sec-title">Category Popularity</h3>
                            <div className="location-list">
                                {stats.categoryBreakdown.length > 0 ? (
                                    stats.categoryBreakdown.map((cat, i) => (
                                        <div className="location-item" key={cat.label}>
                                            <div className="location-meta">
                                                <span className="loc-name">{cat.label}</span>
                                                <span className="loc-val">{cat.value} items ({cat.percentage}%)</span>
                                            </div>
                                            <div className="loc-bar-bg">
                                                <div className={`loc-bar-fill ${barColors[i % barColors.length]}`} style={{ width: `${cat.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="chart-empty">No category data yet</div>
                                )}
                            </div>
                        </div>

                        {/* Trending Orders Slider (Rating Removed, Uploaded Image Enabled) */}
                        <div className="trending-card">
                            <div className="trending-header">
                                <h3 className="card-sec-title">Trending Orders</h3>
                                <div className="slider-arrows">
                                    <button className="arrow-btn" onClick={prevTrending}>←</button>
                                    <button className="arrow-btn" onClick={nextTrending}>→</button>
                                </div>
                            </div>
                            
                            <div className="trending-items-slider">
                                {currentTrendingItem ? (
                                    <div className="trending-item-card-inner">
                                        <div className="trending-img-container">
                                            <img src={currentTrendingItem.image} alt={currentTrendingItem.name} />
                                        </div>
                                        <h4 className="trending-item-name">{currentTrendingItem.name}</h4>
                                        <div className="trending-item-meta">
                                            <span className="trending-price">₹{currentTrendingItem.price}</span>
                                            <span className="trending-orders-count">Orders {currentTrendingItem.orders}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="chart-empty">No orders items yet</div>
                                )}
                            </div>
                        </div>

                        {/* Veg vs Non-Veg Preferences split (Moved in parallel to Trending Orders) */}
                        <div className="location-card">
                            <h3 className="card-sec-title">Dietary Preference</h3>
                            <div className="location-list" style={{ gap: '16px' }}>
                                <div className="location-item">
                                    <div className="location-meta">
                                        <span className="loc-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }}></span> Veg orders
                                        </span>
                                        <span className="loc-val" style={{ color: '#4CAF50', fontWeight: 700 }}>{stats.vegPercentage}%</span>
                                    </div>
                                    <div className="loc-bar-bg">
                                        <div className="loc-bar-fill" style={{ width: `${stats.vegPercentage}%`, background: '#4CAF50' }}></div>
                                    </div>
                                </div>
                                <div className="location-item">
                                    <div className="location-meta">
                                        <span className="loc-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E74C3C' }}></span> Non-Veg orders
                                        </span>
                                        <span className="loc-val" style={{ color: '#E74C3C', fontWeight: 700 }}>{100 - stats.vegPercentage}%</span>
                                    </div>
                                    <div className="loc-bar-bg">
                                        <div className="loc-bar-fill" style={{ width: `${100 - stats.vegPercentage}%`, background: '#E74C3C' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Leaderboard only) */}
                <div className="dashboard-right-col">
                    {/* Busy Tables Leaderboard with scroll bar */}
                    <div className="team-card" style={{ minHeight: 'auto', marginBottom: '20px' }}>
                        <h3 className="card-sec-title" style={{ marginBottom: '12px' }}>Table Activity</h3>
                        <div className="team-list" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                            {stats.tableLeaderboard.length > 0 ? (
                                stats.tableLeaderboard.map((t, idx) => (
                                    <div key={t.table} className="team-member-item" style={{ paddingBottom: '10px', marginBottom: '4px' }}>
                                        <div className="footer-metric-icon" style={{ borderRadius: '50%', background: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700, fontSize: '12px', width: '32px', height: '32px' }}>
                                            #{idx + 1}
                                        </div>
                                        <div className="member-info">
                                            <span className="member-name">{t.table}</span>
                                            <span className="member-role">{t.orders} orders placed</span>
                                        </div>
                                        <span className="trending-price" style={{ fontSize: '13px' }}>
                                            ₹{t.revenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="chart-empty">No tables active yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
