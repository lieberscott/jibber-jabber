document.addEventListener("DOMContentLoaded", function() {

  const yourVideo = document.getElementById("yourVideo");
  const friendsVideo = document.getElementById("friendsVideo");
  
  // showMyFace();

});

// let room = prompt('Type a room name');
let url = window.location.href;
let room = url.split("https://valley-drug.glitch.me/")[1];
console.log(room);
let id = "";

/* global io */
const socket = io();

const yourId = Math.floor(Math.random()*1000000000);
const servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}]}; //, {'urls': 'turn:numb.viagenie.ca','credential': 'webrtc','username': 'websitebeaver@mail.com'}]};
const pc = new RTCPeerConnection(servers);

pc.onicecandidate = ((event) => {
  console.log("onicecandidate event : ", event);
  return event.candidate ? sendMessage(yourId, JSON.stringify({'ice': event.candidate})) : console.log("Sent All Ice");
});

pc.onaddstream = ((event) => {
  console.log("onaddstream : ", event);
  friendsVideo.srcObject = event.stream;
});

pc.oniceconnectionstatechange = ((e) => {
  if (pc.iceConnectionState == 'disconnected' || pc.connectionState == 'closed' || pc.connectionState == 'closed') {
    friendsVideo.srcObject = null;
    alert("User disconnected");
  }
});

const sendMessage = (senderId, data) => {
  socket.emit('join', { sender: senderId, message: data });
}

socket.on('newconnect', (data) => {
  if (id == "") {
    id = data.id;
  }
  let client = data.client;
  if (client != null && client != id) {
    showFriendsFace();
  }
});

socket.on('join', (data) => {
  console.log("senderId received : ", data);
  readMessage(data);
});

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
    socket.emit('newconnect', room);
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