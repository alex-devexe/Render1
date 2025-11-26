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

// ⚠ Solo para pruebas (usa otro store en producción)
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

        // Guardamos más datos en sesión
        req.session.username = user.username;
        req.session.userId = user.id;

        res.redirect("/welcome");

    } catch (err) {
        console.error("Error en login:", err);
        res.send("Error en el servidor.");
    }
});

// Welcome con datos del perfil
app.get("/welcome", async (req, res) => {
    if (!req.session.userId) return res.redirect("/");

    try {
        const result = await db.query(
            "SELECT * FROM user_profile WHERE user_id = $1",
            [req.session.userId]
        );

        const profile = result.rows[0] || null;

        res.render("welcome", {
            user: req.session.username,
            profile
        });

    } catch (err) {
        console.error("Error cargando perfil:", err);
        res.send("Error cargando datos.");
    }
});

// Formulario perfil
app.get("/profile", async (req, res) => {
    if (!req.session.userId) return res.redirect("/");

    const result = await db.query(
        "SELECT * FROM user_profile WHERE user_id = $1",
        [req.session.userId]
    );

    res.render("profile", { profile: result.rows[0] });
});

// Guardar perfil
app.post("/profile", async (req, res) => {
    const { full_name, birthdate, address, phone, bio } = req.body;

    try {
        const exists = await db.query(
            "SELECT id FROM user_profile WHERE user_id = $1",
            [req.session.userId]
        );

        if (exists.rows.length > 0) {
            await db.query(
                `UPDATE user_profile 
                 SET full_name=$1, birthdate=$2, address=$3, phone=$4, bio=$5 
                 WHERE user_id=$6`,
                [full_name, birthdate, address, phone, bio, req.session.userId]
            );
        } else {
            await db.query(
                `INSERT INTO user_profile 
                 (user_id, full_name, birthdate, address, phone, bio) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [req.session.userId, full_name, birthdate, address, phone, bio]
            );
        }

        res.redirect("/welcome");

    } catch (err) {
        console.error("Error guardando perfil:", err);
        res.send("Error guardando información.");
    }
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
