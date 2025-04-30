import React from "react";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { CardProps } from "../types/types";

// Define the props interface
const Card: React.FC<CardProps> = ({ icon, symbol, value, change }) => {
  return (
    <div className="bg-black/60 backdrop-blur-md shadow-md rounded-lg p-2 w-48 border border-gray-700 transition-all duration-300 ease-in-out transform hover:scale-105 hover:z-10 hover:shadow-lg hover:border-green-600 ">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-white text-sm font-semibold">{symbol}</span>
        </div>
        {change >= 0 ? (
          <TrendingUpIcon className="text-green-400 w-4 h-4" />
        ) : (
          <TrendingDownIcon className="text-red-400 w-4 h-4" />
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-300 text-base font-bold">
          ₹{value.toLocaleString()}
        </span>
        <span
          className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
            change >= 0
              ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/50"
              : "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {change}%
        </span>
      </div>
    </div>
  );
};

export default Card;
