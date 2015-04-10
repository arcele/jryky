(function() {
	var instance;


	Brand = function Brand(dom) {
		// Class to control the theme being used for the js header and the css managed document
		this.dom = dom;
		this.theme = Themes['DeepPurple']; // Default Theme
		this.elements = Elements;
		this.logo = new Logo(this.theme);


		this.dom.find('body').addClass(this.theme.NAME);
		for(key in this.elements) {
			var el = this.elements[key];
			this.dom.find(key).css(el.property, this.theme[el.attribute]);
		}

	};

	Themes = {
		'DeepPurple':  {
			NAME: 'DeepPurple',
			LOGO_COLOR: "#CFCFCF",
			ZOOMED_LOGO_COLOR: "#EFEFFF",
			LOGO_TEXT_FONT_SIZE: 30,
			LOGO_TEXT_MAX_SIZE: 60,
			LOGO_TEXT_OPACITY: .8,
			DOT_ANGULAR_SPEED_MULTIPLIER: 10,
			DOT_ROTATION_SPEED: 360 / 150000,
			DOT_PRIMARY_COLOR: "#2F2669",
			DOT_SECONDARY_COLOR: "#BF4799",
			BACKGROUND_COLOR: '#212121'		
		},
		'MidnightGreen': {
			NAME: 'MidnightGreen',
			LOGO_COLOR: "#A5ACAF",
			ZOOMED_LOGO_COLOR: "#565A5C",
			LOGO_TEXT_FONT_SIZE: 30,
			LOGO_TEXT_MAX_SIZE: 60,
			LOGO_TEXT_OPACITY: .9,
			DOT_ANGULAR_SPEED_MULTIPLIER: 10,
			DOT_ROTATION_SPEED: 360 / 150000,
			DOT_PRIMARY_COLOR: "#004953",
			DOT_SECONDARY_COLOR: "#000000",
			BACKGROUND_COLOR: '#FFFFFF'			
		}
	};

	// element selectors, their properties, and their theme attribute to use
	Elements = {
		'body': {
			'property' :'background-color',
			'attribute':'BACKGROUND_COLOR'
		},
		'#subnav #links a' : {
			'property' :'background-color',
			'attribute': 'DOT_PRIMARY_COLOR'
		}
	}



	Logo = function Logo(config) {
		if(instance) {
			return instance;
		}
		instance = this;

		this.config = config; //Themes.DeepPurple;

		this.stage = new Kinetic.Stage( { 
			container: 'header',
			width: window.innerWidth,
			height: 110
		} );
		this.layer = new Kinetic.Layer();

		// Circles
		this.dotGroupA = new Kinetic.Group( {
			x: this.stage.getWidth() / 2, 
			y:50, 
			offset: {x:350, y:350}
		} );
		this.dotGroupB = new Kinetic.Group( {
			x: this.stage.getWidth() / 2, 
			y:50, 
			offset: {x:350, y:350}
		} );

		for(var i = 0; i < 15; i++) {		
			for(var j = 0; j < 15; j++) {
				var circle = new Kinetic.Circle( {
					radius: 10 + Math.random() * 6,
					fill: Math.floor(Math.random() * 2) == 1 ? this.config.DOT_PRIMARY_COLOR : this.config.DOT_SECONDARY_COLOR,
					strokeWidth: 0,
					opacity: .3 + Math.random() / 5,
					x: i * 50 + Math.random() * 15,
					y: j * 50 + Math.random() * 15
				} );
				Math.floor(Math.random() * 2)  == 1 ? this.dotGroupA.add(circle) : this.dotGroupB.add(circle);
			}
		}
		this.layer.add(this.dotGroupA);
		this.layer.add(this.dotGroupB);
		this.stage.add(this.layer);

		this.dotGroupA.setRotation(Math.random() * 360);
		this.dotGroupB.setRotation(Math.random() * 360);
		this.dotGroupA.draw();
		this.dotGroupB.draw();

		this.title = new Kinetic.Text( {
			x: this.stage.getWidth() / 2 - 85,
			y: 30,
			text: 'j. ryan kelley',
			fontSize: this.config.LOGO_TEXT_FONT_SIZE,
			fontFamily: 'Calibri',
			fill: this.config.LOGO_COLOR,
			opacity: this.config.LOGO_TEXT_OPACITY
		} );
		this.layer.add(this.title);
		
		// ANIMATIONS
		this.angularSpeed = this.config.DOT_ROTATION_SPEED;
		this.rotateDots = new Kinetic.Animation(
			function(frame) {
				var angleDiff = frame.timeDiff * this.angularSpeed;
				this.dotGroupA.rotate(.3 * angleDiff);
				this.dotGroupB.rotate(angleDiff);
			}.bind(this), this.layer
		);
		this.rotateDots.start();

		this.expandTitleFont = new Kinetic.Animation(
			function(frame) {
				if(this.title.getFontSize() >= this.config.LOGO_TEXT_MAX_SIZE) {
					return false;
					this.stop();
				}
				this.title.fontSize(this.title.getFontSize() + 3);
				this.title.setX(this.title.getX() - 5);
			}.bind(this)
		);
		this.compressTitleFont = new Kinetic.Animation(
			function(frame) {
				if(this.title.getFontSize() <= 35) {
					return false;
					this.stop();
				}
				this.title.fontSize(this.title.getFontSize() - 6);
				this.title.setX(this.title.getX() + 10)
			}.bind(this)
		);

		// EVENTS
		this.title.on( 'mouseover click', function() {
			this.angularSpeed /= this.config.DOT_ANGULAR_SPEED_MULTIPLIER;
			this.compressTitleFont.stop();
			this.expandTitleFont.start();
			this.title.fill(this.config.ZOOMED_LOGO_COLOR);
		}.bind(this));
		this.title.on( 'mouseout', function() {
			this.angularSpeed *= this.config.DOT_ANGULAR_SPEED_MULTIPLIER;
			this.expandTitleFont.stop();
			this.compressTitleFont.start();
			this.title.fill(this.config.LOGO_COLOR);
		}.bind(this));
	};

})();