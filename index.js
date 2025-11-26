const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const db = require("./db");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// ⚠ MemoryStore se usa solo para pruebas.
// En producción real se recomienda connect-pg-simple.
app.use(session({
    secret: process.env.SESSION_SECRET || "secreto123",
    resave: false,
    saveUninitialized: false,
}));

// -------------------------
//       RUTAS
// -------------------------

// Login
app.get("/", (req, res) => {
    res.render("login");
});

// Página de registro
app.get("/register", (req, res) => {
    res.render("register");
});

// Registrar usuario
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO users (username, password) VALUES ($1, $2)",
            [username, hashedPassword]
        );

        res.redirect("/");

    } catch (err) {
        console.error("Error al registrar usuario:", err);
        res.send("Error: el usuario ya existe o hubo un problema.");
    }
});

// Iniciar sesión
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.send("Usuario no encontrado.");
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.send("Contraseña incorrecta.");
        }

        req.session.username = username;
        res.redirect("/welcome");

    } catch (err) {
        console.error("Error en login:", err);
        res.send("Error en el servidor.");
    }
});

// Welcome
app.get("/welcome", (req, res) => {
    if (!req.session.username) return res.redirect("/");
    res.render("welcome", { user: req.session.username });
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// Servidor
app.listen(process.env.PORT || 3000, () => {
    console.log("🚀 Servidor corriendo en puerto", process.env.PORT || 3000);
});
