import { WebSocket } from "ws";
import { Server } from "socket.io";
import protobuf from "protobufjs";
import schedule from "node-schedule";
// @ts-ignore
import * as UpstoxClient from "upstox-js-sdk";
// import { getAccessToken } from '../util/tokenStore';
import fetchInstrumentDetails from "../util/fetchInstrumentDetails.js";
import { getMarketStatus } from "../util/fetchStockData.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Order from "../models/Order.Model.js";
import Portfolio from "../models/Portfolio.Model.js";
import User from "../models/User.Model.js";
import { calculatePremium } from "../util/optionsPricing.js";

// ponytail: in-memory only, cleared on restart / not shared across
// processes. Good enough for a single-instance paper-trading server;
// upgrade to a shared cache (Redis) if this ever runs multi-instance.
const lastKnownPrice = new Map(); // stock_symbol -> latest price

const MARGIN_MULTIPLIER = {
  delivery: 1,
  intraday: 0.2,
  futures: 0.15,
  options_buy: 1,
  options_sell: 0.2,
};

// Initialize global variables
let protobufRoot = null;
let defaultClient = UpstoxClient.ApiClient.instance;
let apiVersion = "2.0";
let OAUTH2 = defaultClient.authentications["OAUTH2"];

// const upstoxToken = getAccessToken();
OAUTH2.accessToken = process.env.UPSTOX_ACCESS_TOKEN;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to authorize the market data feed
const getMarketFeedUrl = async () => {
  return new Promise((resolve, reject) => {
    let apiInstance = new UpstoxClient.WebsocketApi();

    apiInstance.getMarketDataFeedAuthorize(
      apiVersion,
      // @ts-ignore
      (error, data, response) => {
        if (error) {
          console.log("🚀 Upstox user", error.response.res.statusMessage);
          reject(error.response.res.statusMessage);
        } else {
          resolve(data.data.authorizedRedirectUri);
        }
      }
    );
  });
};

const connectWebSocket = async (wsUrl) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, {
      headers: {
        "Api-Version": apiVersion,
        Authorization: "Bearer " + OAUTH2.accessToken,
      },
      followRedirects: true,
    });

    ws.on("open", () => {
      console.log("🚀 ws connected");
      resolve(ws);
    });

    ws.on("close", () => {
      console.log("🚀 ws disconnected");
    });

    ws.on("error", (error) => {
      console.log("🚀 ws error:", error);
      reject(error);
    });
  });
};

const initProtobuf = async () => {
  protobufRoot = await protobuf.load(__dirname + "/MarketDataFeed.proto");
  console.log("🚀 Protobuf part initialization complete");
};

const decodeProfobuf = (buffer) => {
  if (!protobufRoot) {
    console.warn("Protobuf part not initialized yet!");
    return null;
  }

  const FeedResponse = protobufRoot.lookupType(
    "com.upstox.marketdatafeeder.rpc.proto.FeedResponse"
  );
  return FeedResponse.decode(buffer);
};

initProtobuf();

import { isOriginAllowed } from "../util/corsConfig.js";

