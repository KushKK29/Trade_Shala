import { useParams, useNavigate } from "react-router-dom";
import FundamentalData from "../TradingiewApi/src/components/FundamentalData";
import TechnicalAnalysis from "../TradingiewApi/src/components/TechnicalAnalysis";
import CompanyProfile from "../TradingiewApi/src/components/CompanyProfile";
import TradingViewWidgets from "./kuchkch";
const TechnicalAnalysisPage = () => {
  const { stockName } = useParams<{ stockName: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#131722] text-white">
      <header className="bg-[#1E222D] shadow-lg border-b border-gray-800 p-4 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Back
        </button>
        <h1 className="text-2xl font-bold">Technical Analysis</h1>
      </header>
      <main className="p-8 space-y-8">
        <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Technical Analysis</h2>

          <TechnicalAnalysis
            symbol={stockName}
            colorTheme="dark"
            width="100%"
            height={400}
          />
        </div>
        <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Company Profile</h2>
          <CompanyProfile
            symbol={stockName}
            colorTheme="dark"
            width="100%"
            height={400}
          />
        </div>
        <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Fundamental Data</h2>

          <FundamentalData
            symbol={stockName}
            colorTheme="dark"
            width="100%"
            height={400}
          />
        </div>
        <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">TradingView Widgets</h2>
          <TradingViewWidgets />
        </div>
      </main>
    </div>
  );
};

export default TechnicalAnalysisPage;
