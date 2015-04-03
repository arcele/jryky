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
    <link href="css/jryky.css?v=2" rel="stylesheet" type="text/css" />
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
        <a href="http://facebook.com/jryankelley" target="_face"><span class="logo"><img src="img/social/facebook.png"></span><span class="text">facebook</span></a>
        <a href="http://github.com/arcele" target="_git"><span class="logo"><img src="img/social/github.png"></span><span class="text">github</span></a>
        <a href="http://linkedin.com/in/jryankelley" target="_linked"><span class="logo"><img src="img/social/linkedin.png" /></span><span class="text">linkedin</span></a>
        <a href="mailto:ryan@jryky.com"><span class="logo"><img src="img/social/email.png" /></span><span class="text">email</span></a>
      </div>
    </div>
    <div id="content">
      <section class="blurb">
        <div class="profile_pic"></div>
        <p>I'm Ryan.  I like to build stuff on the internet. I'm a front end engineer, currently based out of Seattle, originally from Delaware.  I've been doing this kind of stuff for fun since 1998 and professionally since 2003.</p>
        <p>It turns out that building stuff on the internet is actually pretty easy, there's great communities that have done a lot of the heavy lifting for developers everywhere.  When it comes to DOM manipulation <a href="https://jquery.com/">jQuery is king</a> and has been since, like, 2009.  When I first started playing with canvas manipulation, I chose <a href="http://kineticjs.com/" target="_new">Kinetic</a>.  Sadly, it's no longer maintained (although the final version is pretty solid) and all of the public docs got taken down.  It's still a pretty great chunk of code.  If you've got a reccomendation for a particularly sweet canvas library, <a href="mailto:ryan@jryky.com">hit me up</a>.</p>
      </section>      

      <section class="blurb">
	<p>Here's some stuff that I'm building now to play with technologies and keep sharp.</p>
	<ul>
	  <li><a href="http://www.cochl.com" target="_cochl"><img src="img/bass.jpg" />Tab Entry</a>.  Direct canvas manipulation using <a href="http://jquery.com/" target="_out">jQuery</a> to allow users to enter Guitar/Bass tabs.  Click on the strings to add notes, keep clicking the same note to increment the fret.  If you don't know anything about Tablature, <a href="http://en.wikipedia.org/wiki/Tablature" target="_out">learn more here</a>.</li>
	  <li><a href="http://www.nwbhf.com" target="nwbhf"><img src="img/bubblehockey.jpg" />Bubble Hockey.</a> Bubble hockey game using <a href="http://kineticjs.com/" target="_out">KineticJS</a> to interact with the canvas object.</li> 
	  <li><img src="img/logobuilder.PNG" /><a href="http://www.retirethe5.com" target="_retire5">Logo Displayer</a>. Displays an HTML5 team logo that can be used cross-platform to brand your team across all of your devices.  Written using <a href="http://kineticjs.com/" target="_out">KineticJS</a>.  Load it up and it will give you a random team logo, refresh for a new one, <a href="http://www.retirethe5.com/?&backStyle=habs&backColor=000088&foreColor=3333FF&logoLetter=W|V&fontColor=CFB53B&fontFamily=Calibri" target="_retire5">or, it will create logos with passed in parameters.</a></li>
	  <li><img src="img/grady.png" /><a href="http://www.wieddoggs.com" target="_dogs">Wieddoggs.com</a>, a website about my family's dogs that I put together for my Mom for her birthday.  It's all custom built with css animations and a very basic photo gallery.</li>
  </ul>
      </section>

      <section class="blurb">
	<p>If you want to know more, or you just want to go grab a beer with me to catch a birds game, <a href="mailto:ryan@jryky.com">shoot me an e-mail</a>
      </section>
	</div>

    <div id="footer">
      &copy;2015 <a href="mailto:ryan@jryky.com">j. ryan kelley </a> | <a href="http://twitter.com/arcele" target="_out">twitter</a> | <a href="http://facebook.com/jryankelley" target="_out">facebook</a> | <a href="http://linkedin.com/in/jryankelley" target="_out">LinkedIn</a> | <a href="http://github.com/arcele" target="_out">GitHub</a>
    </div>
  </body>
</html>
