/*******************************************
 * Atuthor: Lee Yao<yaoli@unitedstack.com>
 * Created: 2013-4-9
 * Function: topology component
 * Update: 2013-5-3
 *******************************************/

(function($, Raphael) {

	"use strict";

	var VERSION = '0.1',
		defaults = {
			space: 200,
			speed: 600,
			easing: 'linear',
			nova_color: '#86ba32',
			color: ['#00b3b2', '#f1b763', '#86ba32']

		};


	var TP = function(dom, data, options) {
		options = $.extend(defaults, options);	
		return new TP.fn.init(dom, data, options);
	}
	
	TP.fn = TP.prototype = {
		// Current version of TP
 		TP: VERSION,

		constructor: TP,

		init: function(dom, data, options) {
			var self = this;
			self.options = options;
			console.log(self.options)
			self._calculate(data, options);
			self._createCanvas(dom, options.width, options.height, function() { // Callback
				self._drawAssociation(this);
				self._drawNova(this);
				self._drawSubNet(this, data);
				self._drawRouter(this);
				self._drawServer(this);
				self._drawMask(this);
				self._listen(this);
			});

			return self;
		},

		_listen: function(paper) {
			var self = this;
			// it show be more detailed
			self.offset = [0, 0];
			// Support drag event
			self.mask.drag(function(dx, dy, x, y, ev) {
				var width = self.options.width,
					height = self.options.height;
				var pos = self.util.rebound([self.offset[0] + dx, self.offset[1] + dy], [width - self.size[0], height - self.size[1], 0, 0]);
				self.pos = pos;
				paper.setViewBox(-pos[0], -pos[1], width, height);
			}, function(x, y, ev) {

			}, function(ev) {
				self.offset = self.pos;
			});

			// Support touch event

		},

		_createCanvas: function(dom, width, height, callback) {
			if (Raphael(dom, width, height, callback)) {
				return true;
			}
			return false;
		},

		_drawSubNet: function(paper, data) {
			var self = this,
				RADIUS = 3,
				STRIPE = 19;

			paper.setStart();
			for (var i = 0, _net_len = data.subnets.length; i < _net_len; i++) {
				var _net = data.subnets[i];
				var _color = self.options.color.shift();
				self.options.color.push(_color);
				paper.rect(0, self.options.space * (i + 1), self.size[0], STRIPE, RADIUS)
					.attr({fill:_color, stroke:'none'});
				paper.text(self.options.width / 2, self.options.space * (i + 1) + 8, _net.name)
					.attr({'fill': '#fff','font-size':'12px'});
				
				paper.text(0, self.options.space * (i + 1) + STRIPE + 10, _net.ip.join(' '))
					.attr({'fill': '#000','font-size':'12px', 'text-anchor':'start'});
			}
			var set = paper.setFinish();
			return set;
		},

		_drawNova: function(paper) {
			var self = this,
				RADIUS = 3,
				STRIPE = 19,
				DESC = 'nova(external)';

			paper.setStart();
			paper.rect(0, 0, self.size[0], STRIPE, RADIUS)
				.attr({fill: self.options.nova_color, stroke: 'none'});
			paper.text(self.size[0] / 2, 9, DESC)
				.attr({'fill': '#fff','font-size':'12px'});
			var set = paper.setFinish();
			return set;
		},

		// Return router elems
		_drawRouter: function(paper) {
			paper.setStart();

			
			paper.image('./img/bg.png', 160, 70, 99, 75);
			paper.text(215, 95,'router_name\nrouter1')
				.attr({'font-size':'12px'});
			paper.text(215, 132,'router')
				.attr({'font-size':'12px', 'fill':'#fff'});
			paper.image('./img/router.png', 110, 70, 60, 75);

			var set = paper.setFinish();
			
			return set;
		},

		// Return all the server elems
		_drawServer: function(paper) {
			paper.setStart();
			paper.image('./img/bg.png', 560, 250, 99, 75);
			paper.text(615, 275,'server_name\nserver1')
				.attr({'font-size':'12px'});
			paper.text(615, 312,'server')
				.attr({'font-size':'12px', 'fill':'#fff'});
			paper.image('./img/server.png', 510, 250, 60, 75);
			var set = paper.setFinish();
			
			return set;
		},

		// Return all the association elems
		_drawAssociation: function(paper) {
			paper.setStart();
			paper.rect(136, 0, 7, 70)
				.attr({fill:'#86ba32', stroke:'none'});
			paper.rect(206, 120, 7, 70)
				.attr({fill:'#00b3b2', stroke:'none'});
			var set = paper.setFinish();
			return set;
		},

		// Create a mask to capture event handler
		_drawMask: function(paper) {
			var self = this;
			var mask = paper.rect(0, 0, self.size[0], self.size[1])
				.attr({opacity: 0, fill: '#fff', 'stroke-width': 0});
			return self.mask = mask;
		},

		// Calculate coordinates
		_calculate: function(data, options) {
			var self = this,
				size = self._calSize(data, options);
			//console.log(_width)
		},

		_calSize: function(data, options) {
			console.log(data);
			var self = this,
				lenArray = {}, // Save key-value array for calculating width automatically
				key = '',
				width = 0,
				height = (data.subnets.length + 1) * options.space,
				max = data.routers.length; // initialize max-value
			for (var i in data.servers) {
				var link = data.servers[i].link,
					key = link[0]['net_index'];
				if (lenArray[key]) {
					++lenArray[key];
					max = max < lenArray[key] ? lenArray[key] : max;
				} else {
					lenArray[key] = 1;
				}
			}
			width = max * options.space <= options.width ? options.width : max*options.space;
			return this.size = [width, height];
		}


	};

	// Deliver the init function to the TP prototype for instantiation
	TP.fn.init.prototype = TP.fn;

	// Utils
	TP.fn.util = {
		rebound: function(pos, dimension) {
			pos[0] = pos[0] < dimension[0] ? dimension[0] : pos[0];
			pos[1] = pos[1] < dimension[1] ? dimension[1] : pos[1];
			pos[0] = pos[0] > dimension[2] ? dimension[2] : pos[0];
			pos[1] = pos[1] > dimension[3] ? dimension[3] : pos[1];
			return pos;
		}
	}

	if (typeof window === "object" && typeof window.document === "object") {
		window.TP = TP;	
	}

	
})(jQuery, Raphael);