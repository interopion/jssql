/**
 * Class Transaction
 * @classdesc Creates transaction objects which can be started, stopped and 
 * rolled back (undone). All the tasks inside the transaction queue are executed
 * asynchronously. There is a rich set of event callbacks available, as well as 
 * ability to observe the execution progress.
 * @param {Object}   options Optional configuration options.
 * @param {Function} options.onComplete Optional. The callback function to be
 *		invoked when the transaction is complete. The function will be called
 * 		with no arguments.
 * @param {Function} options.onRollback Optional. The callback function to be
 *		invoked when the transaction has been rolled back. The function will be
 *		called with the last error message as argument.
 * @param {Function} options.onError Optional. The callback function to be
 *		invoked when there is an error. The function will be
 *		called with the last error message as argument.
 * @param {Function} options.beforeTask Optional. 
 * @param {Function} options.afterTask Optional. 
 * @param {Function} options.beforeUndo Optional. 
 * @param {Function} options.afterUndo Optional. 
 * @param {Function} options.onProgress Optional. 
 * @param {Number} options.delay Optional. The number of milliseconds to wait 
 * 		before calling the next task in the queue. Defaults to 0.
 * @param {Number} options.timeout Optional. The number of milliseconds to wait 
 * 		for the current task to complete. If this time is exceeded the 
 *		transaction is aborted. Defaults to 1000 (one second).
 * @param {String} options.name Optional. The name of the transaction (to be 
 *		used for logging to identify the current transaction in case it is 
 * 		nested in another one...)
 * @param {Boolean} options.autoRollback Optional.
 * @param {Boolean} options.reqursiveRollback Optional. By default rolling back
 *		a nested transaction will also rollback it's parent transaction. Set 
 *		this to false to turn off this behavior.
 * 
 * The instance emits the following events:
 * <ul>
 *   <li>reset                    - after the instance has been reset</li>
 *   <li>error(error)             - on error</li>
 *   <li>before:task([task, pos]) - before a task is executed</li>
 *   <li>after:task([task, pos])  - after a task has been executed</li>
 *   <li>progress([q, task, pos]) - after a task has been executed or undone</li>
 *   <li>complete</li>
 *   <li>rollback(error)</li>
 *   <li>before:undo([task, pos])</li>
 *   <li>after:undo([task, pos])</li>
 * </ul>
 * @constructor
 */
