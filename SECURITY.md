# Express 

Best practices at https://expressjs.com/en/advanced/best-practice-security.html

# MongoDB

https://www.mongodb.com/docs/manual/administration/security-checklist/


# Secure Password Management in the Application

This guide outlines the best practices used in the application for securely managing passwords. The password management system implements Argon2 for password hashing and comparison, and implements salt and pepper for additional security.

## Hashing Passwords for Secure Storage

To ensure the security of user passwords, the following best practices are implemented in the password hashing process:

-   Input type validation: The input password is checked to ensure it is of type string.
-   Salt generation: A unique salt is generated for each password using a cryptographically secure random number generator.
-   Hashing with Argon2: The password is hashed using Argon2 
-   Pepper: A pepper is used as an additional layer of security, providing defense in depth. The pepper is a secret value stored separately from the password hash and should be stored securely.
-   Hash encoding: The salt, pepper, and hash are concatenated into a single string for secure storage.

## Password Comparison for Login

For secure password comparison during login, the following best practices are implemented in the password comparison process:

-   Input length validation: The input password is checked to ensure it is within a specified maximum length, protecting against denial of service attacks with very long inputs.
-   Input type validation: The input password is checked to ensure it is of type string.
-   Constant time comparison: The password comparison is performed in constant time to protect against timing attacks.
-   Hash decoding: The stored hash is decoded to retrieve the salt, pepper, and password hash for comparison.
-   Password comparison: The input password is hashed with Argon2 using the retrieved salt and pepper, and compared with the stored password hash.