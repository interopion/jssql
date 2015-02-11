<?php 
$title = 'Demo';
require('header.php'); ?>
<div style="text-align:center;font-weight:300;position:relative;top:-8px;font-size:14px">
	Type an SQL query and hit <kbd>Ctrl/Command</kbd> + <kbd>Enter</kbd> to execute
</div>
<table style="background:none">
	<td width="80">
		<label for="snippets">Examples:&nbsp;</label>
	</td>
	<td>
		<select style="width:100%;font-size:16px;" id="snippets"></select>
	</td>
	<td width="150" align="right">
		<button id="reset-demo-db">Reset Demo Database</button>
	</td>
</table>
<br>
<iframe src="console/console.html" style="width: 100%; height: 500px; border: none; overflow: hidden;"></iframe>
<script type="text/javascript" src="/js/jquery.min.js"></script>
<script type="text/javascript">
	$.ajax({
		url : "console/snippets.xml",
		dataType : "xml"
	}).then(function(root) {
		var sel = $("#snippets");
		$("item", root).each(function(i, item) {
			sel.append(
				$('<option/>')
					.attr("value", escape(
						"/*\n * " + 
						$.trim($("description", item).text()).split(/\s*\n\s*/).join("\n * ") + "\n */\n" +
						$.trim($("sql", item).text())
					))
					.text(item.getAttribute("name"))
			);
		});

		sel.on("change", function() {
			var sql = unescape($(this).val()), len = sql.length;
			if (len) {
				frames[0].$("#in").trigger("focus").prop({
					value : sql,
					selectionStart : len,
					selectionEnd   : len
				});
			}
		});

		sel[0].selectedIndex = -1;
	}, function() {
		console.log(arguments);
	});
	(function(){
		$.get('console/classicmodels.sql').done(function (sql){
			sql = sql.replace(/[\r\n]+/g, '');
			// sql = sql.replace(/;([\r\n]|\/\*.*?\*\/)+/g, ';');
			$('#reset-demo-db').click(function(){
				frames[0].query(sql);
			});
		});
	})();
</script>
<?php require('footer.php'); ?>
