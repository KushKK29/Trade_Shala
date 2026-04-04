import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../models/Order.Model.js", () => ({
  default: Object.assign(
    vi.fn().mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = vi.fn().mockResolvedValue(this);
    }),
    {
      find: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    }
  ),
}));

import OrderController from "../controllers/Order.Controller.js";
import Order from "../models/Order.Model.js";

const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// ---------- getOrdersByUserId ----------
describe("OrderController.getOrdersByUserId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when no orders found for the user", async () => {
    Order.find.mockResolvedValue([]);

    const req = mockReq({}, { userId: "uid1" });
    const res = mockRes();
    await OrderController.getOrdersByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "No orders found for this user." })
    );
  });

  it("returns 200 with orders on success", async () => {
    const orders = [{ _id: "oid1", stock_symbol: "AAPL" }];
    Order.find.mockResolvedValue(orders);

    const req = mockReq({}, { userId: "uid1" });
    const res = mockRes();
    await OrderController.getOrdersByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: orders })
    );
  });

  it("returns 500 on internal error", async () => {
    Order.find.mockRejectedValue(new Error("DB error"));

    const req = mockReq({}, { userId: "uid1" });
    const res = mockRes();
    await OrderController.getOrdersByUserId(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal server error." })
    );
  });
});

// ---------- createOrder ----------
describe("OrderController.createOrder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when required fields are missing", async () => {
    const req = mockReq({ stock_symbol: "AAPL" }); // missing other required fields
    const res = mockRes();
    await OrderController.createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "All fields are required." })
    );
  });

  it("returns 201 on successful order creation", async () => {
    const req = mockReq({
      stock_symbol: "AAPL",
      order_type: "market",
      order_category: "delivery",
      type: "buy",
      quantity: 5,
      price: 150,
      user_id: "uid1",
      order_status: "pending",
      execution_price: 150,
    });
    const res = mockRes();
    await OrderController.createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Order created successfully." })
    );
  });

  it("returns 500 when save throws", async () => {
    // Override the mock constructor to throw on save
    Order.mockImplementationOnce(function (data) {
      Object.assign(this, data);
      this.save = vi.fn().mockRejectedValue(new Error("DB save error"));
    });

    const req = mockReq({
      stock_symbol: "AAPL",
      order_type: "market",
      order_category: "delivery",
      type: "buy",
      quantity: 5,
      user_id: "uid1",
      order_status: "pending",
      execution_price: 150,
    });
    const res = mockRes();
    await OrderController.createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal server error." })
    );
  });
});

// ---------- updateOrderStatus ----------
describe("OrderController.updateOrderStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when orderId or order_status is missing", async () => {
    const req = mockReq({ orderId: "oid1" }); // missing order_status
    const res = mockRes();
    await OrderController.updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Order ID and status are required." })
    );
  });

  it("returns 404 when order is not found", async () => {
    Order.findByIdAndUpdate.mockResolvedValue(null);

    const req = mockReq({ orderId: "nonexistent", order_status: "completed" });
    const res = mockRes();
    await OrderController.updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Order not found." })
    );
  });

  it("returns 200 on successful status update", async () => {
    const updatedOrder = {
      _id: "oid1",
      order_status: "completed",
      stock_symbol: "AAPL",
    };
    Order.findByIdAndUpdate.mockResolvedValue(updatedOrder);

    const req = mockReq({ orderId: "oid1", order_status: "completed" });
    const res = mockRes();
    await OrderController.updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Order status updated successfully.",
        data: updatedOrder,
      })
    );
  });

  it("returns 500 on internal error", async () => {
    Order.findByIdAndUpdate.mockRejectedValue(new Error("DB error"));

    const req = mockReq({ orderId: "oid1", order_status: "completed" });
    const res = mockRes();
    await OrderController.updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal server error." })
    );
  });
});
