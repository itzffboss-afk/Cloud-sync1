const rooms = new Map();

Deno.serve((req) => {
  const url = new URL(req.url);
  
  // 1. Normal browser check
  if (req.headers.get("upgrade") != "websocket") {
    return new Response("Cloud Sync Server is running perfectly!");
  }

  // 2. Get the PIN (Room)
  const room = url.searchParams.get("room");
  if (!room) return new Response("Missing room PIN", { status: 400 });

  // 3. Upgrade to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  socket.onopen = () => {
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(socket);
    console.log(`Phone joined room: ${room}`);
  };

  // 4. Forward messages
  socket.onmessage = (e) => {
    const clients = rooms.get(room);
    if (clients) {
      clients.forEach((client) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(e.data);
        }
      });
    }
  };

  // 5. Cleanup on disconnect
  socket.onclose = () => {
    const clients = rooms.get(room);
    if (clients) {
      clients.delete(socket);
      if (clients.size === 0) rooms.delete(room);
    }
  };

  return response;
});
