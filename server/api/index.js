import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Product from '../models/Product.js';
import Order from '../models/Order.js';
import PromoCode from '../models/PromoCode.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import { auth, adminOnly } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import { Buffer } from 'buffer';
import nodemailer from 'nodemailer';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Email transporter setup
console.log('📧 Email Config Check:', {
  host: process.env.EMAIL_HOST,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? '****' : undefined,
  admin: process.env.ADMIN_EMAIL
});

let emailTransporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('✅ Email transporter initialized successfully');
} else {
  console.log('❌ Email transporter NOT initialized - missing config');
}

// Helper: Send order notification email
async function sendOrderNotification(order) {
  if (!emailTransporter || !process.env.ADMIN_EMAIL) {
    console.log('Email not configured, skipping notification');
    return;
  }

  try {
    const items = order.items.map(item => 
      `• ${item.name} - Size: ${item.size}, Color: ${item.colour}, Qty: ${item.quantity}, Price: ${item.price} EGP`
    ).join('\n');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `🛍️ New Order #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="background: #000; color: #fff; padding: 20px; text-align: center;">
            VÉLIN - New Order Received
          </h2>
          
          <div style="padding: 20px; border: 1px solid #ddd;">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-US')}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            
            <h3 style="margin-top: 30px;">Customer Information</h3>
            <p><strong>Name:</strong> ${order.personal.name}</p>
            <p><strong>Phone 1:</strong> ${order.personal.phone1}</p>
            <p><strong>Phone 2:</strong> ${order.personal.phone2 || 'N/A'}</p>
            <p><strong>Governorate:</strong> ${order.personal.governorate}</p>
            <p><strong>Address:</strong> ${order.personal.address}</p>
            
            <h3 style="margin-top: 30px;">Products Ordered</h3>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${items}</pre>
            
            <h3 style="margin-top: 30px;">Payment Details</h3>
            <p><strong>Method:</strong> ${order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method === 'instapay' ? 'InstaPay' : 'Vodafone Cash'}</p>
            ${order.transfer ? `
              <p><strong>Sender:</strong> ${order.transfer.sender}</p>
              <p><strong>Amount Sent:</strong> ${order.transfer.amount} EGP</p>
            ` : ''}
            
            <h3 style="margin-top: 30px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Subtotal:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${order.subtotal} EGP</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Shipping:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${order.shipping} EGP</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Discount:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #d32f2f;">-${order.discount} EGP</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 12px 8px; font-weight: bold; font-size: 18px;">Total:</td>
                <td style="padding: 12px 8px; font-weight: bold; font-size: 18px; text-align: right;">${order.total} EGP</td>
              </tr>
            </table>
            
            <div style="margin-top: 30px; padding: 15px; background: #f0f0f0; border-radius: 5px; text-align: center;">
              <p style="margin: 0;">Log in to your admin panel to manage this order</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} VÉLIN. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('Order notification email sent successfully');
  } catch (error) {
    console.error('Error sending order notification:', error);
    // Don't throw error - we don't want to fail the order if email fails
  }
}

// Helper: Compress image to WebP and convert to Base64
const compressImage = async (buffer) => {
  try {
    const compressed = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    return Buffer.from(compressed).toString('base64');
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Failed to compress image');
  }
};

// ============= AUTH =============
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.create({ email, password, role: 'user' });
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create admin user (for initial setup)
router.post('/auth/create-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const admin = await User.create({
      email,
      password,
      role: 'admin'
    });
    
    res.status(201).json({ message: 'Admin user created', user: { id: admin._id, email: admin.email, role: admin.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============= PRODUCTS =============
router.get('/products', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    
    let products = Product.find(query);
    if (sort === 'price-asc') products = products.sort({ price: 1 });
    if (sort === 'price-desc') products = products.sort({ price: -1 });
    if (sort === 'newest') products = products.sort({ createdAt: -1 });
    
    const result = await products;
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', auth, adminOnly, upload.array('images', 30), async (req, res) => {
  try {
    const { name, price, description, sizes, colours, category, best_seller, sold_out, sold_sizes, sold_colours } = req.body;
    
    const images = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const compressed = await compressImage(file.buffer);
        images.push({
          data: compressed,
          contentType: 'image/webp'
        });
      }
    }
    
    const product = await Product.create({
      name,
      price: Number(price),
      description,
      images,
      sizes: JSON.parse(sizes || '[]'),
      colours: JSON.parse(colours || '[]'),
      category: category || 'crow-neck',
      best_seller: best_seller === 'true',
      sold_out: sold_out === 'true',
      sold_sizes: JSON.parse(sold_sizes || '[]'),
      sold_colours: JSON.parse(sold_colours || '[]')
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/products/:id', auth, adminOnly, upload.array('images', 30), async (req, res) => {
  try {
    const { name, price, description, sizes, colours, category, best_seller, sold_out, sold_sizes, sold_colours } = req.body;
    
    const updates = {
      name,
      price: Number(price),
      description,
      sizes: JSON.parse(sizes || '[]'),
      colours: JSON.parse(colours || '[]'),
      category,
      best_seller: best_seller === 'true',
      sold_out: sold_out === 'true',
      sold_sizes: JSON.parse(sold_sizes || '[]'),
      sold_colours: JSON.parse(sold_colours || '[]')
    };
    
    if (req.files?.length) {
      const images = [];
      for (const file of req.files) {
        const compressed = await compressImage(file.buffer);
        images.push({
          data: compressed,
          contentType: 'image/webp'
        });
      }
      updates.images = images;
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/products/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ORDERS =============
router.get('/orders', auth, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    
    // Populate product images for items that have productId
    const populatedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      if (orderObj.items && Array.isArray(orderObj.items)) {
        orderObj.items = await Promise.all(orderObj.items.map(async (item) => {
          if (item.productId && !item.image) {
            try {
              const product = await Product.findById(item.productId);
              if (product && product.images && product.images.length > 0) {
                item.image = product.images[0];
              }
            } catch (err) {
              console.error('Error fetching product:', err);
            }
          }
          return item;
        }));
      }
      
      return orderObj;
    }));
    
    res.json({ data: populatedOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders', upload.single('screenshot'), async (req, res) => {
  try {
    const { token, request_id, items, personal, payment_method, promo, transfer, subtotal, shipping, discount, total } = req.body;
    
    console.log('Order request:', { token, request_id, payment_method, promo, hasTransfer: !!transfer });
    
    let transferData = transfer ? JSON.parse(transfer) : null;
    if (req.file && transferData) {
      const compressed = await compressImage(req.file.buffer);
      transferData.screenshot = {
        data: compressed,
        contentType: 'image/webp'
      };
    }
    
    const order = await Order.create({
      token,
      request_id,
      items: JSON.parse(items),
      personal: JSON.parse(personal),
      payment_method,
      promo: promo || '',
      transfer: transferData,
      subtotal: Number(subtotal),
      shipping: Number(shipping),
      discount: Number(discount),
      total: Number(total)
    });
    
    // Increment promo code usage if promo was used
    if (promo && promo.trim()) {
      try {
        const promoCode = await PromoCode.findOne({ code: promo.trim().toUpperCase() });
        if (promoCode) {
          promoCode.uses = (promoCode.uses || 0) + 1;
          await promoCode.save();
        }
      } catch (promoErr) {
        console.error('Error updating promo code usage:', promoErr);
        // Don't fail the order if promo update fails
      }
    }
    
    // Send email notification to admin
    await sendOrderNotification(order);
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/orders/:id', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============= PROMO CODES =============
router.get('/promo-codes', auth, adminOnly, async (req, res) => {
  try {
    // Delete expired promo codes
    const now = new Date();
    await PromoCode.deleteMany({
      $or: [
        { expires_at: { $lt: now } },
        { $expr: { $gte: ['$uses', '$max_uses'] } }
      ]
    });
    
    // Get remaining promo codes
    const codes = await PromoCode.find().sort({ createdAt: -1 });
    res.json({ data: codes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/promo-codes/check', async (req, res) => {
  try {
    const { code } = req.body;
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    
    if (!promo) return res.status(404).json({ error: 'Invalid code' });
    if (new Date(promo.expires_at) < new Date()) return res.status(400).json({ error: 'Code expired' });
    if (promo.uses >= promo.max_uses) return res.status(400).json({ error: 'Code limit reached' });
    
    res.json({ discount: promo.discount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/promo-codes/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    
    if (!promo) return res.status(404).json({ error: 'Invalid code' });
    if (new Date(promo.expires_at) < new Date()) return res.status(400).json({ error: 'Code expired' });
    if (promo.uses >= promo.max_uses) return res.status(400).json({ error: 'Code limit reached' });
    
    res.json({ discount: promo.discount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/promo-codes', auth, adminOnly, async (req, res) => {
  try {
    const { code, discount, expires_at, max_uses } = req.body;
    const promo = await PromoCode.create({ code: code.toUpperCase(), discount, expires_at, max_uses });
    res.status(201).json(promo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/promo-codes/:id', auth, adminOnly, async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ error: 'Promo code not found' });
    res.json({ message: 'Promo code deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SETTINGS =============
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ data: settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= UPLOAD =============
router.post('/upload', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const compressed = await compressImage(req.file.buffer);
    
    res.json({ 
      data: compressed, 
      contentType: 'image/webp' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get screenshot by path (for old orders)
router.get('/screenshot/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find order with this screenshot
    const order = await Order.findOne({
      'transfer.screenshot': { $regex: filename }
    });
    
    if (!order || !order.transfer || !order.transfer.screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    
    const screenshot = order.transfer.screenshot;
    
    // If it's already base64, return it
    if (typeof screenshot === 'object' && screenshot.data) {
      res.json({
        data: screenshot.data,
        contentType: screenshot.contentType || 'image/webp'
      });
    } else {
      res.status(404).json({ error: 'Screenshot not available' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', auth, adminOnly, async (req, res) => {
  try {
    const { instapay, vodafone, instagram, tiktok, delivery } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ instapay, vodafone, instagram, tiktok, delivery });
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, { instapay, vodafone, instagram, tiktok, delivery }, { new: true });
    }
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
