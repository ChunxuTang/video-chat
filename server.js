// Muaz Khan      - www.MuazKhan.com
// MIT License    - www.WebRTC-Experiment.com/licence
// Documentation  - github.com/muaz-khan/RTCMultiConnection
var isUseHTTPs = false && !(!!process.env.PORT || !!process.env.IP);

var port = process.env.PORT || 9001;

try {
  var _port = require('./config.json').port;

  if (_port && _port.toString() !== '9001') {
    port = parseInt(_port);
  }
} catch (e) {
}

var server = require(isUseHTTPs ? 'https' : 'http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');

function serverHandler(request, response) {
  // try {
  //   fs.readFile('index.html', function (err, data) {
  //     if (err) {
  //       response.writeHead(500, {
  //         'Content-Type': 'text/plain'
  //       });
  //       response.write('404 Not Found: ' + path.join('/', uri) + '\n');
  //       response.end();
  //       return;
  //     }
  //     response.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': data.length});
  //     response.write(data);
  //     response.end();
  //   });
  // } catch (e) {
  //   response.writeHead(404, {
  //     'Content-Type': 'text/plain'
  //   });
  //   response.write('<h1>Unexpected error:</h1><br><br>' + e.stack || e.message || JSON.stringify(e));
  //   response.end();
  // }
  var uri = url.parse(request.url).pathname
      , filename = path.join(process.cwd(), uri);

  console.log(filename);
  console.log(uri);
  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) {
      console.log('directory: ' + filename);
      filename += '/index.html';
    }

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
}

var app;

if (isUseHTTPs) {
  var options = {
    key: fs.readFileSync(path.join(__dirname, 'fake-keys/privatekey.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'fake-keys/certificate.pem'))
  };
  app = server.createServer(options, serverHandler);
} else app = server.createServer(serverHandler);

app = app.listen(port, process.env.IP || '0.0.0.0', function () {
  var addr = app.address();

  if (addr.address === '0.0.0.0') {
    addr.address = 'localhost';
  }

  console.log('Server listening at ' + (isUseHTTPs ? 'https' : 'http') + '://' + addr.address + ':' + addr.port);
});

require('./Signaling-Server.js')(app, function (socket) {
  try {
    var params = socket.handshake.query;

    // "socket" object is totally in your own hands!
    // do whatever you want!

    // in your HTML page, you can access socket as following:
    // connection.socketCustomEvent = 'custom-message';
    // var socket = connection.getSocket();
    // socket.emit(connection.socketCustomEvent, { test: true });

    if (!params.socketCustomEvent) {
      params.socketCustomEvent = 'custom-message';
    }

    socket.on(params.socketCustomEvent, function (message) {
      try {
        socket.broadcast.emit(params.socketCustomEvent, message);
      } catch (e) {
      }
    });
  } catch (e) {
  }
});
