// --- Constraint Defs -------------------------------------------------------

Sketchpad.z3.IntSqrtConstraint = function IntSqrtConstraint(xp, yp) {
    this.xp = xp
    this.yp = yp
}

sketchpad.addClass(Sketchpad.z3.IntSqrtConstraint, true)

Sketchpad.z3.IntSqrtConstraint.dummy = function(x, y) {
    return new Sketchpad.z3.IntSqrtConstraint(Point.dummy(x, y), Point.dummy(x + 1, y + 1))
}

Sketchpad.z3.IntSqrtConstraint.prototype.CoordsAndCartesian = {
    originX: 200,
    originY: 700,
    stepX: 25,
    stepY: 25,
    cartesianToCoords: function(p) {
	return {x: Math.round((p.x - this.originX) / this.stepX), y: Math.round((this.originY - p.y) / this.stepY)}
    },
    coordsToCartesian: function(p) {
	return {x: (p.x * this.stepX) + this.originX, y: this.originY - (p.y * this.stepY)}
    }
}

var Z3 =  Sketchpad.z3
var minus = Sketchpad.geom.minus
var magnitude = Sketchpad.geom.magnitude

Sketchpad.z3.IntSqrtConstraint.prototype.computeError = function(timeMillis) {
    var x = this.CoordsAndCartesian.cartesianToCoords(this.xp).x
    var y = this.CoordsAndCartesian.cartesianToCoords(this.yp).y    
    var qCart = this.CoordsAndCartesian.coordsToCartesian({x: x, y: 0})
    var res = (y > 0 && (x < ((y + 1) * (y + 1))) && (x >= (y * y))) ? 
	(magnitude(minus(qCart, this.xp))) : 1 
    return res
}

Sketchpad.z3.IntSqrtConstraint.prototype.solve = function(timeMillis) {
    soln = undefined
    if (Z3.waiting) {
    } else if (Z3.output) {
	if (Z3.output.sat) {
	    var model = Z3.output.model
	    var p = {x: model.x, y: model.y}
	    var pCart = this.CoordsAndCartesian.coordsToCartesian(p)
	    var ny = pCart
	    var q = this.CoordsAndCartesian.cartesianToCoords(this.xp)
	    var qCart = this.CoordsAndCartesian.coordsToCartesian({x: q.x, y: 0})
	    var nx = qCart
	    this.xp._selectionIndices[0] = q.x
	    this.yp._selectionIndices[0] = model.y
	    Z3.cache = Z3.output
	    soln = {xp: nx, yp: ny}
	}
	Z3.output = undefined
    } else if (Z3.cache && 
	       Z3.cache.model && 
	       Z3.cache.model.x == this.CoordsAndCartesian.cartesianToCoords(this.xp).x) {
	Z3.output = Z3.cache
    } else {
	var xpCoords = this.CoordsAndCartesian.cartesianToCoords(this.xp)
	if (Z3.skipStep < Z3.solveAfterNSkipping) {
	    Z3.skipStep++
	} else {
	    Z3.skipStep = 0
	    Z3.waiting = true
	    var header = '', formulas = ''
	    header += "(declare-const x Int)\n"
	    header += "(declare-const y Int)\n"
	    formulas += "(assert (= x " + xpCoords.x + "))\n"
	    formulas += "(assert (>= y 0))\n"
	    formulas += "(assert (> (* (+ y 1) (+ y 1)) x))\n"
	    formulas += "(assert (<= (* y y) x))\n"
	    var footer = "(check-sat)\n(get-model)\n"
	    var problem = header + formulas + footer
	    var output = Z3.solve(problem)
	}
    }
    return soln
}

SketchpadCanvas.prototype.addIntSqrtConstraint = function(p1, p2) {
    return this.addConstraint('Sketchpad.z3.IntSqrtConstraint', p1, p2)
}

examples['int sqrt'] = function() {

// --- Data ----------------------------------------------------------------

    var oy = rc.add(new Point(200, 100))
    var ox = rc.add(new Point(1300, 700))
    var o = rc.add(new Point(200, 700))
    for (var i = 200; i <= 1300; i += 25) {	
	var o1 = rc.add(new Point(i, 100, 'white'))
	var o2 = rc.add(new Point(i, 700, 'white'))
	rc.add(new Line(o1, o2))
    }
    for (var j = 100; j < 700; j += 25) {
	var o1 = rc.add(new Point(200, j, 'white'))
	var o2 = rc.add(new Point(1300, j, 'white'))
	rc.add(new Line(o1, o2))
    }
    var inp = rc.add(new Point(225, 700))
    var out = rc.add(new Point(225, 675))
    inp._selectionIndices.push(1)
    out._selectionIndices.push(1)

// --- Constraints ---------------------------------------------------------

    rc.addIntSqrtConstraint(inp, out)
};
