var models = require('fec-model');

module.exports = models({
    driver: process.env.DB_DRIVER,
    host: process.env.DB_HOST,
    name: process.env.DB_NAME,
    pass: process.env.DB_PASS,
    port: process.env.DB_PORT
    user: process.env.DB_USER,
});
