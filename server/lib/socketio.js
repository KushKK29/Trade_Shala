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

const connectSocket = async (app) => {
  const io = new Server(app, {
    cors: {
      origin: process.env.CLIENT_DOMAIN,
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
        const {
          stock_symbol,
          order_type,
          order_category,
          type,
          quantity,
          execution_price,
          limit_price,
          user_id,
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
          if (!limit_price || limit_price <= 0 || isNaN(limit_price) || execution_price > limit_price) {
            socket.emit("error", "Invalid limit price for a limit order.");
            return;
          }
        } else if (order_type === "market" && limit_price) {
          socket.emit("error", "Limit price should not be provided for market orders.");
          return;
        }

        const newOrder = new Order({
          stock_symbol,
          order_type,
          order_category,
          type,
          quantity,
          execution_price,
          limit_price: order_type === "limit" ? limit_price : undefined,
          user_id,
          order_status: order_type === "limit" ? "pending" : "executed",
        });

        await newOrder.save();

        let portfolio = await Portfolio.findOne({ user_id });
        if (!portfolio) {
          portfolio = new Portfolio({
            user_id,
            holdings: [{
              stock_symbol,
              quantity,
              average_price: execution_price,
              trade_type: type,
            }],
          });
        } else {
          const stockIndex = portfolio.holdings.findIndex(h => h.stock_symbol === stock_symbol && h.trade_type === type);
          if (stockIndex === -1) {
            // Add as a new holding if trade_type differs
            portfolio.holdings.push({
              stock_symbol,
              quantity,
              average_price: execution_price,
              trade_type: type,
            });
          } else {
            const currentHolding = portfolio.holdings[stockIndex];
            const newQuantity = currentHolding.quantity + quantity;
            const newAvgPrice = ((currentHolding.average_price * currentHolding.quantity) + (execution_price * quantity)) / newQuantity;
            portfolio.holdings[stockIndex] = { ...currentHolding, quantity: newQuantity, average_price: newAvgPrice, stock_symbol: currentHolding.stock_symbol, trade_type: currentHolding.trade_type };
          }
        }

        if (order_category === "buy") {
          const totalCost = execution_price * quantity;
          if (user.virtualBalance < totalCost) {
            socket.emit("error", "Insufficient virtual balance.");
            return;
          }
          user.virtualBalance -= totalCost;
        } else if (order_category === "sell") {
          user.virtualBalance += execution_price * quantity;
        }

        await portfolio.save();
        await user.save();

        socket.emit("orderPlaced", { message: "Order placed successfully", order: newOrder });
        console.log("🚀 Order placed successfully:", newOrder);
      } catch (error) {
        console.error("Error placing order:", error);
        socket.emit("error", "Error placing the order.");
      }
    });

    // Handle price reached limit
    socket.on("priceReachedLimit", async (data) => {
      try {
        const { orderId, marketPrice } = data;
        const order = await Order.findById(orderId);

        // Ensure the order is a limit order and check if the price meets the condition
        if (order && order.order_type === "limit") {
          let isFulfilled = false;

          // Buy Order - Fulfilled if market price <= limit price
          if (
            order.order_category === "buy" &&
            marketPrice <= order.limit_price
          ) {
            isFulfilled = true;
          }

          // Sell Order - Fulfilled if market price >= limit price
          if (
            order.order_category === "sell" &&
            marketPrice >= order.limit_price
          ) {
            isFulfilled = true;
          }

          // If the order is fulfilled, update the status and execute the transaction
          if (isFulfilled) {
            order.order_status = "fulfilled";
            await order.save();

            // Update the portfolio when the order is fulfilled
            const portfolio = await Portfolio.findOne({
              user_id: order.user_id,
            });
            const stockIndex = portfolio.stocks.findIndex(
              (stock) => stock.stock_symbol === order.stock_symbol
            );

            if (stockIndex !== -1) {
              // If it's a buy order, increase quantity
              if (order.order_category === "buy") {
                portfolio.stocks[stockIndex].quantity += order.quantity;
              }
              // If it's a sell order, decrease quantity
              if (order.order_category === "sell") {
                portfolio.stocks[stockIndex].quantity -= order.quantity;
              }
            }

            await portfolio.save();

            // Update the user's virtual balance
            const user = await User.findById(order.user_id);
            if (order.order_category === "buy") {
              const totalCost = order.execution_price * order.quantity;
              user.virtualBalance -= totalCost;
            } else if (order.order_category === "sell") {
              const totalSaleAmount = order.execution_price * order.quantity;
              user.virtualBalance += totalSaleAmount;
            }

            await user.save();

            // Emit order status update
            socket.emit("orderStatusUpdated", {
              orderId: order._id,
              newStatus: "fulfilled",
            });
          }
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

        console.log(trade_type)

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
        user.virtualBalance += completion_price * quantity;

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
