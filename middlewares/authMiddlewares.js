import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import GoogleStrategy from "passport-google-oauth20";

// export const requireSignIn = async (req, res, next) => {
//     try {
//         const decode = JWT.verify(
//             req.headers.authorization,
//             process.env.JWT_SECRET
//         );
//         req.user = decode;
//         next();
//     } catch (error) {
//         console.log(error);
//     }
// }

// const JWT = require('jsonwebtoken');

export const requireSignIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log(authHeader);

    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = authHeader;
    console.log(token);

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const decode = JWT.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(403).json({ error: "Token is not valid" });
  }
};

// Admin Middleware

export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (user.role !== "1") {
      return res.status(401).send({
        success: false,
        message: "You are not authorized to access this route",
      });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      error,
      message: "Error in Admin Middleware",
    });
  }
};

// // authMiddlewares.js

export const setupAuth = async (passport) => {
  console.log("setupAuth");
  console.log(process.env.CLIENT_ID);
  await passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:8080/api/v1/auth/google/callback",
      },
      (accessToken, refreshToken, profile, cb) => {
        // Here, you would typically find or create the user in your database
        // For now, let's just return the profile
        console.log("done");
        return cb(null, { profile, accessToken });
      }
    )
  );
  console.log("here here here");
  await passport.serializeUser((user, done) => {
    console.log("serializer");
    done(null, user);
  });

  await passport.deserializeUser((obj, done) => {
    console.log("deserializer");
    done(null, obj);
  });
};
