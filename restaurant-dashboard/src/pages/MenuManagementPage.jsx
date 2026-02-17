import { useState, useEffect } from 'react';
import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const RESTAURANT_ID = 'rest_test123';

export default function MenuManagementPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        isVeg: true,
        isAvailable: true,
    });

    const fetchItems = async () => {
        try {
            const ref = collection(db, 'restaurants', RESTAURANT_ID, 'menuItems');
            const snapshot = await getDocs(ref);
            setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Error fetching menu:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const resetForm = () => {
        setForm({ name: '', description: '', category: '', price: '', isVeg: true, isAvailable: true });
        setEditingItem(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = {
            name: form.name,
            description: form.description,
            category: form.category.toLowerCase(),
            price: parseFloat(form.price),
            isVeg: form.isVeg,
            isAvailable: form.isAvailable,
        };

        try {
            if (editingItem) {
                await updateDoc(doc(db, 'restaurants', RESTAURANT_ID, 'menuItems', editingItem.id), data);
            } else {
                await addDoc(collection(db, 'restaurants', RESTAURANT_ID, 'menuItems'), data);
            }
            resetForm();
            fetchItems();
        } catch (err) {
            console.error('Error saving item:', err);
        }
    };

    const handleEdit = (item) => {
        setForm({
            name: item.name,
            description: item.description || '',
            category: item.category,
            price: String(item.price),
            isVeg: item.isVeg ?? true,
            isAvailable: item.isAvailable ?? true,
        });
        setEditingItem(item);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return;
        try {
            await deleteDoc(doc(db, 'restaurants', RESTAURANT_ID, 'menuItems', id));
            fetchItems();
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const toggleAvailability = async (item) => {
        try {
            await updateDoc(doc(db, 'restaurants', RESTAURANT_ID, 'menuItems', item.id), {
                isAvailable: !item.isAvailable,
            });
            fetchItems();
        } catch (err) {
            console.error('Error toggling:', err);
        }
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="loader-spinner"></div>
                <p>Loading menu...</p>
            </div>
        );
    }

    const categories = [...new Set(items.map((i) => i.category))];

    return (
        <div className="menu-mgmt-page">
            <div className="page-header">
                <h1>Menu Management</h1>
                <button className="add-item-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                    + Add Item
                </button>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => resetForm()}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                        <form onSubmit={handleSubmit} className="item-form">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Item name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Short description"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <input
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        placeholder="e.g., appetizers"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Price (₹)</label>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        placeholder="250"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={form.isVeg}
                                        onChange={(e) => setForm({ ...form, isVeg: e.target.checked })}
                                    />
                                    <span>Vegetarian</span>
                                </label>
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={form.isAvailable}
                                        onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                                    />
                                    <span>Available</span>
                                </label>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
                                <button type="submit" className="save-btn">
                                    {editingItem ? 'Update Item' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Menu Items by Category */}
            {categories.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">🍽️</span>
                    <h3>No menu items yet</h3>
                    <p>Click "Add Item" to create your first menu item.</p>
                </div>
            ) : (
                categories.map((cat) => (
                    <div key={cat} className="menu-category-section">
                        <h2 className="category-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h2>
                        <div className="menu-items-table">
                            {items
                                .filter((i) => i.category === cat)
                                .map((item) => (
                                    <div key={item.id} className={`menu-item-row ${!item.isAvailable ? 'unavailable' : ''}`}>
                                        <div className="item-info">
                                            <span className={`veg-dot ${item.isVeg ? 'veg' : 'non-veg'}`}></span>
                                            <div>
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-desc">{item.description}</span>
                                            </div>
                                        </div>
                                        <span className="item-price">₹{item.price}</span>
                                        <div className="item-actions">
                                            <button
                                                className={`avail-toggle ${item.isAvailable ? 'on' : 'off'}`}
                                                onClick={() => toggleAvailability(item)}
                                                title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                                            >
                                                {item.isAvailable ? '✓' : '✕'}
                                            </button>
                                            <button className="edit-btn" onClick={() => handleEdit(item)}>✏️</button>
                                            <button className="delete-btn" onClick={() => handleDelete(item.id)}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
