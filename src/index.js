/*******************************************
 * Author: Lee Yao<yaoli@unitedstack.com>
 * Created: 2013-4-9
 * Description: topology component
 * Update: 2013-6-1
 *******************************************/

(function($, Raphael) {

	"use strict";

	var VERSION = '0.1',
		defaults = {
			density: [190, 200],
			lean: 100,
			transverse: 19,
			radius: 3,
			speed: 600,
			easing: 'linear',
			nova_color: '#86ba32',
			color: ['#00b3b2', '#f1b763', '#86ba32']
		};

	/**
	 * Vitual network topology module based on Raphael
	 * @module VirtualNT
	 * @param {String} dom which contains the svg graphics
	 * @param {Object} topology data
	 * @param {Object} options are used to customise styles of graphics
	 * @returns {Object}
	 */
	var VirtualNT = function(dom, data, options) {
		options = $.extend(defaults, options);	
		return new VirtualNT.fn.init(dom, data, options);
	}
	
	VirtualNT.fn = VirtualNT.prototype = {
		// Current version of VirtualNT
 		version: VERSION,

		constructor: VirtualNT,

		init: function(dom, data, options) {
			var self = this;
			self.options = options;
			self._calSize(data);
			self._createCanvas(dom, options.width, options.height, function() { // Callback
				self.paper = this;
				self._drawMask(this);
				self._drawNova(this);
				self._drawSubNet(this, data);
				self._drawServer(this, data);
				self._drawRouter(this, data);
				self._listen(this);
			});

			return self;
		},

		_listen: function(paper) {
			var self = this;
			// Support drag event
			self.offset = [0, 0];
			self.mask.drag($.proxy(self._drag, self), function(x, y, ev) {
			
			}, function(ev) {
				self.offset = self.pos;
			});

			if (self.isLean) {
				self.routerSet.hover(function() {
					self._mouseOver(this, self);
				}, function() {
					self._mouseOut(this, self);
				});
				self.serverSet.hover(function() {
					self._mouseOver(this, self);
				}, function() {
					self._mouseOut(this, self);
				});
			}
		},

		_drag: function(dx, dy, x, y, ev) {
			var self = this;
			var width = self.options.width,
				height = self.options.height;
			var pos = self.util.rebound([self.offset[0] + dx, self.offset[1] + dy], 
					[width - self.size[0], height - self.size[1], 0, 0]);
			self.pos = pos;
			self.paper.setViewBox(-pos[0], -pos[1], width, height);
		},

		_mouseOver: function(context, glob) {
			var self = context,
				paper = glob.paper;
			if(!glob.mouseovered || glob.mouseovered == false) {
				glob.mouseovered = true;
				var _id = self.id - 1;
				var set = paper.set();
				set.push(paper.getById(_id));
				set.push(paper.getById(--_id));
				set.push(paper.getById(--_id));
				set.toFront();
				self.toFront();
				set.show().animate({'opacity': 1}, glob.options.speed);
			}
		},

		_mouseOut: function(context, glob) {
			glob.mouseovered = false;
			var self = context,
				paper = glob.paper;
			var _id = self.id - 1;
			var set = paper.set();
			set.push(paper.getById(_id));
			set.push(paper.getById(--_id));
			set.push(paper.getById(--_id));
			set.animate({'opacity': 0}, glob.options.speed, function() {
				set.hide();
			});
		},

		_createCanvas: function(dom, width, height, callback) {
			if (Raphael(dom, width, height, callback)) {
				return true;
			}
			return false;
		},

		_drawSubNet: function(paper, data) {
			var self = this,
				RADIUS = self.options.radius,
				transverse = 19;

			paper.setStart();
			for (var i = 0, _net_len = data.subnets.length; i < _net_len; i++) {
				var _net = data.subnets[i];
				var _color = self.options.color[i % self.options.color.length];
				paper.text(self.options.width / 2, self.options.density[1] * (i + 1) + 8, _net.name)
					.attr({'fill': '#fff','font-size':'12px'}).toBack();
				paper.rect(0, self.options.density[1] * (i + 1), self.size[0], transverse, RADIUS)
					.attr({fill:_color, stroke:'none'}).toBack();
				for (var k = 0, _ip_len = _net.ip.length; k < _ip_len; k++) {
					paper.text(k * 100, self.options.density[1] * (i + 1) + transverse + 13, _net.ip[k])
					.attr({'fill': '#000','font-size':'15px', 'text-anchor':'start'}).toBack();
				}
				
			}
			var set = paper.setFinish();
			return set;
		},

		_drawNova: function(paper) {
			var self = this,
				RADIUS = self.options.radius,
				transverse = 19,
				DESC = 'nova(external)';

			paper.setStart();
			paper.text(self.options.width / 2, 9, DESC)
				.attr({'fill': '#fff','font-size':'12px'})
				.toBack();
			paper.rect(0, 0, self.size[0], transverse, RADIUS)
				.attr({fill: self.options.nova_color, stroke: 'none'})
				.toBack();
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
				opacity = isLean ? 0 : 1,
				posY = (density[1] - IMAGE_HEIGHT + transverse) / 2,
				xArray = self.util.division(isLean ? IMAGE_ROUTER_WIDTH : IMAGE_ROUTER_WIDTH + IMAGE_BG_WIDTH, len, self.size[0]);

			var set = paper.set();
			for (var i = 0; i < len; i++) {
				var router = data.routers[i],
					posX = xArray[i],
					link = router.link;
				paper.rect(posX + (IMAGE_ROUTER_WIDTH - STRIP_WIDTH) / 2, 5, STRIP_WIDTH, posY + 5)
					.attr({fill: options.nova_color, stroke:'none'}).toBack();
				paper.rect(posX + (IMAGE_ROUTER_WIDTH - STRIP_WIDTH) / 2, posY + IMAGE_HEIGHT - 5, 
					STRIP_WIDTH, posY + link.net_index * options.density[1] - 5)
					.attr({fill: options.color[link.net_index % options.color.length], stroke:'none'}).toBack();
				paper.text(posX + 40, posY + IMAGE_HEIGHT + 25, link.ip)
					.attr({'font-size': '12px', 'text-anchor': 'start'}).toBack();
				paper.text(posX + 104, posY + 28, router.name)
					.attr({'font-size': '12px', 'opacity': opacity}).toBack();
				paper.text(posX + 104, posY + 62, 'router')
					.attr({'font-size':'12px', 'fill':'#fff', 'opacity': opacity}).toBack();
				paper.image(IMAGE_BG, posX + IMAGE_ROUTER_WIDTH - 10, posY, IMAGE_BG_WIDTH, IMAGE_HEIGHT)
					.attr({'opacity': opacity}).toBack();
				var router = paper.image(IMAGE_ROUTER, posX, posY, IMAGE_ROUTER_WIDTH, IMAGE_HEIGHT)
					.attr({'cursor': 'pointer'});
				set.push(router);
			}

			return self.routerSet = set;
		},

		// Return all the server elems
		_drawServer: function(paper, data) {
			var self = this,
				options = self.options,
				isLean = self.isLean,
				transverse = options.transverse,
				servers = data.servers,
				len = servers.length,
				IMAGE_BG = './img/bg.png',
				IMAGE_SERVER = './img/server.png',
				IMAGE_HEIGHT = 75,
				IMAGE_BG_WIDTH = 99,
				IMAGE_SERVER_WIDTH = 60,
				STRIP_WIDTH = 7,
				cursor = 0,
				opacity = isLean ? 0 : 1,
				link_height = (options.density[1] - IMAGE_HEIGHT + transverse) / 2;
			var serverGroup = {};
			for (var k in servers) {
				var link = servers[k].link,
					key = link[0].net_index;
				serverGroup[key] = serverGroup[key] ? ++serverGroup[key] : 1;
			}
			var set = paper.set();
			for (var i in serverGroup) {
				var self = this,
					i = Number(i),
					server_height = options.density[1] * (i + 1.5) + transverse / 2 - IMAGE_HEIGHT / 2 ;
				var xArray = self.util.division(isLean ? IMAGE_SERVER_WIDTH : IMAGE_SERVER_WIDTH + IMAGE_BG_WIDTH, serverGroup[i], self.size[0]);
				for (var m in xArray) {
					var index = Number(m);
					for (var n = 0, _link_len = servers[cursor].link.length; n < _link_len; n++) {
						if (n === 0) {
							paper.rect(xArray[index] + (IMAGE_SERVER_WIDTH - STRIP_WIDTH) / 2, 
								options.density[1]*(i + 1) + 5, STRIP_WIDTH, link_height)
								.attr({fill: options.color[i % options.color.length], stroke:'none'})
								.toBack();
							paper.text(xArray[index] + (IMAGE_SERVER_WIDTH - STRIP_WIDTH) / 2 + 10, 
								 options.density[1]*(i + 1.25) - 0.25*IMAGE_HEIGHT + 15, servers[cursor].link[0].ip)
								.attr({'font-size':'12px', 'text-anchor': 'start'})
								.toBack();
						} else {
							var offset_height = options.density[1] * (servers[cursor].link[n].net_index - i - 1);
							var ticksX = self.util.division(STRIP_WIDTH, _link_len - 1, IMAGE_SERVER_WIDTH);
							var ticksY = self.util.division(0, _link_len - 1, (options.density[1] - IMAGE_HEIGHT) / 2);
							paper.rect(xArray[index] + ticksX[n- 1], 
								options.density[1]*(i + 1.5) + (options.transverse + IMAGE_HEIGHT) / 2 , 
								STRIP_WIDTH, link_height + offset_height)
								.attr({fill: options.color[servers[cursor].link[n].net_index % options.color.length], stroke:'none'})
								.toBack();
							paper.text(xArray[index] + ticksX[n- 1] + 10, 
								 options.density[1] * (i + 1.5) + 0.5 * IMAGE_HEIGHT + ticksY[n-1] + 5, servers[cursor].link[n].ip)
								.attr({'font-size':'12px', 'text-anchor': 'start'})
								.toBack();
						} 
					};
					paper.text(xArray[index] + 104, server_height + 28, servers[cursor].name)
						.attr({'font-size':'12px', 'opacity': opacity}).toBack();
					paper.text(xArray[index] + 104, server_height + 62, 'server')
						.attr({'font-size':'12px', 'fill':'#fff', 'opacity': opacity}).toBack();
					paper.image(IMAGE_BG, xArray[index] + IMAGE_SERVER_WIDTH - 10, server_height , IMAGE_BG_WIDTH, IMAGE_HEIGHT)
						.attr({'opacity': opacity}).toBack();
					var server = paper.image(IMAGE_SERVER, xArray[index], server_height, IMAGE_SERVER_WIDTH, IMAGE_HEIGHT)
						.attr({'cursor': 'pointer'});
					set.push(server);
					++cursor;
				}
				

			}
			return self.serverSet = set;
		},

		// Create a mask to capture event handler
		_drawMask: function(paper) {
			var self = this;
			var mask = paper.rect(0, 0, self.size[0], self.size[1])
				.attr({opacity: 0, fill: '#fff', 'stroke-width': 0});
			return self.mask = mask;
		},

		// Calculate coordinates
		_calSize: function(data) {
			var self = this,
				options = self.options,
				lenArray = {}, // Save key-value array for calculating width automatically
				key = '',
				width = 0,
				height = (data.subnets.length + 1) * options.density[1],
				max = data.routers.length; // initialize max-value
			for (var i in data.servers) {
				var link = data.servers[i].link,
					key = link[0].net_index;
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

	// Deliver the init function to the VirtualNT prototype for instantiation
	VirtualNT.fn.init.prototype = VirtualNT.fn;

	// Utils
	VirtualNT.fn.util = {
		// Correct the offset
		rebound: function(pos, dimension) {
			pos[0] = pos[0] < dimension[0] ? dimension[0] : pos[0];
			pos[1] = pos[1] < dimension[1] ? dimension[1] : pos[1];
			pos[0] = pos[0] > dimension[2] ? dimension[2] : pos[0];
			pos[1] = pos[1] > dimension[3] ? dimension[3] : pos[1];
			return pos;
		},
		division: function(sep, num, width) {
			var tmp = [],
				offset = (width - sep * num) / (num + 1);
			for (var i = 0; i < num; i++) {
				tmp.push(offset + i * (offset + sep))
			}
			return tmp;
		}
	}

	if (typeof window === "object" && typeof window.document === "object") {
		window.VirtualNT = VirtualNT;	
	}
})(jQuery, Raphael);