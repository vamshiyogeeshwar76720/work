// backend/transactions.js
const transactions = [];

function addTransaction(planId, senderId, receiverId, amount, type = "EMI") {
  transactions.push({
    planId,
    senderId,
    receiverId,
    amount,
    type,
    timestamp: new Date().toISOString(),
  });
}

function getTransactions() {
  return transactions;
}

module.exports = { transactions, addTransaction, getTransactions };
