var Utils = require ('../utils');

/**
 * This class will store Amqp channels configuration details
 * @class AmqpChannel
 * @constructor
 */
function AmqpChannel() {
	this.exchange = null;
	this.exchangeType = null;
	this.topic = null;
	this.queue = null;
	this.exclusive = null;
	this.routingKey = null;
};

/**
 * Initialize Amqp channel from a json configuration object
 * @method init
 * @param {String} _config: json configuration object
 * @return 
 */
AmqpChannel.prototype.init = function(_config) {
	Utils.assertValueIsSet(_config, '[AmqpChannel][init] Config is missing');
	Utils.assertValueIsSet(_config.exchange, '[AmqpChannel][init] exchange field is missing in config.json');
	Utils.assertValueIsSet(_config.exchangeType, '[AmqpChannel][init] exchangeType field is missing in config.json');
	Utils.assertValueIsSet(_config.routingKey, '[AmqpChannel][init] routingKey field is missing in config.json');

	this.exchange = _config.exchange;
	this.exchangeType = _config.exchangeType;
	this.routingKey = _config.routingKey;	
};
	
module.exports = AmqpChannel;
