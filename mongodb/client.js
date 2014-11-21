var Utils = require ('../utils');
var Mongodb = require('mongoose');
var When = require('when');
var Defer = require('when').defer;
var Logger = require('../Logger');

/**
 * This class will handle all interactions with Mongodb database
 * It relies on mongodb client npm/mongoose
 * @class MongodbClient
 * @constructor
 */
function MongodbClient() {
	this.host = null;
	this.connection = null;
}

/**
 * Initialize Mongodb Client from a json configuration object
 * @method init
 * @param {String} _config: json configuration object
 * @return 
 */
MongodbClient.prototype.init= function(_config) {
	Utils.assertValueIsSet(_config, 'Config is missing', 'MongodbClient', 'init');
	Utils.assertValueIsSet(_config.host, 'Mongodb host is missing', 'MongodbClient', 'init');

	this.host = _config.host;	
	
	return;
};

/**
 * Connect to Mongodb Broker 
 * @method open
 * @return (Defer) A promise that is resolved once the connection is successfull, 
 *			or rejected if the connection failed
 */
MongodbClient.prototype.open = function() {
	var open = Defer();
	var self = this;
	
	Logger.info('Connecting to MongoDb on %s ', this.host, {module: "MongodbClient=", function:"mongodbOpen"});		
		
	Mongodb.connect(this.host);
	
	this.connection = Mongodb.connection;
	
	this.connection.on('error', function(e) { open.reject(new Error('Mongodb Connect failed: ' + e.message)); } );	
	this.connection.once('open', function() { open.resolve(); });	
	
	return open.promise;
};

/**
 * Disconnect to Amqp Broker 
 * @method close
 * @return 
 */
MongodbClient.prototype.close= function() {
	if (this.connection != null && this.connection != undefined) {
		this.connection.close();
	}
};
module.exports = MongodbClient;
