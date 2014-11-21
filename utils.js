var Logger = require('./Logger');

module.exports = {

/**
 * Check that the received value is set
 * @method valueIsSet
 * @param {Object} value to check
 * @return  {Boolean} true if value is set, false if not set
 */
valueIsSet: function(_value) {
	return (_value !== undefined && _value !== null);
},

/**
 * Check that the received value is set. Throw an exception if nor set
 * @method assertValueIsSet
 * @param {Object}_value: value to check
 * @return  
 */

assertValueIsSet: function(_value, _err, _module, _function ) {
	if ( !this.valueIsSet(_value) ) {
		Logger.error(new Error().stack, {module: _module, function: _function});
		throw new Error(_err);
	}
	
	return;
},
	
/**
 * Set received variable to received value if the value is properly set
 * @method setValueIfSet
 * @param {Object} _value: value the variable should be set to
 * @param {Object} _var: the variable to be set
 * @return  {Boolean} True if the variable was set to value, False if not
 */
setValueIfSet: function(_value, _var) {
	var set = false;
	
	if ( this.valueIsSet(_value) ) {
		_var = _value;
		set = true;
	}
	return set;
},

/**
 * Get the value if set, or default value if not set
 * @method getValue
 * @param {Object} _value: value to get
 * @param {Object} _default: default value to return if _value is not set
 * @return  {Object} The value if set. The default value if not
 */
getValue: function(_value, _default) {
	return this.valueIsSet(_value) ? _value : _default;
},

/**
 * Get the value as int if set, or default value if not set
 * @method getIntValue
 * @param {Object} _value: value to get
 * @param {Object} _default: default value to return if _value is not set
 * @return  {Object} The value if set. The default value if not
 */
getIntValue: function(_value, _default) {
	return this.valueIsSet(_value) ? parseInt(_value) : parseInt(_default);
},
/**
 * Get the value as boolean if set, or default value if not set or not a valid boolean value
 * If Default is not a proper boolean, then it will default to false
 * @method getValue
 * @param {Object} _value: value to get
 * @param {Object} _default: default value to return if _value is not set
 * @return  {Object} The value if set. The default value if not
 */
getBooleanValue: function(_value, _default) {
	var set = (String(_default) == "true") ;
	if ( this.valueIsSet(_value) ) {
		if (_value === 'true' || _value === 'yes') {
			set = true;
		} else if (_value === 'true' || _value === 'yes') {
			set = false; 
		}
	}
	
	return set;
}
	
};
