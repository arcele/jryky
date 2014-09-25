(function() {

     Logo = {};
     Logo.stage = new Kinetic.Stage(
	 { container: 'header',
	   width: window.innerWidth,
	   height: 60 }
     );
     Logo.layer = new Kinetic.Layer();

     // Gradienty lines
     Logo.gradient = {};
     Logo.gradient.lines = [];
     for(var i=0; i < 15; i++) {
	 var stroke = '#f' + String.fromCharCode((i < 10? 48 : 87) + i) + 'fff' + String.fromCharCode((i < 10? 48 : 87) + i);
	 var line = new Kinetic.Line(
	     {
		 points: [0, (i*4), window.innerWidth, (i*4)],
		 strokeWidth: 0,
		 stroke: stroke
	     }
	 );
	 Logo.layer.add(line);
	 Logo.gradient.lines.push(line);
     }

     // Create Red Line
     Logo.divider = new Kinetic.Line(
	 {
	     points: [ 0, 42, window.innerWidth, 42 ],
	     strokeWidth: 2,
	     stroke: '#f33'
	 }
     );
     Logo.layer.add(Logo.divider);


     Logo.scanner = new Kinetic.Line(
	 { 
	     points: [0, 42, Logo.stage.getWidth(),42],
	     strokeWidth: 2,
	     stroke: '#f33',
	     opacity: 0.2
	 }
     );
     Logo.layer.add(Logo.scanner);

     // Draw site name
     Logo.title = new Kinetic.Text(
	 {
	     x:25,
	     y:10,
	     text: 'jryky.com',
	     fontSize:35,
	     fontFamily: 'Calibri',
	     fill: '#333'
	 }
     );
     Logo.layer.add(Logo.title);


     // Draw motto
     var mottoText = 'just messin\' around';
     Logo.motto = new Kinetic.Text( 
	 {
	     x:window.innerWidth - (mottoText.length * 7),
	     y:42,
	     text: mottoText,
	     fontSize:12,
	     fontFamily: 'Calibri',
	     fill: '#999'
	 }
     );

     Logo.motto.on(
	 'mouseover', function() {
	     Logo.motto.setY(Math.floor(Math.random() * (Logo.stage.getHeight() - 8)));
//	     Logo.moveMotto(Math.floor(Math.random() * (Logo.stage.getWidth() - (Logo.motto.getText().length * 7))));
	     Logo.layer.draw();
	 }
     );

//     Logo.layer.add(Logo.motto);

     Logo.stage.add(Logo.layer);





// ANIMATIONS

     Logo.lineScan = new Kinetic.Animation(
	 function(frame) {
	     if(frame.timeDiff == 0) {
		 // init
		 Logo.scanner.setY(2);
		 Logo.scanner.setPoints([[0,2],[Logo.stage.getWidth(), 2]]);
	     } else {
		 if(Logo.scanner.getY() >= 42) { 
		     Logo.lineScan.stop();
		     return false;
		 } else {
		     Logo.scanner.setY(Logo.scanner.getY() + 2);
		     Logo.scanner.setPoints([[0, Logo.scanner.getX()],[Logo.stage.getWidth(), Logo.scanner.getX()]]);
		 }
	     }
	 }, Logo.layer
     )

// EVENTS

     Logo.title.on(
	 'mouseover click', function() {
	     if(!Logo.lineScan.isRunning()) Logo.lineScan.start();
	 }
     );



})();