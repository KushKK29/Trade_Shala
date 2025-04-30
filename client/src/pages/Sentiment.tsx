import React, { useEffect, useState } from "react";
import axios from "axios";

interface ForecastData {
  // Add specific type definitions based on actual API response
  id: string;
  measure_code: string;
  period_type: string;
  value: number;
  date: string;
  // Add other fields as needed
}

interface Props {
  stockId: string;
  apiKey: string;
}

const StockForecast: React.FC<Props> = ({ stockId, apiKey }) => {
  const [data, setData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchForecastData = async () => {
      const options = {
        method: "GET",
        url: "https://stock.indianapi.in/stock_forecasts",
        params: {
          stock_id: stockId,
          measure_code: "EPS",
          period_type: "Annual",
          data_type: "Actuals",
          age: "OneWeekAgo",
        },
        headers: {
          "X-Api-Key": apiKey,
        },
      };

      try {
        setLoading(true);
        const response = await axios.request(options);
        setData(response.data);
        setError("");
      } catch (err) {
        setError("Failed to fetch forecast data");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (stockId && apiKey) {
      fetchForecastData();
    }
  }, [stockId, apiKey]);

  // Convert value to percentage for radial progress
  const toPercentage = (value: number): number => {
    // Adjust this calculation based on your needs
    return Math.min(Math.max(Math.round(value * 10), 0), 100);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <div className="text-gray-500">
          No forecast data available for this stock
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Stock Forecast - EPS Analysis</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col items-center">
              <div
                className="radial-progress bg-primary text-primary-content border-primary border-4"
                style={{ "--value": toPercentage(item.value) } as any}
                role="progressbar"
              >
                {item.value.toFixed(2)}
              </div>
              <div className="mt-4 text-center">
                <p className="font-medium">
                  {new Date(item.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Period: {item.period_type}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Forecast Details</h3>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Value</th>
              <th className="text-left p-2">Period</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="p-2">{item.value.toFixed(2)}</td>
                <td className="p-2">{item.period_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockForecast;
