const mysql = require('mysql2');
require("dotenv").config()

const conn = mysql.createConnection({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
});

conn.connect();

module.exports = conn;