<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
  <head>
    <title>J. Ryan Kelley - Web Developer</title>
    <meta name="description" content="Personal play space for J. Ryan Kelley, some guy who builds stuff on the internet." />
    <meta name="keywords" content="James Kelley, James Ryan Kelley, Ryan Kelley, web development, javascript, HTML5, rails, coconut water" />
    <script src="js/jquery-2.0.2.min.js"></script>
    <script src="js/kinetic.js"></script>
    <script src="js/jryky.js?v=2"></script>
    <script src="js/logo.js"></script>
    <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Droid+Sans">
    <link href="css/jryky.css?v=5" rel="stylesheet" type="text/css" />
  </head>
  <body>
<?php  	
	include_once('config/database.php');
	include_once('util/analytics.php'); 
?>
    <div id="header"></div>
    <div id="subnav">
      <div id="links">
        <a href="http://twitter.com/arcele" target="_twit"><span class="logo"><img src="img/social/twitter.png"></span><span class="text">twitter</span></a>
        <a href="http://github.com/arcele" target="_git"><span class="logo"><img src="img/social/github.png"></span><span class="text">github</span></a>
        <a href="http://linkedin.com/in/jryankelley" target="_linked"><span class="logo"><img src="img/social/linkedin.png" /></span><span class="text">linkedin</span></a>
        <a href="mailto:ryan@jryky.com"><span class="logo"><img src="img/social/email.png" /></span><span class="text">email</span></a>
        <div style="clear:both;"></div>
      </div>
    </div>
    <div id="content">
      
      <section class="blurb"><div class="profile_pic">&nbsp;</div>Hey, I'm Ryan.</section> <!-- ' -->
	
    </div>
    <div id="footer">
      &copy;2015 <a href="mailto:ryan@jryky.com">j. ryan kelley </a> | <a href="http://twitter.com/arcele" target="_out">twitter</a> | <a href="http://github.com/arcele" target="_out">GitHub</a> | <a href="http://linkedin.com/in/jryankelley" target="_out">LinkedIn</a>
    </div>
  </body>
</html>
