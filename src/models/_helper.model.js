// build helper file that contains function validateEmail(email)

const validateEmail = (email) => {
    return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(email);
}

module.exports = {
    validateEmail
};

