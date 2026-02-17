import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hook to fetch menu items from Firestore for a given restaurant.
 * Returns { menuItems, categories, loading, error }
 */
export default function useMenu(restaurantId) {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!restaurantId) {
            setLoading(false);
            setError('No restaurant ID provided');
            return;
        }

        async function fetchMenu() {
            try {
                setLoading(true);
                const menuRef = collection(
                    db,
                    'restaurants',
                    restaurantId,
                    'menuItems'
                );
                const q = query(menuRef, orderBy('category'));
                const snapshot = await getDocs(q);

                const items = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Extract unique categories, preserving order
                const uniqueCategories = [...new Set(items.map((item) => item.category))];

                setMenuItems(items);
                setCategories(uniqueCategories);
                setError(null);
            } catch (err) {
                console.error('Error fetching menu:', err);
                setError('Failed to load menu. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        fetchMenu();
    }, [restaurantId]);

    return { menuItems, categories, loading, error };
}
