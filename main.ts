const rooms = new Map();

Deno.serve((req) => {
  const url = new URL(req.url);
  
  if (req.headers.get("upgrade") != "websocket") {
    return new Response("Cloud Sync Server is Online!");
  }

  const room = url.searchParams.get("room");
  if (!room) return new Response("Missing room PIN", { status: 400 });

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  socket.onopen = () => {
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(socket);
    console.log(`Phone joined room: ${room}`);
  };

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

  socket.onclose = () => {
    const clients = rooms.get(room);
    if (clients) {
      clients.delete(socket);
      if (clients.size === 0) rooms.delete(room);
    }
  };

  return response;
});
