// Debug script - Check user role in Firestore
// Run this to verify your role is correctly set
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDTdhyBMYdpOy3a7SDYHyXmFJPgD5Ao7nA",
    authDomain: "investfx-1faf1.firebaseapp.com",
    projectId: "investfx-1faf1",
    storageBucket: "investfx-1faf1.firebasestorage.app",
    messagingSenderId: "310036681524",
    appId: "1:310036681524:web:7937a954a237d15c030b61"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUserRoles() {
    console.log('🔍 Checking all user roles in Firestore...\n');

    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));

        if (usersSnapshot.empty) {
            console.log('❌ No users found in Firestore!');
            console.log('   Make sure you have created user documents.\n');
            process.exit(1);
        }

        console.log(`Found ${usersSnapshot.size} user(s):\n`);

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Email: ${data.email}`);
            console.log(`UID: ${doc.id}`);
            console.log(`Role: ${data.role || 'NOT SET ❌'}`);
            console.log(`Frozen: ${data.frozen || false}`);
            console.log(`Referred By: ${data.referredBy || 'None'}`);
            console.log('');
        });

        const adminUsers = [];
        usersSnapshot.forEach(doc => {
            if (doc.data().role === 'admin') {
                adminUsers.push(doc.data().email);
            }
        });

        if (adminUsers.length > 0) {
            console.log(`✅ Admin users found: ${adminUsers.join(', ')}`);
        } else {
            console.log('⚠️  No admin users found!');
            console.log('   Set a user role to "admin" in Firestore Console.\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking roles:', error);
        process.exit(1);
    }
}

checkUserRoles();
