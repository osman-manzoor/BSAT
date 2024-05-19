import userModel from "../models/userModel.js";
import { hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import { comparePassword } from "./../helpers/authHelper.js";
import nodemailer from "nodemailer"; // Import nodemailer for email sending
import {
  generatePasswordResetToken,
  validatePasswordResetToken,
} from "../helpers/authHelper.js";
import env from "dotenv";

export const registerController = async (req, res) => {
  try {
    const { name, email, password} = req.body;
    if (!name || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }

    const userExist = await userModel.findOne({ email });
    if (userExist) {
      return res.status(400).send({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await new userModel({
      name,
      email,
      password: hashedPassword,
  
    }).save();

    res.status(201).send({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Registration",
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User does not exist",
      });
    }

    if (user.active === false) {
      return res.status(400).send({
        success: false,
        message: "User status is deactivated",
      });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).send({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        name: user.name,
        email: user.email,

      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Login",
    });
  }
};

// export const loginController = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).send({
//         success: false,
//         message: "All fields are required",
//       });
//     }
//     const user = await userModel.findOne({ email });

//     if (user.active === false) {
//       return res.status(400).send({
//         success: false,
//         message: "User status is deactivated",
//       });
//     }

//     // console.log("user active", user.active);

//     if (!user) {
//       return res.status(400).send({
//         success: false,
//         message: "User does not exist",
//       });
//     }
//     const match = await comparePassword(password, user.password);
//     if (!match) {
//       return res.status(400).send({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     // token
//     const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "7d",
//     });
//     res.status(200).send({
//       success: true,
//       message: "User logged in successfully",
//       token,
//       user: {
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         address: user.address,
//       },
//       token,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: "Error in Login",
//     });
//     error;
//   }
// };

export const updateController = async (req, res) => {
  try {
    const { userId } = req.params; // Extract user ID from URL params
    const { name, email, password, phone, address } = req.body;

    // Check if user exists (avoid unnecessary database interaction)
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      return res.status(400).send({
        success: false,
        message: "User not found",
      });
    }

    // Update logic (handle potential password change)
    let updatedUser = existingUser;
    if (name) updatedUser.name = name;
    if (email) {
      // Check for duplicate email before update (avoid conflicts)
      const duplicateEmailUser = await userModel.findOne({ email });
      if (duplicateEmailUser && duplicateEmailUser._id.toString() !== userId) {
        return res.status(400).send({
          success: false,
          message: "Email already exists",
        });
      }
      updatedUser.email = email;
    }
    if (password) {
      // Validate incoming password before hashing (optional security)
      // ... (implement password validation logic if needed)
      updatedUser.password = await hashPassword(password);
    }
    if (phone) updatedUser.phone = phone;
    if (address) updatedUser.address = address;

    // Update user in database
    const updated = await updatedUser.save();

    // Generate new token (optional, consider stateless approach)
    const token = JWT.sign({ _id: updated._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "User information updated successfully",
      user: {
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
      },
      ...(token && { token }), // Include token only if desired
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error updating user information",
    });
  }
};

export const deleteController = async (req, res) => {
  try {
    const { userId } = req.params; // Extract user ID from URL params

    // Check if user exists (avoid unnecessary database interaction)
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User not found",
      });
    }

    // Delete user (consider soft delete if needed)
    await user.deleteOne(); // Use .deleteOne() for single document deletion

    res.status(200).send({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error deleting user",
    });
  }
};

// const bcrypt = require("bcrypt"); // Import bcrypt for hashing passwords
// const userModel = require("../models/user"); // Import the user model

// ... other auth controller functions (register, login etc.)

export const forgotPasswordController = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists (avoid unnecessary interaction)
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User not found with that email",
      });
    }

    // Generate reset token (use a secure random string generation method)
    const resetToken = generatePasswordResetToken();

    // Set token expiry (optional, define expiry logic)
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour in milliseconds

    // Save user with updated token and expiry
    await user.save();

    // Create email content
    const resetUrl = `http://localhost:8080/api/v1/auth/reset-password/${resetToken}`; // Replace with your reset password URL
    // const resetUrl = `http://localhost:8080/update-password/${resetToken}`; // Replace with your reset password URL
    const message = `
      You have requested a password reset for your account.
      Please click on the following link to reset your password within 1 hour:
      ${resetUrl}

      If you did not request a password reset, please ignore this email.
    `;

    // Send reset password email (replace with your email service details)
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: "musmanfi06@gmail.com", // Replace with your email
    //     pass: "usman@59", // Replace with your password (consider using environment variables for security)
    //   },
    // });

    var transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.mailtrap.io",
      port: 587,
      secure: false,
      auth: {
        user: "awaismaznoor@gmail.com",
        pass: "agbj hpqn gyfp llge",
      },
    });

    // var transporter = nodemailer.createTransport({
    //   host: "sandbox.smtp.mailtrap.io",
    //   port: 2525,
    //   auth: {
    //     user: "dbadc9d25b4f8d",
    //     pass: "b79020da467cb6"
    //   }
    // });

    const mailOptions = {
      from: '"BSAT" awaismaznoor@gmail.com', // Replace with your sender email
      to: user.email,
      subject: "Password Reset Request",
      text: message,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send({
      success: true,
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error sending password reset instructions",
    });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    // Find user by reset token
    const user = await userModel.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Validate the password reset token (optional, implement validation logic)
    // if (!validatePasswordResetToken(resetToken)) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "Invalid reset token",
    //   });
    // }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user's password and clear reset token fields
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).send({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error resetting password",
    });
  }
};

// Test test Controller

export const testController = async (req, res) => {
  try {
    res.send("Test Controller");
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
};

// // authController.js

// // Handles successful authentication
export const onSuccess = (req, res) => {
  // Successful authentication, redirect home.
  console.log("here");
  res.redirect("/");
};

// // Handles failed authentication
export const onFailure = (req, res) => {
  console.log("not here");
  // Handle failure case here, possibly redirect to a custom failure page
  res.redirect("/login?error=Authentication Failed");
};

// authController.js
export const adminDeleteUserController = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the user exists
    const user = await userModel.findById(userId);

    console.log(user);
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User not found",
      });
    }

    // Delete the user
    await user.deleteOne();

    res.status(200).send({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error deleting user",
    });
  }
};

// authController.js
export const adminDeleteAllUsersController = async (req, res) => {
  try {
    // Find and delete all users
    await userModel.deleteMany({});

    res.status(200).send({
      success: true,
      message: "All users deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error deleting all users",
    });
  }
};

// authController.js
export const adminDeactivateUserController = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User not found",
      });
    }

    // Deactivate user
    user.active = false;
    await user.save();

    res.status(200).send({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error deactivating user",
    });
  }
};

// authController.js
export const adminReactivateUserController = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User not found",
      });
    }

    // Reactivate user
    user.active = true;
    await user.save();

    res.status(200).send({
      success: true,
      message: "User reactivated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error reactivating user",
    });
  }
};
