import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import ContactUs from "./pages/ContectUs";
import News from "./pages/News";
import WalletPage from "./pages/Wallet";
import Stock from "./pages/Stock";
import LoginByPhone from "./pages/LoginByPhone";
import LoginByEmail from "./pages/LoginByEmail";
import Signup from "./pages/Signup";
import { TradeProvider } from "./context/context";
import Profile from "./pages/Profile";
import Footer from "./components/Footer";
import CompanyProfile from "./pages/CompanyProfile";
import GeminiChatbot from "./Chatbot";
import TechnicalAnalysisPage from "./pages/TechnicalAnalysisPage";
import Marketplace from "./pages/Marketplace";

// import TradingWidgets from "./components/TradingWidgets";

function App() {
  return (
    <TradeProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login/phone" element={<LoginByPhone />} />
          <Route path="/login/email" element={<LoginByEmail />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/news" element={<News />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stock/:stockName" element={<Stock />} />
          <Route
            path="/technical-analysis/:stockName"
            element={<TechnicalAnalysisPage />}
          />
          <Route path="/company/:companyName" element={<CompanyProfile />} />
          <Route path="/marketplace" element={<Marketplace />} />
        </Routes>
        <GeminiChatbot apiKey="AIzaSyBvX1pXSK0h3ZANvyzeyNsje9FHSHFXp2U" />
        <Footer />
      </Router>
      {/* <TradingWidgets></TradingWidgets> */}
    </TradeProvider>
  );
}

export default App;
