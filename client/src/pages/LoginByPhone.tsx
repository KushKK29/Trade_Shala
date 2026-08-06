import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import I1 from "../assets/loginn.jpeg";
import { FaGoogle } from "react-icons/fa";
import { loginByPhone } from "../services/authService";
import { toast } from "sonner";
import { account, OAuthProvider } from "../components/appwrite";

function LoginByPhone() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      const response = await loginByPhone({
        phoneNumber: `+91${phoneNumber}`,
      });
      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user_id", response.data.user?._id);
        toast.success("Login successful!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await account.createOAuth2Session(
        OAuthProvider.Google,
        "https://trade-shala.vercel.app/",
        "https://trade-shala.vercel.app/login/phone"
      );
    } catch (error) {
      console.error("Google Sign-In Error:", error);
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
            Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
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

            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaGoogle />
              Sign in with Google
            </button>

            <div className="w-full flex items-center justify-center gap-2">
              <Link
                to="/login/email"
                className="mt-4 w-full text-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                Login with Email
              </Link>
            </div>
          </div>

          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-500 hover:text-blue-600">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginByPhone;
