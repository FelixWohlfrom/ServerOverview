/**
 * The main server file
 */
var config = require('./config.js');
var servers = config.servers;

var express = require('express');
var path = require('path');
var logger = require('morgan');

var server = express();

// handles the status updates
var status_reader = require('./status_reader');

// all environments
server.set('port', config.server.port);
server.set('views', __dirname + '/views');
server.set('view engine', 'jade');
server.use(logger('dev'));
server.use(express.static(path.join(__dirname, 'public')));

// We just have an index page, therefore we register here the 
// handler for this page
server.get('/', function (req, res) {
    res.render('index');
});

// here we do some fancy stuff.
// we combine socket.io with the default nodejs server component
var io = require('socket.io')(server.listen(server.get('port'), function() {
    console.log('Server is up and running');
}));

io.sockets.on('connection', function(socket) {
    status_reader.initServerStatus(socket, config.servers);
});

// Start the update timer
setInterval(function() {
    servers.forEach(function(_server) {
        status_reader.readOverviewAndSend(_server, io);
    });
    servers = config.servers;
}, config.server.status_update_interval);

// Reload server configuration
setInterval(function() {
    delete require.cache[require.resolve('./config.js')];
    config = require('./config.js');
}, config.server.config_refresh_time);
