import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist all mocks so they are in place before module imports
vi.mock("../models/User.Model.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../models/Otp.Model.js", () => ({
  default: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
  },
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn(),
    }),
  },
}));

vi.mock("twilio", () => ({
  default: vi.fn().mockReturnValue({
    messages: {
      create: vi.fn(),
    },
  }),
}));

vi.mock("dotenv", () => ({
  configDotenv: vi.fn(),
}));

import User from "../models/User.Model.js";
import OTP from "../models/Otp.Model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import twilio from "twilio";

import {
  signup,
  login,
  verifyAndLogin,
  getUser,
  googleSignup,
  googleLogin,
  generateOTP,
  generateEmailOTP,
} from "../controllers/auth.js";

// ---------- helpers ----------
const mockReq = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
});

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// ---------- generateOTP ----------
describe("generateOTP", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when phoneNumber is missing", async () => {
    const req = mockReq({});
    const res = mockRes();
    await generateOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Phone number is required" })
    );
  });

  it("sends OTP and returns 200 on success", async () => {
    const twilioClient = twilio();
    twilioClient.messages.create.mockResolvedValue({ sid: "SM123" });
    OTP.findOneAndUpdate.mockResolvedValue({});

    const req = mockReq({ phoneNumber: "+911234567890" });
    const res = mockRes();
    await generateOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "OTP sent successfully" })
    );
  });

  it("returns 500 when twilio throws", async () => {
    const twilioClient = twilio();
    twilioClient.messages.create.mockRejectedValue(new Error("Twilio error"));
    OTP.findOneAndUpdate.mockResolvedValue({});

    const req = mockReq({ phoneNumber: "+911234567890" });
    const res = mockRes();
    await generateOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to send OTP" })
    );
  });
});

// ---------- generateEmailOTP ----------
describe("generateEmailOTP", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const req = mockReq({});
    const res = mockRes();
    await generateEmailOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Email is required" })
    );
  });

  it("sends OTP via email and returns 200 on success", async () => {
    OTP.findOneAndUpdate.mockResolvedValue({});
    const transporter = nodemailer.createTransport();
    transporter.sendMail.mockResolvedValue({});

    const req = mockReq({ email: "test@example.com" });
    const res = mockRes();
    await generateEmailOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "OTP sent to email successfully" })
    );
  });

  it("returns 500 when nodemailer throws", async () => {
    OTP.findOneAndUpdate.mockResolvedValue({});
    const transporter = nodemailer.createTransport();
    transporter.sendMail.mockRejectedValue(new Error("SMTP error"));

    const req = mockReq({ email: "test@example.com" });
    const res = mockRes();
    await generateEmailOTP(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to send OTP" })
    );
  });
});

// ---------- signup ----------
describe("signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when required fields are missing", async () => {
    const req = mockReq({ name: "Test" }); // missing email, phoneNumber, password
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "All fields are required" })
    );
  });

  it("returns 400 when user already exists", async () => {
    User.findOne.mockResolvedValue({ email: "existing@test.com" });

    const req = mockReq({
      name: "Test",
      email: "existing@test.com",
      phoneNumber: "1234567890",
      password: "pass123",
    });
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User already exists" })
    );
  });

  it("creates user and returns 201 on success", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashedpass");
    const newUser = {
      _id: "uid1",
      name: "Test",
      email: "new@test.com",
      phoneNumber: "1234567890",
    };
    User.create.mockResolvedValue(newUser);

    const req = mockReq({
      name: "Test",
      email: "new@test.com",
      phoneNumber: "1234567890",
      password: "pass123",
    });
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User registered successfully" })
    );
  });
});

// ---------- login ----------
describe("login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when user is not found", async () => {
    User.findOne.mockResolvedValue(null);
    const req = mockReq({ email: "ghost@test.com", password: "pass" });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User not found" })
    );
  });

  it("returns 400 when password is invalid", async () => {
    User.findOne.mockResolvedValue({
      _id: "uid1",
      email: "user@test.com",
      password: "hashed",
    });
    bcrypt.compare.mockResolvedValue(false);

    const req = mockReq({ email: "user@test.com", password: "wrongpass" });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid credentials" })
    );
  });

  it("returns 200 with token on successful login", async () => {
    const user = {
      _id: "uid1",
      email: "user@test.com",
      password: "hashed",
    };
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("mock_token");

    const req = mockReq({ email: "user@test.com", password: "correct" });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Login successful", token: "mock_token" })
    );
  });
});

