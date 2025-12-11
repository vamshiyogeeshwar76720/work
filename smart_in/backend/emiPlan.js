// backend/emiPlan.js
const QRCode = require("qrcode");
const { addAmount, deductAmount } = require("./wallets");
const { addTransaction } = require("./transactions");

const emiPlans = [];

function generatePlanId() {
  return "plan_" + Math.random().toString(36).substr(2, 9);
}

// Create a new EMI plan
function createEMIPlan(
  receiverId,
  emiAmount,
  firstPaymentAmount,
  intervalMs,
  totalPayments
) {
  const planId = generatePlanId();
  const plan = {
    planId,
    receiverId,
    senderId: null, // assigned when sender pays first
    emiAmount,
    firstPaymentAmount,
    intervalMs,
    totalPayments,
    paymentsDone: 0,
    autoDebitTimer: null,
    createdAt: new Date().toISOString(),
  };
  emiPlans.push(plan);
  return plan;
}

// Generate QR code for a plan
async function generateQRCode(plan) {
  const qrData = {
    planId: plan.planId,
    receiverId: plan.receiverId,
    firstPaymentAmount: plan.firstPaymentAmount,
  };
  return await QRCode.toDataURL(JSON.stringify(qrData));
}

// Start auto-debit for a plan
function startAutoDebit(plan) {
  if (!plan.senderId) return;
  plan.autoDebitTimer = setInterval(() => {
    const success = deductAmount(plan.senderId, plan.emiAmount);
    if (success) {
      addAmount(plan.receiverId, plan.emiAmount);
      plan.paymentsDone += 1;
      addTransaction(
        plan.planId,
        plan.senderId,
        plan.receiverId,
        plan.emiAmount,
        "EMI"
      );
      console.log(`EMI Deducted: ${plan.emiAmount} from ${plan.senderId}`);
    } else {
      console.log(`Insufficient balance for sender ${plan.senderId}`);
    }

    if (plan.paymentsDone >= plan.totalPayments) {
      clearInterval(plan.autoDebitTimer);
    }
  }, plan.intervalMs);
}

// CRUD Operations for frontend table
function getAllPlans() {
  return emiPlans;
}

function deletePlan(planId) {
  const index = emiPlans.findIndex((p) => p.planId === planId);
  if (index !== -1) {
    clearInterval(emiPlans[index].autoDebitTimer);
    emiPlans.splice(index, 1);
    return true;
  }
  return false;
}

function updatePlan(planId, updates) {
  const plan = emiPlans.find((p) => p.planId === planId);
  if (plan) {
    Object.assign(plan, updates);
    return plan;
  }
  return null;
}

module.exports = {
  createEMIPlan,
  generateQRCode,
  startAutoDebit,
  getAllPlans,
  deletePlan,
  updatePlan,
};
