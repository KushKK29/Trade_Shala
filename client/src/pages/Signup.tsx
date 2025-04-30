import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import I1 from "../assets/loginn.jpeg";
import { SignupForm } from "../types/types";
import { generateOTP, signup } from "../services/authService";
import { toast } from "sonner";

function Signup() {
  const [showOTP, setShowOTP] = useState(false);
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
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

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    try {
      await generateOTP({ phoneNumber: `+91${phoneNumber}` });

      setShowOTP(true);
      setIsResendDisabled(true);
      setTimer(60);
      toast.success("OTP sent successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    }
  };

  const handleResendOTP = () => {
    if (!isResendDisabled) {
      handleSendOTP();
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showOTP) {
      handleSendOTP();
      return;
    }

    try {
      const response = await signup({
        ...form,
        phoneNumber: `+91${phoneNumber}`,
        otp,
      });
      console.log(response);
      if (response.status === 201) {
        toast.success("Signup successful!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed.");
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOTP && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [showOTP, timer]);

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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Phone Number
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <span className="px-3 text-gray-700">+91</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full p-3 outline-none rounded-lg"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {showOTP && (
              <>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 mb-1 block">
                      OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {timer > 0 ? (
                    <p className="text-gray-600 text-sm">
                      Resend OTP in {timer} seconds
                    </p>
                  ) : null}

                  {timer === 0 && (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="bg-blue-600 hover:bg-blue-800 w-fit text-[0.8rem] text-white py-2 px-2 rounded-lg transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors"
            >
              {showOTP ? "Login" : "Send OTP"}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login/phone"
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
