export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // [^\s@] = one or more characters that are NOT whitespace and NOT @.
};

export const validateRegisterInput = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return "Name, email, and password are all required";
  }
  if (!isValidEmail(email)) {
    return "Please provide a valid email address";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};
