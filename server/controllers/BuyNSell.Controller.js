import Transaction from "../models/Transactions.Model.js";
import Portfolio from "../models/Portfolio.Model.js";
import Order from "../models/Order.Model.js";
import Stock from "../models/Stock.Schema.js"; // Importing the Stock model
import User from "../models/User.Model.js";

export const buyStock = async (req, res) => {
  const { userId, stockId, quantity, pricePerUnit, type } = req.body;

  try {
    // Get stock details
    const stock = await Stock.findById(stockId);
    if (!stock) return res.status(400).json({ message: "Stock not found" });

    // Get user details
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    // Calculate total price
    const totalPrice = quantity * pricePerUnit;

    // Check if the user has enough balance
    if (user.virtualBalance < totalPrice) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct balance
    user.virtualBalance -= totalPrice;
    await user.save();

    // Create the transaction record
    const transaction = new Transaction({
      userId,
      stockId,
      type: "buy",
      quantity,
      pricePerUnit,
      totalPrice,
      date: new Date(),
      status: "completed"
    });
    await transaction.save();

    // Update the user's portfolio (same holdings-array shape the socket order flow uses)
    let portfolio = await Portfolio.findOne({ user_id: userId });
    if (!portfolio) {
      portfolio = new Portfolio({
        user_id: userId,
        holdings: [{
          stock_symbol: stock.symbol,
          quantity,
          average_price: pricePerUnit,
          trade_type: "buy",
        }],
      });
    } else {
      const stockIndex = portfolio.holdings.findIndex(
        (h) => h.stock_symbol === stock.symbol && h.trade_type === "buy"
      );
      if (stockIndex === -1) {
        portfolio.holdings.push({
          stock_symbol: stock.symbol,
          quantity,
          average_price: pricePerUnit,
          trade_type: "buy",
        });
      } else {
        const currentHolding = portfolio.holdings[stockIndex];
        const newQuantity = currentHolding.quantity + quantity;
        currentHolding.average_price =
          ((currentHolding.average_price * currentHolding.quantity) + (pricePerUnit * quantity)) / newQuantity;
        currentHolding.quantity = newQuantity;
      }
    }
    await portfolio.save();

    // Optionally create an order
    const order = new Order({
      stock_symbol: stock.symbol,
      order_type: "market",
      order_category: "delivery",
      type: "buy",
      quantity,
      execution_price: pricePerUnit,
      order_status: "completed",
      user_id: userId,
      stock_id: stockId
    });
    await order.save();

    return res.status(200).json({ message: "Stock purchased successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const sellStock = async (req, res) => {
  const { userId, stockId, quantity, pricePerUnit, type } = req.body;

  try {
    // Get stock details
    const stock = await Stock.findById(stockId);
    if (!stock) return res.status(400).json({ message: "Stock not found" });

    // Get user details
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    // Get the user's portfolio
    const portfolio = await Portfolio.findOne({ user_id: userId });
    const stockIndex = portfolio?.holdings.findIndex(
      (h) => h.stock_symbol === stock.symbol && h.trade_type === "buy"
    );
    if (!portfolio || stockIndex === -1 || portfolio.holdings[stockIndex].quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock balance" });
    }

    // Calculate total price
    const totalPrice = quantity * pricePerUnit;

    // Add the sale proceeds to the user's balance
    user.virtualBalance += totalPrice;
    await user.save();

    // Create the transaction record
    const transaction = new Transaction({
      userId,
      stockId,
      type: "sell",
      quantity,
      pricePerUnit,
      totalPrice,
      date: new Date(),
      status: "completed"
    });
    await transaction.save();

    // Update the user's portfolio
    portfolio.holdings[stockIndex].quantity -= quantity;
    if (portfolio.holdings[stockIndex].quantity === 0) {
      portfolio.holdings.splice(stockIndex, 1);
    }
    await portfolio.save();

    // Optionally create an order
    const order = new Order({
      stock_symbol: stock.symbol,
      order_type: "market",
      order_category: "delivery",
      type: "sell",
      quantity,
      execution_price: pricePerUnit,
      order_status: "completed",
      user_id: userId,
      stock_id: stockId
    });
    await order.save();

    return res.status(200).json({ message: "Stock sold successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
