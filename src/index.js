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
			density: [190, 200],
			lean: 120, // Space under lean-mode
			transverse: 19,
			radius: 3,
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
			self._calculate(data);
			self._createCanvas(dom, options.width, options.height, function() { // Callback
				self._drawRouter(this, data);
				self._drawServer(this, data);
				self._drawNova(this);
				self._drawSubNet(this, data);

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
				transverse = 19;

			paper.setStart();
			for (var i = 0, _net_len = data.subnets.length; i < _net_len; i++) {
				var _net = data.subnets[i];
				var _color = self.options.color[i % self.options.color.length];
				paper.rect(0, self.options.density[1] * (i + 1), self.size[0], transverse, RADIUS)
					.attr({fill:_color, stroke:'none'});
				paper.text(self.options.width / 2, self.options.density[1] * (i + 1) + 8, _net.name)
					.attr({'fill': '#fff','font-size':'12px'});
				
				paper.text(0, self.options.density[1] * (i + 1) + transverse + 10, _net.ip.join(' '))
					.attr({'fill': '#000','font-size':'12px', 'text-anchor':'start'});
			}
			var set = paper.setFinish();
			return set;
		},

		_drawNova: function(paper) {
			var self = this,
				RADIUS = 3,
				transverse = 19,
				DESC = 'nova(external)';

			paper.setStart();
			paper.rect(0, 0, self.size[0], transverse, RADIUS)
				.attr({fill: self.options.nova_color, stroke: 'none'});
			paper.text(self.size[0] / 2, 9, DESC)
				.attr({'fill': '#fff','font-size':'12px'});
			var set = paper.setFinish();
			return set;
		},

		// Return router elems
		_drawRouter: function(paper, data) {
			var self = this,
				options = self.options,
				density = options.density,
				transverse = options.transverse,
				isLean = self.isLean,
				len = data.routers.length,
				IMAGE_BG = './img/bg.png',
				IMAGE_ROUTER = './img/router.png',
				IMAGE_HEIGHT = 75,
				IMAGE_BG_WIDTH = 99,
				IMAGE_ROUTER_WIDTH = 60,
				STRIP_WIDTH = 7,
				_distance = self.size[0] / len,
				_offset = isLean ? (_distance - IMAGE_ROUTER_WIDTH) / 2 : (_distance - IMAGE_BG_WIDTH - IMAGE_ROUTER_WIDTH) / 2,
				posY = (density[1] - IMAGE_HEIGHT + transverse) / 2;

			paper.setStart();
			for (var i = 0; i < len; i++) {
				var router = data.routers[i];
				var posX = (_offset + _distance * i);
				var link = router.link;
				console.log(link)

				paper.rect(posX + (IMAGE_ROUTER_WIDTH - STRIP_WIDTH) / 2, 5, STRIP_WIDTH, posY + 5)
					.attr({fill: options.nova_color, stroke:'none'});
				paper.rect(posX + (IMAGE_ROUTER_WIDTH - STRIP_WIDTH) / 2, posY + IMAGE_HEIGHT - 5, STRIP_WIDTH, posY + link.net_index * options.density[1] - 5)
					.attr({fill: options.color[link.net_index % options.color.length], stroke:'none'});
				paper.text(posX + 40, posY + IMAGE_HEIGHT + 25, link.ip)
					.attr({'font-size':'10px', 'text-anchor':'start'});
				paper.image(IMAGE_BG, posX + IMAGE_ROUTER_WIDTH - 10, posY, IMAGE_BG_WIDTH, IMAGE_HEIGHT);
				paper.text(posX + 104, posY + 28, router.name)
					.attr({'font-size':'12px'});
				paper.text(posX + 104, posY + 62, 'router')
					.attr({'font-size':'12px', 'fill':'#fff'});
				paper.image(IMAGE_ROUTER, posX, posY, IMAGE_ROUTER_WIDTH, IMAGE_HEIGHT);
			}
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

		// Create a mask to capture event handler
		_drawMask: function(paper) {
			var self = this;
			var mask = paper.rect(0, 0, self.size[0], self.size[1])
				.attr({opacity: 0, fill: '#fff', 'stroke-width': 0});
			return self.mask = mask;
		},

		// Calculate coordinates
		_calculate: function(data) {
			var self = this,
				size = self._calSize(data);
			//console.log(_width)
		},

		_calSize: function(data) {
			//console.log(data);
			var self = this,
				options = self.options,
				lenArray = {}, // Save key-value array for calculating width automatically
				key = '',
				width = 0,
				height = (data.subnets.length + 1) * options.density[1],
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

			// Automatically calculate width and layout mode
			if (options.lean * max >= options.width) {
				width = options.lean * max;
				self.isLean = true; // Layout mode
			} else {
				self.isLean = options.density[0] * max <= options.width ? false : true;
				width = options.width;
			}

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