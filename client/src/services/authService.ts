import axios from "axios";
import { API_BASE_URL } from "./API";
import {
  GenerateEmailOTPData,
  GenerateOTPData,
  LoginByEmailForm,
  LoginByPhoneForm,
  SignupFormData,
} from "../types/types";

import { GoogleLoginPayload } from "../types/types"; 
export const generateOTP = async (data: GenerateOTPData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/generate_otp`, data);
    return response;
  } catch (error) {
    console.error("Error login:", error);
    throw error;
  }
};

export const generateEmailOTP = async (data: GenerateEmailOTPData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/generate_email_otp`, data);
    return response;
  } catch (error) {
    console.error("Error login:", error);
    throw error;
  }
};

export const loginWithGoogle = (payload: GoogleLoginPayload) => {
  return axios.post(`${API_BASE_URL}/v1/google-signup`, payload); // adjust endpoint if different
};
export const signInWithGoogle = async (data: { email: string; name: string }) => {
  return axios.post(`${API_BASE_URL}/v1/google-login`, data);
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
    const response = await axios.post(`${API_BASE_URL}/v1/signup`, data);
    return response;
  } catch (error) {
    console.error("Error login:", error);
    throw error;
  }
};