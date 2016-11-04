<!DOCTYPE html>
 <head>
  <title>These are your hits, dog</title>
  <link rel="stylesheet" href="css/hits.css" />
 </head>
 <body>

<?php
include_once('config/database.php');  // Config file contains $database declaraion
$connection = mysql_connect($database['server'], $database['login'], $database['password']);
if(!$connection) {
  die("Can't connect to db. ". mysql_error());
}
mysql_select_db('jryankel_jryky');

$countQueryString = "SELECT count(*) as total from hits";

$firstResult = 0;
$resultsPerPage = 25;
$additionalParams = '';
if(isset($_GET['f'])) {
	$firstResult = $_GET['f'];	
}

$queryString = "SELECT * FROM hits";
if(isset($_GET['r'])) {
	// Select results only for specified referer
	$queryString .= " WHERE referer = '". $_GET['r'] ."'";
	$countQueryString .= " WHERE referer = '". $_GET['r'] ."'";
	echo '<p>Showing results for referer: <a href="' . $_GET['r'] . '">' . $_GET['r'] . '</a></p>';
	echo '<p><a href="hits.php">Show All Results</a></p>';
	$additionalParams = "&r=" . urlencode($_GET['r']);
}
else if(isset($_GET['ip'])) {
	// Select results only for specified ip address
	$queryString .= " WHERE ip = '". $_GET['ip'] ."'";
	$countQueryString .= " WHERE ip = '". $_GET['ip'] ."'";
	echo '<p>Showing results for ip: '. $_GET['ip'] .".</p>";
	echo '<p><a href="hits.php">Show All Results</a></p>';
	$additionalParams = "&ip=" . urlencode($_GET['ip']);
}

$queryString .= " ORDER BY id desc limit " . $firstResult . ", " . $resultsPerPage;
$query = mysql_query($queryString);
$countQuery = mysql_query($countQueryString);
$count = mysql_fetch_array($countQuery);  // $count['total'] holds total number of hits.


echo '<table>';
echo '<tr><th>id</th><th>ip</th><th>host</th><th>referer</th><th>when</th></tr>';
$updateHosts = false;
$updateHostString = "INSERT into hits(id, host) VALUES ";

while($row = mysql_fetch_assoc($query)) {
  $host = $row['host'];
  if(is_null($row['host'])) {
    $updateHosts = true;
    // attempt to resolve the host and save it to the db
    $host = gethostbyaddr($row['ip']);
    if(is_null($host)) {
      $host = "--";
    }
    $updateHostString .= " (". $row['id'] .",'". gethostbyaddr($row['ip']) . "'),";
   
  }
  echo '<tr><td>'. $row['id'] .'</td>';
  echo '<td><a href="?ip='. urlencode($row['ip']).'">'. $row['ip'] .'</a></td>';
  echo '<td>' . $host . '</td>';
  echo '<td>';
  if($row['referer'] != '') {
    echo '<a href="?r=' . urlencode($row['referer']) . '">' . substr($row['referer'], 0, 64) . (strlen($row['referer']) > 64 ? '...' : '') .'</a>';
  } else {
  	'-';
  }
  echo '<td>'. $row['ts_created'] .'</td></tr>';
}
if($updateHosts) {
  $updateHostString = rtrim($updateHostString, ","); // remove trailing comma
  $updateHostString .= " ON DUPLICATE KEY UPDATE host=VALUES(host)";
  mysql_query($updateHostString);
}
mysql_close($connection);
echo '</table>';

if($firstResult + $resultsPerPage < $count['total']) {
	echo '<a href="?f='. ($firstResult + $resultsPerPage) . $additionalParams .'">&laquo; older</a>';
	echo '&nbsp;&nbsp;&nbsp;';
}
if($firstResult > 0) {
	echo '<a href="?f='. max($firstResult-25, 0). $additionalParams .'">newer &raquo;</a>';
}
?>

 </body>
</html>