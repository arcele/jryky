(function() {

     Site = {};
     Site.layers = [];
     Site.stage = new Kinetic.Stage(
	 { container: 'container',
	   width: 680,
	   height: 340
	 }
     );

     var baseLayer = new Kinetic.Layer();
     Site.layers.push(baseLayer);
     
     var border = new Kinetic.Rect(
	 { x:0,
	   y:0,
	   width:680,
	   height:340,
	   fill: '#F4FFF4',
	   stroke: '#333',
	   strokeWidth: 4
	 }
     );
     baseLayer.add(border);

     var myNameText = 'racecar';
     var myNameArray = [];

     // Draw name
     for(var i = 0; i < myNameText.length; i++) {
	 myNameArray.push(
	     new Kinetic.Text(
		 {
		     x:275 + (i*9), // ~9 pixels per character?
		     y: 10,
		     fontSize:25,
		     text: myNameText[i],
		     fontFamily: 'monospace', //'Calibri',
		     fill: '333'
		 }
	     )
	 );
	 baseLayer.add(myNameArray[myNameArray.length-1]);
     }

     // Create single animation to animate each letter individually 
     Site.nameAnimation = new Kinetic.Animation(
	 function(frame) {
	     for(i = 0; i < myNameArray.length; i++) {
//		 myNameArray[i].setX((75 + (25*i)) * Math.sin(frame.time * 2 * Math.PI / 40000) + 275 + (i * 9));
		 myNameArray[i].setX((75 + (5*i)) * Math.sin(frame.time * 2 * Math.PI / (40000+(i*80))) + 275 + (i * 9));
	     }
	 }, baseLayer
     );
     Site.nameAnimation.start();


/* Whole name as one text item
     var myName = new Kinetic.Text(
	 {
	     x:275,
	     y:10,
	     text: myNameText,
	     fontSize:25,
	     fontFamily: 'Calibri',
	     fill: '#333'
	 }
     );

     baseLayer.add(myName);
*/


     Site.stage.add(baseLayer);

/*
     var anim = new Kinetic.Animation(
	 function(frame) {
	     myName.setX(100 * Math.sin(frame.time * 2 * Math.PI / 40000) + 275);
	 }, baseLayer
     );
*/
//     anim.start();

     console.log("Unh huh.", Site);
}) ();