import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import https from "https";
import cors from "cors";

// Import your modules
import connectDB from "./db/index.js";
import connectSocket from "./lib/socketio.js";

// Import your route handlers
import stocksRoutes from "./routes/stocksRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import stockRoutes from "./routes/stockRoutes.js"; // Make sure this isn't a typo for 'stocksRoutes'
import transactionRoutes from "./routes/transactionRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import strategyRoutes from "./routes/strategyRoutes.js";

const PORT = process.env.PORT || 3000;
const app = express();

// 1. Connect to Database
connectDB();

// 2. Apply ALL general middleware BEFORE routes
app.use(cors());
app.use(express.json());

// Your Cross-Origin headers should be here
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// 3. Define ALL your API routes
app.get("/", (req, res) => {
  res.send(`<h1>This is the server</h1>`);
});

app.use("/api/v1", authRoutes); // Use only once
app.use("/api/stocks", stocksRoutes);
app.use("/api/stock-details", stockRoutes); // Renamed to avoid conflict. Adjust as needed.
app.use("/api/orders", orderRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/strategy", strategyRoutes);

// 4. Place the Error Handling Middleware at the VERY END
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server!" });
});

// 5. Create Server and Connect Socket.IO
const server = http.createServer(app);
await connectSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// 6. Keep-alive ping for your deployed server (This part is correct!)
setInterval(() => {
  console.log("Pinging server to keep it alive...");
  https
    .get(`https://trade-shala-yr1j.onrender.com`, (res) => {
      console.log(`Ping successful with status code: ${res.statusCode}`);
    })
    .on("error", (err) => {
      console.error("Error pinging server: ", err.message);
    });
}, 10 * 60 * 1000); // Pings every 10 minutes