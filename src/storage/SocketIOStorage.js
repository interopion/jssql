function SocketIOStorage() {

	if (!CFG.socketIoPath)
		throw new Errror("You have to provide the 'socketIoPath' configuration option");

	if (!window.io || typeof io.connect != "function") {
		var head = document.getElementsByTagName("head")[0],
			scr  = document.createElement("script");

		scr.src = CFG.socketIoPath.replace(/\/$/, "") + "/socket.io/socket.io.js";
		head.appendChild(scr);
		if (!window.io || typeof io.connect != "function") {
			throw new Errror("You have to include the socketIO client script first");	
		}
	}

	//console.log("io: ", window.io);
	
	var rpc = io.connect(CFG.socketIoPath), inst = this;

	each(["get", "set", "unset", "getMany", "setMany", "unsetMany"], function(fn) {
		inst[fn] = function() {
			var args = makeArray(arguments),
				next = args.pop();
			if (rpc.connected) {
				rpc.emit("rpc", { args : args, cmd : fn }, next);
			} else {
				rpc.connect(function() {
					rpc.emit("rpc", { args : args, cmd : fn }, next);
				});
			}
		};
	});
}

SocketIOStorage.prototype = Storage.getEnginePrototype();
SocketIOStorage.prototype.constructor = SocketIOStorage;
Storage.registerEngine("SocketIOStorage", SocketIOStorage);
