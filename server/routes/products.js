const express = require('express');
const Product = require('../models/Product');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    const filter = { isAvailable: true };

    if (category) filter.category = category;
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escapedSearch, $options: 'i' };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const products = await Product.find(filter).sort(sortOption);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product (OWNER, ADMIN, STAFF)
router.post('/', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { name, category, price } = req.body;
    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }
    if (price == null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    const product = new Product({ ...req.body, price: Number(price) });
    await product.save();
    req.app.get('io')?.emit('product_added', product);
    res.status(201).json(product);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join('; ') });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update product (OWNER, ADMIN, STAFF)
router.put('/:id', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    if (req.body.price != null && (isNaN(Number(req.body.price)) || Number(req.body.price) < 0)) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    if (req.body.stock != null && (isNaN(Number(req.body.stock)) || Number(req.body.stock) < 0)) {
      return res.status(400).json({ message: 'Stock must be a non-negative number' });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    req.app.get('io')?.emit('product_updated', product);
    res.json(product);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join('; ') });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete product (OWNER, ADMIN)
router.delete('/:id', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
