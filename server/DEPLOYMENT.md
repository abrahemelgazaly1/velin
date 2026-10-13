# 🚀 VÉLIN Backend - Vercel Deployment Guide

## ✅ نعم، كل حاجه هتشتغل على Vercel!

الـ Backend بتاعك جاهز للـ deployment على Vercel وكل الـ features هتشتغل:
- ✅ API Routes
- ✅ MongoDB Connection
- ✅ File Uploads (Images)
- ✅ Email Notifications
- ✅ Authentication & Admin Panel

---

## 📋 خطوات الـ Deployment:

### 1️⃣ رفع الكود على GitHub
```bash
cd server
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2️⃣ Deploy على Vercel

#### من الـ Dashboard:
1. روح على [vercel.com](https://vercel.com)
2. اضغط **"New Project"**
3. اختار الـ GitHub Repository
4. اختار مجلد **server** كـ Root Directory
5. اضغط **"Deploy"**

#### من الـ CLI:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd server
vercel --prod
```

### 3️⃣ إضافة Environment Variables

لازم تضيف الـ Variables دي في Vercel Dashboard:

1. روح على **Project Settings** → **Environment Variables**
2. ضيف الـ variables دي:

```env
MONGODB_URI=mongodb://abrahemelgazaly2_db_user:HZuUWyEdJCYK38Ff@ac-ifx6p4p-shard-00-00.2fgqrck.mongodb.net:27017,ac-ifx6p4p-shard-00-01.2fgqrck.mongodb.net:27017,ac-ifx6p4p-shard-00-02.2fgqrck.mongodb.net:27017/velin?ssl=true&replicaSet=atlas-u1798h-shard-0&authSource=admin&appName=Cluster0&compressors=zlib

JWT_SECRET=velin-super-secret-jwt-key-2024-change-this-in-production

PORT=3000

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=elgazalyabrahem152@gmail.com
EMAIL_PASS=bbinpqgpwgndxqoj
ADMIN_EMAIL=elgazalyabrahem152@gmail.com
```

⚠️ **مهم**: اضغط **"Save"** بعد كل variable!

### 4️⃣ Redeploy
بعد ما تضيف الـ variables، اعمل redeploy:
- اضغط **"Redeploy"** في الـ Deployments tab
- أو push commit جديد على GitHub

---

## 🌐 تحديث الـ Frontend

بعد ما الـ Backend يتنشر، لازم تحدث الـ API URL في الـ Frontend:

**ملف**: `src/lib/api.ts` أو حيث ما الـ API URL موجود

```typescript
// قبل (Local)
const API_URL = 'http://localhost:3000/api';

// بعد (Production)
const API_URL = 'https://your-backend.vercel.app/api';
```

**أو استخدم environment variable:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

وضيف في `.env` بتاع الـ Frontend:
```env
VITE_API_URL=https://your-backend.vercel.app/api
```

---

## 📝 ملاحظات مهمة:

### ⚠️ Vercel Serverless Functions Limits:
- **Max Execution Time**: 10 seconds (Free), 60 seconds (Pro)
- **Max Payload Size**: 4.5MB
- الـ uploads الكبيرة قد تحتاج CDN منفصل

### ✅ الحلول:
1. **الصور**: أنت بالفعل بتضغطها لـ WebP (تمام ✓)
2. **Email**: Gmail SMTP هيشتغل عادي على Vercel
3. **MongoDB**: Atlas بيشتغل مع Vercel بدون مشاكل

### 🔧 إذا واجهت مشاكل:

**المشكلة**: "Module not found"
```bash
# في مجلد server
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "Fix dependencies"
git push
```

**المشكلة**: "Connection timeout"
- تأكد من IP Whitelist في MongoDB Atlas: أضف `0.0.0.0/0` للسماح لكل الـ IPs

**المشكلة**: "Environment variables not working"
- تأكد إنك ضفت كل الـ variables
- اعمل Redeploy بعد إضافة الـ variables

---

## 🎯 الخلاصة:

### نعم! كل حاجه هتشتغل:
- ✅ Products CRUD
- ✅ Orders Management  
- ✅ Promo Codes
- ✅ Admin Authentication
- ✅ Image Uploads
- ✅ Email Notifications
- ✅ Payment Screenshots

فقط اتبع الخطوات فوق وكل حاجه هتمشي smooth! 🚀

---

## 📞 بعد الـ Deployment:

1. **Test الـ API**: 
   - `https://your-backend.vercel.app/` → يجب أن ترى: `{"message":"VÉLIN API Server","status":"running"}`

2. **Test الـ Routes**:
   - `GET /api/products` → يجب أن تعمل
   - `POST /api/orders` → يجب أن تعمل

3. **Check الـ Logs**:
   - اضغط على **"View Function Logs"** في Vercel Dashboard لمراقبة الـ requests

---

💡 **نصيحة**: احتفظ بنسخة من الـ Environment Variables في مكان آمن!
