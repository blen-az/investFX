// src/services/securityService.js
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

/**
 * Enable/Disable Two-Factor Authentication
 */
export async function toggleTwoFactorAuth(userId, enabled) {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
        twoFactorEnabled: enabled,
        twoFactorUpdatedAt: serverTimestamp()
    });

    // Log security change
    await addDoc(collection(db, 'securityLogs'), {
        userId,
        action: enabled ? 'enable_2fa' : 'disable_2fa',
        ip: await getUserIP(),
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp()
    });

    return { success: true, enabled };
}

/**
 * Change user password
 */
export async function changeUserPassword(user, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
        throw new Error('Both current and new passwords are required');
    }

    if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);
    } catch (error) {
        throw new Error('Current password is incorrect');
    }

    // Update password
    await updatePassword(user, newPassword);

    // Log password change
    await addDoc(collection(db, 'securityLogs'), {
        userId: user.uid,
        action: 'password_change',
        ip: await getUserIP(),
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp()
    });

    return { success: true };
}

/**
 * Get user's login history
 */
export async function getLoginHistory(userId, limitCount = 20) {
    const logsQuery = query(
        collection(db, 'securityLogs'),
        where('userId', '==', userId),
        where('action', 'in', ['login', 'logout']),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    const logsSnapshot = await getDocs(logsQuery);

    return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
    }));
}

/**
 * Log user login
 */
export async function logUserLogin(userId, success = true) {
    await addDoc(collection(db, 'securityLogs'), {
        userId,
        action: 'login',
        success,
        ip: await getUserIP(),
        userAgent: navigator.userAgent,
        device: getDeviceInfo(),
        timestamp: serverTimestamp()
    });
}

/**
 * Get trusted devices
 */
export async function getTrustedDevices(userId) {
    const devicesQuery = query(
        collection(db, 'trustedDevices'),
        where('userId', '==', userId),
        where('status', '==', 'active')
    );

    const devicesSnapshot = await getDocs(devicesQuery);

    return devicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUsed: doc.data().lastUsed?.toDate()
    }));
}

/**
 * Add device to trusted list
 */
export async function addTrustedDevice(userId) {
    const deviceFingerprint = getDeviceFingerprint();

    await addDoc(collection(db, 'trustedDevices'), {
        userId,
        deviceFingerprint,
        deviceInfo: getDeviceInfo(),
        userAgent: navigator.userAgent,
        status: 'active',
        addedAt: serverTimestamp(),
        lastUsed: serverTimestamp()
    });

    return { success: true };
}

/**
 * Remove trusted device
 */
export async function removeTrustedDevice(deviceId) {
    await updateDoc(doc(db, 'trustedDevices', deviceId), {
        status: 'removed',
        removedAt: serverTimestamp()
    });

    return { success: true };
}

/**
 * Get user's security score
 */
export async function getSecurityScore(userId) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        return 0;
    }

    const userData = userDoc.data();
    let score = 50; // Base score

    // Add points for security features
    if (userData.twoFactorEnabled) score += 20;
    if (userData.emailVerified) score += 10;
    // Check both legacy and normalized KYC status
    const kycStatus = userData.verification?.status || userData.kycStatus;
    if (kycStatus === 'verified') score += 15;

    if (userData.phoneVerified) score += 5;

    return Math.min(score, 100);
}

// Helper functions
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

function getDeviceInfo() {
    return {
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language
    };
}

function getDeviceFingerprint() {
    // Simple fingerprint - in production use a library like FingerprintJS
    return btoa(`${navigator.userAgent}${navigator.language}${screen.width}x${screen.height}`);
}
