jsSQL.registerStorageEngine("SocketIOStorage", {

	construct : function SocketIOStorage(cfg) {
		var rpc, inst = this;

		this.load = function(cb) {
			if (!cfg.url) {
				return cb("You have to provide the 'storageEngine.url' " + 
					"configuration option", null);
			}

			if (!window.io || typeof io.connect != "function") {
				var script = document.createElement('script');
				script.type = 'text/javascript';
				script.async = true;
				script.onload = function() { 
					init(cb);
				};
				script.src = cfg.url.replace(/\/$/, "") + 
					"/socket.io/socket.io.js";
				document.getElementsByTagName('head')[0].appendChild(script);
			} else {
				init(cb);
			}
		};

		function init(cb) {
			rpc = io(cfg.url, { transports : ["websocket", "polling"] });

			rpc.on("ping", function() {
				rpc.emit("pong");
			});

			["get", "set", "unset", "getMany", "setMany", "unsetMany"].forEach(function(fn) {
				inst[fn] = function() {
					var args = Array.prototype.slice.call(arguments),
						next = args.pop();
					//console.info("rpc:%s(%o)", fn, args);
					rpc.emit(
						"rpc", 
						{ args : args, cmd : fn }, 
						cfg.debug ? 
						function() {
							console.warn("rpc:%s(%o)\n\t-> %o", fn, args, arguments);
							next.apply(this, arguments);
						} :
						next
					);
				};
			});
			
			cb(null, inst);
		}
	}
}, {
	label : "Remote Storage"
});
