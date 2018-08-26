document.addEventListener("DOMContentLoaded", () => { // launches upon page load

  const yourVideo = document.getElementById("yourVideo");
  const friendsVideo = document.getElementById("friendsVideo");
  
  socket.emit('newconnect', room);

});

/* global io */
const socket = io();

let url = window.location.href;
let room = url.split("https://sudden-spring.glitch.me/")[1];
let id = ""; // socket.io client id

let yourId = Math.floor(Math.random()*1000000000);
const servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}]};
let pc = new RTCPeerConnection(servers);

pc.onicecandidate = ((event) => {
  return event.candidate ? sendMessage(yourId, JSON.stringify({'ice': event.candidate})) : console.log("Sent All Ice");
});

pc.onaddstream = ((event) => {
  friendsVideo.srcObject = event.stream;
});

pc.oniceconnectionstatechange = ((e) => {
  if (pc.iceConnectionState == 'disconnected' || pc.iceConnectionState == 'closed' || pc.iceConnectionState == 'failed') {
    friendsVideo.srcObject = null;
    alert("User disconnected");
  }
});

socket.on('newconnect', (data) => {
  if (id == "") {
    id = data.id;
    showMyFace();
  }
  let client = data.client;
  if (client != null && client != id) {
    socket.emit('showFriendsFace', room);
  }
});

socket.on('errorMsg', () => {
  tryNewRoom();
});

socket.on('join', (data) => {
  readMessage(data);
});

socket.on('showFriendsFace', () => {
  showFriendsFace();
});

const sendMessage = (senderId, data) => {
  socket.emit('join', { sender: senderId, message: data, room: room });
}

const readMessage = (data) => {
  let msg = JSON.parse(data.val.message);
  let sender = data.val.sender;
  if (sender != yourId) {
    if (msg.ice != undefined) {
      pc.addIceCandidate(new RTCIceCandidate(msg.ice));
    }
    else if (msg.sdp.type == "offer") {
      pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
      .then(() => pc.createAnswer())
      .then(answer => pc.setLocalDescription(answer))
      .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})));
    }
    else if (msg.sdp.type == "answer") {
      pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
  }
};

const showMyFace = () => {
  navigator.mediaDevices.getUserMedia({audio:true, video:true})
  .then((s) => yourVideo.srcObject = s)
  .then((stream) => {
    pc.addStream(stream);
  })
  .catch((err) => console.log(err));
}

const showFriendsFace = () => {
  pc.createOffer()
  .then((offer) => {
    pc.setLocalDescription(offer)
  })
  .then(() => {
    sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription}))
  });
}

const tryNewRoom = () => {
  alert("Room is full. You will be redirected to home page.");
  location = "/";
}

const newRoom = () => {
  let room = prompt("Enter a new room");
  location = "/" + room;
}