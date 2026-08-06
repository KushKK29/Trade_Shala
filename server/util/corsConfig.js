export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/$/, "");

  // Always allow localhost & 127.0.0.1 on any port for local development
  let hostname;
  try {
    hostname = new URL(cleanOrigin).hostname;
  } catch {
    return false;
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }

  // List of production / allowed origins
  const allowedOrigins = [
    "https://trade-shala-yr1j.onrender.com",
    "https://trade-shala-inky.vercel.app",
  ];

  if (process.env.CLIENT_DOMAIN) {
    allowedOrigins.push(process.env.CLIENT_DOMAIN.trim().replace(/\/$/, ""));
  }

  if (allowedOrigins.includes(cleanOrigin)) {
    return true;
  }

  // Allow all only when explicitly running in development
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return false;
};

export const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Cross-Origin-Resource-Policy"],
};
