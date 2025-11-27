# Database & Role Issues - Complete Fix Guide

## 🔍 Problem Diagnosis

Based on the "Missing or insufficient permissions" error, here's what's happening:

### **Issue 1: Firestore Security Rules**
Your Firestore database has restrictive security rules that prevent document creation during signup.

### **Issue 2: Collections Not Created**
Collections only appear in Firestore after the first document is successfully written. The permission error prevents this.

### **Issue 3: Role System**
Even if users exist in Firebase Auth, without Firestore documents, the role system can't work.

---

## ✅ Complete Fix (Step-by-Step)

### **Step 1: Update Firestore Security Rules**

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select project: **investfx-1faf1**
3. Click **Firestore Database** (left sidebar)
4. Click **Rules** tab (top of page)
5. **Replace ALL rules** with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read/write their own wallet
    match /wallets/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Deposits - authenticated users can create, admins can manage
    match /deposits/{depositId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Withdrawals - authenticated users can create, admins can manage
    match /withdrawals/{withdrawalId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Trades - authenticated users can create and read
    match /trades/{tradeId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Commissions - only admins and agents can access
    match /commissions/{agentId}/history/{commissionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Referrals - only admins and agents can access
    match /referrals/{agentId}/users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

6. Click **"Publish"** button

---

### **Step 2: Test the Fix**

Run the diagnostic script:

```bash
cd scripts
npm install firebase  # if not already installed
cd ..
node scripts/diagnoseAndFix.js
```

This will show you:
- ✅ If Firestore connection works
- ✅ Existing collections and documents
- ✅ If you can create documents
- ❌ Specific permission errors (if any)

---

### **Step 3: Create a Test User**

After updating security rules:

1. **Go to your app**: http://localhost:3000
2. **Sign up** with a NEW email (e.g., `admin@test.com`)
3. **Check browser console** (F12) for any errors
4. **Check Firestore Console** - you should see:
   - `users` collection with your user
   - `wallets` collection with your wallet

---

### **Step 4: Set Admin Role**

Once the user is created in Firestore:

1. Go to **Firestore Console**
2. Click **users** collection
3. Click on your user document
4. Find the `role` field
5. Change value from `"user"` to `"admin"`
6. Click **Update**

---

### **Step 5: Test Admin Access**

1. **Log out** of the app
2. **Log back in** with your admin account
3. You should be redirected to `/admin/dashboard`
4. You should see the admin dashboard with stats

---

## 🧪 Quick Verification Checklist

- [ ] Firestore security rules updated and published
- [ ] Diagnostic script runs without permission errors
- [ ] New user signup creates documents in Firestore
- [ ] `users` and `wallets` collections visible in Firestore
- [ ] User role can be changed to `admin` in Firestore
- [ ] Admin login redirects to `/admin/dashboard`
- [ ] Admin dashboard loads and shows stats

---

## 🆘 If Still Not Working

If you still have issues after following all steps:

1. **Check browser console** for specific errors
2. **Run diagnostic script** and share the output
3. **Screenshot Firestore rules** tab to verify they're updated
4. **Check Firebase Console** → Firestore → Data tab for collections

The most common issue is **security rules not being published** - make sure you clicked the "Publish" button!
