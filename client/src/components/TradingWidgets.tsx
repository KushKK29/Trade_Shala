// "use client";

// import React from "react";
// import {
//   AdvancedRealTimeChart,
//   TechnicalAnalysis,
//   MarketOverview,
//   MarketData,
//   StockMarket,
//   EconomicCalendar,
//   Ticker,
//   TickerTape,
//   SingleTicker,
//   MiniChart,
//   SymbolOverview,
//   SymbolInfo,
//   ForexCrossRates,
//   ForexHeatMap,
//   Screener,
//   FundamentalData,
//   CompanyProfile,
//   Timeline,
// } from "react-ts-tradingview-widgets";

// const TradingWidgets: React.FC = () => {
//   return (
//     <div style={{ padding: "20px", background: "#111", color: "white" }}>
//       <h1 style={{ textAlign: "center" }}>Trading Dashboard</h1>

//       {/* Ticker Tape */}
//       <TickerTape
//         symbols={[
//           { proName: "NSE:NIFTY50", title: "NIFTY 50" },
//           { proName: "BSE:SENSEX", title: "SENSEX" },
//           { proName: "NSE:RELIANCE", title: "Reliance" },
//         ]}
//       />

//       {/* Advanced Real-Time Chart */}
//       <div style={{ marginTop: "20px", height: "500px" }}>
//         <AdvancedRealTimeChart symbol="NSE:RELIANCE" theme="dark" autosize />
//       </div>

//       {/* Technical Analysis */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <TechnicalAnalysis symbol="NSE:RELIANCE" />
//       </div>

//       {/* Market Overview */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <MarketOverview />
//       </div>

//       {/* Market Data */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <MarketData />
//       </div>

//       {/* Stock Market Widget */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <StockMarket />
//       </div>

//       {/* Economic Calendar */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <EconomicCalendar />
//       </div>

//       {/* Single Ticker */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <SingleTicker symbol="NSE:TCS" />
//       </div>

//       {/* Mini Chart */}
//       <div style={{ marginTop: "20px", height: "300px" }}>
//         <MiniChart symbol="NSE:HDFCBANK" />
//       </div>

//       {/* Symbol Overview */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <SymbolOverview
//           symbols={[
//             { proName: "NSE:INFY", title: "Infosys" },
//             { proName: "NSE:WIPRO", title: "Wipro" },
//           ]}
//         />
//       </div>

//       {/* Symbol Info */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <SymbolInfo symbol="NSE:HDFCBANK" />
//       </div>

//       {/* Forex Cross Rates */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <ForexCrossRates currency="INR" />
//       </div>

//       {/* Forex Heat Map */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <ForexHeatMap currency="INR" />
//       </div>

//       {/* Screener */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <Screener />
//       </div>

      

//       {/* Fundamental Data */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <FundamentalData symbol="NSE:RELIANCE" />
//       </div>

//       {/* Company Profile */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <CompanyProfile symbol="NSE:RELIANCE" />
//       </div>

//       {/* Timeline */}
//       <div style={{ marginTop: "20px", height: "400px" }}>
//         <Timeline />
//       </div>
//     </div>
//   );
// };

// export default TradingWidgets;
