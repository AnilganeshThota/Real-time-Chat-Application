// const express = require('express');
// const http = require('http');
// const WebSocket =require('ws');
// const cors = require('cors');

// const app=express();
// app.use(cors());

// const server = http.createServer(app);
// const wss = new WebSocket.Server({server});

// wss.on('connection', (ws) =>{
//     console.log('New client connected');

    // ws.on('message', (message)=>{
    //     console.log(`Received message: ${message}`);

//         wss.clients.forEach((client) =>{
//             if(client.readyState === WebSocket.OPEN){
//                 client.send(message.toString());
//             }
//         });
//     });
//     ws.on('close', () => {
//         console.log('Client disconnected');
//     });
// });

// const PORT = 5000;
// server.listen(PORT, () => {
//     console.log(`Server is listening on port ${PORT}`);
// });

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();
const typingUsers = new Set();
wss.on('connection', (ws) => {
  ws.id = Math.random().toString(36).substring(7);

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
  
    // 🔕 Clean logging
    if (data.type !== 'typing') {
      console.log('Received message:', data);
    }
  
    // 👤 User joins
    if (data.type === 'join') {
      clients.set(ws, data);
      broadcastUsers();
      return;
    }
  
    // ✍️ Typing indicator
    if (data.type === 'typing') {
      // Log typing ONCE
      if (!typingUsers.has(data.username)) {
        console.log(`${data.username} is typing...`);
        typingUsers.add(data.username);
        setTimeout(() => typingUsers.delete(data.username), 1000);
      }
  
      // 👉 Broadcast typing to OTHER users
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
      return;
    }
  
    // 💬 Chat messages
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });
  

  ws.on('close', () => {
    clients.delete(ws);
    broadcastUsers();
  });

  function broadcastUsers() {
    const users = [...clients.values()];
    wss.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'users', users }));
    });
  }
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 WebSocket server running on ${PORT}`)
);
