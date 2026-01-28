/* SERVER.JS (Updated with Chat) */
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });
const path = require("path");

app.use(express.static("public"));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

io.on("connection", (socket) => {
    // 1. Room Logic
    socket.on("create-room", () => {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        socket.join(pin);
        socket.emit("room-created", pin);
    });

    socket.on("join-room", (pin) => {
        const room = io.sockets.adapter.rooms.get(pin);
        if (room && room.size > 0) {
            socket.join(pin);
            socket.to(pin).emit("user-connected");
        } else {
            socket.emit("error-msg", "Invalid PIN");
        }
    });

    // 2. Signaling
    socket.on("offer", d => socket.to(d.room).emit("offer", d.sdp));
    socket.on("answer", d => socket.to(d.room).emit("answer", d.sdp));
    socket.on("candidate", d => socket.to(d.room).emit("candidate", d.candidate));
    
    // 3. Chat Relay (NEW)
    socket.on("chat-msg", d => socket.to(d.room).emit("chat-msg", d));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Active on ${PORT}`));
