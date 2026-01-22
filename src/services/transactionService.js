// src/services/transactionService.js
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Fetch all transactions for a user (Deposits, Withdrawals, Trades)
 */
export const getUserTransactions = async (uid) => {
    try {
        const transactions = [];

        // 1. Fetch Deposits
        const depositsQuery = query(
            collection(db, "deposits"),
            where("uid", "==", uid)
        );
        const depositsSnap = await getDocs(depositsQuery);
        depositsSnap.forEach(doc => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                type: "Deposit",
                amount: data.amount,
                asset: data.asset || "USD",
                status: data.status,
                date: data.createdAt?.toDate() || new Date(),
                details: data.method || "Crypto Transfer"
            });
        });

        // 2. Fetch Withdrawals
        const withdrawalsQuery = query(
            collection(db, "withdrawals"),
            where("uid", "==", uid)
        );
        const withdrawalsSnap = await getDocs(withdrawalsQuery);
        withdrawalsSnap.forEach(doc => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                type: "Withdrawal",
                amount: -data.amount, // Negative for withdrawals
                asset: data.asset || "USD",
                status: data.status,
                date: data.createdAt?.toDate() || new Date(),
                details: data.address ? `To: ${data.address.substring(0, 8)}...` : "Bank Transfer"
            });
        });

        // 3. Fetch Trades
        const tradesQuery = query(
            collection(db, "trades"),
            where("uid", "==", uid)
        );
        const tradesSnap = await getDocs(tradesQuery);
        tradesSnap.forEach(doc => {
            const data = doc.data();
            // Only show closed trades or active ones? Let's show all.
            // For P&L, use pnl if closed, otherwise 0 or investment amount
            const isWin = data.result === "win";
            const pnl = data.pnl || 0;

            transactions.push({
                id: doc.id,
                type: "Trade",
                amount: data.status === 'closed' ? pnl : -data.amount, // Show PnL if closed, or investment cost if active
                asset: data.asset,
                status: data.status === 'closed' ? (isWin ? 'Win' : 'Loss') : 'Active',
                date: data.createdAt?.toDate(),
                details: `${data.side.toUpperCase()} ${data.asset} @ $${data.entryPrice}`
            });
        });

        // 4. Fetch Transfers
        const transfersQuery = query(
            collection(db, "transfers"),
            where("userId", "==", uid)
        );
        const transfersSnap = await getDocs(transfersQuery);
        transfersSnap.forEach(doc => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                type: "Transfer",
                amount: data.amount,
                asset: "USDT", // Assuming transfers are mainly USDT for now based on walletService
                status: "completed",
                date: data.createdAt?.toDate() || new Date(),
                details: `From ${data.fromAccount} to ${data.toAccount}`
            });
        });

        // 5. Fetch Exchanges
        const exchangesQuery = query(
            collection(db, "exchanges"),
            where("userId", "==", uid)
        );
        const exchangesSnap = await getDocs(exchangesQuery);
        exchangesSnap.forEach(doc => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                type: "Exchange",
                amount: -data.fromAmount, // Outgoing amount
                asset: data.fromCurrency,
                status: "completed",
                date: data.createdAt?.toDate() || new Date(),
                details: `For ${data.toAmount.toFixed(4)} ${data.toCurrency} @ ${data.rate}`
            });
        });

        // 6. Sort all by date descending
        return transactions.sort((a, b) => b.date - a.date);

    } catch (error) {
        console.error("Error fetching user transactions:", error);
        return [];
    }
};
