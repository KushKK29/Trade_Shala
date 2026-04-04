import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../models/Otp.Model.js", () => ({
  default: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

import verifyOTP from "../middlewares/verifyOtp.js";
import OTP from "../models/Otp.Model.js";

const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("verifyOTP middleware", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when both phoneNumber and email are missing", async () => {
    const req = mockReq({ otp: "123456" }); // no phoneNumber or email
    const res = mockRes();
    const next = vi.fn();
    await verifyOTP(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Email or phone number and OTP are required",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 when otp is missing", async () => {
    const req = mockReq({ phoneNumber: "+911234567890" }); // no otp
    const res = mockRes();
    const next = vi.fn();
    await verifyOTP(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 when OTP record is not found (invalid OTP)", async () => {
    OTP.findOne.mockResolvedValue(null);

    const req = mockReq({ phoneNumber: "+911234567890", otp: "999999" });
    const res = mockRes();
    const next = vi.fn();
    await verifyOTP(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid OTP" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 when OTP is expired", async () => {
    const expiredOtpRecord = {
      _id: "otp1",
      phoneNumber: "+911234567890",
      otp: "123456",
      expiresAt: new Date(Date.now() - 10 * 60000), // expired 10 min ago
    };
    OTP.findOne.mockResolvedValue(expiredOtpRecord);

    const req = mockReq({ phoneNumber: "+911234567890", otp: "123456" });
    const res = mockRes();
    const next = vi.fn();
    await verifyOTP(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "OTP expired" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() and deletes OTP record on valid phone OTP", async () => {
    const validOtpRecord = {
      _id: "otp1",
      phoneNumber: "+911234567890",
      otp: "123456",
      expiresAt: new Date(Date.now() + 5 * 60000), // valid for 5 more min
    };
    OTP.findOne.mockResolvedValue(validOtpRecord);
    OTP.deleteOne.mockResolvedValue({});

    const req = mockReq({ phoneNumber: "+911234567890", otp: "123456" });
    const res = mockRes();
    const next = vi.fn();
    await verifyOTP(req, res, next);
    expect(OTP.deleteOne).toHaveBeenCalledWith({ _id: "otp1" });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() and deletes OTP record on valid email OTP", async () => {
    const validOtpRecord = {
      _id: "otp2",
      email: "test@example.com",
      otp: "654321",
      expiresAt: new Date(Date.now() + 5 * 60000),
    };
    OTP.findOne.mockResolvedValue(validOtpRecord);
    OTP.deleteOne.mockResolvedValue({});

    const req = mockReq({ email: "test@example.com", otp: "654321" });
    const res = mockRes();
    const next = vi.fn();
    await verifyOTP(req, res, next);
    expect(OTP.deleteOne).toHaveBeenCalledWith({ _id: "otp2" });
    expect(next).toHaveBeenCalled();
  });

  it("returns 500 on internal error", async () => {
    OTP.findOne.mockRejectedValue(new Error("DB error"));

    const req = mockReq({ phoneNumber: "+911234567890", otp: "123456" });
    const res = mockRes();
    const next = vi.fn();
    await verifyOTP(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal Server Error" })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
