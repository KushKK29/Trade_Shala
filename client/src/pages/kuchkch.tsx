import React from "react";
import { Timeline } from "react-ts-tradingview-widgets";

const TradingViewWidgets: React.FC = () => {
  return (
    <div className="space-y-8">
      <Timeline colorTheme="dark" width="100%" height={500} />
    </div>
  );
};

export default TradingViewWidgets;
