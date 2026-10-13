import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount: { type: Number, required: true, min: 1, max: 70 },
  expires_at: { type: Date, required: true },
  max_uses: { type: Number, default: 50 },
  uses: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('PromoCode', promoCodeSchema);
