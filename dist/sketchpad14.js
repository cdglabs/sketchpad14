!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Sketchpad=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function installArithmeticConstraints(Sketchpad) {

    // This is a collection of arithmetic constraints that can be applied to
    // arbitrary properties of arbitrary objects. "References" are represented
    // as (object, propertyName) tuples, e.g., {obj: yourMom, prop: 'weight'}.

    Sketchpad.arith = {}

    // Helpers

    function installRef(target, ref, prefix) {
	target[prefix + '_obj'] = ref.obj
	target[prefix + '_prop'] = ref.prop
    }

    function ref(target, prefix) {
	return target[prefix + '_obj'][target[prefix + '_prop']]
    }

    function patch(target /* , prefix, newVal, ... */) {
	var result = {}
	for (var i = 1; i < arguments.length; i += 2) {
	    var prefix = arguments[i]
	    var newVal = arguments[i+1]
	    var d = result[prefix + '_obj']
	    if (!d) {
		result[prefix + '_obj'] = d = {}
	    }
	    d[target[prefix + '_prop']] = newVal
	}
	return result
    }

    // Value Constraint, i.e., o.p = value

    Sketchpad.arith.ValueConstraint = function Sketchpad__arith__ValueConstraint(ref, value) {
	installRef(this, ref, 'v')
	this.value = value
    }

    sketchpad.addClass(Sketchpad.arith.ValueConstraint, true)

    Sketchpad.arith.ValueConstraint.prototype.description = function() { return  "Sketchpad.arith.ValueConstraint({obj: O, prop: p}, Value) states that O.p = Value." }

    Sketchpad.arith.ValueConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.ValueConstraint({obj: new Point(1,1), prop: 'x'}, 42) 
    }

    Sketchpad.arith.ValueConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.value - ref(this, 'v')
    }

    Sketchpad.arith.ValueConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return patch(this, 'v', this.value)
    }

    // Equality Constraint, i.e., o1.p1 = o2.p2

    Sketchpad.arith.EqualityConstraint = function Sketchpad__arith__EqualityConstraint(ref1, ref2, optOnlyWriteTo) {
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.onlyWriteTo = optOnlyWriteTo || [1, 2]
    }

    sketchpad.addClass(Sketchpad.arith.EqualityConstraint, true)

    Sketchpad.arith.EqualityConstraint.prototype.description = function() { return  "Sketchpad.arith.EqualityConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}) states that O1.p1 = O2.p2 ." }

    Sketchpad.arith.EqualityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.EqualityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    Sketchpad.arith.EqualityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var diff = ref(this, 'v1') - ref(this, 'v2')
	return diff
    }

    Sketchpad.arith.EqualityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v1 = ref(this, 'v1'), v2 = ref(this, 'v2')
	var vs = [v1, v2]
	var onlyWriteTo = this.onlyWriteTo
	var diff = v1 - v2
	var div = onlyWriteTo.length
	var args = [this]
	onlyWriteTo.forEach(function(i) { var sign = i > 1 ? 1 : -1; args.push('v' + i); args.push(vs[i - 1] + sign * diff / div) })
	res = patch.apply(this, args)
	return res //patch(this, 'v1', v1 - (diff / 2), 'v2', v2 + diff / 2)
    }

    // Sum Constraint, i.e., o1.p1 + o2.p2 = o3.p3

    Sketchpad.arith.SumConstraint = function Sketchpad__arith__SumConstraint(ref1, ref2, ref3, optOnlyWriteTo) {
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	installRef(this, ref3, 'v3')
	this.onlyWriteTo = optOnlyWriteTo || [1, 2, 3]
    }

    sketchpad.addClass(Sketchpad.arith.SumConstraint, true)

    Sketchpad.arith.SumConstraint.prototype.description = function() { return  "Sketchpad.arith.SumConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, {obj: O3, prop: p3}, WritableIdxs) states that O1.p1 + O2.p2 = O3.p3 . Optional WritableIdxs gives a list of indices (1, 2, or, 3) the constraint is allowed to change." } 

    Sketchpad.arith.SumConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.SumConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    Sketchpad.arith.SumConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var diff = ref(this, 'v3') - (ref(this, 'v1') + ref(this, 'v2'))
	return diff
    }

    Sketchpad.arith.SumConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v1 = ref(this, 'v1')
	var v2 = ref(this, 'v2')
	var v3 = ref(this, 'v3')
	var vs = [v1, v2, v3]
	var diff = v3 - (v1 + v2)
	var onlyWriteTo = this.onlyWriteTo
	var div = onlyWriteTo.length
	var args = [this]
	onlyWriteTo.forEach(function(i) { var sign = i > 2 ? -1 : 1; args.push('v' + i); args.push(vs[i - 1] + sign * diff / div) })
	res = patch.apply(this, args)
	return res
    }
}

module.exports.install = installArithmeticConstraints

},{}],2:[function(require,module,exports){
function installGeometricConstraints(Sketchpad) {

    // This is a collection of geometric constraints that can be applied to
    // objects that have x and y properties. Other properties are ignored.

    Sketchpad.geom = {}

    // Helpers

    function square(n) {
	return n * n
    }

    function plus(p1, p2) {
	return {x: p1.x + p2.x, y: p1.y + p2.y}
    }

    function minus(p1, p2) {
	return {x: p1.x - p2.x, y: p1.y - p2.y}
    }

    function scaledBy(p, m) {
	return {x: p.x * m, y: p.y * m}
    }

    function copy(p) {
	return scaledBy(p, 1)
    }

    function midpoint(p1, p2) {
	return scaledBy(plus(p1, p2), 0.5)
    }

    function magnitude(p) {
	return Math.sqrt(square(p.x) + square(p.y))
    }

    function normalized(p) {
	var m = magnitude(p)
	return m > 0 ? scaledBy(p, 1 / m) : p
    }

    function distance(p1, p2) {
	return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y))
    }

    function rotatedBy(p, dTheta) {
	var c = Math.cos(dTheta)
	var s = Math.sin(dTheta)
	return {x: c*p.x - s*p.y, y: s*p.x + c*p.y}
    }

    function rotatedAround(p, dTheta, axis) {
	return plus(axis, rotatedBy(minus(p, axis), dTheta))
    }

    function setDelta(d, p, scale) {
	d.x = p.x * scale
	d.y = p.y * scale
    }

    Sketchpad.geom.square = square
    Sketchpad.geom.plus = plus
    Sketchpad.geom.minus = minus
    Sketchpad.geom.scaledBy = scaledBy
    Sketchpad.geom.copy = copy
    Sketchpad.geom.midpoint = midpoint
    Sketchpad.geom.magnitude = magnitude
    Sketchpad.geom.normalized = normalized
    Sketchpad.geom.distance = distance
    Sketchpad.geom.rotatedBy = rotatedBy
    Sketchpad.geom.rotatedAround = rotatedAround
    Sketchpad.geom.setDelta = setDelta

    Sketchpad.geom.drawVisualizationLine = function(canvas, origin, p1, p2, l) {
	var ctxt = canvas.ctxt
	ctxt.lineWidth = 1
	ctxt.strokeStyle = 'yellow'
	ctxt.beginPath()

	var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
	var dist = 25
	var p1x = origin.x + p1.x - dist * Math.cos(angle + Math.PI / 2)
	var p1y = origin.y + p1.y - dist * Math.sin(angle + Math.PI / 2)
	var p2x = origin.x + p2.x - dist * Math.cos(angle + Math.PI / 2)
	var p2y = origin.y + p2.y - dist * Math.sin(angle + Math.PI / 2)

	var textCenterX = (p1x + p2x) / 2 - dist / 2 * Math.cos(angle + Math.PI / 2)
	var textCenterY = (p1y + p2y) / 2 - dist / 2 * Math.sin(angle + Math.PI / 2)

	ctxt.moveTo(
	    p1x + 5 * Math.cos(angle + Math.PI / 2),
	    p1y + 5 * Math.sin(angle + Math.PI / 2)
	)
	ctxt.lineTo(
	    p1x - 5 * Math.cos(angle + Math.PI / 2),
	    p1y - 5 * Math.sin(angle + Math.PI / 2)
	)

	ctxt.moveTo(p1x, p1y)
	ctxt.lineTo(p2x, p2y)

	ctxt.moveTo(
	    p2x + 5 * Math.cos(angle + Math.PI / 2),
	    p2y + 5 * Math.sin(angle + Math.PI / 2)
	)
	ctxt.lineTo(
	    p2x - 5 * Math.cos(angle + Math.PI / 2),
	    p2y - 5 * Math.sin(angle + Math.PI / 2)
	)
	ctxt.closePath()
	ctxt.stroke()

	ctxt.textAlign = 'center'
	ctxt.textBaseline = 'middle'
	ctxt.strokeText(Math.round(l), textCenterX, textCenterY)
	ctxt.stroke()
    }

    Sketchpad.geom.calculateAngle = function(p1, p2, p3, p4) {
	var v12 = {x: p2.x - p1.x, y: p2.y - p1.y}
	var a12 = Math.atan2(v12.y, v12.x)
	var v34 = {x: p4.x - p3.x, y: p4.y - p3.y}
	var a34 = Math.atan2(v34.y, v34.x)
	return (a12 - a34 + 2 * Math.PI) % (2 * Math.PI)
    }

    // Coordinate Constraint, i.e., "I want this point to be here".

    Sketchpad.geom.CoordinateConstraint = function Sketchpad__geom__CoordinateConstraint(p, x, y) {
	this.p = p
	this.c = new Point(x, y)
    }

    sketchpad.addClass(Sketchpad.geom.CoordinateConstraint, true)

    Sketchpad.geom.CoordinateConstraint.prototype.description = function() { return  "Sketchpad.geom.CoordinateConstraint(Point P, Number X, Number Y) states that point P should stay at coordinate (X, Y)." }

    Sketchpad.geom.CoordinateConstraint.prototype.propertyTypes = {p: 'Point', c: 'Point'}

    Sketchpad.geom.CoordinateConstraint.prototype.effects = function() {
	return [{obj: this.p, props: ['x', 'y']}]
    }

    Sketchpad.geom.CoordinateConstraint.dummy = function(x, y) {
	var p1 = Point.dummy(x, y)
	var p2 = Point.dummy(y, x)
	return new Sketchpad.geom.CoordinateConstraint(p1, p2.x, p2.y)
    }

    Sketchpad.geom.CoordinateConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.c, this.p))
    }

    Sketchpad.geom.CoordinateConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p: {x: this.c.x, y: this.c.y}}
    }

    Sketchpad.geom.CoordinateConstraint.prototype.draw = function(canvas, origin) {
	var ctxt = canvas.ctxt
	if (this.p.isSelected) return // don't draw over the selection highlight
	ctxt.fillStyle = 'black'
	ctxt.beginPath()
	ctxt.arc(this.c.x + origin.x, this.c.y + origin.y, canvas.pointRadius * 0.666, 0, 2 * Math.PI)
	ctxt.closePath()
	ctxt.fill()
    }

    // XCoordinateConstraint Constraint

    Sketchpad.geom.XCoordinateConstraint = function Sketchpad__geom__XCoordinateConstraint(p1, p2) {
        this.p1 = p1
        this.p2 = p2
    }

    sketchpad.addClass(Sketchpad.geom.XCoordinateConstraint, true)

    Sketchpad.geom.CoordinateConstraint.prototype.description = function() { return  "Sketchpad.geom.XCoordinateConstraint(Point P, Number X) states that point P'x x-coordinate should be at X." }

    Sketchpad.geom.XCoordinateConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point'}

    Sketchpad.geom.XCoordinateConstraint.dummy = function(x, y) {
	var p1 = Point.dummy(x, y)
	var p2 = Point.dummy(y, x)
	return new Sketchpad.geom.XCoordinateConstraint(p1, p2.x, p2.y)
    }

    Sketchpad.geom.XCoordinateConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.p2.x - this.p1.x
    }

    Sketchpad.geom.XCoordinateConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p1: {x: this.p2.x}}
    }

    // YCoordinateConstraint Constraint

    Sketchpad.geom.YCoordinateConstraint = function Sketchpad__geom__YCoordinateConstraint(p1, p2) {
        this.p1 = p1
        this.p2 = p2
    }

    sketchpad.addClass(Sketchpad.geom.YCoordinateConstraint, true)

    Sketchpad.geom.YCoordinateConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.p2.y - this.p1.y
    }

    Sketchpad.geom.YCoordinateConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p1: {y: this.p2.y}}
    }

    // Coincidence Constraint, i.e., I want these two points to be at the same place.

    Sketchpad.geom.CoincidenceConstraint = function Sketchpad__geom__CoincidenceConstraint(p1, p2) {
	this.p1 = p1
	this.p2 = p2
    }

    sketchpad.addClass(Sketchpad.geom.CoincidenceConstraint, true)

    Sketchpad.geom.CoincidenceConstraint.prototype.description = function() { return  "Sketchpad.geom.CoincidenceConstraint(Point P1, Poiont P2) states that points P1 & P2 should be at the same place." }

    Sketchpad.geom.CoincidenceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point'}

    Sketchpad.geom.CoincidenceConstraint.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	return new Sketchpad.geom.CoincidenceConstraint(l.p1, l.p2)
    }

    Sketchpad.geom.CoincidenceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.p2, this.p1))
    }

    Sketchpad.geom.CoincidenceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(this.p2, this.p1), 0.5)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1))}
    }

    // Equivalence Constraint, i.e., I want the vectors p1->p2 and p3->p4 to be the same.

    Sketchpad.geom.EquivalenceConstraint = function Sketchpad__geom__EquivalenceConstraint(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.EquivalenceConstraint, true)

    Sketchpad.geom.EquivalenceConstraint.prototype.description = function() { return  "Sketchpad.geom.EquivalenceConstraint(Point P1, Point P2, Point P3, Point P4) says line sections P1-2 and P3-4 are parallel and of the same lengths." }

    Sketchpad.geom.EquivalenceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

    Sketchpad.geom.EquivalenceConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.EquivalenceConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    Sketchpad.geom.EquivalenceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)))
    }

    Sketchpad.geom.EquivalenceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.25)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1)), p3: plus(this.p3, scaledBy(splitDiff, -1)), p4: plus(this.p4, splitDiff)}
    }

    Sketchpad.geom.EquivalenceConstraint.prototype.draw = function(canvas, origin) {
	var l = distance(this.p1, this.p2)
	Sketchpad.geom.drawVisualizationLine(canvas, origin, this.p1, this.p2, l)
	Sketchpad.geom.drawVisualizationLine(canvas, origin, this.p3, this.p4, l)
    }

    Sketchpad.geom.EquivalenceConstraint.prototype.containsPoint = function(x, y) {
	var p1 = this.p1, p2 = this.p2, p3 = this.p3, p4 = this.p4
	var x1 = Math.min(p1.x, p2.x, p3.x, p4.x), x2 = Math.max(p1.x, p2.x, p3.x, p4.x)
	var y1 = Math.min(p1.y, p2.y, p3.y, p4.y), y2 = Math.max(p1.y, p2.y, p3.y, p4.y)
	this.__border = new Box(new Point(x1, y1), x2 - x1, y2 - y1) 
	return this.__border.containsPoint(x, y) 
    }
   
    Sketchpad.geom.EquivalenceConstraint.prototype.border = function() {
	var p1 = this.p1, p2 = this.p2, p3 = this.p3, p4 = this.p4
	var x1 = Math.min(p1.x, p2.x, p3.x, p4.x), x2 = Math.max(p1.x, p2.x, p3.x, p4.x)
	var y1 = Math.min(p1.y, p2.y, p3.y, p4.y), y2 = Math.max(p1.y, p2.y, p3.y, p4.y)
	this.__border = new Box(new Point(x1, y1), x2 - x1, y2 - y1) 
	return this.__border
    } 

    // One Way Equivalence Constraint, i.e., I want the vectors p1->p2 to always match with p3->p4

    Sketchpad.geom.OneWayEquivalenceConstraint = function Sketchpad__geom__OneWayEquivalenceConstraint(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.OneWayEquivalenceConstraint, true)

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.description = function() { return  "Sketchpad.geom.OneWayEquivalenceConstraint(Point P1, Point P2, Point P3, Point P4) says the vectors P1->P2 always matches with P3->P4" }

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

    Sketchpad.geom.OneWayEquivalenceConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.OneWayEquivalenceConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)))
    }

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.5)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1))}
    }

    // Equal Distance constraint - keeps distances P1-->P2, P3-->P4 equal

    Sketchpad.geom.EqualDistanceConstraint = function Sketchpad__geom__EqualDistanceConstraint(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.EqualDistanceConstraint, true)

    Sketchpad.geom.EqualDistanceConstraint.prototype.description = function() { return  "Sketchpad.geom.EqualDistanceConstraint(Point P1, Point P2, Point P3, Point P4) keeps distances P1->P2, P3->P4 equal." }

    Sketchpad.geom.EqualDistanceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

    Sketchpad.geom.EqualDistanceConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.EqualDistanceConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    Sketchpad.geom.EqualDistanceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	var l34 = magnitude(minus(this.p3, this.p4))
	return l12 - l34
    }
    
    Sketchpad.geom.EqualDistanceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	var l34 = magnitude(minus(this.p3, this.p4))
	var delta = (l12 - l34) / 4
	var e12 = scaledBy(Sketchpad.geom.normalized(minus(this.p2, this.p1)), delta)
	var e34 = scaledBy(Sketchpad.geom.normalized(minus(this.p4, this.p3)), delta)
	return {p1: plus(this.p1, e12), p2: plus(this.p2, scaledBy(e12, -1)), p3: plus(this.p3, scaledBy(e34, -1)), p4: plus(this.p4, e34)}
    }

    // Length constraint - maintains distance between P1 and P2 at L.

    Sketchpad.geom.LengthConstraint = function Sketchpad__geom__LengthConstraint(p1, p2, l, onlyOneWritable) {
	this.p1 = p1
	this.p2 = p2
	this.l = l
	this._onlyOneWritable = onlyOneWritable
    }

    sketchpad.addClass(Sketchpad.geom.LengthConstraint, true)

    Sketchpad.geom.LengthConstraint.prototype.description = function() { return  "Sketchpad.geom.LengthConstraint(Point P1, Point P2, Number L) says points P1 and P2 always maintain a distance of L." }

    Sketchpad.geom.LengthConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', l: 'Number'}

    Sketchpad.geom.LengthConstraint.prototype.effects = function() {
	return [{obj: this.p1, props: ['x', 'y']}, {obj: this.p2, props: ['x', 'y']}]
    }

    Sketchpad.geom.LengthConstraint.dummy = function(x, y) {
	return new Sketchpad.geom.LengthConstraint(new Point(x - 50, y - 50), new Point(x + 50, y + 50), 100)
    }

    Sketchpad.geom.LengthConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	return l12 - this.l
    }

    Sketchpad.geom.LengthConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var p1 = this.p1, p2 = this.p2
	var l12 = magnitude(minus(p1, p2))
	if (l12 == 0) {
	    p1 = plus(p1, {x: 0.1, y: 0})
	    p2 = plus(p2, {x: -0.1, y: 0})
	}	
	var delta = (l12 - this.l) / (this._onlyOneWritable ? 1 : 2)
	var e12 = scaledBy(Sketchpad.geom.normalized(minus(p2, p1)), delta)
	var res = {p2: plus(this.p2, scaledBy(e12, -1))}
	if (!this._onlyOneWritable)
	    res['p1'] = plus(this.p1, e12)
	return res
    }

    Sketchpad.geom.LengthConstraint.prototype.draw = function(canvas, origin) {
	Sketchpad.geom.drawVisualizationLine(canvas, origin, this.p1, this.p2, this.l)
    }

    Sketchpad.geom.LengthConstraint.prototype.containsPoint = function(x, y) {
	var p1 = this.p1, p2 = this.p2
	var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
	var dist = 25
	var p1x = p1.x - dist * Math.cos(angle + Math.PI / 2)
	var p1y = p1.y - dist * Math.sin(angle + Math.PI / 2)
	var p2x = p2.x - dist * Math.cos(angle + Math.PI / 2)
	var p2y = p2.y - dist * Math.sin(angle + Math.PI / 2)
	var textCenterX = (p1x + p2x) / 2 - dist / 2 * Math.cos(angle + Math.PI / 2)
	var textCenterY = (p1y + p2y) / 2 - dist / 2 * Math.sin(angle + Math.PI / 2)
	this.__border = new Box(new Point(textCenterX - 50, textCenterY - 50), 100, 100) 
	return this.__border.containsPoint(x, y) 
    }
   
    Sketchpad.geom.LengthConstraint.prototype.border = function() {
	var p1 = this.p1, p2 = this.p2
	var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
	var dist = 25
	var p1x = p1.x - dist * Math.cos(angle + Math.PI / 2)
	var p1y = p1.y - dist * Math.sin(angle + Math.PI / 2)
	var p2x = p2.x - dist * Math.cos(angle + Math.PI / 2)
	var p2y = p2.y - dist * Math.sin(angle + Math.PI / 2)
	var textCenterX = (p1x + p2x) / 2 - dist / 2 * Math.cos(angle + Math.PI / 2)
	var textCenterY = (p1y + p2y) / 2 - dist / 2 * Math.sin(angle + Math.PI / 2)
	this.__border = new Box(new Point(textCenterX - 50, textCenterY - 50), 100, 100) 
	return this.__border
    } 

    // Orientation constraint - maintains angle between P1->P2 and P3->P4 at Theta

    Sketchpad.geom.OrientationConstraint = function Sketchpad__geom__OrientationConstraint(p1, p2, p3, p4, theta) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
	this.theta = theta === undefined ? Sketchpad.geom.calculateAngle(p1, p2, p3, p4) : theta
    }

    sketchpad.addClass(Sketchpad.geom.OrientationConstraint, true)

    Sketchpad.geom.OrientationConstraint.prototype.description = function() { return  "Sketchpad.geom.OrientationConstraint(Point P1, Point P2, Point P3, Point P4, Number Theta) maintains angle between P1->P2 and P3->P4 at Theta." }

    Sketchpad.geom.OrientationConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point', theta: 'Number'}

    Sketchpad.geom.OrientationConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.OrientationConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    Sketchpad.geom.OrientationConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v12 = minus(this.p2, this.p1)
	var a12 = Math.atan2(v12.y, v12.x)
	var m12 = midpoint(this.p1, this.p2)
	
	var v34 = minus(this.p4, this.p3)
	var a34 = Math.atan2(v34.y, v34.x)
	var m34 = midpoint(this.p3, this.p4)
	
	var currTheta = a12 - a34
	var dTheta = this.theta - currTheta
	return dTheta
    }
    
    Sketchpad.geom.OrientationConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v12 = minus(this.p2, this.p1)
	var a12 = Math.atan2(v12.y, v12.x)
	var m12 = midpoint(this.p1, this.p2)

	var v34 = minus(this.p4, this.p3)
	var a34 = Math.atan2(v34.y, v34.x)
	var m34 = midpoint(this.p3, this.p4)

	var currTheta = a12 - a34
	var dTheta = this.theta - currTheta
	// TODO: figure out why setting dTheta to 1/2 times this value (as shown in the paper
	// and seems to make sense) results in jumpy/unstable behavior.
	return {p1: rotatedAround(this.p1, dTheta, m12),
		p2: rotatedAround(this.p2, dTheta, m12),
		p3: rotatedAround(this.p3, -dTheta, m34),
		p4: rotatedAround(this.p4, -dTheta, m34)}
    }

    Sketchpad.geom.OrientationConstraint.prototype.draw = function(canvas, origin) {
	var ctxt = canvas.ctxt
	var m1 = scaledBy(plus(this.p1, this.p2), 0.5)
	var m2 = scaledBy(plus(this.p3, this.p4), 0.5)
	var m = scaledBy(plus(m1, m2), 0.5)
	canvas.drawArrow(m1, m2, origin)
	ctxt.fillStyle = 'red'
	ctxt.fillText('theta = ' + Math.floor(this.theta / Math.PI * 180), m.x + origin.x, m.y + origin.y)
    }

    Sketchpad.geom.OrientationConstraint.prototype.containsPoint = function(x, y) {
	var m1 = scaledBy(plus(this.p1, this.p2), 0.5)
	var m2 = scaledBy(plus(this.p3, this.p4), 0.5)
	var m = scaledBy(plus(m1, m2), 0.5)
	this.__border = new Box(new Point(m.x - 50, m.y - 50), 100, 100) 
	return this.__border.containsPoint(x, y) 
    }
   
    Sketchpad.geom.OrientationConstraint.prototype.border = function() {
	var m1 = scaledBy(plus(this.p1, this.p2), 0.5)
	var m2 = scaledBy(plus(this.p3, this.p4), 0.5)
	var m = scaledBy(plus(m1, m2), 0.5)
	this.__border = new Box(new Point(m.x - 50, m.y - 50), 100, 100) 
	return this.__border
    } 

    // Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
    // w is in units of Hz - whole rotations per second.

    Sketchpad.geom.MotorConstraint = function Sketchpad__geom__MotorConstraint(p1, p2, w) {
	this.p1 = p1
	this.p2 = p2
	this.w = w
    }

    sketchpad.addClass(Sketchpad.geom.MotorConstraint, true)

    Sketchpad.geom.MotorConstraint.prototype.description = function() { return  "Sketchpad.geom.MotorConstraint(Point P1, Point P2, Number W) causes P1 and P2 to orbit their midpoint at the given rate of w, in units of Hz: whole rotations per second." } 

    Sketchpad.geom.MotorConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', w: 'Number'}
    
    Sketchpad.geom.MotorConstraint.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	return new Sketchpad.geom.MotorConstraint(l.p1, l.p2, 1)
    }

    Sketchpad.geom.MotorConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return 1
    }

    Sketchpad.geom.MotorConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var t = (pseudoTime - prevPseudoTime) / 1000.0
	var dTheta = t * this.w * (2 * Math.PI)
	var m12 = midpoint(this.p1, this.p2)
	return {p1: rotatedAround(this.p1, dTheta, m12),
		p2: rotatedAround(this.p2, dTheta, m12)}
    }
    
    Sketchpad.geom.CartesianPointConstraint = function  Sketchpad__geom__CartesianPointConstraint(position, vector, origin, unit) {
	this.position = position
	this.vector = vector
	this.origin = origin
	this.unit = unit
    }
    
    sketchpad.addClass(Sketchpad.geom.CartesianPointConstraint, true)
    
    Sketchpad.geom.CartesianPointConstraint.prototype.description = function() {
	return "Sketchpad.geom.CartesianPointConstraint(Point P, Vector V, Point O, Number U) states that P should be positioned based on vector V's X and Y discrete coordinate values, and on origin O and each unit on axis having a vertical and horizontal length of U"
    }
    
    Sketchpad.geom.CartesianPointConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var origin = this.origin, vector = this.vector, position = this.position, unit = this.unit
	var diffX = Math.abs(origin.x + unit * vector.x - position.x)
	var diffY = Math.abs(origin.y - unit * vector.y - position.y)
	return diffX + diffY
    }

    Sketchpad.geom.CartesianPointConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var origin = this.origin, vector = this.vector, position = this.position, unit = this.unit
	var x = origin.x + unit * vector.x
	var y = origin.y - unit * vector.y
	return {position: {x: x, y: y}}
    }
    
}

///////////////////////////////////////////////////////////////////////////

