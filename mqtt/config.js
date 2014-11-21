var Utils = require ('../utils');

/**
 * This class will store Mqtt configuration details
 * @class MqttConfig
 * @constructor
 */
function MqttConfig() {
	this.brokerPort = null;
	this.brokerHost = null;
	
	this.options = {};
	this.options.clean = false;
	this.options.clientId = null;
	this.options.username = null;
	this.options.password = null;
	
	this.topicSubscribe = [];
	
	this.publish = {};
	this.publish.topic = null;
	this.publish.qos = 0;
	
};	

/**
 * Initialize Amqp channel from a json configuration object
 * @method init
 * @param {String} _config: json configuration object
 * @return 
 */
MqttConfig.prototype.init = function(_config) {
	Utils.assertValueIsSet(_config, 'Config is missing', 'MqttConfig', 'init');
	
	this.brokerHost = Utils.getValue(_config.broker.host, 'localhost');
	this.brokerPort = Utils.getValue(_config.broker.port, '1883');	
		
	this.options.clean = Utils.getBooleanValue(_config.cleanSession, false);
	
	if (!this.options.clean) {
		Utils.assertValueIsSet(_config.clientId, 'Client Id is mandatory when cleanSession is false', 'MqttConfig', 'init');
	}
	
	this.options.clientId = Utils.getValue(_config.clientId, null);	
	this.options.username = Utils.getValue(_config.userName, null);	
	this.options.password = Utils.getValue(_config.password, null);	
	
	this.topicSubscribe = _config.topicSubscribe;
	
	if ( Utils.valueIsSet(_config.publish) ) {
		this.publish.topic = _config.publish.topic;
		this.publish.qos = Utils.getIntValue(_config.publish.qos, 0);
	}
};

/**
 * Return Mqtt options as a JSON string
 * @method options
 * @return Mqtt options as a JSON string
 */
MqttConfig.prototype.getOptions = function(_config) {	
	return JSON.stringify(this.options);
};
module.exports = MqttConfig;
