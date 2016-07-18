// Reference:
// Pro Javascript Development: Coding, Capabilities, and Tooling by Den Odell.


var localVideoElement = document.getElementById("local-video");
var remoteVideoElement = document.getElementById("remote-video");
var startCallButton = document.getElementById("start-call");
var joinCallButton = document.getElementById("join-call");
var roomNameElement = document.getElementById("room-name");
    videoChat = new VideoChat({
      firebaseUrl: "https://webrtc-video-chat.firebaseio.com/",
      onLocalStream: function (streamSrc) {
        localVideoElement.src = streamSrc;
      },
      onRemoteStream: function (streamSrc) {
        remoteVideoElement.src = streamSrc;
      }
    });

startCallButton.addEventListener("click", function () {
  var roomName = videoChat.startCall();
  roomNameElement.innerHTML = "Created call with room name: " + roomName;
}, false);

joinCallButton.addEventListener("click", function () {
  // Ask the user for the chat room name to join

  vex.dialog.open({
    message: 'Please input the room name:',
    input: "<input style=\"width: 400px;\" name=\"roomname\" type=\"text\" placeholder=\"Room name\" required />",
    buttons: [
      $.extend({}, vex.dialog.buttons.YES, {
        text: 'OK'
      }), $.extend({}, vex.dialog.buttons.NO, {
        text: 'Cancel'
      })
    ],
    callback: function(value) {
      var roomName = value.roomname;
      if (!roomName) return;

      videoChat.joinCall(roomName);

      roomNameElement.innerHTML = "Joined call with room name: " + roomName;
    }
  });

}, false);


function drag_start(event) {
  var style = window.getComputedStyle(event.target, null);
  event.dataTransfer.setData("text/plain",
      (parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' +
      (parseInt(style.getPropertyValue("top"),10) - event.clientY));
}

function drag_over(event) {
  event.preventDefault();
  return false;
}

function drop(event) {
  var offset = event.dataTransfer.getData("text/plain").split(',');
  var dm = document.getElementById('local-video');
  dm.style.left = (event.clientX + parseInt(offset[0],10)) + 'px';
  dm.style.top = (event.clientY + parseInt(offset[1],10)) + 'px';
  event.preventDefault();
  return false;
}

// Add drag and drop functionality on local video element, and permit it
// to move in scope of remove video.
localVideoElement.addEventListener('dragstart', drag_start, false);
remoteVideoElement.addEventListener('dragover', drag_over, false);
remoteVideoElement.addEventListener('drop', drop, false);