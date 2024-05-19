import bcrypt from "bcryptjs";
import crypto from "crypto";

export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);
    return hashPassword;
  } catch (error) {
    console.log(error);
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.log(error);
  }
};

export const generatePasswordResetToken = () => {
  // Generate a random byte array of length 20
  const buffer = crypto.randomBytes(20);

  // Convert the byte array to a hexadecimal string (for easier storage)
  return buffer.toString("hex");
};

export const validatePasswordResetToken = (token) => {
  // Implementation of validating password reset token
};
