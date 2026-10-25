const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

const rooms = new Map();

server.on('connection', (ws, req) => {
    // Get PIN from URL (e.g. ?room=189613)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const room = url.searchParams.get('room');

    if (!room) {
        ws.close();
        return;
    }

    // Add phone to the room
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(ws);
    console.log(`Phone joined room: ${room}`);

    ws.on('message', (message) => {
        // Forward the message to everyone else in the same room
        const clients = rooms.get(room);
        if (clients) {
            clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    });

    ws.on('close', () => {
        const clients = rooms.get(room);
        if (clients) {
            clients.delete(ws);
            if (clients.size === 0) rooms.delete(room);
        }
    });
});

console.log("Cloud Sync Server is running...");