function Transaction(options) 
{
	var 

	config = mixin({
		//onComplete   : noop,
		//onRollback   : noop, // args: lastError
		//onError      : noop, // args: Error error|String error message
		//beforeTask   : noop, // args: task, pos
		//afterTask    : noop, // args: task, pos
		//beforeUndo   : noop, // args: task, pos
		//afterUndo    : noop, // args: task, pos
		//onProgress   : noop, // args: q, task, pos
		timeout      : 1000, // For any single task
		delay        : 0,
		name         : "Anonymous transaction",
		autoRollback : true,
		debug        : false
	}, options),

	/**
	 * The task queue
	 * @type {Array}
	 * @private
	 */
	tasks = [],

	/**
	 * The length of the task queue
	 * @type {Number}
	 * @private
	 */
	length = 0,

	/**
	 * The current position within the task queue. The initial value is -1 which
	 * means that the transaction has not been started.
	 * @type {Number}
	 * @private
	 */
	position = -1,
	
	/**
	 * The timeout that executes the current task
	 * @private
	 */
	timer = 0,
	
	/**
	 * The delay timeout
	 * @private
	 */
	delay = 0,

	/**
	 * The total weight of the transaction. This is computed as the sum of the
	 * weights of all the tasks. Each task might define it's own weight. 
	 * Otherwise 1 is used for the task.
	 * @type {Number}
	 * @private
	 */ 
	weight = 0,
	
	/**
	 * Contains the last error message (if any). Defaults to an empty string.
	 * @type {String}
	 * @private
	 */
	lastError = "";

	Observer.call(this);

	if (config.debug) {
		this.on("error", function(e, err) {
			console.error(err);
		});
		this.on("before:task", function(e, task, pos) {
			console.info("Starting task ", config.name, "->", task.name);
		});
		//this.on("after:task", function(e, task, pos) {
		//	console.info(e, "(" + pos + ")", config.name, "->", task.name);
		//});
		this.one("complete", function(e) {
			console.info('Transaction complete "%s"', config.name);
		});
	}

	var eventMap = {
		"onComplete" : "complete",
		"onRollback" : "rollback",
		"onError"    : "error",
		"beforeTask" : "before:task",
		"afterTask"  : "after:task",
		"beforeUndo" : "before:undo",
		"afterUndo"  : "after:undo",
		"onProgress" : "progress"
	};

	for (var handler in eventMap) {
		if (isFunction(config[handler])) {
			this.on(eventMap[handler], config[handler]);
		}
	}

	
	// Instance methods --------------------------------------------------------
	
	
	/**
	 * Returns the length of the task queue
	 * @return {Number}
	 */
	this.getLength = function()
	{
		return length;
	};

	/**
	 * Returns the weight of the transaction which is the sum of all task weights
	 * @return {Number}
	 */
	this.getWeight = function()
	{
		return weight;
	};

	this.setWeight = function(w)
	{
		weight = w;
	};

	/**
	 * Starts the transaction. Only non-empty, not started and not running 
	 * transaction can be started. Otherwise an Exception is thrown.
	 * @throws {Error}
	 * @return {void}
	 */
	this.start = function() 
	{
		//if (this.isEmpty()) 
		//	throw new Error("The transaction has no tasks");
		if (this.isComplete()) 
			throw new Error("The transaction is already complete");
		if (this.isStarted()) 
			throw new Error("The transaction is already running");
		
		this.emit("start");
		this.next();
	};

	/**
	 * Resets the transaction
	 * @throws {Error} if the transaction is currently running
	 * @return {void}
	 * @method reset
	 * @memberof Transaction.prototype
	 */
	this.reset = function(silent) 
	{
		if (this.isStarted() && !this.isComplete()) 
			throw new Error("Cannot reset a transacion while it is runing");
		
		if (timer) clearTimeout(timer);
		if (delay) clearTimeout(delay);
		
		tasks.splice(0, length);

		length    = tasks.length;
		position  = length - 1;
		weight    = 0;
		lastError = "";

		if (!silent)
			this.emit("reset");
	};

	this.destroy = function()
	{
		this.reset(true);
		this.off();
	};

	/**
	 * Appends new task to the transaction queue.
	 * @param {Task|Transaction} task The task or sub-transaction to 
	 * 		add to the queue
	 * @throws {Error} If the transaction has already been started
	 * @return {void}
	 * @todo Allow for adding Transaction objects to create nested transactions
	 */
	this.add = function add(task) 
	{
		//if (this.isStarted()) 
		//	throw "The transaction has already ran";

		// Add nested transaction. In this case create new generic task that 
		// wraps the entire nested transaction
		if (task && task instanceof Transaction)
		{
			var tx = task;
			
			task = Transaction.createTask({
				name : "Nested transaction",
				execute : function(next) 
				{
					tx.on("complete", next);
					tx.on("error", next);
					tx.start();
				},
				undo : function(next) 
				{
					tx.on("rollback", function() {
						var args = Array.prototype.slice.call(arguments);
						args.unshift(null);
						next.apply(tx, args);
					});
					tx.rollback();
				}
			});

			tx.parentTransaction = this;

			weight += tx.getWeight();
		}
		else
		{
			weight += task.weight || 1;
			if (this.parentTransaction) {
				this.parentTransaction.setWeight(
					this.parentTransaction.getWeight() + (task.weight || 1)
				);
			}
		}

		task.transaction = this;
		length = tasks.push(task);
		task.name += " (at position " + length + ")";
	};

	/**
	 * Undoes all the completed actions on failure.
	 * @return {void}
	 */
	this.rollback = function(callerPosition) {
		if (timer) clearTimeout(timer);
		if (delay) clearTimeout(delay);
		
		// Such a call might come from within a task that has already been 
		// "outdated" due to timeout
		if (callerPosition !== undefined && callerPosition !== position) {
			return;
		}

		if (position < 0) {
			this.emit("rollback", lastError);
			return;
		}

		var task = tasks[position--], inst = this;
		function onTaskUndo(err) {
			inst.emit("progress", inst.getProgress(), task, position + 1);
			inst.emit("after:undo", task, position + 1);
			if (err) {
				inst.emit("error", err || "Task '" + task.name + "' failed to undo");
			}
			inst.rollback();
		}

		this.emit("before:undo", task, position + 1);

		try {
			task.undo(onTaskUndo);
		} catch (ex) {
			this.emit("error", ex);
			this.rollback();
		}
	};

	/**
	 * Checks if the transaction has been started
	 * @return {Boolean}
	 */
	this.isStarted = function() 
	{
		return position > -1;
	};

	/**
	 * Checks if the transaction is complete
	 * @return {Boolean}
	 */
	this.isComplete = function() 
	{
		return !this.isEmpty() && position === length - 1;
	};
	
	/**
	 * Checks if the transaction is empty
	 * @return {Boolean}
	 */
	this.isEmpty = function() 
	{
		return length === 0;
	};

	/**
	 * Calculates and returns the current position as a floating point number.
	 * This tipically represents ho many of the available tasks are complete,
	 * but can also be more complicated because each task can have it's own 
	 * weight defined which affects this number.
	 * @return {Number}
	 */
	this.getProgress = function() 
	{
		var cur = 0, i;
		for (i = 0; i <= position; i++) {
			cur += tasks[i].weight || 1;
		}
		return cur / weight;
	};

	/**
	 * Set the value of the configuration option identified by name
	 * @param {String} name The name of the option
	 * @param {*} value The new value for the option
	 * @return {Transaction} Returns the instance.
	 */
	this.setOption = function(name, value)
	{
		config[name] = value;
		return this;
	};

	/**
	 * Get the value of the configuration option identified by name
	 * @param {String} name The name of the option
	 * @return {*} Returns the option value or undefined if the option does not
	 *		exist.
	 */
	this.getOption = function(name)
	{
		return config[name];
	};

	/**
	 * The function that attempts to invoke the next task in the queue
	 */
	this.next = function(callerPosition) 
	{
		// clear times if needed
		if (timer) clearTimeout(timer);
		if (delay) clearTimeout(delay);

		// Such a call might come from within a task that has already been 
		// "outdated" due to timeout
		if (callerPosition !== undefined && callerPosition !== position) {
			return;
		}

		if (!this.isComplete() && !this.isEmpty()) {
			(function worker(task, pos, inst) {
				var _timeout = "timeout" in task ? task.timeout : config.timeout;
				
				if ( _timeout > 0 ) {
					timer = setTimeout(function() {
						lastError = "Task '" + task.name + "' timed out!.";
						inst.emit("error", lastError);
						if (config.autoRollback) 
							inst.rollback(pos);
					}, _timeout + config.delay);
				}

				function onTaskFinsh(err) {
					if (pos === position) {
						if (err) {
							lastError = err || "Task '" + task.name + "' failed.";
							inst.emit("error", lastError);
							if (config.autoRollback) inst.rollback(pos);
						} else {
							inst.emit("progress", inst.getProgress(), task, pos);
							inst.emit("after:task", task, pos);

							if (config.delay) {
								delay = setTimeout(function() {
									inst.next();
								}, config.delay);
							} else {
								nextTick(function() {
									inst.next();
								});
							}
						}
					}
				}

				inst.emit("before:task", task, pos);
				try {
					task.execute(onTaskFinsh);
				} catch (ex) {
					inst.emit("error", ex);
					if (config.autoRollback) 
						inst.rollback(pos);
				}
			})(tasks[++position], position, this);
		} else {
			this.emit("complete");
		}
	};
}

