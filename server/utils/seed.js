const Product = require('../models/Product');
const User = require('../models/User');

const dairyProducts = [
  {
    name: 'Fresh Cow Milk',
    category: 'milk',
    description: 'Pure and fresh cow milk sourced from local farms. Rich in calcium and protein. Delivered daily to your doorstep.',
    price: 60,
    unit: 'per liter',
    stock: 200,
    lowStockThreshold: 20,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop',
    isAvailable: true
  },
  {
    name: 'Buffalo Milk',
    category: 'milk',
    description: 'Thick and creamy buffalo milk. Higher fat content for richer taste. Perfect for making sweets and paneer.',
    price: 70,
    unit: 'per liter',
    stock: 150,
    lowStockThreshold: 15,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop',
    isAvailable: true
  },
  {
    name: 'Fresh Paneer',
    category: 'paneer',
    description: 'Soft and fresh homemade paneer made from pure milk. Perfect for curries, tikkas, and snacks.',
    price: 320,
    unit: 'per kg',
    stock: 50,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop',
    isAvailable: true
  },
  {
    name: 'Fresh Curd',
    category: 'curd',
    description: 'Thick, creamy and naturally set curd. Made from fresh whole milk. Great for raita, lassi, and cooking.',
    price: 50,
    unit: 'per kg',
    stock: 100,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
    isAvailable: true
  },
  {
    name: 'Pure Butter',
    category: 'butter',
    description: 'Freshly churned white butter from pure cream. No preservatives added. Traditional Sangli style makhan.',
    price: 550,
    unit: 'per kg',
    stock: 30,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=300&fit=crop',
    isAvailable: true
  },
  {
    name: 'Desi Ghee',
    category: 'ghee',
    description: 'Pure A2 desi cow ghee made using traditional bilona method. Rich aroma and golden color.',
    price: 700,
    unit: 'per liter',
    stock: 40,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1600398142498-f5610992b066?w=400&h=300&fit=crop',
    isAvailable: true
  },
  {
    name: 'Fresh Buttermilk',
    category: 'buttermilk',
    description: 'Refreshing homemade buttermilk (chaas). Flavored with cumin, coriander and salt. Perfect for hot days.',
    price: 30,
    unit: 'per liter',
    stock: 80,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1592aboredo?w=400&h=300&fit=crop',
    isAvailable: true
  },
  {
    name: 'Cheese Block',
    category: 'cheese',
    description: 'Premium quality processed cheese made from fresh milk. Great for sandwiches, burgers and cooking.',
    price: 400,
    unit: 'per kg',
    stock: 25,
    lowStockThreshold: 3,
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop',
    isAvailable: true
  }
];

async function seedDatabase() {
  try {
    // Seed products if empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany(dairyProducts);
      console.log('  Seeded 8 dairy products');
    }

    // NOTE: Admin login uses fixed credentials (vasantdadaagency816@gmail.com / vasantdada123)
    // No DB entry needed for admin. Seed only creates a demo customer.

    // Create a demo customer if none exists
    const customerExists = await User.findOne({ role: 'CUSTOMER' });
    if (!customerExists) {
      const customer = new User({
        name: 'Demo Customer',
        email: 'demo@vasantdairy.com',
        password: 'customer123',
        role: 'CUSTOMER',
        milkQuantity: 1.5,
        preferredDeliveryTime: 'Morning',
        subscriptionStatus: 'Active',
        address: { street: 'Market Road', city: 'Sangli', state: 'Maharashtra', pincode: '416416' }
      });
      await customer.save();
      console.log('  Created demo CUSTOMER (Email: demo@vasantdairy.com, Password: customer123)');
    }
  } catch (error) {
    console.error('Seed error:', error.message);
  }
}

module.exports = seedDatabase;
