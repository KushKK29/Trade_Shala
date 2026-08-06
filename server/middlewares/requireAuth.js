import jwt from "jsonwebtoken";

// Verifies the bearer JWT and requires it to belong to the :id in the route.
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (req.params.id && decoded.id !== req.params.id) {
      return res.status(403).json({ message: "Not authorized to access this resource." });
    }
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export default requireAuth;