/**
 * Creates new transaction tasks
 * @see Task
 * @static
 */
Transaction.createTask = function(options) {
	return new Task(options);
};

/**
 * @classdesc The Task class can be used to create Tasks suitable for
 * adding into transactions. The user is only required to provide "execute" and
 * and "undo" implementations. However additional properties might be defined:
 * @param {Object} options
 * @param {String} options.name Optional. The name of the task. Defaults to 
 *		"Anonymous task".
 * @param {Number} options.timeout Optional. The timeout for the task. If not
 *		provided, the global timeout option of the transaction will be used.
 * @param {Function} options.execute The function that will be invoked as the 
 * 		task worker. If this is not provided, an empty function is used and a 
 * 		warning is generated to the console.
 * @constructor
 */
function Task(options) 
{
	mixin(this, options);
}

Task.prototype = {
	
	/**
	 * The name of the task. Defaults to "Anonymous task"
	 * @type {String}
	 */
	name : "Anonymous task",

	/**
	 * The actual worker of the task.
	 * @param {Function} done The implementation MUST call this after the job is
	 *		successfully completed
	 * @param {Function} fail The implementation MUST call this if the job has
	 *		failed
	 * @return {void}
	 */
	execute : function(next) {
		console.warn(
			"The 'execute' method for task '" + this.name + 
			"' is not implemented!"
		);
		next();
	},

	/**
	 * The function that undoes the task
	 * @param {Function} done The implementation MUST call this after the job is
	 *		successfully completed
	 * @param {Function} fail The implementation MUST call this if the job has
	 *		failed
	 * @return {void}
	 */
	undo : function(next) {
		console.warn(
			"The 'undo' method for task '" + this.name + 
			"' is not implemented!"
		);
		next();
	}
};


