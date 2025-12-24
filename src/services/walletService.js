// src/services/walletService.js
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, runTransaction, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Map account names to field names
 */
const ACCOUNT_FIELDS = {
    'funding': 'mainBalance',
    'main': 'mainBalance', // Alias
    'spot': 'spotBalance',
    'futures': 'tradingBalance', // Alias for compatibility
    'trading': 'tradingBalance',
    'earn': 'earnBalance',
    'contract': 'contractBalance',
    'fiat': 'fiatBalance',
    'commission': 'commissionBalance'
};

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

    if (amount < 1) {
        throw new Error('Minimum transfer amount is $1');
    }

    const fromKey = fromAccount.toLowerCase();
    const toKey = toAccount.toLowerCase();

    if (fromKey === toKey) {
        throw new Error('Cannot transfer to the same account');
    }

    const fromField = ACCOUNT_FIELDS[fromKey];
    const toField = ACCOUNT_FIELDS[toKey];

    if (!fromField || !toField) {
        throw new Error(`Invalid account type: ${!fromField ? fromAccount : toAccount}`);
    }

    // Use transaction to ensure atomicity
    return await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, 'wallets', userId);
        const walletDoc = await transaction.get(walletRef);

        if (!walletDoc.exists()) {
            throw new Error('Wallet not found');
        }

        const walletData = walletDoc.data();

        // Check balances with migration fallbacks
        const getBalance = (field) => {
            if (walletData[field] !== undefined) return walletData[field];
            if (field === 'mainBalance') return walletData.balance || 0;
            return 0;
        };

        const fromBalance = getBalance(fromField);
        const toBalance = getBalance(toField);

        if (fromBalance < amount) {
            throw new Error(`Insufficient balance in ${fromAccount} account`);
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

        // Update balances
        transaction.update(walletRef, {
            [fromField]: fromBalance - amount,
            [toField]: toBalance + amount,
            updatedAt: serverTimestamp()
        });

        return { success: true, transferId: transferRef.id };
    });
}

/**
 * Get user's transfer history
 */
export async function getUserTransfers(userId, limitNum = 20) {
    const transfersSnapshot = await getDocs(
        query(
            collection(db, 'transfers'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        )
    );

    return transfersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Exchange/Convert currency
 */
export async function exchangeCurrency(userId, fromCurrency, toCurrency, amount, rate) {
    if (!userId || !fromCurrency || !toCurrency || !amount || !rate) {
        throw new Error('Missing required parameters');
    }

    if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
    }

    return await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, 'wallets', userId);
        const walletDoc = await transaction.get(walletRef);

        if (!walletDoc.exists()) {
            throw new Error('Wallet not found');
        }

        const walletData = walletDoc.data();
        const mainBalance = walletData.mainBalance !== undefined ? walletData.mainBalance : (walletData.balance || 0);

        if (mainBalance < amount) {
            throw new Error('Insufficient balance for exchange');
        }

        const convertedAmount = amount * rate;

        // Create exchange record
        const exchangeRef = doc(collection(db, 'exchanges'));
        transaction.set(exchangeRef, {
            userId,
            fromCurrency,
            toCurrency,
            fromAmount: amount,
            toAmount: convertedAmount,
            rate,
            status: 'completed',
            createdAt: serverTimestamp()
        });

        // Update main balance (assuming exchange happens within main account)
        // In a more complex app, we might have currency-specific accounts
        transaction.update(walletRef, {
            mainBalance: mainBalance - amount + convertedAmount,
            updatedAt: serverTimestamp()
        });

        return {
            success: true,
            exchangeId: exchangeRef.id,
            convertedAmount
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
