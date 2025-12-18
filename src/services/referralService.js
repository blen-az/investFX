// src/services/referralService.js
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Generate or get user's referral code
 */
export async function getUserReferralCode(userId) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Return existing code or generate new one
    if (userData.referralCode) {
        return userData.referralCode;
    }

    // Generate unique referral code
    const referralCode = generateReferralCode();

    await updateDoc(userRef, {
        referralCode,
        referralLink: `${window.location.origin}/signup?ref=${referralCode}`
    });

    return referralCode;
}

/**
 * Generate unique referral code
 */
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Get referral statistics
 */
export async function getReferralStats(userId) {
    // Get all referrals where this user is the referrer
    const referralsQuery = query(
        collection(db, 'users'),
        where('referredBy', '==', userId)
    );

    const referralsSnapshot = await getDocs(referralsQuery);
    const totalReferrals = referralsSnapshot.size;

    // Get commissions earned
    const commissionsQuery = query(
        collection(db, 'commissions'),
        where('agentId', '==', userId),
        where('type', '==', 'referral')
    );

    const commissionsSnapshot = await getDocs(commissionsQuery);
    let totalEarnings = 0;

    commissionsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.amount) {
            totalEarnings += data.amount;
        }
    });

    // Count active referrals (users with balance > 0 or trades > 0)
    let activeReferrals = 0;
    referralsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.balance > 0 || data.totalTrades > 0) {
            activeReferrals++;
        }
    });

    return {
        totalReferrals,
        activeReferrals,
        totalEarnings: totalEarnings || 0
    };
}

/**
 * Record referral when new user signs up
 */
export async function recordReferral(newUserId, referralCode) {
    if (!referralCode) return;

    // Find referrer by code
    const usersQuery = query(
        collection(db, 'users'),
        where('referralCode', '==', referralCode)
    );

    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
        console.warn('Invalid referral code:', referralCode);
        return;
    }

    const referrerId = usersSnapshot.docs[0].id;

    // Update new user with referrer
    await updateDoc(doc(db, 'users', newUserId), {
        referredBy: referrerId,
        referralCode: referralCode
    });

    // Create referral record
    await setDoc(doc(collection(db, 'referrals')), {
        referrerId,
        referredUserId: newUserId,
        status: 'active',
        createdAt: serverTimestamp()
    });

    return referrerId;
}

/**
 * Calculate and record referral commission
 */
export async function recordReferralCommission(traderId, tradeAmount) {
    const traderRef = doc(db, 'users', traderId);
    const traderDoc = await getDoc(traderRef);

    if (!traderDoc.exists()) return;

    const traderData = traderDoc.data();
    const referrerId = traderData.referredBy;

    if (!referrerId) return;

    // 10% commission
    const commissionRate = 0.10;
    const commissionAmount = tradeAmount * commissionRate;

    // Create commission record
    await setDoc(doc(collection(db, 'commissions')), {
        agentId: referrerId,
        traderId,
        type: 'referral',
        amount: commissionAmount,
        tradeAmount,
        status: 'paid',
        createdAt: serverTimestamp()
    });

    // Update referrer's balance
    const referrerRef = doc(db, 'users', referrerId);
    const referrerDoc = await getDoc(referrerRef);

    if (referrerDoc.exists()) {
        const currentBalance = referrerDoc.data().balance || 0;
        await updateDoc(referrerRef, {
            balance: currentBalance + commissionAmount
        });
    }
}
