(function() {

	Logo = {};

	Logo.config = {
		LOGO_COLOR: "#CFCFCF",
		ZOOMED_LOGO_COLOR: "#EFEFFF",
		LOGO_TEXT_FONT_SIZE: 30,
		LOGO_TEXT_MAX_SIZE: 60,
		LOGO_TEXT_OPACITY: .8,
		DOT_ANGULAR_SPEED_MULTIPLIER: 10,
		DOT_ROTATION_SPEED: 360 / 150000,
		DOT_PRIMARY_COLOR: "#2F2669",
		DOT_SECONDARY_COLOR: "#BF4799"
	};

	Logo.stage = new Kinetic.Stage( { 
		container: 'header',
		width: window.innerWidth,
		height: 160
	} );
	Logo.layer = new Kinetic.Layer();

	// Circles
	Logo.dotGroupA = new Kinetic.Group( {
		x: Logo.stage.getWidth() / 2, 
		y:50, 
		offset: {x:350, y:350}
	} );
	Logo.dotGroupB = new Kinetic.Group( {
		x: Logo.stage.getWidth() / 2, 
		y:50, 
		offset: {x:350, y:350}
	} );

	for(var i = 0; i < 15; i++) {		
		for(var j = 0; j < 15; j++) {
			var circle = new Kinetic.Circle( {
				radius: 10 + Math.random() * 6,
				fill: Math.floor(Math.random() * 2) == 1 ? Logo.config.DOT_PRIMARY_COLOR : Logo.config.DOT_SECONDARY_COLOR,
				strokeWidth: 0,
				opacity: .3 + Math.random() / 5,
				x: i * 50 + Math.random() * 15,
				y: j * 50 + Math.random() * 15
			} );
			Math.floor(Math.random() * 2)  == 1 ? Logo.dotGroupA.add(circle) : Logo.dotGroupB.add(circle);
		}
	}
	Logo.layer.add(Logo.dotGroupA);
	Logo.layer.add(Logo.dotGroupB);
	Logo.stage.add(Logo.layer);

	Logo.dotGroupA.setRotation(Math.random() * 360);
	Logo.dotGroupB.setRotation(Math.random() * 360);
	Logo.dotGroupA.draw();
	Logo.dotGroupB.draw();

	Logo.title = new Kinetic.Text( {
		x: Logo.stage.getWidth() / 2 - 85,
		y: 30,
		text: 'j. ryan kelley',
		fontSize: Logo.config.LOGO_TEXT_FONT_SIZE,
		fontFamily: 'Calibri',
		fill: Logo.config.LOGO_COLOR,
		opacity: Logo.config.LOGO_TEXT_OPACITY
	} );
	Logo.layer.add(Logo.title);
	
	// ANIMATIONS
	Logo.angularSpeed = Logo.config.DOT_ROTATION_SPEED;
	Logo.rotateDots = new Kinetic.Animation(
		function(frame) {
			var angleDiff = frame.timeDiff * Logo.angularSpeed;
			Logo.dotGroupA.rotate(.3 * angleDiff);
			Logo.dotGroupB.rotate(angleDiff);
		}, Logo.layer
	);
	Logo.rotateDots.start();

	Logo.expandTitleFont = new Kinetic.Animation(
		function(frame) {
			if(Logo.title.getFontSize() >= Logo.config.LOGO_TEXT_MAX_SIZE) {
				return false;
				this.stop();
			}
			Logo.title.fontSize(Logo.title.getFontSize() + 3);
			Logo.title.setX(Logo.title.getX() - 5);
		}
	);
	Logo.compressTitleFont = new Kinetic.Animation(
		function(frame) {
			if(Logo.title.getFontSize() <= 35) {
				return false;
				this.stop();
			}
			Logo.title.fontSize(Logo.title.getFontSize() - 6);
			Logo.title.setX(Logo.title.getX() + 10)
		}
	);

	// EVENTS
	Logo.title.on( 'mouseover click', function() {
		Logo.angularSpeed /= Logo.config.DOT_ANGULAR_SPEED_MULTIPLIER;
		Logo.compressTitleFont.stop();
		Logo.expandTitleFont.start();
		Logo.title.fill(Logo.config.ZOOMED_LOGO_COLOR);
	} );
	Logo.title.on( 'mouseout', function() {
		Logo.angularSpeed *= Logo.config.DOT_ANGULAR_SPEED_MULTIPLIER;
		Logo.expandTitleFont.stop();
		Logo.compressTitleFont.start();
		Logo.title.fill(Logo.config.LOGO_COLOR);
	})

})();