module.exports.install = installGeometricConstraints

},{}],3:[function(require,module,exports){
function installSimulationConstraints(Sketchpad) {

    // This is a collection of simulation constraints that can be applied to
    // arbitrary properties of arbitrary objects. "References" are represented
    // as (object, propertyName) tuples, e.g., {obj: yourMom, prop: 'weight'}.

    Sketchpad.simulation = { g: 9.8, G: 6.7e-11 } // G: Nm2/kg2 

    var minus = Sketchpad.geom.minus
    var plus = Sketchpad.geom.plus
    var scaledBy = Sketchpad.geom.scaledBy
    var normalized = Sketchpad.geom.normalized
    var magnitude = Sketchpad.geom.magnitude
    var distance = Sketchpad.geom.distance

    // Classes
    
    Sketchpad.simulation.FreeBody = function Sketchpad__simulation__FreeBody(position, optRadius, optMass) {
	this.position = position
	this.mass = optMass || 10
	this.velocity = new Vector(0, 0)
	this.acceleration = new Vector(0, 0)
	this.radius = optRadius || this.position.radius
	rc.add(position)
    }

    sketchpad.addClass(Sketchpad.simulation.FreeBody)

    Sketchpad.simulation.FreeBody.prototype.propertyTypes = {position: 'Point', mass: 'Number', radius: 'Number'}

    Sketchpad.simulation.FreeBody.dummy = function(x, y) {
	return new Sketchpad.simulation.FreeBody(Point.dummy(x, y), 10, 10)
    }
    
    Sketchpad.simulation.FreeBody.prototype.containsPoint = function(x, y) {
	return this.position.containsPoint(x, y)
    }

    Sketchpad.simulation.FreeBody.prototype.center = function() {
	return this.position
    }

    Sketchpad.simulation.FreeBody.prototype.border = function() {
	return this.position.border()
    }

    Sketchpad.simulation.FreeBody.prototype.draw = function(canvas, origin) {
	//this.position.draw(canvas, origin)
    }

    Sketchpad.simulation.Spring = function Sketchpad__simulation__Spring(body1, body2, k, length, tearPointAmount) {
	this.body1 = body1
	this.body1 = body2
	this.line = new Line(body1.position, body2.position)
	this.k = k
	this.length = length    
	this.tearPointAmount = tearPointAmount
	this.torn = false
    }

    sketchpad.addClass(Sketchpad.simulation.Spring)

    Sketchpad.simulation.Spring.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody', k: 'Number', length: 'Number', teatPointAmount: 'Number'}

    Sketchpad.simulation.Spring.dummy = function(x, y) {
	var b1 = FreeBody.dummy(x, y)
	var b2 = FreeBody.dummy(x + 100, y + 100)
	var d = distance(b1.p1, b2.p2)
	return new Sketchpad.simulation.Spring(b1, b2, 10, d,  d * 5)
    }
    
    Sketchpad.simulation.Spring.prototype.containsPoint = function(x, y) {
	return this.line.containsPoint(x, y)
    }

    Sketchpad.simulation.Spring.prototype.center = function() {
	return this.line.center()
    }

    Sketchpad.simulation.Spring.prototype.border = function() {
	return new Line(this.line.p1, this.line.p2, undefined, 8).border()
    }

    Sketchpad.simulation.Spring.prototype.solutionJoins = function() {
	return {torn: rc.sketchpad.lastOneWinsJoinSolutions}
    }

    Sketchpad.simulation.Spring.prototype.draw = function(canvas, origin) {
	var ctxt = canvas.ctxt
	var line = this.line
	var p1 = line.p1, p2 = line.p2
	var y1 = origin.y + p1.y
	var y2 = origin.y + p2.y
	var x1 = origin.x + p1.x
	var x2 = origin.x + p2.x
	if (!this.torn) {
	    line.draw(canvas, origin)
	    ctxt.fillStyle = 'black'
	    ctxt.fillText(Math.floor(Math.sqrt(Math.pow(y1 - y2, 2) + Math.pow(x1 - x2, 2)) - this.length), (x1 + x2) / 2, (y1 + y2) / 2)
	}
    }

    // Utilities

    Sketchpad.simulation.detectContact = function(halfLength, position, velocity, surfaceP1, surfaceP2) {
	var quarterLength = halfLength / 2
	var positionX = position.x
	var positionY = position.y
	var surfaceX1 = surfaceP1.x
	var surfaceY1 = surfaceP1.y
	var surfaceX2 = surfaceP2.x
	var surfaceY2 = surfaceP2.y
	var slope = (surfaceY2 - surfaceY1) / (surfaceX2 - surfaceX1)
	var surfaceHitPosX = ((positionY - surfaceY1) / slope) + surfaceX1
	var surfaceHitPosY = ((positionX - surfaceX1) * slope) + surfaceY1
	var isVertical = (positionX >= (surfaceX1 - quarterLength) && positionX <= (surfaceX2 + quarterLength))
	var isHorizontal = (positionY >= (surfaceY1 - quarterLength) && positionY <= (surfaceY2 + quarterLength))
	var isUp = isVertical && positionY <= surfaceHitPosY
	var isDown = isVertical && positionY >= surfaceHitPosY
	var isLeft = isHorizontal && positionX <= surfaceHitPosX
	var isRight = isHorizontal && positionX >= surfaceHitPosX
	return (((isUp && (velocity.y >= 0) && (positionY >= (surfaceHitPosY - halfLength)))
		 || (isDown && (velocity.y <= 0) && (positionY <= (surfaceHitPosY + halfLength))))
		|| ((isLeft && (velocity.x >= 0) && (positionX <= surfaceHitPosX) && (positionX >= (surfaceHitPosX - halfLength)))
		    || (isRight && (velocity.x <= 0) && (positionX >= surfaceHitPosX) && (positionX <= (surfaceHitPosX + halfLength)))))
    }

    Sketchpad.simulation.computeContact = function(halfLength, position, velocity, surfaceP1, surfaceP2) {
	var quarterLength = halfLength / 2
	var positionX = position.x
	var positionY = position.y
	var surfaceX1 = surfaceP1.x
	var surfaceY1 = surfaceP1.y
	var surfaceX2 = surfaceP2.x
	var surfaceY2 = surfaceP2.y
	var slope = (surfaceY2 - surfaceY1) / (surfaceX2 - surfaceX1)
	var surfaceHitPosX = ((positionY - surfaceY1) / slope) + surfaceX1
	var surfaceHitPosY = ((positionX - surfaceX1) * slope) + surfaceY1
	var isVertical = (positionX >= (surfaceX1 - quarterLength) && positionX <= (surfaceX2 + quarterLength))
	var isHorizontal = (positionY >= (surfaceY1 - quarterLength) && positionY <= (surfaceY2 + quarterLength))
	var isUp = isVertical && positionY <= surfaceHitPosY
	var isDown = isVertical && positionY >= surfaceHitPosY
	var isLeft = isHorizontal && positionX <= surfaceHitPosX
	var isRight = isHorizontal && positionX >= surfaceHitPosX
	var velocityMagnitude = magnitude(velocity)
	var distance = 0
	//HACK FIXME
	if (isUp && (velocity.y >= 0)) {
	    distance = surfaceHitPosY - (positionY + halfLength)
	} else if (isDown && (velocity.y <= 0)) {
	    distance = (positionY - halfLength) - surfaceHitPosY
	} else if (isLeft && (velocity.x >= 0) && (positionX <= surfaceHitPosX)) {
	    distance = surfaceHitPosX - (positionX + halfLength)
	} else if (isRight && (velocity.x <= 0) && (positionX >= surfaceHitPosX)) {
	    distance = (positionX - halfLength) - surfaceHitPosX
	} else {
	    return 1000000
	}
	var time = distance / velocityMagnitude 
	return Math.max(0, time)
    }

    Sketchpad.simulation.slope = function(p1, p2) {
	return (p1.y - p2.y) / (p2.x - p1.x)
    }

    Sketchpad.simulation.angle = function(p1, p2) {
	return Math.atan2(p1.y - p2.y, p2.x - p1.x)
    }

    Sketchpad.simulation.slopeVector = function(p1, p2) {
	var slope = this.slope(p1, p2), atn = Math.atan(slope)
	var sign = p1.x < p2.x ? -1 : 1
	return {x: sign * Math.sin(atn), y: sign * Math.cos(atn)}
    }

    // Timer Constraint

    Sketchpad.simulation.TimerConstraint = function Sketchpad__simulation__TimerConstraint(timer) {
	this.timer = timer
    }

    sketchpad.addClass(Sketchpad.simulation.TimerConstraint, true)

    Sketchpad.simulation.TimerConstraint.prototype.description = function() { return "Sketchpad.simulation.Timer(Timer T) states the system advances its pseudo-time by T's step size at each frame cycle." }


    Sketchpad.simulation.TimerConstraint.prototype.propertyTypes = {timer: 'Timer'}

    Sketchpad.simulation.TimerConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.TimerConstraint(Sketchpad.simulation.Timer.dummy(x, y))
    }
    
    Sketchpad.simulation.TimerConstraint.prototype.proposeNextPseudoTime = function(pseudoTime) {
	return pseudoTime + this.timer.stepSize
    }    

    Sketchpad.simulation.TimerConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return 0
    }

    Sketchpad.simulation.TimerConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {}
    }

    // ValueSliderConstraint Constraint

    Sketchpad.simulation.ValueSliderConstraint = function Sketchpad__simulation__ValueSliderConstraint(sliderPoint, xOrY, sliderZeroValue, sliderRangeLength, slidedObj, slidedProp) {
	this.sliderPoint = sliderPoint
	this.xOrY = xOrY
	this.sliderZeroValue = sliderZeroValue
	this.sliderRangeLength = sliderRangeLength
	this.slidedObj = slidedObj
	this.slidedProp = slidedProp
	this.slidedObjPropZeroValue = slidedObj[slidedProp]
    }

    sketchpad.addClass(Sketchpad.simulation.ValueSliderConstraint, true)

    Sketchpad.simulation.ValueSliderConstraint.prototype.propertyTypes = {sliderPoint: 'Point', xOrY: 'String', sliderZeroValue: 'Number', sliderRangeLength: 'Number', slidedObjPropZeroValue: 'Number'}

    Sketchpad.simulation.ValueSliderConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.ValueSliderConstraint(Point.dummy(x, y), 'x', 0, 100, {foo: 0}, 'foo')
    }

    Sketchpad.simulation.ValueSliderConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var slidedProp = this.slidedProp
	var currSliderDiff = (this.sliderZeroValue - this.sliderPoint[this.xOrY]) / this.sliderRangeLength
	var slidedObjPropTarget = (1 + currSliderDiff) * this.slidedObjPropZeroValue
	return slidedObjPropTarget - this.slidedObj[slidedProp]

    }

    Sketchpad.simulation.ValueSliderConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var soln = {}
	var slidedProp = this.slidedProp
	var currSliderDiff = (this.sliderZeroValue - this.sliderPoint[this.xOrY]) / this.sliderRangeLength
	var slidedObjPropTarget = (1 + currSliderDiff) * this.slidedObjPropZeroValue
	soln[slidedProp] = slidedObjPropTarget
	this.sliderPoint.selectionIndices[0] = Math.floor(100 * currSliderDiff)
	return {slidedObj: soln}
    }

    // Motion Constraint

    Sketchpad.simulation.VelocityConstraint = function Sketchpad__simulation__VelocityConstraint(body) {
	this.body = body
	this.position = body.position
	this.velocity = body.velocity
    }

    sketchpad.addClass(Sketchpad.simulation.VelocityConstraint, true)

    Sketchpad.simulation.VelocityConstraint.prototype.description = function() { return  "Sketchpad.simulation.VelocityConstraint(FreeBody Body) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.VelocityConstraint.prototype.propertyTypes = {body: 'FreeBody'}

    Sketchpad.simulation.VelocityConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.VelocityConstraint(FreeBody.dummy(x, y))
    }

    Sketchpad.simulation.VelocityConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	this.lastPosition = scaledBy(this.position, 1)
    }
    
    Sketchpad.simulation.VelocityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity, dt)), this.position))
    }

    Sketchpad.simulation.VelocityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity, dt))}
    }
    
    Sketchpad.simulation.VelocityConstraint.prototype.draw = function(canvas, origin) {
	var ctxt = canvas.ctxt
	var slopeV = Sketchpad.simulation.slopeVector(this.position, this.velocity)	
	var len = 50
	var p = plus(this.position, {x: slopeV.x * len, y: slopeV.y * len})
	canvas.drawArrow(this.position, p, origin, 'v')
    }
    
    // Body With Velocity Constraint

    Sketchpad.simulation.VelocityConstraint2 = function Sketchpad__simulation__VelocityConstraint2(body, velocity) {
	this.body = body
	this.position = body.position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation.VelocityConstraint2, true)

    Sketchpad.simulation.VelocityConstraint2.prototype.description = function() { return  "Sketchpad.simulation.VelocityConstraint2(FreeBody Body, PointVector Velocity) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.VelocityConstraint2.prototype.propertyTypes = {body: 'FreeBody', velocity: 'PointVector'}

    Sketchpad.simulation.VelocityConstraint2.dummy = function(x, y) {
	return new Sketchpad.simulation.VelocityConstraint2(FreeBody.dummy(x, y), PointVector.dummy(x, y))
    }
    
    Sketchpad.simulation.VelocityConstraint2.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastPosition = scaledBy(this.position, 1)
    }

    Sketchpad.simulation.VelocityConstraint2.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt)), this.position))
    }
    
    Sketchpad.simulation.VelocityConstraint2.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt))}
    }
    
    // Acceleration Constraint

    Sketchpad.simulation.AccelerationConstraint = function Sketchpad__simulation__AccelerationConstraint(body, acceleration) {
	this.body = body
	this.velocity = body.velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation.AccelerationConstraint, true)

    Sketchpad.simulation.AccelerationConstraint.prototype.description = function() { return  "Sketchpad.simulation.AccelerationConstraint(FreeBody Body, Vector Acceleration) states for Body: Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.AccelerationConstraint.prototype.propertyTypes = {body: 'FreeBody', acceleration: 'Vector'}

    Sketchpad.simulation.AccelerationConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.AccelerationConstraint(FreeBody.dummy(x, y), Sketchpad.geom.Vector.dummy(x + 50, y + 50))
    }

    Sketchpad.simulation.AccelerationConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    Sketchpad.simulation.AccelerationConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastVelocity, scaledBy(this.acceleration, dt)), this.velocity))
    }

    Sketchpad.simulation.AccelerationConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {velocity: plus(this.lastVelocity, scaledBy(this.acceleration, dt))}
    }

    // Air Resistance Constraint

    Sketchpad.simulation.AirResistanceConstraint = function Sketchpad__simulation__AirResistanceConstraint(body, scale) {
	this.body = body
	this.velocity = body.velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation.AirResistanceConstraint, true)

    Sketchpad.simulation.AirResistanceConstraint.prototype.description = function() { return  "Sketchpad.simulation.AirResistanceConstraint(FreeBody Body) states for Body: Velocity = old(Velocity) * Scale ." }

    Sketchpad.simulation.AirResistanceConstraint.prototype.propertyTypes = {scale: 'Number', velocity: 'Vector'}

    Sketchpad.simulation.AirResistanceConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.AirResistanceConstraint(Sketchpad.geom.Vector.dummy(x, y), .1)
    }

    Sketchpad.simulation.AirResistanceConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    Sketchpad.simulation.AirResistanceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(scaledBy(this.lastVelocity, this.scale), this.velocity))
    }

    Sketchpad.simulation.AirResistanceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: scaledBy(this.lastVelocity, this.scale)}
    }

    //  Bounce Constraint

    Sketchpad.simulation.BounceConstraint = function Sketchpad__simulation__BounceConstraint(body, surfaceP1, surfaceP2) {
	this.body = body
	this.halfLength = body.radius
	this.position = body.position
	this.velocity = body.velocity
	this.surfaceP1 = surfaceP1
	this.surfaceP2 = surfaceP2
    }

    sketchpad.addClass(Sketchpad.simulation.BounceConstraint, true)

    Sketchpad.simulation.BounceConstraint.prototype.description = function() { return  "Sketchpad.simulation.BounceConstraint(FreeBody Body, Point End1, Point End2) states that the Body with diameter L and position Pos and velocity vector Vel is going to bounce off the line with two end points End1 & End2." }

    Sketchpad.simulation.BounceConstraint.prototype.propertyTypes = {body: 'FreeBody', surfaceP1: 'Point', surfaceP2: 'Point'}

    Sketchpad.simulation.BounceConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.BounceConstraint(FreeBody.dummy(x, y), Point.dummy(x, y), Point.dummy(x, y))
    }

    Sketchpad.simulation.BounceConstraint.prototype.proposeNextPseudoTime = function(pseudoTime) {
	var res = pseudoTime + Sketchpad.simulation.computeContact(this.halfLength, this.position, this.velocity, this.surfaceP1, this.surfaceP2)
	this.tcontact = res;
	return res
    }

    Sketchpad.simulation.BounceConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	var position = this.position
	var velocity = this.velocity
	var surfaceP1 = this.surfaceP1
	var surfaceP2 = this.surfaceP2
        //Sketchpad.simulation.detectContact(this.halfLength, position, velocity, surfaceP1, surfaceP2)) {
	if (this.tcontact == pseudoTime) { 
	    this.tcontact = undefined
	    var dt = pseudoTime - prevPseudoTime
	    var slope = (surfaceP2.y - surfaceP1.y) / (surfaceP2.x - surfaceP1.x)
	    var surfaceHitPosX = surfaceP2.y == surfaceP1.y ? position.x : ((position.y - surfaceP1.y) / slope) + surfaceP1.x
	    var surfaceHitPosY = surfaceP2.x == surfaceP1.x ? position.y : ((position.x - surfaceP1.x) * slope) + surfaceP1.y
	    var surfaceAngle = Sketchpad.simulation.angle(surfaceP1, surfaceP2)
	    var velocityAngle = Sketchpad.simulation.angle({x: 0, y: 0}, velocity)
	    var reflectionAngle = surfaceAngle - velocityAngle 
	    var velocityMagnitude = Math.sqrt((velocity.x * velocity.x) + (velocity.y * velocity.y))
	    var angleC = Math.cos(reflectionAngle)
	    var angleS = Math.sin(reflectionAngle)
	    var x = angleC * velocityMagnitude * 1
	    var y = angleS * velocityMagnitude * -1
	    this.bounceVelocity = scaledBy({x: x, y: y}, 1)
	    var slopeV = Sketchpad.simulation.slopeVector(surfaceP1, surfaceP2)
	    var deltaPosX = slopeV.x * velocityMagnitude * dt
	    var deltaPosY = slopeV.y * -velocityMagnitude * dt
	    this.bouncePosition = {x: position.x + deltaPosX, y: position.y + deltaPosY}

	    // HACK FIXME? set velocity atomically right here!!
	    //this.contact = true
	    velocity.x = this.bounceVelocity.x
	    velocity.y = this.bounceVelocity.y
	    position.x = this.bouncePosition.x
	    position.y = this.bouncePosition.y

	} else
	    this.contact = false
    }

    Sketchpad.simulation.BounceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	/*
	  var velocity = this.velocity
	  var surfaceP1 = this.surfaceP1
	  var surfaceP2 = this.surfaceP2
	  return this.contact ? (
	  magnitude(minus(this.bounceVelocity, this.velocity)) 
	  + magnitude(minus(this.bouncePosition, this.position)) 
	  ) : 0
	*/
	return 0
    }

    Sketchpad.simulation.BounceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	/*
	  var dt = pseudoTime - prevPseudoTime
	  return {velocity: 
	  minus(plus(this.bounceVelocity, scaledBy({x: 0, y: -Sketchpad.simulation.g}, dt)), this.velocity),
	  position: (minus(this.bouncePosition, this.position))
	  }
	*/
	return {}
    }

    //  HitSurface Constraint

    Sketchpad.simulation.HitSurfaceConstraint = function Sketchpad__simulation__HitSurfaceConstraint(body, surfaceP1, surfaceP2) {
	this.body = body
	this.halfLength = body.radius / 2
	this.position = body.position
	this.velocity = body.velocity
	this.surfaceP1 = surfaceP1
	this.surfaceP2 = surfaceP2
    }

    sketchpad.addClass(Sketchpad.simulation.HitSurfaceConstraint, true)

    Sketchpad.simulation.HitSurfaceConstraint.prototype.description = function() { return  "Sketchpad.simulation.HitSurfaceConstraint(FreeBody Body, Point End1, Point End2) states that the Body with diameter L and position Pos and velocity vector Vel is going to land and stay on the line with two end points End1 & End2." }

    Sketchpad.simulation.HitSurfaceConstraint.prototype.propertyTypes = {body: 'FreeBody', surfaceP1: 'Point', surfaceP2: 'Point'}

    Sketchpad.simulation.HitSurfaceConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.HitSurfaceConstraint(FreeBody.dummy(x, y), Point.dummy(x, y), Point.dummy(x, y))
    }

    Sketchpad.simulation.HitSurfaceConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	var position = this.position
	var velocity = this.velocity
	var surfaceP1 = this.surfaceP1
	var surfaceP2 = this.surfaceP2
	if (Sketchpad.simulation.detectContact(this.halfLength, position, velocity, surfaceP1, surfaceP2)) {
	    this.contact = true
	    var dt = pseudoTime - prevPseudoTime
	    var slopeV = Sketchpad.simulation.slopeVector(surfaceP1, surfaceP2)
	    this.hitVelocity = scaledBy({x: 0, y: -Sketchpad.simulation.g}, dt)
	    var velocityMagnitude = Math.sqrt((velocity.x * velocity.x) + (velocity.y * velocity.y))
	    deltaPosX = slopeV.x * velocityMagnitude * dt
	    deltaPosY = slopeV.y * velocityMagnitude * dt
	    this.hitPosition = {x: position.x + deltaPosX, y: position.y + deltaPosY}
	} else
	    this.contact = false
    }
    
    Sketchpad.simulation.HitSurfaceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.contact ? (
	    magnitude(minus(this.hitVelocity, this.velocity)) + 
		magnitude(minus(this.hitPosition, this.position)) 
	) : 0
    }

    Sketchpad.simulation.HitSurfaceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: this.hitVelocity, position: this.hitPosition}
    }

    // Conveyor Belt Constraint

    Sketchpad.simulation.ConveyorBeltConstraint = function Sketchpad__simulation__ConveyorBeltConstraint(body, belt) {
	this.body = body
	this.halfLength = body.radius
	this.position = body.position
	this.velocity = body.velocity
	this.belt = belt
    }

    sketchpad.addClass(Sketchpad.simulation.ConveyorBeltConstraint, true)

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.description = function() { return  "Sketchpad.simulation.ConveyorBeltConstraint(Number L, FreeBody Body, ConveyorBelt Belt) states that the body with diameter L and position Pos and velocity vector Vel is going to land and move based on the conveyor belt Belt's velocity." }

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.propertyTypes = {body: 'FreeBody', belt: 'Belt'}

    Sketchpad.simulation.ConveyorBeltConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.ConveyorBeltConstraint(FreeBody.dummy(x, y), Belt.dummy(x, y))
    }

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	var velocity = this.velocity
	var belt = this.belt
	var beltP1 = belt.position1
	var beltP2 = belt.position2
	var beltSpeed = belt.speed
	if (Sketchpad.simulation.detectContact(this.halfLength, this.position, velocity, beltP1, beltP2)) {
	    this.contact = true
	    var slopeV = Sketchpad.simulation.slopeVector(beltP1, beltP2)
	    this.targetVelocity = {x: velocity.x + (slopeV.y * beltSpeed), y: velocity.y + (slopeV.x * beltSpeed)}
	} else
	    this.contact = false
    }
    
    Sketchpad.simulation.ConveyorBeltConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var belt = this.belt
	var beltP1 = belt.position1
	var beltP2 = belt.position2
	return (Sketchpad.simulation.detectContact(this.halfLength, this.position, this.velocity, beltP1, beltP2)) ? 1 : 0	
    }

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.contact ? magnitude(minus(this.targetVelocity, this.velocity)) : 0
    }

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: this.targetVelocity}
    }

    // NoOverlap Constraint

    Sketchpad.simulation.NoOverlapConstraint = function Sketchpad__simulation__NoOverlapConstraint(body1, body2) {
	this.body1 = body1
	this.length1 = body1.radius / 2
	this.position1 = body1.position
	this.velocity1 = body1.velocity
	this.body2 = body2
	this.length2 = body2.radius / 2
	this.position2 = body2.position
	this.velocity2 = body2.velocity
    }

    sketchpad.addClass(Sketchpad.simulation.NoOverlapConstraint, true)

    Sketchpad.simulation.NoOverlapConstraint.prototype.description = function() { return  "Sketchpad.simulation.NoOverlapConstraint(FreeBody Body1, FreeBody Body1) states that the Body1 with diameter L1 and position Pos1 and velocity vector Vel1 and the Body2 with diameter L2 and position Pos2 and velocity vector Vel2 will push each other if touching." }

    Sketchpad.simulation.NoOverlapConstraint.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody'}

    Sketchpad.simulation.NoOverlapConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.NoOverlapConstraint(FreeBody.dummy(x, y), FreeBody.dummy(x +100, y + 100))
    }

    Sketchpad.simulation.NoOverlapConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var length1 = this.length1
	var position1 = this.position1
	var velocity1 = this.velocity1
	var length2 = this.length2
	var position2 = this.position2
	var p1x = position1.x, p1y = position1.y
	var p2x = position2.x, p2y = position2.y
	return ((p1x > p2x - length2 / 2 && p1x < p2x + length2) &&
		(p1y > p2y - length2 / 2 && p1y < p2y + length2)) ? 1 : 0
    }

    Sketchpad.simulation.NoOverlapConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var length1 = this.length1
	var position1 = this.position1
	var velocity1 = this.velocity1
	var length2 = this.length2
	var position2 = this.position2
	var p1x = position1.x
	var p2x = position2.x
	var soln = p1x > p2x ? {position2: {x: p1x - (length2)}} : {position1: {x: p2x - (length1)}}
	return soln
    }

    //  Spring Constraint

    Sketchpad.simulation.SpringConstraint = function Sketchpad__simulation__SpringConstraint(body1, body2, spring) {
	this.body1 = body1
	this.body2 = body2
	this.position1 = body1.position
	this.velocity1 = body1.velocity
	this.acceleration1 = body1.acceleration
	this.mass1 = body1.mass
	this.position2 = body2.position
	this.velocity2 = body2.velocity
	this.acceleration2 = body2.acceleration
	this.mass2 = body2.mass
	this.spring = spring
	this._lastVelocities = [undefined, undefined]
    }

    sketchpad.addClass(Sketchpad.simulation.SpringConstraint, true)

    Sketchpad.simulation.SpringConstraint.prototype.description = function() { return  "Sketchpad.simulation.SpringConstraint(FreeBody Body1, FreeBody Body2, Spring S) states that spring S has been attached to two bodies Body1 and Body2." }

    Sketchpad.simulation.SpringConstraint.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody', spring: 'Spring'}

    Sketchpad.simulation.SpringConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.SpringConstraint(FreeBody.dummy(x, y), FreeBody.dummy(x+100, y+100), Sketchpad.simulation.Spring.dummy(x, y))
    }

    Sketchpad.simulation.SpringConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this._lastVelocities[0] = scaledBy(this.velocity1, 1)
	this._lastVelocities[1] = scaledBy(this.velocity2, 1)
    }

    Sketchpad.simulation.SpringConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var spring = this.spring
	if (spring.torn) {
	    return 0
	}
	var positions = [this.position1, this.position2]
	var masses = [this.mass1, this.mass2]
	var velocities = [this.velocity1, this.velocity2]
	var accelerations = [this.acceleration1, this.acceleration2]
	var dt = pseudoTime - prevPseudoTime
	var err = 0
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    var d = {x: 0, y: 0}
	    if (mass > 0) { // if not anchored
		var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)		
		var stretchLen =  springCurrLen - spring.length
		var newAccelerationMag = spring.k * stretchLen / mass
		var acc = scaledBy(normalized(vector), -newAccelerationMag)
		err += magnitude(minus(plus(this._lastVelocities[j], scaledBy(acc, dt)), velocities[j]))
	    }
	}
	return err
    }

    Sketchpad.simulation.SpringConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var soln = {}
	var spring = this.spring
	var positions = [this.position1, this.position2]
	var masses = [this.mass1, this.mass2]
	var velocities = [this.velocity1, this.velocity2]
	var accelerations = [this.acceleration1, this.acceleration2]
	var dt = pseudoTime - prevPseudoTime
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    var d = {x: 0, y: 0}, torn = false
	    if (mass > 0) { // if not anchored
				var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)
		var stretchLen =  springCurrLen - spring.length
		// if not torn apart...
		torn = stretchLen > spring.tearPointAmount
		if (!torn) {
		    var newAccelerationMag = spring.k * stretchLen / mass
		    var acc = scaledBy(normalized(vector), -newAccelerationMag)
		    d = plus(this._lastVelocities[j], scaledBy(acc, dt))
		} 
	    }
	    if (torn)
		soln['spring'] = {torn: true}
	    soln['velocity' + (j+1)] = d
	}	
	return soln
    }

    //  OrbitalMotion Constraint

    Sketchpad.simulation.OrbitalMotionConstraint = function Sketchpad__simulation__OrbitalMotionConstraint(sun, moon, distanceDownscale) {
	this.sun = sun
	this.moon = moon
	this.position = moon.position
	this._lastPosition = undefined
	this._lastSunPosition = undefined
	this.distanceDownscale = (distanceDownscale || (1e9 / 2))
    }

    sketchpad.addClass(Sketchpad.simulation.OrbitalMotionConstraint, true)

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.description = function() { return  "Sketchpad.simulation.OrbitalMotionConstraint(FreeBody Sun, FreeBody Moon) states that Moon body is orbiting around Sun body according to simple orbital motion formula." }

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.propertyTypes = {sun: 'FreeBody', moon: 'FreeBody'}

    Sketchpad.simulation.OrbitalMotionConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.OrbitalMotionConstraint(FreeBody.dummy(x, y), FreeBody.dummy(x + 200, y))
    }

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	//if (this._lastSunPosition)
	    //this.position.set(plus(this.position, minus(this.sun.position, this._lastSunPosition)))
	this._lastPosition = scaledBy(this.position, 1)
	//this._lastSunPosition = scaledBy(this.sun.position, 1)
    }

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.currentEscapeVelocity = function() {
	var p1 = this.position, p2 = this.sun.position
	var dist0 = distance(p1, p2)
	var dist = dist0 * this.distanceDownscale	
	var vMag0 = Math.sqrt((2 * Sketchpad.simulation.G * this.sun.mass) / dist)
	var vMag = vMag0 / this.distanceDownscale 
	var slopeV = Sketchpad.simulation.slopeVector(p1, p2)
	return {x: slopeV.x * vMag, y: slopeV.y * vMag}
    }
    
    Sketchpad.simulation.OrbitalMotionConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	this._targetVelocity = this.currentEscapeVelocity()
	return magnitude(minus(plus(this._lastPosition, scaledBy(this._targetVelocity, dt)), this.position))	
    }

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this._lastPosition, scaledBy(this._targetVelocity, dt))}
    }
}

module.exports.install = installSimulationConstraints

},{}],4:[function(require,module,exports){
function install3DGeometricConstraints(Sketchpad) {

    // This is a collection of geometric constraints that can be applied to
    // objects that have x and y properties. Other properties are ignored.

    Sketchpad.geom3d = {}

    var square = Sketchpad.geom.square

    function plus(p1, p2) {
	return {x: p1.x + p2.x, y: p1.y + p2.y, z: p1.z + p2.z}
    }
    
    function minus(p1, p2) {
	return {x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z}
    }

    function scaledBy(p, m) {
	return {x: p.x * m, y: p.y * m, z: p.z * m}
    }

    function copy(p) {
	return scaledBy(p, 1)
    }
    
    function midpoint(p1, p2) {
	return scaledBy(plus(p1, p2), 0.5)
    }

    function magnitude(p) {
	return Math.sqrt(square(p.x) + square(p.y) + square(p.z))
    }

    function normalized(p) {
	var m = magnitude(p)
	return m > 0 ? scaledBy(p, 1 / m) : p
    }

    function distance(p1, p2) {
	return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y) + square(p1.z - p2.z))
    }

    function rotatedBy(p, dTheta) {
	var c = Math.cos(dTheta)
	var s = Math.sin(dTheta)
	return {x: c*p.x - s*p.y, y: s*p.x + c*p.y, z: p.z}
    }
    
    function rotatedAround(p, dTheta, axis) {
	return plus(axis, rotatedBy(minus(p, axis), dTheta))
	/*
	// rotate the point (x,y,z) about the vector ⟨u,v,w⟩ by the angle θ (around origin?)
	var x = p.x, y = p.y, z = p.z, u = axis.x, v = axis.y, w = axis.z
	var c = Math.cos(dTheta), s = Math.sin(dTheta)
	var one = (u * x) + (v * y) + (w * z), two = (u * u) + (v * v) + (w * w), three = Math.sqrt(two)
	return {x: ((u * one * (1 - c))  + (two * x * c) + (three * s * ((v * z) - (w * y)))) / two,
	y: ((v * one * (1 - c))  + (two * y * c) + (three * s * ((w * x) - (u * z)))) / two,
 	z: ((w * one * (1 - c))  + (two * z * c) + (three * s * ((u * y) - (v * x)))) / two}
	*/
    }
    
    function setDelta(d, p, scale) {
	d.x = p.x * scale
	d.y = p.y * scale
	d.z = p.z * scale
    }

    function dotProduct(v1, v2) {
	return (v1.x * v2.x) + (v1.y * v2.y) + (v1.z * v2.z)
    }

    function crossProduct(v1, v2) {
	var a = new THREE.Vector3(v1.x, v1.y, v1.z)
	var b = new THREE.Vector3(v2.x, v2.y, v2.z)
	var c = new THREE.Vector3()
	c.crossVectors( a, b )
	return new Point3D(c.x, c.y, c.z)
    }

    function angle(v1, v2, axis) {
	//var langle = Math.acos(Math.min(1, dotProduct(normalized(v1), normalized(v2))))
	var v1m = Sketchpad.geom3d.magnitude(v1), v2m = Sketchpad.geom3d.magnitude(v2)
	var prod2 = (v1m * v2m)
	if (prod2 == 0)
	    langle = 0
	else {
	    var prod1 = dotProduct(v1, v2)
	    var div = Math.min(1, prod1 / prod2)
	    langle = Math.acos(div)
	    var cross = crossProduct(v1, v2)
	    var dot = dotProduct(axis, cross)
	    if (dot > 0) // Or > 0
		langle = -langle
	}	
	return langle
    }
        
    Sketchpad.geom3d.plus = plus
    Sketchpad.geom3d.minus = minus
    Sketchpad.geom3d.scaledBy = scaledBy
    Sketchpad.geom3d.copy = copy
    Sketchpad.geom3d.midpoint = midpoint
    Sketchpad.geom3d.magnitude = magnitude
    Sketchpad.geom3d.normalized = normalized
    Sketchpad.geom3d.distance = distance
    Sketchpad.geom3d.rotatedBy = rotatedBy
    Sketchpad.geom3d.angle = angle
    Sketchpad.geom3d.dotProduct = dotProduct
    Sketchpad.geom3d.crossProduct = crossProduct
    Sketchpad.geom3d.rotatedAround = rotatedAround
    Sketchpad.geom3d.setDelta = setDelta

    // Coordinate Constraint, i.e., "I want this point to be here".

    Sketchpad.geom3d.CoordinateConstraint = function Sketchpad__geom3__CoordinateConstraint(p, x, y, z) {
	this.p = p
	this.c = new Point3D(x, y, z)
    }

    sketchpad.addClass(Sketchpad.geom3d.CoordinateConstraint, true)

    Sketchpad.geom3d.CoordinateConstraint.prototype.description = function() { return  "Sketchpad.geom3d.CoordinateConstraint(Point P, Number X, Number Y, Number Z) states that point P should stay at coordinate (X, Y, Z)." }

    Sketchpad.geom3d.CoordinateConstraint.prototype.propertyTypes = {p: 'Point3D', c: 'Point3D'}

    Sketchpad.geom3d.CoordinateConstraint.prototype.effects = function() {
	return [{obj: this.p, props: ['x', 'y', 'z']}]
    }

    Sketchpad.geom3d.CoordinateConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.c, this.p))
    }

    Sketchpad.geom3d.CoordinateConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p: {x: this.c.x, y: this.c.y, z: this.c.z}}
    }

    // Length constraint - maintains distance between P1 and P2 at L.

    Sketchpad.geom3d.LengthConstraint = function Sketchpad__geom3d__LengthConstraint(p1, p2, l) {
	this.p1 = p1
	this.p2 = p2
	this.l = l
    }

    sketchpad.addClass(Sketchpad.geom3d.LengthConstraint, true)

    Sketchpad.geom3d.LengthConstraint.prototype.description = function() { return  "Sketchpad.geom3d.LengthConstraint(Point3D P1, Point3D P2, Number L) says points P1 and P2 always maintain a distance of L." }

    Sketchpad.geom3d.LengthConstraint.prototype.propertyTypes = {p1: 'Point3D', p2: 'Point3D', l: 'Number'}

    Sketchpad.geom3d.LengthConstraint.prototype.effects = function() {
	return [{obj: this.p1, props: ['x', 'y', 'z']}, {obj: this.p2, props: ['x', 'y', 'z']}]
    }

    Sketchpad.geom3d.LengthConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	return l12 - this.l
    }

    Sketchpad.geom3d.LengthConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var p1 = this.p1, p2 = this.p2
	var l12 = magnitude(minus(p1, p2))
	if (l12 == 0) {
	    p1 = plus(p1, {x: 0.1, y: 0, z: 0})
	    p2 = plus(p2, {x: -0.1, y: 0, z: 0})
	}
	var delta = (l12 - this.l) / 2
	var e12 = scaledBy(Sketchpad.geom3d.normalized(minus(p2, p1)), delta)
	return {p1: plus(this.p1, e12), p2: plus(this.p2, scaledBy(e12, -1))}
    }

    // Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
    // w is in units of Hz - whole rotations per second.

    Sketchpad.geom3d.MotorConstraint = function Sketchpad__geom__MotorConstraint(p1, p2, w) {
	this.p1 = p1
	this.p2 = p2
	this.w = w
    }

    sketchpad.addClass(Sketchpad.geom3d.MotorConstraint, true)

    Sketchpad.geom3d.MotorConstraint.prototype.description = function() { return  "Sketchpad.geom3d.MotorConstraint(Point P1, Point P2, Number W) causes P1 and P2 to orbit their midpoint at the given rate of w, in units of Hz: whole rotations per second." } 

    Sketchpad.geom3d.MotorConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', w: 'Number'}
    
    Sketchpad.geom3d.MotorConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return 1
    }

    Sketchpad.geom3d.MotorConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var t = (pseudoTime - prevPseudoTime) / 1000.0
	var dTheta = t * this.w * (2 * Math.PI)
	var m12 = midpoint(this.p1, this.p2)
	return {p1: rotatedAround(this.p1, dTheta, m12),
		p2: rotatedAround(this.p2, dTheta, m12)}
    }
        
}

