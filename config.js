/**
 * Configures the status overview server
 */
// init
var config = {};

config.server = {};

// the port in which this server should run. default 8080
config.server.port = process.env.PORT || 8080;

// server config refresh time in ms. default 60000
config.server.config_refresh_time = 60000;

// the server status update interval in ms. default 5000
config.server.status_update_interval = 5000;

// a list of servers to read the status from.
// each server contains a 'host' and a 'port'
config.servers = [
	{ 'host': 'localhost', 'port': 5000 },
        { 'host': '127.0.0.1', 'port': 5000 }
];

module.exports = config;
