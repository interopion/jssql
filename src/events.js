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

		if (!listeners[eType])
			listeners[eType] = [];
		
		listeners[eType].push(handler);
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
			handler = returnFalse;

		var inst = this, fn = function() {
			var out = handler.apply(inst, arguments);
			inst.unbind(eType, fn);
			return out;
		};

		return inst.bind(eType, fn);
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

		return this;
	};

	this.dispatch = function(e) 
	{
		var handlers = listeners[e] || [], 
			l        = handlers.length, 
			canceled = false,
			args     = Array.prototype.slice.call(arguments, 0),
			bubbleTarget,
			i;

		for (i = 0; i < l; i++) {
			if (handlers[i].apply(this, args) === false) {
				canceled = true; 
				break;
			}
		}

		// Event bubbling
		if (!canceled) {
			bubbleTarget = this.bubbleTarget;
			if (bubbleTarget && e != "*")
				canceled = bubbleTarget.dispatch.apply(bubbleTarget, args);
		}

		if (!bubbleTarget && e != "*") {
			args.unshift("*");
			this.dispatch.apply(this, args);
		}

		return !canceled;
	};

	// some aliases
	this.on  = this.bind;
	this.off = this.unbind;
}

var events = new Observer();