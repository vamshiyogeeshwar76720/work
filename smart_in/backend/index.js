// backend/index.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const {
  createEMIPlan,
  generateQRCode,
  startAutoDebit,
  getAllPlans,
  deletePlan,
  updatePlan,
} = require("./emiPlan");
const {
  createWallet,
  addAmount,
  getBalance,
  deductAmount,
  wallets,
} = require("./wallets");
const { addTransaction, getTransactions } = require("./transactions");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ---------- API ----------

// 1️⃣ Create EMI Plan
app.post("/api/create-plan", async (req, res) => {
  const {
    receiverId,
    emiAmount,
    firstPaymentAmount,
    intervalMs,
    totalPayments,
  } = req.body;
  if (
    !receiverId ||
    !emiAmount ||
    !firstPaymentAmount ||
    !intervalMs ||
    !totalPayments
  ) {
    return res.status(400).send({ error: "Missing fields" });
  }

  createWallet(receiverId);
  const plan = createEMIPlan(
    receiverId,
    emiAmount,
    firstPaymentAmount,
    intervalMs,
    totalPayments
  );
  const qrCode = await generateQRCode(plan);
  res.send({ plan, qrCode });
});

// 2️⃣ First Payment by Sender
app.post("/api/pay-first", (req, res) => {
  const { planId, senderId, amount } = req.body;
  const plan = getAllPlans().find((p) => p.planId === planId);
  if (!plan) return res.status(404).send({ error: "Plan not found" });

  createWallet(senderId);
  if (deductAmount(senderId, amount)) {
    addAmount(plan.receiverId, amount);
    plan.senderId = senderId;
    addTransaction(
      plan.planId,
      senderId,
      plan.receiverId,
      amount,
      "FirstPayment"
    );
    startAutoDebit(plan);
    return res.send({
      message: "First payment successful, auto-debit started",
      plan,
    });
  } else {
    return res.status(400).send({ error: "Insufficient balance" });
  }
});

// 3️⃣ Get all EMI plans
app.get("/api/plans", (req, res) => {
  res.send(getAllPlans());
});

// 4️⃣ Delete plan
app.delete("/api/plan/:planId", (req, res) => {
  const deleted = deletePlan(req.params.planId);
  if (deleted) res.send({ message: "Plan deleted" });
  else res.status(404).send({ error: "Plan not found" });
});

// 5️⃣ Update plan
app.put("/api/plan/:planId", (req, res) => {
  const updatedPlan = updatePlan(req.params.planId, req.body);
  if (updatedPlan) res.send({ message: "Plan updated", updatedPlan });
  else res.status(404).send({ error: "Plan not found" });
});

// 6️⃣ Wallet Balances
app.get("/api/wallets", (req, res) => {
  res.send(wallets);
});

// 7️⃣ Transactions
app.get("/api/transactions", (req, res) => {
  res.send(getTransactions());
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
