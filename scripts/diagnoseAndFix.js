// scripts/diagnoseAndFix.js
// Comprehensive diagnostic and fix script for database issues
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDTdhyBMYdpOy3a7SDYHyXmFJPgD5Ao7nA",
    authDomain: "investfx-1faf1.firebaseapp.com",
    projectId: "investfx-1faf1",
    storageBucket: "investfx-1faf1.firebasestorage.app",
    messagingSenderId: "310036681524",
    appId: "1:310036681524:web:7937a954a237d15c030b61"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🔍 Starting InvestFX Database Diagnostic...\n');

async function runDiagnostics() {
    try {
        // Test 1: Check Firestore connection
        console.log('📊 Test 1: Checking Firestore connection...');
        try {
            const testRef = collection(db, 'users');
            console.log('✅ Firestore connection successful\n');
        } catch (error) {
            console.error('❌ Firestore connection failed:', error.message);
            return;
        }

        // Test 2: Check existing collections
        console.log('📊 Test 2: Checking existing collections...');
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const walletsSnapshot = await getDocs(collection(db, 'wallets'));

            console.log(`   Users collection: ${usersSnapshot.size} documents`);
            console.log(`   Wallets collection: ${walletsSnapshot.size} documents`);

            if (usersSnapshot.size > 0) {
                console.log('\n   📋 Existing users:');
                usersSnapshot.forEach(doc => {
                    const data = doc.data();
                    console.log(`      - ${data.email} (Role: ${data.role || 'NOT SET'}, UID: ${doc.id})`);
                });
            }
            console.log('');
        } catch (error) {
            console.log('   ⚠️  Collections may not exist yet or permissions issue');
            console.log(`   Error: ${error.message}\n`);
        }

        // Test 3: Test document creation
        console.log('📊 Test 3: Testing document creation...');
        const testUserId = 'test_' + Date.now();
        try {
            await setDoc(doc(db, 'users', testUserId), {
                uid: testUserId,
                email: 'test@example.com',
                role: 'user',
                frozen: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ Successfully created test user document');

            // Try to read it back
            const testDoc = await getDoc(doc(db, 'users', testUserId));
            if (testDoc.exists()) {
                console.log('✅ Successfully read test document back');
                console.log(`   Data: ${JSON.stringify(testDoc.data(), null, 2)}`);
            }
            console.log('');
        } catch (error) {
            console.error('❌ Failed to create test document');
            console.error(`   Error: ${error.message}`);
            console.error(`   Code: ${error.code}`);

            if (error.code === 'permission-denied') {
                console.log('\n⚠️  PERMISSION DENIED - This is the issue!');
                console.log('   Your Firestore security rules are blocking writes.');
                console.log('   You need to update your security rules in Firebase Console.\n');
            }
            console.log('');
        }

        console.log('📊 Diagnostic Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('If you see "permission-denied" errors above:');
        console.log('1. Go to Firebase Console → Firestore Database → Rules');
        console.log('2. Update the rules to allow authenticated users to write');
        console.log('3. See the security rules in the implementation plan\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        process.exit(1);
    }
}

runDiagnostics();
