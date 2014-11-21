var Utils = require ('../utils');
var Mqtt = require('mqtt');
var When = require('when');
var Defer = require('when').defer;
var Logger = require('../Logger');
var MqttConfig = require('../mqtt/config');

/**
 * This class will handle all interactions with Mqtt broker
 * It relies on Mqtt client npm/mqttLib
 * @class AmqpClient
 * @constructor
 */
function MqttClient() {
	this.config = null;
	this.client = null;
};

/**
 * Initialize Mqtt Client from a json configuration object
 * @method init
 * @param {String} _config: json configuration object
 * @return 
 */
MqttClient.prototype.init = function(_config) {
	Utils.assertValueIsSet(_config, '[AmqpClient][Init] Config is missing');
		
	this.config = new MqttConfig();
	this.config.init(_config);
	
	return;
};

/**
 * Connect to Mqtt Broker 
 * @method open
 * @return (Defer) A promise that is resolved once the connection is successfull, 
 *			or rejected if the connection failed
 */
MqttClient.prototype.open = function() {
	var opened = Defer();

	Logger.info("Connecting to Mqtt broker %s:'%s' with options %s", this.config.brokerHost, this.config.brokerPort, this.config.getOptions(), {module: "MqttClient", function:"open"});	
	
	this.client = Mqtt.createClient(this.config.brokerPort, this.config.brokerHost, this.config.options);
	this.client.on('connect', function() { opened.resolve(); });
	this.client.on('error', function(e)  { opened.reject(new Error('Mqtt open failed: ' + e.message)); });
	
	
	for (var i = 0; i < this.config.topicSubscribe.length; i++) {
		Logger.info("Subscribing to <" + this.config.topicSubscribe[i] + ">", {module: "MqttClient", function:"open"});
		this.client.subscribe(this.config.topicSubscribe[i]);		
	}

	return opened.promise;
};

/**
 * Disconnect from Mqtt Broker 
 * @method close
 * @return 
 */
MqttClient.prototype.close= function() {
	if (this.client != null) {
		this.client.end();
	}
	
	return;
};

/**
 * Publish message on  Mqtt Broker 
 * @method mqttPublish
  * @param {String} _msg: Message to publish
 *  @return (Defer) A promise that is resolved once the message has been successfully published, 
 *			or rejected if it failed to publish
 */
 MqttClient.prototype.publish = function(_msg) {
 	 Logger.info("%s:'%s'", this.config.publish.topic, _msg, {module: "MqttClient", function:"publish"});
	
 	var published = Defer();
	
	Utils.assertValueIsSet(this.config.publish.topic);
	Utils.assertValueIsSet(this.config.publish.qos);
	
	this.client.publish(this.config.publish.topic, _msg, {qos: this.config.publish.qos}, function(e) {
		if (!Utils.valueIsSet(e)) { published.resolve(); } 
		else { published.reject(e); } 
	});
	
	return published.promise;
};
/**
 * Register callback function to be called whenever a subscribe message is received 
 * @method registerOnMessageReceived
 * @param {String} _callback: callback function 
 * @return 
 */ 
MqttClient.prototype.registerOnMessageReceived = function(_callback) {
	this.client.on('message', (function(t, m) { _callback(t, m); }));
};
	
/**
 * mqttPublish 
 * Publish a message on the mqtt broker 
 */
 /*
Agent.prototype.mqttSubscribe= function(topic) {
	if (this.mqttClient != null) {
		this.mqttClient.subscribe(topic);
	}
};*/
module.exports = MqttClient;
