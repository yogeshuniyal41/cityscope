import jwt from 'jsonwebtoken';

export function getUserFromToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      console.error("Invalid token: Missing userId");
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return null;
  }
}