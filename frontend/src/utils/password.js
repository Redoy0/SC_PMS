// Mirrors the backend policy in backend/src/utils/validation.js
export function passwordChecks(password) {
  return {
    length: password.length >= 8 && password.length <= 64,
    letter: /[a-z]/i.test(password),
    number: /\d/.test(password),
  };
}

export function isPasswordValid(password) {
  const c = passwordChecks(password);
  return c.length && c.letter && c.number;
}
