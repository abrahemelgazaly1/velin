import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  token: String,
  request_id: String,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    size: String,
    colour: String,
    quantity: Number,
    price: Number,
    image: mongoose.Schema.Types.Mixed
  }],
  personal: {
    name: { type: String, required: true },
    governorate: { type: String, required: true },
    address: { type: String, required: true },
    phone1: { type: String, required: true },
    phone2: String
  },
  payment_method: { type: String, enum: ['cod', 'instapay', 'vodafone'], required: true },
  promo: String,
  transfer: {
    sender: String,
    amount: String,
    screenshot: mongoose.Schema.Types.Mixed
  },
  subtotal: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
