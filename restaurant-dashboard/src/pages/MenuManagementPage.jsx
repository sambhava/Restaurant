import { useState, useEffect, useRef } from 'react';
import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import useAuthStore from '../store/authStore';

export default function MenuManagementPage() {
    const restaurantId = useAuthStore((s) => s.restaurantId);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        image: '',
        isVeg: true,
        isAvailable: true,
        variants: [],
        addOns: [],
    });
    const [menuSearchTerm, setMenuSearchTerm] = useState('');

    const fetchItems = async () => {
        try {
            const ref = collection(db, 'restaurants', restaurantId, 'menuItems');
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
        setForm({ name: '', description: '', category: '', price: '', image: '', isVeg: true, isAvailable: true, variants: [], addOns: [] });
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
            image: form.image || '',
            isVeg: form.isVeg,
            isAvailable: form.isAvailable,
            variants: form.variants.filter(v => v.name.trim() !== ''),
            addOns: form.addOns.filter(a => a.name.trim() !== ''),
        };

        try {
            if (editingItem) {
                await updateDoc(doc(db, 'restaurants', restaurantId, 'menuItems', editingItem.id), data);
            } else {
                await addDoc(collection(db, 'restaurants', restaurantId, 'menuItems'), data);
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
            image: item.image || '',
            isVeg: item.isVeg ?? true,
            isAvailable: item.isAvailable ?? true,
            variants: item.variants || [],
            addOns: item.addOns || [],
        });
        setEditingItem(item);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return;
        try {
            await deleteDoc(doc(db, 'restaurants', restaurantId, 'menuItems', id));
            fetchItems();
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const toggleAvailability = async (item) => {
        try {
            await updateDoc(doc(db, 'restaurants', restaurantId, 'menuItems', item.id), {
                isAvailable: !item.isAvailable,
            });
            fetchItems();
        } catch (err) {
            console.error('Error toggling:', err);
        }
    };

    // Variant helpers
    const addVariant = () => {
        setForm({
            ...form,
            variants: [...form.variants, { name: '', priceModifier: 0 }],
        });
    };

    const updateVariant = (index, field, value) => {
        const updated = [...form.variants];
        updated[index] = { ...updated[index], [field]: field === 'priceModifier' ? parseFloat(value) || 0 : value };
        setForm({ ...form, variants: updated });
    };

    const removeVariant = (index) => {
        setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });
    };

    // Add-on helpers
    const addAddOn = () => {
        setForm({
            ...form,
            addOns: [...form.addOns, { name: '', price: 0 }],
        });
    };

    const updateAddOn = (index, field, value) => {
        const updated = [...form.addOns];
        updated[index] = { ...updated[index], [field]: field === 'price' ? parseFloat(value) || 0 : value };
        setForm({ ...form, addOns: updated });
    };

    const removeAddOn = (index) => {
        setForm({ ...form, addOns: form.addOns.filter((_, i) => i !== index) });
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="loader-spinner"></div>
                <p>Loading menu...</p>
            </div>
        );
    }

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(menuSearchTerm.toLowerCase())
    );

    const categories = [...new Set(filteredItems.map((i) => i.category))];

    return (
        <div className="menu-mgmt-page">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <h1>Menu Management</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search menu..." 
                            value={menuSearchTerm}
                            onChange={(e) => setMenuSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="add-item-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                        + Add Item
                    </button>
                </div>
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
                            <div className="form-group">
                                <label>Item Image</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    {!form.image && (
                                        <button
                                            type="button"
                                            className="add-variant-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            style={{ padding: '8px 16px' }}
                                        >
                                            {uploading ? '⏳ Processing...' : '📷 Choose Image'}
                                        </button>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setUploading(true);
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                const img = new Image();
                                                img.onload = () => {
                                                    const canvas = document.createElement('canvas');
                                                    const MAX = 300;
                                                    let w = img.width, h = img.height;
                                                    if (w > h) { h = (h / w) * MAX; w = MAX; }
                                                    else { w = (w / h) * MAX; h = MAX; }
                                                    canvas.width = w;
                                                    canvas.height = h;
                                                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                                    setForm((prev) => ({ ...prev, image: dataUrl }));
                                                    setUploading(false);
                                                };
                                                img.onerror = () => {
                                                    alert('Failed to load image.');
                                                    setUploading(false);
                                                };
                                                img.src = ev.target.result;
                                            };
                                            reader.onerror = () => {
                                                alert('Failed to read file.');
                                                setUploading(false);
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                    {form.image && (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img
                                                src={form.image}
                                                alt="Preview"
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--clr-border)',
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, image: '' })}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-6px',
                                                    right: '-6px',
                                                    background: '#ef4444',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
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
                                    <label>Base Price (₹)</label>
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
                            </div>

                            {/* Variants Section */}
                            <div className="variants-section">
                                <div className="variants-header">
                                    <label>Variants / Sizes</label>
                                    <button type="button" className="add-variant-btn" onClick={addVariant}>
                                        + Add Variant
                                    </button>
                                </div>
                                {form.variants.length > 0 && (
                                    <div className="variants-list">
                                        {form.variants.map((v, i) => (
                                            <div key={i} className="variant-row">
                                                <input
                                                    className="variant-name-input"
                                                    value={v.name}
                                                    onChange={(e) => updateVariant(i, 'name', e.target.value)}
                                                    placeholder="e.g., Small, Medium, Large"
                                                />
                                                <div className="variant-price-group">
                                                    <span className="variant-price-label">₹</span>
                                                    <input
                                                        type="number"
                                                        className="variant-price-input"
                                                        value={v.priceModifier}
                                                        onChange={(e) => updateVariant(i, 'priceModifier', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="remove-variant-btn"
                                                    onClick={() => removeVariant(i)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {form.variants.length === 0 && (
                                    <p className="variants-hint">Optional: Add sizes like Small / Medium / Large</p>
                                )}
                            </div>

                            {/* Add-ons Section */}
                            <div className="variants-section">
                                <div className="variants-header">
                                    <label>Add-ons</label>
                                    <button type="button" className="add-variant-btn" onClick={addAddOn}>
                                        + Add Add-on
                                    </button>
                                </div>
                                {form.addOns.length > 0 && (
                                    <div className="variants-list">
                                        {form.addOns.map((a, i) => (
                                            <div key={i} className="variant-row">
                                                <input
                                                    className="variant-name-input"
                                                    value={a.name}
                                                    onChange={(e) => updateAddOn(i, 'name', e.target.value)}
                                                    placeholder="e.g., Extra Cheese, Jalapenos"
                                                />
                                                <div className="variant-price-group">
                                                    <span className="variant-price-label">₹</span>
                                                    <input
                                                        type="number"
                                                        className="variant-price-input"
                                                        value={a.price}
                                                        onChange={(e) => updateAddOn(i, 'price', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="remove-variant-btn"
                                                    onClick={() => removeAddOn(i)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {form.addOns.length === 0 && (
                                    <p className="variants-hint">Optional: Add extras like Extra Cheese, Jalapenos, etc.</p>
                                )}
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
                    <h3>{menuSearchTerm ? 'No matching menu items found' : 'No menu items yet'}</h3>
                    <p>{menuSearchTerm ? 'Try adjusting your search terms' : 'Click "Add Item" to create your first menu item.'}</p>
                </div>
            ) : (
                categories.map((cat) => (
                    <div key={cat} className="menu-category-section">
                        <h2 className="category-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h2>
                        <div className="menu-items-table">
                            {filteredItems
                                .filter((i) => i.category === cat)
                                .map((item) => (
                                    <div key={item.id} className={`menu-item-row ${!item.isAvailable ? 'unavailable' : ''}`}>
                                        <div className="item-info">
                                            <span className={`veg-dot ${item.isVeg ? 'veg' : 'non-veg'}`}></span>
                                            <div>
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-desc">{item.description}</span>
                                                {item.variants && item.variants.length > 0 && (
                                                    <span className="item-variants-badge">
                                                        {item.variants.length} variant{item.variants.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {item.addOns && item.addOns.length > 0 && (
                                                    <span className="item-variants-badge" style={{ marginLeft: '4px' }}>
                                                        {item.addOns.length} add-on{item.addOns.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
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
                                            <button className="edit-btn" onClick={() => handleEdit(item)} title="Edit">✏️</button>
                                            <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Delete">🗑️</button>
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