///////////////////////////////////////////////////////////////////////////

module.exports.install = install3DGeometricConstraints

},{}],5:[function(require,module,exports){
function install3DSimulationConstraints(Sketchpad) {

    // This is a collection of simulation constraints that can be applied to
    // arbitrary properties of arbitrary objects. "References" are represented
    // as (object, propertyName) tuples, e.g., {obj: yourMom, prop: 'weight'}.

    Sketchpad.simulation3d = { g: 9.8, G: 6.7e-11 } // G: Nm2/kg2 

    var minus = Sketchpad.geom3d.minus
    var plus = Sketchpad.geom3d.plus
    var scaledBy = Sketchpad.geom3d.scaledBy
    var magnitude = Sketchpad.geom3d.magnitude
    var normalized = Sketchpad.geom3d.normalized
    var distance = Sketchpad.geom3d.distance
    var angle = Sketchpad.geom3d.angle

    // Classes

    Sketchpad.simulation3d.FreeBody = function Sketchpad__simulation3d__FreeBody(position, optRadius, optDrawnRadius, optMass, optColor) {
	this.position = position
	this.mass = optMass || 10
	this.velocity = new Vector3D(0, 0, 0)
	this.acceleration = new Vector3D(0, 0, 0)
	this.radius = optRadius || this.position.radius
	this.drawnRadius = optDrawnRadius || this.radius
	rc.add(new Sphere(position, optColor, this.drawnRadius))
    }

    sketchpad.addClass(Sketchpad.simulation3d.FreeBody)

    Sketchpad.simulation3d.FreeBody.prototype.propertyTypes = {position: 'Point3D', mass: 'Number', radius: 'Number'}

    Sketchpad.simulation3d.Spring = function Sketchpad__simulation3d__Spring(body1, body2, k, length, tearPointAmount, optColor) {
	this.body1 = body1
	this.body1 = body2
	this.line = rc.add(new Cylinder(body1.position, body2.position, optColor))
	this.k = k
	this.length = length    
	this.tearPointAmount = tearPointAmount
	this.torn = false
    }
    
    sketchpad.addClass(Sketchpad.simulation3d.Spring)
    
    Sketchpad.simulation3d.Spring.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody', k: 'Number', length: 'Number', teatPointAmount: 'Number'}
    
    Sketchpad.simulation3d.Spring.prototype.solutionJoins = function() {
	return {torn: rc.sketchpad.lastOneWinsJoinSolutions}
    }

    Sketchpad.simulation3d.Spring.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	if (this.line) {
	    if (this.torn) {
		rc.remove(this.line)
		this.line = undefined
	    } else {
		var height = this.line.getHeight(), length = this.length
		var stretch = Math.abs(height - length) / length
		var color = this.line._sceneObj.material.color
		color.set('gray')
		color.r += stretch
	    }
	}
    }
	    
    // Motion Constraint
	
    Sketchpad.simulation3d.VelocityConstraint = function Sketchpad__simulation3d__VelocityConstraint(body) {
	this.body = body
	this.position = body.position
	this.velocity = body.velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityConstraint, true)

    Sketchpad.simulation3d.VelocityConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.VelocityConstraint(FreeBody Body) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityConstraint.prototype.propertyTypes = {body: 'FreeBody'}

    Sketchpad.simulation3d.VelocityConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	this.lastPosition = scaledBy(this.position, 1)
    }
    
    Sketchpad.simulation3d.VelocityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity, dt)), this.position))
    }

    Sketchpad.simulation3d.VelocityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity, dt))}
    }

    // Body With Velocity Constraint

    Sketchpad.simulation3d.VelocityConstraint2 = function Sketchpad__simulation3d__VelocityConstraint2(body, velocity) {
	this.body = body
	this.position = body.position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityConstraint2, true)

    Sketchpad.simulation3d.VelocityConstraint2.prototype.description = function() { return  "Sketchpad.simulation3d.VelocityConstraint2(FreeBody Body, PointVector3D Velocity) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityConstraint2.prototype.propertyTypes = {body: 'FreeBody', velocity: 'Point'}
    
    Sketchpad.simulation3d.VelocityConstraint2.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastPosition = scaledBy(this.position, 1)
    }

    Sketchpad.simulation3d.VelocityConstraint2.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt)), this.position))
    }
    
    Sketchpad.simulation3d.VelocityConstraint2.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt))}
    }

    // Acceleration Constraint

    Sketchpad.simulation3d.AccelerationConstraint = function Sketchpad__simulation3d__AccelerationConstraint(body, acceleration) {
	this.body = body
	this.velocity = body.velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation3d.AccelerationConstraint, true)

    Sketchpad.simulation3d.AccelerationConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.AccelerationConstraint(FreeBody Body, Vector Acceleration) states for Body: Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.propertyTypes = {body: 'FreeBody', velocity: 'Vector3D'}

    Sketchpad.simulation3d.AccelerationConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastVelocity, scaledBy(this.acceleration, dt)), this.velocity))
    }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {velocity: plus(this.lastVelocity, scaledBy(this.acceleration, dt))}
    }

    // Air Resistance Constraint

    Sketchpad.simulation3d.AirResistanceConstraint = function Sketchpad__simulation3d__AirResistanceConstraint(body, scale) {
	this.body = body
	this.velocity = body.velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation3d.AirResistanceConstraint, true)

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.AirResistanceConstraint(FreeBody Body, Number Scale) states for Body: Velocity = old(Velocity) * Scale ." }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.propertyTypes = {scale: 'Number', body: 'FreeBody'}

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(scaledBy(this.lastVelocity, this.scale), this.velocity))
    }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: scaledBy(this.lastVelocity, this.scale)}
    }

    //  Spring Constraint

    Sketchpad.simulation3d.SpringConstraint = function Sketchpad__simulation3d__SpringConstraint(body1, body2, spring) {
	this.body1 = body1
	this.body2 = body2
	this.position1 = body1.position
	this.velocity1 = body1.velocity
	this.acceleration1 = body1.acceleration
	this.mass1 = body1.mass
	this.position2 = body2.position
	this.velocity2 = body2.velocity
	this.acceleration2 = body2.acceleration
	this.mass2 = body2.mass
	this.spring = spring
	this._lastVelocities = [undefined, undefined]
    }

    sketchpad.addClass(Sketchpad.simulation3d.SpringConstraint, true)

    Sketchpad.simulation3d.SpringConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.SpringConstraint(FreeBody Body1, FreeBody Body2, Spring S) states that spring S has been attached to two bodies Body1 and Body2." }

    Sketchpad.simulation3d.SpringConstraint.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody', spring: 'Spring'}

    Sketchpad.simulation3d.SpringConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this._lastVelocities[0] = scaledBy(this.velocity1, 1)
	this._lastVelocities[1] = scaledBy(this.velocity2, 1)
    }

    Sketchpad.simulation3d.SpringConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var spring = this.spring
	if (spring.torn) {
	    return 0
	}
	var positions = [this.position1, this.position2]
	var masses = [this.mass1, this.mass2]
	var velocities = [this.velocity1, this.velocity2]
	var accelerations = [this.acceleration1, this.acceleration2]
	var dt = pseudoTime - prevPseudoTime
	var err = 0
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    if (mass > 0) { // if not anchored		
		var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)		
		var stretchLen =  springCurrLen - spring.length
		var newAccelerationMag = spring.k * stretchLen / mass
		var acc = scaledBy(normalized(vector), -newAccelerationMag)
		err += magnitude(minus(plus(this._lastVelocities[j], scaledBy(acc, dt)), velocities[j]))
	    }
	}
	return err
    }

    Sketchpad.simulation3d.SpringConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var soln = {}
	var spring = this.spring
	var positions = [this.position1, this.position2]
	var masses = [this.mass1, this.mass2]
	var velocities = [this.velocity1, this.velocity2]
	var accelerations = [this.acceleration1, this.acceleration2]
	var dt = pseudoTime - prevPseudoTime
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    var d = {x: 0, y: 0, z: 0}, torn = false
	    if (mass > 0) { // if not anchored		
		var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)
		var stretchLen =  springCurrLen - spring.length
		// if not torn apart...
		torn = stretchLen > spring.tearPointAmount
		if (!torn) {
		    var newAccelerationMag = spring.k * stretchLen / mass
		    var acc = scaledBy(normalized(vector), -newAccelerationMag)
		    d = plus(this._lastVelocities[j], scaledBy(acc, dt))
		} 
	    }
	    if (torn)
		soln['spring'] = {torn: true}
	    soln['velocity' + (j+1)] = d
	}	
	return soln
    }

    //  OrbitalMotion Constraint

    Sketchpad.simulation3d.OrbitalMotionConstraint = function Sketchpad__simulation3d__OrbitalMotionConstraint(sun, moon, distanceDownscale) {
	this.sun = sun
	this.moon = moon
	this.position = moon.position
	this._lastPosition = undefined
	this._lastSunPosition = undefined
	this.distanceDownscale = (distanceDownscale || (1e9 / 2))
    }

    sketchpad.addClass(Sketchpad.simulation3d.OrbitalMotionConstraint, true)

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.OrbitalMotionConstraint(FreeBody Sun, FreeBody Moon) states that Moon body is orbiting around Sun body according to simple orbital motion formula." }

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.propertyTypes = {sun: 'FreeBody', moon: 'FreeBody'}

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	//if (this._lastSunPosition)
	    //this.position.set(plus(this.position, minus(this.sun.position, this._lastSunPosition)))
	this._lastPosition = scaledBy(this.position, 1)
	//this._lastSunPosition = scaledBy(this.sun.position, 1)
    }

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.currentEscapeVelocity = function() {
	var p1 = this.position, p2 = this.sun.position
	var dist0 = distance(p1, p2)
	var dist = dist0 * this.distanceDownscale	
	var vMag0 = Math.sqrt((2 * Sketchpad.simulation3d.G * this.sun.mass) / dist)
	var vMag = vMag0 / this.distanceDownscale 
	var slopeV = Sketchpad.simulation.slopeVector({x: p1.x, y: p1.z}, {x: p2.x, y: p2.z})
	return {x: slopeV.x * vMag, y: 0, z: slopeV.y * vMag}
    }
    
    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	this._targetVelocity = this.currentEscapeVelocity()
	return magnitude(minus(plus(this._lastPosition, scaledBy(this._targetVelocity, dt)), this.position))	
    }

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this._lastPosition, scaledBy(this._targetVelocity, dt))}
    }

}

