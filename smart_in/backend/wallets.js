// backend/wallets.js
const wallets = {};

function createWallet(userId, initialBalance = 0) {
  wallets[userId] = { balance: initialBalance };
}

function getBalance(userId) {
  return wallets[userId] ? wallets[userId].balance : null;
}

function addAmount(userId, amount) {
  if (!wallets[userId]) createWallet(userId);
  wallets[userId].balance += amount;
}

function deductAmount(userId, amount) {
  if (!wallets[userId]) createWallet(userId);
  if (wallets[userId].balance >= amount) {
    wallets[userId].balance -= amount;
    return true;
  }
  return false;
}

module.exports = { wallets, createWallet, getBalance, addAmount, deductAmount };
