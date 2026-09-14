import { registerUser, loginUser } from "../services/authService.js";
import { validateRegisterInput } from "../utils/validators.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const validationError = validateRegisterInput({ name, email, password });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const { user, token } = await registerUser({ name, email, password });
    res.status(201).json({ success: true, user, token });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const { user, token } = await loginUser({ email, password });
    res.status(200).json({ success: true, user, token });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};
