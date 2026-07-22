import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { encodeOrderToken, getCustomerAppUrl } from '../utils/tokenUtils';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    query,
    where,
    getDoc,
    onSnapshot,
    arrayUnion,
    increment,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import useAuthStore from '../store/authStore';

// FSSAI Standard Veg / Non-Veg Indicator Badge
function VegBadge({ isVeg = true, size = 'md' }) {
    const isSmall = size === 'sm';
    const boxSize = isSmall ? '13px' : '15px';
    const dotSize = isSmall ? '5px' : '6px';
    const color = isVeg ? '#10B981' : '#EF4444';

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: boxSize,
                height: boxSize,
                border: `2px solid ${color}`,
                borderRadius: '3px',
                flexShrink: 0,
                boxSizing: 'border-box',
                backgroundColor: 'transparent',
            }}
            title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
        >
            <span
                style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: '50%',
                    backgroundColor: color,
                    display: 'block',
                }}
            />
        </span>
    );
}

export default function TablesPage() {
    const restaurantId = useAuthStore((s) => s.restaurantId);
    const restaurantName = useAuthStore((s) => s.restaurantName);
    const [tableCount, setTableCount] = useState(0);
    const [sessions, setSessions] = useState({});
    const [selectedTable, setSelectedTable] = useState(null);
    const [tableOrders, setTableOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Modal state for adding items to table directly from dashboard
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const [menuSearch, setMenuSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [addItemCart, setAddItemCart] = useState({});
    const [addingToBill, setAddingToBill] = useState(false);

    // Custom confirm modal state (replacing native browser alerts)
    const [confirmCloseTable, setConfirmCloseTable] = useState(null);
    const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);

    const customerAppUrl = getCustomerAppUrl();




    useEffect(() => {
        // Load saved table count from Firestore
        const loadTableCount = async () => {
            try {
                const restDoc = await getDoc(doc(db, 'restaurants', restaurantId));
                if (restDoc.exists() && restDoc.data().tableCount) {
                    setTableCount(restDoc.data().tableCount);
                } else {
                    setTableCount(10); // default
                }
            } catch {
                setTableCount(10);
            }
        };
        loadTableCount();

        // Real-time listener for sessions
        if (!restaurantId) return;
        const sessionsRef = collection(db, 'restaurants', restaurantId, 'sessions');
        const q = query(sessionsRef, where('status', '==', 'active'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessionMap = {};
            snapshot.docs.forEach((d) => {
                const data = d.data();
                sessionMap[data.tableNumber] = { id: d.id, ...data };
            });
            setSessions(sessionMap);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to sessions:", error);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    const handleTableCountChange = async (value) => {
        const count = parseInt(value) || 1;
        setTableCount(count);
        // Save to Firestore
        try {
            await setDoc(doc(db, 'restaurants', restaurantId), { tableCount: count }, { merge: true });
        } catch (err) {
            console.error('Error saving table count:', err);
        }
    };

    // When a table is selected, fetch its orders
    useEffect(() => {
        if (selectedTable && sessions[selectedTable]) {
            fetchTableOrders(sessions[selectedTable]);
        } else {
            setTableOrders([]);
        }
    }, [selectedTable, sessions]);



    const fetchTableOrders = async (session) => {
        if (!session.orderIds || session.orderIds.length === 0) {
            setTableOrders([]);
            return;
        }
        setOrdersLoading(true);
        try {
            const orders = [];
            for (const orderId of session.orderIds) {
                const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
                const orderSnap = await getDoc(orderRef);
                if (orderSnap.exists()) {
                    orders.push({ id: orderSnap.id, ...orderSnap.data() });
                }
            }
            setTableOrders(orders);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const executeCloseSession = async (tableNum) => {
        const session = sessions[tableNum];
        if (!session) return;

        // Print bill automatically before closing
        printBill(tableNum);

        try {
            // 1. Close the session
            const sessionRef = doc(db, 'restaurants', restaurantId, 'sessions', session.id);
            await updateDoc(sessionRef, {
                status: 'closed',
                endedAt: new Date(),
                paidAt: new Date(),
            });

            // 2. Mark all orders in this session as 'closed' so they leave Live Orders
            if (session.orderIds && session.orderIds.length > 0) {
                const updatePromises = session.orderIds.map((orderId) => {
                    const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
                    return updateDoc(orderRef, { status: 'closed' });
                });
                await Promise.all(updatePromises);
            }

            setSelectedTable(null);
            setConfirmCloseTable(null);
        } catch (err) {
            console.error('Error closing session:', err);
        }
    };

    const executeDeleteItem = async (order, itemIndex) => {
        const session = sessions[selectedTable];
        if (!session) return;

        const itemToRemove = order.items[itemIndex];
        const newItems = order.items.filter((_, i) => i !== itemIndex);

        // Calculate deltas
        const deltaSubtotal = itemToRemove.subtotal;
        const deltaTax = deltaSubtotal * 0.05;
        const deltaTotal = deltaSubtotal + deltaTax;

        try {
            const orderRef = doc(db, 'restaurants', restaurantId, 'orders', order.id);
            const sessionRef = doc(db, 'restaurants', restaurantId, 'sessions', session.id);

            // Update Order
            const newOrderSubtotal = (order.subtotal || 0) - deltaSubtotal;
            const newOrderTax = (order.tax || 0) - deltaTax;
            const newOrderTotal = (order.total || 0) - deltaTotal;

            if (newItems.length === 0) {
                await updateDoc(orderRef, {
                    items: [],
                    status: 'cancelled',
                    subtotal: 0, tax: 0, total: 0
                });
            } else {
                await updateDoc(orderRef, {
                    items: newItems,
                    subtotal: newOrderSubtotal,
                    tax: newOrderTax,
                    total: newOrderTotal
                });
            }

            // Update Session
            await updateDoc(sessionRef, {
                total: (session.total || 0) - deltaTotal,
                subtotal: (session.subtotal || 0) - deltaSubtotal,
                tax: (session.tax || 0) - deltaTax
            });

            setConfirmDeleteItem(null);
        } catch (err) {
            console.error("Error deleting item:", err);
        }
    };

    const loadMenuItems = async () => {
        if (!restaurantId) return;
        setMenuLoading(true);
        try {
            const ref = collection(db, 'restaurants', restaurantId, 'menuItems');
            const snap = await getDocs(ref);
            setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Error fetching menu items:', err);
        } finally {
            setMenuLoading(false);
        }
    };

    const openAddItemModal = () => {
        setShowAddItemModal(true);
        setAddItemCart({});
        setMenuSearch('');
        setSelectedCategory('all');
        loadMenuItems();
    };

    const handleUpdateCartQty = (item, delta) => {
        const key = item.id;
        setAddItemCart(prev => {
            const current = prev[key] || { item, quantity: 0, price: parseFloat(item.price) || 0 };
            const newQty = Math.max(0, current.quantity + delta);
            if (newQty === 0) {
                const next = { ...prev };
                delete next[key];
                return next;
            }
            return {
                ...prev,
                [key]: { item, quantity: newQty, price: parseFloat(item.price) || 0 }
            };
        });
    };

    const handleAddItemsToBill = async () => {
        const cartEntries = Object.values(addItemCart);
        if (cartEntries.length === 0 || !selectedTable) return;
        setAddingToBill(true);

        try {
            let session = sessions[selectedTable];
            let sessionId = session?.id;

            // 1. If no active session, create one
            if (!session) {
                const sessionRef = doc(collection(db, 'restaurants', restaurantId, 'sessions'));
                sessionId = sessionRef.id;
                await setDoc(sessionRef, {
                    tableNumber: selectedTable,
                    status: 'active',
                    orderIds: [],
                    subtotal: 0,
                    tax: 0,
                    total: 0,
                    startedAt: serverTimestamp(),
                });
            }

            // 2. Prepare items for order
            const orderItems = cartEntries.map(({ item, quantity, price }) => ({
                itemId: item.id,
                name: item.name,
                quantity,
                price,
                subtotal: price * quantity,
                isVeg: item.isVeg !== false,
                addedBy: 'staff',
            }));

            const orderSubtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
            const orderTax = orderSubtotal * 0.05;
            const orderTotal = orderSubtotal + orderTax;

            // 3. Create Order
            const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
            const newOrderRef = await addDoc(ordersRef, {
                tableNumber: selectedTable,
                sessionId,
                items: orderItems,
                status: 'accepted',
                subtotal: orderSubtotal,
                tax: orderTax,
                total: orderTotal,
                orderedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                addedBy: 'staff',
            });

            // 4. Update Session totals and orderIds
            const sessionRef = doc(db, 'restaurants', restaurantId, 'sessions', sessionId);
            await updateDoc(sessionRef, {
                orderIds: arrayUnion(newOrderRef.id),
                subtotal: increment(orderSubtotal),
                tax: increment(orderTax),
                total: increment(orderTotal),
            });

            setShowAddItemModal(false);
            setAddItemCart({});
        } catch (err) {
            console.error('Error adding items to table order:', err);
            alert('Failed to add items to order. Please try again.');
        } finally {
            setAddingToBill(false);
        }
    };

    const categories = ['all', ...new Set(menuItems.map(i => i.category).filter(Boolean))];

    const filteredMenuItems = menuItems.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
            item.category?.toLowerCase().includes(menuSearch.toLowerCase()) ||
            item.description?.toLowerCase().includes(menuSearch.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });


    const getQrUrl = (tableNum) => {
        const token = encodeOrderToken(restaurantId, tableNum);
        return `${customerAppUrl}/order?token=${token}`;
    };


    const printBill = (tableNum) => {
        const session = sessions[tableNum];
        if (!session || tableOrders.length === 0) {
            alert("No orders to print!");
            return;
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        // Build item rows from all orders
        const allItems = [];
        tableOrders.forEach((order) => {
            order.items?.forEach((item) => {
                const existing = allItems.find((i) => i.name === item.name && i.price === item.price && i.selectedVariant === item.selectedVariant);
                if (existing) {
                    existing.quantity += item.quantity;
                    existing.subtotal += item.subtotal;
                } else {
                    allItems.push({ ...item });
                }
            });
        });

        const itemRows = allItems.map((item) => `
            <tr>
                <td style="padding:6px 0;border-bottom:1px dashed #ddd;">
                    ${item.name}
                    ${item.selectedVariant ? `<br><small style="color:#666;">(${item.selectedVariant})</small>` : ''}
                </td>
                <td style="padding:6px 8px;border-bottom:1px dashed #ddd;text-align:center;">${item.quantity}</td>
                <td style="padding:6px 0;border-bottom:1px dashed #ddd;text-align:right;">₹${item.subtotal?.toFixed(2)}</td>
            </tr>
        `).join('');

        const billHTML = `
        <html>
        <head>
            <title>Bill - Table ${tableNum}</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body {
                    font-family: 'Courier New', monospace;
                    max-width: 320px;
                    margin: 0 auto;
                    padding: 20px 16px;
                    color: #111;
                }
                .header { text-align:center; margin-bottom:16px; }
                .header h1 { font-size:20px; margin-bottom:2px; }
                .header p { font-size:11px; color:#555; }
                .divider { border:none; border-top:1px dashed #999; margin:10px 0; }
                .info-row { display:flex; justify-content:space-between; font-size:12px; color:#444; margin-bottom:4px; }
                table { width:100%; border-collapse:collapse; font-size:13px; margin:8px 0; }
                th { text-align:left; font-size:11px; color:#666; padding-bottom:6px; border-bottom:2px solid #333; }
                th:nth-child(2) { text-align:center; }
                th:last-child { text-align:right; }
                .summary { margin-top:8px; }
                .summary-row { display:flex; justify-content:space-between; font-size:13px; padding:3px 0; }
                .summary-row.total { font-size:16px; font-weight:bold; border-top:2px solid #333; padding-top:8px; margin-top:6px; }
                .footer { text-align:center; margin-top:24px; font-size:14px; font-weight:bold; letter-spacing:0.5px; }
                .footer-sub { text-align:center; font-size:10px; color:#888; margin-top:4px; }
                @media print {
                    body { padding:0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${restaurantName || 'Restaurant'}</h1>
                <p>Tax Invoice / Bill of Supply</p>
            </div>

            <hr class="divider" />

            <div class="info-row"><span>Table: ${tableNum}</span><span>Date: ${dateStr}</span></div>
            <div class="info-row"><span>Bill #: ${session.id?.slice(-6).toUpperCase()}</span><span>Time: ${timeStr}</span></div>

            <hr class="divider" />

            <table>
                <thead>
                    <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
                </thead>
                <tbody>
                    ${itemRows}
                </tbody>
            </table>

            <div class="summary">
                <div class="summary-row"><span>Subtotal</span><span>₹${session.subtotal?.toFixed(2)}</span></div>
                <div class="summary-row"><span>GST (5%)</span><span>₹${session.tax?.toFixed(2)}</span></div>
                <div class="summary-row total"><span>Total</span><span>₹${session.total?.toFixed(2)}</span></div>
            </div>

            <hr class="divider" />

            <div class="footer">✨ Please Visit Again ✨</div>
            <div class="footer-sub">Thank you for dining with us!</div>
        </body>
        </html>
        `;

        // Use iframe printing to bypass popup blockers entirely
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        iframe.contentDocument.write(billHTML);
        iframe.contentDocument.close();

        iframe.onload = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 2000);
        };
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="loader-spinner"></div>
                <p>Loading tables...</p>
            </div>
        );
    }

    const currentSession = selectedTable ? sessions[selectedTable] : null;

    return (
        <div className="tables-page">
            <div className="page-header">
                <h1>Tables & QR Codes</h1>
                <div className="table-count-control">
                    <label>Tables: </label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={tableCount}
                        onChange={(e) => handleTableCountChange(e.target.value)}
                        className="table-count-input"
                    />
                </div>
            </div>

            {/* Tables Grid */}
            <div className="tables-grid">
                {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => {
                    const hasSession = !!sessions[num];
                    return (
                        <div
                            key={num}
                            className={`table-card ${hasSession ? 'occupied' : 'available'} ${selectedTable === num ? 'selected' : ''}`}
                            onClick={() => setSelectedTable(selectedTable === num ? null : num)}
                        >
                            <span className="table-num">T{num}</span>
                            <span className={`table-status ${hasSession ? 'occupied' : 'available'}`}>
                                {hasSession ? `₹${sessions[num].total?.toFixed(0) || 0}` : 'Free'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Selected Table Detail */}
            {selectedTable && (
                <div className="table-detail">
                    <div className="table-detail-header">
                        <h2>Table {selectedTable}</h2>
                        {currentSession && (
                            <div className="table-actions" style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="print-bill-btn"
                                    onClick={() => printBill(selectedTable)}
                                    style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                                >
                                    🖨️ Print Bill
                                </button>
                                <button className="close-bill-btn" onClick={() => setConfirmCloseTable(selectedTable)}>
                                    Close Bill — ₹{currentSession.total?.toFixed(0)}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="table-detail-body">
                        {/* Left: Bill Details */}
                        <div className="bill-section">
                            {currentSession ? (
                                <>
                                    <div className="bill-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h3 className="bill-title" style={{ margin: 0 }}>📋 Bill Details</h3>
                                        <button
                                            className="add-item-btn"
                                            onClick={openAddItemModal}
                                            style={{ padding: '6px 14px', fontSize: '13px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                            title="Add Items to Table Bill"
                                        >
                                            ➕ Add Item
                                        </button>
                                    </div>

                                    {ordersLoading ? (
                                        <div className="bill-loading">Loading orders...</div>
                                    ) : tableOrders.length === 0 ? (
                                        <p className="bill-empty">No orders yet</p>
                                    ) : (
                                        <>
                                            {/* Each order */}
                                            {tableOrders.map((order, idx) => (
                                                <div key={order.id} className="bill-order">
                                                    <div className="bill-order-header">
                                                        <span className="bill-order-label">Order #{idx + 1}</span>
                                                        <span className={`status-badge ${order.status}`}>
                                                            {order.status}
                                                        </span>
                                                        <span className="bill-order-time">
                                                            {formatTime(order.orderedAt)}
                                                        </span>
                                                    </div>
                                                    <div className="bill-items">
                                                        {order.items?.map((item, i) => (
                                                            <div key={i} className="bill-item-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <VegBadge isVeg={item.isVeg !== false} size="sm" />
                                                                <span className="bill-item-qty">{item.quantity}×</span>
                                                                <span className="bill-item-name" style={{ flex: 1 }}>{item.name}</span>
                                                                <span className="bill-item-price">₹{item.subtotal}</span>
                                                                {!['ready', 'served', 'completed'].includes(order.status) && (
                                                                    <button
                                                                        onClick={() => setConfirmDeleteItem({ order, itemIndex: i, item })}
                                                                        style={{ marginLeft: '8px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
                                                                        title="Remove item"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {order.specialInstructions && (
                                                        <div className="bill-note">📝 {order.specialInstructions}</div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Bill Summary */}
                                            <div className="bill-summary">
                                                <div className="bill-summary-row">
                                                    <span>Subtotal</span>
                                                    <span>₹{currentSession.subtotal?.toFixed(0)}</span>
                                                </div>
                                                <div className="bill-summary-row">
                                                    <span>GST (5%)</span>
                                                    <span>₹{currentSession.tax?.toFixed(0)}</span>
                                                </div>
                                                <div className="bill-summary-row total">
                                                    <span>Total</span>
                                                    <span>₹{currentSession.total?.toFixed(0)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="bill-empty-state">
                                    <span className="empty-icon">✨</span>
                                    <p>Table is free — no active session</p>
                                </div>
                            )}
                        </div>

                        {/* Right: QR Code */}
                        <div className="qr-section">
                            <div className="qr-wrapper">
                                <QRCodeSVG
                                    value={getQrUrl(selectedTable)}
                                    size={180}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <p className="qr-url">{getQrUrl(selectedTable)}</p>
                            <button
                                className="print-qr-btn"
                                onClick={() => {
                                    const w = window.open('', '_blank');
                                    w.document.write(`
                    <html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                      <h2>Table ${selectedTable}</h2>
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getQrUrl(selectedTable))}" />
                      <p style="margin-top:16px;color:#666;">Scan to order</p>
                    </body></html>
                  `);
                                    w.document.close();
                                    w.print();
                                }}
                            >
                                🖨️ Print QR Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium In-Dashboard Add Item Modal */}
            {showAddItemModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', overflow: 'hidden', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>Table {selectedTable}</span>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>➕ Add Items to Order</h3>
                                </div>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>Pick items from your menu to add to Table {selectedTable}'s live bill</p>
                            </div>
                            <button
                                onClick={() => setShowAddItemModal(false)}
                                style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Search & Category Pills */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Search items by name or category..."
                                    value={menuSearch}
                                    onChange={(e) => setMenuSearch(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                                {menuSearch && (
                                    <button onClick={() => setMenuSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', fontSize: '14px' }}>✕</button>
                                )}
                            </div>

                            {/* Category Filter Pills */}
                            {categories.length > 1 && (
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                    {categories.map((cat) => {
                                        const isActive = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '100px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    border: isActive ? 'none' : '1px solid #E2E8F0',
                                                    background: isActive ? '#F59E0B' : '#F8FAFC',
                                                    color: isActive ? '#FFFFFF' : '#475569',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    textTransform: 'capitalize',
                                                    boxShadow: isActive ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none',
                                                }}
                                            >
                                                {cat === 'all' ? '✨ All Categories' : cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Menu Items List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', background: '#F8FAFC' }}>
                            {menuLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                                    <div className="loader-spinner" style={{ margin: '0 auto 12px', width: '28px', height: '28px' }}></div>
                                    Fetching menu items...
                                </div>
                            ) : filteredMenuItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🍽️</span>
                                    <p style={{ margin: 0, fontWeight: 500 }}>No items match your search.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {filteredMenuItems.map((item) => {
                                        const qty = addItemCart[item.id]?.quantity || 0;
                                        return (
                                            <div
                                                key={item.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    border: qty > 0 ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                                                    background: qty > 0 ? '#FFFBEB' : '#FFFFFF',
                                                    boxShadow: qty > 0 ? '0 4px 12px rgba(245, 158, 11, 0.08)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {item.image && (
                                                    <img src={item.image} alt={item.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, marginRight: '12px' }} />
                                                )}
                                                <div style={{ flex: 1, paddingRight: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <VegBadge isVeg={item.isVeg !== false} />
                                                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>{item.name}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#D97706' }}>₹{item.price}</span>
                                                        {item.category && (
                                                            <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: '11px', padding: '1px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>{item.category}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', borderRadius: '8px', padding: '4px', border: '1px solid #E2E8F0' }}>
                                                    <button
                                                        onClick={() => handleUpdateCartQty(item, -1)}
                                                        disabled={qty === 0}
                                                        style={{
                                                            border: 'none',
                                                            background: qty > 0 ? '#FFFFFF' : 'transparent',
                                                            color: qty > 0 ? '#0F172A' : '#94A3B8',
                                                            cursor: qty > 0 ? 'pointer' : 'default',
                                                            fontSize: '14px',
                                                            fontWeight: 700,
                                                            width: '26px',
                                                            height: '26px',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        −
                                                    </button>
                                                    <span style={{ fontWeight: 700, fontSize: '13px', minWidth: '22px', textAlign: 'center', color: qty > 0 ? '#D97706' : '#64748B' }}>{qty}</span>
                                                    <button
                                                        onClick={() => handleUpdateCartQty(item, 1)}
                                                        style={{
                                                            border: 'none',
                                                            background: '#FFFFFF',
                                                            color: '#0F172A',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: 700,
                                                            width: '26px',
                                                            height: '26px',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer Bar */}
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Total Selected</span>
                                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>₹{Object.values(addItemCart).reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(0)}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => window.open(getQrUrl(selectedTable), '_blank')}
                                    style={{ padding: '9px 14px', fontSize: '13px', fontWeight: 600, background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', cursor: 'pointer', color: '#475569' }}
                                    title="Open Customer QR Menu Link"
                                >
                                    🌐 Customer QR Link
                                </button>
                                <button
                                    onClick={handleAddItemsToBill}
                                    disabled={addingToBill || Object.keys(addItemCart).length === 0}
                                    style={{
                                        padding: '9px 20px',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        background: Object.keys(addItemCart).length > 0 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : '#E2E8F0',
                                        color: Object.keys(addItemCart).length > 0 ? '#FFFFFF' : '#94A3B8',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: Object.keys(addItemCart).length > 0 ? 'pointer' : 'not-allowed',
                                        boxShadow: Object.keys(addItemCart).length > 0 ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {addingToBill ? 'Adding Items...' : `Add to Table ${selectedTable} Order`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirm Close Bill Modal */}
            {confirmCloseTable && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>💳</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Close Bill for Table {confirmCloseTable}?</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748B' }}>Total Amount: <strong style={{ color: '#0F172A' }}>₹{sessions[confirmCloseTable]?.total?.toFixed(0)}</strong>. The bill will be printed automatically and marked as paid.</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmCloseTable(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => executeCloseSession(confirmCloseTable)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#10B981', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>Close Bill</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirm Delete Item Modal */}
            {confirmDeleteItem && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '380px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Remove Item?</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748B' }}>Are you sure you want to remove <strong>{confirmDeleteItem.item?.name}</strong> from Table {selectedTable}'s order?</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmDeleteItem(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => executeDeleteItem(confirmDeleteItem.order, confirmDeleteItem.itemIndex)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#EF4444', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>Remove Item</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


