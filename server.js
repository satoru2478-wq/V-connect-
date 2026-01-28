const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
    cors: { origin: "*" }
});
const path = require("path");

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Helper: Generate 4-digit PIN
function generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on("connection", (socket) => {
    // 1. Host creates room
    socket.on("create-room", () => {
        const pin = generatePin();
        socket.join(pin);
        socket.emit("room-created", pin);
        console.log(`Room created: ${pin}`);
    });

    // 2. Guest joins room
    socket.on("join-room", (pin) => {
        const room = io.sockets.adapter.rooms.get(pin);
        if (room && room.size > 0) {
            socket.join(pin);
            socket.to(pin).emit("user-connected");
            console.log(`User joined: ${pin}`);
        } else {
            socket.emit("error-msg", "Invalid PIN or Room not started.");
        }
    });

    // 3. Signaling (The Handshake)
    socket.on("offer", data => socket.to(data.room).emit("offer", data.sdp));
    socket.on("answer", data => socket.to(data.room).emit("answer", data.sdp));
    socket.on("candidate", data => socket.to(data.room).emit("candidate", data.candidate));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
