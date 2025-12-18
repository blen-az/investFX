// src/services/paymentService.js
import { db } from '../firebase';
import { doc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Add withdrawal address (crypto wallet or bank account)
 */
export async function addWithdrawalAddress(userId, addressData) {
    const { type, address, label, currency } = addressData;

    if (!type || !address) {
        throw new Error('Address type and address are required');
    }

    // Validate address format based on type
    if (type === 'crypto') {
        if (address.length < 26 || address.length > 62) {
            throw new Error('Invalid cryptocurrency address format');
        }
    }

    const addressRef = await addDoc(collection(db, 'withdrawalAddresses'), {
        userId,
        type, // 'crypto' or 'bank'
        address,
        label: label || 'Untitled',
        currency: currency || 'BTC',
        status: 'pending_verification',
        isDefault: false,
        createdAt: serverTimestamp()
    });

    return {
        success: true,
        addressId: addressRef.id
    };
}

/**
 * Get user's withdrawal addresses
 */
export async function getWithdrawalAddresses(userId) {
    const addressesQuery = query(
        collection(db, 'withdrawalAddresses'),
        where('userId', '==', userId),
        where('status', '!=', 'deleted')
    );

    const addressesSnapshot = await getDocs(addressesQuery);

    return addressesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Set default withdrawal address
 */
export async function setDefaultWithdrawalAddress(userId, addressId) {
    // Remove default from all addresses
    const addressesQuery = query(
        collection(db, 'withdrawalAddresses'),
        where('userId', '==', userId)
    );

    const addressesSnapshot = await getDocs(addressesQuery);

    const batch = [];
    addressesSnapshot.forEach(doc => {
        batch.push(updateDoc(doc.ref, { isDefault: false }));
    });

    await Promise.all(batch);

    // Set new default
    await updateDoc(doc(db, 'withdrawalAddresses', addressId), {
        isDefault: true
    });

    return { success: true };
}

/**
 * Remove withdrawal address
 */
export async function removeWithdrawalAddress(addressId) {
    await updateDoc(doc(db, 'withdrawalAddresses', addressId), {
        status: 'deleted',
        deletedAt: serverTimestamp()
    });

    return { success: true };
}

/**
 * Add payment method (bank account or card)
 */
export async function addPaymentMethod(userId, methodData) {
    const { type, details } = methodData;

    if (!type || !details) {
        throw new Error('Payment method type and details are required');
    }

    const methodRef = await addDoc(collection(db, 'paymentMethods'), {
        userId,
        type, // 'bank_account', 'debit_card', 'credit_card'
        details, // Should be encrypted in production!
        status: 'pending_verification',
        isDefault: false,
        createdAt: serverTimestamp()
    });

    return {
        success: true,
        methodId: methodRef.id
    };
}

/**
 * Get user's payment methods
 */
export async function getPaymentMethods(userId) {
    const methodsQuery = query(
        collection(db, 'paymentMethods'),
        where('userId', '==', userId),
        where('status', '!=', 'deleted')
    );

    const methodsSnapshot = await getDocs(methodsQuery);

    return methodsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Mask sensitive info
        return {
            id: doc.id,
            type: data.type,
            last4: data.details?.last4,
            bankName: data.details?.bankName,
            isDefault: data.isDefault,
            status: data.status,
            createdAt: data.createdAt
        };
    });
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(userId, methodId) {
    // Remove default from all methods
    const methodsQuery = query(
        collection(db, 'paymentMethods'),
        where('userId', '==', userId)
    );

    const methodsSnapshot = await getDocs(methodsQuery);

    const batch = [];
    methodsSnapshot.forEach(doc => {
        batch.push(updateDoc(doc.ref, { isDefault: false }));
    });

    await Promise.all(batch);

    // Set new default
    await updateDoc(doc(db, 'paymentMethods', methodId), {
        isDefault: true
    });

    return { success: true };
}

/**
 * Remove payment method
 */
export async function removePaymentMethod(methodId) {
    await updateDoc(doc(db, 'paymentMethods', methodId), {
        status: 'deleted',
        deletedAt: serverTimestamp()
    });

    return { success: true };
}

/**
 * Verify payment method
 */
export async function verifyPaymentMethod(methodId, verificationData) {
    await updateDoc(doc(db, 'paymentMethods', methodId), {
        status: 'verified',
        verifiedAt: serverTimestamp(),
        verificationData
    });

    return { success: true };
}
