import { useState, useEffect } from "react";
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { motion } from "framer-motion";
import { fetchUserById, depositFunds } from "@/services/stockService";
import { toast } from "sonner";

const WalletPage = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(1000);
  const [isDepositing, setIsDepositing] = useState(false);

  const userId = localStorage.getItem("user_id");

  const loadBalance = async () => {
    if (!userId) return;
    try {
      const response = await fetchUserById(userId);
      setBalance(response.data.data.virtualBalance);
    } catch (error) {
      toast.error("Failed to load wallet balance.");
    }
  };

  useEffect(() => {
    loadBalance();
  }, [userId]);

  const handleDeposit = async () => {
    if (!userId) {
      toast.error("Please log in to deposit funds.");
      return;
    }
    if (depositAmount <= 0) return;

    setIsDepositing(true);
    try {
      const response = await depositFunds(userId, depositAmount);
      setBalance(response.data.virtualBalance);
      toast.success(`Deposited ₹${depositAmount.toLocaleString()}`);
      setShowDepositModal(false);
      setDepositAmount(1000);
    } catch (error) {
      toast.error("Deposit failed. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  const adjustAmount = (increment: boolean) => {
    setDepositAmount((prev) =>
      increment ? prev + 100 : Math.max(0, prev - 100)
    );
  };

  return (
    <div className="min-h-screen bg-[#131722] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet Overview</h1>
          <p className="text-gray-400">
            Manage your virtual paper-trading funds
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-[#1E222D] rounded-xl p-6 shadow-lg max-w-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FaWallet className="text-2xl text-blue-500" />
              <h2 className="text-xl font-semibold">Virtual Balance</h2>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-500 mb-4">
            {balance === null ? "Loading..." : `₹${balance.toLocaleString()}`}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center justify-center space-x-2 bg-green-500/10 text-green-500 px-4 py-3 rounded-lg hover:bg-green-500/20 transition-all duration-200"
            >
              <FaArrowDown className="text-sm" />
              <span>Deposit</span>
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center justify-center space-x-2 bg-red-500/10 text-red-500 px-4 py-3 rounded-lg hover:bg-red-500/20 transition-all duration-200"
            >
              <FaArrowUp className="text-sm" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E222D] rounded-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowDepositModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <IoClose size={24} />
            </button>

            <h2 className="text-xl font-semibold mb-6">Deposit Funds</h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => adjustAmount(false)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                >
                  <FaMinus />
                </button>

                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) =>
                    setDepositAmount(Math.max(0, Number(e.target.value)))
                  }
                  className="flex-1 bg-[#131722] border border-gray-700 rounded-lg px-4 py-2 text-center text-xl"
                />

                <button
                  onClick={() => adjustAmount(true)}
                  className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"
                >
                  <FaPlus />
                </button>
              </div>

              <button
                onClick={handleDeposit}
                disabled={isDepositing}
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isDepositing ? "Depositing..." : `Add ₹${depositAmount.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E222D] rounded-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <IoClose size={24} />
            </button>

            <h2 className="text-xl font-semibold mb-6">Withdrawal Notice</h2>
            <p className="text-gray-300 mb-6">
              Withdrawals aren't supported in paper trading — this is virtual
              money, not real funds.
            </p>

            <button
              onClick={() => setShowWithdrawModal(false)}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