// ---------- verifyAndLogin ----------
describe("verifyAndLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when user is not found", async () => {
    User.findOne.mockResolvedValue(null);
    const req = mockReq({ phoneNumber: "+911234567890" });
    const res = mockRes();
    await verifyAndLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User not found" })
    );
  });

  it("returns 200 with token on success", async () => {
    const user = { _id: "uid1", phoneNumber: "+911234567890" };
    User.findOne.mockResolvedValue(user);
    jwt.sign.mockReturnValue("mock_token");

    const req = mockReq({ phoneNumber: "+911234567890" });
    const res = mockRes();
    await verifyAndLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "OTP verified, login successful",
        token: "mock_token",
      })
    );
  });
});

// ---------- getUser ----------
describe("getUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when phone is missing", async () => {
    const req = mockReq({});
    const res = mockRes();
    await getUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Phone number is required to access user details",
      })
    );
  });

  it("returns 404 when user does not exist", async () => {
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    const req = mockReq({ phone: "+911234567890" });
    const res = mockRes();
    await getUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "No such user exists" })
    );
  });

  it("returns 200 with user data on success", async () => {
    const userDetail = { _id: "uid1", name: "Test", phoneNumber: "+911234567890" };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(userDetail) });

    const req = mockReq({ phone: "+911234567890" });
    const res = mockRes();
    await getUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: userDetail })
    );
  });

  it("returns 500 on internal error", async () => {
    User.findOne.mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error("DB error")),
    });
    const req = mockReq({ phone: "+911234567890" });
    const res = mockRes();
    await getUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal server error" })
    );
  });
});

// ---------- googleSignup ----------
describe("googleSignup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const req = mockReq({ name: "Test" });
    const res = mockRes();
    await googleSignup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Email is required" })
    );
  });

  it("returns 200 for existing user", async () => {
    const existingUser = { _id: "uid1", email: "google@test.com", name: "Test" };
    User.findOne.mockResolvedValue(existingUser);
    jwt.sign.mockReturnValue("google_token");

    const req = mockReq({ email: "google@test.com", name: "Test" });
    const res = mockRes();
    await googleSignup(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "google_token" })
    );
  });

  it("creates new user when user does not exist", async () => {
    const newUser = { _id: "uid2", email: "newgoogle@test.com", name: "New" };
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(newUser);
    jwt.sign.mockReturnValue("new_google_token");

    const req = mockReq({ email: "newgoogle@test.com", name: "New" });
    const res = mockRes();
    await googleSignup(req, res);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "newgoogle@test.com", provider: "google" })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "new_google_token" })
    );
  });

  it("returns 500 on internal error", async () => {
    User.findOne.mockRejectedValue(new Error("DB error"));
    const req = mockReq({ email: "google@test.com", name: "Test" });
    const res = mockRes();
    await googleSignup(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal server error" })
    );
  });
});

// ---------- googleLogin ----------
describe("googleLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email or name is missing", async () => {
    const req = mockReq({ email: "test@test.com" }); // name missing
    const res = mockRes();
    await googleLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Email and name are required" })
    );
  });

  it("returns 200 for existing user", async () => {
    const existingUser = { _id: "uid1", email: "g@test.com", name: "Test" };
    User.findOne.mockResolvedValue(existingUser);
    jwt.sign.mockReturnValue("token_existing");

    const req = mockReq({ email: "g@test.com", name: "Test" });
    const res = mockRes();
    await googleLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Login successful via Google" })
    );
  });

  it("creates new user and returns 201 when user does not exist", async () => {
    const newUser = { _id: "uid3", email: "newg@test.com", name: "NewUser" };
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(newUser);
    jwt.sign.mockReturnValue("token_new");

    const req = mockReq({ email: "newg@test.com", name: "NewUser" });
    const res = mockRes();
    await googleLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Signup successful via Google" })
    );
  });

  it("returns 500 on internal error", async () => {
    User.findOne.mockRejectedValue(new Error("DB error"));
    const req = mockReq({ email: "g@test.com", name: "Test" });
    const res = mockRes();
    await googleLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal server error" })
    );
  });
});
