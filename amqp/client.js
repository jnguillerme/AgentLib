var Utils = require ('../utils');
var Amqp = require('amqplib');
var When = require('when');
var Defer = require('when').defer;
var AmqpChannel = require('../amqp/channel');
var Logger = require('../Logger');

/**
 * This class will handle all interactions with Amqp broker
 * It relies on Amqp client npm/amqpLib
 * @class AmqpClient
 * @constructor
 */
function AmqpClient() {
	this.config = null;
	this.channel = null;
	this.connection = null;
	this.sendChannel = null;
};

/**
 * Initialize Amqp Client from a json configuration object
 * @method init
 * @param {String} _config: json configuration object
 * @return 
 */
AmqpClient.prototype.init = function(_config) {
	Utils.assertValueIsSet(_config, '[AmqpClient][Init] Config is missing');
	this.config = _config;
	
	this.onMessageReceived = null;
	
	this.sendChannel = new AmqpChannel();
	this.sendChannel.init(_config.send);
	
	return;
};
/**
 * Connect to Amqp Broker 
 * @method open
 * @return (Defer) A promise that is resolved once the connection is successfull, 
 *			or rejected if the connection failed
 */
AmqpClient.prototype.open = function() {
	var opened = Defer();
	var self = this;
	var host = Utils.getValue(this.config.host, 'localhost');
	var port = Utils.getValue(this.config.port, '5672');	
	
	Logger.info("%s:'%s'", host, port, {module: "AmqpClient", function:"open"});
	
	Amqp.connect('amqp://' + host + ':' + port)
		.then( function(_cnx) {
			self.connection = _cnx;
			return When(_cnx.createChannel()
				.then(	function(_c) {
					self.channel = _c;	
					self.createConsumers(_c).then	( function()	{ opened.resolve(); })
										 	.catch	( function(e) 	{ opened.reject(new Error('CreateConsumers failed: ' + e.message));
											})
					}).catch(function(e)  { opened.reject(new Error('CreateChannel failed: ' + e.message));
				}));
		}).catch( function(e) {
			opened.reject(new Error('AMQP Connect failed: ' + e.message));
		});
		
	return opened.promise;	
};
/**
 * Disconnect from Amqp Broker 
 * @method close
 * @return 
 */
AmqpClient.prototype.close = function() {
	if (this.channel != null) {
		this.channel.close();
	}
	if (this.connection != null) {
		this.connection.close();
	}
	
	return;
}
/**
 * Register callback function to be called whenever a subscribe message is received 
 * @method registerOnMessageReceived
 * @param {String} _callback: callback function 
 * @return 
 */ 
AmqpClient.prototype.registerOnMessageReceived = function(_callback) {
	console.log('registerOnMessageReceived');
	this.onMessageReceived = _callback;	
};

/**
 * Create all Amqp Broker consumers as defined in the config json file
 * @method createConsumers
 * @return (Defer) A promise that is resolved once the consumers have been successfully created, 
 *			or rejected if any of the consumers failed to create
 */
AmqpClient.prototype.createConsumers = function(_channel) {
	var created = [];
	
	for (var i = 0; i < this.config.receive.length; i++) {
		created.push(this.addConsumer(_channel, this.config.receive[i]))
	};
	return When.all(created);
}

/**
 * Add a single Amqp Broker consumer
 * @method addConsumer
 * @return (Defer) A promise that is resolved once the consumers have been successfully created, 
 *			or rejected if any of the consumers failed to create
 */
AmqpClient.prototype.addConsumer = function(_channel, _consumerConfig) {
	var consumerCreated =  Defer();
	var self = this;

	Logger.info('Creating consumer: exchange=%s, exchangeType=%s', _consumerConfig.exchange, _consumerConfig.exchangeType, {module: "AmqpClient", function:"addConsumer"});
		
	var ok = _channel.assertExchange(_consumerConfig.exchange, _consumerConfig.exchangeType);
    ok = ok.then(function() {
		return _channel.assertQueue(_consumerConfig.queue, {exclusive: Utils.getBooleanValue(_consumerConfig.exclusive, false)});
	}).catch(function(e) {
		consumerCreated.reject(new Error('AMQP create consumer failed: [assertExchange] : ' + e.message));
	});
    
	ok = ok.then(function(qok) {
		var queue = qok.queue;
		return _channel.bindQueue(queue, _consumerConfig.exchange, _consumerConfig.routingKey)
			.then(function() { return queue; });
	}).catch(function(e) {
		consumerCreated.reject(new Error('AMQP create consumer failed : [assertQueue] : ' + e.message));
	});
    
	ok = ok.then(function(queue) {
		return _channel.consume(queue, consumeMessage, {noAck: true})
	}).catch(function(e) {
		consumerCreated.reject(new Error('AMQP create consumer failed : [bindQueue] : ' + e.message));
	});
    
	ok.then(function() {
		consumerCreated.resolve(); 
	}).catch(function(e) {
		consumerCreated.reject(new Error('AMQP create consumer failed: [consume] : ' + e.message));
	});
    	
	// Message handler - Called whenever a subscribe message is received. 
	// Will forward the message to the function registered by the agent if any
	// If no function is registered, will log the message as a warning 
	// Define as an internal function do to "this" scope	
	function consumeMessage(_msg) {
		if (Utils.valueIsSet(self.onMessageReceived) ) {
			self.onMessageReceived(_msg.fields.routingKey, _msg.content.toString());
		} else {
			Logger.warn("Message received but no messageReceived handler has been registered %s:%s", _msg.fields.routingKey, _msg.content.toString(), {module: "AmqpClient", function:"consumeMessage"});
		}
	}
		
	return consumerCreated.promise;
}
/**
 * Publish a message to Amqp Broker 
 * @method publish
 * @return (Defer) A promise that is resolved once the message has been successfully published, 
 *			or rejected if it failed to publish
 */
AmqpClient.prototype.publish = function(_msg) {
	var published = Defer();
	var self = this;
	Utils.assertValueIsSet(this.channel, 'Invalid channel', 'AmqpClient', 'publish' );
	
	this.channel.assertExchange(this.sendChannel.exchange, this.sendChannel.exchangeType)
		.then(function() {
			if (self.channel.publish(self.sendChannel.exchange, self.sendChannel.routingKey, new Buffer(_msg)) ) {
				Logger.info("%s:'%s'", self.sendChannel.routingKey, _msg, {module: "AmqpClient", function:"publish"});
				published.resolve();
			} else {
				Logger.info("Publish failed %s:'%s'", self.sendChannel.routingKey, _msg, {module: "AmqpClient", function:"publish"});
				published.reject(new Error('AmqpClient publish failed'));
			}
			})
		.catch( function(e) {
			published.reject(new Error('AMQP publish failed: ' + e.message));
		});
	return published.promise;
};

module.exports = AmqpClient;
