/**
 * The event system
 * @namespace events 
 * @type {Object}
 */
function Observer() {
	
	var listeners = {};

	function returnFalse()
	{
		return false;
	}

	/**
	 * Adds an event listener
	 * @param {String} eType The event type to listen for
	 * @param {Function|Boolean} handler The function to be invoked. Can also be 
	 * a falsy value which will be internally converted to a function that 
	 * returns false.
	 * @return {Function} The bound event handler
	 */
	this.bind = function(eType, handler) 
	{
		if (handler === false)
			handler = returnFalse;

		var c = listeners[eType];
		if (!c)
			c = listeners[eType] = [];
		
		c.push(handler);
		return handler;
	};

	/**
	 * Adds an event listener that removes itself after the first call to it
	 * @param {String} eType The event type to listen for
	 * @param {Function|Boolean} handler The function to be invoked. Can also be 
	 * a falsy value which will be internally converted to a function that 
	 * returns false.
	 * @return {Function} The bound event handler
	 */
	this.one = function(eType, handler) 
	{
		if (handler === false)
			handler = function() {
				return false;
			};

		handler.__one_time_listener__ = true;
		return this.bind(eType, handler);
	};

	/**
	 * Removes event listener(s)
	 * 1. If the method is called with no arguments removes everything.
	 * 2. If the method is called with one argument removes everything for that
	 *    event type.
	 * 3. If the method is called with two arguments removes the specified 
	 *    handler from the specified event type.
	 * @param {String} eType The event type
	 * @param {Function|Boolean} handler The function to be removed. Can also be 
	 * a false to remove the generic "returnFalse" listeners.
	 * @return {Observer} Returns the instance
	 */
	this.unbind = function(eType, handler) 
	{
		if (!eType) {
			listeners = {};
		} else if (!handler) {
			listeners[eType] = [];
		} else {
			var a = listeners[eType] || [], l = a.length;
			while (l--) {
				if (a[l] === handler) {
					a.splice(l, 1);
				}
			}
		}
		
		return this;
	};

	this.dispatch = function(e) 
	{
		var handlers = listeners[e] || [], 
			canceled = false,
			args     = Array.prototype.slice.call(arguments, 0),
			len      = handlers.length,
			bubbleTarget,
			i, fn, out;

		for (i = 0; i < len; i++) {
			fn  = handlers[i]; 
			out = fn.apply(this, args);

			if (fn.__one_time_listener__) {
				handlers.splice(i--, 1);
				len--;
			}

			if (out === false) {
				canceled = true; 
				break;
			}
		}

		// Event bubbling
		if (!canceled) {
			bubbleTarget = this.bubbleTarget;
			if (bubbleTarget)
				canceled = bubbleTarget.dispatch.apply(bubbleTarget, args) === false;
		}
		
		return !canceled;
	};

	// some aliases
	this.on      = this.bind;
	this.off     = this.unbind;
	this.once    = this.one;
	this.emit    = this.dispatch;
	this.trigger = this.dispatch;
}

//var events = new Observer();