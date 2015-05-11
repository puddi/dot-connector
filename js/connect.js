function load() {

	// point class to make life easier
	function Point(x, y) {
		this.x = (!isNaN(x) ? x : 0);
		this.y = (!isNaN(y) ? y : 0);
	}

	// likewise, a polarized point class
	function PolarizedPoint(x, y, quadrant, angle, distance) {
		Point.apply(this, arguments);
		this.quadrant = (!isNaN(quadrant) ? quadrant : 0);
		this.angle = (!isNaN(angle) ? angle : 0);
		this.distance = (!isNaN(distance) ? distance : 0);
	}

	// handles window resize
	function resizeCanvas() {
		ctx.canvas.width = window.innerWidth;
		ctx.canvas.height = window.innerHeight;
		$.each(dots, function(index, p) {
			drawPoint(p);
		});
		if (state == 'Reset') {
			drawLines();
		}
	}

	// adds a point to the array of points to be connected.
	function addPoint(e) {
		var p;
		if (e.pageX != undefined && e.pageY != undefined) {
			p = new Point(e.pageX, e.pageY);
		} else {
			p = new Point(e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
					e.clientY + document.body.scrollTop + document.documentElement.scrollTop);
		}
		dots.push(p);
		drawPoint(p);

		if (state == 'Reset') {
			ctx.clearRect(0, 0, $('canvas')[0].width, $('canvas')[0].height);
			$.each(dots, function(index, p) {
				drawPoint(p);
			});
			drawLines();
		} else {
			drawPoint(p);		
		} 
	}

	// given a point object, draws the point on the canvas.
	function drawPoint(p) {
		ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
	}

	// draws a way to connect all the points without overlaps
	// using polar coordinates to figure out a way to order the points so that,
	// when drawn in sequence, no overlaps occur.	
	function drawLines() {
		// kind of "cheating" a polarized system by storing a quadrant,
		// an angle within that quadrant, and a distance.
		function polarize(center, p) {
			var quadrant;
			if (p.x >= center.x) {
				if (p.y >= center.y) {
					quadrant = 1;
				} else {
					quadrant = 2;
				}
			} else {
				if (p.y >= center.y) {
					quadrant = 4;
				} else {
					quadrant = 3;
				}
			}
			dX = Math.abs(p.x - center.x);
			dY = Math.abs(p.y - center.y);
			var angle;
			if (quadrant % 2 == 1) {
				angle = (dX == 0 ? Number.MAX_VALUE : dY / dX);
			} else {
				angle = (dY == 0 ? Number.MAX_VALUE : dX / dY);
			}
			var distance = (dX * dX) + (dY * dY);
			return new PolarizedPoint(p.x, p.y, quadrant, angle, distance);
		}

		// and then sorting support for the makeshift polarized points
		function sortByPolar(a, b) {
			if (a.quadrant != b.quadrant) {
				return a.quadrant - b.quadrant;
			} else if (a.angle != b.angle) {
				return b.angle - a.angle;
			} else {
				return a.distance - b.distance;
			}
		}

		// find the center of all the points, since polarizing needs a center
		var xSum = 0;
		var ySum = 0;
		$.each(dots, function(index, p) {
			xSum += p.x;
			ySum += p.y;
		});
		center = new Point(xSum / dots.length, ySum / dots.length);
		
		// and them sort them by polar coordinate
		var sorted = dots.map(function(obj) {
			return polarize(center, obj);
		}).sort(sortByPolar);

		// and draw the connections.
		ctx.beginPath();
		ctx.moveTo(sorted[0].x, sorted[0].y);
		sorted.push(sorted.shift());
		$.each(sorted, function(index, p) {
			ctx.lineTo(p.x, p.y);
		});
		ctx.stroke();
		ctx.closePath();
	}

	// handler for the solve button
	function solveHandler(e) {
		if (state == 'Solve') {
			if (dots.length <= 1) {
				showError("You need at least two dots to connect.");
			} else {
				drawLines();
				state = 'Reset';
			}
		} else {
			ctx.clearRect(0, 0, $('canvas')[0].width, $('canvas')[0].height);
			center = new Point();
			dots = [];
			state = 'Solve'
		}
		$('#solve').text(state);
	}

	function showError(msg) {
		$('#error').text(msg).slideDown(200, function(e) {
			var g = this;
			setTimeout(function() {
				$(g).slideUp(200);
			}, 2500);
		});
	}

	// initiating variables
	var dots = [];
	var center = new Point();
	var ctx = $('canvas')[0].getContext("2d");
	ctx.strokeStyle = "#222222";
	ctx.lineWidth = 1;
	var state = 'Solve';

	// and setting up handlers
	$(window).resize(resizeCanvas);
	$('canvas').click(addPoint);
	$('#solve').click(solveHandler);
	resizeCanvas();
}

load();