const connectSocket = async (app) => {
  const io = new Server(app, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const socketToWsMap = new Map();

  io.on("connection", (socket) => {
    let ws;

    // Schedule a job to check the market status at 9:15 AM
    schedule.scheduleJob(
      { hour: 9, minute: 15, tz: "Asia/Kolkata" },
      async () => {
        const marketStatus = await getMarketStatus();
        // Emit the market status to the connected client
        socket.emit("marketStatusChange", marketStatus);
      }
    );

    // Schedule a job to check the market status at 3:30 PM
    schedule.scheduleJob(
      { hour: 15, minute: 30, tz: "Asia/Kolkata" },
      async () => {
        const marketStatus = "closed"; // Market is closed at 3:30 PM
        // Emit the market status to the connected client
        socket.emit("marketStatusChange", marketStatus);
      }
    );

    socket.on("selectSymbol", async (symbol) => {
      try {
        // console.log('socket requested data for:', symbol);

        if (!socketToWsMap.has(socket.id)) {
          socketToWsMap.set(socket.id, ws);

          const instrument = await fetchInstrumentDetails(symbol);
          if (!instrument) {
            const errorMsg = "No instrument found for the given symbol.";

            // Emit error message to the client
            socket.emit("error", errorMsg);
            return;
          }

          const instrumentKey = instrument.instrument_key;

          try {
            const wsUrl = await getMarketFeedUrl();
            ws = await connectWebSocket(wsUrl);

            socketToWsMap.set(socket.id, ws);

            const data = {
              guid: "someguid",
              method: "sub",
              data: {
                mode: "full",
                instrumentKeys: [instrumentKey],
              },
            };

            ws.send(Buffer.from(JSON.stringify(data)));

            // Handle WebSocket messages
            const messageHandler = (data) => {
              const decodedData = decodeProfobuf(data);
              // console.log('🚀 decodedData:', decodedData);
              const feed = decodedData?.feeds?.[instrumentKey];
              const ohlc = feed?.ff?.marketFF?.marketOHLC?.ohlc;
              const dailyClose = ohlc?.find((c) => c.interval === "1d")?.close;
              if (dailyClose) {
                lastKnownPrice.set(symbol, parseFloat(dailyClose));
              }
              socket.emit("symbolData", decodedData);
            };
            ws.on("message", messageHandler);

            // Handle WebSocket errors
            const errorHandler = (err) => {
              console.error("WebSocket Error:", err);
              socket.emit("error", "WebSocket encountered an error.");
            };
            ws.on("error", errorHandler);

            // Handle WebSocket close events
            const closeHandler = (code, reason) => {
              // console.log(
              //   `🚀 WebSocket closed. Code: ${code}, Reason: ${reason}`
              // );
              ws.close();
              ws.removeListener("message", messageHandler);
              ws.removeListener("error", errorHandler);
              ws.removeListener("close", closeHandler);
            };
            ws.on("close", closeHandler);
          } catch (error) {
            console.error("An error occurred:", error);
            socket.emit("error", "Error retrieving data for the given symbol.");
          }
        } else {
          // console.log(`WebSocket already exists for client ${socket.id}`);
          return;
        }
      } catch (error) {
        handleError(error);
        socket.emit("error", { message: "Failed to fetch stock data" });
      }
    });

    // Handle order placement event
    socket.on("placeOrder", async (orderDetails) => {
      try {
        let {
          stock_symbol,
          order_type,
          order_category,
          type,
          quantity,
          execution_price,
          limit_price,
          trigger_price,
          user_id,
          option_type,
          strike_price,
          expiry_date,
        } = orderDetails;

        if (!stock_symbol || !order_type || !order_category || !type || !quantity || !execution_price || !user_id) {
          socket.emit("error", "All order details are required.");
          return;
        }

        const user = await User.findById(user_id);
        if (!user) {
          socket.emit("error", "User not found.");
          return;
        }

        if (quantity <= 0 || isNaN(quantity) || execution_price <= 0 || isNaN(execution_price)) {
          socket.emit("error", "Quantity and execution price must be positive numbers.");
          return;
        }

        if (order_type === "limit") {
          if (!limit_price || limit_price <= 0 || isNaN(limit_price)) {
            socket.emit("error", "Invalid limit price for a limit order.");
            return;
          }
        } else if (order_type === "market" && limit_price) {
          limit_price = undefined;
        }

        if (order_type === "sl" || order_type === "sl-m") {
          if (!trigger_price || trigger_price <= 0 || isNaN(trigger_price)) {
            socket.emit("error", "Invalid trigger price for a stop-loss order.");
            return;
          }
        }

        // Never trust the client-supplied price for a market order; prefer
        // the server's own last known tick for this symbol when available.
        if (order_type === "market" && lastKnownPrice.has(stock_symbol)) {
          execution_price = lastKnownPrice.get(stock_symbol);
        }

        let underlying_price_at_entry;
        if (order_category === "options") {
          if (!option_type || !strike_price || strike_price <= 0 || !expiry_date) {
            socket.emit("error", "Option type, strike price, and expiry date are required for options orders.");
            return;
          }
          if (new Date(expiry_date) <= new Date()) {
            socket.emit("error", "Expiry date must be in the future.");
            return;
          }

          underlying_price_at_entry = lastKnownPrice.get(stock_symbol) ?? execution_price;
          execution_price = calculatePremium({
            spotPrice: underlying_price_at_entry,
            strikePrice: strike_price,
            expiryDate: expiry_date,
            optionType: option_type,
          });
        }

        const marginKey =
          order_category === "options" ? `options_${type === "sell" ? "sell" : "buy"}` : order_category;
        const marginMultiplier = MARGIN_MULTIPLIER[marginKey] ?? 1;
        const totalCost = execution_price * quantity * marginMultiplier;

        if (type === "buy") {
          if (user.virtualBalance < totalCost) {
            socket.emit("error", `Insufficient virtual balance (Current: ₹${user.virtualBalance.toFixed(2)}, Required: ₹${totalCost.toFixed(2)}).`);
            return;
          }
          user.virtualBalance -= totalCost;
        }

        const newOrder = new Order({
          stock_symbol,
          order_type,
          order_category,
          type,
          quantity,
          execution_price,
          limit_price: order_type === "limit" ? limit_price : undefined,
          trigger_price: (order_type === "sl" || order_type === "sl-m") ? trigger_price : undefined,
          user_id,
          order_status: order_type === "limit" || order_type === "sl" || order_type === "sl-m" ? "pending" : "executed",
          option_type: order_category === "options" ? option_type : undefined,
          strike_price: order_category === "options" ? strike_price : undefined,
          expiry_date: order_category === "options" ? expiry_date : undefined,
          underlying_price_at_entry: order_category === "options" ? underlying_price_at_entry : undefined,
        });

        await newOrder.save();

        let portfolio = await Portfolio.findOne({ user_id });
        const holdingMatches = (h) =>
          h.stock_symbol === stock_symbol &&
          h.trade_type === type &&
          h.option_type === (order_category === "options" ? option_type : undefined) &&
          h.strike_price === (order_category === "options" ? strike_price : undefined) &&
          (order_category !== "options" ||
            new Date(h.expiry_date).getTime() === new Date(expiry_date).getTime());

        const newHolding = {
          stock_symbol,
          quantity,
          average_price: execution_price,
          trade_type: type,
          option_type: order_category === "options" ? option_type : undefined,
          strike_price: order_category === "options" ? strike_price : undefined,
          expiry_date: order_category === "options" ? expiry_date : undefined,
        };

        if (!portfolio) {
          portfolio = new Portfolio({ user_id, holdings: [newHolding] });
        } else {
          const stockIndex = portfolio.holdings.findIndex(holdingMatches);
          if (stockIndex === -1) {
            portfolio.holdings.push(newHolding);
          } else {
            const currentHolding = portfolio.holdings[stockIndex];
            const newQuantity = currentHolding.quantity + quantity;
            currentHolding.average_price = ((currentHolding.average_price * currentHolding.quantity) + (execution_price * quantity)) / newQuantity;
            currentHolding.quantity = newQuantity;
          }
        }

        await portfolio.save();
        await user.save();

        socket.emit("orderPlaced", { message: "Order placed successfully", order: newOrder });
        console.log("🚀 Order placed successfully:", newOrder);
      } catch (error) {
        console.error("Error placing order:", error);
        socket.emit("error", "Error placing the order: " + (error.message || error));
      }
    });

    // Handle price reached limit (resting limit orders) or stop-loss trigger
    // (an SL order closes an existing position rather than opening one).
    socket.on("priceReachedLimit", async (data) => {
      try {
        const { orderId, marketPrice } = data;
        const order = await Order.findById(orderId);
        if (!order || order.order_status !== "pending") return;

        if (order.order_type === "limit") {
          const isFulfilled =
            (order.type === "buy" && marketPrice <= order.limit_price) ||
            (order.type === "sell" && marketPrice >= order.limit_price);
          if (!isFulfilled) return;

          order.order_status = "executed";
          await order.save();

          const portfolio = await Portfolio.findOne({ user_id: order.user_id });
          if (portfolio) {
            const stockIndex = portfolio.holdings.findIndex(
              (stock) => stock.stock_symbol === order.stock_symbol && stock.trade_type === order.type
            );

            if (stockIndex !== -1) {
              portfolio.holdings[stockIndex].quantity += order.quantity;
            } else {
              portfolio.holdings.push({
                stock_symbol: order.stock_symbol,
                quantity: order.quantity,
                average_price: order.execution_price,
                trade_type: order.type,
              });
            }
            await portfolio.save();
          }

          const user = await User.findById(order.user_id);
          if (user) {
            if (order.type === "buy") {
              user.virtualBalance -= order.execution_price * order.quantity;
            }
            await user.save();
          }

          socket.emit("orderStatusUpdated", { orderId: order._id, newStatus: "executed" });
        } else if (order.order_type === "sl" || order.order_type === "sl-m") {
          const isTriggered =
            (order.type === "buy" && marketPrice <= order.trigger_price) ||
            (order.type === "sell" && marketPrice >= order.trigger_price);
          if (!isTriggered) return;

          const portfolio = await Portfolio.findOne({ user_id: order.user_id });
          const stockIndex = portfolio?.holdings.findIndex(
            (h) => h.stock_symbol === order.stock_symbol && h.trade_type === order.type
          );
          if (!portfolio || stockIndex === -1 || stockIndex === undefined) return;

          const holding = portfolio.holdings[stockIndex];
          const closeQuantity = Math.min(holding.quantity, order.quantity);

          const user = await User.findById(order.user_id);
          if (!user) return;

          if (order.type === "sell") {
            user.virtualBalance += (holding.average_price - marketPrice) * closeQuantity;
          } else {
            user.virtualBalance += marketPrice * closeQuantity;
          }

          holding.quantity -= closeQuantity;
          if (holding.quantity === 0) portfolio.holdings.splice(stockIndex, 1);

          order.order_status = "completed";
          order.completion_price = marketPrice;
          order.completed_time = new Date();

          await portfolio.save();
          await user.save();
          await order.save();

          socket.emit("orderStatusUpdated", { orderId: order._id, newStatus: "completed" });
        }
      } catch (error) {
        socket.emit("error", "Error updating order status.");
      }
    });

    socket.on("completeOrder", async (orderDetails) => {
      try {
        const { stock_symbol, completion_price, user_id, trade_type, quantity } = orderDetails;

        if (!stock_symbol || !completion_price || !user_id) {
          socket.emit("error", "All order details are required for completion.");
          return;
        }

        const user = await User.findById(user_id);
        if (!user) {
          socket.emit("error", "User not found.");
          return;
        }

        const portfolio = await Portfolio.findOne({ user_id });
        if (!portfolio) {
          socket.emit("error", "No holdings found in your portfolio.");
          return;
        }

        const stockIndex = portfolio.holdings.findIndex((stock) => stock.stock_symbol === stock_symbol && stock.trade_type === trade_type);
        if (stockIndex === -1) {
          socket.emit("error", "Stock not found in portfolio.");
          return;
        }

        const stock = portfolio.holdings[stockIndex];

        if (stock.quantity < quantity) {
          socket.emit("error", "Insufficient quantity to sell.");
          return;
        }

        stock.quantity -= quantity;

        if (stock.option_type) {
          // completion_price is the underlying spot at close time; reprice
          // the option premium at that spot before settling, so the payout
          // reflects the option's actual resale value, not a raw stock delta.
          const exitPremium = calculatePremium({
            spotPrice: completion_price,
            strikePrice: stock.strike_price,
            expiryDate: stock.expiry_date,
            optionType: stock.option_type,
          });
          user.virtualBalance += exitPremium * quantity;
        } else if (trade_type === "sell") {
          // closing a short: settle PnL (no cash moved when the short was opened)
          user.virtualBalance += (stock.average_price - completion_price) * quantity;
        } else {
          // closing a long: return the sale proceeds
          user.virtualBalance += completion_price * quantity;
        }

        if (stock.quantity === 0) {
          portfolio.holdings.splice(stockIndex, 1);
        }

        // Update order with completion price and status
        const order = await Order.findOne({ user_id, stock_symbol, order_status: { $in: ["pending", "executed"] } });
        if (order) {
          order.completion_price = completion_price;
          order.order_status = "completed";
          await order.save();
        }

        await portfolio.save();
        await user.save();

        socket.emit("orderCompleted", {
          message: "Order completed successfully",
          stock_symbol,
          trade_type,
          quantity,
          completion_price,
        });

        console.log("✅ Order completed successfully:", { stock_symbol, trade_type, quantity, completion_price });
      } catch (error) {
        console.error("Error completing order:", error);
        socket.emit("error", "Error completing the order.");
      }
    });


    // Handle socket.io disconnect and close the associated WebSocket
    socket.on("disconnect", (reason) => {
      // console.log(`Socket.io client disconnected. Reason: ${reason}`);

      // Fetch the WebSocket instance associated with this socket.io socket
      const clientWs = socketToWsMap.get(socket.id);

      // If the WebSocket exists and it's open, close it.
      if (clientWs && clientWs.readyState === clientWs.OPEN) {
        // console.log('Closing WebSocket...');
        clientWs.close();
        clientWs.removeAllListeners();
        // console.log('Associated WebSocket closed.');
      }

      socketToWsMap.delete(socket.id);

      if (socketToWsMap.has(socket.id)) {
        console.log(`Error: WebSocket still exists for client ${socket.id}`);
      } else {
        // console.log(`WebSocket removed for client ${socket.id}`);
        return;
      }
    });
  });
};

// Update the error handling to safely check for error properties
const handleError = (error) => {
  if (error?.response?.res?.statusMessage) {
    console.log("🚀 Upstox user", error.response.res.statusMessage);
  } else if (error?.message) {
    console.log("🚀 Upstox error:", error.message);
  } else {
    console.log("🚀 Upstox error:", error);
  }
};

export default connectSocket;
