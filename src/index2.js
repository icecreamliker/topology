/*******************************************
 * Author: Lee Yao<yaoli@unitedstack.com>
 * Created: 2013-6-7
 * Description: physical network topology component
 * Update: 2013-6-7
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
	 * @module PhysicalNT
	 * @param {String} dom which contains the svg graphics
	 * @param {Object} topology data
	 * @param {Object} options are used to customise styles of graphics
	 * @returns {Object}
	 */

	var PhysicalNT = function(dom, data, options) {
		options = $.extend(defaults, options);	
		return new PhysicalNT.fn.init(dom, data, options);
	}
	
	PhysicalNT.fn = PhysicalNT.prototype = {
		// Current version of PhysicalNT
 		version: VERSION,

		constructor: PhysicalNT,

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
			
		},

		_drawNova: function(paper) {
		
		},

		// Return router elems
		_drawRouter: function(paper, data) {
			
		},

		// Return all the server elems
		_drawServer: function(paper, data) {

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
			
		}


	};

	// Deliver the init function to the PhysicalNT prototype for instantiation
	PhysicalNT.fn.init.prototype = PhysicalNT.fn;

	// Utils
	PhysicalNT.fn.util = {
		
	}

	if (typeof window === "object" && typeof window.document === "object") {
		window.PhysicalNT = PhysicalNT;	
	}
})(jQuery, Raphael);