# VÉLIN Backend API

Backend server بـ Node.js + Express + MongoDB

## 📦 Installation

```bash
cd server
npm install
```

## ⚙️ Setup

1. انسخ `.env.example` لـ `.env`:
```bash
copy .env.example .env
```

2. غير القيم في `.env`:
- `MONGODB_URI`: رابط MongoDB (local أو Atlas)
- `JWT_SECRET`: مفتاح سري للـ JWT
- `CLOUDINARY_*`: بيانات Cloudinary للصور

## 🚀 Run

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 📚 API Endpoints

### Auth
- `POST /api/auth/login` - تسجيل دخول
- `POST /api/auth/register` - إنشاء حساب
- `GET /api/auth/me` - معلومات المستخدم

### Products
- `GET /api/products` - جميع المنتجات
- `GET /api/products/:id` - منتج واحد
- `POST /api/products` - إضافة منتج (Admin)
- `PUT /api/products/:id` - تعديل منتج (Admin)
- `DELETE /api/products/:id` - حذف منتج (Admin)

### Orders
- `GET /api/orders` - جميع الطلبات (Admin)
- `POST /api/orders` - إنشاء طلب
- `PUT /api/orders/:id` - تحديث حالة الطلب (Admin)

### Promo Codes
- `GET /api/promo-codes` - جميع الأكواد (Admin)
- `POST /api/promo-codes/validate` - التحقق من كود
- `POST /api/promo-codes` - إضافة كود (Admin)
- `DELETE /api/promo-codes/:id` - حذف كود (Admin)

### Settings
- `GET /api/settings` - إعدادات الموقع
- `PUT /api/settings` - تحديث الإعدادات (Admin)

## 🔑 Authentication

استخدم Bearer Token في الـ Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📁 Project Structure

```
server/
├── api/
│   └── index.js          # جميع الـ API routes
├── config/
│   └── db.js             # MongoDB connection
├── middleware/
│   └── auth.js           # JWT authentication
├── models/
│   ├── Product.js
│   ├── Order.js
│   ├── PromoCode.js
│   ├── Settings.js
│   └── User.js
├── .env.example
├── server.js             # Main server file
└── package.json
```

## 🛠 Features

✅ RESTful API
✅ JWT Authentication
✅ MongoDB + Mongoose
✅ Image upload (Cloudinary)
✅ Admin middleware
✅ Error handling
✅ CORS enabled
✅ Environment variables

## 📝 Notes

- الـ API يشتغل على `http://localhost:3000`
- كل الـ routes تبدأ بـ `/api`
- الـ Admin endpoints محمية بـ JWT + role check
