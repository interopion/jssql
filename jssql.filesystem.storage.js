
(function() {

	if (!(window.requestFileSystem || window.webkitRequestFileSystem)) {
		return;
	}
	
	var CONFIG = {
		fileSystem : {
			size               : 15 * 1024 * 1024, // 15MB
			type               : window.PERSISTENT,
			//rootFolder         : ".ERS",
			//filesFolderName    : "files",
			//recordFolderPrefix : "record-",
			//recordDatafileName : "record.json",
			//recordsFolderName  : "records",
			//usersDatafileName  : "users.json",

			// this.affects Utils.createUniqueFile and Utils.uniqueDir
			//uniqueEntryCreateAttempts : 100
		}
	};

	var PERSISTENT = window.PERSISTENT;
	var TEMPORARY  = window.TEMPORARY;

	/**
	 * Obtains a reference to the private file system (if such is supported).
	 * @param {Number} type One of the global PERSISTENT or TEMPORARY constants
	 * @param {Number} size The size to allocate in bytes
	 * @param {Function} onSuccess (called with the FileSystem)
	 * @param {Function} onError (called with message String or Error object)
	 * @return {void} This is async. so use the callbacks instead
	 */
	function getFileSystem(onSuccess, onError) {
		var requestFileSystem = window.requestFileSystem ||
								window.webkitRequestFileSystem,
			type = CONFIG.fileSystem.type,
			size = window.Cordova ? 0 : CONFIG.fileSystem.size;

		if (!requestFileSystem) {
			return onError("It seems that 'requestFileSystem' is not supported by this browser");
		}
			
		if (type === PERSISTENT && size > 0) {
			requestQuota(size, function(grantedBytes) {
				requestFileSystem(type, grantedBytes, onSuccess, onError);
			});
		} else {
			requestFileSystem(type, size, onSuccess, onError);
		}
	}

	/**
	 * Makes the browser request a storage quota by the user
	 */
	function requestQuota(bytes, onSuccess, onError) {
		if (navigator.webkitPersistentStorage && navigator.webkitPersistentStorage.requestQuota) {
			navigator.webkitPersistentStorage.requestQuota(bytes || 0, onSuccess, onError);
		} else {
			onError("The Quota API is not supported");
		}
	}

	/**
	 * Reads a file in all the ways supported by the File API (as text,
	 * as binary, as dataURL and as arrayBuffer).
	 * @param {File} file
	 * @param {Object|Function} options (optional) If function, this should be
	 *    the "onloadend" callback. Otherwise this should be an object that
	 *    may have some of the following properties:
	 *      "onloadstart" {Function}
	 *      "onprogress"  {Function}
	 *      "onload"      {Function}
	 *      "onabort"     {Function}
	 *      "onerror"     {Function}
	 *      "onloadend"   {Function}
	 *      "readAs"    : "text", // text|binary|dataURL|arrayBuffer
	 *      "encoding"  : "UTF-8"
	 */
	function readFile(file, options) {

		var reader, cfg;

		// Accept both object and function as second argument
		if (typeof options == "function") {
			options = {
				onloadend : options
			};
		}

		if (!file) {
			if (options.onerror) {
				options.onerror(new Error("No file"));
				return;
			} else {
				throw "No file";
			}
		}

		cfg = {
			readAs    : options.readAs    || "text", // text|binary|dataURL|arrayBuffer
			encoding  : options.encoding  || "UTF-8",
			onloadend : options.onloadend || null,
			onerror   : options.onerror   || null
		};

		
		reader = new FileReader();

		// Attach callbacks
		[
			"onloadstart",
			"onprogress",
			"onload",
			"onabort",
			"onerror",
			"onloadend"
		].forEach(function(name) {
			if (typeof cfg[name] == "function") {
				reader[name] = cfg[name];
			}
		});

		try {
			//if (cfg.encoding !== "UTF-8") {
			//    throw "Only 'UTF-8' encoding is supported for 'readAsText'";
			//}

			switch (cfg.readAs) {
				case "text":
					reader.readAsText(file, cfg.encoding);
				break;
				case "binary":
					reader.readAsBinaryString(file);
				break;
				case "dataURL":
					reader.readAsDataURL(file);
				break;
				case "arrayBuffer":
					reader.readAsArrayBuffer(file);
				break;
				default:
					throw new Error("Invalid argument");
			}
		} catch (ex) {
			console.error(ex);
			cfg.onerror(ex);
		}
	}

	jsSQL.registerStorageEngine("FileSystemStorage", {
		
		set : function(key, value, next) {
			var path  = key + ".json",
				onError = function(err) {
					next(err);
				};

			getFileSystem(function(fs) {
				fs.root.getFile(
					path,
					{ create: true, exclusive: false },
					function(fileEntry) {
						fileEntry.createWriter(function(fileWriter) {

							fileWriter.onwriteend = function(e) {
								next(null, value);
							};

							fileWriter.onerror = function(e) {
								onError('Write failed: ' + e);
							};

							var blob = new Blob(
								[JSON.stringify(value)], 
								{ type: 'text/plain' }
							);

							fileWriter.write(blob);
						}, onError);
					},
					onError
				);
			}, onError);
		},

		get : function(key, next) 
		{
			var path  = key + ".json",
				store = this,
				onError = function(err) {
					next(err);
				};

			getFileSystem(function(fs) {
				fs.root.getFile(
					path,
					{ create: true, exclusive: false },
					function(fileEntry) {
						fileEntry.file(function(file) {
							readFile(file, {
								readAs    : "text",
								onerror   : onError,
								onabort   : onError,
								onloadend : function(e) {
									var out = null;
									try {
										out = JSON.parse(e.target.result || null);
										next(null, out || null);
									} catch (ex) {
										store.unset(key, next);
									}
								}
							});
						}, onError);
					},
					onError
				);
			}, onError);
		},

		unset : function(key, next) 
		{
			var path  = key + ".json",
				onError = function(err) {
					next(err);
				};

			getFileSystem(function(fs) {
				fs.root.getFile(
					path,
					{ create: false, exclusive: false },
					function(fileEntry) {
						fileEntry.remove(function() {
							next(null, null);
						}, onError);
					},
					function() {
						next(null, null);
					}
				);
			}, onError);
		},

		setMany : function(map, next) 
		{
			var hasError = false,
				onError = function(err) {
					hasError = true;
					next(err);
				};

			getFileSystem(function(fs) {
				var pending = [];
				
				for ( var key in map ) {
					pending.push({ 
						path : key + ".json", 
						value : map[key] 
					});
				}

				function saveNext() 
				{
					if ( hasError )
						return false;

					if (!pending.length)
						return next(null);

					var task = pending.shift();

					fs.root.getFile(
						task.path,
						{ create: true, exclusive: false },
						function(fileEntry) {
							fileEntry.createWriter(function(fileWriter) {

								fileWriter.onwriteend = saveNext;

								fileWriter.onerror = function(e) {
									onError('Write failed: ' + e);
								};

								var blob = new Blob(
									[JSON.stringify(task.value)], 
									{ type: 'text/plain' }
								);

								fileWriter.write(blob);
							}, onError);
						},
						onError
					);
				}

				saveNext();

			}, onError);
		},

		getMany : function(keys, next) 
		{
			var _keys    = keys.slice(),
				out      = [],
				hasError = false,
				onError  = function(err) {
					hasError = true;
					next(err);
				};

			getFileSystem(function(fs) {
				function getNext() 
				{
					if ( hasError )
						return false;

					if (!_keys.length)
						return next(null, out);

					var key = _keys.shift();

					fs.root.getFile(
						key + ".json",
						{ create: true, exclusive: false },
						function(fileEntry) {
							fileEntry.file(function(file) {
								readFile(file, {
									readAs    : "text",
									onerror   : onError,
									onabort   : onError,
									onloadend : function(e) {
										var res = null;
										try {
											res = JSON.parse(e.target.result || null);
											out.push(res || null);
											getNext();
										} catch (ex) {
											store.unset(key, function() {
												out.push(null);
												getNext();
											});
										}
									}
								});
							}, onError);
						},
						onError
					);
				}
				getNext();
			}, onError);
		},

		unsetMany : function(keys, next) 
		{
			var _keys    = keys.slice(),
				hasError = false,
				onError  = function(err) {
					hasError = true;
					next(err);
				};

			getFileSystem(function(fs) {
				function deleteNext() 
				{
					if ( hasError )
						return false;

					if (!_keys.length)
						return next(null);

					fs.root.getFile(
						_keys.shift() + ".json",
						{ create: false, exclusive: false },
						function(fileEntry) {
							fileEntry.remove(deleteNext, onError);
						},
						deleteNext
					);
				}
				deleteNext();
			}, onError);
		}
	}, {
		label : "File Storage (for Google Chrome)"
	});
})();
