// Reference:
// Pro Javascript Development: Coding, Capabilities, and Tooling by Den Odell.


// Define a "class" that can be used to create a peer-to-peer video chat in the browser.
var VideoChat = (function (Firebase) {

  // The PeerConnection "class" allows the configuration of a peer to peer connection
  // between the current web page running on this device and the same running on another,
  // allowing the addition of data streams to be passed from one to another, allowing for
  // video chat-style appliations to be built
  var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

  // The RTCSessionDescription "class" works together with the RTCPeerConnection to
  // initialize the peer to peer data stream using the Session Description Protocol (SDP)
  var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;

  // The IceCandidate "class" allows instances of peer to peer "candidates" to be created
  // - a candidate provides the details of the connection directly to our calling
  // partner, allowing the two browsers to chat
  var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

  // Define the two types of participant in a call, the person who initiated it and the
  // person who responded
  var _participantType = {
    INITIATOR: "initiator",
    RESPONDER: "responder"
  };

  // Define an object containing the settings we will use to create our PeerConnection
  // object, allowing the two participants in the chat to locate each other's IP
  // addresses over the internet
  var _peerConnectionSettings = {
    server: {
      iceServers: [{
        // Mozilla's public STUN server
        url: "stun:23.21.150.121"
      }, {
        // Google's public STUN server
        url: "stun:stun.l.google.com:19302"
      }]
    },
    // For interoperability between different browser manufacturers' code, we set
    // this DTLS/SRTP property to "true" as it is "true" by default in Firefox
    options: {
      optional: [{
        DtlsSrtpKeyAgreement: true
      }]
    }
  };

  navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia ||
      navigator.webkitGetUserMedia || navigator.msGetUserMedia;

  if (!navigator.getUserMedia && !window.RTCPeerConnection) {
    throw new Error("Your browser does not support video chat");
  }

  // Define a generic error handler function which will throw an error in the browser
  function onError(error) {
    throw new Error(error);
  }

  // Define the VideoChat "class" to use to create a new video chat on a web page
  function VideoChat(options) {
    options = options || {};
    // Allow two callback functions, onLocalStream() and onRemoteStream() to be passed in.
    // The former is executed once a connection has been made to the local webcam and
    // microphone, and the latter is executed once a connection has been made to the remote
    // user's webcam and microphone. Both pass along a stream URL which can be used to
    // display the contents of the stream inside a <video> tag within the HTML page
    if (typeof options.onLocalStream === "function") {
      this.onLocalStream = options.onLocalStream;
    }
    if (typeof options.onRemoteStream === "function") {
      this.onRemoteStream = options.onRemoteStream;
    }
    // Initialize Firebase data storage using the provided URL
    this.initializeDatabase(options.firebaseUrl || "");
    // Set up the peer-to-peer connection for streaming video and audio between two devices
    this.setupPeerConnection();
  }

  VideoChat.prototype = {
    participantType: _participantType.INITIATOR,
    remoteParticipantType: _participantType.RESPONDER,
    chatRoomName: "",
    database: null,
    // Define a method to be called when a local data stream has been initiated
    onLocalStream: function () {
    },
    // Define a method to be called when a remote data stream has been connected
    onRemoteStream: function () {
    },
    // Define a method to initialize the Firebase database
    initializeDatabase: function (firebaseUrl) {
      // Connect to our Firebase database using the provided URL
      var firebase = new Firebase(firebaseUrl);
      this.database = firebase.child("chatRooms");
    },
    // Define a method to save a given name-value pair to Firebase, stored against the
    // chat room name given for this call
    saveData: function (chatRoomName, name, value) {
      if (this.database) {
        this.database.child(chatRoomName).child(name).set(value);
      }
    },
    // Define a method to load stored data from Firebase by its name and chat room name,
    // executing a callback function when that data is found - the connection will wait
    // until that data is found, even if it is generated at a later time
    loadData: function (chatRoomName, name, callback) {
      if (this.database) {
        this.database.child(chatRoomName).child(name).on("value", function (data) {
          var value = data.val();
          if (value && typeof callback === "function") {
            callback(value);
          }
        });
      }
    },
    // Define a method to set up a peer-to-peer connection between two devices and stream
    // data between the two
    setupPeerConnection: function () {
      var that = this;
      this.peerConnection = new PeerConnection(_peerConnectionSettings.server,
          _peerConnectionSettings.options);
      this.peerConnection.onaddstream = function (event) {
        var streamURL = window.URL.createObjectURL(event.stream);
        that.onRemoteStream(streamURL);
      };
      this.peerConnection.onicecandidate = function (event) {
        if (event.candidate) {
          that.peerConnection.onicecandidate = null;
          that.loadData(that.chatRoomName, "candidate:" + that.remoteParticipantType,
              function (candidate) {
                that.peerConnection.addIceCandidate(new
                    IceCandidate(JSON.parse(candidate)));
              });
          that.saveData(that.chatRoomName, "candidate:" + that.participantType, JSON.stringify(event.candidate));
        }
      };
    },
    // Define a method to get the local device's webcam and microphone stream and handle
    // the handshake between the local device and the remote party's device to set up the
    // video chat call
    call: function () {
      var that = this,
          _constraints = {
            mandatory: {
              OfferToReceiveAudio: true,
              OfferToReceiveVideo: true
            }
          };
      navigator.getUserMedia({
        video: true,
        audio: true
      }, function (stream) {
        that.peerConnection.addStream(stream);
        that.onLocalStream(window.URL.createObjectURL(stream));

        // If we are the initiator of the call, we create an offer to any connected
        // peer to join our video chat
        if (that.participantType === _participantType.INITIATOR) {
          that.peerConnection.createOffer(function (offer) {
            that.peerConnection.setLocalDescription(offer);
            that.saveData(that.chatRoomName, "offer", JSON.stringify(offer));
            that.loadData(that.chatRoomName, "answer", function (answer) {
              that.peerConnection.setRemoteDescription(
                  new SessionDescription(JSON.parse(answer))
              );
            });
          }, onError, _constraints);
        } else {
          // If we are the one joining an existing call, we answer an offer to set up
          // a peer-to-peer connection

          that.loadData(that.chatRoomName, "offer", function (offer) {
            that.peerConnection.setRemoteDescription(
                new SessionDescription(JSON.parse(offer))
            );
            that.peerConnection.createAnswer(function (answer) {
              that.peerConnection.setLocalDescription(answer);
              that.saveData(that.chatRoomName, "answer", JSON.stringify(answer));
            }, onError, _constraints);
          });
        }
      }, onError);
    },

    // Define a method which initiates a video chat call, returning the generated chat
    // room name which can then be given to the remote user to use to connect to
    startCall: function () {
      var randomNumber = Math.round(Math.random() * 999);
      if (randomNumber < 10) {
        randomNumber = "00" + randomNumber;
      } else if (randomNumber < 100) {
        randomNumber = "0" + randomNumber;
      }

      this.chatRoomName = "room-" + randomNumber;
      this.call();

      return this.chatRoomName;
    },

    // Define a method to join an existing video chat call using a specific room name
    joinCall: function (chatRoomName) {
      this.chatRoomName = chatRoomName;
      this.participantType = _participantType.RESPONDER;
      this.remoteParticipantType = _participantType.INITIATOR;
      this.call();
    }
  };

  // Return the VideoChat "class" for use throughout the rest of the code
  return VideoChat;
}(Firebase));