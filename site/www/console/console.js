
jQuery(function($) {

	var history    = [""],
		historyPos = 0,
		$in        = $("#in"),
		$out       = $("#out"),
		api;

	var connectionOptions = {};

	$.each(jsSQL.getRegisteredStorageEngines(), function(id, label) {
		$("#storage-selector").append(
			'<option value="' + id + '">Use ' + label + '</option>' +
			'<option value="' + id + '_debug">Use ' + label + ' + debug</option>'
		);
	})

	$("#storage-selector")
	.on("mousedown click", function(e) {
		e.stopPropagation();
	})
	.on("change", function() {
		$("#overlay").show();
		var storageType = $(this).val(),
			debug = storageType.indexOf("_debug") > 0;

		sessionStorage["storageType"] = storageType;
		connectionOptions.debug = debug
		connectionOptions.storageEngine = {
			type  : storageType.replace(/_debug$/, ""),
			debug : debug
		};

		jsSQL(connectionOptions, function(_api) {
			api = _api;
			console.info("Connected to %s", storageType);
			$("#overlay").hide();
		});
	})
	.val(sessionStorage["storageType"] || "MemoryStorage")
	.trigger("change");
	
	loadState();

	function saveState()
	{
		localStorage["JSDB-console"] = JSON.stringify({
			history    : history,
			historyPos : historyPos
		});
	}

	function pushState(txt)
	{
		if (txt != history[historyPos - 1]) {
			historyPos = history.push(txt);
			saveState();
		}
	}

	function loadState() 
	{
		var state = localStorage["JSDB-console"];
		if (state) {
			try { 
				state = JSON.parse(state);
				if (state.history && 
					Object.prototype.toString.call(state.history) == "[object Array]") 
				{
					history = state.history;
					if (typeof state.historyPos && 
						state.historyPos >= 0 && 
						state.historyPos < history.length) 
					{
						historyPos = state.historyPos;
					} else {
						historyPos = history.length;
					}
				}
			} catch (ex) {
				saveState();
			}
		}
	}

	function clearState() 
	{
		history = [""];
		historyPos = 0;
		saveState();
		$out.empty();
		$in.prop({
			value : "",
			selectionStart : 0,
			selectionEnd   : 0
		}).trigger("input");
	}

	var lastValue = "";
	function historyUp() {
		var txt = "", len;
		if (historyPos === history.length) lastValue = $in.val();
		if (historyPos > 1) {
			txt = history[--historyPos];
			len = txt.length;
			$in.val(txt);//.attr("rows", txt.split("\n").length);
			$in.prop({
				selectionEnd   : len,
				selectionStart : len
			});
			//setTimeout(function() {
				//$in.val(txt);
				resizeUI();
				
			//}, 0);
		}
	}

	function historyDown() {
		if (historyPos < history.length) {
			$("#in").val(history[++historyPos] || lastValue)//.trigger("focus");
		} else {
			$("#in").val(lastValue);
		}
		resizeUI();
	}

	function showError(e, i) {
		$out.append(
			$('<div class="old-output error"/>')
			.html(
				'Query ' + ((i || 0) + 1) + ': ' + 
				'<b style="color:#666">' + e.name + ':</b> ' + e.message
			)
		);
		if (e.stack && e.name.indexOf("SQL") == -1) {
			$out.append(
				$('<div class="old-output error"/>').html(
					'Stack:<blockquote>' + e.stack + '</blockquote>'
				)
			); 
		}
	}
	
	function onError(e, i) {
		showError(e, i);
		$in.removeClass("waiting").trigger("input").trigger("focus");
	}
	
	function onSuccess(result, queryIndex, len) {//console.log("result: ", result);
		var html = "";
		if (result.type === JSDB.Result.TYPE_ARRAY || result.type === JSDB.Result.TYPE_SET) {
			html += result.toHTML();
			//console.dir(result);
			/*
			html += '<br><br>';
			html += result.toJSONString(4));
			html += '<br><br>');
			html += result.toCSV());
			html += '<br><br>');
			html += result.toXML("\t")
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
			);
			*/
		}

		html += '<div>';
		if (len && len > 1 && queryIndex !== undefined) {
			html += 'Query ' + (queryIndex + 1) + " of " + len + ": ";
		}
		html += result.getMessage() + '</div>';
		$out.append(html);
		PR.prettyPrint("out");
		$in.removeClass("waiting").trigger("input").trigger("focus");
	}
	
	function onComplete(err, result, i, len) {
		if (err)
			onError(err, i, len);
		else
			onSuccess(result, i, len);
		resizeUI();
	}

	function resizeUI() {
		var wh = document.documentElement.clientHeight,
			oh = $out.outerHeight();
			h  = Math.max(wh - oh, 30)
			t  = $in[0];
		
		

		$in.css({ top : oh, minHeight : h });


		var rows = $in.val().split("\n");
    	$in.trigger("blur").prop('rows', rows.length + 1);
    	t.blur();t.focus();
    	rows = [];
	}
	
	$(window).on("resize", resizeUI);
	$("#in").on("input paste keyup", resizeUI);

	$("body")
		.on("mousedown", "#out", function(e) { e.stopPropagation(); })
		.on("click", "#in, #out", function(e) {
			e.stopPropagation();
		})
		.on("click", function(e) {
			$in.trigger("focus");
		});

	$in.on("keydown", function(e) {
		//console.log(e.keyCode);
		switch (e.keyCode) {
			case 9: // Tab
				var val = this.value,
					start = this.selectionStart;
				this.value = val.substring(0, start) + 
					"\t" + val.substring(this.selectionEnd);
				this.selectionEnd   = start + 1;
				this.selectionStart = start + 1;
				return false;
			
			case 38: // Arrow Up
				//if (!(e.ctrlKey || e.metaKey)) {
				//	return true;
				//}
				//historyUp();
				//return false;
				if (e.ctrlKey || e.metaKey || ($in[0].selectionStart === 0 && $in[0].selectionEnd === 0)) {
					historyUp();
					return false;	
				}
				return true;

			case 40: // Arrow Down
				var txtLen = $in.val().length;
				if (e.ctrlKey || e.metaKey || ($in[0].selectionStart === txtLen && $in[0].selectionEnd === txtLen)) {
					historyDown();
					return false;
				}
				return true;

			case 13: // Enter
				
				if (this.value.indexOf(";") < 1) {
					return true;
				}

				if (!(e.ctrlKey || e.metaKey)) {
					return true;
				}
				
				var input = $.trim($(this).val()), out;

				if (/\s*clear(\s*\(\s*\))?[\s;]*$/.test(input)) {
					clearState();
					return false;
				}
				
				$out.append(
					$('<code class="prettyprint old-input lang-sql"/>').text(input)
				);

				PR.prettyPrint("out");
				$in.addClass("waiting");
				pushState(input);
				
				$in.trigger("blur").prop({
					value : "",
					selectionStart : 0,
					selectionEnd   : 0
				});

				if (api) {
					api.query(input, onComplete);
				} else {
					jsSQL(connectionOptions, function(_api) {
						api = _api;
						api.query(input, onComplete);
					});
				}
				
				return false;
		}
	});

	$in.trigger("focus").prop({
		value : "",
		selectionStart : 0,
		selectionEnd   : 0
	});
	resizeUI();
});
