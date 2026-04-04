import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../models/Marketplace.Model.js", () => ({
  default: Object.assign(
    vi.fn().mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = vi.fn().mockResolvedValue(this);
    }),
    {
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
    }
  ),
}));

import {
  createStrategy,
  getAllStrategies,
  getStrategyById,
  updateStrategy,
  deleteStrategy,
} from "../controllers/Strategy.Controller.js";
import Strategy from "../models/Marketplace.Model.js";

const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// ---------- createStrategy ----------
describe("createStrategy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 201 on successful strategy creation", async () => {
    const req = mockReq({
      title: "Bull Run",
      description: "Buy on dips",
      author: "uid1",
      stock_symbol: "AAPL",
      trade_type: "delivery",
    });
    const res = mockRes();
    await createStrategy(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Strategy uploaded successfully" })
    );
  });

  it("returns 500 when save throws", async () => {
    Strategy.mockImplementationOnce(function (data) {
      Object.assign(this, data);
      this.save = vi.fn().mockRejectedValue(new Error("DB error"));
    });

    const req = mockReq({ title: "Bad Strategy" });
    const res = mockRes();
    await createStrategy(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error uploading strategy" })
    );
  });
});

// ---------- getAllStrategies ----------
describe("getAllStrategies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with strategies on success", async () => {
    const strategies = [{ _id: "strat1", title: "Bull Run" }];
    Strategy.find.mockReturnValue({ populate: vi.fn().mockResolvedValue(strategies) });

    const req = mockReq();
    const res = mockRes();
    await getAllStrategies(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(strategies);
  });

  it("returns 500 on internal error", async () => {
    Strategy.find.mockReturnValue({
      populate: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockReq();
    const res = mockRes();
    await getAllStrategies(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error fetching strategies" })
    );
  });
});

// ---------- getStrategyById ----------
describe("getStrategyById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when strategy is not found", async () => {
    Strategy.findById.mockReturnValue({ populate: vi.fn().mockResolvedValue(null) });

    const req = mockReq({}, { id: "nonexistent" });
    const res = mockRes();
    await getStrategyById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Strategy not found" })
    );
  });

  it("returns 200 with strategy on success", async () => {
    const strategy = { _id: "strat1", title: "Bull Run" };
    Strategy.findById.mockReturnValue({ populate: vi.fn().mockResolvedValue(strategy) });

    const req = mockReq({}, { id: "strat1" });
    const res = mockRes();
    await getStrategyById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(strategy);
  });

  it("returns 500 on internal error", async () => {
    Strategy.findById.mockReturnValue({
      populate: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockReq({}, { id: "strat1" });
    const res = mockRes();
    await getStrategyById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error fetching strategy" })
    );
  });
});

// ---------- updateStrategy ----------
describe("updateStrategy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when strategy is not found", async () => {
    Strategy.findByIdAndUpdate.mockResolvedValue(null);

    const req = mockReq({ title: "Updated" }, { id: "nonexistent" });
    const res = mockRes();
    await updateStrategy(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Strategy not found" })
    );
  });

  it("returns 200 on successful update", async () => {
    const updatedStrategy = { _id: "strat1", title: "Updated Bull Run" };
    Strategy.findByIdAndUpdate.mockResolvedValue(updatedStrategy);

    const req = mockReq({ title: "Updated Bull Run" }, { id: "strat1" });
    const res = mockRes();
    await updateStrategy(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedStrategy);
  });

  it("returns 500 on internal error", async () => {
    Strategy.findByIdAndUpdate.mockRejectedValue(new Error("DB error"));

    const req = mockReq({ title: "Updated" }, { id: "strat1" });
    const res = mockRes();
    await updateStrategy(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error updating strategy" })
    );
  });
});

// ---------- deleteStrategy ----------
describe("deleteStrategy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when strategy is not found", async () => {
    Strategy.findByIdAndDelete.mockResolvedValue(null);

    const req = mockReq({}, { id: "nonexistent" });
    const res = mockRes();
    await deleteStrategy(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Strategy not found" })
    );
  });

  it("returns 200 on successful deletion", async () => {
    Strategy.findByIdAndDelete.mockResolvedValue({ _id: "strat1" });

    const req = mockReq({}, { id: "strat1" });
    const res = mockRes();
    await deleteStrategy(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Strategy deleted successfully" })
    );
  });

  it("returns 500 on internal error", async () => {
    Strategy.findByIdAndDelete.mockRejectedValue(new Error("DB error"));

    const req = mockReq({}, { id: "strat1" });
    const res = mockRes();
    await deleteStrategy(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error deleting strategy" })
    );
  });
});
