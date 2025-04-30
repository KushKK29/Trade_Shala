import { useState } from "react";
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaMinus,
  FaExchangeAlt,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { motion } from "framer-motion";

const WalletPage = () => {
  const [balance, setBalance] = useState(25000);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(1000);
  const [isDemo, setIsDemo] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: "Deposit",
      amount: 5000,
      date: "2025-01-30",
      status: "Completed",
    },
    {
      id: 3,
      type: "Deposit",
      amount: 10000,
      date: "2025-01-25",
      status: "Completed",
    },
  ]);

  const handleDeposit = () => {
    if (depositAmount > 0 && isDemo) {
      const newTransaction = {
        id: transactions.length + 1,
        type: "Deposit",
        amount: depositAmount,
        date: new Date().toISOString().split("T")[0],
        status: "Completed",
      };

      setBalance((prev) => prev + depositAmount);
      setTransactions([newTransaction, ...transactions]);

      setShowDepositModal(false);
      setDepositAmount(1000);
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
        {/* Account Switcher */}
        <div className="absolute top-20 right-8">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 bg-[#1E222D] text-white px-4 py-2 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors duration-300"
            >
              <FaExchangeAlt className="text-green-500" />
              <span>{isDemo ? "Demo Account" : "Real Account"}</span>
            </button>

            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-[#1E222D] rounded-lg shadow-lg border border-green-500/20 overflow-hidden z-50"
              >
                <button
                  onClick={() => {
                    setIsDemo(true);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-green-500/10 transition-colors duration-200 ${
                    isDemo ? "text-green-500" : "text-white"
                  }`}
                >
                  Demo Account
                </button>
                <button
                  onClick={() => {
                    setIsDemo(false);
                    setShowDropdown(false);
                    setBalance(0);
                    setTransactions([]);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-green-500/10 transition-colors duration-200 ${
                    !isDemo ? "text-green-500" : "text-white"
                  }`}
                >
                  Real Account
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet Overview</h1>
          <p className="text-gray-400">
            {isDemo
              ? "Manage your demo funds and track transactions"
              : "Connect your real account to manage funds"}
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="bg-[#1E222D] rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaWallet className="text-2xl text-blue-500" />
                <h2 className="text-xl font-semibold">Total Balance</h2>
              </div>
              <span className="text-xs text-gray-400">Updated just now</span>
            </div>
            <div className="text-3xl font-bold text-green-500 mb-4">
              ₹{balance.toLocaleString()}
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

          {/* Quick Stats */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1E222D] rounded-xl p-6">
                <h3 className="text-gray-400 mb-2">Today's Deposits</h3>
                <p className="text-2xl font-bold text-green-500">₹5,000</p>
              </div>
              <div className="bg-[#1E222D] rounded-xl p-6">
                <h3 className="text-gray-400 mb-2">Today's Withdrawals</h3>
                <p className="text-2xl font-bold text-red-500">₹2,000</p>
              </div>
              <div className="bg-[#1E222D] rounded-xl p-6">
                <h3 className="text-gray-400 mb-2">Pending Transactions</h3>
                <p className="text-2xl font-bold text-yellow-500">1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        {isDemo ? (
          <div className="mt-8 bg-[#1E222D] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Transaction History</h2>
              <button className="text-blue-500 hover:text-blue-400">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-4 px-4">Type</th>
                    <th className="text-left py-4 px-4">Amount</th>
                    <th className="text-left py-4 px-4">Date</th>
                    <th className="text-left py-4 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-700/50 hover:bg-gray-800/30"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {tx.type === "Deposit" ? (
                            <FaArrowDown className="text-green-500" />
                          ) : (
                            <FaArrowUp className="text-red-500" />
                          )}
                          <span
                            className={
                              tx.type === "Deposit"
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {tx.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        ₹{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-gray-400">{tx.date}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            tx.status === "Completed"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-[#1E222D] rounded-xl p-6 text-center">
            <p className="text-gray-400">
              No transaction history available for real account. Please connect
              your account to view transactions.
            </p>
          </div>
        )}
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

            <h2 className="text-xl font-semibold mb-6">
              {isDemo ? "Deposit Funds" : "Real Account Notice"}
            </h2>

            {isDemo ? (
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
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add ₹{depositAmount.toLocaleString()}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 mb-6">
                  Please connect your real account to make deposits.
                </p>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
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
              In paper trading, withdrawals are not possible from the demo
              account.
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
