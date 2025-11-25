const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "secreto123",
    resave: false,
    saveUninitialized: false
}));

// Página de login
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

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query("INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword], (err) => {
        if (err) throw err;
        res.redirect("/");
    });
});

// Iniciar sesión
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
        if (results.length === 0) {
            return res.send("Usuario no encontrado.");
        }

        const valid = await bcrypt.compare(password, results[0].password);

        if (!valid) {
            return res.send("Contraseña incorrecta.");
        }

        req.session.username = username;
        res.redirect("/welcome");
    });
});

// Página de bienvenida
app.get("/welcome", (req, res) => {
    if (!req.session.username) return res.redirect("/");
    res.render("welcome", { user: req.session.username });
});

// Cerrar sesión
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.listen(3000, () => console.log("Servidor en http://localhost:3000"));
