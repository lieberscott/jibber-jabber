const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/chat.html');
});

// listen for requests :)
http.listen(process.env.PORT || 3000);

io.on('connection', (socket) => {

  socket.on('newconnect', (room) => {
    console.log(room);
    
    io.in(room).clients((err, clients) => {
      if (err) {
        throw err;
        return;
      }
      
      if (clients.length >= 2) {
        socket.emit('errorMsg');
        return;
      }
      
      else if (clients.length < 2) {
        let x = socket.join(room);
        let id = x.id; // new socket.io ID
        let client = clients[0]; // first person in room's socket.io id, or null if first person just joined room
        console.log(id);
        console.log(client);
        io.in(room).emit('newconnect', { id, client }); // will either be { NUMBER2, null } or { NUMBER2, NUMBER1 }
      }

    });
    
  });
  
  socket.on('join', (val) => {
    io.emit('join', { val });
  });

});