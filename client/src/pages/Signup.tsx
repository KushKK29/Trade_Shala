import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import I1 from "../assets/loginn.jpeg";
import { SignupForm } from "../types/types";
import { signup, loginWithGoogle } from "../services/authService";
import { toast } from "sonner";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

function Signup() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await signup({
        ...form,
        phoneNumber: phoneNumber ? `+91${phoneNumber}` : "",
      });
      if (response.status === 201) {
        toast.success("Signup successful! Please login.");
        navigate("/login/email");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Signup failed.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const { email, name } = decoded;

      const response = await loginWithGoogle({ email, name });

      if (response.status === 200 || response.status === 201) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user_id", response.data.user?._id);
        toast.success("Signed up with Google!");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Google Sign Up error:", error);
      toast.error("Google signup failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl flex max-w-4xl w-full mx-4">
        <div className="hidden md:block w-1/2 p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-l-xl">
          <div className="h-full relative">
            <div className="absolute inset-0 bg-blue-500/10 rounded-lg transform -rotate-6"></div>
            <div className="absolute inset-0 bg-blue-500/5 rounded-lg transform rotate-3"></div>
            <img
              src={I1}
              alt="Authentication"
              className="rounded-lg shadow-lg relative z-10 w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Create Account
          </h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Enter your full name"
                className="w-full p-3 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Phone Number
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <span className="px-3 text-gray-700">+91</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full p-3 outline-none bg-white text-gray-900 placeholder:text-gray-400 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleFormChange}
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="mb-2 text-gray-500 text-sm">Or sign up with</div>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error("Google login failed")} />
          </div>

          <p className="text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login/email"
              className="text-blue-500 hover:text-blue-600"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;