const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

// Serve the index.html file when users open the site
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Socket.io Connection Logic
io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        // Notify others in the room
        socket.broadcast.to(roomId).emit("user-connected");

        // WebRTC Signaling
        socket.on("offer", (payload) => {
            io.to(roomId).emit("offer", payload);
        });

        socket.on("answer", (payload) => {
            io.to(roomId).emit("answer", payload);
        });

        socket.on("ice-candidate", (incoming) => {
            io.to(roomId).emit("ice-candidate", incoming);
        });
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