module.exports.install = install3DSimulationConstraints

},{}],6:[function(require,module,exports){
// --------------------------------------------------------------------
// Imports
// ------------- -------------------------------------------------------

var installArithmeticConstraints = require('./2d/arithmetic-constraints.js').install
var installGeometricConstraints = require('./2d/geometric-constraints.js').install
var installSimulationConstraints = require('./2d/simulation-constraints.js').install
var install3DGeometricConstraints = require('./3d/geometric-constraints.js').install
var install3DSimulationConstraints = require('./3d/simulation-constraints.js').install

// --------------------------------------------------------------------
// Global Messy Stuff
// --------------------------------------------------------------------

var __idCtr = 1
Object.defineProperty(Object.prototype, '__id', {
    get: function() {
	if (!this.hasOwnProperty('___id'))
	    this.___id = __idCtr++
	return this.___id
    }
})
Object.defineProperty(Object.prototype, '__type', {
    get: function() {
	if (!this.hasOwnProperty('___type'))
	    this.___type = this.constructor.name.replace(/__/g, '.')
	return this.___type
    }
})
Object.defineProperty(Object.prototype, '__shortType', {
    get: function() {
	var res = this.__type
	return res.substring(res.lastIndexOf('.') + 1)
    }
})
Object.defineProperty(Object.prototype, '__toString', {
    get: function() {
	return this.__shortType + '@' + this.__id
    }
})
Object.defineProperty(Object.prototype, '__container', {
    get: function() {
	if (!this.hasOwnProperty('___container'))
	    this.___container = rc
	return this.___container
    }
})
Object.defineProperty(Object.prototype, '__scratch', {
    get: function() {
	if (!this.hasOwnProperty('___scratch'))
	    this.___scratch = {}
	return this.___scratch
    }
})
// --------------------------------------------------------------------
// Public
// --------------------------------------------------------------------

function Sketchpad() {
    this.rho = 0.25
    this.epsilon = 0.01
    this.debug = false
    this.solveEvenWithoutError = false
    this.solveEvenWithoutErrorOnPriorityDifferences = false
    this.constraints = []
    this.thingConstructors = {}
    this.constraintConstructors = {}
    this.objMap = {}
    this.perThingPerPropEffectingConstraints = {}
    this.eventHandlers = []
    this.eventHandlersInternal = {}
    this.eventDescriptions = {}
    this.onEachTimeStepHandlerDescriptions = {}
    this.events = []
    this.thingsWithOnEachTimeStepFn = []
    this.thingsWithAfterEachTimeStepFn = []
    this.startTime = Date.now()
    this.pseudoTime = 0
    this.prevPseudoTime = 0
    this.scratch = {}
}

Sketchpad.prototype.addClass = function(aClass, isConstraint) {
    var className = aClass.name.replace(/__/g, '.')
    var list = isConstraint ? this.constraintConstructors : this.thingConstructors    
    list[className] = aClass
    aClass.prototype.__isSketchpadThing = true
    aClass.prototype.__isConstraint = isConstraint
}

Sketchpad.prototype.markObjectWithIdIfNew = function(obj) {
    var id = obj.__id
    if (this.objMap[id])
	return true
    this.objMap[id] = obj
    return false
}

Sketchpad.prototype.getObject = function(id) {
    return this.objMap[id]
}

Sketchpad.prototype.addConstraint = function(constraint) {
    if (!constraint.__priority)
	constraint.__priority = 0
    //this.constraints.push(constraint)
    var prio = constraint.__priority
    var addIdx = 0
    while (addIdx < this.constraints.length && this.constraints[addIdx].__priority < prio)
	addIdx++
    if (this.solveEvenWithoutErrorOnPriorityDifferences) {
	this.addToPerThingPerPropertyEffectorsForConstraint(constraint, this.perThingPerPropEffectingConstraints)
	this.computeConstraintsCompetingWithALowerPriorityOneForConstraint(constraint)
    }
    this.constraints.splice(addIdx, 0, constraint)
    for (var p in constraint) {
	if (constraint.hasOwnProperty(p)) {
	    var obj = constraint[p]
	    if (obj !== undefined && !this.objMap[obj.__id])
		this.objMap[obj.__id] = obj
	}
    }
    return constraint
}

Sketchpad.prototype.removeConstraint = function(unwantedConstraint) {
    var self = this
    this.constraints = this.constraints.filter(function(constraint) {
	return constraint !== unwantedConstraint &&
            !(involves(constraint, unwantedConstraint))
    })
    if (this.solveEvenWithoutErrorOnPriorityDifferences)
	this.computePerThingPerPropertyEffectors()
}

Sketchpad.prototype.clear = function() {
    this.rho = 0.25
    this.epsilon = 0.01
    this.searchOn = false
    this.solveEvenWithoutError = false
    this.solveEvenWithoutErrorOnPriorityDifferences = false
    this.constraints = []
    this.objMap = {}
    this.eventHandlers = []
    this.events = []
    this.thingsWithOnEachTimeStepFn = []
    this.thingsWithAfterEachTimeStepFn = []
    this.perThingPerPropEffectingConstraints = {}
    this.startTime = Date.now()
    this.pseudoTime = 0
    this.prevPseudoTime = 0
    this.scratch = {}
    // remove existing event handlers
    for (var name in this.eventHandlersInternal)
	this.eventHandlersInternal[name].forEach(function(handler) { document.body.removeEventListener(name, handler) })
    this.eventHandlersInternal = {}
    this.eventDescriptions = {}
    this.onEachTimeStepHandlerDescriptions = {}
}

Sketchpad.prototype.computeCurrentError = function() {
    var pseudoTime = this.pseudoTime
    var prevPseudoTime = this.prevPseudoTime 
    var totalError = 0
    for (var idx = 0; idx < this.constraints.length; idx++) {
	var c = this.constraints[idx]
	var er = Math.abs(c.computeError(pseudoTime, prevPseudoTime))	
	totalError += er
    }
    return totalError
}
    
Sketchpad.prototype.collectPerConstraintSolutions = function(timeMillis, inFixPointProcess) {
    var pseudoTime = this.pseudoTime
    var prevPseudoTime = this.prevPseudoTime 
    var self = this
    var allSolutions = []
    var didSomething = false, localDidSomething = false, totalError = 0
    for (var idx = 0; idx < this.constraints.length; idx++) {
	var c = this.constraints[idx]
	var searchable = c.__searchable
	if (inFixPointProcess && searchable)
	    continue
	var er = Math.abs(c.computeError(pseudoTime, prevPseudoTime))	
	totalError += er
	if (er > self.epsilon
	    || this.solveEvenWithoutError || (this.solveEvenWithoutErrorOnPriorityDifferences && this.constraintIsCompetingWithALowerPriorityOne(c))
	   ) {
	    var solutions = c.solve(pseudoTime, prevPseudoTime)
	    /*
	    if (solutions instanceof Array) {
		if (inFixPointProcess) {
		    var count = solutions.length
		    var choice =  Math.floor(Math.random() * count)
		    solutions = solutions[choice]
		}
	    } else if (!inFixPointProcess) {
		solutions = [solutions]
	    }
	    */
	    if (!(inFixPointProcess || searchable))
		solutions = [solutions]
	    localDidSomething = true
	    allSolutions.push({constraint: c, solutions: solutions})
	}
    }
    if (localDidSomething) {
	didSomething = true
    } else
	totalError = 0
    return {didSomething: didSomething, error: totalError, solutions: allSolutions}
}

Sketchpad.prototype.collectPerPropertySolutions = function(allSolutions) {
    var self = this
    var collectedSolutions = {}, seenPriorities = {}
    allSolutions.forEach(function(d) {
	collectPerPropertySolutionsAddSolution(self, d, collectedSolutions, seenPriorities)
    })
    return collectedSolutions
}

Sketchpad.prototype.doOneIteration = function(timeMillis) {
    if (this.beforeEachIteration)
	(this.beforeEachIteration)()
    var res = this.collectPerConstraintSolutions(timeMillis, true)
    var didSomething = res.didSomething
    var totalError = res.error
    if (didSomething) {
	var allSolutions = res.solutions
	var collectedSolutions = this.collectPerPropertySolutions(allSolutions)
	applySolutions(this, collectedSolutions)
    }
    return totalError
}

Sketchpad.prototype.computePerThingPerPropertyEffectors = function() {
    var res = {}
    this.constraints.forEach(function(c) {
	this.addToPerThingPerPropertyEffectorsForConstraint(c, res)
    }.bind(this))
    this.perThingPerPropEffectingConstraints = res  
    this.computeConstraintsCompetingWithALowerPriorityOne()
}

Sketchpad.prototype.addToPerThingPerPropertyEffectorsForConstraint = function(c, res) {
    if (c.effects) {
	c.effects().forEach(function(e) { 
	    var id = e.obj.__id
	    var eProps = e.props
	    var props, cs
	    if (res[id])
		props = res[id]
	    else {
		props = {}
		res[id] = props
	    }
	    eProps.forEach(function(prop) {
		if (props[prop])
		    cs = props[prop]
		else {
		    cs = []
		    props[prop] = cs
		}
		cs.push(c)		
	    })
	})	    
    }
}

Sketchpad.prototype.constraintIsCompetingWithALowerPriorityOne = function(constraint) {
    return this.computeConstraintsCompetingWithALowerPriorityOne[constraint.__id] !== undefined
}

Sketchpad.prototype.computeConstraintsCompetingWithALowerPriorityOneForConstraint = function(constraint) {
    for (var id in this.perThingPerPropEffectingConstraints) {
	var thingEffs = this.perThingPerPropEffectingConstraints[id]
	for (var p in thingEffs) {
	    var cs = thingEffs[p]
	    if (cs.indexOf(constraint) >= 0) {
		for (var i = 0; i < cs.length; i++) {
		    var c = cs[i]
		    if (c !== constraint && c.__priority < constraint.__priority) {
			this.computeConstraintsCompetingWithALowerPriorityOne[constraint.__id] = true
			return
		    }
		}
	    }
	}
    }
}

Sketchpad.prototype.computeConstraintsCompetingWithALowerPriorityOne = function() {    
    this.constraints.forEach(function(constraint) {    
	this.computeConstraintsCompetingWithALowerPriorityOneForConstraint(constraint)
    }.bind(this))
}

Sketchpad.prototype.currentTime = function() {
    return Date.now() - this.startTime
}

Sketchpad.prototype.doTasksOnEachTimeStep = function(pseudoTime, prevPseudoTime) {
    this.handleEvents()
    this.doOnEachTimeStepFns(pseudoTime, prevPseudoTime)
    if (this.onEachTimeStep) 
	(this.onEachTimeStep)(pseudoTime, prevPseudoTime)
}

Sketchpad.prototype.doTasksAfterEachTimeStep = function(pseudoTime, prevPseudoTime) {
    this.doAfterEachTimeStepFns(pseudoTime, prevPseudoTime)
    if (this.afterEachTimeStep) 
	(this.afterEachTimeStep)(pseudoTime, prevPseudoTime)
    this.maybeStepPseudoTime()
}

Sketchpad.prototype.computeNextPseudoTimeFromProposals = function(pseudoTime, proposals) {
    var res = proposals[0].time
    for (var i = 1; i < proposals.length; i++) {
	time = proposals[i].time
	if (time < res)
	    res = time
    }
    return res
}

Sketchpad.prototype.maybeStepPseudoTime = function() {
    var o = {}
    var pseudoTime = this.pseudoTime
    this.prevPseudoTime = pseudoTime
    var proposals = []
    this.constraints.forEach(function(t) {
        if(t.proposeNextPseudoTime)
            proposals.push({proposer: t, time: t.proposeNextPseudoTime(pseudoTime)})
    })
    if (proposals.length > 0)
	this.pseudoTime = this.computeNextPseudoTimeFromProposals(pseudoTime, proposals)	
}

Sketchpad.prototype.iterateSearchChoicesForUpToMillis = function(timeMillis) {
    var epsilon = this.epsilon
    var sols = this.collectPerConstraintSolutions(timeMillis, false)
    var didSomething = sols.didSomething
    var totalError = sols.error
    var res = {error: totalError, count: 0} //FIXME
    if (didSomething) {
	var allSolutionChoices = sols.solutions
	//find all solution combinations between constraints
	//log(allSolutionChoices)
	var choicesCs = allSolutionChoices.map(function(c) { return c.constraint })
	var cCount = choicesCs.length
	var choicesSs = allSolutionChoices.map(function(c) { return c.solutions })
	var allSolutionCombos = allCombinationsOfArrayElements(choicesSs).map(function(combo) {	    
	    var curr = []
	    for (var i = 0; i < cCount; i++) {
		curr.push({constraint: choicesCs[i], solutions: combo[i]})
	    }
	    return curr
	})
	//log(allSolutionCombos)
	// copy curr state and try one, if works return else revert state move to next until none left
	var count = allSolutionCombos.length
	var choiceTO = timeMillis / count
	if (this.debug) log('possible choices', count, 'per choice timeout', choiceTO)
	for (var i = 0; i < count; i++) {
	    var copied, last = i == count - 1
	    if (this.debug) log('trying choice: ' + i)
	    var allSolutions = allSolutionCombos[i]
	    //log(allSolutions)
	    var collectedSolutions = this.collectPerPropertySolutions(allSolutions)
	    //copy here...	    
	    if (!last)
		copied = this.getCurrentPropValuesAffectableBySolutions(collectedSolutions)
	    applySolutions(this, collectedSolutions)
	    res = this.iterateForUpToMillis(choiceTO)	    
	    var choiceErr = this.computeCurrentError()
	    //log(choiceErr)
	    if (choiceErr < epsilon || last)
		break
	    //revert here
	    this.revertPropValuesBasedOnArg(copied)
	}
    }
    return res
}

Sketchpad.prototype.getCurrentPropValuesAffectableBySolutions = function(solutions) {
    var res = {}
    for (var objId in solutions) {
	var currObj = sketchpad.objMap[objId]
	var propsN = {}
	res[objId] = propsN
	var props = solutions[objId]
	for (var p in props) {
	    propsN[p] = currObj[p]
	}
    }
    return res
}

Sketchpad.prototype.revertPropValuesBasedOnArg = function(values) {
    for (var objId in values) {
	var currObj = sketchpad.objMap[objId]
	var props = values[objId]
	for (var p in props) {
	    currObj[p] = props[p]
	}
    }
}

Sketchpad.prototype.solveForUpToMillis = function(tMillis) {
    this.doTasksOnEachTimeStep(this.pseudoTime, this.prevPseudoTime)
    var res
    if (this.searchOn)	
	res = this.iterateSearchChoicesForUpToMillis(tMillis)
    else
	res = this.iterateForUpToMillis(tMillis)
    this.doTasksAfterEachTimeStep(this.pseudoTime, this.prevPseudoTime)
    return res
}

Sketchpad.prototype.iterateForUpToMillis = function(tMillis) {
    var count = 0, totalError = 0, epsilon = this.epsilon
    //var didSomething
    var currError, lastError
    var t0, t
    t0 = this.currentTime()
    do {
	lastError = currError
	/*didSomething*/ currError = this.doOneIteration(t0)
	t =  this.currentTime() - t0
	//count += didSomething ? 1 : 0
	if (currError > 0) {
	    count++
	    totalError += currError
	}
	//log(currError, lastError)
    } while (
	currError > epsilon
	    && !(currError >= lastError)
	//currError > 0//didSomething 
	    && t < tMillis)
    //log({error: totalError, count: count})
    return {error: totalError, count: count}
}

// various ways we can join solutions from all solvers
// damped average join fn:
Sketchpad.prototype.sumJoinSolutions = function(curr, solutions) {
    //var res = curr
    var rho = this.rho
    var sum = 0
    //solutions.forEach(function(v) { res += (v - curr) * rho })
    solutions.forEach(function(v) { sum += v })
    var res = curr + (rho * ((sum / solutions.length) - curr))
    return res
}

Sketchpad.prototype.lastOneWinsJoinSolutions = function(curr, solutions) {
    return solutions[solutions.length - 1]
}

Sketchpad.prototype.randomChoiceJoinSolutions = function(curr, solutions) {
    return solutions[Math.floor(Math.random() * solutions.length)]
}

Sketchpad.prototype.arrayAddJoinSolutions = function(curr, solutions) {
    solutions.forEach(function(v) { curr.push(v) })
    return curr
}

Sketchpad.prototype.dictionaryAddJoinSolutions = function(curr, solutions) {
    solutions.forEach(function(v) { for (var k in v) curr[k] = v[k] })
    return curr
}

Sketchpad.prototype.defaultJoinSolutions = function(curr, solutions) {
    return  this.sumJoinSolutions(curr, solutions)
}

Sketchpad.prototype.registerEvent = function(name, callback, optDescription) {
    var id = this.eventHandlers.length
    this.eventHandlers.push(callback)
    var handler = function(e) { this.events.push([id, e]) }.bind(this)
    if (!this.eventHandlersInternal[name]) {
	this.eventHandlersInternal[name] = []
	this.eventDescriptions[name] = []
    }
    this.eventHandlersInternal[name].push(handler)
    this.eventDescriptions[name].push(optDescription)
    document.body.addEventListener(name, handler)
}

Sketchpad.prototype.handleEvents = function() {
    this.events.forEach(function(nameAndE) { 
	var id = nameAndE[0]; 
	var e = nameAndE[1]; 
	var h = this.eventHandlers[id]
	if (h !== undefined)
	    h(e) 
    }.bind(this))
    this.events = []
}

Sketchpad.prototype.doOnEachTimeStepFns = function(pseudoTime, prevPseudoTime) {
    this.thingsWithOnEachTimeStepFn.forEach(function(t) { t.onEachTimeStep(pseudoTime, prevPseudoTime) })
}

Sketchpad.prototype.doAfterEachTimeStepFns = function(pseudoTime, prevPseudoTime) {
    this.thingsWithAfterEachTimeStepFn.forEach(function(t) { t.afterEachTimeStep(pseudoTime, prevPseudoTime) })
}

Sketchpad.prototype.setOnEachTimeStep = function(onEachTimeFn, optDescription) {
    this.onEachTimeStep = onEachTimeFn
    if (optDescription)
	this.onEachTimeStepHandlerDescriptions['general'] = [optDescription]
}

Sketchpad.prototype.unsetOnEachTimeStep = function() {
    this.onEachTimeStep = undefined
    delete(this.onEachTimeStepHandlerDescriptions['general'])
}

// --------------------------------------------------------------------
// Private
// --------------------------------------------------------------------
function collectPerPropertySolutionsAddSolution(sketchpad, soln, sofar, seenPriorities) {
    var c = soln.constraint
    var priority = c.__priority
    for (var obj in soln.solutions) {
	var currObj = c[obj]
	var currObjId = currObj.__id
	var d = soln.solutions[obj]
	var keys = Object.keys(d)
	for (var i = 0; i < keys.length; i++) {
	    var prop = keys[i]
	    var perPropSoln = sofar[currObjId]
	    var perPropPrio = seenPriorities[currObjId]
	    var propSolns, prio
	    if (perPropSoln === undefined) {
		perPropSoln = {}
		perPropPrio = {}
		sofar[currObjId] = perPropSoln
		seenPriorities[currObjId] = perPropPrio
		propSolns = []
		perPropSoln[prop] = propSolns
		perPropPrio[prop] = priority
	    } else {		    
		propSolns = perPropSoln[prop]
		if (propSolns === undefined) {
		    propSolns = []
		    perPropSoln[prop] = propSolns
		    perPropPrio[prop] = priority
		}
	    }
	    var lastPrio = perPropPrio[prop]
	    if (priority > lastPrio) {
		perPropPrio[prop] = priority
		while (propSolns.length > 0) propSolns.pop()
	    } else if (priority < lastPrio) {
		break
	    } 
	    propSolns.push(d[prop])
	}
    }
}

function applySolutions(sketchpad, solutions) {    
    //log2(solutions)
    var keys1 = Object.keys(solutions)
    for (var i = 0; i < keys1.length; i++) {
	var objId = keys1[i]
	var perProp = solutions[objId]
	var currObj = sketchpad.objMap[objId]
	var keys2 = Object.keys(perProp)
	for (var j = 0; j < keys2.length; j++) {
	    var prop = keys2[j]
	    var propSolns = perProp[prop]
	    var currVal = currObj[prop]
	    var joinFn = (currObj.solutionJoins !== undefined && (currObj.solutionJoins())[prop] !== undefined) ?
		(currObj.solutionJoins())[prop] : sketchpad.sumJoinSolutions
	    currObj[prop] = (joinFn.bind(sketchpad))(currVal, propSolns)
	}
    }
}

function involves(constraint, obj) {
    for (var p in constraint) {
	if (constraint[p] === obj) {
	    return true
	}
    }
    return false
}

function allCombinationsOfArrayElements(arrayOfArrays) {
    if (arrayOfArrays.length > 1) {
	var first = arrayOfArrays[0]
	var rest = allCombinationsOfArrayElements(arrayOfArrays.slice(1))
	var res = []
	for (var j = 0; j < rest.length ; j++) {
	    var r = rest[j]
	    for (var i = 0; i < first.length; i++) {
		res.push([first[i]].concat(r))
	    }
	}
	return res
    }  else if (arrayOfArrays.length == 1) {
	return arrayOfArrays[0].map(function(e) { return [e] })
    } else
	return []
}

// --------------------------------------------------------------------
// Bootstrap & Install constraint libraries
// --------------------------------------------------------------------
sketchpad = new Sketchpad()
installArithmeticConstraints(Sketchpad)
installGeometricConstraints(Sketchpad)
installSimulationConstraints(Sketchpad)
install3DGeometricConstraints(Sketchpad)
install3DSimulationConstraints(Sketchpad)

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = Sketchpad


},{"./2d/arithmetic-constraints.js":1,"./2d/geometric-constraints.js":2,"./2d/simulation-constraints.js":3,"./3d/geometric-constraints.js":4,"./3d/simulation-constraints.js":5}]},{},[6])(6)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8yZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvM2Qvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0dkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJmdW5jdGlvbiBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzKFNrZXRjaHBhZCkge1xuXG4gICAgLy8gVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2YgYXJpdGhtZXRpYyBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gICAgLy8gYXJiaXRyYXJ5IHByb3BlcnRpZXMgb2YgYXJiaXRyYXJ5IG9iamVjdHMuIFwiUmVmZXJlbmNlc1wiIGFyZSByZXByZXNlbnRlZFxuICAgIC8vIGFzIChvYmplY3QsIHByb3BlcnR5TmFtZSkgdHVwbGVzLCBlLmcuLCB7b2JqOiB5b3VyTW9tLCBwcm9wOiAnd2VpZ2h0J30uXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGggPSB7fVxuXG4gICAgLy8gSGVscGVyc1xuXG4gICAgZnVuY3Rpb24gaW5zdGFsbFJlZih0YXJnZXQsIHJlZiwgcHJlZml4KSB7XG5cdHRhcmdldFtwcmVmaXggKyAnX29iaiddID0gcmVmLm9ialxuXHR0YXJnZXRbcHJlZml4ICsgJ19wcm9wJ10gPSByZWYucHJvcFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlZih0YXJnZXQsIHByZWZpeCkge1xuXHRyZXR1cm4gdGFyZ2V0W3ByZWZpeCArICdfb2JqJ11bdGFyZ2V0W3ByZWZpeCArICdfcHJvcCddXVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhdGNoKHRhcmdldCAvKiAsIHByZWZpeCwgbmV3VmFsLCAuLi4gKi8pIHtcblx0dmFyIHJlc3VsdCA9IHt9XG5cdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG5cdCAgICB2YXIgcHJlZml4ID0gYXJndW1lbnRzW2ldXG5cdCAgICB2YXIgbmV3VmFsID0gYXJndW1lbnRzW2krMV1cblx0ICAgIHZhciBkID0gcmVzdWx0W3ByZWZpeCArICdfb2JqJ11cblx0ICAgIGlmICghZCkge1xuXHRcdHJlc3VsdFtwcmVmaXggKyAnX29iaiddID0gZCA9IHt9XG5cdCAgICB9XG5cdCAgICBkW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV0gPSBuZXdWYWxcblx0fVxuXHRyZXR1cm4gcmVzdWx0XG4gICAgfVxuXG4gICAgLy8gVmFsdWUgQ29uc3RyYWludCwgaS5lLiwgby5wID0gdmFsdWVcblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19WYWx1ZUNvbnN0cmFpbnQocmVmLCB2YWx1ZSkge1xuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZiwgJ3YnKVxuXHR0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50KHtvYmo6IE8sIHByb3A6IHB9LCBWYWx1ZSkgc3RhdGVzIHRoYXQgTy5wID0gVmFsdWUuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50KHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCA0MikgXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHRoaXMudmFsdWUgLSByZWYodGhpcywgJ3YnKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHBhdGNoKHRoaXMsICd2JywgdGhpcy52YWx1ZSlcbiAgICB9XG5cbiAgICAvLyBFcXVhbGl0eSBDb25zdHJhaW50LCBpLmUuLCBvMS5wMSA9IG8yLnAyXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19hcml0aF9fRXF1YWxpdHlDb25zdHJhaW50KHJlZjEsIHJlZjIsIG9wdE9ubHlXcml0ZVRvKSB7XG5cdGluc3RhbGxSZWYodGhpcywgcmVmMSwgJ3YxJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYyLCAndjInKVxuXHR0aGlzLm9ubHlXcml0ZVRvID0gb3B0T25seVdyaXRlVG8gfHwgWzEsIDJdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludCh7b2JqOiBPMSwgcHJvcDogcDF9LCB7b2JqOiBPMiwgcHJvcDogcDJ9KSBzdGF0ZXMgdGhhdCBPMS5wMSA9IE8yLnAyIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9KSBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZGlmZiA9IHJlZih0aGlzLCAndjEnKSAtIHJlZih0aGlzLCAndjInKVxuXHRyZXR1cm4gZGlmZlxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxID0gcmVmKHRoaXMsICd2MScpLCB2MiA9IHJlZih0aGlzLCAndjInKVxuXHR2YXIgdnMgPSBbdjEsIHYyXVxuXHR2YXIgb25seVdyaXRlVG8gPSB0aGlzLm9ubHlXcml0ZVRvXG5cdHZhciBkaWZmID0gdjEgLSB2MlxuXHR2YXIgZGl2ID0gb25seVdyaXRlVG8ubGVuZ3RoXG5cdHZhciBhcmdzID0gW3RoaXNdXG5cdG9ubHlXcml0ZVRvLmZvckVhY2goZnVuY3Rpb24oaSkgeyB2YXIgc2lnbiA9IGkgPiAxID8gMSA6IC0xOyBhcmdzLnB1c2goJ3YnICsgaSk7IGFyZ3MucHVzaCh2c1tpIC0gMV0gKyBzaWduICogZGlmZiAvIGRpdikgfSlcblx0cmVzID0gcGF0Y2guYXBwbHkodGhpcywgYXJncylcblx0cmV0dXJuIHJlcyAvL3BhdGNoKHRoaXMsICd2MScsIHYxIC0gKGRpZmYgLyAyKSwgJ3YyJywgdjIgKyBkaWZmIC8gMilcbiAgICB9XG5cbiAgICAvLyBTdW0gQ29uc3RyYWludCwgaS5lLiwgbzEucDEgKyBvMi5wMiA9IG8zLnAzXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fYXJpdGhfX1N1bUNvbnN0cmFpbnQocmVmMSwgcmVmMiwgcmVmMywgb3B0T25seVdyaXRlVG8pIHtcblx0aW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMywgJ3YzJylcblx0dGhpcy5vbmx5V3JpdGVUbyA9IG9wdE9ubHlXcml0ZVRvIHx8IFsxLCAyLCAzXVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQoe29iajogTzEsIHByb3A6IHAxfSwge29iajogTzIsIHByb3A6IHAyfSwge29iajogTzMsIHByb3A6IHAzfSwgV3JpdGFibGVJZHhzKSBzdGF0ZXMgdGhhdCBPMS5wMSArIE8yLnAyID0gTzMucDMgLiBPcHRpb25hbCBXcml0YWJsZUlkeHMgZ2l2ZXMgYSBsaXN0IG9mIGluZGljZXMgKDEsIDIsIG9yLCAzKSB0aGUgY29uc3RyYWludCBpcyBhbGxvd2VkIHRvIGNoYW5nZS5cIiB9IFxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSkgXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkaWZmID0gcmVmKHRoaXMsICd2MycpIC0gKHJlZih0aGlzLCAndjEnKSArIHJlZih0aGlzLCAndjInKSlcblx0cmV0dXJuIGRpZmZcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjEgPSByZWYodGhpcywgJ3YxJylcblx0dmFyIHYyID0gcmVmKHRoaXMsICd2MicpXG5cdHZhciB2MyA9IHJlZih0aGlzLCAndjMnKVxuXHR2YXIgdnMgPSBbdjEsIHYyLCB2M11cblx0dmFyIGRpZmYgPSB2MyAtICh2MSArIHYyKVxuXHR2YXIgb25seVdyaXRlVG8gPSB0aGlzLm9ubHlXcml0ZVRvXG5cdHZhciBkaXYgPSBvbmx5V3JpdGVUby5sZW5ndGhcblx0dmFyIGFyZ3MgPSBbdGhpc11cblx0b25seVdyaXRlVG8uZm9yRWFjaChmdW5jdGlvbihpKSB7IHZhciBzaWduID0gaSA+IDIgPyAtMSA6IDE7IGFyZ3MucHVzaCgndicgKyBpKTsgYXJncy5wdXNoKHZzW2kgLSAxXSArIHNpZ24gKiBkaWZmIC8gZGl2KSB9KVxuXHRyZXMgPSBwYXRjaC5hcHBseSh0aGlzLCBhcmdzKVxuXHRyZXR1cm4gcmVzXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50c1xuIiwiZnVuY3Rpb24gaW5zdGFsbEdlb21ldHJpY0NvbnN0cmFpbnRzKFNrZXRjaHBhZCkge1xuXG4gICAgLy8gVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2YgZ2VvbWV0cmljIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgICAvLyBvYmplY3RzIHRoYXQgaGF2ZSB4IGFuZCB5IHByb3BlcnRpZXMuIE90aGVyIHByb3BlcnRpZXMgYXJlIGlnbm9yZWQuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbSA9IHt9XG5cbiAgICAvLyBIZWxwZXJzXG5cbiAgICBmdW5jdGlvbiBzcXVhcmUobikge1xuXHRyZXR1cm4gbiAqIG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwbHVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggKyBwMi54LCB5OiBwMS55ICsgcDIueX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaW51cyhwMSwgcDIpIHtcblx0cmV0dXJuIHt4OiBwMS54IC0gcDIueCwgeTogcDEueSAtIHAyLnl9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbGVkQnkocCwgbSkge1xuXHRyZXR1cm4ge3g6IHAueCAqIG0sIHk6IHAueSAqIG19XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29weShwKSB7XG5cdHJldHVybiBzY2FsZWRCeShwLCAxKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZHBvaW50KHAxLCBwMikge1xuXHRyZXR1cm4gc2NhbGVkQnkocGx1cyhwMSwgcDIpLCAwLjUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFnbml0dWRlKHApIHtcblx0cmV0dXJuIE1hdGguc3FydChzcXVhcmUocC54KSArIHNxdWFyZShwLnkpKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZWQocCkge1xuXHR2YXIgbSA9IG1hZ25pdHVkZShwKVxuXHRyZXR1cm4gbSA+IDAgPyBzY2FsZWRCeShwLCAxIC8gbSkgOiBwXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzdGFuY2UocDEsIHAyKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAxLnggLSBwMi54KSArIHNxdWFyZShwMS55IC0gcDIueSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcm90YXRlZEJ5KHAsIGRUaGV0YSkge1xuXHR2YXIgYyA9IE1hdGguY29zKGRUaGV0YSlcblx0dmFyIHMgPSBNYXRoLnNpbihkVGhldGEpXG5cdHJldHVybiB7eDogYypwLnggLSBzKnAueSwgeTogcypwLnggKyBjKnAueX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByb3RhdGVkQXJvdW5kKHAsIGRUaGV0YSwgYXhpcykge1xuXHRyZXR1cm4gcGx1cyhheGlzLCByb3RhdGVkQnkobWludXMocCwgYXhpcyksIGRUaGV0YSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0RGVsdGEoZCwgcCwgc2NhbGUpIHtcblx0ZC54ID0gcC54ICogc2NhbGVcblx0ZC55ID0gcC55ICogc2NhbGVcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5zcXVhcmUgPSBzcXVhcmVcbiAgICBTa2V0Y2hwYWQuZ2VvbS5wbHVzID0gcGx1c1xuICAgIFNrZXRjaHBhZC5nZW9tLm1pbnVzID0gbWludXNcbiAgICBTa2V0Y2hwYWQuZ2VvbS5zY2FsZWRCeSA9IHNjYWxlZEJ5XG4gICAgU2tldGNocGFkLmdlb20uY29weSA9IGNvcHlcbiAgICBTa2V0Y2hwYWQuZ2VvbS5taWRwb2ludCA9IG1pZHBvaW50XG4gICAgU2tldGNocGFkLmdlb20ubWFnbml0dWRlID0gbWFnbml0dWRlXG4gICAgU2tldGNocGFkLmdlb20ubm9ybWFsaXplZCA9IG5vcm1hbGl6ZWRcbiAgICBTa2V0Y2hwYWQuZ2VvbS5kaXN0YW5jZSA9IGRpc3RhbmNlXG4gICAgU2tldGNocGFkLmdlb20ucm90YXRlZEJ5ID0gcm90YXRlZEJ5XG4gICAgU2tldGNocGFkLmdlb20ucm90YXRlZEFyb3VuZCA9IHJvdGF0ZWRBcm91bmRcbiAgICBTa2V0Y2hwYWQuZ2VvbS5zZXREZWx0YSA9IHNldERlbHRhXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5kcmF3VmlzdWFsaXphdGlvbkxpbmUgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbiwgcDEsIHAyLCBsKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0Y3R4dC5saW5lV2lkdGggPSAxXG5cdGN0eHQuc3Ryb2tlU3R5bGUgPSAneWVsbG93J1xuXHRjdHh0LmJlZ2luUGF0aCgpXG5cblx0dmFyIGFuZ2xlID0gTWF0aC5hdGFuMihwMi55IC0gcDEueSwgcDIueCAtIHAxLngpXG5cdHZhciBkaXN0ID0gMjVcblx0dmFyIHAxeCA9IG9yaWdpbi54ICsgcDEueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDF5ID0gb3JpZ2luLnkgKyBwMS55IC0gZGlzdCAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMnggPSBvcmlnaW4ueCArIHAyLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeSA9IG9yaWdpbi55ICsgcDIueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXG5cdHZhciB0ZXh0Q2VudGVyWCA9IChwMXggKyBwMngpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHRleHRDZW50ZXJZID0gKHAxeSArIHAyeSkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXG5cdGN0eHQubW92ZVRvKFxuXHQgICAgcDF4ICsgNSAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpLFxuXHQgICAgcDF5ICsgNSAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdClcblx0Y3R4dC5saW5lVG8oXG5cdCAgICBwMXggLSA1ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMiksXG5cdCAgICBwMXkgLSA1ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0KVxuXG5cdGN0eHQubW92ZVRvKHAxeCwgcDF5KVxuXHRjdHh0LmxpbmVUbyhwMngsIHAyeSlcblxuXHRjdHh0Lm1vdmVUbyhcblx0ICAgIHAyeCArIDUgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKSxcblx0ICAgIHAyeSArIDUgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHQpXG5cdGN0eHQubGluZVRvKFxuXHQgICAgcDJ4IC0gNSAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpLFxuXHQgICAgcDJ5IC0gNSAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdClcblx0Y3R4dC5jbG9zZVBhdGgoKVxuXHRjdHh0LnN0cm9rZSgpXG5cblx0Y3R4dC50ZXh0QWxpZ24gPSAnY2VudGVyJ1xuXHRjdHh0LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnXG5cdGN0eHQuc3Ryb2tlVGV4dChNYXRoLnJvdW5kKGwpLCB0ZXh0Q2VudGVyWCwgdGV4dENlbnRlclkpXG5cdGN0eHQuc3Ryb2tlKClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5jYWxjdWxhdGVBbmdsZSA9IGZ1bmN0aW9uKHAxLCBwMiwgcDMsIHA0KSB7XG5cdHZhciB2MTIgPSB7eDogcDIueCAtIHAxLngsIHk6IHAyLnkgLSBwMS55fVxuXHR2YXIgYTEyID0gTWF0aC5hdGFuMih2MTIueSwgdjEyLngpXG5cdHZhciB2MzQgPSB7eDogcDQueCAtIHAzLngsIHk6IHA0LnkgLSBwMy55fVxuXHR2YXIgYTM0ID0gTWF0aC5hdGFuMih2MzQueSwgdjM0LngpXG5cdHJldHVybiAoYTEyIC0gYTM0ICsgMiAqIE1hdGguUEkpICUgKDIgKiBNYXRoLlBJKVxuICAgIH1cblxuICAgIC8vIENvb3JkaW5hdGUgQ29uc3RyYWludCwgaS5lLiwgXCJJIHdhbnQgdGhpcyBwb2ludCB0byBiZSBoZXJlXCIuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fQ29vcmRpbmF0ZUNvbnN0cmFpbnQocCwgeCwgeSkge1xuXHR0aGlzLnAgPSBwXG5cdHRoaXMuYyA9IG5ldyBQb2ludCh4LCB5KVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQoUG9pbnQgUCwgTnVtYmVyIFgsIE51bWJlciBZKSBzdGF0ZXMgdGhhdCBwb2ludCBQIHNob3VsZCBzdGF5IGF0IGNvb3JkaW5hdGUgKFgsIFkpLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3A6ICdQb2ludCcsIGM6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMucCwgcHJvcHM6IFsneCcsICd5J119XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgcDEgPSBQb2ludC5kdW1teSh4LCB5KVxuXHR2YXIgcDIgPSBQb2ludC5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50KHAxLCBwMi54LCBwMi55KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMuYywgdGhpcy5wKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge3A6IHt4OiB0aGlzLmMueCwgeTogdGhpcy5jLnl9fVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0dmFyIGN0eHQgPSBjYW52YXMuY3R4dFxuXHRpZiAodGhpcy5wLmlzU2VsZWN0ZWQpIHJldHVybiAvLyBkb24ndCBkcmF3IG92ZXIgdGhlIHNlbGVjdGlvbiBoaWdobGlnaHRcblx0Y3R4dC5maWxsU3R5bGUgPSAnYmxhY2snXG5cdGN0eHQuYmVnaW5QYXRoKClcblx0Y3R4dC5hcmModGhpcy5jLnggKyBvcmlnaW4ueCwgdGhpcy5jLnkgKyBvcmlnaW4ueSwgY2FudmFzLnBvaW50UmFkaXVzICogMC42NjYsIDAsIDIgKiBNYXRoLlBJKVxuXHRjdHh0LmNsb3NlUGF0aCgpXG5cdGN0eHQuZmlsbCgpXG4gICAgfVxuXG4gICAgLy8gWENvb3JkaW5hdGVDb25zdHJhaW50IENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5nZW9tLlhDb29yZGluYXRlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fWENvb3JkaW5hdGVDb25zdHJhaW50KHAxLCBwMikge1xuICAgICAgICB0aGlzLnAxID0gcDFcbiAgICAgICAgdGhpcy5wMiA9IHAyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLlhDb29yZGluYXRlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50KFBvaW50IFAsIE51bWJlciBYKSBzdGF0ZXMgdGhhdCBwb2ludCBQJ3ggeC1jb29yZGluYXRlIHNob3VsZCBiZSBhdCBYLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLlhDb29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBwMSA9IFBvaW50LmR1bW15KHgsIHkpXG5cdHZhciBwMiA9IFBvaW50LmR1bW15KHksIHgpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50KHAxLCBwMi54LCBwMi55KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLlhDb29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHRoaXMucDIueCAtIHRoaXMucDEueFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLlhDb29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge3AxOiB7eDogdGhpcy5wMi54fX1cbiAgICB9XG5cbiAgICAvLyBZQ29vcmRpbmF0ZUNvbnN0cmFpbnQgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLmdlb20uWUNvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19ZQ29vcmRpbmF0ZUNvbnN0cmFpbnQocDEsIHAyKSB7XG4gICAgICAgIHRoaXMucDEgPSBwMVxuICAgICAgICB0aGlzLnAyID0gcDJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uWUNvb3JkaW5hdGVDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uWUNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy5wMi55IC0gdGhpcy5wMS55XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uWUNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7cDE6IHt5OiB0aGlzLnAyLnl9fVxuICAgIH1cblxuICAgIC8vIENvaW5jaWRlbmNlIENvbnN0cmFpbnQsIGkuZS4sIEkgd2FudCB0aGVzZSB0d28gcG9pbnRzIHRvIGJlIGF0IHRoZSBzYW1lIHBsYWNlLlxuXG4gICAgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19Db2luY2lkZW5jZUNvbnN0cmFpbnQocDEsIHAyKSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50KFBvaW50IFAxLCBQb2lvbnQgUDIpIHN0YXRlcyB0aGF0IHBvaW50cyBQMSAmIFAyIHNob3VsZCBiZSBhdCB0aGUgc2FtZSBwbGFjZS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbCA9IExpbmUuZHVtbXkoeCwgeSlcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQobC5wMSwgbC5wMilcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXModGhpcy5wMiwgdGhpcy5wMSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzcGxpdERpZmYgPSBzY2FsZWRCeShtaW51cyh0aGlzLnAyLCB0aGlzLnAxKSwgMC41KVxuXHRyZXR1cm4ge3AxOiBwbHVzKHRoaXMucDEsIHNwbGl0RGlmZiksIHAyOiBwbHVzKHRoaXMucDIsIHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpKX1cbiAgICB9XG5cbiAgICAvLyBFcXVpdmFsZW5jZSBDb25zdHJhaW50LCBpLmUuLCBJIHdhbnQgdGhlIHZlY3RvcnMgcDEtPnAyIGFuZCBwMy0+cDQgdG8gYmUgdGhlIHNhbWUuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0VxdWl2YWxlbmNlQ29uc3RyYWludChwMSwgcDIsIHAzLCBwNCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMucDMgPSBwM1xuXHR0aGlzLnA0ID0gcDRcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50KFBvaW50IFAxLCBQb2ludCBQMiwgUG9pbnQgUDMsIFBvaW50IFA0KSBzYXlzIGxpbmUgc2VjdGlvbnMgUDEtMiBhbmQgUDMtNCBhcmUgcGFyYWxsZWwgYW5kIG9mIHRoZSBzYW1lIGxlbmd0aHMuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgcDM6ICdQb2ludCcsIHA0OiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbDEgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHZhciBsMiA9IExpbmUuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQobDEucDEsIGwxLnAyLCBsMi5wMSwgbDIucDIpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5wMiwgdGhpcy5wMyksIHBsdXModGhpcy5wMSwgdGhpcy5wNCkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSksIDAuMjUpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgc3BsaXREaWZmKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoc3BsaXREaWZmLCAtMSkpLCBwMzogcGx1cyh0aGlzLnAzLCBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSksIHA0OiBwbHVzKHRoaXMucDQsIHNwbGl0RGlmZil9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0dmFyIGwgPSBkaXN0YW5jZSh0aGlzLnAxLCB0aGlzLnAyKVxuXHRTa2V0Y2hwYWQuZ2VvbS5kcmF3VmlzdWFsaXphdGlvbkxpbmUoY2FudmFzLCBvcmlnaW4sIHRoaXMucDEsIHRoaXMucDIsIGwpXG5cdFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZShjYW52YXMsIG9yaWdpbiwgdGhpcy5wMywgdGhpcy5wNCwgbClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMiwgcDMgPSB0aGlzLnAzLCBwNCA9IHRoaXMucDRcblx0dmFyIHgxID0gTWF0aC5taW4ocDEueCwgcDIueCwgcDMueCwgcDQueCksIHgyID0gTWF0aC5tYXgocDEueCwgcDIueCwgcDMueCwgcDQueClcblx0dmFyIHkxID0gTWF0aC5taW4ocDEueSwgcDIueSwgcDMueSwgcDQueSksIHkyID0gTWF0aC5tYXgocDEueSwgcDIueSwgcDMueSwgcDQueSlcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KHgxLCB5MSksIHgyIC0geDEsIHkyIC0geTEpIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlci5jb250YWluc1BvaW50KHgsIHkpIFxuICAgIH1cbiAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMiwgcDMgPSB0aGlzLnAzLCBwNCA9IHRoaXMucDRcblx0dmFyIHgxID0gTWF0aC5taW4ocDEueCwgcDIueCwgcDMueCwgcDQueCksIHgyID0gTWF0aC5tYXgocDEueCwgcDIueCwgcDMueCwgcDQueClcblx0dmFyIHkxID0gTWF0aC5taW4ocDEueSwgcDIueSwgcDMueSwgcDQueSksIHkyID0gTWF0aC5tYXgocDEueSwgcDIueSwgcDMueSwgcDQueSlcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KHgxLCB5MSksIHgyIC0geDEsIHkyIC0geTEpIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlclxuICAgIH0gXG5cbiAgICAvLyBPbmUgV2F5IEVxdWl2YWxlbmNlIENvbnN0cmFpbnQsIGkuZS4sIEkgd2FudCB0aGUgdmVjdG9ycyBwMS0+cDIgdG8gYWx3YXlzIG1hdGNoIHdpdGggcDMtPnA0XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX09uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludChwMSwgcDIsIHAzLCBwNCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMucDMgPSBwM1xuXHR0aGlzLnA0ID0gcDRcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50KFBvaW50IFAxLCBQb2ludCBQMiwgUG9pbnQgUDMsIFBvaW50IFA0KSBzYXlzIHRoZSB2ZWN0b3JzIFAxLT5QMiBhbHdheXMgbWF0Y2hlcyB3aXRoIFAzLT5QNFwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCcsIHAzOiAnUG9pbnQnLCBwNDogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwxID0gTGluZS5kdW1teSh4LCB5KVxuXHR2YXIgbDIgPSBMaW5lLmR1bW15KHksIHgpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50KGwxLnAxLCBsMS5wMiwgbDIucDEsIGwyLnAyKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMucDIsIHRoaXMucDMpLCBwbHVzKHRoaXMucDEsIHRoaXMucDQpKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNwbGl0RGlmZiA9IHNjYWxlZEJ5KG1pbnVzKHBsdXModGhpcy5wMiwgdGhpcy5wMyksIHBsdXModGhpcy5wMSwgdGhpcy5wNCkpLCAwLjUpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgc3BsaXREaWZmKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoc3BsaXREaWZmLCAtMSkpfVxuICAgIH1cblxuICAgIC8vIEVxdWFsIERpc3RhbmNlIGNvbnN0cmFpbnQgLSBrZWVwcyBkaXN0YW5jZXMgUDEtLT5QMiwgUDMtLT5QNCBlcXVhbFxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0VxdWFsRGlzdGFuY2VDb25zdHJhaW50KHAxLCBwMiwgcDMsIHA0KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQpIGtlZXBzIGRpc3RhbmNlcyBQMS0+UDIsIFAzLT5QNCBlcXVhbC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCcsIHAzOiAnUG9pbnQnLCBwNDogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbDEgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHZhciBsMiA9IExpbmUuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludChsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSlcblx0dmFyIGwzNCA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAzLCB0aGlzLnA0KSlcblx0cmV0dXJuIGwxMiAtIGwzNFxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKVxuXHR2YXIgbDM0ID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDMsIHRoaXMucDQpKVxuXHR2YXIgZGVsdGEgPSAobDEyIC0gbDM0KSAvIDRcblx0dmFyIGUxMiA9IHNjYWxlZEJ5KFNrZXRjaHBhZC5nZW9tLm5vcm1hbGl6ZWQobWludXModGhpcy5wMiwgdGhpcy5wMSkpLCBkZWx0YSlcblx0dmFyIGUzNCA9IHNjYWxlZEJ5KFNrZXRjaHBhZC5nZW9tLm5vcm1hbGl6ZWQobWludXModGhpcy5wNCwgdGhpcy5wMykpLCBkZWx0YSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBlMTIpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShlMTIsIC0xKSksIHAzOiBwbHVzKHRoaXMucDMsIHNjYWxlZEJ5KGUzNCwgLTEpKSwgcDQ6IHBsdXModGhpcy5wNCwgZTM0KX1cbiAgICB9XG5cbiAgICAvLyBMZW5ndGggY29uc3RyYWludCAtIG1haW50YWlucyBkaXN0YW5jZSBiZXR3ZWVuIFAxIGFuZCBQMiBhdCBMLlxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fTGVuZ3RoQ29uc3RyYWludChwMSwgcDIsIGwsIG9ubHlPbmVXcml0YWJsZSkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMubCA9IGxcblx0dGhpcy5fb25seU9uZVdyaXRhYmxlID0gb25seU9uZVdyaXRhYmxlXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBMKSBzYXlzIHBvaW50cyBQMSBhbmQgUDIgYWx3YXlzIG1haW50YWluIGEgZGlzdGFuY2Ugb2YgTC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgbDogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy5wMSwgcHJvcHM6IFsneCcsICd5J119LCB7b2JqOiB0aGlzLnAyLCBwcm9wczogWyd4JywgJ3knXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50KG5ldyBQb2ludCh4IC0gNTAsIHkgLSA1MCksIG5ldyBQb2ludCh4ICsgNTAsIHkgKyA1MCksIDEwMClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKVxuXHRyZXR1cm4gbDEyIC0gdGhpcy5sXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyhwMSwgcDIpKVxuXHRpZiAobDEyID09IDApIHtcblx0ICAgIHAxID0gcGx1cyhwMSwge3g6IDAuMSwgeTogMH0pXG5cdCAgICBwMiA9IHBsdXMocDIsIHt4OiAtMC4xLCB5OiAwfSlcblx0fVx0XG5cdHZhciBkZWx0YSA9IChsMTIgLSB0aGlzLmwpIC8gKHRoaXMuX29ubHlPbmVXcml0YWJsZSA/IDEgOiAyKVxuXHR2YXIgZTEyID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20ubm9ybWFsaXplZChtaW51cyhwMiwgcDEpKSwgZGVsdGEpXG5cdHZhciByZXMgPSB7cDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoZTEyLCAtMSkpfVxuXHRpZiAoIXRoaXMuX29ubHlPbmVXcml0YWJsZSlcblx0ICAgIHJlc1sncDEnXSA9IHBsdXModGhpcy5wMSwgZTEyKVxuXHRyZXR1cm4gcmVzXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZShjYW52YXMsIG9yaWdpbiwgdGhpcy5wMSwgdGhpcy5wMiwgdGhpcy5sKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHAyLnkgLSBwMS55LCBwMi54IC0gcDEueClcblx0dmFyIGRpc3QgPSAyNVxuXHR2YXIgcDF4ID0gcDEueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDF5ID0gcDEueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ4ID0gcDIueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ5ID0gcDIueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclggPSAocDF4ICsgcDJ4KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciB0ZXh0Q2VudGVyWSA9IChwMXkgKyBwMnkpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KHRleHRDZW50ZXJYIC0gNTAsIHRleHRDZW50ZXJZIC0gNTApLCAxMDAsIDEwMCkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyLmNvbnRhaW5zUG9pbnQoeCwgeSkgXG4gICAgfVxuICAgXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHAyLnkgLSBwMS55LCBwMi54IC0gcDEueClcblx0dmFyIGRpc3QgPSAyNVxuXHR2YXIgcDF4ID0gcDEueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDF5ID0gcDEueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ4ID0gcDIueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ5ID0gcDIueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclggPSAocDF4ICsgcDJ4KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciB0ZXh0Q2VudGVyWSA9IChwMXkgKyBwMnkpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KHRleHRDZW50ZXJYIC0gNTAsIHRleHRDZW50ZXJZIC0gNTApLCAxMDAsIDEwMCkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyXG4gICAgfSBcblxuICAgIC8vIE9yaWVudGF0aW9uIGNvbnN0cmFpbnQgLSBtYWludGFpbnMgYW5nbGUgYmV0d2VlbiBQMS0+UDIgYW5kIFAzLT5QNCBhdCBUaGV0YVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19PcmllbnRhdGlvbkNvbnN0cmFpbnQocDEsIHAyLCBwMywgcDQsIHRoZXRhKSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuXHR0aGlzLnRoZXRhID0gdGhldGEgPT09IHVuZGVmaW5lZCA/IFNrZXRjaHBhZC5nZW9tLmNhbGN1bGF0ZUFuZ2xlKHAxLCBwMiwgcDMsIHA0KSA6IHRoZXRhXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIFBvaW50IFAzLCBQb2ludCBQNCwgTnVtYmVyIFRoZXRhKSBtYWludGFpbnMgYW5nbGUgYmV0d2VlbiBQMS0+UDIgYW5kIFAzLT5QNCBhdCBUaGV0YS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCcsIHRoZXRhOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwxID0gTGluZS5kdW1teSh4LCB5KVxuXHR2YXIgbDIgPSBMaW5lLmR1bW15KHksIHgpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50KGwxLnAxLCBsMS5wMiwgbDIucDEsIGwyLnAyKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxMiA9IG1pbnVzKHRoaXMucDIsIHRoaXMucDEpXG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cdFxuXHR2YXIgdjM0ID0gbWludXModGhpcy5wNCwgdGhpcy5wMylcblx0dmFyIGEzNCA9IE1hdGguYXRhbjIodjM0LnksIHYzNC54KVxuXHR2YXIgbTM0ID0gbWlkcG9pbnQodGhpcy5wMywgdGhpcy5wNClcblx0XG5cdHZhciBjdXJyVGhldGEgPSBhMTIgLSBhMzRcblx0dmFyIGRUaGV0YSA9IHRoaXMudGhldGEgLSBjdXJyVGhldGFcblx0cmV0dXJuIGRUaGV0YVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxMiA9IG1pbnVzKHRoaXMucDIsIHRoaXMucDEpXG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cblx0dmFyIHYzNCA9IG1pbnVzKHRoaXMucDQsIHRoaXMucDMpXG5cdHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueClcblx0dmFyIG0zNCA9IG1pZHBvaW50KHRoaXMucDMsIHRoaXMucDQpXG5cblx0dmFyIGN1cnJUaGV0YSA9IGExMiAtIGEzNFxuXHR2YXIgZFRoZXRhID0gdGhpcy50aGV0YSAtIGN1cnJUaGV0YVxuXHQvLyBUT0RPOiBmaWd1cmUgb3V0IHdoeSBzZXR0aW5nIGRUaGV0YSB0byAxLzIgdGltZXMgdGhpcyB2YWx1ZSAoYXMgc2hvd24gaW4gdGhlIHBhcGVyXG5cdC8vIGFuZCBzZWVtcyB0byBtYWtlIHNlbnNlKSByZXN1bHRzIGluIGp1bXB5L3Vuc3RhYmxlIGJlaGF2aW9yLlxuXHRyZXR1cm4ge3AxOiByb3RhdGVkQXJvdW5kKHRoaXMucDEsIGRUaGV0YSwgbTEyKSxcblx0XHRwMjogcm90YXRlZEFyb3VuZCh0aGlzLnAyLCBkVGhldGEsIG0xMiksXG5cdFx0cDM6IHJvdGF0ZWRBcm91bmQodGhpcy5wMywgLWRUaGV0YSwgbTM0KSxcblx0XHRwNDogcm90YXRlZEFyb3VuZCh0aGlzLnA0LCAtZFRoZXRhLCBtMzQpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0dmFyIG0xID0gc2NhbGVkQnkocGx1cyh0aGlzLnAxLCB0aGlzLnAyKSwgMC41KVxuXHR2YXIgbTIgPSBzY2FsZWRCeShwbHVzKHRoaXMucDMsIHRoaXMucDQpLCAwLjUpXG5cdHZhciBtID0gc2NhbGVkQnkocGx1cyhtMSwgbTIpLCAwLjUpXG5cdGNhbnZhcy5kcmF3QXJyb3cobTEsIG0yLCBvcmlnaW4pXG5cdGN0eHQuZmlsbFN0eWxlID0gJ3JlZCdcblx0Y3R4dC5maWxsVGV4dCgndGhldGEgPSAnICsgTWF0aC5mbG9vcih0aGlzLnRoZXRhIC8gTWF0aC5QSSAqIDE4MCksIG0ueCArIG9yaWdpbi54LCBtLnkgKyBvcmlnaW4ueSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBtMSA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMSwgdGhpcy5wMiksIDAuNSlcblx0dmFyIG0yID0gc2NhbGVkQnkocGx1cyh0aGlzLnAzLCB0aGlzLnA0KSwgMC41KVxuXHR2YXIgbSA9IHNjYWxlZEJ5KHBsdXMobTEsIG0yKSwgMC41KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQobS54IC0gNTAsIG0ueSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlci5jb250YWluc1BvaW50KHgsIHkpIFxuICAgIH1cbiAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHZhciBtMSA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMSwgdGhpcy5wMiksIDAuNSlcblx0dmFyIG0yID0gc2NhbGVkQnkocGx1cyh0aGlzLnAzLCB0aGlzLnA0KSwgMC41KVxuXHR2YXIgbSA9IHNjYWxlZEJ5KHBsdXMobTEsIG0yKSwgMC41KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQobS54IC0gNTAsIG0ueSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlclxuICAgIH0gXG5cbiAgICAvLyBNb3RvciBjb25zdHJhaW50IC0gY2F1c2VzIFAxIGFuZCBQMiB0byBvcmJpdCB0aGVpciBtaWRwb2ludCBhdCB0aGUgZ2l2ZW4gcmF0ZS5cbiAgICAvLyB3IGlzIGluIHVuaXRzIG9mIEh6IC0gd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX01vdG9yQ29uc3RyYWludChwMSwgcDIsIHcpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLncgPSB3XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBXKSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlIG9mIHcsIGluIHVuaXRzIG9mIEh6OiB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cIiB9IFxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgdzogJ051bWJlcid9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbCA9IExpbmUuZHVtbXkoeCwgeSlcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQobC5wMSwgbC5wMiwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiAxXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB0ID0gKHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZSkgLyAxMDAwLjBcblx0dmFyIGRUaGV0YSA9IHQgKiB0aGlzLncgKiAoMiAqIE1hdGguUEkpXG5cdHZhciBtMTIgPSBtaWRwb2ludCh0aGlzLnAxLCB0aGlzLnAyKVxuXHRyZXR1cm4ge3AxOiByb3RhdGVkQXJvdW5kKHRoaXMucDEsIGRUaGV0YSwgbTEyKSxcblx0XHRwMjogcm90YXRlZEFyb3VuZCh0aGlzLnAyLCBkVGhldGEsIG0xMil9XG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludCA9IGZ1bmN0aW9uICBTa2V0Y2hwYWRfX2dlb21fX0NhcnRlc2lhblBvaW50Q29uc3RyYWludChwb3NpdGlvbiwgdmVjdG9yLCBvcmlnaW4sIHVuaXQpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMudmVjdG9yID0gdmVjdG9yXG5cdHRoaXMub3JpZ2luID0gb3JpZ2luXG5cdHRoaXMudW5pdCA9IHVuaXRcbiAgICB9XG4gICAgXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludCwgdHJ1ZSlcbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5DYXJ0ZXNpYW5Qb2ludENvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBcIlNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludChQb2ludCBQLCBWZWN0b3IgViwgUG9pbnQgTywgTnVtYmVyIFUpIHN0YXRlcyB0aGF0IFAgc2hvdWxkIGJlIHBvc2l0aW9uZWQgYmFzZWQgb24gdmVjdG9yIFYncyBYIGFuZCBZIGRpc2NyZXRlIGNvb3JkaW5hdGUgdmFsdWVzLCBhbmQgb24gb3JpZ2luIE8gYW5kIGVhY2ggdW5pdCBvbiBheGlzIGhhdmluZyBhIHZlcnRpY2FsIGFuZCBob3Jpem9udGFsIGxlbmd0aCBvZiBVXCJcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgb3JpZ2luID0gdGhpcy5vcmlnaW4sIHZlY3RvciA9IHRoaXMudmVjdG9yLCBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24sIHVuaXQgPSB0aGlzLnVuaXRcblx0dmFyIGRpZmZYID0gTWF0aC5hYnMob3JpZ2luLnggKyB1bml0ICogdmVjdG9yLnggLSBwb3NpdGlvbi54KVxuXHR2YXIgZGlmZlkgPSBNYXRoLmFicyhvcmlnaW4ueSAtIHVuaXQgKiB2ZWN0b3IueSAtIHBvc2l0aW9uLnkpXG5cdHJldHVybiBkaWZmWCArIGRpZmZZXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBvcmlnaW4gPSB0aGlzLm9yaWdpbiwgdmVjdG9yID0gdGhpcy52ZWN0b3IsIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiwgdW5pdCA9IHRoaXMudW5pdFxuXHR2YXIgeCA9IG9yaWdpbi54ICsgdW5pdCAqIHZlY3Rvci54XG5cdHZhciB5ID0gb3JpZ2luLnkgLSB1bml0ICogdmVjdG9yLnlcblx0cmV0dXJuIHtwb3NpdGlvbjoge3g6IHgsIHk6IHl9fVxuICAgIH1cbiAgICBcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHNcbiIsImZ1bmN0aW9uIGluc3RhbGxTaW11bGF0aW9uQ29uc3RyYWludHMoU2tldGNocGFkKSB7XG5cbiAgICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBzaW11bGF0aW9uIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgICAvLyBhcmJpdHJhcnkgcHJvcGVydGllcyBvZiBhcmJpdHJhcnkgb2JqZWN0cy4gXCJSZWZlcmVuY2VzXCIgYXJlIHJlcHJlc2VudGVkXG4gICAgLy8gYXMgKG9iamVjdCwgcHJvcGVydHlOYW1lKSB0dXBsZXMsIGUuZy4sIHtvYmo6IHlvdXJNb20sIHByb3A6ICd3ZWlnaHQnfS5cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uID0geyBnOiA5LjgsIEc6IDYuN2UtMTEgfSAvLyBHOiBObTIva2cyIFxuXG4gICAgdmFyIG1pbnVzID0gU2tldGNocGFkLmdlb20ubWludXNcbiAgICB2YXIgcGx1cyA9IFNrZXRjaHBhZC5nZW9tLnBsdXNcbiAgICB2YXIgc2NhbGVkQnkgPSBTa2V0Y2hwYWQuZ2VvbS5zY2FsZWRCeVxuICAgIHZhciBub3JtYWxpemVkID0gU2tldGNocGFkLmdlb20ubm9ybWFsaXplZFxuICAgIHZhciBtYWduaXR1ZGUgPSBTa2V0Y2hwYWQuZ2VvbS5tYWduaXR1ZGVcbiAgICB2YXIgZGlzdGFuY2UgPSBTa2V0Y2hwYWQuZ2VvbS5kaXN0YW5jZVxuXG4gICAgLy8gQ2xhc3Nlc1xuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19GcmVlQm9keShwb3NpdGlvbiwgb3B0UmFkaXVzLCBvcHRNYXNzKSB7XG5cdHRoaXMucG9zaXRpb24gPSBwb3NpdGlvblxuXHR0aGlzLm1hc3MgPSBvcHRNYXNzIHx8IDEwXG5cdHRoaXMudmVsb2NpdHkgPSBuZXcgVmVjdG9yKDAsIDApXG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gbmV3IFZlY3RvcigwLCAwKVxuXHR0aGlzLnJhZGl1cyA9IG9wdFJhZGl1cyB8fCB0aGlzLnBvc2l0aW9uLnJhZGl1c1xuXHRyYy5hZGQocG9zaXRpb24pXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5KVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cG9zaXRpb246ICdQb2ludCcsIG1hc3M6ICdOdW1iZXInLCByYWRpdXM6ICdOdW1iZXInfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkoUG9pbnQuZHVtbXkoeCwgeSksIDEwLCAxMClcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiB0aGlzLnBvc2l0aW9uLmNvbnRhaW5zUG9pbnQoeCwgeSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5wcm90b3R5cGUuY2VudGVyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLnBvc2l0aW9uXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkucHJvdG90eXBlLmJvcmRlciA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5wb3NpdGlvbi5ib3JkZXIoKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0Ly90aGlzLnBvc2l0aW9uLmRyYXcoY2FudmFzLCBvcmlnaW4pXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19TcHJpbmcoYm9keTEsIGJvZHkyLCBrLCBsZW5ndGgsIHRlYXJQb2ludEFtb3VudCkge1xuXHR0aGlzLmJvZHkxID0gYm9keTFcblx0dGhpcy5ib2R5MSA9IGJvZHkyXG5cdHRoaXMubGluZSA9IG5ldyBMaW5lKGJvZHkxLnBvc2l0aW9uLCBib2R5Mi5wb3NpdGlvbilcblx0dGhpcy5rID0ga1xuXHR0aGlzLmxlbmd0aCA9IGxlbmd0aCAgICBcblx0dGhpcy50ZWFyUG9pbnRBbW91bnQgPSB0ZWFyUG9pbnRBbW91bnRcblx0dGhpcy50b3JuID0gZmFsc2VcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHkxOiAnRnJlZUJvZHknLCBib2R5MjogJ0ZyZWVCb2R5JywgazogJ051bWJlcicsIGxlbmd0aDogJ051bWJlcicsIHRlYXRQb2ludEFtb3VudDogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBiMSA9IEZyZWVCb2R5LmR1bW15KHgsIHkpXG5cdHZhciBiMiA9IEZyZWVCb2R5LmR1bW15KHggKyAxMDAsIHkgKyAxMDApXG5cdHZhciBkID0gZGlzdGFuY2UoYjEucDEsIGIyLnAyKVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZyhiMSwgYjIsIDEwLCBkLCAgZCAqIDUpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuY29udGFpbnNQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIHRoaXMubGluZS5jb250YWluc1BvaW50KHgsIHkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5jZW50ZXIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMubGluZS5jZW50ZXIoKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBuZXcgTGluZSh0aGlzLmxpbmUucDEsIHRoaXMubGluZS5wMiwgdW5kZWZpbmVkLCA4KS5ib3JkZXIoKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuc29sdXRpb25Kb2lucyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge3Rvcm46IHJjLnNrZXRjaHBhZC5sYXN0T25lV2luc0pvaW5Tb2x1dGlvbnN9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0dmFyIGN0eHQgPSBjYW52YXMuY3R4dFxuXHR2YXIgbGluZSA9IHRoaXMubGluZVxuXHR2YXIgcDEgPSBsaW5lLnAxLCBwMiA9IGxpbmUucDJcblx0dmFyIHkxID0gb3JpZ2luLnkgKyBwMS55XG5cdHZhciB5MiA9IG9yaWdpbi55ICsgcDIueVxuXHR2YXIgeDEgPSBvcmlnaW4ueCArIHAxLnhcblx0dmFyIHgyID0gb3JpZ2luLnggKyBwMi54XG5cdGlmICghdGhpcy50b3JuKSB7XG5cdCAgICBsaW5lLmRyYXcoY2FudmFzLCBvcmlnaW4pXG5cdCAgICBjdHh0LmZpbGxTdHlsZSA9ICdibGFjaydcblx0ICAgIGN0eHQuZmlsbFRleHQoTWF0aC5mbG9vcihNYXRoLnNxcnQoTWF0aC5wb3coeTEgLSB5MiwgMikgKyBNYXRoLnBvdyh4MSAtIHgyLCAyKSkgLSB0aGlzLmxlbmd0aCksICh4MSArIHgyKSAvIDIsICh5MSArIHkyKSAvIDIpXG5cdH1cbiAgICB9XG5cbiAgICAvLyBVdGlsaXRpZXNcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QgPSBmdW5jdGlvbihoYWxmTGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSB7XG5cdHZhciBxdWFydGVyTGVuZ3RoID0gaGFsZkxlbmd0aCAvIDJcblx0dmFyIHBvc2l0aW9uWCA9IHBvc2l0aW9uLnhcblx0dmFyIHBvc2l0aW9uWSA9IHBvc2l0aW9uLnlcblx0dmFyIHN1cmZhY2VYMSA9IHN1cmZhY2VQMS54XG5cdHZhciBzdXJmYWNlWTEgPSBzdXJmYWNlUDEueVxuXHR2YXIgc3VyZmFjZVgyID0gc3VyZmFjZVAyLnhcblx0dmFyIHN1cmZhY2VZMiA9IHN1cmZhY2VQMi55XG5cdHZhciBzbG9wZSA9IChzdXJmYWNlWTIgLSBzdXJmYWNlWTEpIC8gKHN1cmZhY2VYMiAtIHN1cmZhY2VYMSlcblx0dmFyIHN1cmZhY2VIaXRQb3NYID0gKChwb3NpdGlvblkgLSBzdXJmYWNlWTEpIC8gc2xvcGUpICsgc3VyZmFjZVgxXG5cdHZhciBzdXJmYWNlSGl0UG9zWSA9ICgocG9zaXRpb25YIC0gc3VyZmFjZVgxKSAqIHNsb3BlKSArIHN1cmZhY2VZMVxuXHR2YXIgaXNWZXJ0aWNhbCA9IChwb3NpdGlvblggPj0gKHN1cmZhY2VYMSAtIHF1YXJ0ZXJMZW5ndGgpICYmIHBvc2l0aW9uWCA8PSAoc3VyZmFjZVgyICsgcXVhcnRlckxlbmd0aCkpXG5cdHZhciBpc0hvcml6b250YWwgPSAocG9zaXRpb25ZID49IChzdXJmYWNlWTEgLSBxdWFydGVyTGVuZ3RoKSAmJiBwb3NpdGlvblkgPD0gKHN1cmZhY2VZMiArIHF1YXJ0ZXJMZW5ndGgpKVxuXHR2YXIgaXNVcCA9IGlzVmVydGljYWwgJiYgcG9zaXRpb25ZIDw9IHN1cmZhY2VIaXRQb3NZXG5cdHZhciBpc0Rvd24gPSBpc1ZlcnRpY2FsICYmIHBvc2l0aW9uWSA+PSBzdXJmYWNlSGl0UG9zWVxuXHR2YXIgaXNMZWZ0ID0gaXNIb3Jpem9udGFsICYmIHBvc2l0aW9uWCA8PSBzdXJmYWNlSGl0UG9zWFxuXHR2YXIgaXNSaWdodCA9IGlzSG9yaXpvbnRhbCAmJiBwb3NpdGlvblggPj0gc3VyZmFjZUhpdFBvc1hcblx0cmV0dXJuICgoKGlzVXAgJiYgKHZlbG9jaXR5LnkgPj0gMCkgJiYgKHBvc2l0aW9uWSA+PSAoc3VyZmFjZUhpdFBvc1kgLSBoYWxmTGVuZ3RoKSkpXG5cdFx0IHx8IChpc0Rvd24gJiYgKHZlbG9jaXR5LnkgPD0gMCkgJiYgKHBvc2l0aW9uWSA8PSAoc3VyZmFjZUhpdFBvc1kgKyBoYWxmTGVuZ3RoKSkpKVxuXHRcdHx8ICgoaXNMZWZ0ICYmICh2ZWxvY2l0eS54ID49IDApICYmIChwb3NpdGlvblggPD0gc3VyZmFjZUhpdFBvc1gpICYmIChwb3NpdGlvblggPj0gKHN1cmZhY2VIaXRQb3NYIC0gaGFsZkxlbmd0aCkpKVxuXHRcdCAgICB8fCAoaXNSaWdodCAmJiAodmVsb2NpdHkueCA8PSAwKSAmJiAocG9zaXRpb25YID49IHN1cmZhY2VIaXRQb3NYKSAmJiAocG9zaXRpb25YIDw9IChzdXJmYWNlSGl0UG9zWCArIGhhbGZMZW5ndGgpKSkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLmNvbXB1dGVDb250YWN0ID0gZnVuY3Rpb24oaGFsZkxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikge1xuXHR2YXIgcXVhcnRlckxlbmd0aCA9IGhhbGZMZW5ndGggLyAyXG5cdHZhciBwb3NpdGlvblggPSBwb3NpdGlvbi54XG5cdHZhciBwb3NpdGlvblkgPSBwb3NpdGlvbi55XG5cdHZhciBzdXJmYWNlWDEgPSBzdXJmYWNlUDEueFxuXHR2YXIgc3VyZmFjZVkxID0gc3VyZmFjZVAxLnlcblx0dmFyIHN1cmZhY2VYMiA9IHN1cmZhY2VQMi54XG5cdHZhciBzdXJmYWNlWTIgPSBzdXJmYWNlUDIueVxuXHR2YXIgc2xvcGUgPSAoc3VyZmFjZVkyIC0gc3VyZmFjZVkxKSAvIChzdXJmYWNlWDIgLSBzdXJmYWNlWDEpXG5cdHZhciBzdXJmYWNlSGl0UG9zWCA9ICgocG9zaXRpb25ZIC0gc3VyZmFjZVkxKSAvIHNsb3BlKSArIHN1cmZhY2VYMVxuXHR2YXIgc3VyZmFjZUhpdFBvc1kgPSAoKHBvc2l0aW9uWCAtIHN1cmZhY2VYMSkgKiBzbG9wZSkgKyBzdXJmYWNlWTFcblx0dmFyIGlzVmVydGljYWwgPSAocG9zaXRpb25YID49IChzdXJmYWNlWDEgLSBxdWFydGVyTGVuZ3RoKSAmJiBwb3NpdGlvblggPD0gKHN1cmZhY2VYMiArIHF1YXJ0ZXJMZW5ndGgpKVxuXHR2YXIgaXNIb3Jpem9udGFsID0gKHBvc2l0aW9uWSA+PSAoc3VyZmFjZVkxIC0gcXVhcnRlckxlbmd0aCkgJiYgcG9zaXRpb25ZIDw9IChzdXJmYWNlWTIgKyBxdWFydGVyTGVuZ3RoKSlcblx0dmFyIGlzVXAgPSBpc1ZlcnRpY2FsICYmIHBvc2l0aW9uWSA8PSBzdXJmYWNlSGl0UG9zWVxuXHR2YXIgaXNEb3duID0gaXNWZXJ0aWNhbCAmJiBwb3NpdGlvblkgPj0gc3VyZmFjZUhpdFBvc1lcblx0dmFyIGlzTGVmdCA9IGlzSG9yaXpvbnRhbCAmJiBwb3NpdGlvblggPD0gc3VyZmFjZUhpdFBvc1hcblx0dmFyIGlzUmlnaHQgPSBpc0hvcml6b250YWwgJiYgcG9zaXRpb25YID49IHN1cmZhY2VIaXRQb3NYXG5cdHZhciB2ZWxvY2l0eU1hZ25pdHVkZSA9IG1hZ25pdHVkZSh2ZWxvY2l0eSlcblx0dmFyIGRpc3RhbmNlID0gMFxuXHQvL0hBQ0sgRklYTUVcblx0aWYgKGlzVXAgJiYgKHZlbG9jaXR5LnkgPj0gMCkpIHtcblx0ICAgIGRpc3RhbmNlID0gc3VyZmFjZUhpdFBvc1kgLSAocG9zaXRpb25ZICsgaGFsZkxlbmd0aClcblx0fSBlbHNlIGlmIChpc0Rvd24gJiYgKHZlbG9jaXR5LnkgPD0gMCkpIHtcblx0ICAgIGRpc3RhbmNlID0gKHBvc2l0aW9uWSAtIGhhbGZMZW5ndGgpIC0gc3VyZmFjZUhpdFBvc1lcblx0fSBlbHNlIGlmIChpc0xlZnQgJiYgKHZlbG9jaXR5LnggPj0gMCkgJiYgKHBvc2l0aW9uWCA8PSBzdXJmYWNlSGl0UG9zWCkpIHtcblx0ICAgIGRpc3RhbmNlID0gc3VyZmFjZUhpdFBvc1ggLSAocG9zaXRpb25YICsgaGFsZkxlbmd0aClcblx0fSBlbHNlIGlmIChpc1JpZ2h0ICYmICh2ZWxvY2l0eS54IDw9IDApICYmIChwb3NpdGlvblggPj0gc3VyZmFjZUhpdFBvc1gpKSB7XG5cdCAgICBkaXN0YW5jZSA9IChwb3NpdGlvblggLSBoYWxmTGVuZ3RoKSAtIHN1cmZhY2VIaXRQb3NYXG5cdH0gZWxzZSB7XG5cdCAgICByZXR1cm4gMTAwMDAwMFxuXHR9XG5cdHZhciB0aW1lID0gZGlzdGFuY2UgLyB2ZWxvY2l0eU1hZ25pdHVkZSBcblx0cmV0dXJuIE1hdGgubWF4KDAsIHRpbWUpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGUgPSBmdW5jdGlvbihwMSwgcDIpIHtcblx0cmV0dXJuIChwMS55IC0gcDIueSkgLyAocDIueCAtIHAxLngpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uYW5nbGUgPSBmdW5jdGlvbihwMSwgcDIpIHtcblx0cmV0dXJuIE1hdGguYXRhbjIocDEueSAtIHAyLnksIHAyLnggLSBwMS54KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yID0gZnVuY3Rpb24ocDEsIHAyKSB7XG5cdHZhciBzbG9wZSA9IHRoaXMuc2xvcGUocDEsIHAyKSwgYXRuID0gTWF0aC5hdGFuKHNsb3BlKVxuXHR2YXIgc2lnbiA9IHAxLnggPCBwMi54ID8gLTEgOiAxXG5cdHJldHVybiB7eDogc2lnbiAqIE1hdGguc2luKGF0biksIHk6IHNpZ24gKiBNYXRoLmNvcyhhdG4pfVxuICAgIH1cblxuICAgIC8vIFRpbWVyIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fVGltZXJDb25zdHJhaW50KHRpbWVyKSB7XG5cdHRoaXMudGltZXIgPSB0aW1lclxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyKFRpbWVyIFQpIHN0YXRlcyB0aGUgc3lzdGVtIGFkdmFuY2VzIGl0cyBwc2V1ZG8tdGltZSBieSBUJ3Mgc3RlcCBzaXplIGF0IGVhY2ggZnJhbWUgY3ljbGUuXCIgfVxuXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7dGltZXI6ICdUaW1lcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50KFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyLmR1bW15KHgsIHkpKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQucHJvdG90eXBlLnByb3Bvc2VOZXh0UHNldWRvVGltZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHBzZXVkb1RpbWUgKyB0aGlzLnRpbWVyLnN0ZXBTaXplXG4gICAgfSAgICBcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt9XG4gICAgfVxuXG4gICAgLy8gVmFsdWVTbGlkZXJDb25zdHJhaW50IENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fVmFsdWVTbGlkZXJDb25zdHJhaW50KHNsaWRlclBvaW50LCB4T3JZLCBzbGlkZXJaZXJvVmFsdWUsIHNsaWRlclJhbmdlTGVuZ3RoLCBzbGlkZWRPYmosIHNsaWRlZFByb3ApIHtcblx0dGhpcy5zbGlkZXJQb2ludCA9IHNsaWRlclBvaW50XG5cdHRoaXMueE9yWSA9IHhPcllcblx0dGhpcy5zbGlkZXJaZXJvVmFsdWUgPSBzbGlkZXJaZXJvVmFsdWVcblx0dGhpcy5zbGlkZXJSYW5nZUxlbmd0aCA9IHNsaWRlclJhbmdlTGVuZ3RoXG5cdHRoaXMuc2xpZGVkT2JqID0gc2xpZGVkT2JqXG5cdHRoaXMuc2xpZGVkUHJvcCA9IHNsaWRlZFByb3Bcblx0dGhpcy5zbGlkZWRPYmpQcm9wWmVyb1ZhbHVlID0gc2xpZGVkT2JqW3NsaWRlZFByb3BdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzbGlkZXJQb2ludDogJ1BvaW50JywgeE9yWTogJ1N0cmluZycsIHNsaWRlclplcm9WYWx1ZTogJ051bWJlcicsIHNsaWRlclJhbmdlTGVuZ3RoOiAnTnVtYmVyJywgc2xpZGVkT2JqUHJvcFplcm9WYWx1ZTogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50KFBvaW50LmR1bW15KHgsIHkpLCAneCcsIDAsIDEwMCwge2ZvbzogMH0sICdmb28nKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNsaWRlZFByb3AgPSB0aGlzLnNsaWRlZFByb3Bcblx0dmFyIGN1cnJTbGlkZXJEaWZmID0gKHRoaXMuc2xpZGVyWmVyb1ZhbHVlIC0gdGhpcy5zbGlkZXJQb2ludFt0aGlzLnhPclldKSAvIHRoaXMuc2xpZGVyUmFuZ2VMZW5ndGhcblx0dmFyIHNsaWRlZE9ialByb3BUYXJnZXQgPSAoMSArIGN1cnJTbGlkZXJEaWZmKSAqIHRoaXMuc2xpZGVkT2JqUHJvcFplcm9WYWx1ZVxuXHRyZXR1cm4gc2xpZGVkT2JqUHJvcFRhcmdldCAtIHRoaXMuc2xpZGVkT2JqW3NsaWRlZFByb3BdXG5cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNvbG4gPSB7fVxuXHR2YXIgc2xpZGVkUHJvcCA9IHRoaXMuc2xpZGVkUHJvcFxuXHR2YXIgY3VyclNsaWRlckRpZmYgPSAodGhpcy5zbGlkZXJaZXJvVmFsdWUgLSB0aGlzLnNsaWRlclBvaW50W3RoaXMueE9yWV0pIC8gdGhpcy5zbGlkZXJSYW5nZUxlbmd0aFxuXHR2YXIgc2xpZGVkT2JqUHJvcFRhcmdldCA9ICgxICsgY3VyclNsaWRlckRpZmYpICogdGhpcy5zbGlkZWRPYmpQcm9wWmVyb1ZhbHVlXG5cdHNvbG5bc2xpZGVkUHJvcF0gPSBzbGlkZWRPYmpQcm9wVGFyZ2V0XG5cdHRoaXMuc2xpZGVyUG9pbnQuc2VsZWN0aW9uSW5kaWNlc1swXSA9IE1hdGguZmxvb3IoMTAwICogY3VyclNsaWRlckRpZmYpXG5cdHJldHVybiB7c2xpZGVkT2JqOiBzb2xufVxuICAgIH1cblxuICAgIC8vIE1vdGlvbiBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1ZlbG9jaXR5Q29uc3RyYWludChib2R5KSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50KEZyZWVCb2R5IEJvZHkpIHN0YXRlcyBmb3IgQm9keTogUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQoRnJlZUJvZHkuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCBkdCkpLCB0aGlzLnBvc2l0aW9uKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSl9XG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0dmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKHRoaXMucG9zaXRpb24sIHRoaXMudmVsb2NpdHkpXHRcblx0dmFyIGxlbiA9IDUwXG5cdHZhciBwID0gcGx1cyh0aGlzLnBvc2l0aW9uLCB7eDogc2xvcGVWLnggKiBsZW4sIHk6IHNsb3BlVi55ICogbGVufSlcblx0Y2FudmFzLmRyYXdBcnJvdyh0aGlzLnBvc2l0aW9uLCBwLCBvcmlnaW4sICd2JylcbiAgICB9XG4gICAgXG4gICAgLy8gQm9keSBXaXRoIFZlbG9jaXR5IENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1ZlbG9jaXR5Q29uc3RyYWludDIoYm9keSwgdmVsb2NpdHkpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLnBvc2l0aW9uID0gYm9keS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50MiwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyKEZyZWVCb2R5IEJvZHksIFBvaW50VmVjdG9yIFZlbG9jaXR5KSBzdGF0ZXMgZm9yIEJvZHk6IFBvcyA9IG9sZChQb3MpICsgVmVsb2NpdHkgKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknLCB2ZWxvY2l0eTogJ1BvaW50VmVjdG9yJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50MihGcmVlQm9keS5kdW1teSh4LCB5KSwgUG9pbnRWZWN0b3IuZHVtbXkoeCwgeSkpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RQb3NpdGlvbiA9IHNjYWxlZEJ5KHRoaXMucG9zaXRpb24sIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eS5tYWduaXR1ZGUoKSwgZHQpKSwgdGhpcy5wb3NpdGlvbikpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSl9XG4gICAgfVxuICAgIFxuICAgIC8vIEFjY2VsZXJhdGlvbiBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19BY2NlbGVyYXRpb25Db25zdHJhaW50KGJvZHksIGFjY2VsZXJhdGlvbikge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludChGcmVlQm9keSBCb2R5LCBWZWN0b3IgQWNjZWxlcmF0aW9uKSBzdGF0ZXMgZm9yIEJvZHk6IFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSArIEFjY2VsZXJhdGlvbiAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIGFjY2VsZXJhdGlvbjogJ1ZlY3Rvcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQoRnJlZUJvZHkuZHVtbXkoeCwgeSksIFNrZXRjaHBhZC5nZW9tLlZlY3Rvci5kdW1teSh4ICsgNTAsIHkgKyA1MCkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFZlbG9jaXR5ID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eSwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFZlbG9jaXR5LCBzY2FsZWRCeSh0aGlzLmFjY2VsZXJhdGlvbiwgZHQpKSwgdGhpcy52ZWxvY2l0eSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHt2ZWxvY2l0eTogcGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSl9XG4gICAgfVxuXG4gICAgLy8gQWlyIFJlc2lzdGFuY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0FpclJlc2lzdGFuY2VDb25zdHJhaW50KGJvZHksIHNjYWxlKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5zY2FsZSA9IC1zY2FsZVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQoRnJlZUJvZHkgQm9keSkgc3RhdGVzIGZvciBCb2R5OiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKiBTY2FsZSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7c2NhbGU6ICdOdW1iZXInLCB2ZWxvY2l0eTogJ1ZlY3Rvcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludChTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIC4xKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0VmVsb2NpdHkgPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHNjYWxlZEJ5KHRoaXMubGFzdFZlbG9jaXR5LCB0aGlzLnNjYWxlKSwgdGhpcy52ZWxvY2l0eSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpfVxuICAgIH1cblxuICAgIC8vICBCb3VuY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fQm91bmNlQ29uc3RyYWludChib2R5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMuaGFsZkxlbmd0aCA9IGJvZHkucmFkaXVzXG5cdHRoaXMucG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG5cdHRoaXMuc3VyZmFjZVAxID0gc3VyZmFjZVAxXG5cdHRoaXMuc3VyZmFjZVAyID0gc3VyZmFjZVAyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludChGcmVlQm9keSBCb2R5LCBQb2ludCBFbmQxLCBQb2ludCBFbmQyKSBzdGF0ZXMgdGhhdCB0aGUgQm9keSB3aXRoIGRpYW1ldGVyIEwgYW5kIHBvc2l0aW9uIFBvcyBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbCBpcyBnb2luZyB0byBib3VuY2Ugb2ZmIHRoZSBsaW5lIHdpdGggdHdvIGVuZCBwb2ludHMgRW5kMSAmIEVuZDIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknLCBzdXJmYWNlUDE6ICdQb2ludCcsIHN1cmZhY2VQMjogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludChGcmVlQm9keS5kdW1teSh4LCB5KSwgUG9pbnQuZHVtbXkoeCwgeSksIFBvaW50LmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3Bvc2VOZXh0UHNldWRvVGltZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUpIHtcblx0dmFyIHJlcyA9IHBzZXVkb1RpbWUgKyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5jb21wdXRlQ29udGFjdCh0aGlzLmhhbGZMZW5ndGgsIHRoaXMucG9zaXRpb24sIHRoaXMudmVsb2NpdHksIHRoaXMuc3VyZmFjZVAxLCB0aGlzLnN1cmZhY2VQMilcblx0dGhpcy50Y29udGFjdCA9IHJlcztcblx0cmV0dXJuIHJlc1xuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvblxuXHR2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdHZhciBzdXJmYWNlUDEgPSB0aGlzLnN1cmZhY2VQMVxuXHR2YXIgc3VyZmFjZVAyID0gdGhpcy5zdXJmYWNlUDJcbiAgICAgICAgLy9Ta2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikpIHtcblx0aWYgKHRoaXMudGNvbnRhY3QgPT0gcHNldWRvVGltZSkgeyBcblx0ICAgIHRoaXMudGNvbnRhY3QgPSB1bmRlZmluZWRcblx0ICAgIHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHQgICAgdmFyIHNsb3BlID0gKHN1cmZhY2VQMi55IC0gc3VyZmFjZVAxLnkpIC8gKHN1cmZhY2VQMi54IC0gc3VyZmFjZVAxLngpXG5cdCAgICB2YXIgc3VyZmFjZUhpdFBvc1ggPSBzdXJmYWNlUDIueSA9PSBzdXJmYWNlUDEueSA/IHBvc2l0aW9uLnggOiAoKHBvc2l0aW9uLnkgLSBzdXJmYWNlUDEueSkgLyBzbG9wZSkgKyBzdXJmYWNlUDEueFxuXHQgICAgdmFyIHN1cmZhY2VIaXRQb3NZID0gc3VyZmFjZVAyLnggPT0gc3VyZmFjZVAxLnggPyBwb3NpdGlvbi55IDogKChwb3NpdGlvbi54IC0gc3VyZmFjZVAxLngpICogc2xvcGUpICsgc3VyZmFjZVAxLnlcblx0ICAgIHZhciBzdXJmYWNlQW5nbGUgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5hbmdsZShzdXJmYWNlUDEsIHN1cmZhY2VQMilcblx0ICAgIHZhciB2ZWxvY2l0eUFuZ2xlID0gU2tldGNocGFkLnNpbXVsYXRpb24uYW5nbGUoe3g6IDAsIHk6IDB9LCB2ZWxvY2l0eSlcblx0ICAgIHZhciByZWZsZWN0aW9uQW5nbGUgPSBzdXJmYWNlQW5nbGUgLSB2ZWxvY2l0eUFuZ2xlIFxuXHQgICAgdmFyIHZlbG9jaXR5TWFnbml0dWRlID0gTWF0aC5zcXJ0KCh2ZWxvY2l0eS54ICogdmVsb2NpdHkueCkgKyAodmVsb2NpdHkueSAqIHZlbG9jaXR5LnkpKVxuXHQgICAgdmFyIGFuZ2xlQyA9IE1hdGguY29zKHJlZmxlY3Rpb25BbmdsZSlcblx0ICAgIHZhciBhbmdsZVMgPSBNYXRoLnNpbihyZWZsZWN0aW9uQW5nbGUpXG5cdCAgICB2YXIgeCA9IGFuZ2xlQyAqIHZlbG9jaXR5TWFnbml0dWRlICogMVxuXHQgICAgdmFyIHkgPSBhbmdsZVMgKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIC0xXG5cdCAgICB0aGlzLmJvdW5jZVZlbG9jaXR5ID0gc2NhbGVkQnkoe3g6IHgsIHk6IHl9LCAxKVxuXHQgICAgdmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKHN1cmZhY2VQMSwgc3VyZmFjZVAyKVxuXHQgICAgdmFyIGRlbHRhUG9zWCA9IHNsb3BlVi54ICogdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgdmFyIGRlbHRhUG9zWSA9IHNsb3BlVi55ICogLXZlbG9jaXR5TWFnbml0dWRlICogZHRcblx0ICAgIHRoaXMuYm91bmNlUG9zaXRpb24gPSB7eDogcG9zaXRpb24ueCArIGRlbHRhUG9zWCwgeTogcG9zaXRpb24ueSArIGRlbHRhUG9zWX1cblxuXHQgICAgLy8gSEFDSyBGSVhNRT8gc2V0IHZlbG9jaXR5IGF0b21pY2FsbHkgcmlnaHQgaGVyZSEhXG5cdCAgICAvL3RoaXMuY29udGFjdCA9IHRydWVcblx0ICAgIHZlbG9jaXR5LnggPSB0aGlzLmJvdW5jZVZlbG9jaXR5Lnhcblx0ICAgIHZlbG9jaXR5LnkgPSB0aGlzLmJvdW5jZVZlbG9jaXR5Lnlcblx0ICAgIHBvc2l0aW9uLnggPSB0aGlzLmJvdW5jZVBvc2l0aW9uLnhcblx0ICAgIHBvc2l0aW9uLnkgPSB0aGlzLmJvdW5jZVBvc2l0aW9uLnlcblxuXHR9IGVsc2Vcblx0ICAgIHRoaXMuY29udGFjdCA9IGZhbHNlXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0Lypcblx0ICB2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdCAgdmFyIHN1cmZhY2VQMSA9IHRoaXMuc3VyZmFjZVAxXG5cdCAgdmFyIHN1cmZhY2VQMiA9IHRoaXMuc3VyZmFjZVAyXG5cdCAgcmV0dXJuIHRoaXMuY29udGFjdCA/IChcblx0ICBtYWduaXR1ZGUobWludXModGhpcy5ib3VuY2VWZWxvY2l0eSwgdGhpcy52ZWxvY2l0eSkpIFxuXHQgICsgbWFnbml0dWRlKG1pbnVzKHRoaXMuYm91bmNlUG9zaXRpb24sIHRoaXMucG9zaXRpb24pKSBcblx0ICApIDogMFxuXHQqL1xuXHRyZXR1cm4gMFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0Lypcblx0ICB2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0ICByZXR1cm4ge3ZlbG9jaXR5OiBcblx0ICBtaW51cyhwbHVzKHRoaXMuYm91bmNlVmVsb2NpdHksIHNjYWxlZEJ5KHt4OiAwLCB5OiAtU2tldGNocGFkLnNpbXVsYXRpb24uZ30sIGR0KSksIHRoaXMudmVsb2NpdHkpLFxuXHQgIHBvc2l0aW9uOiAobWludXModGhpcy5ib3VuY2VQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbikpXG5cdCAgfVxuXHQqL1xuXHRyZXR1cm4ge31cbiAgICB9XG5cbiAgICAvLyAgSGl0U3VyZmFjZSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fSGl0U3VyZmFjZUNvbnN0cmFpbnQoYm9keSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLmhhbGZMZW5ndGggPSBib2R5LnJhZGl1cyAvIDJcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5zdXJmYWNlUDEgPSBzdXJmYWNlUDFcblx0dGhpcy5zdXJmYWNlUDIgPSBzdXJmYWNlUDJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50KEZyZWVCb2R5IEJvZHksIFBvaW50IEVuZDEsIFBvaW50IEVuZDIpIHN0YXRlcyB0aGF0IHRoZSBCb2R5IHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIHN0YXkgb24gdGhlIGxpbmUgd2l0aCB0d28gZW5kIHBvaW50cyBFbmQxICYgRW5kMi5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknLCBzdXJmYWNlUDE6ICdQb2ludCcsIHN1cmZhY2VQMjogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBQb2ludC5kdW1teSh4LCB5KSwgUG9pbnQuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvblxuXHR2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdHZhciBzdXJmYWNlUDEgPSB0aGlzLnN1cmZhY2VQMVxuXHR2YXIgc3VyZmFjZVAyID0gdGhpcy5zdXJmYWNlUDJcblx0aWYgKFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSkge1xuXHQgICAgdGhpcy5jb250YWN0ID0gdHJ1ZVxuXHQgICAgdmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdCAgICB2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3Ioc3VyZmFjZVAxLCBzdXJmYWNlUDIpXG5cdCAgICB0aGlzLmhpdFZlbG9jaXR5ID0gc2NhbGVkQnkoe3g6IDAsIHk6IC1Ta2V0Y2hwYWQuc2ltdWxhdGlvbi5nfSwgZHQpXG5cdCAgICB2YXIgdmVsb2NpdHlNYWduaXR1ZGUgPSBNYXRoLnNxcnQoKHZlbG9jaXR5LnggKiB2ZWxvY2l0eS54KSArICh2ZWxvY2l0eS55ICogdmVsb2NpdHkueSkpXG5cdCAgICBkZWx0YVBvc1ggPSBzbG9wZVYueCAqIHZlbG9jaXR5TWFnbml0dWRlICogZHRcblx0ICAgIGRlbHRhUG9zWSA9IHNsb3BlVi55ICogdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgdGhpcy5oaXRQb3NpdGlvbiA9IHt4OiBwb3NpdGlvbi54ICsgZGVsdGFQb3NYLCB5OiBwb3NpdGlvbi55ICsgZGVsdGFQb3NZfVxuXHR9IGVsc2Vcblx0ICAgIHRoaXMuY29udGFjdCA9IGZhbHNlXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy5jb250YWN0ID8gKFxuXHQgICAgbWFnbml0dWRlKG1pbnVzKHRoaXMuaGl0VmVsb2NpdHksIHRoaXMudmVsb2NpdHkpKSArIFxuXHRcdG1hZ25pdHVkZShtaW51cyh0aGlzLmhpdFBvc2l0aW9uLCB0aGlzLnBvc2l0aW9uKSkgXG5cdCkgOiAwXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogdGhpcy5oaXRWZWxvY2l0eSwgcG9zaXRpb246IHRoaXMuaGl0UG9zaXRpb259XG4gICAgfVxuXG4gICAgLy8gQ29udmV5b3IgQmVsdCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19Db252ZXlvckJlbHRDb25zdHJhaW50KGJvZHksIGJlbHQpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLmhhbGZMZW5ndGggPSBib2R5LnJhZGl1c1xuXHR0aGlzLnBvc2l0aW9uID0gYm9keS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuXHR0aGlzLmJlbHQgPSBiZWx0XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludChOdW1iZXIgTCwgRnJlZUJvZHkgQm9keSwgQ29udmV5b3JCZWx0IEJlbHQpIHN0YXRlcyB0aGF0IHRoZSBib2R5IHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIG1vdmUgYmFzZWQgb24gdGhlIGNvbnZleW9yIGJlbHQgQmVsdCdzIHZlbG9jaXR5LlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5JywgYmVsdDogJ0JlbHQnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBCZWx0LmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eVxuXHR2YXIgYmVsdCA9IHRoaXMuYmVsdFxuXHR2YXIgYmVsdFAxID0gYmVsdC5wb3NpdGlvbjFcblx0dmFyIGJlbHRQMiA9IGJlbHQucG9zaXRpb24yXG5cdHZhciBiZWx0U3BlZWQgPSBiZWx0LnNwZWVkXG5cdGlmIChTa2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgdGhpcy5wb3NpdGlvbiwgdmVsb2NpdHksIGJlbHRQMSwgYmVsdFAyKSkge1xuXHQgICAgdGhpcy5jb250YWN0ID0gdHJ1ZVxuXHQgICAgdmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKGJlbHRQMSwgYmVsdFAyKVxuXHQgICAgdGhpcy50YXJnZXRWZWxvY2l0eSA9IHt4OiB2ZWxvY2l0eS54ICsgKHNsb3BlVi55ICogYmVsdFNwZWVkKSwgeTogdmVsb2NpdHkueSArIChzbG9wZVYueCAqIGJlbHRTcGVlZCl9XG5cdH0gZWxzZVxuXHQgICAgdGhpcy5jb250YWN0ID0gZmFsc2VcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGJlbHQgPSB0aGlzLmJlbHRcblx0dmFyIGJlbHRQMSA9IGJlbHQucG9zaXRpb24xXG5cdHZhciBiZWx0UDIgPSBiZWx0LnBvc2l0aW9uMlxuXHRyZXR1cm4gKFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCB0aGlzLnBvc2l0aW9uLCB0aGlzLnZlbG9jaXR5LCBiZWx0UDEsIGJlbHRQMikpID8gMSA6IDBcdFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB0aGlzLmNvbnRhY3QgPyBtYWduaXR1ZGUobWludXModGhpcy50YXJnZXRWZWxvY2l0eSwgdGhpcy52ZWxvY2l0eSkpIDogMFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogdGhpcy50YXJnZXRWZWxvY2l0eX1cbiAgICB9XG5cbiAgICAvLyBOb092ZXJsYXAgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fTm9PdmVybGFwQ29uc3RyYWludChib2R5MSwgYm9keTIpIHtcblx0dGhpcy5ib2R5MSA9IGJvZHkxXG5cdHRoaXMubGVuZ3RoMSA9IGJvZHkxLnJhZGl1cyAvIDJcblx0dGhpcy5wb3NpdGlvbjEgPSBib2R5MS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5MSA9IGJvZHkxLnZlbG9jaXR5XG5cdHRoaXMuYm9keTIgPSBib2R5MlxuXHR0aGlzLmxlbmd0aDIgPSBib2R5Mi5yYWRpdXMgLyAyXG5cdHRoaXMucG9zaXRpb24yID0gYm9keTIucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eTIgPSBib2R5Mi52ZWxvY2l0eVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQoRnJlZUJvZHkgQm9keTEsIEZyZWVCb2R5IEJvZHkxKSBzdGF0ZXMgdGhhdCB0aGUgQm9keTEgd2l0aCBkaWFtZXRlciBMMSBhbmQgcG9zaXRpb24gUG9zMSBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbDEgYW5kIHRoZSBCb2R5MiB3aXRoIGRpYW1ldGVyIEwyIGFuZCBwb3NpdGlvbiBQb3MyIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsMiB3aWxsIHB1c2ggZWFjaCBvdGhlciBpZiB0b3VjaGluZy5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHkxOiAnRnJlZUJvZHknLCBib2R5MjogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludChGcmVlQm9keS5kdW1teSh4LCB5KSwgRnJlZUJvZHkuZHVtbXkoeCArMTAwLCB5ICsgMTAwKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbGVuZ3RoMSA9IHRoaXMubGVuZ3RoMVxuXHR2YXIgcG9zaXRpb24xID0gdGhpcy5wb3NpdGlvbjFcblx0dmFyIHZlbG9jaXR5MSA9IHRoaXMudmVsb2NpdHkxXG5cdHZhciBsZW5ndGgyID0gdGhpcy5sZW5ndGgyXG5cdHZhciBwb3NpdGlvbjIgPSB0aGlzLnBvc2l0aW9uMlxuXHR2YXIgcDF4ID0gcG9zaXRpb24xLngsIHAxeSA9IHBvc2l0aW9uMS55XG5cdHZhciBwMnggPSBwb3NpdGlvbjIueCwgcDJ5ID0gcG9zaXRpb24yLnlcblx0cmV0dXJuICgocDF4ID4gcDJ4IC0gbGVuZ3RoMiAvIDIgJiYgcDF4IDwgcDJ4ICsgbGVuZ3RoMikgJiZcblx0XHQocDF5ID4gcDJ5IC0gbGVuZ3RoMiAvIDIgJiYgcDF5IDwgcDJ5ICsgbGVuZ3RoMikpID8gMSA6IDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsZW5ndGgxID0gdGhpcy5sZW5ndGgxXG5cdHZhciBwb3NpdGlvbjEgPSB0aGlzLnBvc2l0aW9uMVxuXHR2YXIgdmVsb2NpdHkxID0gdGhpcy52ZWxvY2l0eTFcblx0dmFyIGxlbmd0aDIgPSB0aGlzLmxlbmd0aDJcblx0dmFyIHBvc2l0aW9uMiA9IHRoaXMucG9zaXRpb24yXG5cdHZhciBwMXggPSBwb3NpdGlvbjEueFxuXHR2YXIgcDJ4ID0gcG9zaXRpb24yLnhcblx0dmFyIHNvbG4gPSBwMXggPiBwMnggPyB7cG9zaXRpb24yOiB7eDogcDF4IC0gKGxlbmd0aDIpfX0gOiB7cG9zaXRpb24xOiB7eDogcDJ4IC0gKGxlbmd0aDEpfX1cblx0cmV0dXJuIHNvbG5cbiAgICB9XG5cbiAgICAvLyAgU3ByaW5nIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1NwcmluZ0NvbnN0cmFpbnQoYm9keTEsIGJvZHkyLCBzcHJpbmcpIHtcblx0dGhpcy5ib2R5MSA9IGJvZHkxXG5cdHRoaXMuYm9keTIgPSBib2R5MlxuXHR0aGlzLnBvc2l0aW9uMSA9IGJvZHkxLnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkxID0gYm9keTEudmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24xID0gYm9keTEuYWNjZWxlcmF0aW9uXG5cdHRoaXMubWFzczEgPSBib2R5MS5tYXNzXG5cdHRoaXMucG9zaXRpb24yID0gYm9keTIucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eTIgPSBib2R5Mi52ZWxvY2l0eVxuXHR0aGlzLmFjY2VsZXJhdGlvbjIgPSBib2R5Mi5hY2NlbGVyYXRpb25cblx0dGhpcy5tYXNzMiA9IGJvZHkyLm1hc3Ncblx0dGhpcy5zcHJpbmcgPSBzcHJpbmdcblx0dGhpcy5fbGFzdFZlbG9jaXRpZXMgPSBbdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludChGcmVlQm9keSBCb2R5MSwgRnJlZUJvZHkgQm9keTIsIFNwcmluZyBTKSBzdGF0ZXMgdGhhdCBzcHJpbmcgUyBoYXMgYmVlbiBhdHRhY2hlZCB0byB0d28gYm9kaWVzIEJvZHkxIGFuZCBCb2R5Mi5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHkxOiAnRnJlZUJvZHknLCBib2R5MjogJ0ZyZWVCb2R5Jywgc3ByaW5nOiAnU3ByaW5nJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludChGcmVlQm9keS5kdW1teSh4LCB5KSwgRnJlZUJvZHkuZHVtbXkoeCsxMDAsIHkrMTAwKSwgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLl9sYXN0VmVsb2NpdGllc1swXSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkxLCAxKVxuXHR0aGlzLl9sYXN0VmVsb2NpdGllc1sxXSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkyLCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzcHJpbmcgPSB0aGlzLnNwcmluZ1xuXHRpZiAoc3ByaW5nLnRvcm4pIHtcblx0ICAgIHJldHVybiAwXG5cdH1cblx0dmFyIHBvc2l0aW9ucyA9IFt0aGlzLnBvc2l0aW9uMSwgdGhpcy5wb3NpdGlvbjJdXG5cdHZhciBtYXNzZXMgPSBbdGhpcy5tYXNzMSwgdGhpcy5tYXNzMl1cblx0dmFyIHZlbG9jaXRpZXMgPSBbdGhpcy52ZWxvY2l0eTEsIHRoaXMudmVsb2NpdHkyXVxuXHR2YXIgYWNjZWxlcmF0aW9ucyA9IFt0aGlzLmFjY2VsZXJhdGlvbjEsIHRoaXMuYWNjZWxlcmF0aW9uMl1cblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHZhciBlcnIgPSAwXG5cdGZvciAodmFyIGkgPSAwOyBpIDw9IDE7IGkrKykge1xuXHQgICAgdmFyIGogPSAoaSArIDEpICUgMlxuXHQgICAgdmFyIG1hc3MgPSBtYXNzZXNbal1cblx0ICAgIHZhciBkID0ge3g6IDAsIHk6IDB9XG5cdCAgICBpZiAobWFzcyA+IDApIHsgLy8gaWYgbm90IGFuY2hvcmVkXG5cdFx0dmFyIGFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvbnNbal1cblx0XHR2YXIgcG9zaXRpb24xID0gcG9zaXRpb25zW2ldXG5cdFx0dmFyIHBvc2l0aW9uMiA9IHBvc2l0aW9uc1tqXVxuXHRcdHZhciB2ZWN0b3IgPSBtaW51cyhwb3NpdGlvbjIsIHBvc2l0aW9uMSlcblx0XHR2YXIgc3ByaW5nQ3VyckxlbiA9IG1hZ25pdHVkZSh2ZWN0b3IpXHRcdFxuXHRcdHZhciBzdHJldGNoTGVuID0gIHNwcmluZ0N1cnJMZW4gLSBzcHJpbmcubGVuZ3RoXG5cdFx0dmFyIG5ld0FjY2VsZXJhdGlvbk1hZyA9IHNwcmluZy5rICogc3RyZXRjaExlbiAvIG1hc3Ncblx0XHR2YXIgYWNjID0gc2NhbGVkQnkobm9ybWFsaXplZCh2ZWN0b3IpLCAtbmV3QWNjZWxlcmF0aW9uTWFnKVxuXHRcdGVyciArPSBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLl9sYXN0VmVsb2NpdGllc1tqXSwgc2NhbGVkQnkoYWNjLCBkdCkpLCB2ZWxvY2l0aWVzW2pdKSlcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gZXJyXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc29sbiA9IHt9XG5cdHZhciBzcHJpbmcgPSB0aGlzLnNwcmluZ1xuXHR2YXIgcG9zaXRpb25zID0gW3RoaXMucG9zaXRpb24xLCB0aGlzLnBvc2l0aW9uMl1cblx0dmFyIG1hc3NlcyA9IFt0aGlzLm1hc3MxLCB0aGlzLm1hc3MyXVxuXHR2YXIgdmVsb2NpdGllcyA9IFt0aGlzLnZlbG9jaXR5MSwgdGhpcy52ZWxvY2l0eTJdXG5cdHZhciBhY2NlbGVyYXRpb25zID0gW3RoaXMuYWNjZWxlcmF0aW9uMSwgdGhpcy5hY2NlbGVyYXRpb24yXVxuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gMTsgaSsrKSB7XG5cdCAgICB2YXIgaiA9IChpICsgMSkgJSAyXG5cdCAgICB2YXIgbWFzcyA9IG1hc3Nlc1tqXVxuXHQgICAgdmFyIGQgPSB7eDogMCwgeTogMH0sIHRvcm4gPSBmYWxzZVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFxuXHRcdFx0XHR2YXIgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3Rvcilcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdC8vIGlmIG5vdCB0b3JuIGFwYXJ0Li4uXG5cdFx0dG9ybiA9IHN0cmV0Y2hMZW4gPiBzcHJpbmcudGVhclBvaW50QW1vdW50XG5cdFx0aWYgKCF0b3JuKSB7XG5cdFx0ICAgIHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0ICAgIHZhciBhY2MgPSBzY2FsZWRCeShub3JtYWxpemVkKHZlY3RvciksIC1uZXdBY2NlbGVyYXRpb25NYWcpXG5cdFx0ICAgIGQgPSBwbHVzKHRoaXMuX2xhc3RWZWxvY2l0aWVzW2pdLCBzY2FsZWRCeShhY2MsIGR0KSlcblx0XHR9IFxuXHQgICAgfVxuXHQgICAgaWYgKHRvcm4pXG5cdFx0c29sblsnc3ByaW5nJ10gPSB7dG9ybjogdHJ1ZX1cblx0ICAgIHNvbG5bJ3ZlbG9jaXR5JyArIChqKzEpXSA9IGRcblx0fVx0XG5cdHJldHVybiBzb2xuXG4gICAgfVxuXG4gICAgLy8gIE9yYml0YWxNb3Rpb24gQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX09yYml0YWxNb3Rpb25Db25zdHJhaW50KHN1biwgbW9vbiwgZGlzdGFuY2VEb3duc2NhbGUpIHtcblx0dGhpcy5zdW4gPSBzdW5cblx0dGhpcy5tb29uID0gbW9vblxuXHR0aGlzLnBvc2l0aW9uID0gbW9vbi5wb3NpdGlvblxuXHR0aGlzLl9sYXN0UG9zaXRpb24gPSB1bmRlZmluZWRcblx0dGhpcy5fbGFzdFN1blBvc2l0aW9uID0gdW5kZWZpbmVkXG5cdHRoaXMuZGlzdGFuY2VEb3duc2NhbGUgPSAoZGlzdGFuY2VEb3duc2NhbGUgfHwgKDFlOSAvIDIpKVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQoRnJlZUJvZHkgU3VuLCBGcmVlQm9keSBNb29uKSBzdGF0ZXMgdGhhdCBNb29uIGJvZHkgaXMgb3JiaXRpbmcgYXJvdW5kIFN1biBib2R5IGFjY29yZGluZyB0byBzaW1wbGUgb3JiaXRhbCBtb3Rpb24gZm9ybXVsYS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzdW46ICdGcmVlQm9keScsIG1vb246ICdGcmVlQm9keSd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uQ29uc3RyYWludChGcmVlQm9keS5kdW1teSh4LCB5KSwgRnJlZUJvZHkuZHVtbXkoeCArIDIwMCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHQvL2lmICh0aGlzLl9sYXN0U3VuUG9zaXRpb24pXG5cdCAgICAvL3RoaXMucG9zaXRpb24uc2V0KHBsdXModGhpcy5wb3NpdGlvbiwgbWludXModGhpcy5zdW4ucG9zaXRpb24sIHRoaXMuX2xhc3RTdW5Qb3NpdGlvbikpKVxuXHR0aGlzLl9sYXN0UG9zaXRpb24gPSBzY2FsZWRCeSh0aGlzLnBvc2l0aW9uLCAxKVxuXHQvL3RoaXMuX2xhc3RTdW5Qb3NpdGlvbiA9IHNjYWxlZEJ5KHRoaXMuc3VuLnBvc2l0aW9uLCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5jdXJyZW50RXNjYXBlVmVsb2NpdHkgPSBmdW5jdGlvbigpIHtcblx0dmFyIHAxID0gdGhpcy5wb3NpdGlvbiwgcDIgPSB0aGlzLnN1bi5wb3NpdGlvblxuXHR2YXIgZGlzdDAgPSBkaXN0YW5jZShwMSwgcDIpXG5cdHZhciBkaXN0ID0gZGlzdDAgKiB0aGlzLmRpc3RhbmNlRG93bnNjYWxlXHRcblx0dmFyIHZNYWcwID0gTWF0aC5zcXJ0KCgyICogU2tldGNocGFkLnNpbXVsYXRpb24uRyAqIHRoaXMuc3VuLm1hc3MpIC8gZGlzdClcblx0dmFyIHZNYWcgPSB2TWFnMCAvIHRoaXMuZGlzdGFuY2VEb3duc2NhbGUgXG5cdHZhciBzbG9wZVYgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZVZlY3RvcihwMSwgcDIpXG5cdHJldHVybiB7eDogc2xvcGVWLnggKiB2TWFnLCB5OiBzbG9wZVYueSAqIHZNYWd9XG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0dGhpcy5fdGFyZ2V0VmVsb2NpdHkgPSB0aGlzLmN1cnJlbnRFc2NhcGVWZWxvY2l0eSgpXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLl9sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMuX3RhcmdldFZlbG9jaXR5LCBkdCkpLCB0aGlzLnBvc2l0aW9uKSlcdFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiBwbHVzKHRoaXMuX2xhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy5fdGFyZ2V0VmVsb2NpdHksIGR0KSl9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbFNpbXVsYXRpb25Db25zdHJhaW50c1xuIiwiZnVuY3Rpb24gaW5zdGFsbDNER2VvbWV0cmljQ29uc3RyYWludHMoU2tldGNocGFkKSB7XG5cbiAgICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBnZW9tZXRyaWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIG9iamVjdHMgdGhhdCBoYXZlIHggYW5kIHkgcHJvcGVydGllcy4gT3RoZXIgcHJvcGVydGllcyBhcmUgaWdub3JlZC5cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QgPSB7fVxuXG4gICAgdmFyIHNxdWFyZSA9IFNrZXRjaHBhZC5nZW9tLnNxdWFyZVxuXG4gICAgZnVuY3Rpb24gcGx1cyhwMSwgcDIpIHtcblx0cmV0dXJuIHt4OiBwMS54ICsgcDIueCwgeTogcDEueSArIHAyLnksIHo6IHAxLnogKyBwMi56fVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBtaW51cyhwMSwgcDIpIHtcblx0cmV0dXJuIHt4OiBwMS54IC0gcDIueCwgeTogcDEueSAtIHAyLnksIHo6IHAxLnogLSBwMi56fVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjYWxlZEJ5KHAsIG0pIHtcblx0cmV0dXJuIHt4OiBwLnggKiBtLCB5OiBwLnkgKiBtLCB6OiBwLnogKiBtfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvcHkocCkge1xuXHRyZXR1cm4gc2NhbGVkQnkocCwgMSlcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gbWlkcG9pbnQocDEsIHAyKSB7XG5cdHJldHVybiBzY2FsZWRCeShwbHVzKHAxLCBwMiksIDAuNSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWduaXR1ZGUocCkge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KHNxdWFyZShwLngpICsgc3F1YXJlKHAueSkgKyBzcXVhcmUocC56KSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemVkKHApIHtcblx0dmFyIG0gPSBtYWduaXR1ZGUocClcblx0cmV0dXJuIG0gPiAwID8gc2NhbGVkQnkocCwgMSAvIG0pIDogcFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3RhbmNlKHAxLCBwMikge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KHNxdWFyZShwMS54IC0gcDIueCkgKyBzcXVhcmUocDEueSAtIHAyLnkpICsgc3F1YXJlKHAxLnogLSBwMi56KSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByb3RhdGVkQnkocCwgZFRoZXRhKSB7XG5cdHZhciBjID0gTWF0aC5jb3MoZFRoZXRhKVxuXHR2YXIgcyA9IE1hdGguc2luKGRUaGV0YSlcblx0cmV0dXJuIHt4OiBjKnAueCAtIHMqcC55LCB5OiBzKnAueCArIGMqcC55LCB6OiBwLnp9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIHJvdGF0ZWRBcm91bmQocCwgZFRoZXRhLCBheGlzKSB7XG5cdHJldHVybiBwbHVzKGF4aXMsIHJvdGF0ZWRCeShtaW51cyhwLCBheGlzKSwgZFRoZXRhKSlcblx0Lypcblx0Ly8gcm90YXRlIHRoZSBwb2ludCAoeCx5LHopIGFib3V0IHRoZSB2ZWN0b3Ig4p+odSx2LHfin6kgYnkgdGhlIGFuZ2xlIM64IChhcm91bmQgb3JpZ2luPylcblx0dmFyIHggPSBwLngsIHkgPSBwLnksIHogPSBwLnosIHUgPSBheGlzLngsIHYgPSBheGlzLnksIHcgPSBheGlzLnpcblx0dmFyIGMgPSBNYXRoLmNvcyhkVGhldGEpLCBzID0gTWF0aC5zaW4oZFRoZXRhKVxuXHR2YXIgb25lID0gKHUgKiB4KSArICh2ICogeSkgKyAodyAqIHopLCB0d28gPSAodSAqIHUpICsgKHYgKiB2KSArICh3ICogdyksIHRocmVlID0gTWF0aC5zcXJ0KHR3bylcblx0cmV0dXJuIHt4OiAoKHUgKiBvbmUgKiAoMSAtIGMpKSAgKyAodHdvICogeCAqIGMpICsgKHRocmVlICogcyAqICgodiAqIHopIC0gKHcgKiB5KSkpKSAvIHR3byxcblx0eTogKCh2ICogb25lICogKDEgLSBjKSkgICsgKHR3byAqIHkgKiBjKSArICh0aHJlZSAqIHMgKiAoKHcgKiB4KSAtICh1ICogeikpKSkgLyB0d28sXG4gXHR6OiAoKHcgKiBvbmUgKiAoMSAtIGMpKSAgKyAodHdvICogeiAqIGMpICsgKHRocmVlICogcyAqICgodSAqIHkpIC0gKHYgKiB4KSkpKSAvIHR3b31cblx0Ki9cbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gc2V0RGVsdGEoZCwgcCwgc2NhbGUpIHtcblx0ZC54ID0gcC54ICogc2NhbGVcblx0ZC55ID0gcC55ICogc2NhbGVcblx0ZC56ID0gcC56ICogc2NhbGVcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkb3RQcm9kdWN0KHYxLCB2Mikge1xuXHRyZXR1cm4gKHYxLnggKiB2Mi54KSArICh2MS55ICogdjIueSkgKyAodjEueiAqIHYyLnopXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3Jvc3NQcm9kdWN0KHYxLCB2Mikge1xuXHR2YXIgYSA9IG5ldyBUSFJFRS5WZWN0b3IzKHYxLngsIHYxLnksIHYxLnopXG5cdHZhciBiID0gbmV3IFRIUkVFLlZlY3RvcjModjIueCwgdjIueSwgdjIueilcblx0dmFyIGMgPSBuZXcgVEhSRUUuVmVjdG9yMygpXG5cdGMuY3Jvc3NWZWN0b3JzKCBhLCBiIClcblx0cmV0dXJuIG5ldyBQb2ludDNEKGMueCwgYy55LCBjLnopXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYW5nbGUodjEsIHYyLCBheGlzKSB7XG5cdC8vdmFyIGxhbmdsZSA9IE1hdGguYWNvcyhNYXRoLm1pbigxLCBkb3RQcm9kdWN0KG5vcm1hbGl6ZWQodjEpLCBub3JtYWxpemVkKHYyKSkpKVxuXHR2YXIgdjFtID0gU2tldGNocGFkLmdlb20zZC5tYWduaXR1ZGUodjEpLCB2Mm0gPSBTa2V0Y2hwYWQuZ2VvbTNkLm1hZ25pdHVkZSh2Milcblx0dmFyIHByb2QyID0gKHYxbSAqIHYybSlcblx0aWYgKHByb2QyID09IDApXG5cdCAgICBsYW5nbGUgPSAwXG5cdGVsc2Uge1xuXHQgICAgdmFyIHByb2QxID0gZG90UHJvZHVjdCh2MSwgdjIpXG5cdCAgICB2YXIgZGl2ID0gTWF0aC5taW4oMSwgcHJvZDEgLyBwcm9kMilcblx0ICAgIGxhbmdsZSA9IE1hdGguYWNvcyhkaXYpXG5cdCAgICB2YXIgY3Jvc3MgPSBjcm9zc1Byb2R1Y3QodjEsIHYyKVxuXHQgICAgdmFyIGRvdCA9IGRvdFByb2R1Y3QoYXhpcywgY3Jvc3MpXG5cdCAgICBpZiAoZG90ID4gMCkgLy8gT3IgPiAwXG5cdFx0bGFuZ2xlID0gLWxhbmdsZVxuXHR9XHRcblx0cmV0dXJuIGxhbmdsZVxuICAgIH1cbiAgICAgICAgXG4gICAgU2tldGNocGFkLmdlb20zZC5wbHVzID0gcGx1c1xuICAgIFNrZXRjaHBhZC5nZW9tM2QubWludXMgPSBtaW51c1xuICAgIFNrZXRjaHBhZC5nZW9tM2Quc2NhbGVkQnkgPSBzY2FsZWRCeVxuICAgIFNrZXRjaHBhZC5nZW9tM2QuY29weSA9IGNvcHlcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLm1pZHBvaW50ID0gbWlkcG9pbnRcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLm1hZ25pdHVkZSA9IG1hZ25pdHVkZVxuICAgIFNrZXRjaHBhZC5nZW9tM2Qubm9ybWFsaXplZCA9IG5vcm1hbGl6ZWRcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLmRpc3RhbmNlID0gZGlzdGFuY2VcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLnJvdGF0ZWRCeSA9IHJvdGF0ZWRCeVxuICAgIFNrZXRjaHBhZC5nZW9tM2QuYW5nbGUgPSBhbmdsZVxuICAgIFNrZXRjaHBhZC5nZW9tM2QuZG90UHJvZHVjdCA9IGRvdFByb2R1Y3RcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLmNyb3NzUHJvZHVjdCA9IGNyb3NzUHJvZHVjdFxuICAgIFNrZXRjaHBhZC5nZW9tM2Qucm90YXRlZEFyb3VuZCA9IHJvdGF0ZWRBcm91bmRcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLnNldERlbHRhID0gc2V0RGVsdGFcblxuICAgIC8vIENvb3JkaW5hdGUgQ29uc3RyYWludCwgaS5lLiwgXCJJIHdhbnQgdGhpcyBwb2ludCB0byBiZSBoZXJlXCIuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkNvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tM19fQ29vcmRpbmF0ZUNvbnN0cmFpbnQocCwgeCwgeSwgeikge1xuXHR0aGlzLnAgPSBwXG5cdHRoaXMuYyA9IG5ldyBQb2ludDNEKHgsIHksIHopXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20zZC5Db29yZGluYXRlQ29uc3RyYWludChQb2ludCBQLCBOdW1iZXIgWCwgTnVtYmVyIFksIE51bWJlciBaKSBzdGF0ZXMgdGhhdCBwb2ludCBQIHNob3VsZCBzdGF5IGF0IGNvb3JkaW5hdGUgKFgsIFksIFopLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDogJ1BvaW50M0QnLCBjOiAnUG9pbnQzRCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy5wLCBwcm9wczogWyd4JywgJ3knLCAneiddfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMuYywgdGhpcy5wKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7cDoge3g6IHRoaXMuYy54LCB5OiB0aGlzLmMueSwgejogdGhpcy5jLnp9fVxuICAgIH1cblxuICAgIC8vIExlbmd0aCBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGRpc3RhbmNlIGJldHdlZW4gUDEgYW5kIFAyIGF0IEwuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkxlbmd0aENvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb20zZF9fTGVuZ3RoQ29uc3RyYWludChwMSwgcDIsIGwpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLmwgPSBsXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludChQb2ludDNEIFAxLCBQb2ludDNEIFAyLCBOdW1iZXIgTCkgc2F5cyBwb2ludHMgUDEgYW5kIFAyIGFsd2F5cyBtYWludGFpbiBhIGRpc3RhbmNlIG9mIEwuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQzRCcsIHAyOiAnUG9pbnQzRCcsIGw6ICdOdW1iZXInfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy5wMSwgcHJvcHM6IFsneCcsICd5JywgJ3onXX0sIHtvYmo6IHRoaXMucDIsIHByb3BzOiBbJ3gnLCAneScsICd6J119XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSlcblx0cmV0dXJuIGwxMiAtIHRoaXMubFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyhwMSwgcDIpKVxuXHRpZiAobDEyID09IDApIHtcblx0ICAgIHAxID0gcGx1cyhwMSwge3g6IDAuMSwgeTogMCwgejogMH0pXG5cdCAgICBwMiA9IHBsdXMocDIsIHt4OiAtMC4xLCB5OiAwLCB6OiAwfSlcblx0fVxuXHR2YXIgZGVsdGEgPSAobDEyIC0gdGhpcy5sKSAvIDJcblx0dmFyIGUxMiA9IHNjYWxlZEJ5KFNrZXRjaHBhZC5nZW9tM2Qubm9ybWFsaXplZChtaW51cyhwMiwgcDEpKSwgZGVsdGEpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgZTEyKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoZTEyLCAtMSkpfVxuICAgIH1cblxuICAgIC8vIE1vdG9yIGNvbnN0cmFpbnQgLSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlLlxuICAgIC8vIHcgaXMgaW4gdW5pdHMgb2YgSHogLSB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTW90b3JDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19Nb3RvckNvbnN0cmFpbnQocDEsIHAyLCB3KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy53ID0gd1xuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBOdW1iZXIgVykgY2F1c2VzIFAxIGFuZCBQMiB0byBvcmJpdCB0aGVpciBtaWRwb2ludCBhdCB0aGUgZ2l2ZW4gcmF0ZSBvZiB3LCBpbiB1bml0cyBvZiBIejogd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXCIgfSBcblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgdzogJ051bWJlcid9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiAxXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHQgPSAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAvIDEwMDAuMFxuXHR2YXIgZFRoZXRhID0gdCAqIHRoaXMudyAqICgyICogTWF0aC5QSSlcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cdHJldHVybiB7cDE6IHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLFxuXHRcdHAyOiByb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKX1cbiAgICB9XG4gICAgICAgIFxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGwzREdlb21ldHJpY0NvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsM0RTaW11bGF0aW9uQ29uc3RyYWludHMoU2tldGNocGFkKSB7XG5cbiAgICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBzaW11bGF0aW9uIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgICAvLyBhcmJpdHJhcnkgcHJvcGVydGllcyBvZiBhcmJpdHJhcnkgb2JqZWN0cy4gXCJSZWZlcmVuY2VzXCIgYXJlIHJlcHJlc2VudGVkXG4gICAgLy8gYXMgKG9iamVjdCwgcHJvcGVydHlOYW1lKSB0dXBsZXMsIGUuZy4sIHtvYmo6IHlvdXJNb20sIHByb3A6ICd3ZWlnaHQnfS5cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QgPSB7IGc6IDkuOCwgRzogNi43ZS0xMSB9IC8vIEc6IE5tMi9rZzIgXG5cbiAgICB2YXIgbWludXMgPSBTa2V0Y2hwYWQuZ2VvbTNkLm1pbnVzXG4gICAgdmFyIHBsdXMgPSBTa2V0Y2hwYWQuZ2VvbTNkLnBsdXNcbiAgICB2YXIgc2NhbGVkQnkgPSBTa2V0Y2hwYWQuZ2VvbTNkLnNjYWxlZEJ5XG4gICAgdmFyIG1hZ25pdHVkZSA9IFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlXG4gICAgdmFyIG5vcm1hbGl6ZWQgPSBTa2V0Y2hwYWQuZ2VvbTNkLm5vcm1hbGl6ZWRcbiAgICB2YXIgZGlzdGFuY2UgPSBTa2V0Y2hwYWQuZ2VvbTNkLmRpc3RhbmNlXG4gICAgdmFyIGFuZ2xlID0gU2tldGNocGFkLmdlb20zZC5hbmdsZVxuXG4gICAgLy8gQ2xhc3Nlc1xuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5GcmVlQm9keSA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19GcmVlQm9keShwb3NpdGlvbiwgb3B0UmFkaXVzLCBvcHREcmF3blJhZGl1cywgb3B0TWFzcywgb3B0Q29sb3IpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMubWFzcyA9IG9wdE1hc3MgfHwgMTBcblx0dGhpcy52ZWxvY2l0eSA9IG5ldyBWZWN0b3IzRCgwLCAwLCAwKVxuXHR0aGlzLmFjY2VsZXJhdGlvbiA9IG5ldyBWZWN0b3IzRCgwLCAwLCAwKVxuXHR0aGlzLnJhZGl1cyA9IG9wdFJhZGl1cyB8fCB0aGlzLnBvc2l0aW9uLnJhZGl1c1xuXHR0aGlzLmRyYXduUmFkaXVzID0gb3B0RHJhd25SYWRpdXMgfHwgdGhpcy5yYWRpdXNcblx0cmMuYWRkKG5ldyBTcGhlcmUocG9zaXRpb24sIG9wdENvbG9yLCB0aGlzLmRyYXduUmFkaXVzKSlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5GcmVlQm9keSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuRnJlZUJvZHkucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cG9zaXRpb246ICdQb2ludDNEJywgbWFzczogJ051bWJlcicsIHJhZGl1czogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZyA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19TcHJpbmcoYm9keTEsIGJvZHkyLCBrLCBsZW5ndGgsIHRlYXJQb2ludEFtb3VudCwgb3B0Q29sb3IpIHtcblx0dGhpcy5ib2R5MSA9IGJvZHkxXG5cdHRoaXMuYm9keTEgPSBib2R5MlxuXHR0aGlzLmxpbmUgPSByYy5hZGQobmV3IEN5bGluZGVyKGJvZHkxLnBvc2l0aW9uLCBib2R5Mi5wb3NpdGlvbiwgb3B0Q29sb3IpKVxuXHR0aGlzLmsgPSBrXG5cdHRoaXMubGVuZ3RoID0gbGVuZ3RoICAgIFxuXHR0aGlzLnRlYXJQb2ludEFtb3VudCA9IHRlYXJQb2ludEFtb3VudFxuXHR0aGlzLnRvcm4gPSBmYWxzZVxuICAgIH1cbiAgICBcbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcpXG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTE6ICdGcmVlQm9keScsIGJvZHkyOiAnRnJlZUJvZHknLCBrOiAnTnVtYmVyJywgbGVuZ3RoOiAnTnVtYmVyJywgdGVhdFBvaW50QW1vdW50OiAnTnVtYmVyJ31cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZy5wcm90b3R5cGUuc29sdXRpb25Kb2lucyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge3Rvcm46IHJjLnNrZXRjaHBhZC5sYXN0T25lV2luc0pvaW5Tb2x1dGlvbnN9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0aWYgKHRoaXMubGluZSkge1xuXHQgICAgaWYgKHRoaXMudG9ybikge1xuXHRcdHJjLnJlbW92ZSh0aGlzLmxpbmUpXG5cdFx0dGhpcy5saW5lID0gdW5kZWZpbmVkXG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciBoZWlnaHQgPSB0aGlzLmxpbmUuZ2V0SGVpZ2h0KCksIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG5cdFx0dmFyIHN0cmV0Y2ggPSBNYXRoLmFicyhoZWlnaHQgLSBsZW5ndGgpIC8gbGVuZ3RoXG5cdFx0dmFyIGNvbG9yID0gdGhpcy5saW5lLl9zY2VuZU9iai5tYXRlcmlhbC5jb2xvclxuXHRcdGNvbG9yLnNldCgnZ3JheScpXG5cdFx0Y29sb3IuciArPSBzdHJldGNoXG5cdCAgICB9XG5cdH1cbiAgICB9XG5cdCAgICBcbiAgICAvLyBNb3Rpb24gQ29uc3RyYWludFxuXHRcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19WZWxvY2l0eUNvbnN0cmFpbnQoYm9keSkge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMucG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludChGcmVlQm9keSBCb2R5KSBzdGF0ZXMgZm9yIEJvZHk6IFBvcyA9IG9sZChQb3MpICsgVmVsb2NpdHkgKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiBwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCBkdCkpfVxuICAgIH1cblxuICAgIC8vIEJvZHkgV2l0aCBWZWxvY2l0eSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb24zZF9fVmVsb2NpdHlDb25zdHJhaW50Mihib2R5LCB2ZWxvY2l0eSkge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMucG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIoRnJlZUJvZHkgQm9keSwgUG9pbnRWZWN0b3IzRCBWZWxvY2l0eSkgc3RhdGVzIGZvciBCb2R5OiBQb3MgPSBvbGQoUG9zKSArIFZlbG9jaXR5ICogKHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZSkgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknLCB2ZWxvY2l0eTogJ1BvaW50J31cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RQb3NpdGlvbiA9IHNjYWxlZEJ5KHRoaXMucG9zaXRpb24sIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5Lm1hZ25pdHVkZSgpLCBkdCkpLCB0aGlzLnBvc2l0aW9uKSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiBwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5Lm1hZ25pdHVkZSgpLCBkdCkpfVxuICAgIH1cblxuICAgIC8vIEFjY2VsZXJhdGlvbiBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb24zZF9fQWNjZWxlcmF0aW9uQ29uc3RyYWludChib2R5LCBhY2NlbGVyYXRpb24pIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLnZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuXHR0aGlzLmFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvblxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQoRnJlZUJvZHkgQm9keSwgVmVjdG9yIEFjY2VsZXJhdGlvbikgc3RhdGVzIGZvciBCb2R5OiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKyBBY2NlbGVyYXRpb24gKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIHZlbG9jaXR5OiAnVmVjdG9yM0QnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0VmVsb2NpdHkgPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSksIHRoaXMudmVsb2NpdHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHt2ZWxvY2l0eTogcGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSl9XG4gICAgfVxuXG4gICAgLy8gQWlyIFJlc2lzdGFuY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19BaXJSZXNpc3RhbmNlQ29uc3RyYWludChib2R5LCBzY2FsZSkge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG5cdHRoaXMuc2NhbGUgPSAtc2NhbGVcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50KEZyZWVCb2R5IEJvZHksIE51bWJlciBTY2FsZSkgc3RhdGVzIGZvciBCb2R5OiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKiBTY2FsZSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzY2FsZTogJ051bWJlcicsIGJvZHk6ICdGcmVlQm9keSd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0VmVsb2NpdHkgPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMoc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpLCB0aGlzLnZlbG9jaXR5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7dmVsb2NpdHk6IHNjYWxlZEJ5KHRoaXMubGFzdFZlbG9jaXR5LCB0aGlzLnNjYWxlKX1cbiAgICB9XG5cbiAgICAvLyAgU3ByaW5nIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19TcHJpbmdDb25zdHJhaW50KGJvZHkxLCBib2R5Miwgc3ByaW5nKSB7XG5cdHRoaXMuYm9keTEgPSBib2R5MVxuXHR0aGlzLmJvZHkyID0gYm9keTJcblx0dGhpcy5wb3NpdGlvbjEgPSBib2R5MS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5MSA9IGJvZHkxLnZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uMSA9IGJvZHkxLmFjY2VsZXJhdGlvblxuXHR0aGlzLm1hc3MxID0gYm9keTEubWFzc1xuXHR0aGlzLnBvc2l0aW9uMiA9IGJvZHkyLnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkyID0gYm9keTIudmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24yID0gYm9keTIuYWNjZWxlcmF0aW9uXG5cdHRoaXMubWFzczIgPSBib2R5Mi5tYXNzXG5cdHRoaXMuc3ByaW5nID0gc3ByaW5nXG5cdHRoaXMuX2xhc3RWZWxvY2l0aWVzID0gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ0NvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ0NvbnN0cmFpbnQoRnJlZUJvZHkgQm9keTEsIEZyZWVCb2R5IEJvZHkyLCBTcHJpbmcgUykgc3RhdGVzIHRoYXQgc3ByaW5nIFMgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdHdvIGJvZGllcyBCb2R5MSBhbmQgQm9keTIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHkxOiAnRnJlZUJvZHknLCBib2R5MjogJ0ZyZWVCb2R5Jywgc3ByaW5nOiAnU3ByaW5nJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMuX2xhc3RWZWxvY2l0aWVzWzBdID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eTEsIDEpXG5cdHRoaXMuX2xhc3RWZWxvY2l0aWVzWzFdID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eTIsIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3ByaW5nID0gdGhpcy5zcHJpbmdcblx0aWYgKHNwcmluZy50b3JuKSB7XG5cdCAgICByZXR1cm4gMFxuXHR9XG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHR2YXIgZXJyID0gMFxuXHRmb3IgKHZhciBpID0gMDsgaSA8PSAxOyBpKyspIHtcblx0ICAgIHZhciBqID0gKGkgKyAxKSAlIDJcblx0ICAgIHZhciBtYXNzID0gbWFzc2VzW2pdXG5cdCAgICBpZiAobWFzcyA+IDApIHsgLy8gaWYgbm90IGFuY2hvcmVkXHRcdFxuXHRcdHZhciBhY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb25zW2pdXG5cdFx0dmFyIHBvc2l0aW9uMSA9IHBvc2l0aW9uc1tpXVxuXHRcdHZhciBwb3NpdGlvbjIgPSBwb3NpdGlvbnNbal1cblx0XHR2YXIgdmVjdG9yID0gbWludXMocG9zaXRpb24yLCBwb3NpdGlvbjEpXG5cdFx0dmFyIHNwcmluZ0N1cnJMZW4gPSBtYWduaXR1ZGUodmVjdG9yKVx0XHRcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0dmFyIGFjYyA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQodmVjdG9yKSwgLW5ld0FjY2VsZXJhdGlvbk1hZylcblx0XHRlcnIgKz0gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5fbGFzdFZlbG9jaXRpZXNbal0sIHNjYWxlZEJ5KGFjYywgZHQpKSwgdmVsb2NpdGllc1tqXSkpXG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIGVyclxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc29sbiA9IHt9XG5cdHZhciBzcHJpbmcgPSB0aGlzLnNwcmluZ1xuXHR2YXIgcG9zaXRpb25zID0gW3RoaXMucG9zaXRpb24xLCB0aGlzLnBvc2l0aW9uMl1cblx0dmFyIG1hc3NlcyA9IFt0aGlzLm1hc3MxLCB0aGlzLm1hc3MyXVxuXHR2YXIgdmVsb2NpdGllcyA9IFt0aGlzLnZlbG9jaXR5MSwgdGhpcy52ZWxvY2l0eTJdXG5cdHZhciBhY2NlbGVyYXRpb25zID0gW3RoaXMuYWNjZWxlcmF0aW9uMSwgdGhpcy5hY2NlbGVyYXRpb24yXVxuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gMTsgaSsrKSB7XG5cdCAgICB2YXIgaiA9IChpICsgMSkgJSAyXG5cdCAgICB2YXIgbWFzcyA9IG1hc3Nlc1tqXVxuXHQgICAgdmFyIGQgPSB7eDogMCwgeTogMCwgejogMH0sIHRvcm4gPSBmYWxzZVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFx0XHRcblx0XHR2YXIgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3Rvcilcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdC8vIGlmIG5vdCB0b3JuIGFwYXJ0Li4uXG5cdFx0dG9ybiA9IHN0cmV0Y2hMZW4gPiBzcHJpbmcudGVhclBvaW50QW1vdW50XG5cdFx0aWYgKCF0b3JuKSB7XG5cdFx0ICAgIHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0ICAgIHZhciBhY2MgPSBzY2FsZWRCeShub3JtYWxpemVkKHZlY3RvciksIC1uZXdBY2NlbGVyYXRpb25NYWcpXG5cdFx0ICAgIGQgPSBwbHVzKHRoaXMuX2xhc3RWZWxvY2l0aWVzW2pdLCBzY2FsZWRCeShhY2MsIGR0KSlcblx0XHR9IFxuXHQgICAgfVxuXHQgICAgaWYgKHRvcm4pXG5cdFx0c29sblsnc3ByaW5nJ10gPSB7dG9ybjogdHJ1ZX1cblx0ICAgIHNvbG5bJ3ZlbG9jaXR5JyArIChqKzEpXSA9IGRcblx0fVx0XG5cdHJldHVybiBzb2xuXG4gICAgfVxuXG4gICAgLy8gIE9yYml0YWxNb3Rpb24gQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5PcmJpdGFsTW90aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19PcmJpdGFsTW90aW9uQ29uc3RyYWludChzdW4sIG1vb24sIGRpc3RhbmNlRG93bnNjYWxlKSB7XG5cdHRoaXMuc3VuID0gc3VuXG5cdHRoaXMubW9vbiA9IG1vb25cblx0dGhpcy5wb3NpdGlvbiA9IG1vb24ucG9zaXRpb25cblx0dGhpcy5fbGFzdFBvc2l0aW9uID0gdW5kZWZpbmVkXG5cdHRoaXMuX2xhc3RTdW5Qb3NpdGlvbiA9IHVuZGVmaW5lZFxuXHR0aGlzLmRpc3RhbmNlRG93bnNjYWxlID0gKGRpc3RhbmNlRG93bnNjYWxlIHx8ICgxZTkgLyAyKSlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5PcmJpdGFsTW90aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50KEZyZWVCb2R5IFN1biwgRnJlZUJvZHkgTW9vbikgc3RhdGVzIHRoYXQgTW9vbiBib2R5IGlzIG9yYml0aW5nIGFyb3VuZCBTdW4gYm9keSBhY2NvcmRpbmcgdG8gc2ltcGxlIG9yYml0YWwgbW90aW9uIGZvcm11bGEuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5PcmJpdGFsTW90aW9uQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzdW46ICdGcmVlQm9keScsIG1vb246ICdGcmVlQm9keSd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0Ly9pZiAodGhpcy5fbGFzdFN1blBvc2l0aW9uKVxuXHQgICAgLy90aGlzLnBvc2l0aW9uLnNldChwbHVzKHRoaXMucG9zaXRpb24sIG1pbnVzKHRoaXMuc3VuLnBvc2l0aW9uLCB0aGlzLl9sYXN0U3VuUG9zaXRpb24pKSlcblx0dGhpcy5fbGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcblx0Ly90aGlzLl9sYXN0U3VuUG9zaXRpb24gPSBzY2FsZWRCeSh0aGlzLnN1bi5wb3NpdGlvbiwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5jdXJyZW50RXNjYXBlVmVsb2NpdHkgPSBmdW5jdGlvbigpIHtcblx0dmFyIHAxID0gdGhpcy5wb3NpdGlvbiwgcDIgPSB0aGlzLnN1bi5wb3NpdGlvblxuXHR2YXIgZGlzdDAgPSBkaXN0YW5jZShwMSwgcDIpXG5cdHZhciBkaXN0ID0gZGlzdDAgKiB0aGlzLmRpc3RhbmNlRG93bnNjYWxlXHRcblx0dmFyIHZNYWcwID0gTWF0aC5zcXJ0KCgyICogU2tldGNocGFkLnNpbXVsYXRpb24zZC5HICogdGhpcy5zdW4ubWFzcykgLyBkaXN0KVxuXHR2YXIgdk1hZyA9IHZNYWcwIC8gdGhpcy5kaXN0YW5jZURvd25zY2FsZSBcblx0dmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKHt4OiBwMS54LCB5OiBwMS56fSwge3g6IHAyLngsIHk6IHAyLnp9KVxuXHRyZXR1cm4ge3g6IHNsb3BlVi54ICogdk1hZywgeTogMCwgejogc2xvcGVWLnkgKiB2TWFnfVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0dGhpcy5fdGFyZ2V0VmVsb2NpdHkgPSB0aGlzLmN1cnJlbnRFc2NhcGVWZWxvY2l0eSgpXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLl9sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMuX3RhcmdldFZlbG9jaXR5LCBkdCkpLCB0aGlzLnBvc2l0aW9uKSlcdFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5fbGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLl90YXJnZXRWZWxvY2l0eSwgZHQpKX1cbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50c1xuIiwiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEltcG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyA9IHJlcXVpcmUoJy4vMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzJkL2dlb21ldHJpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8yZC9zaW11bGF0aW9uLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxudmFyIGluc3RhbGwzREdlb21ldHJpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMnKS5pbnN0YWxsXG52YXIgaW5zdGFsbDNEU2ltdWxhdGlvbkNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8zZC9zaW11bGF0aW9uLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gR2xvYmFsIE1lc3N5IFN0dWZmXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgX19pZEN0ciA9IDFcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19pZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoJ19fX2lkJykpXG5cdCAgICB0aGlzLl9fX2lkID0gX19pZEN0cisrXG5cdHJldHVybiB0aGlzLl9fX2lkXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX190eXBlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fdHlwZScpKVxuXHQgICAgdGhpcy5fX190eXBlID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLnJlcGxhY2UoL19fL2csICcuJylcblx0cmV0dXJuIHRoaXMuX19fdHlwZVxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fc2hvcnRUeXBlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdHZhciByZXMgPSB0aGlzLl9fdHlwZVxuXHRyZXR1cm4gcmVzLnN1YnN0cmluZyhyZXMubGFzdEluZGV4T2YoJy4nKSArIDEpXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX190b1N0cmluZycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fX3Nob3J0VHlwZSArICdAJyArIHRoaXMuX19pZFxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fY29udGFpbmVyJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fY29udGFpbmVyJykpXG5cdCAgICB0aGlzLl9fX2NvbnRhaW5lciA9IHJjXG5cdHJldHVybiB0aGlzLl9fX2NvbnRhaW5lclxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fc2NyYXRjaCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoJ19fX3NjcmF0Y2gnKSlcblx0ICAgIHRoaXMuX19fc2NyYXRjaCA9IHt9XG5cdHJldHVybiB0aGlzLl9fX3NjcmF0Y2hcbiAgICB9XG59KVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFB1YmxpY1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gU2tldGNocGFkKCkge1xuICAgIHRoaXMucmhvID0gMC4yNVxuICAgIHRoaXMuZXBzaWxvbiA9IDAuMDFcbiAgICB0aGlzLmRlYnVnID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvciA9IGZhbHNlXG4gICAgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMgPSBmYWxzZVxuICAgIHRoaXMuY29uc3RyYWludHMgPSBbXVxuICAgIHRoaXMudGhpbmdDb25zdHJ1Y3RvcnMgPSB7fVxuICAgIHRoaXMuY29uc3RyYWludENvbnN0cnVjdG9ycyA9IHt9XG4gICAgdGhpcy5vYmpNYXAgPSB7fVxuICAgIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMgPSB7fVxuICAgIHRoaXMuZXZlbnRIYW5kbGVycyA9IFtdXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWwgPSB7fVxuICAgIHRoaXMuZXZlbnREZXNjcmlwdGlvbnMgPSB7fVxuICAgIHRoaXMub25FYWNoVGltZVN0ZXBIYW5kbGVyRGVzY3JpcHRpb25zID0ge31cbiAgICB0aGlzLmV2ZW50cyA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoT25FYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoQWZ0ZXJFYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gICAgdGhpcy5wc2V1ZG9UaW1lID0gMFxuICAgIHRoaXMucHJldlBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5zY3JhdGNoID0ge31cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uKGFDbGFzcywgaXNDb25zdHJhaW50KSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGFDbGFzcy5uYW1lLnJlcGxhY2UoL19fL2csICcuJylcbiAgICB2YXIgbGlzdCA9IGlzQ29uc3RyYWludCA/IHRoaXMuY29uc3RyYWludENvbnN0cnVjdG9ycyA6IHRoaXMudGhpbmdDb25zdHJ1Y3RvcnMgICAgXG4gICAgbGlzdFtjbGFzc05hbWVdID0gYUNsYXNzXG4gICAgYUNsYXNzLnByb3RvdHlwZS5fX2lzU2tldGNocGFkVGhpbmcgPSB0cnVlXG4gICAgYUNsYXNzLnByb3RvdHlwZS5fX2lzQ29uc3RyYWludCA9IGlzQ29uc3RyYWludFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLm1hcmtPYmplY3RXaXRoSWRJZk5ldyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBpZCA9IG9iai5fX2lkXG4gICAgaWYgKHRoaXMub2JqTWFwW2lkXSlcblx0cmV0dXJuIHRydWVcbiAgICB0aGlzLm9iak1hcFtpZF0gPSBvYmpcbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5nZXRPYmplY3QgPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiB0aGlzLm9iak1hcFtpZF1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hZGRDb25zdHJhaW50ID0gZnVuY3Rpb24oY29uc3RyYWludCkge1xuICAgIGlmICghY29uc3RyYWludC5fX3ByaW9yaXR5KVxuXHRjb25zdHJhaW50Ll9fcHJpb3JpdHkgPSAwXG4gICAgLy90aGlzLmNvbnN0cmFpbnRzLnB1c2goY29uc3RyYWludClcbiAgICB2YXIgcHJpbyA9IGNvbnN0cmFpbnQuX19wcmlvcml0eVxuICAgIHZhciBhZGRJZHggPSAwXG4gICAgd2hpbGUgKGFkZElkeCA8IHRoaXMuY29uc3RyYWludHMubGVuZ3RoICYmIHRoaXMuY29uc3RyYWludHNbYWRkSWR4XS5fX3ByaW9yaXR5IDwgcHJpbylcblx0YWRkSWR4KytcbiAgICBpZiAodGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMpIHtcblx0dGhpcy5hZGRUb1BlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnNGb3JDb25zdHJhaW50KGNvbnN0cmFpbnQsIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMpXG5cdHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lRm9yQ29uc3RyYWludChjb25zdHJhaW50KVxuICAgIH1cbiAgICB0aGlzLmNvbnN0cmFpbnRzLnNwbGljZShhZGRJZHgsIDAsIGNvbnN0cmFpbnQpXG4gICAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG5cdGlmIChjb25zdHJhaW50Lmhhc093blByb3BlcnR5KHApKSB7XG5cdCAgICB2YXIgb2JqID0gY29uc3RyYWludFtwXVxuXHQgICAgaWYgKG9iaiAhPT0gdW5kZWZpbmVkICYmICF0aGlzLm9iak1hcFtvYmouX19pZF0pXG5cdFx0dGhpcy5vYmpNYXBbb2JqLl9faWRdID0gb2JqXG5cdH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnN0cmFpbnRcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yZW1vdmVDb25zdHJhaW50ID0gZnVuY3Rpb24odW53YW50ZWRDb25zdHJhaW50KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdGhpcy5jb25zdHJhaW50cyA9IHRoaXMuY29uc3RyYWludHMuZmlsdGVyKGZ1bmN0aW9uKGNvbnN0cmFpbnQpIHtcblx0cmV0dXJuIGNvbnN0cmFpbnQgIT09IHVud2FudGVkQ29uc3RyYWludCAmJlxuICAgICAgICAgICAgIShpbnZvbHZlcyhjb25zdHJhaW50LCB1bndhbnRlZENvbnN0cmFpbnQpKVxuICAgIH0pXG4gICAgaWYgKHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yT25Qcmlvcml0eURpZmZlcmVuY2VzKVxuXHR0aGlzLmNvbXB1dGVQZXJUaGluZ1BlclByb3BlcnR5RWZmZWN0b3JzKClcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmhvID0gMC4yNVxuICAgIHRoaXMuZXBzaWxvbiA9IDAuMDFcbiAgICB0aGlzLnNlYXJjaE9uID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvciA9IGZhbHNlXG4gICAgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMgPSBmYWxzZVxuICAgIHRoaXMuY29uc3RyYWludHMgPSBbXVxuICAgIHRoaXMub2JqTWFwID0ge31cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSBbXVxuICAgIHRoaXMuZXZlbnRzID0gW11cbiAgICB0aGlzLnRoaW5nc1dpdGhPbkVhY2hUaW1lU3RlcEZuID0gW11cbiAgICB0aGlzLnRoaW5nc1dpdGhBZnRlckVhY2hUaW1lU3RlcEZuID0gW11cbiAgICB0aGlzLnBlclRoaW5nUGVyUHJvcEVmZmVjdGluZ0NvbnN0cmFpbnRzID0ge31cbiAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICB0aGlzLnBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5wcmV2UHNldWRvVGltZSA9IDBcbiAgICB0aGlzLnNjcmF0Y2ggPSB7fVxuICAgIC8vIHJlbW92ZSBleGlzdGluZyBldmVudCBoYW5kbGVyc1xuICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWwpXG5cdHRoaXMuZXZlbnRIYW5kbGVyc0ludGVybmFsW25hbWVdLmZvckVhY2goZnVuY3Rpb24oaGFuZGxlcikgeyBkb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgaGFuZGxlcikgfSlcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbCA9IHt9XG4gICAgdGhpcy5ldmVudERlc2NyaXB0aW9ucyA9IHt9XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcEhhbmRsZXJEZXNjcmlwdGlvbnMgPSB7fVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVDdXJyZW50RXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHNldWRvVGltZSA9IHRoaXMucHNldWRvVGltZVxuICAgIHZhciBwcmV2UHNldWRvVGltZSA9IHRoaXMucHJldlBzZXVkb1RpbWUgXG4gICAgdmFyIHRvdGFsRXJyb3IgPSAwXG4gICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgdGhpcy5jb25zdHJhaW50cy5sZW5ndGg7IGlkeCsrKSB7XG5cdHZhciBjID0gdGhpcy5jb25zdHJhaW50c1tpZHhdXG5cdHZhciBlciA9IE1hdGguYWJzKGMuY29tcHV0ZUVycm9yKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSlcdFxuXHR0b3RhbEVycm9yICs9IGVyXG4gICAgfVxuICAgIHJldHVybiB0b3RhbEVycm9yXG59XG4gICAgXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbGxlY3RQZXJDb25zdHJhaW50U29sdXRpb25zID0gZnVuY3Rpb24odGltZU1pbGxpcywgaW5GaXhQb2ludFByb2Nlc3MpIHtcbiAgICB2YXIgcHNldWRvVGltZSA9IHRoaXMucHNldWRvVGltZVxuICAgIHZhciBwcmV2UHNldWRvVGltZSA9IHRoaXMucHJldlBzZXVkb1RpbWUgXG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIGFsbFNvbHV0aW9ucyA9IFtdXG4gICAgdmFyIGRpZFNvbWV0aGluZyA9IGZhbHNlLCBsb2NhbERpZFNvbWV0aGluZyA9IGZhbHNlLCB0b3RhbEVycm9yID0gMFxuICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IHRoaXMuY29uc3RyYWludHMubGVuZ3RoOyBpZHgrKykge1xuXHR2YXIgYyA9IHRoaXMuY29uc3RyYWludHNbaWR4XVxuXHR2YXIgc2VhcmNoYWJsZSA9IGMuX19zZWFyY2hhYmxlXG5cdGlmIChpbkZpeFBvaW50UHJvY2VzcyAmJiBzZWFyY2hhYmxlKVxuXHQgICAgY29udGludWVcblx0dmFyIGVyID0gTWF0aC5hYnMoYy5jb21wdXRlRXJyb3IocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpKVx0XG5cdHRvdGFsRXJyb3IgKz0gZXJcblx0aWYgKGVyID4gc2VsZi5lcHNpbG9uXG5cdCAgICB8fCB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvciB8fCAodGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMgJiYgdGhpcy5jb25zdHJhaW50SXNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmUoYykpXG5cdCAgICkge1xuXHQgICAgdmFyIHNvbHV0aW9ucyA9IGMuc29sdmUocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpXG5cdCAgICAvKlxuXHQgICAgaWYgKHNvbHV0aW9ucyBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0aWYgKGluRml4UG9pbnRQcm9jZXNzKSB7XG5cdFx0ICAgIHZhciBjb3VudCA9IHNvbHV0aW9ucy5sZW5ndGhcblx0XHQgICAgdmFyIGNob2ljZSA9ICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjb3VudClcblx0XHQgICAgc29sdXRpb25zID0gc29sdXRpb25zW2Nob2ljZV1cblx0XHR9XG5cdCAgICB9IGVsc2UgaWYgKCFpbkZpeFBvaW50UHJvY2Vzcykge1xuXHRcdHNvbHV0aW9ucyA9IFtzb2x1dGlvbnNdXG5cdCAgICB9XG5cdCAgICAqL1xuXHQgICAgaWYgKCEoaW5GaXhQb2ludFByb2Nlc3MgfHwgc2VhcmNoYWJsZSkpXG5cdFx0c29sdXRpb25zID0gW3NvbHV0aW9uc11cblx0ICAgIGxvY2FsRGlkU29tZXRoaW5nID0gdHJ1ZVxuXHQgICAgYWxsU29sdXRpb25zLnB1c2goe2NvbnN0cmFpbnQ6IGMsIHNvbHV0aW9uczogc29sdXRpb25zfSlcblx0fVxuICAgIH1cbiAgICBpZiAobG9jYWxEaWRTb21ldGhpbmcpIHtcblx0ZGlkU29tZXRoaW5nID0gdHJ1ZVxuICAgIH0gZWxzZVxuXHR0b3RhbEVycm9yID0gMFxuICAgIHJldHVybiB7ZGlkU29tZXRoaW5nOiBkaWRTb21ldGhpbmcsIGVycm9yOiB0b3RhbEVycm9yLCBzb2x1dGlvbnM6IGFsbFNvbHV0aW9uc31cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb2xsZWN0UGVyUHJvcGVydHlTb2x1dGlvbnMgPSBmdW5jdGlvbihhbGxTb2x1dGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB2YXIgY29sbGVjdGVkU29sdXRpb25zID0ge30sIHNlZW5Qcmlvcml0aWVzID0ge31cbiAgICBhbGxTb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbihkKSB7XG5cdGNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9uc0FkZFNvbHV0aW9uKHNlbGYsIGQsIGNvbGxlY3RlZFNvbHV0aW9ucywgc2VlblByaW9yaXRpZXMpXG4gICAgfSlcbiAgICByZXR1cm4gY29sbGVjdGVkU29sdXRpb25zXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZG9PbmVJdGVyYXRpb24gPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgaWYgKHRoaXMuYmVmb3JlRWFjaEl0ZXJhdGlvbilcblx0KHRoaXMuYmVmb3JlRWFjaEl0ZXJhdGlvbikoKVxuICAgIHZhciByZXMgPSB0aGlzLmNvbGxlY3RQZXJDb25zdHJhaW50U29sdXRpb25zKHRpbWVNaWxsaXMsIHRydWUpXG4gICAgdmFyIGRpZFNvbWV0aGluZyA9IHJlcy5kaWRTb21ldGhpbmdcbiAgICB2YXIgdG90YWxFcnJvciA9IHJlcy5lcnJvclxuICAgIGlmIChkaWRTb21ldGhpbmcpIHtcblx0dmFyIGFsbFNvbHV0aW9ucyA9IHJlcy5zb2x1dGlvbnNcblx0dmFyIGNvbGxlY3RlZFNvbHV0aW9ucyA9IHRoaXMuY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zKGFsbFNvbHV0aW9ucylcblx0YXBwbHlTb2x1dGlvbnModGhpcywgY29sbGVjdGVkU29sdXRpb25zKVxuICAgIH1cbiAgICByZXR1cm4gdG90YWxFcnJvclxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVQZXJUaGluZ1BlclByb3BlcnR5RWZmZWN0b3JzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlcyA9IHt9XG4gICAgdGhpcy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtcblx0dGhpcy5hZGRUb1BlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnNGb3JDb25zdHJhaW50KGMsIHJlcylcbiAgICB9LmJpbmQodGhpcykpXG4gICAgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cyA9IHJlcyAgXG4gICAgdGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmUoKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFkZFRvUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9yc0ZvckNvbnN0cmFpbnQgPSBmdW5jdGlvbihjLCByZXMpIHtcbiAgICBpZiAoYy5lZmZlY3RzKSB7XG5cdGMuZWZmZWN0cygpLmZvckVhY2goZnVuY3Rpb24oZSkgeyBcblx0ICAgIHZhciBpZCA9IGUub2JqLl9faWRcblx0ICAgIHZhciBlUHJvcHMgPSBlLnByb3BzXG5cdCAgICB2YXIgcHJvcHMsIGNzXG5cdCAgICBpZiAocmVzW2lkXSlcblx0XHRwcm9wcyA9IHJlc1tpZF1cblx0ICAgIGVsc2Uge1xuXHRcdHByb3BzID0ge31cblx0XHRyZXNbaWRdID0gcHJvcHNcblx0ICAgIH1cblx0ICAgIGVQcm9wcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcblx0XHRpZiAocHJvcHNbcHJvcF0pXG5cdFx0ICAgIGNzID0gcHJvcHNbcHJvcF1cblx0XHRlbHNlIHtcblx0XHQgICAgY3MgPSBbXVxuXHRcdCAgICBwcm9wc1twcm9wXSA9IGNzXG5cdFx0fVxuXHRcdGNzLnB1c2goYylcdFx0XG5cdCAgICB9KVxuXHR9KVx0ICAgIFxuICAgIH1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb25zdHJhaW50SXNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmUgPSBmdW5jdGlvbihjb25zdHJhaW50KSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lW2NvbnN0cmFpbnQuX19pZF0gIT09IHVuZGVmaW5lZFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZUZvckNvbnN0cmFpbnQgPSBmdW5jdGlvbihjb25zdHJhaW50KSB7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cykge1xuXHR2YXIgdGhpbmdFZmZzID0gdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50c1tpZF1cblx0Zm9yICh2YXIgcCBpbiB0aGluZ0VmZnMpIHtcblx0ICAgIHZhciBjcyA9IHRoaW5nRWZmc1twXVxuXHQgICAgaWYgKGNzLmluZGV4T2YoY29uc3RyYWludCkgPj0gMCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY3MubGVuZ3RoOyBpKyspIHtcblx0XHQgICAgdmFyIGMgPSBjc1tpXVxuXHRcdCAgICBpZiAoYyAhPT0gY29uc3RyYWludCAmJiBjLl9fcHJpb3JpdHkgPCBjb25zdHJhaW50Ll9fcHJpb3JpdHkpIHtcblx0XHRcdHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lW2NvbnN0cmFpbnQuX19pZF0gPSB0cnVlXG5cdFx0XHRyZXR1cm5cblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fVxuICAgIH1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmUgPSBmdW5jdGlvbigpIHsgICAgXG4gICAgdGhpcy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uKGNvbnN0cmFpbnQpIHsgICAgXG5cdHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lRm9yQ29uc3RyYWludChjb25zdHJhaW50KVxuICAgIH0uYmluZCh0aGlzKSlcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jdXJyZW50VGltZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydFRpbWVcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kb1Rhc2tzT25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuICAgIHRoaXMuaGFuZGxlRXZlbnRzKClcbiAgICB0aGlzLmRvT25FYWNoVGltZVN0ZXBGbnMocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpXG4gICAgaWYgKHRoaXMub25FYWNoVGltZVN0ZXApIFxuXHQodGhpcy5vbkVhY2hUaW1lU3RlcCkocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZG9UYXNrc0FmdGVyRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcbiAgICB0aGlzLmRvQWZ0ZXJFYWNoVGltZVN0ZXBGbnMocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpXG4gICAgaWYgKHRoaXMuYWZ0ZXJFYWNoVGltZVN0ZXApIFxuXHQodGhpcy5hZnRlckVhY2hUaW1lU3RlcCkocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpXG4gICAgdGhpcy5tYXliZVN0ZXBQc2V1ZG9UaW1lKClcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlTmV4dFBzZXVkb1RpbWVGcm9tUHJvcG9zYWxzID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJvcG9zYWxzKSB7XG4gICAgdmFyIHJlcyA9IHByb3Bvc2Fsc1swXS50aW1lXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBwcm9wb3NhbHMubGVuZ3RoOyBpKyspIHtcblx0dGltZSA9IHByb3Bvc2Fsc1tpXS50aW1lXG5cdGlmICh0aW1lIDwgcmVzKVxuXHQgICAgcmVzID0gdGltZVxuICAgIH1cbiAgICByZXR1cm4gcmVzXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUubWF5YmVTdGVwUHNldWRvVGltZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvID0ge31cbiAgICB2YXIgcHNldWRvVGltZSA9IHRoaXMucHNldWRvVGltZVxuICAgIHRoaXMucHJldlBzZXVkb1RpbWUgPSBwc2V1ZG9UaW1lXG4gICAgdmFyIHByb3Bvc2FscyA9IFtdXG4gICAgdGhpcy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYodC5wcm9wb3NlTmV4dFBzZXVkb1RpbWUpXG4gICAgICAgICAgICBwcm9wb3NhbHMucHVzaCh7cHJvcG9zZXI6IHQsIHRpbWU6IHQucHJvcG9zZU5leHRQc2V1ZG9UaW1lKHBzZXVkb1RpbWUpfSlcbiAgICB9KVxuICAgIGlmIChwcm9wb3NhbHMubGVuZ3RoID4gMClcblx0dGhpcy5wc2V1ZG9UaW1lID0gdGhpcy5jb21wdXRlTmV4dFBzZXVkb1RpbWVGcm9tUHJvcG9zYWxzKHBzZXVkb1RpbWUsIHByb3Bvc2FscylcdFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLml0ZXJhdGVTZWFyY2hDaG9pY2VzRm9yVXBUb01pbGxpcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgZXBzaWxvbiA9IHRoaXMuZXBzaWxvblxuICAgIHZhciBzb2xzID0gdGhpcy5jb2xsZWN0UGVyQ29uc3RyYWludFNvbHV0aW9ucyh0aW1lTWlsbGlzLCBmYWxzZSlcbiAgICB2YXIgZGlkU29tZXRoaW5nID0gc29scy5kaWRTb21ldGhpbmdcbiAgICB2YXIgdG90YWxFcnJvciA9IHNvbHMuZXJyb3JcbiAgICB2YXIgcmVzID0ge2Vycm9yOiB0b3RhbEVycm9yLCBjb3VudDogMH0gLy9GSVhNRVxuICAgIGlmIChkaWRTb21ldGhpbmcpIHtcblx0dmFyIGFsbFNvbHV0aW9uQ2hvaWNlcyA9IHNvbHMuc29sdXRpb25zXG5cdC8vZmluZCBhbGwgc29sdXRpb24gY29tYmluYXRpb25zIGJldHdlZW4gY29uc3RyYWludHNcblx0Ly9sb2coYWxsU29sdXRpb25DaG9pY2VzKVxuXHR2YXIgY2hvaWNlc0NzID0gYWxsU29sdXRpb25DaG9pY2VzLm1hcChmdW5jdGlvbihjKSB7IHJldHVybiBjLmNvbnN0cmFpbnQgfSlcblx0dmFyIGNDb3VudCA9IGNob2ljZXNDcy5sZW5ndGhcblx0dmFyIGNob2ljZXNTcyA9IGFsbFNvbHV0aW9uQ2hvaWNlcy5tYXAoZnVuY3Rpb24oYykgeyByZXR1cm4gYy5zb2x1dGlvbnMgfSlcblx0dmFyIGFsbFNvbHV0aW9uQ29tYm9zID0gYWxsQ29tYmluYXRpb25zT2ZBcnJheUVsZW1lbnRzKGNob2ljZXNTcykubWFwKGZ1bmN0aW9uKGNvbWJvKSB7XHQgICAgXG5cdCAgICB2YXIgY3VyciA9IFtdXG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNDb3VudDsgaSsrKSB7XG5cdFx0Y3Vyci5wdXNoKHtjb25zdHJhaW50OiBjaG9pY2VzQ3NbaV0sIHNvbHV0aW9uczogY29tYm9baV19KVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGN1cnJcblx0fSlcblx0Ly9sb2coYWxsU29sdXRpb25Db21ib3MpXG5cdC8vIGNvcHkgY3VyciBzdGF0ZSBhbmQgdHJ5IG9uZSwgaWYgd29ya3MgcmV0dXJuIGVsc2UgcmV2ZXJ0IHN0YXRlIG1vdmUgdG8gbmV4dCB1bnRpbCBub25lIGxlZnRcblx0dmFyIGNvdW50ID0gYWxsU29sdXRpb25Db21ib3MubGVuZ3RoXG5cdHZhciBjaG9pY2VUTyA9IHRpbWVNaWxsaXMgLyBjb3VudFxuXHRpZiAodGhpcy5kZWJ1ZykgbG9nKCdwb3NzaWJsZSBjaG9pY2VzJywgY291bnQsICdwZXIgY2hvaWNlIHRpbWVvdXQnLCBjaG9pY2VUTylcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG5cdCAgICB2YXIgY29waWVkLCBsYXN0ID0gaSA9PSBjb3VudCAtIDFcblx0ICAgIGlmICh0aGlzLmRlYnVnKSBsb2coJ3RyeWluZyBjaG9pY2U6ICcgKyBpKVxuXHQgICAgdmFyIGFsbFNvbHV0aW9ucyA9IGFsbFNvbHV0aW9uQ29tYm9zW2ldXG5cdCAgICAvL2xvZyhhbGxTb2x1dGlvbnMpXG5cdCAgICB2YXIgY29sbGVjdGVkU29sdXRpb25zID0gdGhpcy5jb2xsZWN0UGVyUHJvcGVydHlTb2x1dGlvbnMoYWxsU29sdXRpb25zKVxuXHQgICAgLy9jb3B5IGhlcmUuLi5cdCAgICBcblx0ICAgIGlmICghbGFzdClcblx0XHRjb3BpZWQgPSB0aGlzLmdldEN1cnJlbnRQcm9wVmFsdWVzQWZmZWN0YWJsZUJ5U29sdXRpb25zKGNvbGxlY3RlZFNvbHV0aW9ucylcblx0ICAgIGFwcGx5U29sdXRpb25zKHRoaXMsIGNvbGxlY3RlZFNvbHV0aW9ucylcblx0ICAgIHJlcyA9IHRoaXMuaXRlcmF0ZUZvclVwVG9NaWxsaXMoY2hvaWNlVE8pXHQgICAgXG5cdCAgICB2YXIgY2hvaWNlRXJyID0gdGhpcy5jb21wdXRlQ3VycmVudEVycm9yKClcblx0ICAgIC8vbG9nKGNob2ljZUVycilcblx0ICAgIGlmIChjaG9pY2VFcnIgPCBlcHNpbG9uIHx8IGxhc3QpXG5cdFx0YnJlYWtcblx0ICAgIC8vcmV2ZXJ0IGhlcmVcblx0ICAgIHRoaXMucmV2ZXJ0UHJvcFZhbHVlc0Jhc2VkT25BcmcoY29waWVkKVxuXHR9XG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5nZXRDdXJyZW50UHJvcFZhbHVlc0FmZmVjdGFibGVCeVNvbHV0aW9ucyA9IGZ1bmN0aW9uKHNvbHV0aW9ucykge1xuICAgIHZhciByZXMgPSB7fVxuICAgIGZvciAodmFyIG9iaklkIGluIHNvbHV0aW9ucykge1xuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBwcm9wc04gPSB7fVxuXHRyZXNbb2JqSWRdID0gcHJvcHNOXG5cdHZhciBwcm9wcyA9IHNvbHV0aW9uc1tvYmpJZF1cblx0Zm9yICh2YXIgcCBpbiBwcm9wcykge1xuXHQgICAgcHJvcHNOW3BdID0gY3Vyck9ialtwXVxuXHR9XG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yZXZlcnRQcm9wVmFsdWVzQmFzZWRPbkFyZyA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIGZvciAodmFyIG9iaklkIGluIHZhbHVlcykge1xuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBwcm9wcyA9IHZhbHVlc1tvYmpJZF1cblx0Zm9yICh2YXIgcCBpbiBwcm9wcykge1xuXHQgICAgY3Vyck9ialtwXSA9IHByb3BzW3BdXG5cdH1cbiAgICB9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuc29sdmVGb3JVcFRvTWlsbGlzID0gZnVuY3Rpb24odE1pbGxpcykge1xuICAgIHRoaXMuZG9UYXNrc09uRWFjaFRpbWVTdGVwKHRoaXMucHNldWRvVGltZSwgdGhpcy5wcmV2UHNldWRvVGltZSlcbiAgICB2YXIgcmVzXG4gICAgaWYgKHRoaXMuc2VhcmNoT24pXHRcblx0cmVzID0gdGhpcy5pdGVyYXRlU2VhcmNoQ2hvaWNlc0ZvclVwVG9NaWxsaXModE1pbGxpcylcbiAgICBlbHNlXG5cdHJlcyA9IHRoaXMuaXRlcmF0ZUZvclVwVG9NaWxsaXModE1pbGxpcylcbiAgICB0aGlzLmRvVGFza3NBZnRlckVhY2hUaW1lU3RlcCh0aGlzLnBzZXVkb1RpbWUsIHRoaXMucHJldlBzZXVkb1RpbWUpXG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLml0ZXJhdGVGb3JVcFRvTWlsbGlzID0gZnVuY3Rpb24odE1pbGxpcykge1xuICAgIHZhciBjb3VudCA9IDAsIHRvdGFsRXJyb3IgPSAwLCBlcHNpbG9uID0gdGhpcy5lcHNpbG9uXG4gICAgLy92YXIgZGlkU29tZXRoaW5nXG4gICAgdmFyIGN1cnJFcnJvciwgbGFzdEVycm9yXG4gICAgdmFyIHQwLCB0XG4gICAgdDAgPSB0aGlzLmN1cnJlbnRUaW1lKClcbiAgICBkbyB7XG5cdGxhc3RFcnJvciA9IGN1cnJFcnJvclxuXHQvKmRpZFNvbWV0aGluZyovIGN1cnJFcnJvciA9IHRoaXMuZG9PbmVJdGVyYXRpb24odDApXG5cdHQgPSAgdGhpcy5jdXJyZW50VGltZSgpIC0gdDBcblx0Ly9jb3VudCArPSBkaWRTb21ldGhpbmcgPyAxIDogMFxuXHRpZiAoY3VyckVycm9yID4gMCkge1xuXHQgICAgY291bnQrK1xuXHQgICAgdG90YWxFcnJvciArPSBjdXJyRXJyb3Jcblx0fVxuXHQvL2xvZyhjdXJyRXJyb3IsIGxhc3RFcnJvcilcbiAgICB9IHdoaWxlIChcblx0Y3VyckVycm9yID4gZXBzaWxvblxuXHQgICAgJiYgIShjdXJyRXJyb3IgPj0gbGFzdEVycm9yKVxuXHQvL2N1cnJFcnJvciA+IDAvL2RpZFNvbWV0aGluZyBcblx0ICAgICYmIHQgPCB0TWlsbGlzKVxuICAgIC8vbG9nKHtlcnJvcjogdG90YWxFcnJvciwgY291bnQ6IGNvdW50fSlcbiAgICByZXR1cm4ge2Vycm9yOiB0b3RhbEVycm9yLCBjb3VudDogY291bnR9XG59XG5cbi8vIHZhcmlvdXMgd2F5cyB3ZSBjYW4gam9pbiBzb2x1dGlvbnMgZnJvbSBhbGwgc29sdmVyc1xuLy8gZGFtcGVkIGF2ZXJhZ2Ugam9pbiBmbjpcblNrZXRjaHBhZC5wcm90b3R5cGUuc3VtSm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIC8vdmFyIHJlcyA9IGN1cnJcbiAgICB2YXIgcmhvID0gdGhpcy5yaG9cbiAgICB2YXIgc3VtID0gMFxuICAgIC8vc29sdXRpb25zLmZvckVhY2goZnVuY3Rpb24odikgeyByZXMgKz0gKHYgLSBjdXJyKSAqIHJobyB9KVxuICAgIHNvbHV0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHsgc3VtICs9IHYgfSlcbiAgICB2YXIgcmVzID0gY3VyciArIChyaG8gKiAoKHN1bSAvIHNvbHV0aW9ucy5sZW5ndGgpIC0gY3VycikpXG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmxhc3RPbmVXaW5zSm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHJldHVybiBzb2x1dGlvbnNbc29sdXRpb25zLmxlbmd0aCAtIDFdXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUucmFuZG9tQ2hvaWNlSm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHJldHVybiBzb2x1dGlvbnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc29sdXRpb25zLmxlbmd0aCldXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuYXJyYXlBZGRKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgc29sdXRpb25zLmZvckVhY2goZnVuY3Rpb24odikgeyBjdXJyLnB1c2godikgfSlcbiAgICByZXR1cm4gY3VyclxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRpY3Rpb25hcnlBZGRKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgc29sdXRpb25zLmZvckVhY2goZnVuY3Rpb24odikgeyBmb3IgKHZhciBrIGluIHYpIGN1cnJba10gPSB2W2tdIH0pXG4gICAgcmV0dXJuIGN1cnJcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kZWZhdWx0Sm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHJldHVybiAgdGhpcy5zdW1Kb2luU29sdXRpb25zKGN1cnIsIHNvbHV0aW9ucylcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yZWdpc3RlckV2ZW50ID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIG9wdERlc2NyaXB0aW9uKSB7XG4gICAgdmFyIGlkID0gdGhpcy5ldmVudEhhbmRsZXJzLmxlbmd0aFxuICAgIHRoaXMuZXZlbnRIYW5kbGVycy5wdXNoKGNhbGxiYWNrKVxuICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24oZSkgeyB0aGlzLmV2ZW50cy5wdXNoKFtpZCwgZV0pIH0uYmluZCh0aGlzKVxuICAgIGlmICghdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWxbbmFtZV0pIHtcblx0dGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWxbbmFtZV0gPSBbXVxuXHR0aGlzLmV2ZW50RGVzY3JpcHRpb25zW25hbWVdID0gW11cbiAgICB9XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWxbbmFtZV0ucHVzaChoYW5kbGVyKVxuICAgIHRoaXMuZXZlbnREZXNjcmlwdGlvbnNbbmFtZV0ucHVzaChvcHREZXNjcmlwdGlvbilcbiAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgaGFuZGxlcilcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5oYW5kbGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWVBbmRFKSB7IFxuXHR2YXIgaWQgPSBuYW1lQW5kRVswXTsgXG5cdHZhciBlID0gbmFtZUFuZEVbMV07IFxuXHR2YXIgaCA9IHRoaXMuZXZlbnRIYW5kbGVyc1tpZF1cblx0aWYgKGggIT09IHVuZGVmaW5lZClcblx0ICAgIGgoZSkgXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHRoaXMuZXZlbnRzID0gW11cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kb09uRWFjaFRpbWVTdGVwRm5zID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcbiAgICB0aGlzLnRoaW5nc1dpdGhPbkVhY2hUaW1lU3RlcEZuLmZvckVhY2goZnVuY3Rpb24odCkgeyB0Lm9uRWFjaFRpbWVTdGVwKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB9KVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvQWZ0ZXJFYWNoVGltZVN0ZXBGbnMgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuICAgIHRoaXMudGhpbmdzV2l0aEFmdGVyRWFjaFRpbWVTdGVwRm4uZm9yRWFjaChmdW5jdGlvbih0KSB7IHQuYWZ0ZXJFYWNoVGltZVN0ZXAocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIH0pXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuc2V0T25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihvbkVhY2hUaW1lRm4sIG9wdERlc2NyaXB0aW9uKSB7XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcCA9IG9uRWFjaFRpbWVGblxuICAgIGlmIChvcHREZXNjcmlwdGlvbilcblx0dGhpcy5vbkVhY2hUaW1lU3RlcEhhbmRsZXJEZXNjcmlwdGlvbnNbJ2dlbmVyYWwnXSA9IFtvcHREZXNjcmlwdGlvbl1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS51bnNldE9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcCA9IHVuZGVmaW5lZFxuICAgIGRlbGV0ZSh0aGlzLm9uRWFjaFRpbWVTdGVwSGFuZGxlckRlc2NyaXB0aW9uc1snZ2VuZXJhbCddKVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHJpdmF0ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmZ1bmN0aW9uIGNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9uc0FkZFNvbHV0aW9uKHNrZXRjaHBhZCwgc29sbiwgc29mYXIsIHNlZW5Qcmlvcml0aWVzKSB7XG4gICAgdmFyIGMgPSBzb2xuLmNvbnN0cmFpbnRcbiAgICB2YXIgcHJpb3JpdHkgPSBjLl9fcHJpb3JpdHlcbiAgICBmb3IgKHZhciBvYmogaW4gc29sbi5zb2x1dGlvbnMpIHtcblx0dmFyIGN1cnJPYmogPSBjW29ial1cblx0dmFyIGN1cnJPYmpJZCA9IGN1cnJPYmouX19pZFxuXHR2YXIgZCA9IHNvbG4uc29sdXRpb25zW29ial1cblx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhkKVxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBwcm9wID0ga2V5c1tpXVxuXHQgICAgdmFyIHBlclByb3BTb2xuID0gc29mYXJbY3Vyck9iaklkXVxuXHQgICAgdmFyIHBlclByb3BQcmlvID0gc2VlblByaW9yaXRpZXNbY3Vyck9iaklkXVxuXHQgICAgdmFyIHByb3BTb2xucywgcHJpb1xuXHQgICAgaWYgKHBlclByb3BTb2xuID09PSB1bmRlZmluZWQpIHtcblx0XHRwZXJQcm9wU29sbiA9IHt9XG5cdFx0cGVyUHJvcFByaW8gPSB7fVxuXHRcdHNvZmFyW2N1cnJPYmpJZF0gPSBwZXJQcm9wU29sblxuXHRcdHNlZW5Qcmlvcml0aWVzW2N1cnJPYmpJZF0gPSBwZXJQcm9wUHJpb1xuXHRcdHByb3BTb2xucyA9IFtdXG5cdFx0cGVyUHJvcFNvbG5bcHJvcF0gPSBwcm9wU29sbnNcblx0XHRwZXJQcm9wUHJpb1twcm9wXSA9IHByaW9yaXR5XG5cdCAgICB9IGVsc2Uge1x0XHQgICAgXG5cdFx0cHJvcFNvbG5zID0gcGVyUHJvcFNvbG5bcHJvcF1cblx0XHRpZiAocHJvcFNvbG5zID09PSB1bmRlZmluZWQpIHtcblx0XHQgICAgcHJvcFNvbG5zID0gW11cblx0XHQgICAgcGVyUHJvcFNvbG5bcHJvcF0gPSBwcm9wU29sbnNcblx0XHQgICAgcGVyUHJvcFByaW9bcHJvcF0gPSBwcmlvcml0eVxuXHRcdH1cblx0ICAgIH1cblx0ICAgIHZhciBsYXN0UHJpbyA9IHBlclByb3BQcmlvW3Byb3BdXG5cdCAgICBpZiAocHJpb3JpdHkgPiBsYXN0UHJpbykge1xuXHRcdHBlclByb3BQcmlvW3Byb3BdID0gcHJpb3JpdHlcblx0XHR3aGlsZSAocHJvcFNvbG5zLmxlbmd0aCA+IDApIHByb3BTb2xucy5wb3AoKVxuXHQgICAgfSBlbHNlIGlmIChwcmlvcml0eSA8IGxhc3RQcmlvKSB7XG5cdFx0YnJlYWtcblx0ICAgIH0gXG5cdCAgICBwcm9wU29sbnMucHVzaChkW3Byb3BdKVxuXHR9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhcHBseVNvbHV0aW9ucyhza2V0Y2hwYWQsIHNvbHV0aW9ucykgeyAgICBcbiAgICAvL2xvZzIoc29sdXRpb25zKVxuICAgIHZhciBrZXlzMSA9IE9iamVjdC5rZXlzKHNvbHV0aW9ucylcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMxLmxlbmd0aDsgaSsrKSB7XG5cdHZhciBvYmpJZCA9IGtleXMxW2ldXG5cdHZhciBwZXJQcm9wID0gc29sdXRpb25zW29iaklkXVxuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBrZXlzMiA9IE9iamVjdC5rZXlzKHBlclByb3ApXG5cdGZvciAodmFyIGogPSAwOyBqIDwga2V5czIubGVuZ3RoOyBqKyspIHtcblx0ICAgIHZhciBwcm9wID0ga2V5czJbal1cblx0ICAgIHZhciBwcm9wU29sbnMgPSBwZXJQcm9wW3Byb3BdXG5cdCAgICB2YXIgY3VyclZhbCA9IGN1cnJPYmpbcHJvcF1cblx0ICAgIHZhciBqb2luRm4gPSAoY3Vyck9iai5zb2x1dGlvbkpvaW5zICE9PSB1bmRlZmluZWQgJiYgKGN1cnJPYmouc29sdXRpb25Kb2lucygpKVtwcm9wXSAhPT0gdW5kZWZpbmVkKSA/XG5cdFx0KGN1cnJPYmouc29sdXRpb25Kb2lucygpKVtwcm9wXSA6IHNrZXRjaHBhZC5zdW1Kb2luU29sdXRpb25zXG5cdCAgICBjdXJyT2JqW3Byb3BdID0gKGpvaW5Gbi5iaW5kKHNrZXRjaHBhZCkpKGN1cnJWYWwsIHByb3BTb2xucylcblx0fVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaW52b2x2ZXMoY29uc3RyYWludCwgb2JqKSB7XG4gICAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG5cdGlmIChjb25zdHJhaW50W3BdID09PSBvYmopIHtcblx0ICAgIHJldHVybiB0cnVlXG5cdH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGFsbENvbWJpbmF0aW9uc09mQXJyYXlFbGVtZW50cyhhcnJheU9mQXJyYXlzKSB7XG4gICAgaWYgKGFycmF5T2ZBcnJheXMubGVuZ3RoID4gMSkge1xuXHR2YXIgZmlyc3QgPSBhcnJheU9mQXJyYXlzWzBdXG5cdHZhciByZXN0ID0gYWxsQ29tYmluYXRpb25zT2ZBcnJheUVsZW1lbnRzKGFycmF5T2ZBcnJheXMuc2xpY2UoMSkpXG5cdHZhciByZXMgPSBbXVxuXHRmb3IgKHZhciBqID0gMDsgaiA8IHJlc3QubGVuZ3RoIDsgaisrKSB7XG5cdCAgICB2YXIgciA9IHJlc3Rbal1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlyc3QubGVuZ3RoOyBpKyspIHtcblx0XHRyZXMucHVzaChbZmlyc3RbaV1dLmNvbmNhdChyKSlcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gcmVzXG4gICAgfSAgZWxzZSBpZiAoYXJyYXlPZkFycmF5cy5sZW5ndGggPT0gMSkge1xuXHRyZXR1cm4gYXJyYXlPZkFycmF5c1swXS5tYXAoZnVuY3Rpb24oZSkgeyByZXR1cm4gW2VdIH0pXG4gICAgfSBlbHNlXG5cdHJldHVybiBbXVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQm9vdHN0cmFwICYgSW5zdGFsbCBjb25zdHJhaW50IGxpYnJhcmllc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNrZXRjaHBhZCA9IG5ldyBTa2V0Y2hwYWQoKVxuaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoU2tldGNocGFkKVxuaW5zdGFsbFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsM0RHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsM0RTaW11bGF0aW9uQ29uc3RyYWludHMoU2tldGNocGFkKVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXhwb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSBTa2V0Y2hwYWRcblxuIl19
