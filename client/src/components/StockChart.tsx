import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  Time,
  LineStyle,
  CrosshairMode,
} from "lightweight-charts";
import { format } from "date-fns";

interface StockData {
  time: string;
  price: number;
  volume: number;
}

interface StockChartProps {
  data: StockData[];
  timeRange: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, timeRange }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");
  const [showVolume, setShowVolume] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#1E222D" },
          textColor: "#d1d5db",
          fontFamily: "Inter, sans-serif",
        },
        grid: {
          vertLines: {
            color: showGrid ? "#2A2F44" : "transparent",
            style: LineStyle.Dotted,
          },
          horzLines: {
            color: showGrid ? "#2A2F44" : "transparent",
            style: LineStyle.Dotted,
          },
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: "#2A2F44",
          fixLeftEdge: true,
          fixRightEdge: true,
          tickMarkFormatter: (time: number) => {
            const date = new Date(time * 1000);
            if (timeRange === "1D") {
              return format(date, "HH:mm");
            } else if (timeRange === "1W") {
              return format(date, "EEE");
            } else if (timeRange === "1M") {
              return format(date, "MMM d");
            } else {
              return format(date, "MMM d");
            }
          },
        },
        rightPriceScale: {
          borderColor: "#2A2F44",
          scaleMargins: {
            top: 0.2,
            bottom: 0.2,
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            width: 1,
            color: "#4b5563",
            style: 3,
            labelBackgroundColor: "#374151",
          },
          horzLine: {
            width: 1,
            color: "#4b5563",
            style: 3,
            labelBackgroundColor: "#374151",
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          mouseWheel: true,
          pinch: true,
          axisPressedMouseMove: true,
        },
      });

      const mainSeries = chart.addAreaSeries({
        lineColor: "#3b82f6",
        topColor: "rgba(59, 130, 246, 0.2)",
        bottomColor: "rgba(59, 130, 246, 0)",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: "#3b82f6",
        crosshairMarkerBackgroundColor: "#1E222D",
        priceLineVisible: true,
        priceLineWidth: 1,
        priceLineColor: "#3b82f6",
        priceLineStyle: 2,
        lastValueVisible: true,
        lastPriceAnimation: 1,
        baseLineVisible: true,
        baseLineWidth: 1,
        baseLineColor: "#3b82f6",
        baseLineStyle: 2,
      });

      if (showVolume) {
        const volumeSeries = chart.addHistogramSeries({
          color: "#3b82f6",
          priceFormat: {
            type: "volume",
          },
          priceScaleId: "",
        });

        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.6,
            bottom: 0,
          },
        });

        const volumeData = data.map((item) => ({
          time: (new Date(item.time).getTime() / 1000) as Time,
          value: item.volume,
          color:
            item.price > (data[data.indexOf(item) - 1]?.price || item.price)
              ? "rgba(74, 222, 128, 0.5)"
              : "rgba(248, 113, 113, 0.5)",
        }));

        volumeSeries.setData(volumeData);
      }

      const lineData = data.map((item) => ({
        time: (new Date(item.time).getTime() / 1000) as Time,
        value: item.price,
      }));

      mainSeries.setData(lineData);

      // Set up price formatting
      chart.applyOptions({
        localization: {
          priceFormatter: (price: number) => {
            return new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "INR",
              minimumFractionDigits: 2,
            }).format(price);
          },
        },
      });

      // Create and set up tooltip
      let tooltipRef = document.getElementById("chart-tooltip");
      if (!tooltipRef) {
        tooltipRef = document.createElement("div");
        tooltipRef.id = "chart-tooltip";
        tooltipRef.style.position = "absolute";
        tooltipRef.style.display = "none";
        tooltipRef.style.padding = "8px 12px";
        tooltipRef.style.backgroundColor = "rgba(30, 30, 47, 0.95)";
        tooltipRef.style.border = "1px solid #2A2F44";
        tooltipRef.style.borderRadius = "6px";
        tooltipRef.style.boxShadow =
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
        tooltipRef.style.fontSize = "12px";
        tooltipRef.style.color = "#d1d5db";
        tooltipRef.style.zIndex = "1000";
        tooltipRef.style.pointerEvents = "none";
        tooltipRef.style.transition = "opacity 0.1s ease-in-out";
        chartContainerRef.current.appendChild(tooltipRef);
      }

      // Subscribe to crosshair movement
      chart.subscribeCrosshairMove((param) => {
        if (!param.point || !param.time || !param.seriesData.has(mainSeries)) {
          tooltipRef.style.display = "none";
          return;
        }

        const data = param.seriesData.get(mainSeries) as
          | { value: number }
          | undefined;
        if (!data) {
          tooltipRef.style.display = "none";
          return;
        }

        const price = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
        }).format(data.value);

        const date = new Date((param.time as number) * 1000);
        const dateStr = format(
          date,
          timeRange === "1D" ? "HH:mm:ss" : "MMM d, yyyy HH:mm"
        );

        tooltipRef.innerHTML = `
          <div style="font-weight: 500; margin-bottom: 4px;">${dateStr}</div>
          <div style="color: #3b82f6; font-weight: 600;">${price}</div>
        `;

        const tooltipWidth = tooltipRef.offsetWidth;
        const tooltipHeight = tooltipRef.offsetHeight;

        let left = param.point.x + 20;
        let top = param.point.y - tooltipHeight - 10;

        if (left + tooltipWidth > chartContainerRef.current!.clientWidth) {
          left = param.point.x - tooltipWidth - 20;
        }

        if (top < 0) {
          top = param.point.y + 10;
        }

        tooltipRef.style.left = `${left}px`;
        tooltipRef.style.top = `${top}px`;
        tooltipRef.style.display = "block";
      });

      // Add price markers for significant points
      const lastPrice = lineData[lineData.length - 1]?.value;
      if (lastPrice) {
        mainSeries.createPriceLine({
          price: lastPrice,
          color: "#3b82f6",
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: "Last Price",
        });
      }

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
          chart.timeScale().fitContent();
        }
      };

      window.addEventListener("resize", handleResize);

      chartRef.current = chart;

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    }
  }, [data, timeRange, showVolume, showGrid, chartType]);

  return (
    <div className="relative">
      {/* Chart Controls */}
      <div className="absolute top-4 right-4 flex space-x-2 z-10">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            showGrid
              ? "bg-blue-500 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Grid
        </button>
        <button
          onClick={() => setShowVolume(!showVolume)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            showVolume
              ? "bg-blue-500 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Volume
        </button>
        <button
          onClick={() =>
            setChartType(chartType === "line" ? "candlestick" : "line")
          }
          className="px-3 py-1 rounded-md text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
        >
          {chartType === "line" ? "Candlestick" : "Line"}
        </button>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 text-sm text-gray-300">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Price</span>
          </div>
          {showVolume && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500/50 rounded-sm mr-2"></div>
              <span>Volume</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockChart;
