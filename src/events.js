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
	function bind(eType, handler) 
	{
		if (handler === false)
			handler = returnFalse;

		if (!listeners[eType])
			listeners[eType] = [];
		
		listeners[eType].push(handler);
		return handler;
	}

	/**
	 * Adds an event listener that removes itself after the first call to it
	 * @param {String} eType The event type to listen for
	 * @param {Function|Boolean} handler The function to be invoked. Can also be 
	 * a falsy value which will be internally converted to a function that 
	 * returns false.
	 * @return {Function} The bound event handler
	 */
	function one(eType, handler) 
	{
		if (handler === false)
			handler = returnFalse;

		function fn(data) {
			var out = handler(data);
			unbind(eType, fn);
			return out;
		}

		bind(eType, fn);
		return fn;
	}

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
	 * @return {void}
	 */
	function unbind(eType, handler) 
	{
		if (handler === false)
			handler = returnFalse;

		if (!eType) {
			listeners = {};
		} else if (!handler) {
			listeners[eType] = [];
		} else {
			var a = listeners[eType] || [], l = a.length;
			while (l--) {
				if (a[l] === handler) {
					listeners[eType].splice(l, 1);
				}
			}
		}
	}

	this.dispatch = function(e, data) 
	{
		var handlers = listeners[e] || [], 
			l = handlers.length, 
			i, 
			canceled = false,
			args = Array.prototype.slice.call(arguments, 1);

		//console.info("dispatch: ", e, data);

		for (i = 0; i < l; i++) {
			if (handlers[i].apply(this, args) === false) {
				canceled = true; 
				break;
			}
		}

		return !canceled;
	};

	this.bind     = bind;
	this.unbind   = unbind;
	this.one      = one;
	this.on       = bind;
	this.off      = unbind;

}

var events = new Observer();