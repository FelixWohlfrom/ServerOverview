/**
 * This module handles the server stati in our tool
 */
var self = {
    /**
     * reads server overview and sends it to the given socket.
     * If socket is undefined, nothing will be sent.
     */
    readOverviewAndSend: function(_server, _socket) {
        var request = require('request');

        var url = 'http://' + _server.host + ':' + _server.port + '/overview';

        request({
            url: url,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                _server.status = body;
                _socket.emit('overview', _server);
                
            } else if (!error) {
                _server.status = {
                        status: 'online',
                        message: 'Host available, but wrong server running',
                        details: response
                    };
                _socket.emit('overview', _server);
                
            } else {
                var ping = require('ping');
                ping.sys.probe(_server.host, function(isAlive) {
                    var status = {};
                    
                    if (isAlive) {
                        status = {
                            status: 'online',
                            message: 'Host available, but status server offline',
                            details: error
                        };
                    } else {
                        status = {
                            status: 'offline',
                            message: 'Host not available',
                            details: error
                        };
                    }
                    
                    _server.status = status;
                    _socket.emit('overview', _server);
                });
            }
        });
    },
    
    /**
     * reads server details and sends it to the given socket.
     * If socket is undefined, nothing will be sent.
     */
    readDetailsAndSend: function(_server, _socket) {
        var request = require('request');

        var url = 'http://' + _server.host + ':' + _server.port + '/details';

        request({
            url: url,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                _server.status = body;
                _socket.emit('details', _server);
            } else {
                _socket.emit('details', 'Error while reading details');
            }
        });
    },
    
    /**
     * Initialize the listeners
     */
    initServerStatus: function(_socket, _servers) {
        _socket.emit('serverCount', _servers.length);
        
        _socket.on('getOverview', function() {
            _servers.forEach(function(_server) {
                self.readOverviewAndSend(_server, _socket);
            });
        });
        
        _socket.on('getDetails', function(host) {
            _servers.forEach(function(_server) {
                if (_server.host === host) {
                    self.readDetailsAndSend(_server, _socket);
                }
            });
        });
    }
};

module.exports = self;
