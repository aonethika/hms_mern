import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user)
      return res.status(401).json({ message: "User not found" });

    req.user = user;

    // console.log("DECODED TOKEN:", decoded);
    // console.log("USER FROM DB:", user);

    next();
  } catch (err) {
    console.log("Token Verification Error:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};