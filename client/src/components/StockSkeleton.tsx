
const StockSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#131722]">
      {/* Header Skeleton */}
      <header className="bg-[#1E222D] shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center animate-pulse">
              <div className="h-8 w-8 bg-gray-700/50 rounded-md"></div>
              <div className="ml-2 h-8 w-40 bg-gray-700/50 rounded-md"></div>
            </div>
            <div className="flex items-center space-x-2 animate-pulse">
              <div className="h-5 w-5 bg-gray-700/50 rounded-md"></div>
              <div className="h-5 w-32 bg-gray-700/50 rounded-md"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-pulse">
              {/* Stock Info Section */}
              <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg border border-gray-800 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="h-8 w-40 bg-gray-700/50 rounded-md mb-2"></div>
                    <div className="h-5 w-64 bg-gray-700/50 rounded-md"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-9 w-32 bg-gray-700/50 rounded-md mb-2"></div>
                    <div className="h-5 w-24 bg-gray-700/50 rounded-md ml-auto"></div>
                  </div>
                </div>

                {/* Time Range Buttons */}
                <div className="mb-8 flex space-x-2">
                  {["1D", "1W", "1M", "3M", "1Y"].map((range, index) => (
                    <div
                      key={range}
                      className={`h-10 w-16 rounded-md ${
                        index === 0 ? "bg-blue-500/50" : "bg-[#262B3D]/50"
                      }`}
                    ></div>
                  ))}
                </div>

                {/* Chart Area with Volume Bars */}
                <div className="relative">
                  <div className="h-[300px] bg-gradient-to-b from-gray-700/30 to-gray-700/10 rounded-lg mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-[2px] bg-gray-700/50"></div>
                    </div>
                  </div>

                  <div className="h-[100px] flex items-end space-x-1">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gray-700/30 rounded-sm"
                        style={{
                          height: `${Math.random() * 100}%`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistics Section */}
              <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg border border-gray-800">
                <div className="h-7 w-36 bg-gray-700/50 rounded-md mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {["Open", "High", "Low", "Volume"].map((stat) => (
                    <div key={stat} className="space-y-2">
                      <div className="h-5 w-20 bg-gray-700/50 rounded-md"></div>
                      <div className="h-7 w-28 bg-gray-700/50 rounded-md"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="animate-pulse">
            <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg border border-gray-800">
              <div className="h-8 w-32 bg-gray-700/50 rounded-md mb-6"></div>

              {/* Order Type Selector */}
              <div className="h-10 w-full bg-gray-700/50 rounded-md mb-4"></div>

              {/* Quantity Input */}
              <div className="h-10 w-full bg-gray-700/50 rounded-md mb-4"></div>

              {/* Price Display */}
              <div className="h-16 w-full bg-gray-700/50 rounded-md mb-6"></div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="h-12 bg-green-500/30 rounded-md"></div>
                <div className="h-12 bg-red-500/30 rounded-md"></div>
              </div>

              {/* Balance */}
              <div className="h-6 w-full bg-gray-700/50 rounded-md"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StockSkeleton;
