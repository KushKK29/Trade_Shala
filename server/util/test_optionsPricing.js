// Self-check: run with `node server/util/test_optionsPricing.js`
import assert from "node:assert/strict";
import { calculatePremium, calculatePayoffPnL } from "./optionsPricing.js";

function approxEqual(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ~${expected}, got ${actual}`
  );
}

// ATM call, 1 year to expiry, spot=100, strike=100 — hand-checked against
// the standard Black-Scholes formula with r=0.07, sigma=0.28:
// d1 = (ln(1) + (0.07 + 0.28^2/2)*1) / 0.28 ≈ 0.4400
// d2 = d1 - 0.28 ≈ 0.1600
// N(d1) ≈ 0.6700, N(d2) ≈ 0.5636
// call ≈ 100*0.6700 - 100*e^-0.07*0.5636 ≈ 67.00 - 52.63 ≈ 14.37
const oneYearOut = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const atmCall = calculatePremium({
  spotPrice: 100,
  strikePrice: 100,
  expiryDate: oneYearOut,
  optionType: "CE",
});
approxEqual(atmCall, 14.37, 0.5, "ATM call, 1yr expiry");

// Put-call parity sanity check at the same inputs:
// C - P = S - K*e^-rT
const atmPut = calculatePremium({
  spotPrice: 100,
  strikePrice: 100,
  expiryDate: oneYearOut,
  optionType: "PE",
});
const parityLhs = atmCall - atmPut;
const parityRhs = 100 - 100 * Math.exp(-0.07 * 1);
approxEqual(parityLhs, parityRhs, 0.01, "put-call parity");

// At expiry, premium collapses to intrinsic value.
const now = new Date();
const itmCallAtExpiry = calculatePremium({
  spotPrice: 120,
  strikePrice: 100,
  expiryDate: now,
  optionType: "CE",
  now,
});
assert.equal(itmCallAtExpiry, 20, "ITM call at expiry = intrinsic value");

const otmCallAtExpiry = calculatePremium({
  spotPrice: 80,
  strikePrice: 100,
  expiryDate: now,
  optionType: "CE",
  now,
});
assert.equal(otmCallAtExpiry, 0, "OTM call at expiry = worthless");

const itmPutAtExpiry = calculatePremium({
  spotPrice: 80,
  strikePrice: 100,
  expiryDate: now,
  optionType: "PE",
  now,
});
assert.equal(itmPutAtExpiry, 20, "ITM put at expiry = intrinsic value");

// Payoff P&L is a straight premium-to-premium delta scaled by quantity.
const pnl = calculatePayoffPnL({ entryPremium: 10, exitPremium: 15, quantity: 50 });
assert.equal(pnl, 250, "payoff P&L scales linearly with quantity");

const loss = calculatePayoffPnL({ entryPremium: 10, exitPremium: 4, quantity: 50 });
assert.equal(loss, -300, "payoff P&L reflects losses correctly");

console.log("optionsPricing self-check: all assertions passed");
