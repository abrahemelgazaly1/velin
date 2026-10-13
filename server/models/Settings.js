import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  instapay: { type: String, default: '' },
  vodafone: { type: String, default: '' },
  instagram: { type: String, default: '' },
  tiktok: { type: String, default: '' },
  delivery: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
