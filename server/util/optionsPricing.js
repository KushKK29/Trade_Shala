// Simplified Black-Scholes option pricing for paper trading.
// No live IV/risk-free-rate feed exists, so both are fixed assumptions.
const RISK_FREE_RATE = 0.07; // approx. Indian T-bill rate
const ASSUMED_VOLATILITY = 0.28; // flat assumed volatility

// Abramowitz & Stegun 7.1.26 approximation of the standard normal CDF.
function normalCdf(x) {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1 + sign * y);
}

function yearsToExpiry(expiryDate, now = new Date()) {
  const msPerYear = 365 * 24 * 60 * 60 * 1000;
  return Math.max(0, (new Date(expiryDate).getTime() - now.getTime()) / msPerYear);
}

// Returns the option premium for one unit of the underlying.
export function calculatePremium({ spotPrice, strikePrice, expiryDate, optionType, now }) {
  const t = yearsToExpiry(expiryDate, now);

  if (t === 0) {
    // At/after expiry, premium is pure intrinsic value.
    return optionType === "CE"
      ? Math.max(0, spotPrice - strikePrice)
      : Math.max(0, strikePrice - spotPrice);
  }

  const sqrtT = Math.sqrt(t);
  const d1 =
    (Math.log(spotPrice / strikePrice) + (RISK_FREE_RATE + (ASSUMED_VOLATILITY ** 2) / 2) * t) /
    (ASSUMED_VOLATILITY * sqrtT);
  const d2 = d1 - ASSUMED_VOLATILITY * sqrtT;

  const discountedStrike = strikePrice * Math.exp(-RISK_FREE_RATE * t);

  const premium =
    optionType === "CE"
      ? spotPrice * normalCdf(d1) - discountedStrike * normalCdf(d2)
      : discountedStrike * normalCdf(-d2) - spotPrice * normalCdf(-d1);

  return Math.max(0, premium);
}

// Premium-to-premium P&L for closing a long option position. The payoff
// nonlinearity is already captured by calculatePremium at the current
// spot/time, so this is just the delta scaled by quantity.
export function calculatePayoffPnL({ entryPremium, exitPremium, quantity }) {
  return (exitPremium - entryPremium) * quantity;
}
