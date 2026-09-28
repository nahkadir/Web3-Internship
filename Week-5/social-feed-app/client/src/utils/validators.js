const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const validateRegister = ({ name, email, password }) => {
  const errors = {};
  if (!name.trim()) errors.name = "Name is required";
  else if (name.trim().length < 2)
    errors.name = "Name must be at least 2 characters";

  if (!email.trim()) errors.email = "Email is required";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Invalid email format";

  if (!password) errors.password = "Password is required";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters";
  else if (!/[a-z]/.test(password))
    errors.password = "Password must contain a lowercase letter";
  else if (!/[A-Z]/.test(password))
    errors.password = "Password must contain an uppercase letter";
  else if (!/[0-9]/.test(password))
    errors.password = "Password must contain a number";

  return errors;
};

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Invalid email format";
  if (!password) errors.password = "Password is required";
  return errors;
};
