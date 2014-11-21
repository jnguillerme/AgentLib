var config = {};
var Utils = require ('./utils');
var Defer = require('when').defer;
var When = require('when');
var Logger = require('./Logger');

/**
 * This class defines the common behavior to all Agents
 * Depending on their configurations, agent may interact with different transports:
 * 		AMQP broker
 *		MQTT broker
 *		Mongodb
 * 		ACS
 *
 * @class Agent
 * @constructor
 */
function Agent() {
	this.amqpClient = null;
	this.onAmqpMessage = null;
	
	this.mqttClient = null;	
	this.onMqttMessage = null;

	this.mongodbClient = null;

	this.acs = null;		
};

/**
 * Initialize Agent from a json configuration object
 * Based on the configuration file, corresponding transports will be created and initialized 
 * @method init
 * @param {String} _config: json configuration object
 * @return 
 */
Agent.prototype.init = function(_config) {
	Logger.init(_config);
	if ( Utils.valueIsSet(_config.amqp) ) {
		this.initAmqp(_config.amqp);
	}
	
	if (Utils.valueIsSet(_config.mongodb) ) {
		this.initMongodb(_config.mongodb);
	}

	if ( Utils.valueIsSet(_config.mqtt) ) {
		this.initMqtt(_config.mqtt);
	}
	
	return;
}

/**
 * Initialize Amqp client from a json configuration object
 * @method initAmqp
 * @param {String} _config: json configuration object
 * @return 
 */
Agent.prototype.initAmqp = function(configAmqp) {
	Logger.info('', {module: "Agent", function:"initAmqp"});
	Amqp = require('./amqp/client');
	this.amqpClient = new Amqp();
	this.amqpClient.init(configAmqp);
	
	return;
}

/**
 * Initialize Mqtt client from a json configuration object
 * @method initMqtt
 * @param {String} _config: json configuration object
 * @return 
 */
Agent.prototype.initMqtt = function(_configMqtt) {
	Logger.info('', {module: "Agent", function:"initMqtt"});
	Mqtt = require('./mqtt/client');
	this.mqttClient = new Mqtt();
	this.mqttClient.init(_configMqtt);
	
	return;
};

/**
 * Initialize Mongodb client from a json configuration object
 * @method initMongodb
 * @param {String} _config: json configuration object
 * @return 
 */
Agent.prototype.initMongodb = function(configMongodb) {
	Logger.info('', {module: "Agent", function:"initMongodb"});
	Mongodb = require('./mongodb/client');
	this.mongodbClient = new Mongodb();
	this.mongodbClient.init(configMongodb);
	
	return;
};

/**
 * Initialize ACS client from a json configuration object
 * @method initAmqp
 * @param {String} _config: json configuration object
 * @return 
 */
Agent.prototype.initACS = function(configAcs) {
	config.acs = configAcs;

	Logger.info('config.acs.active = ' + config.acs.active, {module: "Agent", function:"initACS"});		

	if (config.acs.active == "yes") {
		Acs = require('./acs');
		this.acs = new Acs(config.acs.login, config.acs.password);
	}
	
	return;
};

/**
 * Start Agent. Will connect to all transports that have been configured
 * @method start
 * @return (Defer) A promise that is resolved once the agent is successfully connected to all configured transports
 *                or fail if the connection to any of the transports fails
 */
Agent.prototype.start = function() {
	Logger.info("starting...", {module: "Agent", function:"start"});
	
	var started = [];	

	//
	// connect to AMQP if configured
	//
	if (this.amqpClient != null) {
		var amqpStarted = Defer();
		started.push(amqpStarted.promise);
		this.amqpClient.open()
					   .then( function()  { 
							Logger.info('Connected to Amqp', {module: "Agent", function:"start"}); amqpStarted.resolve();
						}).catch( function(e) { 
							amqpStarted.reject(e); 
						});
	} else {
		Logger.info('No amqp client set', {module: "Agent", function:"start"});
	}
	
	//
	// connect to Mqtt if configured
	//
	if (this.mqttClient != null) {
		var mqttStarted = Defer();
		started.push(mqttStarted.promise);
		this.mqttClient.open()					   
						.then( function()  { 
							Logger.info('Connected to Mqtt', {module: "Agent", function:"start"}); mqttStarted.resolve();
						}).catch( function(e) { 
							mqttStarted.reject(e); 
						});
	} else {
		Logger.info('No mqtt client set', {module: "Agent", function:"start"});
	}

	//
	// connect to MongoDb if configured
	//
	if (this.mongodbClient != null) {
		var mongodbStarted = Defer();
		started.push(mongodbStarted.promise);
		this.mongodbClient.open()
					   .then( function()  { 
							Logger.info('Connected to Mongodb', {module: "Agent", function:"start"}); mongodbStarted.resolve();
						}).catch( function(e) { 
							mongodbStarted.reject(e); 
						});
	} else {
		Logger.info('No mongodb client set', {module: "Agent", function:"start"});
	}
	
	
	return When.all(started);
/*	var self = this;
	
		// connect to appcelerator cloud
		if (config.acs != undefined && config.acs.active == "yes" && self.acs != null) {
			self.acs.login(started.bind(self), self.stop.bind(self));
		} else {
			started();
		}	
	}
		
	function started() {
		Logger.info("[Agent] started");
		onSuccess();
	}
	*/
};

