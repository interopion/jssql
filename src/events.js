var events = (function() {
	
	var listeners = {};

	function bind(eType, handler) 
	{
		if (!listeners[eType])
			listeners[eType] = [];
		listeners[eType].push(handler);
		return handler;
	}

	function one(eType, handler) 
	{
		function fn(data) {
			handler(data);
			unbind(eType, handler);
		} 
		bind(eType, fn);
		return fn;
	}

	function unbind(eType, handler) 
	{
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

	function dispatch(e, data) 
	{
		var handlers = listeners[e] || [], 
			l = handlers.length, 
			i, 
			canceled = false;

		//console.info("dispatch: ", e, data);

		for (i = 0; i < l; i++) {
			if (handlers[i](data) === false) {
				canceled = true; 
				break;
			}
		}

		return !canceled;
	}

	return {
		dispatch : dispatch,
		bind     : bind,
		unbind   : unbind,
		one      : one
	};

})();