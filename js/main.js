/**
 * Created by chunxu on 7/4/16.
 */


function drag_start(event) {
  var style = window.getComputedStyle(event.target, null);
  event.dataTransfer.setData("text/plain",
      (parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - event.clientY));
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

var dm = document.getElementById('local-video');
dm.addEventListener('dragstart', drag_start, false);
var remoteVideo = document.getElementById('remote-video');
remoteVideo.addEventListener('dragover', drag_over, false);
remoteVideo.addEventListener('drop', drop, false);


// Get a reference to the <video id="local-video"> element on the page
var localVideoElement = document.getElementById("local-video"),
// Get a reference to the <video id="remote-video"> element on the page
    remoteVideoElement = document.getElementById("remote-video"),
// Get a reference to the <button id="start-call"> element on the page
    startCallButton = document.getElementById("start-call"),
// Get a reference to the <button id="join-call"> element on the page
    joinCallButton = document.getElementById("join-call"),
// Get a reference to the <p id="room-name"> element on the page
    roomNameElement = document.getElementById("room-name"),
// Create an instance of the Video Chat "class"
    videoChat = new VideoChat({
// The Firebase database URL for use when loading and saving data to the cloud - create
// your own personal URL at http://firebase.com
      firebaseUrl: "https://webrtc-video-chat.firebaseio.com/",
// When the local webcam and microphone stream is running, set the "src" attribute
// of the <div id="local-video"> element to display the stream on the page
      onLocalStream: function (streamSrc) {
        localVideoElement.src = streamSrc;
      },
// When the remote webcam and microphone stream is running, set the "src" attribute
// of the <div id="remote-video"> element to display the stream on the page
      onRemoteStream: function (streamSrc) {
        remoteVideoElement.src = streamSrc;
      }
    });
// When the <button id="start-call"> button is clicked, start a new video call and
// display the generated room name on the page for providing to the remote user
startCallButton.addEventListener("click", function () {
// Start the call and get the chat room name
  var roomName = videoChat.startCall();
// Display the chat room name on the page
  roomNameElement.innerHTML = "Created call with room name: " + roomName;
}, false);
// When the <button id="join-call"> button is clicked, join an existing call by
// entering the room name to join at the prompt
joinCallButton.addEventListener("click", function () {// Ask the user for the chat room name to join

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
      console.log(roomName);
      if (!roomName) return;

      // Join the chat by the provided room name - as long as this room name matches the
// other, the two will be connected over a peer-to-peer connection and video streaming
// will take place between the two
      videoChat.joinCall(roomName);
// Display the room name on the page
      roomNameElement.innerHTML = "Joined call with room name: " + roomName;
    }
  });

}, false);