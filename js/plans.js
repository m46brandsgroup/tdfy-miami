// Single source of plan data. Values from "Miami-Plan (3).pdf":
// evaluation and sim-funded tables (page 1), payout split (page 2).
window.MiamiPlan = (function () {
  const PLANS = {
    '10K': { target: 1250, drawdown: 500, contracts: 5, dll: 300, price: { soft: 99, none: 149 }, payoutMin: 200, profitCap: 2000 },
    '25K': { target: 2500, drawdown: 1000, contracts: 10, dll: 600, price: { soft: 185, none: 279 }, payoutMin: 400, profitCap: 4000 },
    '50K': { target: 3500, drawdown: 1500, contracts: 20, dll: 900, price: { soft: 311, none: 467 }, payoutMin: 600, profitCap: 6000 },
  };

  // Every sim payout, split at the time of the request
  const SPLIT = { trader: 0.75, fund: 0.1, tradeify: 0.15 };
  // Live trigger: cumulative payouts plus current profit (page 1). Tradeify's top-up
  // brings the $1,200 fund to the $1,500 static balance (page 2).
  const LIVE_TRIGGER = 12000;
  const LIVE_TOPUP = 300;

  const DLL_LABELS = { soft: 'Soft DLL', none: 'No DLL' };

  // Checkout destinations: pending. Fill per size and DLL option; null keeps the placeholder action.
  const CHECKOUT_URLS = {
    '10K': { soft: null, none: null },
    '25K': { soft: null, none: null },
    '50K': { soft: null, none: null },
  };

  const money = (n) => '$' + n.toLocaleString('en-US');

  return { PLANS, SPLIT, LIVE_TRIGGER, LIVE_TOPUP, DLL_LABELS, CHECKOUT_URLS, money };
})();
