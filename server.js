const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/:room', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
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
      
      if (clients.len >= 2) {
        socket.emit('errorMessage',"Could not join room. It's full!");
        return;
      }
      
      let x = socket.join(room);
      let id = x.id;
      let client = clients[0];
      console.log(clients);
      
      if (clients.len == 0) { // first person in room, so don't execute showFriendsFace() on client side
        io.in(room).emit('newconnect', { id, client });
      }
      
      else { // second person in room, so do initiate showFriendsFace() on client side
        io.in(room).emit('newconnect', { id, client });
      }
      
    });
    
  });

  socket.on('delete symbol', (symbol) => {
    io.emit('delete symbol', { symbol });
  });
  
  socket.on('join', (val) => {
    io.emit('join', { val });
  });

});