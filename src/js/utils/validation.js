export function validateEmail(value) {
  if (!value?.trim()) {
    return true; // Optional fields are valid when empty
  }

  const emails = value
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  const emailPattern =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  return emails.every((email) => emailPattern.test(email));
}
