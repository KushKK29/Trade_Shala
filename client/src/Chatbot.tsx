import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GoogleGenAI } from "@google/genai";
import { motion } from "framer-motion";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { Send, Loader, X, Maximize2, Minimize2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface GeminiChatbotProps {
  apiKey: string;
}

const GeminiChatbot: React.FC<GeminiChatbotProps> = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const ai = new GoogleGenAI({ apiKey });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder for bot response
    const botMessagePlaceholder: ChatMessage = {
      role: "bot",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessagePlaceholder]);
    
    let botText = "";

    try {
      // Prepare history
      const history = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        config: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
        contents: [
          ...history,
          {
            role: "user",
            parts: [{ text: message + "\n\nPlease provide a helpful answer, summarized in 3-4 lines maximum." }],
          },
        ],
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          botText += chunk.text;
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex].role === "bot") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: botText
              };
            }
            return updated;
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
      // Remove placeholder if failed
      setMessages((prev) => {
         const last = prev[prev.length - 1];
         if (last.role === "bot" && last.content === "") {
             return prev.slice(0, -1);
         }
         return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full shadow-lg text-white hover:shadow-xl transition-shadow"
        >
          <ChatBubbleIcon className="w-6 h-6" />
        </motion.button>
      )}

      {isOpen && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          className={`fixed ${
            isExpanded
              ? "bottom-0 right-0 w-full h-[600px] md:w-[500px] md:h-[600px] md:bottom-4 md:right-4"
              : "bottom-16 right-4 w-[350px] h-[500px]"
          } bg-[#0a0b0d] shadow-2xl rounded-lg overflow-hidden flex flex-col transition-all duration-300`}
        >
          <Card className="h-full border-0 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-gray-800">
              <CardTitle className="text-lg font-semibold text-white">
                Trade Assistant
              </CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors text-white"
                >
                  {isExpanded ? (
                    <Minimize2 size={18} />
                  ) : (
                    <Maximize2 size={18} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4 p-0 h-[calc(100%-4rem)] bg-[#131722]">
              <ScrollArea className="flex-1 p-4 custom-scrollbar">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={index}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-[#1a1c25] text-gray-100 border border-gray-800"
                        } ${
                          msg.role === "user"
                            ? "rounded-tr-sm"
                            : "rounded-tl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">
                          {msg.content === "" && msg.role === "bot" ? (
                            <div className="flex gap-1 h-6 items-center px-1">
                              <motion.div
                                className="w-2 h-2 bg-gray-400 rounded-full"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-gray-400 rounded-full"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-gray-400 rounded-full"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                              />
                            </div>
                          ) : (
                            msg.content
                          )}
                        </p>
                        <span className="text-xs opacity-70 mt-2 block w-full text-right">
                          {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }).toLowerCase()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {error && (
                <div className="px-4 py-2 text-red-400 text-sm bg-red-900/20 mx-4 rounded border border-red-800">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-gray-800 bg-[#1a1c25]"
              >
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask anything about trading..."
                    disabled={isLoading}
                    className="flex-1 rounded-full bg-[#131722] border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default GeminiChatbot;
