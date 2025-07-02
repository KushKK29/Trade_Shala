import React, { useState } from "react";

const features = [
  {
    key: "stock-performance",
    title: "Stock Performance Over Time",
    description: "Simulate and visualize stock performance over time.",
    iframe: (
      <iframe
        src="https://adiml1-stocksimulator.hf.space"
        frameBorder="0"
        width="850"
        height="450"
        title="Stock Performance Over Time"
        className="w-full h-[450px]"
      />
    ),
  },
  {
    key: "portfolio-tracker",
    title: "Personalized Portfolio Tracker",
    description: "Track and analyze your portfolio with AI-powered insights.",
    iframe: (
      <iframe
        src="https://rithuskariah-personalized-portfolio-tracker.hf.space"
        frameBorder="0"
        width="850"
        height="450"
        title="Personalized Portfolio Tracker"
        className="w-full h-[450px]"
      />
    ),
  },

  {
    key: "strategy-backtester",
    title: "Strategy Backtester",
    description: "Backtest your trading strategies with historical data.",
    iframe: (
      <iframe
        src="https://giogitto-backtester.hf.space"
        frameBorder="0"
        width="850"
        height="450"
        title="Strategy Backtester"
        className="w-full h-[450px]"
      />
    ),
  },
  {
    key: "financial-agentic-insights",
    title: "Financial Agentic Insights",
    description:
      "Get advanced financial insights and analysis using agentic AI.",
    iframe: (
      <iframe
        src="https://ayush2917-financial-agentic-insights-system.hf.space"
        frameBorder="0"
        width="850"
        height="450"
        title="Financial Agentic Insights"
        className="w-full h-[450px]"
      />
    ),
  },
  {
    key: "portfolio-risk-classification",
    title: "Portfolio Risk Classification",
    description:
      "Classify and analyze the risk profile of your portfolio using AI.",
    iframe: (
      <iframe
        src="https://cuthberttt-riskclassification.hf.space"
        frameBorder="0"
        width="850"
        height="450"
        title="Portfolio Risk Classification"
        className="w-full h-[450px]"
      />
    ),
  },
];

const PortfolioPredict: React.FC = () => {
  const [openFeature, setOpenFeature] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);

  const handleOpen = (key: string) => {
    setOpenFeature(key);
    // Only show loader for iframe-based features
    const feature = features.find((f) => f.key === key);
    setIframeLoading(!!feature?.iframe);
  };
  const handleClose = () => {
    setOpenFeature(null);
    setIframeLoading(false);
  };

  // Helper to clone iframe and add onLoad
  const renderIframeWithLoader = (iframe: React.ReactElement) =>
    React.cloneElement(iframe, {
      onLoad: () => setIframeLoading(false),
      style: { display: iframeLoading ? "none" : "block" },
    });

  return (
    <div className="min-h-screen bg-[#131722] py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-white mb-8">
        AI Portfolio Analysis
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {features.map((feature) => (
          <div
            key={feature.key}
            className="bg-[#1E222D] rounded-xl shadow-lg p-6 cursor-pointer hover:scale-105 transition-transform border border-green-500/40 flex flex-col items-start"
            onClick={() => handleOpen(feature.key)}
          >
            <h2 className="text-xl font-semibold text-white mb-2">
              {feature.title}
            </h2>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Modal Popup */}
      {openFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#1E222D] rounded-lg shadow-2xl p-6 max-w-3xl w-full relative flex flex-col items-center min-h-[500px]">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">
              {features.find((f) => f.key === openFeature)?.title}
            </h2>
            <div className="w-full flex justify-center items-center min-h-[450px] relative">
              {/* Loader for iframe-based features */}
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {/* Render iframe with loader or normal content */}
              {(() => {
                const feature = features.find((f) => f.key === openFeature);
                if (feature?.iframe) {
                  return renderIframeWithLoader(feature.iframe);
                }
                return null;
              })()}
              {/* Render AI Stock Chat if open */}
              {openFeature === "ai-stock-chat" && (
                <div className="w-full max-w-xl mx-auto">
                  {/* Chat UI code here (copy from previous implementation) */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPredict;
