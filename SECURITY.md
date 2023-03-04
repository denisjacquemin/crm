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

# CSRF

Use the '@dr.pogodin/csurf' package.

req.csrfToken() should be added within a hidden form field to requests which mutate state. Implements the double submit cookie pattern (see https://github.com/birdofpreyru/csurf#cookie).

# Using Slugs in URLs

ID enumeration, ID guessing, and ID brute force are all techniques used by attackers to guess or obtain valid identifiers for resources or objects in a system, such as user IDs or document IDs.

ID enumeration is the process of guessing valid IDs by systematically trying different values. This technique can be used to identify valid user or document IDs and potentially gain access to sensitive information. Attackers can use various methods to enumerate IDs, such as incrementing numbers or guessing common patterns.

ID guessing is similar to ID enumeration, but involves using a more targeted approach to guess specific IDs based on known information about the target, such as their name or other personal details. This technique can be more effective than ID enumeration, but requires more specific knowledge about the target.

ID brute force is a more aggressive technique that involves trying a large number of possible IDs in a short period of time, typically using automated tools. This technique can be used to identify valid IDs for a large number of resources or objects and potentially gain access to sensitive information or perform other malicious actions.

Using slugs in URLs can help mitigate these risks by providing a less predictable identifier than a numerical ID. Slugs are typically more complex and harder to guess than IDs, and can help make it more difficult for attackers to perform ID enumeration, guessing, or brute force attacks. Additionally, using slugs can help make URLs more user-friendly and improve the overall usability of the application.