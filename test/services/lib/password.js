async function run() {
    const { hashPassword, comparePassword } = require('../../../src/services/lib/password');

    const password = 'password';

    console.log('password', password);

    const hash = await hashPassword(password);
    console.log('hash', hash);

    const result = await comparePassword(password, hash);
    console.log('result', result);
}

run();