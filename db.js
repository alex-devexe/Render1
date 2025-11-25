const mysql = require("mysql2");
require("dotenv").config();  // cargar variables del .env

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

connection.connect((err) => {
    if (err) {
        console.error("Error al conectar a la BD:", err);
        return;
    }
    console.log("Base de datos conectada.");
});

module.exports = connection;
