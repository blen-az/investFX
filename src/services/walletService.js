// src/services/walletService.js
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, runTransaction, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Transfer funds between user's internal accounts
 */
export async function transferBetweenAccounts(userId, fromAccount, toAccount, amount) {
    if (!userId || !fromAccount || !toAccount || !amount) {
        throw new Error('Missing required parameters');
    }

    if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
    }

    if (amount < 10) {
        throw new Error('Minimum transfer amount is $10');
    }

    if (fromAccount === toAccount) {
        throw new Error('Cannot transfer to the same account');
    }

    // Use transaction to ensure atomicity
    return await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentBalance = userData.balance || 0;

        // For now, we only have one main balance
        // In a real app, you'd have separate balances for main/trading accounts
        if (currentBalance < amount) {
            throw new Error('Insufficient balance');
        }

        // Create transfer record
        const transferRef = doc(collection(db, 'transfers'));
        transaction.set(transferRef, {
            userId,
            fromAccount,
            toAccount,
            amount,
            status: 'completed',
            createdAt: serverTimestamp()
        });

        // Note: In a real implementation, you'd update separate account balances
        // For now, this creates a record but doesn't actually split balances

        return { success: true, transferId: transferRef.id };
    });
}

/**
 * Get user's transfer history
 */
export async function getUserTransfers(userId, limit = 20) {
    const transfersSnapshot = await getDocs(
        query(
            collection(db, 'transfers'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limit)
        )
    );

    return transfersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Exchange/Convert currency (demo implementation)
 */
export async function exchangeCurrency(userId, fromCurrency, toCurrency, amount, rate) {
    if (!userId || !fromCurrency || !toCurrency || !amount || !rate) {
        throw new Error('Missing required parameters');
    }

    if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
    }

    return await runTransaction(db, async (transaction) => {
        // Create exchange record
        const exchangeRef = doc(collection(db, 'exchanges'));
        transaction.set(exchangeRef, {
            userId,
            fromCurrency,
            toCurrency,
            fromAmount: amount,
            toAmount: amount * rate,
            rate,
            status: 'completed',
            createdAt: serverTimestamp()
        });

        return {
            success: true,
            exchangeId: exchangeRef.id,
            convertedAmount: amount * rate
        };
    });
}

/**
 * Get real-time exchange rates (mock - in production use real API)
 */
export function getExchangeRate(fromCurrency, toCurrency) {
    const rates = {
        'USD-EUR': 0.92,
        'EUR-USD': 1.09,
        'USD-GBP': 0.79,
        'GBP-USD': 1.27,
        'EUR-GBP': 0.86,
        'GBP-EUR': 1.16
    };

    const key = `${fromCurrency}-${toCurrency}`;
    return rates[key] || 1;
}
