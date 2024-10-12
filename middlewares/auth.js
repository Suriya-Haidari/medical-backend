import jwt from "jsonwebtoken";

export const authenticateJWT = (req, res, next) => {
  const token =
    req.cookies.token ||
    req.headers.authorization?.split(" ")[1] ||
    req.query.token;
  // console.log(token);
  if (!token) {
    console.log("No token provided");
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both Google and custom JWTs
    req.user = {
      id: decoded.id || decoded.userId, // Google might have id, custom auth might have userId
      role: decoded.role, // Ensure the role is also captured if needed
    };
    // console.log(token);

    next();
  } catch (error) {
    console.error("Invalid token:", error.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

export const authenticateJWt2 = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(403).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Add user info to the request
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
