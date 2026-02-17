import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    where,
    getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const RESTAURANT_ID = 'rest_test123';

export default function TablesPage() {
    const [tableCount, setTableCount] = useState(10);
    const [sessions, setSessions] = useState({});
    const [selectedTable, setSelectedTable] = useState(null);
    const [tableOrders, setTableOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    const customerAppUrl = window.location.origin.replace('5174', '5173');

    useEffect(() => {
        fetchSessions();
    }, []);

    // When a table is selected, fetch its orders
    useEffect(() => {
        if (selectedTable && sessions[selectedTable]) {
            fetchTableOrders(sessions[selectedTable]);
        } else {
            setTableOrders([]);
        }
    }, [selectedTable, sessions]);

    const fetchSessions = async () => {
        try {
            const sessionsRef = collection(db, 'restaurants', RESTAURANT_ID, 'sessions');
            const q = query(sessionsRef, where('status', '==', 'active'));
            const snapshot = await getDocs(q);
            const sessionMap = {};
            snapshot.docs.forEach((d) => {
                const data = d.data();
                sessionMap[data.tableNumber] = { id: d.id, ...data };
            });
            setSessions(sessionMap);
        } catch (err) {
            console.error('Error fetching sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTableOrders = async (session) => {
        if (!session.orderIds || session.orderIds.length === 0) {
            setTableOrders([]);
            return;
        }
        setOrdersLoading(true);
        try {
            const orders = [];
            for (const orderId of session.orderIds) {
                const orderRef = doc(db, 'restaurants', RESTAURANT_ID, 'orders', orderId);
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

    const closeSession = async (tableNum) => {
        const session = sessions[tableNum];
        if (!session) return;
        if (!confirm(`Close the bill for Table ${tableNum}? Total: ₹${session.total?.toFixed(0)}`)) return;

        try {
            // 1. Close the session
            const sessionRef = doc(db, 'restaurants', RESTAURANT_ID, 'sessions', session.id);
            await updateDoc(sessionRef, {
                status: 'closed',
                endedAt: new Date(),
                paidAt: new Date(),
            });

            // 2. Mark all orders in this session as 'closed' so they leave Live Orders
            if (session.orderIds && session.orderIds.length > 0) {
                const updatePromises = session.orderIds.map((orderId) => {
                    const orderRef = doc(db, 'restaurants', RESTAURANT_ID, 'orders', orderId);
                    return updateDoc(orderRef, { status: 'closed' });
                });
                await Promise.all(updatePromises);
            }

            fetchSessions();
            setSelectedTable(null);
        } catch (err) {
            console.error('Error closing session:', err);
        }
    };

    const getQrUrl = (tableNum) => {
        return `${customerAppUrl}/order?r=${RESTAURANT_ID}&t=${tableNum}`;
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
                        onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
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
                            <button className="close-bill-btn" onClick={() => closeSession(selectedTable)}>
                                Close Bill — ₹{currentSession.total?.toFixed(0)}
                            </button>
                        )}
                    </div>

                    <div className="table-detail-body">
                        {/* Left: Bill Details */}
                        <div className="bill-section">
                            {currentSession ? (
                                <>
                                    <h3 className="bill-title">📋 Bill Details</h3>

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
                                                            <div key={i} className="bill-item-row">
                                                                <span className="bill-item-qty">{item.quantity}×</span>
                                                                <span className="bill-item-name">{item.name}</span>
                                                                <span className="bill-item-price">₹{item.subtotal}</span>
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
        </div>
    );
}
