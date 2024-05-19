import express from "express";
import {
  onFailure,
  onSuccess,
  registerController,
  adminDeleteUserController,
  adminDeleteAllUsersController,
  adminDeactivateUserController,
  adminReactivateUserController,
} from "../controllers/authController.js";
import { loginController } from "../controllers/authController.js";
import { updateController } from "../controllers/authController.js";
import { deleteController } from "../controllers/authController.js";
import { forgotPasswordController } from "../controllers/authController.js";
import { resetPasswordController } from "../controllers/authController.js";
import { testController } from "../controllers/authController.js";

import {
  isAdmin,
  requireSignIn,
  setupAuth,
} from "../middlewares/authMiddlewares.js";
import passport from "passport";

const router = express.Router();

router.post("/register", registerController);

// Login
router.post("/login", loginController);

router.put("/update/:userId", updateController); // Add route for update

router.delete("/delete/:userId", deleteController);

router.post("/forgot-password", forgotPasswordController); // Add route for forget password

router.post("/reset-password/:resetToken", resetPasswordController);

// test route
router.get("/test", requireSignIn, isAdmin, testController);

// Apply the setup function with passport

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

router.delete(
  "/admin/delete/:userId",
  requireSignIn,
  isAdmin,
  adminDeleteUserController
);

router.delete(
  "/admin/delete-all",
  requireSignIn,
  isAdmin,
  adminDeleteAllUsersController
);

router.put(
  "/admin/deactivate/:userId",
  requireSignIn,
  isAdmin,
  adminDeactivateUserController
);

router.put(
  "/admin/reactivate/:userId",
  requireSignIn,
  isAdmin,
  adminReactivateUserController
);

export default router;
