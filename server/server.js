import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import connectDB from "./db/index.js";
import cors from "cors";

import { corsOptions } from "./util/corsConfig.js";

import stocksRoutes from "./routes/stocksRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import connectSocket from "./lib/socketio.js";
import stockRoutes from "./routes/stockRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import strategyRoutes from "./routes/strategyRoutes.js";

import https from "https";

const PORT = process.env.PORT || 3000;

const app = express();

connectDB();

app.use(express.json());

// Enable CORS
app.use(cors(corsOptions));

// Additional headers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.get("/", (req, res) => {
  res.send(`<h1>this is server</h1>`);
});

// API Routes
app.use("/api/stocks", stocksRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api", orderRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api", portfolioRoutes);
app.use("/api", strategyRoutes);

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Something broke!" });
});

const server = http.createServer(app);

(async () => {
  await connectSocket(server);

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();

setInterval(() => {
  https
    .get(`https://trade-shala-yr1j.onrender.com`, (res) => {
      console.log("Pinging server to keep alive");
    })
    .on("error", (err) => {
      console.error("Error pinging server: ", err.message);
    });
}, 10 * 60 * 1000);
