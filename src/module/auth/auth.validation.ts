import { z } from "zod";
import { emailRegex, passwordRegex } from "../../constants/regex.constants";

const playerSignUpValidation = z.object({
  body: z.object({
    data: z.object({
      name: z.string({ required_error: "Name is required" }),
      email: z
        .string({ required_error: "Email is required" })
        .regex(emailRegex, "Valid email is required")
        .email("Email must be a valid email address"),
      password: z
        .string({ required_error: "Password is required" })
        .min(8, "Minimum password length is 8")
        .regex(
          passwordRegex,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    }),
  }),
});

const userSignInValidation = z.object({
  body: z.object({
    data: z.object({
      sub: z.string(),
      email: z.string({ required_error: "Email is required" }),
      password: z
        .string({ required_error: "Password is required" })
        .min(8, "minimum password length is 8")
        .regex(
          passwordRegex,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        )
        .optional(),
    }),
  }),
});

const resetPasswordValidation = z.object({
  body: z.object({
    data: z.object({
      userId: z.string({ required_error: "Id is required" }),
      newPassword: z
        .string({ required_error: "Password is required" })
        .min(8, "minimum password length is 8")
        .regex(
          passwordRegex,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    }),
  }),
});

const updatePasswordValidation = z.object({
  body: z.object({
    data: z.object({
      oldPassword: z
        .string({ required_error: "Password is required" })
        .min(8, "minimum password length is 8")
        .regex(
          passwordRegex,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
      newPassword: z
        .string({ required_error: "Password is required" })
        .min(8, "minimum password length is 8")
        .regex(
          passwordRegex,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    }),
  }),
});

const forgotPasswordValidation = z.object({
  body: z.object({
    data: z.object({
      email: z
        .string({ required_error: "Email is required" })
        .regex(emailRegex, "Valid email is required")
        .email("Email must be a valid email address"),
    }),
  }),
});

const verifyOtpdValidation = z.object({
  body: z.object({
    data: z.object({
      email: z
        .string({ required_error: "Email is required" })
        .regex(emailRegex, "Valid email is required")
        .email("Email must be a valid email address"),
      otp: z
        .string({ required_error: "OTP is required" })
        .length(6, "OTP must be 6 digits")
        .regex(/^\d{6}$/, "OTP must be a 6-digit number"),
    }),
  }),
});

const AuthValidationSchema = {
  userSignInValidation,
  resetPasswordValidation,
  updatePasswordValidation,
  forgotPasswordValidation,
  verifyOtpdValidation,
  playerSignUpValidation,
};

export default AuthValidationSchema;
