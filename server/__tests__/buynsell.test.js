import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../models/Transactions.Model.js", () => ({
  default: vi.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = vi.fn().mockResolvedValue(this);
  }),
}));

vi.mock("../models/IndiPortfolio.Model.js", () => ({
  default: Object.assign(
    vi.fn().mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = vi.fn().mockResolvedValue(this);
    }),
    { findOne: vi.fn() }
  ),
}));

vi.mock("../models/Order.Model.js", () => ({
  default: vi.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = vi.fn().mockResolvedValue(this);
  }),
}));

vi.mock("../models/Stock.Schema.js", () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock("../models/User.Model.js", () => ({
  default: {
    findById: vi.fn(),
  },
}));

import { buyStock, sellStock } from "../controllers/BuyNSell.Controller.js";
import Stock from "../models/Stock.Schema.js";
import User from "../models/User.Model.js";
import Portfolio from "../models/IndiPortfolio.Model.js";

const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// ---------- buyStock ----------
describe("buyStock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when stock is not found", async () => {
    Stock.findById.mockResolvedValue(null);

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100,
      stock_symbol: "AAPL",
    });
    const res = mockRes();
    await buyStock(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Stock not found" })
    );
  });

  it("returns 400 when user is not found", async () => {
    Stock.findById.mockResolvedValue({ _id: "sid1", symbol: "AAPL" });
    User.findById.mockResolvedValue(null);

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100,
      stock_symbol: "AAPL",
    });
    const res = mockRes();
    await buyStock(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User not found" })
    );
  });

  it("returns 400 when user has insufficient balance", async () => {
    Stock.findById.mockResolvedValue({ _id: "sid1", symbol: "AAPL" });
    User.findById.mockResolvedValue({ _id: "uid1", virtualBalance: 50, save: vi.fn() });

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100, // totalPrice = 200 > 50
      stock_symbol: "AAPL",
    });
    const res = mockRes();
    await buyStock(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Insufficient balance" })
    );
  });

  it("returns 200 on successful purchase (new portfolio)", async () => {
    const mockUser = {
      _id: "uid1",
      virtualBalance: 1000,
      save: vi.fn().mockResolvedValue({}),
    };
    Stock.findById.mockResolvedValue({ _id: "sid1", symbol: "AAPL" });
    User.findById.mockResolvedValue(mockUser);
    Portfolio.findOne.mockResolvedValue(null); // No existing portfolio

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100,
      stock_symbol: "AAPL",
    });
    const res = mockRes();
    await buyStock(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Stock purchased successfully" })
    );
    expect(mockUser.virtualBalance).toBe(800); // 1000 - 200
  });

  it("returns 200 on successful purchase (existing portfolio)", async () => {
    const mockUser = {
      _id: "uid1",
      virtualBalance: 1000,
      save: vi.fn().mockResolvedValue({}),
    };
    const mockPortfolio = {
      userId: "uid1",
      balance: 5,
      totalValue: 500,
      updatedAt: new Date(),
      save: vi.fn().mockResolvedValue({}),
    };
    Stock.findById.mockResolvedValue({ _id: "sid1", symbol: "AAPL" });
    User.findById.mockResolvedValue(mockUser);
    Portfolio.findOne.mockResolvedValue(mockPortfolio);

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100,
      stock_symbol: "AAPL",
    });
    const res = mockRes();
    await buyStock(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockPortfolio.balance).toBe(7); // 5 + 2
    expect(mockPortfolio.totalValue).toBe(700); // 500 + 200
  });

  it("returns 500 on internal error", async () => {
    Stock.findById.mockRejectedValue(new Error("DB error"));

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100,
      stock_symbol: "AAPL",
    });
    const res = mockRes();
    await buyStock(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Server error" })
    );
  });
});

// ---------- sellStock ----------
describe("sellStock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when stock is not found", async () => {
    Stock.findById.mockResolvedValue(null);

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100,
    });
    const res = mockRes();
    await sellStock(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Stock not found" })
    );
  });

  it("returns 400 when user is not found", async () => {
    Stock.findById.mockResolvedValue({ _id: "sid1", symbol: "AAPL" });
    User.findById.mockResolvedValue(null);

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100,
    });
    const res = mockRes();
    await sellStock(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User not found" })
    );
  });

  it("returns 400 when portfolio is missing or balance insufficient", async () => {
    Stock.findById.mockResolvedValue({ _id: "sid1", symbol: "AAPL" });
    User.findById.mockResolvedValue({ _id: "uid1", virtualBalance: 500, save: vi.fn() });
    Portfolio.findOne.mockResolvedValue(null); // No portfolio

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100,
    });
    const res = mockRes();
    await sellStock(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Insufficient stock balance" })
    );
  });

  it("returns 400 when portfolio balance is less than quantity to sell", async () => {
    Stock.findById.mockResolvedValue({ _id: "sid1", symbol: "AAPL" });
    User.findById.mockResolvedValue({ _id: "uid1", virtualBalance: 500, save: vi.fn() });
    Portfolio.findOne.mockResolvedValue({ balance: 1, totalValue: 100, save: vi.fn() }); // only 1 share

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 5, // wants to sell 5 but has only 1
      pricePerUnit: 100,
    });
    const res = mockRes();
    await sellStock(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Insufficient stock balance" })
    );
  });

  it("returns 200 on successful sale", async () => {
    const mockUser = {
      _id: "uid1",
      virtualBalance: 500,
      save: vi.fn().mockResolvedValue({}),
    };
    const mockPortfolio = {
      userId: "uid1",
      balance: 10,
      totalValue: 1000,
      updatedAt: new Date(),
      save: vi.fn().mockResolvedValue({}),
    };
    Stock.findById.mockResolvedValue({ _id: "sid1", symbol: "AAPL" });
    User.findById.mockResolvedValue(mockUser);
    Portfolio.findOne.mockResolvedValue(mockPortfolio);

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 3,
      pricePerUnit: 100,
    });
    const res = mockRes();
    await sellStock(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Stock sold successfully" })
    );
    expect(mockUser.virtualBalance).toBe(800); // 500 + 300
    expect(mockPortfolio.balance).toBe(7); // 10 - 3
    expect(mockPortfolio.totalValue).toBe(700); // 1000 - 300
  });

  it("returns 500 on internal error", async () => {
    Stock.findById.mockRejectedValue(new Error("DB error"));

    const req = mockReq({
      userId: "uid1",
      stockId: "sid1",
      quantity: 2,
      pricePerUnit: 100,
    });
    const res = mockRes();
    await sellStock(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Server error" })
    );
  });
});
