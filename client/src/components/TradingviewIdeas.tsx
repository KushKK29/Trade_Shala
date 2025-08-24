import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Heart, MessageSquare } from "lucide-react";

// -------------------------
// TypeScript interfaces
// -------------------------
interface User {
  id: number;
  username: string;
  picture_url: string;
  is_pro: boolean;
  pro_plan?: string;
}

interface Symbol {
  name: string;
  full_name: string;
  short_name: string;
  exchange: string;
  logo_urls: string[];
}

interface Image {
  big: string;
  middle: string;
}

interface Idea {
  id: number;
  name: string;
  description: string;
  chart_url: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  image: Image;
  symbol: Symbol;
  user: User;
}

// -------------------------
// Component
// -------------------------
const TradingViewIdeas = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    try {
      const response = await axios.request({
        method: "GET",
        url: "https://tradingview18.p.rapidapi.com/ideas/list",
        headers: {
          "x-rapidapi-key": "95d9e3bb90mshfcaaca069c92487p1b2b19jsn8b205aaaeb4e",
          "x-rapidapi-host": "tradingview18.p.rapidapi.com",
        },
      });

      const ideasArray = response.data?.data?.results || [];
      setIdeas(ideasArray);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Rate limit exceeded. Try again later.");
      } else {
        setError("Failed to fetch ideas.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
        <span className="ml-2">Loading ideas...</span>
      </div>
    );

  if (error)
    return <div className="text-red-500 text-center p-4">{error}</div>;

    return (
        <div className="mt-8 ml-4 mr-4 text-center">
            <h2 className="text-3xl font-extrabold text-white tracking-wide">
    Market Ideas
  </h2>
  <p className="text-gray-400 text-sm mt-2">
    Discover trending trading ideas and insights by Trading View
  </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
          
      {ideas.map((idea) => (
        <div
          key={idea.id}
          className="rounded-2xl shadow-md border p-4 hover:shadow-lg hover:border-green-500 hover:shadow-green-500 transition"
        >
          {/* Idea Image */}
          <a href={idea.chart_url} target="_blank" rel="noopener noreferrer">
            <img
              src={idea.image?.middle}
              alt={idea.name}
              className="rounded-xl w-full h-48 object-cover mb-3"
            />
          </a>

          {/* Title */}
          <h2 className="text-lg font-semibold line-clamp-2">{idea.name}</h2>
          <p className="text-sm text-gray-600 line-clamp-3">
            {idea.description}
          </p>

          {/* Author */}
          <div className="flex items-center gap-2 mt-3">
            <img
              src={idea.user.picture_url}
              alt={idea.user.username}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm">{idea.user.username}</span>
            {idea.user.is_pro && (
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                {idea.user.pro_plan}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" /> {idea.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> {idea.comments_count}
            </span>
            <span>{new Date(idea.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
            </div>
            </div>
  );
};

export default TradingViewIdeas;
