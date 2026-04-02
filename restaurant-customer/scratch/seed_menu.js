import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDrw8ZzIlWpYdsfZUXvfE7lQTyLRJtxX2Q",
    authDomain: "restaurant-qr-dev.firebaseapp.com",
    projectId: "restaurant-qr-dev",
    storageBucket: "restaurant-qr-dev.firebasestorage.app",
    messagingSenderId: "636693279490",
    appId: "1:636693279490:web:b49b159531e40cd98dc81b",
    measurementId: "G-SRE5SSG6GV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const restaurantId = 'rest-2';

const menuItems = [
    // SOUPS
    {
        name: "Tomato Soup",
        price: 120,
        category: "soups",
        description: "Classic rich tomato soup served with crispy croutons",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Sweet Corn Soup",
        price: 140,
        category: "soups",
        description: "Mild and comforting soup packed with sweet corn kernels",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Lemon & Coriander",
        price: 120,
        category: "soups",
        description: "Tangy soup flavored with fresh lemon juice and green coriander",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Manchow Soup",
        price: 130,
        category: "soups",
        description: "Spicy and sour Indo-Chinese soup topped with crispy fried noodles",
        isVeg: true,
        isAvailable: true,
        tags: ["Bestseller"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Veg Clear Soup",
        price: 140,
        category: "soups",
        description: "Light clear broth with seasonal garden vegetables",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Hot & Sour Soup",
        price: 165,
        category: "soups",
        description: "Zesty spicy and sour soup with finely chopped veggies",
        isVeg: true,
        isAvailable: true,
        tags: ["Popular"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Minestrone",
        price: 180,
        category: "soups",
        description: "Thick Italian soup containing vegetables and pasta",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=500&q=80"
    },

    // STREET FOOD
    {
        name: "Gupta Ji Ka burger",
        price: 60,
        category: "street food",
        description: "Local style spicy veg burger with potato patty and special chutney",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Vada Pav",
        price: 100,
        category: "street food",
        description: "Mumbai style batata vada in soft pav with garlic chutney",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Kurkure chaat",
        price: 80,
        category: "street food",
        description: "Crunchy tea-time snack tossed with onions, tomatoes and spices",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chola Kulcha",
        price: 205,
        category: "street food",
        description: "Spicy boiled chickpeas served with fluffy pan-toasted kulchas",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        spiceLevel: "medium",
        addOns: [{ name: "Extra Chola/Kulcha/Pav", price: 50 }],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Pav Bhaji",
        price: 120,
        category: "street food",
        description: "Thick vegetable curry mashed and served with buttered pav rolls",
        isVeg: true,
        isAvailable: true,
        tags: ["Bestseller"],
        addOns: [{ name: "Extra Buttered Pav", price: 50 }],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chola Bhatura",
        price: 150,
        category: "street food",
        description: "Spicy Punjabi chole served with large deep-fried bhaturas",
        isVeg: true,
        isAvailable: true,
        addOns: [{ name: "Extra Bhatura", price: 50 }],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chaap roll (Achari Malai)",
        price: 110,
        category: "street food",
        description: "Spicy marinated soya chaap pieces rolled inside soft rumali roti",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Tikka roll",
        price: 120,
        category: "street food",
        description: "Grilled cottage cheese cubes, veggies, and chutney in a soft roll",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chilly Paneer roll",
        price: 120,
        category: "street food",
        description: "Indo-Chinese style chilli paneer wrapped in a flatbread",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chaomien roll",
        price: 80,
        category: "street food",
        description: "Stir-fried noodles wrapped in a soft paratha with sweet chilli sauce",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },

    // CHAAP
    {
        name: "Malai Chaap (8 Pcs)",
        price: 200,
        category: "chaap",
        description: "Soya chaap chunks marinated in rich cream and spices, baked in tandoor",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Masala Chaap (8 Pcs)",
        price: 180,
        category: "chaap",
        description: "Spicy and tangy marinated soya chaap pieces cooked over charcoal",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Afghani Chaap (8 Pcs)",
        price: 220,
        category: "chaap",
        description: "Soya chaap in a rich cashew-cream paste tandoor roast",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Soya Lollypop Dry (6 Pcs)",
        price: 250,
        category: "chaap",
        description: "Crunchy soya lollypops tossed in spices",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Soya Tikka Stuffed (6 Pcs)",
        price: 220,
        category: "chaap",
        description: "Soya tikka pieces stuffed with cottage cheese and herbs",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },

    // CHAAP GRAVY
    {
        name: "Soya Chaap Curry",
        price: 200,
        category: "chaap gravy",
        description: "Delicious soya chaap chunks cooked in a rich onion-tomato gravy",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Soya Chaap Rogan Josh",
        price: 230,
        category: "chaap gravy",
        description: "Rich, aromatic Kashmiri style gravy with spices",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Soya Chaap Butter Masala",
        price: 250,
        category: "chaap gravy",
        description: "Soya chaap cooked in a sweet, velvety tomato, butter, and cashew gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },

    // STARTERS
    {
        name: "French Fries",
        price: 170,
        category: "starters",
        description: "Crispy salted golden french fries",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Peri Peri French Fries",
        price: 175,
        category: "starters",
        description: "Crispy french fries tossed in spicy peri peri seasoning",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cheese French Fries",
        price: 210,
        category: "starters",
        description: "French fries loaded with hot melted cheese sauce",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chinese Bhel",
        price: 170,
        category: "starters",
        description: "Crispy noodles tossed with shredded vegetables and spicy schezwan sauce",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Pinch of Salt Special Roll",
        price: 180,
        category: "starters",
        description: "Premium house-special mixed vegetable rolls fried to crisp",
        isVeg: true,
        isAvailable: true,
        tags: ["Chef Special"],
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Honey Chilli Potato",
        price: 225,
        category: "starters",
        description: "Sweet and spicy crispy potato fingers tossed in sesame, honey and chilli",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Spring Roll",
        price: 205,
        category: "starters",
        description: "Crispy fried rolls packed with delicious stir-fried Chinese style veggies",
        isVeg: true,
        isAvailable: true,
        tags: ["Bestseller"],
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Garlic Bread",
        price: 180,
        category: "starters",
        description: "Toasted slices of bread topped with garlic butter and herbs",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Crispy Corn",
        price: 215,
        category: "starters",
        description: "Deep fried batter coated sweet corn kernels tossed with spices",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cheese Garlic Bread",
        price: 210,
        category: "starters",
        description: "Freshly toasted garlic bread loaded with melted mozzarella cheese",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cheese Cutlet",
        price: 225,
        category: "starters",
        description: "Crispy cutlets with a heart of melting cheese",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Veg Cutlet",
        price: 210,
        category: "starters",
        description: "Classic deep fried vegetable cutlets served with dip",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dahi ke Sholay",
        price: 285,
        category: "starters",
        description: "Crispy bread pockets stuffed with spiced hung curd and bell peppers",
        isVeg: true,
        isAvailable: true,
        tags: ["Popular"],
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },

    // TANDOOR SE
    {
        name: "Tandoori Aloo",
        price: 180,
        category: "tandoor se",
        description: "Whole potatoes marinated in robust tandoori masala and roasted",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Tandoori Mushroom",
        price: 200,
        category: "tandoor se",
        description: "Fresh mushrooms marinated in yogurt and chargrilled",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Tikka",
        price: 285,
        category: "tandoor se",
        description: "Classic chargrilled cottage cheese skewered with onions and capsicum",
        isVeg: true,
        isAvailable: true,
        tags: ["Bestseller"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Lehsuni Paneer Tikka",
        price: 245,
        category: "tandoor se",
        description: "Cottage cheese tikka with a strong garlic flavor profile",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Kasturi Paneer Tikka",
        price: 245,
        category: "tandoor se",
        description: "Grilled paneer flavored with fragrant fenugreek leaves (kasuri methi)",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Achari Paneer Tikka",
        price: 245,
        category: "tandoor se",
        description: "Cottage cheese pieces marinated with pickling spices",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Malai Paneer Tikka",
        price: 245,
        category: "tandoor se",
        description: "Mouth-melting paneer cubes in a cream marinade",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Lemon / Pepper Paneer Tikka",
        price: 245,
        category: "tandoor se",
        description: "Cottage cheese cubes seasoned with lemon juice and cracked black pepper",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },

    // KEBABS
    {
        name: "Veg Seekh Kebab",
        price: 180,
        category: "kebabs",
        description: "Skewer-grilled rolls of mixed minced vegetables and spices",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Kasturi Kebab",
        price: 210,
        category: "kebabs",
        description: "Delicious vegetable kebab patties flavored with fenugreek",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Hara Bhara Kebab",
        price: 225,
        category: "kebabs",
        description: "Spiced spinach and green pea patties fried to golden perfection",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dahi ke Kebab",
        price: 255,
        category: "kebabs",
        description: "Crispy exterior and creamy melt-in-your-mouth spiced hung yogurt interior",
        isVeg: true,
        isAvailable: true,
        tags: ["Chef Special"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },

    // PASTA
    {
        name: "Arrabiata / Red Sauce",
        price: 285,
        category: "pasta",
        description: "Penne pasta in a spicy tomato, garlic, and red chilli sauce",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Alfredo / White Sauce",
        price: 320,
        category: "pasta",
        description: "Rich and creamy pasta tossed in parmesan butter sauce",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Mix Sauce",
        price: 280,
        category: "pasta",
        description: "Pink sauce pasta combining tang of tomato and richness of cream",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Baked (Cheese Overloaded)",
        price: 350,
        category: "pasta",
        description: "Creamy pasta baked with an extremely generous layer of mozzarella cheese",
        isVeg: true,
        isAvailable: true,
        tags: ["Popular"],
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Baked Macaroni",
        price: 320,
        category: "pasta",
        description: "Macaroni baked in rich white sauce topped with golden cheese crust",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },

    // PIZZA
    {
        name: "Margarita Pizza",
        price: 200,
        category: "pizza",
        description: "Classic pizza with rich tomato sauce, basil, and cheese",
        isVeg: true,
        isAvailable: true,
        variants: [
            { name: "7\"", priceModifier: 0 },
            { name: "10\"", priceModifier: 200 }
        ],
        addOns: [
            { name: "Extra Cheese", price: 60 },
            { name: "Extra Mushroom", price: 40 },
            { name: "Extra Paneer", price: 50 }
        ],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "OTC Pizza",
        price: 200,
        category: "pizza",
        description: "Topped with fresh Onion, Tomato, Capsicum and cheese",
        isVeg: true,
        isAvailable: true,
        variants: [
            { name: "7\"", priceModifier: 0 },
            { name: "10\"", priceModifier: 220 }
        ],
        addOns: [
            { name: "Extra Cheese", price: 60 },
            { name: "Extra Mushroom", price: 40 }
        ],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cheese Corn Pizza",
        price: 200,
        category: "pizza",
        description: "Sweet corn kernels and mozzarella cheese",
        isVeg: true,
        isAvailable: true,
        variants: [
            { name: "7\"", priceModifier: 0 },
            { name: "10\"", priceModifier: 200 }
        ],
        addOns: [
            { name: "Extra Cheese", price: 60 }
        ],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Garden Fresh Pizza",
        price: 200,
        category: "pizza",
        description: "Loaded with fresh onions, capsicum, tomatoes, mushrooms and olives",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        variants: [
            { name: "7\"", priceModifier: 0 },
            { name: "10\"", priceModifier: 220 }
        ],
        addOns: [
            { name: "Extra Cheese", price: 60 }
        ],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Special Pizza",
        price: 290,
        category: "pizza",
        description: "Loaded house special pizza topped with all premium toppings",
        isVeg: true,
        isAvailable: true,
        variants: [
            { name: "7\"", priceModifier: 0 },
            { name: "10\"", priceModifier: 280 }
        ],
        addOns: [
            { name: "Extra Cheese", price: 60 }
        ],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Exotic Veg Pizza",
        price: 350,
        category: "pizza",
        description: "Fitted with baby corn, jalapenos, olives, red paprika and cheese",
        isVeg: true,
        isAvailable: true,
        tags: ["Popular"],
        variants: [
            { name: "7\"", priceModifier: 0 },
            { name: "10\"", priceModifier: 280 }
        ],
        addOns: [
            { name: "Extra Cheese", price: 60 }
        ],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "No Cheese Pizza",
        price: 170,
        category: "pizza",
        description: "Light tomato base pizza topped with lots of crunchy veggies, no cheese",
        isVeg: true,
        isAvailable: true,
        variants: [
            { name: "7\"", priceModifier: 0 },
            { name: "10\"", priceModifier: 80 }
        ],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Tikka Pizza",
        price: 220,
        category: "pizza",
        description: "Pizza topped with paneer tikka cubes, onions and coriander",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        variants: [
            { name: "7\"", priceModifier: 0 },
            { name: "10\"", priceModifier: 220 }
        ],
        addOns: [
            { name: "Extra Cheese", price: 60 },
            { name: "Extra Paneer", price: 50 }
        ],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Spicy Schezwan Veg Pizza",
        price: 250,
        category: "pizza",
        description: "Schezwan sauce base pizza loaded with bell peppers, corn and onions",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        variants: [
            { name: "7\"", priceModifier: 0 },
            { name: "10\"", priceModifier: 150 }
        ],
        addOns: [
            { name: "Extra Cheese", price: 60 }
        ],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"
    },

    // CHINESE
    {
        name: "Vegetable Fried Rice",
        price: 175,
        category: "chinese",
        description: "Classic Chinese wok-fried rice tossed with chopped veggies",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Veg. Chowmein",
        price: 175,
        category: "chinese",
        description: "Indo-Chinese street-style stir fried noodles with vegetables",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Hakka Noodles",
        price: 175,
        category: "chinese",
        description: "Traditional noodles tossed with garlic, ginger, and soy sauce",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chilly Garlic Noodles",
        price: 205,
        category: "chinese",
        description: "Stir fried noodles tossed in garlic and red chilli sauce",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Schezwan Noodles",
        price: 210,
        category: "chinese",
        description: "Fiery Chinese noodles wok tossed in hot Schezwan paste",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "hot",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chilly Garlic Fried Rice",
        price: 210,
        category: "chinese",
        description: "Wok-fried rice with garlic and red chillies",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Veg Manchurian Gravy (8 Pcs.)",
        price: 210,
        category: "chinese",
        description: "Golden fried vegetable dumplings in hot, tangy, soy-garlic gravy",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chilly Paneer Gravy (8 Pcs.)",
        price: 365,
        category: "chinese",
        description: "Paneer cubes tossed with bell peppers and onions in hot chilli-soy sauce",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80"
    },

    // SIZZLERS
    {
        name: "Chinese Sizzler",
        price: 440,
        category: "sizzlers",
        description: "Sizzling platter with Fried Rice/Noodles, Manchurian, spring roll and fries",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Special Sizzler",
        price: 440,
        category: "sizzlers",
        description: "House special combo platter served smoking hot with continental vegetables",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Continental Sizzler",
        price: 440,
        category: "sizzlers",
        description: "Sizzling platter with buttered rice, French fries, steamed vegetables and cutlet",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80"
    },

    // VEGETABLES
    {
        name: "Mushroom Masala",
        price: 200,
        category: "vegetables",
        description: "Button mushrooms cooked in a spicy onion-tomato gravy",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Jeera Aloo",
        price: 210,
        category: "vegetables",
        description: "Tender potatoes tossed with cumin seeds and turmeric",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Aloo Gobhi",
        price: 235,
        category: "vegetables",
        description: "Classic dry home-style potato and cauliflower dish",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Gobhi Masala",
        price: 285,
        category: "vegetables",
        description: "Cauliflower florets cooked in spicy, thick Indian gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dum Aloo",
        price: 290,
        category: "vegetables",
        description: "Slow-cooked baby potatoes in a spicy, rich curd-based gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Mix Veg",
        price: 270,
        category: "vegetables",
        description: "Assorted seasonal garden vegetables cooked in thick Indian masala",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chana Masala",
        price: 290,
        category: "vegetables",
        description: "Chickpeas simmered in spicy, tangy onion-tomato curry",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Aloo Pyaz",
        price: 275,
        category: "vegetables",
        description: "Dhaba-style potato and spring onion stir-fry",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Corn Palak",
        price: 360,
        category: "vegetables",
        description: "Creamy pureed spinach curry cooked with golden sweet corn",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Gutta Masala",
        price: 260,
        category: "vegetables",
        description: "Rajasthani gram flour dumplings cooked in a spiced yogurt gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Veg Jalfrezi",
        price: 310,
        category: "vegetables",
        description: "Tangy and colorful stir fry of mixed vegetables in a semi-dry gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Pindi Chana",
        price: 310,
        category: "vegetables",
        description: "Dry, dark and highly flavorful Punjabi style chickpeas",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Methi Malai Matar",
        price: 320,
        category: "vegetables",
        description: "Green peas cooked in a cream and cashew paste, flavored with fenugreek",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Malai Kofta Red",
        price: 310,
        category: "vegetables",
        description: "Cheese and potato dumplings cooked in a spicy red tomato gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Malai Kofta White",
        price: 340,
        category: "vegetables",
        description: "Cheese dumplings served in sweet, rich white cashew-cream sauce",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Baked Vegetable",
        price: 360,
        category: "vegetables",
        description: "Assorted vegetables mixed with white sauce and baked with cheese",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Tawa Sabji",
        price: 360,
        category: "vegetables",
        description: "Semi dry preparation of fresh vegetables cooked on a flat tawa skillet",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Kaju Curry (Red)",
        price: 380,
        category: "vegetables",
        description: "Roasted cashew nuts simmered in rich, creamy red tomato gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Malai Pyaz",
        price: 210,
        category: "vegetables",
        description: "Small whole onions cooked in a rich malai cream sauce",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Aloo Pyaz Paneer",
        price: 310,
        category: "vegetables",
        description: "Unique combination of potatoes, spring onion and cottage cheese cubes",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Sev Tamatar",
        price: 180,
        category: "vegetables",
        description: "Gujarati recipe of tomatoes cooked with spices and topped with crispy sev",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Haryali Kofta",
        price: 280,
        category: "vegetables",
        description: "Vegetable dumplings cooked in spinach based rich green gravy",
        isVeg: true,
        isAvailable: true,
        tags: ["Popular"],
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Veg Kofta",
        price: 280,
        category: "vegetables",
        description: "Mixed vegetable dumplings cooked in thick spiced brown gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Nargisi Kofta",
        price: 300,
        category: "vegetables",
        description: "Veg kofta stuffed with paneer and cooked in rich cashew and onion gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },

    // PANEER
    {
        name: "Paneer Makhani White",
        price: 330,
        category: "paneer",
        description: "Soft cottage cheese cooked in creamy, non-spicy butter-cashew white gravy",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Butter Masala",
        price: 295,
        category: "paneer",
        description: "Cottage cheese cubes cooked in rich tomato and butter gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Kadhai Paneer",
        price: 295,
        category: "paneer",
        description: "Paneer cooked with bell peppers and freshly ground kadhai spices",
        isVeg: true,
        isAvailable: true,
        tags: ["Bestseller"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Tawa Paneer",
        price: 290,
        category: "paneer",
        description: "Spiced paneer cubes cooked on flat iron skillet with thick gravy",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Palak Paneer",
        price: 300,
        category: "paneer",
        description: "Paneer cubes in a smooth spinach paste gravy seasoned with garlic",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Bhurji",
        price: 280,
        category: "paneer",
        description: "Scrambled cottage cheese cooked with onions, tomatoes and coriander",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Tikka Masala",
        price: 330,
        category: "paneer",
        description: "Skewered, grilled paneer tikka pieces cooked in rich, spicy tandoori gravy",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Kurchan",
        price: 290,
        category: "paneer",
        description: "Semi-dry scrambled cottage cheese cooked with chopped capsicum and tomatoes",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Lababdar",
        price: 360,
        category: "paneer",
        description: "Grated and cubed paneer cooked in a sweetish cream and cashew-tomato gravy",
        isVeg: true,
        isAvailable: true,
        tags: ["Bestseller"],
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Shahi Paneer",
        price: 350,
        category: "paneer",
        description: "Cottage cheese dish cooked in thick cream, almond and curd gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Pasanda",
        price: 280,
        category: "paneer",
        description: "Paneer sandwiches stuffed with nuts and raisins, served in smooth gravy",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80"
    },

    // DAL
    {
        name: "Dal Tadka",
        price: 195,
        category: "dal",
        description: "Yellow lentils cooked with turmeric and tempered with garlic and cumin",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dal Lehsuni",
        price: 210,
        category: "dal",
        description: "Yellow dal tempered with lots of brown, aromatic garlic",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Jaipuri Dal",
        price: 220,
        category: "dal",
        description: "Jaipur style mixed dal tempered with whole red chillies and coriander",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dhaba Dal",
        price: 210,
        category: "dal",
        description: "Rich and spicy black and yellow mixed dal prepared dhaba-style",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dal Makhana",
        price: 225,
        category: "dal",
        description: "Creamy slow cooked black lentils with butter and cream",
        isVeg: true,
        isAvailable: true,
        tags: ["Bestseller"],
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dal PanchRatan",
        price: 265,
        category: "dal",
        description: "Nutritious and delicious blend of five healthy yellow and black lentils",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dal Bhukara",
        price: 225,
        category: "dal",
        description: "Classic cream-loaded slow-cooked black lentils, buttery taste",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },

    // BREADS
    {
        name: "Tandoori Roti",
        price: 18,
        category: "breads",
        description: "Whole wheat flatbread baked in clay oven",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Tandoori Butter Roti",
        price: 26,
        category: "breads",
        description: "Clay-oven flatbread topped with rich butter",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Lacha Parantha",
        price: 70,
        category: "breads",
        description: "Multi-layered crispy whole wheat bread cooked in tandoor",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Butter Naan",
        price: 70,
        category: "breads",
        description: "Fluffy leavened bread slathered with butter",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Missi Roti",
        price: 90,
        category: "breads",
        description: "Gram flour flatbread flavored with chopped onion and green chillies",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Onion Kulcha",
        price: 110,
        category: "breads",
        description: "Spiced onion stuffed flatbread baked in clay oven",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Junglee Naan",
        price: 120,
        category: "breads",
        description: "Naan spiced up with chopped chillies, garlic and fresh herbs",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Garlic Naan",
        price: 120,
        category: "breads",
        description: "Fragrant tandoori naan loaded with chopped garlic and coriander",
        isVeg: true,
        isAvailable: true,
        tags: ["Bestseller"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Stuffed Naan",
        price: 140,
        category: "breads",
        description: "Tandoori naan stuffed with potatoes, paneer and spices",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cheese Naan",
        price: 175,
        category: "breads",
        description: "Leavened flatbread stuffed with soft melting cheese inside",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chur Chur Naan",
        price: 90,
        category: "breads",
        description: "Crushed flaky stuffed naan loaded with butter, served hot",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Khasta Roti",
        price: 90,
        category: "breads",
        description: "Flaky, crisp tandoori roti made with whole wheat flour",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Junglee Roti",
        price: 110,
        category: "breads",
        description: "Wheat flatbread topped with spices, green chillies and coriander",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Stuff Kulcha",
        price: 120,
        category: "breads",
        description: "Flatbread stuffed with spiced potato and paneer stuffing",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },

    // RICE
    {
        name: "Steamed Rice",
        price: 125,
        category: "rice",
        description: "Fluffy, aromatic steamed basmati rice",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Jeera Rice",
        price: 155,
        category: "rice",
        description: "basmati rice cooked with cumin seeds and pure ghee",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Vegetable Pulao",
        price: 210,
        category: "rice",
        description: "Basmati rice cooked with fresh veggies and mild spices",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Mutter Pulao",
        price: 220,
        category: "rice",
        description: "basmati rice cooked with green peas and spices",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Hydrabadi Biryani",
        price: 245,
        category: "rice",
        description: "basmati rice layered with spiced vegetables, cooked in handi",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Mumbai Biryani",
        price: 240,
        category: "rice",
        description: "Spicy Mumbai style vegetable biryani",
        isVeg: true,
        isAvailable: true,
        spiceLevel: "medium",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80"
    },

    // PARANTHAS
    {
        name: "Aloo Parantha",
        price: 110,
        category: "paranthas",
        description: "Indian flatbread stuffed with spiced potatoes, pan fried with butter",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Aloo Pyaz Parantha",
        price: 125,
        category: "paranthas",
        description: "Stuffed flatbread with spiced potatoes and onions",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Gobhi Parantha",
        price: 145,
        category: "paranthas",
        description: "Stuffed flatbread with spiced grated cauliflower",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Parantha",
        price: 145,
        category: "paranthas",
        description: "Flatbread stuffed with spiced paneer stuffing",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Pudina Parantha",
        price: 155,
        category: "paranthas",
        description: "Crispy layered whole wheat bread flavored with mint leaves",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Mix Veg Parantha",
        price: 145,
        category: "paranthas",
        description: "Flatbread stuffed with a combination of spiced vegetables",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },

    // SALAD
    {
        name: "Green Salad",
        price: 95,
        category: "salad",
        description: "Fresh sliced cucumber, tomatoes, onions, carrots, and lemon",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Onion Salad",
        price: 85,
        category: "salad",
        description: "Sliced onion rings with chat masala and lemon juice",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Kachumar Salad",
        price: 130,
        category: "salad",
        description: "Diced onions, tomatoes, and cucumbers tossed in lemon juice",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Pasta Salad",
        price: 150,
        category: "salad",
        description: "Cold pasta tossed with bell peppers, corn, and olive oil dressing",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Russian Salad",
        price: 160,
        category: "salad",
        description: "Boiled potatoes, carrots, peas, and pineapple tossed in sweet eggless mayonnaise",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"
    },

    // PAPAD
    {
        name: "Roasted Papad",
        price: 65,
        category: "papad",
        description: "Crispy roasted papadums",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Fried Papad",
        price: 75,
        category: "papad",
        description: "Crisp, oil-fried papadums",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Masala Papad",
        price: 85,
        category: "papad",
        description: "Roasted papadum topped with spiced onions, tomatoes and coriander",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Masala Fried Papad",
        price: 95,
        category: "papad",
        description: "Deep fried papadum topped with spiced onion and tomato salsa",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },

    // RAITA
    {
        name: "Plain Curd",
        price: 125,
        category: "raita",
        description: "Chilled fresh yogurt",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Veg Raita",
        price: 170,
        category: "raita",
        description: "Yogurt with chopped cucumber, onions, tomatoes and spices",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Boondi Raita",
        price: 170,
        category: "raita",
        description: "Yogurt combined with tiny fried chickpea flour balls (boondi)",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cucumber Raita",
        price: 170,
        category: "raita",
        description: "Grated fresh cucumber in spiced yogurt",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Pineapple Raita",
        price: 215,
        category: "raita",
        description: "Yogurt whipped with sweet pineapple chunks",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80"
    },

    // FULL MEALS
    {
        name: "Standard Thali",
        price: 320,
        category: "full meals",
        description: "Dal Fry + Vegetable + Rice + 2 Tandoori Roti + Raita + Salad",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Pinch of Salt Premium Thali",
        price: 450,
        category: "full meals",
        description: "Dal Makhani + Vegetable + Paneer + Pulao + 2 Lacha Parantha + Raita + Salad + Sweet",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chinese Thali",
        price: 450,
        category: "full meals",
        description: "Manchurian Gravy + Fried Rice + Chowmein + Honey Chilly Potato + Spring Roll + Sweet",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },

    // MINI MEALS
    {
        name: "Sabji + Rice / 2 Tandoori Roti + Raita + Salad",
        price: 240,
        category: "mini meal",
        description: "Homestyle seasonal vegetable served with Rice or 2 rotis, raita and salad",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dal Tadka + Rice / Roti + Raita + Salad",
        price: 240,
        category: "mini meal",
        description: "Yellow lentils cooked with spices and served with rice or rotis",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer + Rice / Roti + Raita + Salad",
        price: 260,
        category: "mini meal",
        description: "Paneer butter masala served with basmati rice or rotis",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chole + Rice + Raita + Salad",
        price: 220,
        category: "mini meal",
        description: "Piquant chickpeas in Punjabi gravy, served with basmati rice",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Dal Makhani + 2 Lacha Parantha + Raita",
        price: 260,
        category: "mini meal",
        description: "Rich black lentils with 2 flaky paranthas and raita",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Butter Masala + 2 Naan + Raita",
        price: 300,
        category: "mini meal",
        description: "Paneer butter masala with 2 butter naans and raita",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Veg. Manchurian + Noodles / Fried Rice",
        price: 260,
        category: "mini meal",
        description: "vegetable dumplings in hot gravy with noodles or fried rice",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
    },

    // DESSERTS
    {
        name: "Ice Cream (Single Scoop)",
        price: 50,
        category: "desserts",
        description: "Chilled single scoop of ice cream. Select flavor:",
        isVeg: true,
        isAvailable: true,
        variants: [
            { name: "Vanilla", priceModifier: 0 },
            { name: "Chocolate", priceModifier: 0 },
            { name: "Coffee", priceModifier: 0 },
            { name: "Butterscotch", priceModifier: 0 }
        ],
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Gulab Jamun",
        price: 50,
        category: "desserts",
        description: "Two hot round khoya dumplings in cardamom sugar syrup",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Gulab Jamun + Ice Cream",
        price: 135,
        category: "desserts",
        description: "fusion of warm sweet gulab jamun served with cold vanilla scoop",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Kesar Pista Kulfi",
        price: 190,
        category: "desserts",
        description: "frozen Indian dairy dessert flavored with saffron and pistachios",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Sizzling Brownie",
        price: 160,
        category: "desserts",
        description: "A rich hot chocolate brownie topped with chocolate syrup",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Rasgulla",
        price: 50,
        category: "desserts",
        description: "Spongy cottage cheese balls cooked in sugar syrup",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Sizzling Brownie/Ice Cream",
        price: 190,
        category: "desserts",
        description: "Hot chocolate brownie on a sizzler plate topped with a scoop of vanilla ice cream and chocolate fudge",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=80"
    },

    // HOT COFFEE (NEW)
    {
        name: "Espresso (single)",
        price: 120,
        category: "hot coffee",
        description: "Single shot of dark, rich espresso",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Americano (black Shot + hot Water)",
        price: 120,
        category: "hot coffee",
        description: "Rich espresso diluted with hot water for a smooth black coffee",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Espresso (double)",
        price: 120,
        category: "hot coffee",
        description: "Double shot of rich espresso for extra kick",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Irish Coffee",
        price: 149,
        category: "hot coffee",
        description: "Hot coffee flavored with rich Irish syrup and whipped cream top",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Afagato (espresso shot with vanilla ice cream)",
        price: 149,
        category: "hot coffee",
        description: "A scoop of vanilla ice cream 'drowned' with a shot of hot espresso",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cappuccino",
        price: 169,
        category: "hot coffee",
        description: "Espresso with thick steamed milk foam layer",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Hazelnut Cappuccino",
        price: 189,
        category: "hot coffee",
        description: "Classic cappuccino infused with aromatic hazelnut flavor",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Café Latte",
        price: 169,
        category: "hot coffee",
        description: "Smooth, milky coffee with a light layer of milk foam",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Café Mocha",
        price: 149,
        category: "hot coffee",
        description: "Rich espresso combined with chocolate sauce and steamed milk",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Macchiato",
        price: 159,
        category: "hot coffee",
        description: "Espresso stained with a tiny dollop of steamed milk foam",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },

    // HOT CHOCOLATE
    {
        name: "Nutella Hot Chocolate",
        price: 189,
        category: "hot chocolate",
        description: "Creamy steamed milk blended with real Nutella spread",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Regular Hot Chocolate",
        price: 149,
        category: "hot chocolate",
        description: "Classic rich, warm and comforting chocolate beverage",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Ferrero Rocher Hot Chocolate",
        price: 249,
        category: "hot chocolate",
        description: "Rich hot chocolate flavored with hazelnut and Ferrero Rocher pieces",
        isVeg: true,
        isAvailable: true,
        tags: ["Chef Special"],
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },

    // FRAPPE
    {
        name: "Cold Coffee",
        price: 169,
        category: "frappe",
        description: "Classic blended cold coffee with milk and ice cream",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Caramel Frappe",
        price: 169,
        category: "frappe",
        description: "Blended cold coffee loaded with rich caramel syrup",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cold Coffee With Ice Cream",
        price: 179,
        category: "frappe",
        description: "Creamy cold coffee served with an extra scoop of vanilla ice cream",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Irish Frappe",
        price: 229,
        category: "frappe",
        description: "Frappe blended with Irish cream flavored syrup",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Chocochip Frappe",
        price: 229,
        category: "frappe",
        description: "Chocolate flavored frappe loaded with crunchy chocolate chips",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Oreo Frappe",
        price: 249,
        category: "frappe",
        description: "Delicious cold coffee blended with Oreo cookies and chocolate drizzle",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Nutella Frappe",
        price: 299,
        category: "frappe",
        description: "Signature cold coffee blended with rich Nutella paste",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Tiramisu Frappe",
        price: 289,
        category: "frappe",
        description: "Indulgent coffee frappe flavored like the classic Italian Tiramisu dessert",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },

    // ICED COFFEE
    {
        name: "Iced Espresso",
        price: 89,
        category: "iced coffee",
        description: "Espresso shot served chilled over ice blocks",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Iced Americano",
        price: 99,
        category: "iced coffee",
        description: "Espresso over ice diluted with cold water",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Iced Caramel Coffee",
        price: 129,
        category: "iced coffee",
        description: "Chilled milk and espresso flavored with sweet caramel syrup",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Iced Mocha",
        price: 129,
        category: "iced coffee",
        description: "Chilled espresso with chocolate sauce and milk over ice",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Iced Latte",
        price: 129,
        category: "iced coffee",
        description: "Classic iced latte with espresso and chilled milk",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80"
    },

    // SHAKE
    {
        name: "Chocolate Shake",
        price: 180,
        category: "shake",
        description: "Rich blended chocolate milkshake",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Strawberry Shake",
        price: 180,
        category: "shake",
        description: "Sweet strawberry blended milkshake",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Butter Scotch Shake",
        price: 180,
        category: "shake",
        description: "Caramelly butterscotch milkshake",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Oreo Shake",
        price: 190,
        category: "shake",
        description: "Thick milkshake blended with Oreo biscuits",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Kit Kat Shake",
        price: 195,
        category: "shake",
        description: "Yummy milkshake blended with crispy Kit Kat bars",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Brownie Shake",
        price: 195,
        category: "shake",
        description: "Extremely thick milkshake blended with chocolate fudge brownies",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Banana Peanut Butter Shake",
        price: 195,
        category: "shake",
        description: "Healthy and filling banana shake blended with creamy peanut butter",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Nutella Almond Shake",
        price: 219,
        category: "shake",
        description: "Decadent milkshake with Nutella and crunchy roasted almonds",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80"
    },

    // ICE TEA
    {
        name: "Lemon Ice Tea",
        price: 129,
        category: "ice tea",
        description: "Refreshing cold brewed tea flavored with lemon juice",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Mint Ice Tea",
        price: 129,
        category: "ice tea",
        description: "Cooling ice tea flavored with fresh mint leaves",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Pineapple Ice Tea",
        price: 129,
        category: "ice tea",
        description: "Tropical twist of pineapple juice with brewed ice tea",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cranberry Ice Tea",
        price: 129,
        category: "ice tea",
        description: "Tart cranberry juice mixed with sweet ice tea",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Red Bull Ice Tea",
        price: 149,
        category: "ice tea",
        description: "Energetic fusion of Red Bull and refreshing iced tea",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },

    // MOCKTAILS
    {
        name: "Masala Lemonade",
        price: 119,
        category: "mocktails",
        description: "Tangy Indian street style spiced lemonade",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Virgin Mojito",
        price: 129,
        category: "mocktails",
        description: "Classic refresher with mint, lime juice, sugar syrup and sparkling soda",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Blue Lagoon",
        price: 109,
        category: "mocktails",
        description: "Beautiful blue curaçao mocktail with lemon and sprite",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Masala Coke",
        price: 119,
        category: "mocktails",
        description: "Chilled Coca Cola spiced with black salt and chat masala",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Mint Lemonade",
        price: 129,
        category: "mocktails",
        description: "Zesty lemon drink blended with cooling mint paste",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Aam Panna",
        price: 149,
        category: "mocktails",
        description: "Traditional sweet-sour green raw mango cooler",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cranberry Cooler",
        price: 149,
        category: "mocktails",
        description: "Tangy iced cranberry beverage with lime twist",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Strawberry Pop Soda",
        price: 149,
        category: "mocktails",
        description: "Fizzy strawberry soda drink served ice cold",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Fruit Punch",
        price: 159,
        category: "mocktails",
        description: "Blend of assorted fruit juices and vanilla base",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"
    },

    // ALONG WITH COFFEE
    {
        name: "Cookies Assorted",
        price: 69,
        category: "along with coffee",
        description: "Assorted sweet cookies perfect with a hot coffee cup",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Coffee Break Vada Pav",
        price: 100,
        category: "along with coffee",
        description: "Mumbai style potato patty bun",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Brownies",
        price: 99,
        category: "along with coffee",
        description: "Soft, fudgy chocolate brownies",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Coffee Fries",
        price: 170,
        category: "along with coffee",
        description: "Classic salted crispy french fries served with coffee",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Coffee Peri Peri Fries",
        price: 170,
        category: "along with coffee",
        description: "Peri peri french fries to accompany coffee",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Coffee Cheese Fries",
        price: 190,
        category: "along with coffee",
        description: "French fries with warm cheese sauce",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80"
    },

    // MAGGI
    {
        name: "Loaded Veg Maggi",
        price: 149,
        category: "maggi",
        description: "Nostalgic Maggi noodles loaded with chopped veggies and spices",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Double Cheese Maggi",
        price: 189,
        category: "maggi",
        description: "Veg Maggi noodles baked with double layer of cheese",
        isVeg: true,
        isAvailable: true,
        tags: ["Must Try"],
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80"
    },

    // SANDWICHES
    {
        name: "Veg Grill Sandwich",
        price: 149,
        category: "sandwiches",
        description: "Grilled sandwich loaded with sliced fresh cucumber, tomatoes, and potatoes",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Cheese Grill Sandwich",
        price: 189,
        category: "sandwiches",
        description: "Grilled sandwich with lots of melting mozzarella cheese",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Veggie Delight Sandwich",
        price: 229,
        category: "sandwiches",
        description: "Rich layered sandwich with corn, capsicum, olives, and cheese spread",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Paneer Sandwich",
        price: 229,
        category: "sandwiches",
        description: "Sandwich stuffed with spiced crumbled paneer and fresh veggies",
        isVeg: true,
        isAvailable: true,
        tags: ["Popular"],
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80"
    },

    // NACHOS
    {
        name: "Cheese Nachos",
        price: 169,
        category: "nachos",
        description: "Crispy tortilla chips topped with cheese sauce and jalapenos",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=500&q=80"
    },
    {
        name: "Nachos Bhel",
        price: 199,
        category: "nachos",
        description: "Unique fusion of nachos with chopped onions, tomatoes and chutneys",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=500&q=80"
    }
];

async function authenticateAndSeed() {
    const email = "temp_seeder@dhaba.com";
    const password = "seeder12345password";
    
    try {
        console.log("Authenticating with Firebase Auth...");
        let userCredential;
        try {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in successfully!");
        } catch (authError) {
            if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
                console.log("User not found, registering a new staff user...");
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("Created user and logged in successfully!");
            } else {
                throw authError;
            }
        }
        
        console.log("1. Fetching existing menu items...");
        const menuRef = collection(db, "restaurants", restaurantId, "menuItems");
        const snapshot = await getDocs(menuRef);
        
        console.log(`Found ${snapshot.size} existing items. Deleting them...`);
        const deletePromises = snapshot.docs.map(itemDoc => deleteDoc(doc(db, "restaurants", restaurantId, "menuItems", itemDoc.id)));
        await Promise.all(deletePromises);
        console.log("Successfully cleared previous menu items.");

        console.log(`2. Seeding ${menuItems.length} new menu items...`);
        
        const batchSize = 50;
        for (let i = 0; i < menuItems.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = menuItems.slice(i, i + batchSize);
            
            chunk.forEach(item => {
                const newDocRef = doc(collection(db, "restaurants", restaurantId, "menuItems"));
                batch.set(newDocRef, item);
            });
            
            await batch.commit();
            console.log(`Committed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(menuItems.length / batchSize)}`);
        }
        
        console.log("🎉 Seeding completed successfully!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error seeding menu:", e);
        process.exit(1);
    }
}

authenticateAndSeed();
