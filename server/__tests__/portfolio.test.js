import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../models/Portfolio.Model.js", () => ({
  default: {
    find: vi.fn(),
  },
}));

import PortfolioController from "../controllers/Portfolio.Controller.js";
import Portfolio from "../models/Portfolio.Model.js";

const mockReq = (params = {}) => ({ params });
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("PortfolioController.getPortfolioByUserId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with portfolio data on success", async () => {
    const portfolios = [
      {
        _id: "pid1",
        user_id: "uid1",
        holdings: [{ stock_symbol: "AAPL", quantity: 10, average_price: 150 }],
      },
    ];
    Portfolio.find.mockReturnValue({ populate: vi.fn().mockResolvedValue(portfolios) });

    const req = mockReq({ userId: "uid1" });
    const res = mockRes();
    await PortfolioController.getPortfolioByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(portfolios);
  });

  it("returns 200 with empty array when user has no portfolios", async () => {
    Portfolio.find.mockReturnValue({ populate: vi.fn().mockResolvedValue([]) });

    const req = mockReq({ userId: "uid1" });
    const res = mockRes();
    await PortfolioController.getPortfolioByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 on internal error", async () => {
    Portfolio.find.mockReturnValue({
      populate: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockReq({ userId: "uid1" });
    const res = mockRes();
    await PortfolioController.getPortfolioByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error fetching portfolios" })
    );
  });
});
