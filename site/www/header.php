<?php

if (!isset($title))
	$title = 'Home';

if (!isset($head))
	$head  = '';

?><!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title>JSSQL - <?php echo $title; ?></title>
		<link rel="shortcut icon" type="image/png" href="favicon.png">
		<?php echo $head; ?>
		<link href="style.css" type="text/css" rel="stylesheet" />
	</head>
	<body>
		<div id="main">
			<div class="header">
				<img name="logo" alt="JSSQL Logo" width="64" height="64" src="logo.png" style="vertical-align:middle;margin-right:1em;">
				<a href="/">Home</a> | 
				<a href="/">Manual</a> | 
				<a href="/jsdoc.php">API</a> | 
				<a href="/console.php">Demo</a> | 
				<a href="/download.php">Download</a> |
				<a href="/tests.php">Unit Tests</a>
			</div>
			<br>
			<div class="container">
