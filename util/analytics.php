<?php
// Assumes $database config file already included

// Count the visit?
if(!$_GET || $_GET['skip'] == null) {
	$connection = @mysql_connect($database['server'], $database['login'], $database['password']);
	if(!$connection) {
		// Can't connect?  Don't bail, we're only trying to log the users who hit the site.
		echo "<!-- ERROR:" . mysql_error() . " -->";
	} else {
	  
	  mysql_select_db($database['db']);
		$remoteAddress = isset($_SERVER['REMOTE_ADDR'])? $_SERVER['REMOTE_ADDR'] : 'N/A';
		$referer = isset($_SERVER['HTTP_REFERER'])? $_SERVER['HTTP_REFERER'] : '';
		$result = mysql_query("INSERT into hits(ip, referer) VALUES ('". $remoteAddress ."', '". $referer ."');");
		//		echo "<!-- INSERT into hits(ip, referer) VALUES ('". $remoteAddress ."', '". $referer ."'); -->";
		mysql_close($connection);
	}
}
?>