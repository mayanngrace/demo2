const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// app.use(session({
//     secret: "secret123",
//     resave: false,
//     saveUninitialized: true
// }));

app.set("trust proxy", 1);

app.use(session({
    secret: "campus_secret_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true
    }
}));

require("dotenv").config
mongoose.connect("mongodb://127.0.0.1:27017/communityDB")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB error:", err));

const postSchema = new mongoose.Schema({
    title: String,
    category: String
});

const Post = mongoose.model("Post", postSchema);

function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect("/loginPage");
}

// ── LOGIN ──
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "123") {
        req.session.user = { role: "admin" };
        return res.json({ role: "admin" });
    }
    if (username === "student" && password === "123") {
        req.session.user = { role: "student" };
        return res.json({ role: "student" });
    }
    res.status(401).send("Invalid credentials");
});

// ── LOGOUT ──
app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/loginPage"));
});

// ── SESSION INFO ──
app.get("/session-info", isAuthenticated, (req, res) => {
    res.json({ role: req.session.user.role });
});

// ── PAGES ──
app.get("/", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

app.get("/about", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public/about.html"));
});

app.get("/courses", isAuthenticated, (req, res) => {
    if (req.session.user.role === "admin") return res.redirect("/");
    res.sendFile(path.join(__dirname, "public/courses.html"));
});

app.get("/student", isAuthenticated, (req, res) => {
    if (req.session.user.role === "admin") return res.redirect("/");
    res.sendFile(path.join(__dirname, "public/student.html"));
});

app.get("/community", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public/community.html"));
});

app.get("/loginPage", (req, res) => {
    res.sendFile(path.join(__dirname, "public/login.html"));
});

// ── POSTS API ──

app.get("/posts", isAuthenticated, async (req, res) => {
    const { category, search } = req.query;
    let query = {};
    if (category && category !== "All") query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };
    const posts = await Post.find(query);
    res.json(posts);
});

// Only students can CREATE
app.post("/posts", isAuthenticated, async (req, res) => {
    if (req.session.user.role === "admin") {
        return res.status(403).json({ error: "Admins cannot create posts" });
    }
    const newPost = await Post.create(req.body);
    res.json(newPost);
});

// Both student AND admin can DELETE
app.delete("/posts/:id", isAuthenticated, async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});