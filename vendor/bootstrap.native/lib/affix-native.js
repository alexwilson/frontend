// Native Javascript for Bootstrap 3 | Affix
// by dnp_theme

(function(factory){

	// CommonJS/RequireJS and "native" compatibility
	if(typeof module !== "undefined" && typeof exports == "object") {
		// A commonJS/RequireJS environment
		if(typeof window != "undefined") {
			// Window and document exist, so return the factory's return value.
			module.exports = factory();
		} else {
			// Let the user give the factory a Window and Document.
			module.exports = factory;
		}
	} else {
		// Assume a traditional browser.
		window.Affix = factory();
	}

})(function(){

	//AFFIX DEFINITION
	var Affix = function(element,options) {
		this.element = typeof element === 'object' ? element : document.querySelector(element);
		this.options = {};
		this.options.target = options.target ? ((typeof(options.target) === 'object') ? options.target : document.querySelector(options.target)) : null; // target is an object
		this.options.offsetTop = options.offsetTop && options.offsetTop ? ( options.offsetTop === 'function' ? options.offsetTop() : parseInt(options.offsetTop,0) ) : 0; // offset option is an integer number or function to determine that number
		this.options.offsetBottom = options.offsetBottom && options.offsetBottom ? ( options.offsetBottom === 'function' ? options.offsetBottom() : parseInt(options.offsetBottom,0) ) : null;

		if (this.element && (this.options.target || this.options.offsetTop || this.options.offsetBottom ) ) { this.init(); }
	}

	//AFFIX METHODS
	Affix.prototype = {
		init: function () {
			this.affixed = false;
			this.affixedBottom = false;
			this.getPinOffsetTop = 0;
			this.getPinOffsetBottom = null;

			//actions
			this.checkPosition();
			this.updateAffix();
			this.scrollEvent();
			this.resizeEvent()
		},
		processOffsetTop: function () {
			if ( this.options.target !== null ) {
				return this.targetRect().top + this.scrollOffset();
			} else if ( this.options.offsetTop !== null ) {
				return this.options.offsetTop
			}
		},
		processOffsetBottom: function () {
			if ( this.options.offsetBottom !== null ) {
				var maxScroll = this.getMaxScroll();
				return maxScroll - this.elementHeight() - this.options.offsetBottom
			}
		},
		offsetTop: function () {
			return this.processOffsetTop()
		},
		offsetBottom: function () {
			return this.processOffsetBottom()
		},
		checkPosition: function () {
			this.getPinOffsetTop = this.offsetTop
			this.getPinOffsetBottom = this.offsetBottom
		},
		scrollOffset: function () {
			return window.pageYOffset || document.documentElement.scrollTop
		},
		pinTop: function () {
			if ( this.element.classList && !this.element.classList.contains('affix') ) this.element.classList.add('affix');
			this.affixed = true
		},
		unPinTop: function () {
			if ( this.element.classList && this.element.classList.contains('affix') ) this.element.classList.remove('affix');
			this.affixed = false
		},
		pinBottom: function () {
			if ( this.element.classList && !this.element.classList.contains('affix-bottom') ) this.element.classList.add('affix-bottom');
			this.affixedBottom = true
		},
		unPinBottom: function () {
			if ( this.element.classList && this.element.classList.contains('affix-bottom') ) this.element.classList.remove('affix-bottom');
			this.affixedBottom = false
		},

		updatePin: function () {
			if (this.affixed === false && (parseInt(this.offsetTop(),0) - parseInt(this.scrollOffset(),0) < 0)) {
				this.pinTop();
			} else if (this.affixed === true && (parseInt(this.scrollOffset(),0) <= parseInt(this.getPinOffsetTop(),0) )) {
				this.unPinTop()
			}

			if (this.affixedBottom === false && (parseInt(this.offsetBottom(),0) - parseInt(this.scrollOffset(),0) < 0)) {
				this.pinBottom();
			} else if (this.affixedBottom === true && (parseInt(this.scrollOffset(),0) <= parseInt(this.getPinOffsetBottom(),0) )) {
				this.unPinBottom()
			}
		},

		updateAffix : function () { // Unpin and check position again
			this.unPinTop();
			this.unPinBottom();
			this.checkPosition()

			this.updatePin() // If any case update values again
		},

		elementHeight : function(){
			return this.element.offsetHeight
		},

		targetRect : function(){
			return this.options.target.getBoundingClientRect()
		},

		getMaxScroll : function(){
			return Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight )
		},

		scrollEvent : function(){
			var self = this;
			window.addEventListener('scroll', affOnScroll = function() {
				self.updatePin()
			}, false);

		},
		resizeEvent : function(){
			var self = this;
			window.addEventListener('resize', affOnResize = function () {
				setTimeout(function(){
					self.updateAffix()
				},100);
			}, false);

		}
	};

	var Affixes = document.querySelectorAll('[data-spy="affix"]');
	[].forEach.call(Affixes, function (item) {
		var options = {};
			options.offsetTop		= item.getAttribute('data-offset-top');
			options.offsetBottom	= item.getAttribute('data-offset-bottom');
			options.target			= item.getAttribute('data-target');

		if ( item && (options.offsetTop !== null || options.offsetBottom !== null || options.target !== null) ) { //don't do anything unless we have something valid to pin
			return new Affix(item, options);
		}
	})

	return Affix;
});
