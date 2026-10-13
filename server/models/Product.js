import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  images: [{ 
    data: { type: String, required: true }, // Base64 compressed image
    contentType: { type: String, default: 'image/webp' }
  }],
  sizes: [{ type: String }],
  colours: [{
    name: String,
    hex: String
  }],
  category: { type: String, default: 'crow-neck' },
  best_seller: { type: Boolean, default: false },
  sold_out: { type: Boolean, default: false },
  sold_sizes: [{ type: String }],
  sold_colours: [{ type: String }]
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
