import React, { memo } from "react";
import { ColorTheme, Locales } from "../index";
import Widget from "./Widget";

export type CompanyProfileProps = {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  autosize?: boolean;
  colorTheme?: ColorTheme;
  isTransparent?: boolean;
  locale?: Locales;
  largeChartUrl?: string;

  children?: never;
};

const CompanyProfile: React.FC<CompanyProfileProps> = ({
  symbol = "NASDAQ:AAPL",
  width = 480,
  height = 650,
  autosize = false,
  colorTheme = "light",
  isTransparent = false,
  locale = "en",
  largeChartUrl = undefined,

  ...props
}) => {
  return (
    <Widget
      scriptHTML={{
        ...(!autosize ? { width } : { width: "100%" }),
        ...(!autosize ? { height } : { height: "100%" }),
        symbol,
        colorTheme,
        isTransparent,
        locale,
        largeChartUrl,
        ...props,
      }}
      scriptSRC="https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js"
    />
  );
};

export default memo(CompanyProfile);
