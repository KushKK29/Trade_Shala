import axios from "axios";
import { API_BASE_URL } from "./API";
import {
  GenerateOTPData,
  LoginByEmailForm,
  LoginByPhoneForm,
  SignupFormData,
} from "../types/types";

export const generateOTP = async (data: GenerateOTPData) => {
  console.log(data);
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/generate-otp`, data);
    return response;
  } catch (error) {
    console.error("Error login:", error);
    throw error;
  }
};

export const loginByEmail = async (data: LoginByEmailForm) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/login/email`, data);
    return response;
  } catch (error) {
    console.error("Error login:", error);
    throw error;
  }
};

export const loginByPhone = async (data: LoginByPhoneForm) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/login/phone`, data);
    return response;
  } catch (error) {
    console.error("Error login:", error);
    throw error;
  }
};

export const signup = async (data: SignupFormData) => {
  try {
    console.log(data);
    const response = await axios.post(`${API_BASE_URL}/v1/signup`, data);
    return response;
  } catch (error) {
    console.error("Error login:", error);
    throw error;
  }
};
