# Best practices from OWASP site at https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

- The name used by the session ID should not be extremely descriptive nor offer unnecessary details about the purpose and meaning of the ID. It is recommended to change the default session ID name of the web development framework to a generic name, such as id

Session cookie named is a random string stored in env variable name CONNECT_SID_NAME

- The session ID length must be at least 128 bits (16 bytes/caracters).

Session id is at least 80 caracters long and signed with a secret stored in env variable


