var winston = require('winston');

function _Logger() {
	winston.extend(this);
	winston.remove(winston.transports.Console);		// added by default	
};

_Logger.prototype.init = function(_cfg) {	
	var transports = _cfg.logs.transports;

	for (var i = 0; i < transports.length; i++) {
		for (key in transports[i]) {
			this.addTransport(key, transports[i][key]);
		}		
	}
	winston.cli();
}

_Logger.prototype.addTransport = function(name, value) {
	winston.add(winston.transports[name], value);
}

var Logger = new _Logger();

module.exports = Logger;
