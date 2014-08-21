
jQuery(function($) {

	var history    = [""],
		historyPos = 0,
		$in        = $("#in"),
		$out       = $("#out");
	
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
		if (txt != history[historyPos]) {
			historyPos = history.push(txt) - 1;
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
						historyPos = history.length - 1;
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

	function historyUp() {
		var txt = "", len;
		if (historyPos > 0) {
			txt = history[historyPos--];
			len = txt.length;
			$in.val(txt);//.attr("rows", txt.split("\n").length);
			setTimeout(function() {
				//$in.val(txt);
				resizeUI();
				$in.prop({
					selectionEnd   : len,
					selectionStart : len
				});

				

			}, 0);
		}
	}

	function historyDown() {
		if (historyPos < history.length - 1) {
			$("#in").val(history[++historyPos]).trigger("focus");
		} else {
			$("#in").val("").trigger("focus");
		}
		setTimeout(resizeUI, 0);
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
	
	function onSuccess(result, queryIndex) {//console.log("result: ", result);
		var html = "";
		if (result.type === JSDB.Result.TYPE_ARRAY || result.type === JSDB.Result.TYPE_SET) {
			html += result.toHTML();
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
		if (queryIndex !== undefined) {
			html += 'Query ' + (queryIndex + 1) + ": ";
		}
		html += result.getMessage() + '</div>';
		$out.append(html);
		PR.prettyPrint("out");
		$in.removeClass("waiting").trigger("input").trigger("focus");
	}
	
	function onComplete(input) {
		$out.append(
			$('<code class="prettyprint old-input lang-sql"/>')
				.text(input)
		);
		PR.prettyPrint("out");
	}

	function resizeUI() {
		$in.css({ height : 0 });
		var wh = $(window).height(),
			oh = $out.outerHeight();
			h  = Math.max(wh - oh, $in[0].scrollHeight, 30);
		//if (h < 30) {
		//    h = wh/2;//$in[0].scrollHeight;
		//}
		$in.css({
			top    : oh,
			height : h,
			//minHeight : h
		});//[0].scrollIntoViewIfNeeded();
		//.css("minHeight", $in[0].scrollHeight)
		//[0]
		//[$in[0].scrollIntoViewIfNeeded ? 
		//    "scrollIntoViewIfNeeded" :
		//    "scrollIntoView"]
		//()
		;
		$("body")[0].scrollTop = $("body")[0].scrollHeight;
		//setTimeout(function() {
		 //   $in.css({
		 //       minHeight : $in[0].scrollHeight 
		 //   });
		//}, 0);
	}
	
	$(window).on("resize", resizeUI);

	$("#in").on("input paste keyup", function() {
		resizeUI();
	});

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
		//setTimeout(resizeUI, 0);

		switch (e.keyCode) {
			case 9: // Tab
				var val = this.value,
					start = this.selectionStart;
				this.value = val.substring(0, start) + 
					"\t" + val.substring(this.selectionEnd);
				this.selectionEnd   = start + 1;
				this.selectionStart = start + 1;
				return false;
			break;
			case 38: // Arrow Up
				if (!(e.ctrlKey || e.metaKey)) {
					return true;
				}
				historyUp();
				return false;
			break;
			case 40: // Arrow Down
				if (!(e.ctrlKey || e.metaKey)) {
					return true;
				}
				historyDown();
				return false;
			break;
			case 13: // Enter
				if (this.value.indexOf(";") < 1) {
					return true;
				}
				if (!(e.ctrlKey || e.metaKey)) {
					return true;
				}
				
				setTimeout(function() {
					$in.trigger("input");
				}, 0);
				var input = $.trim($(this).val()), out;

				if (/\s*clear(\s*\(\s*\))?[\s;]*$/.test(input)) {
					clearState();
					return false;
				}
				
				$out.append(
					$('<code class="prettyprint old-input lang-sql"/>')
						.text(input)
				);
				PR.prettyPrint("out");
				$in.addClass("waiting");
				pushState(input);
				$in.trigger("blur").prop({
					value : "",
					selectionStart : 0,
					selectionEnd   : 0
				});
				JSDB.query(input, onSuccess, onError);
				return false;
			break;
		}
	});

	$in.trigger("focus").prop({
		value : "",
		selectionStart : 0,
		selectionEnd   : 0
	});

});