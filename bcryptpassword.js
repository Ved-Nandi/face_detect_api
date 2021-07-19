const bcrypt = require('bcrypt');

const saltRounds = 10;

async function hashpassword(plainPassword) {
    const hash = await bcrypt.hash(plainPassword, saltRounds)
    return hash
}


async function checkpassword(plainPassword, storeduserpassword) {
    const res = await bcrypt.compare(plainPassword, storeduserpassword);
    return res
}

module.exports = {
    checkpassword,
    hashpassword
}