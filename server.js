/* --- SERVER.JS (Auto-Generation Logic) --- */
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Helper: Generate random 4-digit PIN
function generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    // 1. HOST: Asks to create a room
    socket.on("create-room", () => {
        let roomID = generatePin();
        // Ensure this PIN isn't currently active (simple collision check)
        while (io.sockets.adapter.rooms.get(roomID)) {
            roomID = generatePin();
        }
        
        socket.join(roomID);
        socket.emit("room-created", roomID); // Send the PIN back to the host
        console.log(`Room Created: ${roomID}`);
    });

    // 2. GUEST: Joins a room
    socket.on("join-room", (roomId) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        
        if (!room || room.size === 0) {
            socket.emit("error-msg", "INVALID OR EXPIRED PIN");
            return;
        }

        socket.join(roomId);
        
        // Notify the Host that Guest has arrived
        socket.to(roomId).emit("user-connected");
        console.log(`User joined room: ${roomId}`);
    });

    // --- SIGNALING (Standard WebRTC) ---
    socket.on("offer", (payload) => io.to(payload.roomId).emit("offer", payload.sdp));
    socket.on("answer", (payload) => io.to(payload.roomId).emit("answer", payload.sdp));
    socket.on("ice-candidate", (payload) => io.to(payload.roomId).emit("ice-candidate", payload.candidate));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