/**
 * Stop Agent. Will disconnect from all transports that have been configured
 * @method start
 * @return 
 */
Agent.prototype.stop = function() {
	Logger.info("stopping...", {module: "Agent", function:"stop"});
	
	// stop amqp
	if (this.amqpClient != null) {
		this.amqpClient.close();
		Logger.info('Amqp client stopped', {module: "Agent", function:"stop"});
	} else {
		Logger.info('No amqp client set', {module: "Agent", function:"stop"});
	}
	
	// stop mongodb	
	if (this.mongodbClient != null) {
		this.mongodbClient.close();
		Logger.info('Mongodb client stopped', {module: "Agent", function:"stop"});
	} else {
		Logger.info('No mongodb client set', {module: "Agent", function:"stop"});
	}
	
	// stop mqtt
	if (this.mqttClient != null) {
		this.mqttClient.close();
		Logger.info('Mqtt client stopped', {module: "Agent", function:"stop"});
	} else {
		Logger.info('No mqtt client set', {module: "Agent", function:"stop"});
	}
	
	return;
};

/**
 * Register callback function to be called whenever a subscribe message is received 
 * @method registerOnMessageReceived
 * @param {String} _callback: callback function 
 * @return 
 */ 
Agent.prototype.registerOnMessageReceived = function(_callback) {
	if (this.amqpClient != null) {
		this.amqpClient.registerOnMessageReceived(_callback);
	}
	
	if (this.mqttClient != null) {
		this.mqttClient.registerOnMessageReceived(_callback);
	}

	return;
};
/**
 * Publish a message on the transport Broker (AMQP of MQTT)
 * If not transport broker is configured, it will throw an exception
 * If 2 transport brokers are defined, it's published on both
 * @method publish
 * @param {String} _msg: Message to be published
 * @return (Defer) A promise that is resolved once the message has been successfully published, 
 *			or rejected if it failed to publish on any of the configured brokers
 */
Agent.prototype.publish = function(_msg) {
	if (this.amqpClient == null && this.mqttClient != null) {
		throw new Error('[Agent][Publish] No transport broker is configured. At least one AMQP or MQTT transport should be defined'); 
	}
	
	var published = [];	
	
	if (this.amqpClient != null) {
		var amqpPublished = Defer();
		published.push(amqpPublished.promise); 
		
		this.amqpClient.publish(_msg)
						.then( function()   { amqpPublished.resolve(); })
						.catch( function(e) { amqpPublished.reject(e); });
	} 
	
	if (this.mqttClient != null) {
		var mqttPublished = Defer();
		published.push(mqttPublished.promise);
		
		this.mqttClient.publish(_msg)
						.then( function()   { mqttPublished.resolve(); })
						.catch( function(e) { mqttPublished.reject(e); });
	}

	return When.all(published);
}

Agent.prototype.deletePastEventsFromCloud = function() {
	if (config.acs.active == "yes" && this.acs != null) {
		this.acs.deletePastEvents();
	}
};

Agent.prototype.queryCloudEvents = function(onEvent) {
	if (config.acs.active == "yes" && this.acs != null) {
		this.acs.queryEvents(onEvent);
	} else {
		Logger.info('Simulate new event...', {module: "Agent", function:"queryCloudEvent"});
		var Event = require('Event');
		var nearFuture = new Date();
		nearFuture.setSeconds(nearFuture.getSeconds() + 3610);

		var e = new Event();

		e.id =  1;
		e.summary = 'Stade de Reims - Paris Saint-Germain';
		e.description = 'Ligue 1 - 14eme journee - En direct sur Canal +';

		e.dateStart = nearFuture;	
		e.duration = 7200;
		
		onEvent(e);
	}		        	
};

/**
 * createEventOnCloud 
 * @param {Object} event
 */
Agent.prototype.createEventOnCloud = function(event) {
	if (config.acs.active == "yes" && this.acs != null) {
		this.acs.createEvent(event);
	}
};
/**
 * deleteEventFromCloud 
 * @param {Object} event
 */
Agent.prototype.deleteEventFromCloud = function(event) {
	if (config.acs.active == "yes" && this.acs != null) {
		this.acs.deleteEvent(event);
	}
};

module.exports = Agent;
