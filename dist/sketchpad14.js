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

    Sketchpad.geom.LengthConstraint = function Sketchpad__geom__LengthConstraint(p1, p2, l) {
	this.p1 = p1
	this.p2 = p2
	this.l = l
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
	var delta = (l12 - this.l) / 2
	var e12 = scaledBy(Sketchpad.geom.normalized(minus(p2, p1)), delta)
	return {p1: plus(this.p1, e12), p2: plus(this.p2, scaledBy(e12, -1))}
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

    Sketchpad.simulation = { g: 9.8 }

    var minus = Sketchpad.geom.minus
    var plus = Sketchpad.geom.plus
    var scaledBy = Sketchpad.geom.scaledBy
    var magnitude = Sketchpad.geom.magnitude
    var distance = Sketchpad.geom.distance

    // Classes
    
    Sketchpad.simulation.Spring = function Sketchpad__simulation__Spring(line, k, length, tearPointAmount) {
	this.line = line
	this.k = k
	this.length = length    
	this.tearPointAmount = tearPointAmount
	this.torn = false
    }

    sketchpad.addClass(Sketchpad.simulation.Spring)

    Sketchpad.simulation.Spring.prototype.propertyTypes = {line: 'Line', k: 'Number', length: 'Number', teatPointAmount: 'Number'}

    Sketchpad.simulation.Spring.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	var d = distance(l.p1, l.p2)
	return new Sketchpad.simulation.Spring(l, 10, d,  d * 5)
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
	var slope = this.slope(p1, p2)
	return {x: Math.sin(Math.atan(slope)), y: Math.cos(Math.atan(slope))}
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

    Sketchpad.simulation.VelocityConstraint = function Sketchpad__simulation__VelocityConstraint(position, velocity) {
	this.position = position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation.VelocityConstraint, true)

    Sketchpad.simulation.VelocityConstraint.prototype.description = function() { return  "Sketchpad.simulation.VelocityConstraint(Point Pos, Vector Velocity) states Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.VelocityConstraint.prototype.propertyTypes = {position: 'Point', velocity: 'Vector'}

    Sketchpad.simulation.VelocityConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.VelocityConstraint(Point.dummy(x, y), Sketchpad.geom.Vector.dummy(x + 50, y + 50))
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
	var p = plus(this.position, {x: -slopeV.x * len, y: slopeV.y * len})
	canvas.drawArrow(this.position, p, origin, 'v')
    }
    
    // Body With Velocity Constraint

    Sketchpad.simulation.VelocityConstraint2 = function Sketchpad__simulation__VelocityConstraint2(position, velocity) {
	this.position = position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation.VelocityConstraint2, true)

    Sketchpad.simulation.VelocityConstraint2.prototype.description = function() { return  "Sketchpad.simulation.VelocityConstraint2(Point Pos, PointVector Velocity) states Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.VelocityConstraint2.prototype.propertyTypes = {position: 'Point', velocity: 'Point'}

    Sketchpad.simulation.VelocityConstraint2.dummy = function(x, y) {
	return new Sketchpad.simulation.VelocityConstraint2(Point.dummy(x, y), Point.dummy(x + 50, y + 50))
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

    Sketchpad.simulation.AccelerationConstraint = function Sketchpad__simulation__AccelerationConstraint(velocity, acceleration) {
	this.velocity = velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation.AccelerationConstraint, true)

    Sketchpad.simulation.AccelerationConstraint.prototype.description = function() { return  "Sketchpad.simulation.AccelerationConstraint(Vector Velocity, Vector Acceleration) states Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.AccelerationConstraint.prototype.propertyTypes = {position: 'Point', velocity: 'Vector'}

    Sketchpad.simulation.AccelerationConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.AccelerationConstraint(Sketchpad.geom.Vector.dummy(x, y), Sketchpad.geom.Vector.dummy(x + 50, y + 50))
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

    Sketchpad.simulation.AirResistanceConstraint = function Sketchpad__simulation__AirResistanceConstraint(velocity, scale) {
	this.velocity = velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation.AirResistanceConstraint, true)

    Sketchpad.simulation.AirResistanceConstraint.prototype.description = function() { return  "Sketchpad.simulation.AirResistanceConstraint(Vector Velocity, Number Scale) states Velocity = old(Velocity) * Scale ." }

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

    Sketchpad.simulation.BounceConstraint = function Sketchpad__simulation__BounceConstraint(length, position, velocity, surfaceP1, surfaceP2) {
	this.halfLength = length / 2
	this.position = position
	this.velocity = velocity
	this.surfaceP1 = surfaceP1
	this.surfaceP2 = surfaceP2
    }

    sketchpad.addClass(Sketchpad.simulation.BounceConstraint, true)

    Sketchpad.simulation.BounceConstraint.prototype.description = function() { return  "Sketchpad.simulation.BounceConstraint(Number L, Point Pos, Vector Vel, Point End1, Point End2) states that the body with diameter L and position Pos and velocity vector Vel is going to bounce off the line with two end points End1 & End2." }

    Sketchpad.simulation.BounceConstraint.prototype.propertyTypes = {halfLength: 'Number', position: 'Point', velocity: 'Vector', surfaceP1: 'Point', surfaceP2: 'Point'}

    Sketchpad.simulation.BounceConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.BounceConstraint(10, Point.dummy(x, y), Sketchpad.geom.Vector.dummy(x, y), Point.dummy(x, y), Point.dummy(x, y))
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

    Sketchpad.simulation.HitSurfaceConstraint = function Sketchpad__simulation__HitSurfaceConstraint(length, position, velocity, surfaceP1, surfaceP2) {
	this.halfLength = length / 2
	this.position = position
	this.velocity = velocity
	this.surfaceP1 = surfaceP1
	this.surfaceP2 = surfaceP2
    }

    sketchpad.addClass(Sketchpad.simulation.HitSurfaceConstraint, true)

    Sketchpad.simulation.HitSurfaceConstraint.prototype.description = function() { return  "Sketchpad.simulation.HitSurfaceConstraint(Number L, Point Pos, Vector Vel, Point End1, Point End2) states that the body with diameter L and position Pos and velocity vector Vel is going to land and stay on the line with two end points End1 & End2." }

    Sketchpad.simulation.HitSurfaceConstraint.prototype.propertyTypes = {halfLength: 'Number', position: 'Point', velocity: 'Vector', surfaceP1: 'Point', surfaceP2: 'Point'}

    Sketchpad.simulation.HitSurfaceConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.HitSurfaceConstraint(10, Point.dummy(x, y), Sketchpad.geom.Vector.dummy(x, y), Point.dummy(x, y), Point.dummy(x, y))
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
	    deltaPosY = slopeV.y * -velocityMagnitude * dt
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

    Sketchpad.simulation.ConveyorBeltConstraint = function Sketchpad__simulation__ConveyorBeltConstraint(length, position, velocity, belt) {
	this.halfLength = length / 2
	this.position = position
	this.velocity = velocity
	this.belt = belt
    }

    sketchpad.addClass(Sketchpad.simulation.ConveyorBeltConstraint, true)

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.description = function() { return  "Sketchpad.simulation.ConveyorBeltConstraint(Number L, Point Pos, Vector Vel, ConveyorBelt Belt) states that the body with diameter L and position Pos and velocity vector Vel is going to land and move based on the conveyor belt Belt's velocity." }

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.propertyTypes = {halfLength: 'Number', position: 'Point', velocity: 'Vector', belt: 'Belt'}

    Sketchpad.simulation.ConveyorBeltConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.ConveyorBeltConstraint(10, Point.dummy(x, y), Sketchpad.geom.Vector.dummy(x, y), Belt.dummy(x, y))
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
	    this.targetVelocity = {x: velocity.x + (-slopeV.y * beltSpeed), y: velocity.y + (slopeV.x * beltSpeed)}
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

    Sketchpad.simulation.NoOverlapConstraint = function Sketchpad__simulation__NoOverlapConstraint(length1, position1, velocity1, length2, position2, velocity2) {
	this.length1 = length1
	this.position1 = position1
	this.velocity1 = velocity1
	this.length2 = length2
	this.position2 = position2
	this.velocity2 = velocity2
    }

    sketchpad.addClass(Sketchpad.simulation.NoOverlapConstraint, true)

    Sketchpad.simulation.NoOverlapConstraint.prototype.description = function() { return  "Sketchpad.simulation.NoOverlapConstraint(Number L1, Point Pos1, Vector Vel1, Number L2, Point Pos2, Vector Vel2) states that the body with diameter L1 and position Pos1 and velocity vector Vel1 and the body with diameter L2 and position Pos2 and velocity vector Vel2 will push each other if touching." }

    Sketchpad.simulation.NoOverlapConstraint.prototype.propertyTypes = {length1: 'Number', position1: 'Point', velocity1: 'Vector', length2: 'Number', position2: 'Point', velocity2: 'Vector'}

    Sketchpad.simulation.NoOverlapConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.NoOverlapConstraint(10, Point.dummy(x, y), Sketchpad.geom.Vector.dummy(x, y), 10, Point.dummy(x, y), Sketchpad.geom.Vector.dummy(x, y))
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

    Sketchpad.simulation.SpringConstraint = function Sketchpad__simulation__SpringConstraint(position1, velocity1, acceleration1, mass1, position2, velocity2, acceleration2, mass2, spring) {
	this.position1 = position1
	this.velocity1 = velocity1
	this.acceleration1 = acceleration1
	this.mass1 = mass1
	this.position2 = position2
	this.velocity2 = velocity2
	this.acceleration2 = acceleration2
	this.mass2 = mass2
	this.spring = spring
	this._lastVelocities = [undefined, undefined]
    }

    sketchpad.addClass(Sketchpad.simulation.SpringConstraint, true)

    Sketchpad.simulation.SpringConstraint.prototype.description = function() { return  "Sketchpad.simulation.SpringConstraint(Point Pos1, Vector Vel1, Vector Acc1, Number Mass1, Point Pos2, Vector Vel2, Vector Acc2, Number Mass2, Spring S) states that spring S has been attached to two bodies with positions, velocities, accelerations, and masses of respectively Pos1, Pos2, Vel1, Vel2, Acc1, Acc2, Mass1, Mass2. " }

    Sketchpad.simulation.SpringConstraint.prototype.propertyTypes = {position1: 'Point', velocity1: 'Vector', acceleration1: 'Vector', mass1: 'Number', position2: 'Point', velocity2: 'Vector', acceleration2: 'Vector', mass2: 'Number', spring: 'Spring'}

    Sketchpad.simulation.SpringConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.SpringConstraint(Point.dummy(x, y), Sketchpad.geom.Vector.dummy(x, y), Sketchpad.geom.Vector.dummy(x, y), 0, Point.dummy(x, y), Sketchpad.geom.Vector.dummy(x, y), Sketchpad.geom.Vector.dummy(x, y), 10, Sketchpad.simulation.Spring.dummy(x, y))
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
		var positionX1 = position1.x
		var positionY1 = position1.y
		var positionX2 = position2.x
		var positionY2 = position2.y
		var slope = Math.abs(Math.atan((positionY2 - positionY1) / (positionX2 - positionX1)))
		var springCurrLen = Math.sqrt(((positionX1 - positionX2) * (positionX1 - positionX2)) + ((positionY1 - positionY2) * (positionY1 - positionY2)))
		var stretchLen =  springCurrLen - spring.length
		var newAccelerationMag2 = spring.k * stretchLen / mass
		var directionX = positionX2 >= positionX1 ? -1 : 1
		var directionY = positionY2 >= positionY1 ? -1 : 1
		var acc = {x: newAccelerationMag2 * Math.cos(slope) * directionX, y: newAccelerationMag2 * Math.sin(slope) * directionY}
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
	    var d = {x: 0, y: 0}
	    if (mass > 0) { // if not anchored		
		var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var positionX1 = position1.x
		var positionY1 = position1.y
		var positionX2 = position2.x
		var positionY2 = position2.y
		var slope = Math.abs(Math.atan((positionY2 - positionY1) / (positionX2 - positionX1)))
		var springCurrLen = Math.sqrt(((positionX1 - positionX2) * (positionX1 - positionX2)) + ((positionY1 - positionY2) * (positionY1 - positionY2)))
		var stretchLen =  springCurrLen - spring.length
		// if not torn apart...
		if (stretchLen < spring.tearPointAmount) {
		    var newAccelerationMag2 = spring.k * stretchLen / mass
		    var directionX = positionX2 >= positionX1 ? -1 : 1
		    var directionY = positionY2 >= positionY1 ? -1 : 1
		    var acc = {x: newAccelerationMag2 * Math.cos(slope) * directionX, y: newAccelerationMag2 * Math.sin(slope) * directionY}
		    d = plus(this._lastVelocities[j], scaledBy(acc, dt))
		} else {
		    soln['spring'] = {torn: true}
		}
	    }
	    soln['velocity' + (j+1)] = d
	}	
	return soln
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
    }

    function setDelta(d, p, scale) {
	d.x = p.x * scale
	d.y = p.y * scale
	d.z = p.z * scale
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
    Sketchpad.geom3d.rotatedAround = rotatedAround
    Sketchpad.geom3d.setDelta = setDelta

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
    
    Sketchpad.geom3d.MotorConstraint.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	return new Sketchpad.geom3d.MotorConstraint(l.p1, l.p2, 1)
    }

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

    Sketchpad.simulation3d = { g: 9.8 }

    var minus = Sketchpad.geom3d.minus
    var plus = Sketchpad.geom3d.plus
    var scaledBy = Sketchpad.geom3d.scaledBy
    var magnitude = Sketchpad.geom3d.magnitude
    var distance = Sketchpad.geom3d.distance

    
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
    this.constraintsWithOnEachTimeStepFn = []
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
    this.constraintsWithOnEachTimeStepFn = []
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
    this.onEachTimeStepConstraints(pseudoTime, prevPseudoTime)
    if (this.onEachTimeStep) 
	(this.onEachTimeStep)(pseudoTime, prevPseudoTime)
}

Sketchpad.prototype.doTasksOnSolvingDone = function(pseudoTime, prevPseudoTime) {
    if (this.onSolvingDone) 
	(this.onSolvingDone)(pseudoTime, prevPseudoTime)
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
    this.doTasksOnSolvingDone(this.pseudoTime, this.prevPseudoTime)
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

Sketchpad.prototype.onEachTimeStepConstraints = function(pseudoTime, prevPseudoTime) {
    this.constraintsWithOnEachTimeStepFn.forEach(function(t) { t.onEachTimeStep(pseudoTime, prevPseudoTime) })
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8yZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvM2Qvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNocUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGFyaXRobWV0aWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLmFyaXRoID0ge31cblxuICAgIC8vIEhlbHBlcnNcblxuICAgIGZ1bmN0aW9uIGluc3RhbGxSZWYodGFyZ2V0LCByZWYsIHByZWZpeCkge1xuXHR0YXJnZXRbcHJlZml4ICsgJ19vYmonXSA9IHJlZi5vYmpcblx0dGFyZ2V0W3ByZWZpeCArICdfcHJvcCddID0gcmVmLnByb3BcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWYodGFyZ2V0LCBwcmVmaXgpIHtcblx0cmV0dXJuIHRhcmdldFtwcmVmaXggKyAnX29iaiddW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXRjaCh0YXJnZXQgLyogLCBwcmVmaXgsIG5ld1ZhbCwgLi4uICovKSB7XG5cdHZhciByZXN1bHQgPSB7fVxuXHRmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMikge1xuXHQgICAgdmFyIHByZWZpeCA9IGFyZ3VtZW50c1tpXVxuXHQgICAgdmFyIG5ld1ZhbCA9IGFyZ3VtZW50c1tpKzFdXG5cdCAgICB2YXIgZCA9IHJlc3VsdFtwcmVmaXggKyAnX29iaiddXG5cdCAgICBpZiAoIWQpIHtcblx0XHRyZXN1bHRbcHJlZml4ICsgJ19vYmonXSA9IGQgPSB7fVxuXHQgICAgfVxuXHQgICAgZFt0YXJnZXRbcHJlZml4ICsgJ19wcm9wJ11dID0gbmV3VmFsXG5cdH1cblx0cmV0dXJuIHJlc3VsdFxuICAgIH1cblxuICAgIC8vIFZhbHVlIENvbnN0cmFpbnQsIGkuZS4sIG8ucCA9IHZhbHVlXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19hcml0aF9fVmFsdWVDb25zdHJhaW50KHJlZiwgdmFsdWUpIHtcblx0aW5zdGFsbFJlZih0aGlzLCByZWYsICd2Jylcblx0dGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludCh7b2JqOiBPLCBwcm9wOiBwfSwgVmFsdWUpIHN0YXRlcyB0aGF0IE8ucCA9IFZhbHVlLlwiIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludCh7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwgNDIpIFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB0aGlzLnZhbHVlIC0gcmVmKHRoaXMsICd2JylcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBwYXRjaCh0aGlzLCAndicsIHRoaXMudmFsdWUpXG4gICAgfVxuXG4gICAgLy8gRXF1YWxpdHkgQ29uc3RyYWludCwgaS5lLiwgbzEucDEgPSBvMi5wMlxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fYXJpdGhfX0VxdWFsaXR5Q29uc3RyYWludChyZWYxLCByZWYyLCBvcHRPbmx5V3JpdGVUbykge1xuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjEsICd2MScpXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMiwgJ3YyJylcblx0dGhpcy5vbmx5V3JpdGVUbyA9IG9wdE9ubHlXcml0ZVRvIHx8IFsxLCAyXVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQoe29iajogTzEsIHByb3A6IHAxfSwge29iajogTzIsIHByb3A6IHAyfSkgc3RhdGVzIHRoYXQgTzEucDEgPSBPMi5wMiAuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50KHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSkgXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGRpZmYgPSByZWYodGhpcywgJ3YxJykgLSByZWYodGhpcywgJ3YyJylcblx0cmV0dXJuIGRpZmZcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MSA9IHJlZih0aGlzLCAndjEnKSwgdjIgPSByZWYodGhpcywgJ3YyJylcblx0dmFyIHZzID0gW3YxLCB2Ml1cblx0dmFyIG9ubHlXcml0ZVRvID0gdGhpcy5vbmx5V3JpdGVUb1xuXHR2YXIgZGlmZiA9IHYxIC0gdjJcblx0dmFyIGRpdiA9IG9ubHlXcml0ZVRvLmxlbmd0aFxuXHR2YXIgYXJncyA9IFt0aGlzXVxuXHRvbmx5V3JpdGVUby5mb3JFYWNoKGZ1bmN0aW9uKGkpIHsgdmFyIHNpZ24gPSBpID4gMSA/IDEgOiAtMTsgYXJncy5wdXNoKCd2JyArIGkpOyBhcmdzLnB1c2godnNbaSAtIDFdICsgc2lnbiAqIGRpZmYgLyBkaXYpIH0pXG5cdHJlcyA9IHBhdGNoLmFwcGx5KHRoaXMsIGFyZ3MpXG5cdHJldHVybiByZXMgLy9wYXRjaCh0aGlzLCAndjEnLCB2MSAtIChkaWZmIC8gMiksICd2MicsIHYyICsgZGlmZiAvIDIpXG4gICAgfVxuXG4gICAgLy8gU3VtIENvbnN0cmFpbnQsIGkuZS4sIG8xLnAxICsgbzIucDIgPSBvMy5wM1xuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19TdW1Db25zdHJhaW50KHJlZjEsIHJlZjIsIHJlZjMsIG9wdE9ubHlXcml0ZVRvKSB7XG5cdGluc3RhbGxSZWYodGhpcywgcmVmMSwgJ3YxJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYyLCAndjInKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjMsICd2MycpXG5cdHRoaXMub25seVdyaXRlVG8gPSBvcHRPbmx5V3JpdGVUbyB8fCBbMSwgMiwgM11cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50KHtvYmo6IE8xLCBwcm9wOiBwMX0sIHtvYmo6IE8yLCBwcm9wOiBwMn0sIHtvYmo6IE8zLCBwcm9wOiBwM30sIFdyaXRhYmxlSWR4cykgc3RhdGVzIHRoYXQgTzEucDEgKyBPMi5wMiA9IE8zLnAzIC4gT3B0aW9uYWwgV3JpdGFibGVJZHhzIGdpdmVzIGEgbGlzdCBvZiBpbmRpY2VzICgxLCAyLCBvciwgMykgdGhlIGNvbnN0cmFpbnQgaXMgYWxsb3dlZCB0byBjaGFuZ2UuXCIgfSBcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50KHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwge29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30pIFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZGlmZiA9IHJlZih0aGlzLCAndjMnKSAtIChyZWYodGhpcywgJ3YxJykgKyByZWYodGhpcywgJ3YyJykpXG5cdHJldHVybiBkaWZmXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxID0gcmVmKHRoaXMsICd2MScpXG5cdHZhciB2MiA9IHJlZih0aGlzLCAndjInKVxuXHR2YXIgdjMgPSByZWYodGhpcywgJ3YzJylcblx0dmFyIHZzID0gW3YxLCB2MiwgdjNdXG5cdHZhciBkaWZmID0gdjMgLSAodjEgKyB2Milcblx0dmFyIG9ubHlXcml0ZVRvID0gdGhpcy5vbmx5V3JpdGVUb1xuXHR2YXIgZGl2ID0gb25seVdyaXRlVG8ubGVuZ3RoXG5cdHZhciBhcmdzID0gW3RoaXNdXG5cdG9ubHlXcml0ZVRvLmZvckVhY2goZnVuY3Rpb24oaSkgeyB2YXIgc2lnbiA9IGkgPiAyID8gLTEgOiAxOyBhcmdzLnB1c2goJ3YnICsgaSk7IGFyZ3MucHVzaCh2c1tpIC0gMV0gKyBzaWduICogZGlmZiAvIGRpdikgfSlcblx0cmVzID0gcGF0Y2guYXBwbHkodGhpcywgYXJncylcblx0cmV0dXJuIHJlc1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGxBcml0aG1ldGljQ29uc3RyYWludHNcbiIsImZ1bmN0aW9uIGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGdlb21ldHJpYyBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gICAgLy8gb2JqZWN0cyB0aGF0IGhhdmUgeCBhbmQgeSBwcm9wZXJ0aWVzLiBPdGhlciBwcm9wZXJ0aWVzIGFyZSBpZ25vcmVkLlxuXG4gICAgU2tldGNocGFkLmdlb20gPSB7fVxuXG4gICAgLy8gSGVscGVyc1xuXG4gICAgZnVuY3Rpb24gc3F1YXJlKG4pIHtcblx0cmV0dXJuIG4gKiBuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGx1cyhwMSwgcDIpIHtcblx0cmV0dXJuIHt4OiBwMS54ICsgcDIueCwgeTogcDEueSArIHAyLnl9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWludXMocDEsIHAyKSB7XG5cdHJldHVybiB7eDogcDEueCAtIHAyLngsIHk6IHAxLnkgLSBwMi55fVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjYWxlZEJ5KHAsIG0pIHtcblx0cmV0dXJuIHt4OiBwLnggKiBtLCB5OiBwLnkgKiBtfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvcHkocCkge1xuXHRyZXR1cm4gc2NhbGVkQnkocCwgMSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaWRwb2ludChwMSwgcDIpIHtcblx0cmV0dXJuIHNjYWxlZEJ5KHBsdXMocDEsIHAyKSwgMC41KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hZ25pdHVkZShwKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAueCkgKyBzcXVhcmUocC55KSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemVkKHApIHtcblx0dmFyIG0gPSBtYWduaXR1ZGUocClcblx0cmV0dXJuIG0gPiAwID8gc2NhbGVkQnkocCwgMSAvIG0pIDogcFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3RhbmNlKHAxLCBwMikge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KHNxdWFyZShwMS54IC0gcDIueCkgKyBzcXVhcmUocDEueSAtIHAyLnkpKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJvdGF0ZWRCeShwLCBkVGhldGEpIHtcblx0dmFyIGMgPSBNYXRoLmNvcyhkVGhldGEpXG5cdHZhciBzID0gTWF0aC5zaW4oZFRoZXRhKVxuXHRyZXR1cm4ge3g6IGMqcC54IC0gcypwLnksIHk6IHMqcC54ICsgYypwLnl9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcm90YXRlZEFyb3VuZChwLCBkVGhldGEsIGF4aXMpIHtcblx0cmV0dXJuIHBsdXMoYXhpcywgcm90YXRlZEJ5KG1pbnVzKHAsIGF4aXMpLCBkVGhldGEpKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldERlbHRhKGQsIHAsIHNjYWxlKSB7XG5cdGQueCA9IHAueCAqIHNjYWxlXG5cdGQueSA9IHAueSAqIHNjYWxlXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uc3F1YXJlID0gc3F1YXJlXG4gICAgU2tldGNocGFkLmdlb20ucGx1cyA9IHBsdXNcbiAgICBTa2V0Y2hwYWQuZ2VvbS5taW51cyA9IG1pbnVzXG4gICAgU2tldGNocGFkLmdlb20uc2NhbGVkQnkgPSBzY2FsZWRCeVxuICAgIFNrZXRjaHBhZC5nZW9tLmNvcHkgPSBjb3B5XG4gICAgU2tldGNocGFkLmdlb20ubWlkcG9pbnQgPSBtaWRwb2ludFxuICAgIFNrZXRjaHBhZC5nZW9tLm1hZ25pdHVkZSA9IG1hZ25pdHVkZVxuICAgIFNrZXRjaHBhZC5nZW9tLm5vcm1hbGl6ZWQgPSBub3JtYWxpemVkXG4gICAgU2tldGNocGFkLmdlb20uZGlzdGFuY2UgPSBkaXN0YW5jZVxuICAgIFNrZXRjaHBhZC5nZW9tLnJvdGF0ZWRCeSA9IHJvdGF0ZWRCeVxuICAgIFNrZXRjaHBhZC5nZW9tLnJvdGF0ZWRBcm91bmQgPSByb3RhdGVkQXJvdW5kXG4gICAgU2tldGNocGFkLmdlb20uc2V0RGVsdGEgPSBzZXREZWx0YVxuXG4gICAgU2tldGNocGFkLmdlb20uZHJhd1Zpc3VhbGl6YXRpb25MaW5lID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4sIHAxLCBwMiwgbCkge1xuXHR2YXIgY3R4dCA9IGNhbnZhcy5jdHh0XG5cdGN0eHQubGluZVdpZHRoID0gMVxuXHRjdHh0LnN0cm9rZVN0eWxlID0gJ3llbGxvdydcblx0Y3R4dC5iZWdpblBhdGgoKVxuXG5cdHZhciBhbmdsZSA9IE1hdGguYXRhbjIocDIueSAtIHAxLnksIHAyLnggLSBwMS54KVxuXHR2YXIgZGlzdCA9IDI1XG5cdHZhciBwMXggPSBvcmlnaW4ueCArIHAxLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAxeSA9IG9yaWdpbi55ICsgcDEueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ4ID0gb3JpZ2luLnggKyBwMi54IC0gZGlzdCAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMnkgPSBvcmlnaW4ueSArIHAyLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblxuXHR2YXIgdGV4dENlbnRlclggPSAocDF4ICsgcDJ4KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciB0ZXh0Q2VudGVyWSA9IChwMXkgKyBwMnkpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblxuXHRjdHh0Lm1vdmVUbyhcblx0ICAgIHAxeCArIDUgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKSxcblx0ICAgIHAxeSArIDUgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHQpXG5cdGN0eHQubGluZVRvKFxuXHQgICAgcDF4IC0gNSAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpLFxuXHQgICAgcDF5IC0gNSAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdClcblxuXHRjdHh0Lm1vdmVUbyhwMXgsIHAxeSlcblx0Y3R4dC5saW5lVG8ocDJ4LCBwMnkpXG5cblx0Y3R4dC5tb3ZlVG8oXG5cdCAgICBwMnggKyA1ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMiksXG5cdCAgICBwMnkgKyA1ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0KVxuXHRjdHh0LmxpbmVUbyhcblx0ICAgIHAyeCAtIDUgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKSxcblx0ICAgIHAyeSAtIDUgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHQpXG5cdGN0eHQuY2xvc2VQYXRoKClcblx0Y3R4dC5zdHJva2UoKVxuXG5cdGN0eHQudGV4dEFsaWduID0gJ2NlbnRlcidcblx0Y3R4dC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJ1xuXHRjdHh0LnN0cm9rZVRleHQoTWF0aC5yb3VuZChsKSwgdGV4dENlbnRlclgsIHRleHRDZW50ZXJZKVxuXHRjdHh0LnN0cm9rZSgpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uY2FsY3VsYXRlQW5nbGUgPSBmdW5jdGlvbihwMSwgcDIsIHAzLCBwNCkge1xuXHR2YXIgdjEyID0ge3g6IHAyLnggLSBwMS54LCB5OiBwMi55IC0gcDEueX1cblx0dmFyIGExMiA9IE1hdGguYXRhbjIodjEyLnksIHYxMi54KVxuXHR2YXIgdjM0ID0ge3g6IHA0LnggLSBwMy54LCB5OiBwNC55IC0gcDMueX1cblx0dmFyIGEzNCA9IE1hdGguYXRhbjIodjM0LnksIHYzNC54KVxuXHRyZXR1cm4gKGExMiAtIGEzNCArIDIgKiBNYXRoLlBJKSAlICgyICogTWF0aC5QSSlcbiAgICB9XG5cbiAgICAvLyBDb29yZGluYXRlIENvbnN0cmFpbnQsIGkuZS4sIFwiSSB3YW50IHRoaXMgcG9pbnQgdG8gYmUgaGVyZVwiLlxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0Nvb3JkaW5hdGVDb25zdHJhaW50KHAsIHgsIHkpIHtcblx0dGhpcy5wID0gcFxuXHR0aGlzLmMgPSBuZXcgUG9pbnQoeCwgeSlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50KFBvaW50IFAsIE51bWJlciBYLCBOdW1iZXIgWSkgc3RhdGVzIHRoYXQgcG9pbnQgUCBzaG91bGQgc3RheSBhdCBjb29yZGluYXRlIChYLCBZKS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwOiAnUG9pbnQnLCBjOiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnAsIHByb3BzOiBbJ3gnLCAneSddfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIHAxID0gUG9pbnQuZHVtbXkoeCwgeSlcblx0dmFyIHAyID0gUG9pbnQuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludChwMSwgcDIueCwgcDIueSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyh0aGlzLmMsIHRoaXMucCkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHtwOiB7eDogdGhpcy5jLngsIHk6IHRoaXMuYy55fX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0aWYgKHRoaXMucC5pc1NlbGVjdGVkKSByZXR1cm4gLy8gZG9uJ3QgZHJhdyBvdmVyIHRoZSBzZWxlY3Rpb24gaGlnaGxpZ2h0XG5cdGN0eHQuZmlsbFN0eWxlID0gJ2JsYWNrJ1xuXHRjdHh0LmJlZ2luUGF0aCgpXG5cdGN0eHQuYXJjKHRoaXMuYy54ICsgb3JpZ2luLngsIHRoaXMuYy55ICsgb3JpZ2luLnksIGNhbnZhcy5wb2ludFJhZGl1cyAqIDAuNjY2LCAwLCAyICogTWF0aC5QSSlcblx0Y3R4dC5jbG9zZVBhdGgoKVxuXHRjdHh0LmZpbGwoKVxuICAgIH1cblxuICAgIC8vIFhDb29yZGluYXRlQ29uc3RyYWludCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX1hDb29yZGluYXRlQ29uc3RyYWludChwMSwgcDIpIHtcbiAgICAgICAgdGhpcy5wMSA9IHAxXG4gICAgICAgIHRoaXMucDIgPSBwMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLlhDb29yZGluYXRlQ29uc3RyYWludChQb2ludCBQLCBOdW1iZXIgWCkgc3RhdGVzIHRoYXQgcG9pbnQgUCd4IHgtY29vcmRpbmF0ZSBzaG91bGQgYmUgYXQgWC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgcDEgPSBQb2ludC5kdW1teSh4LCB5KVxuXHR2YXIgcDIgPSBQb2ludC5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLlhDb29yZGluYXRlQ29uc3RyYWludChwMSwgcDIueCwgcDIueSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB0aGlzLnAyLnggLSB0aGlzLnAxLnhcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHtwMToge3g6IHRoaXMucDIueH19XG4gICAgfVxuXG4gICAgLy8gWUNvb3JkaW5hdGVDb25zdHJhaW50IENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5nZW9tLllDb29yZGluYXRlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fWUNvb3JkaW5hdGVDb25zdHJhaW50KHAxLCBwMikge1xuICAgICAgICB0aGlzLnAxID0gcDFcbiAgICAgICAgdGhpcy5wMiA9IHAyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLllDb29yZGluYXRlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLllDb29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHRoaXMucDIueSAtIHRoaXMucDEueVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLllDb29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge3AxOiB7eTogdGhpcy5wMi55fX1cbiAgICB9XG5cbiAgICAvLyBDb2luY2lkZW5jZSBDb25zdHJhaW50LCBpLmUuLCBJIHdhbnQgdGhlc2UgdHdvIHBvaW50cyB0byBiZSBhdCB0aGUgc2FtZSBwbGFjZS5cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fQ29pbmNpZGVuY2VDb25zdHJhaW50KHAxLCBwMikge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludChQb2ludCBQMSwgUG9pb250IFAyKSBzdGF0ZXMgdGhhdCBwb2ludHMgUDEgJiBQMiBzaG91bGQgYmUgYXQgdGhlIHNhbWUgcGxhY2UuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50KGwucDEsIGwucDIpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMucDIsIHRoaXMucDEpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXModGhpcy5wMiwgdGhpcy5wMSksIDAuNSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBzcGxpdERpZmYpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSl9XG4gICAgfVxuXG4gICAgLy8gRXF1aXZhbGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZSB2ZWN0b3JzIHAxLT5wMiBhbmQgcDMtPnA0IHRvIGJlIHRoZSBzYW1lLlxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19FcXVpdmFsZW5jZUNvbnN0cmFpbnQocDEsIHAyLCBwMywgcDQpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLnAzID0gcDNcblx0dGhpcy5wNCA9IHA0XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIFBvaW50IFAzLCBQb2ludCBQNCkgc2F5cyBsaW5lIHNlY3Rpb25zIFAxLTIgYW5kIFAzLTQgYXJlIHBhcmFsbGVsIGFuZCBvZiB0aGUgc2FtZSBsZW5ndGhzLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCcsIHAzOiAnUG9pbnQnLCBwNDogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwxID0gTGluZS5kdW1teSh4LCB5KVxuXHR2YXIgbDIgPSBMaW5lLmR1bW15KHksIHgpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50KGwxLnAxLCBsMS5wMiwgbDIucDEsIGwyLnAyKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMucDIsIHRoaXMucDMpLCBwbHVzKHRoaXMucDEsIHRoaXMucDQpKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNwbGl0RGlmZiA9IHNjYWxlZEJ5KG1pbnVzKHBsdXModGhpcy5wMiwgdGhpcy5wMyksIHBsdXModGhpcy5wMSwgdGhpcy5wNCkpLCAwLjI1KVxuXHRyZXR1cm4ge3AxOiBwbHVzKHRoaXMucDEsIHNwbGl0RGlmZiksIHAyOiBwbHVzKHRoaXMucDIsIHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpKSwgcDM6IHBsdXModGhpcy5wMywgc2NhbGVkQnkoc3BsaXREaWZmLCAtMSkpLCBwNDogcGx1cyh0aGlzLnA0LCBzcGxpdERpZmYpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBsID0gZGlzdGFuY2UodGhpcy5wMSwgdGhpcy5wMilcblx0U2tldGNocGFkLmdlb20uZHJhd1Zpc3VhbGl6YXRpb25MaW5lKGNhbnZhcywgb3JpZ2luLCB0aGlzLnAxLCB0aGlzLnAyLCBsKVxuXHRTa2V0Y2hwYWQuZ2VvbS5kcmF3VmlzdWFsaXphdGlvbkxpbmUoY2FudmFzLCBvcmlnaW4sIHRoaXMucDMsIHRoaXMucDQsIGwpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb250YWluc1BvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDIsIHAzID0gdGhpcy5wMywgcDQgPSB0aGlzLnA0XG5cdHZhciB4MSA9IE1hdGgubWluKHAxLngsIHAyLngsIHAzLngsIHA0LngpLCB4MiA9IE1hdGgubWF4KHAxLngsIHAyLngsIHAzLngsIHA0LngpXG5cdHZhciB5MSA9IE1hdGgubWluKHAxLnksIHAyLnksIHAzLnksIHA0LnkpLCB5MiA9IE1hdGgubWF4KHAxLnksIHAyLnksIHAzLnksIHA0LnkpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludCh4MSwgeTEpLCB4MiAtIHgxLCB5MiAtIHkxKSBcblx0cmV0dXJuIHRoaXMuX19ib3JkZXIuY29udGFpbnNQb2ludCh4LCB5KSBcbiAgICB9XG4gICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmJvcmRlciA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDIsIHAzID0gdGhpcy5wMywgcDQgPSB0aGlzLnA0XG5cdHZhciB4MSA9IE1hdGgubWluKHAxLngsIHAyLngsIHAzLngsIHA0LngpLCB4MiA9IE1hdGgubWF4KHAxLngsIHAyLngsIHAzLngsIHA0LngpXG5cdHZhciB5MSA9IE1hdGgubWluKHAxLnksIHAyLnksIHAzLnksIHA0LnkpLCB5MiA9IE1hdGgubWF4KHAxLnksIHAyLnksIHAzLnksIHA0LnkpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludCh4MSwgeTEpLCB4MiAtIHgxLCB5MiAtIHkxKSBcblx0cmV0dXJuIHRoaXMuX19ib3JkZXJcbiAgICB9IFxuXG4gICAgLy8gT25lIFdheSBFcXVpdmFsZW5jZSBDb25zdHJhaW50LCBpLmUuLCBJIHdhbnQgdGhlIHZlY3RvcnMgcDEtPnAyIHRvIGFsd2F5cyBtYXRjaCB3aXRoIHAzLT5wNFxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQocDEsIHAyLCBwMywgcDQpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLnAzID0gcDNcblx0dGhpcy5wNCA9IHA0XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIFBvaW50IFAzLCBQb2ludCBQNCkgc2F5cyB0aGUgdmVjdG9ycyBQMS0+UDIgYWx3YXlzIG1hdGNoZXMgd2l0aCBQMy0+UDRcIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsMSA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGwyID0gTGluZS5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludChsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzcGxpdERpZmYgPSBzY2FsZWRCeShtaW51cyhwbHVzKHRoaXMucDIsIHRoaXMucDMpLCBwbHVzKHRoaXMucDEsIHRoaXMucDQpKSwgMC41KVxuXHRyZXR1cm4ge3AxOiBwbHVzKHRoaXMucDEsIHNwbGl0RGlmZiksIHAyOiBwbHVzKHRoaXMucDIsIHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpKX1cbiAgICB9XG5cbiAgICAvLyBFcXVhbCBEaXN0YW5jZSBjb25zdHJhaW50IC0ga2VlcHMgZGlzdGFuY2VzIFAxLS0+UDIsIFAzLS0+UDQgZXF1YWxcblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19FcXVhbERpc3RhbmNlQ29uc3RyYWludChwMSwgcDIsIHAzLCBwNCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMucDMgPSBwM1xuXHR0aGlzLnA0ID0gcDRcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50KFBvaW50IFAxLCBQb2ludCBQMiwgUG9pbnQgUDMsIFBvaW50IFA0KSBrZWVwcyBkaXN0YW5jZXMgUDEtPlAyLCBQMy0+UDQgZXF1YWwuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwxID0gTGluZS5kdW1teSh4LCB5KVxuXHR2YXIgbDIgPSBMaW5lLmR1bW15KHksIHgpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQobDEucDEsIGwxLnAyLCBsMi5wMSwgbDIucDIpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsMTIgPSBtYWduaXR1ZGUobWludXModGhpcy5wMSwgdGhpcy5wMikpXG5cdHZhciBsMzQgPSBtYWduaXR1ZGUobWludXModGhpcy5wMywgdGhpcy5wNCkpXG5cdHJldHVybiBsMTIgLSBsMzRcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSlcblx0dmFyIGwzNCA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAzLCB0aGlzLnA0KSlcblx0dmFyIGRlbHRhID0gKGwxMiAtIGwzNCkgLyA0XG5cdHZhciBlMTIgPSBzY2FsZWRCeShTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkKG1pbnVzKHRoaXMucDIsIHRoaXMucDEpKSwgZGVsdGEpXG5cdHZhciBlMzQgPSBzY2FsZWRCeShTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkKG1pbnVzKHRoaXMucDQsIHRoaXMucDMpKSwgZGVsdGEpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgZTEyKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoZTEyLCAtMSkpLCBwMzogcGx1cyh0aGlzLnAzLCBzY2FsZWRCeShlMzQsIC0xKSksIHA0OiBwbHVzKHRoaXMucDQsIGUzNCl9XG4gICAgfVxuXG4gICAgLy8gTGVuZ3RoIGNvbnN0cmFpbnQgLSBtYWludGFpbnMgZGlzdGFuY2UgYmV0d2VlbiBQMSBhbmQgUDIgYXQgTC5cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0xlbmd0aENvbnN0cmFpbnQocDEsIHAyLCBsKSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5sID0gbFxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBOdW1iZXIgTCkgc2F5cyBwb2ludHMgUDEgYW5kIFAyIGFsd2F5cyBtYWludGFpbiBhIGRpc3RhbmNlIG9mIEwuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCcsIGw6ICdOdW1iZXInfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMucDEsIHByb3BzOiBbJ3gnLCAneSddfSwge29iajogdGhpcy5wMiwgcHJvcHM6IFsneCcsICd5J119XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludChuZXcgUG9pbnQoeCAtIDUwLCB5IC0gNTApLCBuZXcgUG9pbnQoeCArIDUwLCB5ICsgNTApLCAxMDApXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSlcblx0cmV0dXJuIGwxMiAtIHRoaXMubFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHAxID0gdGhpcy5wMSwgcDIgPSB0aGlzLnAyXG5cdHZhciBsMTIgPSBtYWduaXR1ZGUobWludXMocDEsIHAyKSlcblx0aWYgKGwxMiA9PSAwKSB7XG5cdCAgICBwMSA9IHBsdXMocDEsIHt4OiAwLjEsIHk6IDB9KVxuXHQgICAgcDIgPSBwbHVzKHAyLCB7eDogLTAuMSwgeTogMH0pXG5cdH1cblx0dmFyIGRlbHRhID0gKGwxMiAtIHRoaXMubCkgLyAyXG5cdHZhciBlMTIgPSBzY2FsZWRCeShTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkKG1pbnVzKHAyLCBwMSkpLCBkZWx0YSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBlMTIpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShlMTIsIC0xKSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZShjYW52YXMsIG9yaWdpbiwgdGhpcy5wMSwgdGhpcy5wMiwgdGhpcy5sKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHAyLnkgLSBwMS55LCBwMi54IC0gcDEueClcblx0dmFyIGRpc3QgPSAyNVxuXHR2YXIgcDF4ID0gcDEueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDF5ID0gcDEueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ4ID0gcDIueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ5ID0gcDIueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclggPSAocDF4ICsgcDJ4KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciB0ZXh0Q2VudGVyWSA9IChwMXkgKyBwMnkpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KHRleHRDZW50ZXJYIC0gNTAsIHRleHRDZW50ZXJZIC0gNTApLCAxMDAsIDEwMCkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyLmNvbnRhaW5zUG9pbnQoeCwgeSkgXG4gICAgfVxuICAgXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHAyLnkgLSBwMS55LCBwMi54IC0gcDEueClcblx0dmFyIGRpc3QgPSAyNVxuXHR2YXIgcDF4ID0gcDEueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDF5ID0gcDEueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ4ID0gcDIueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ5ID0gcDIueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclggPSAocDF4ICsgcDJ4KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciB0ZXh0Q2VudGVyWSA9IChwMXkgKyBwMnkpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KHRleHRDZW50ZXJYIC0gNTAsIHRleHRDZW50ZXJZIC0gNTApLCAxMDAsIDEwMCkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyXG4gICAgfSBcblxuICAgIC8vIE9yaWVudGF0aW9uIGNvbnN0cmFpbnQgLSBtYWludGFpbnMgYW5nbGUgYmV0d2VlbiBQMS0+UDIgYW5kIFAzLT5QNCBhdCBUaGV0YVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19PcmllbnRhdGlvbkNvbnN0cmFpbnQocDEsIHAyLCBwMywgcDQsIHRoZXRhKSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuXHR0aGlzLnRoZXRhID0gdGhldGEgPT09IHVuZGVmaW5lZCA/IFNrZXRjaHBhZC5nZW9tLmNhbGN1bGF0ZUFuZ2xlKHAxLCBwMiwgcDMsIHA0KSA6IHRoZXRhXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIFBvaW50IFAzLCBQb2ludCBQNCwgTnVtYmVyIFRoZXRhKSBtYWludGFpbnMgYW5nbGUgYmV0d2VlbiBQMS0+UDIgYW5kIFAzLT5QNCBhdCBUaGV0YS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCcsIHRoZXRhOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwxID0gTGluZS5kdW1teSh4LCB5KVxuXHR2YXIgbDIgPSBMaW5lLmR1bW15KHksIHgpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50KGwxLnAxLCBsMS5wMiwgbDIucDEsIGwyLnAyKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxMiA9IG1pbnVzKHRoaXMucDIsIHRoaXMucDEpXG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cdFxuXHR2YXIgdjM0ID0gbWludXModGhpcy5wNCwgdGhpcy5wMylcblx0dmFyIGEzNCA9IE1hdGguYXRhbjIodjM0LnksIHYzNC54KVxuXHR2YXIgbTM0ID0gbWlkcG9pbnQodGhpcy5wMywgdGhpcy5wNClcblx0XG5cdHZhciBjdXJyVGhldGEgPSBhMTIgLSBhMzRcblx0dmFyIGRUaGV0YSA9IHRoaXMudGhldGEgLSBjdXJyVGhldGFcblx0cmV0dXJuIGRUaGV0YVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxMiA9IG1pbnVzKHRoaXMucDIsIHRoaXMucDEpXG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cblx0dmFyIHYzNCA9IG1pbnVzKHRoaXMucDQsIHRoaXMucDMpXG5cdHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueClcblx0dmFyIG0zNCA9IG1pZHBvaW50KHRoaXMucDMsIHRoaXMucDQpXG5cblx0dmFyIGN1cnJUaGV0YSA9IGExMiAtIGEzNFxuXHR2YXIgZFRoZXRhID0gdGhpcy50aGV0YSAtIGN1cnJUaGV0YVxuXHQvLyBUT0RPOiBmaWd1cmUgb3V0IHdoeSBzZXR0aW5nIGRUaGV0YSB0byAxLzIgdGltZXMgdGhpcyB2YWx1ZSAoYXMgc2hvd24gaW4gdGhlIHBhcGVyXG5cdC8vIGFuZCBzZWVtcyB0byBtYWtlIHNlbnNlKSByZXN1bHRzIGluIGp1bXB5L3Vuc3RhYmxlIGJlaGF2aW9yLlxuXHRyZXR1cm4ge3AxOiByb3RhdGVkQXJvdW5kKHRoaXMucDEsIGRUaGV0YSwgbTEyKSxcblx0XHRwMjogcm90YXRlZEFyb3VuZCh0aGlzLnAyLCBkVGhldGEsIG0xMiksXG5cdFx0cDM6IHJvdGF0ZWRBcm91bmQodGhpcy5wMywgLWRUaGV0YSwgbTM0KSxcblx0XHRwNDogcm90YXRlZEFyb3VuZCh0aGlzLnA0LCAtZFRoZXRhLCBtMzQpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0dmFyIG0xID0gc2NhbGVkQnkocGx1cyh0aGlzLnAxLCB0aGlzLnAyKSwgMC41KVxuXHR2YXIgbTIgPSBzY2FsZWRCeShwbHVzKHRoaXMucDMsIHRoaXMucDQpLCAwLjUpXG5cdHZhciBtID0gc2NhbGVkQnkocGx1cyhtMSwgbTIpLCAwLjUpXG5cdGNhbnZhcy5kcmF3QXJyb3cobTEsIG0yLCBvcmlnaW4pXG5cdGN0eHQuZmlsbFN0eWxlID0gJ3JlZCdcblx0Y3R4dC5maWxsVGV4dCgndGhldGEgPSAnICsgTWF0aC5mbG9vcih0aGlzLnRoZXRhIC8gTWF0aC5QSSAqIDE4MCksIG0ueCArIG9yaWdpbi54LCBtLnkgKyBvcmlnaW4ueSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBtMSA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMSwgdGhpcy5wMiksIDAuNSlcblx0dmFyIG0yID0gc2NhbGVkQnkocGx1cyh0aGlzLnAzLCB0aGlzLnA0KSwgMC41KVxuXHR2YXIgbSA9IHNjYWxlZEJ5KHBsdXMobTEsIG0yKSwgMC41KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQobS54IC0gNTAsIG0ueSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlci5jb250YWluc1BvaW50KHgsIHkpIFxuICAgIH1cbiAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHZhciBtMSA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMSwgdGhpcy5wMiksIDAuNSlcblx0dmFyIG0yID0gc2NhbGVkQnkocGx1cyh0aGlzLnAzLCB0aGlzLnA0KSwgMC41KVxuXHR2YXIgbSA9IHNjYWxlZEJ5KHBsdXMobTEsIG0yKSwgMC41KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQobS54IC0gNTAsIG0ueSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlclxuICAgIH0gXG5cbiAgICAvLyBNb3RvciBjb25zdHJhaW50IC0gY2F1c2VzIFAxIGFuZCBQMiB0byBvcmJpdCB0aGVpciBtaWRwb2ludCBhdCB0aGUgZ2l2ZW4gcmF0ZS5cbiAgICAvLyB3IGlzIGluIHVuaXRzIG9mIEh6IC0gd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX01vdG9yQ29uc3RyYWludChwMSwgcDIsIHcpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLncgPSB3XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBXKSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlIG9mIHcsIGluIHVuaXRzIG9mIEh6OiB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cIiB9IFxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgdzogJ051bWJlcid9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbCA9IExpbmUuZHVtbXkoeCwgeSlcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQobC5wMSwgbC5wMiwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiAxXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB0ID0gKHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZSkgLyAxMDAwLjBcblx0dmFyIGRUaGV0YSA9IHQgKiB0aGlzLncgKiAoMiAqIE1hdGguUEkpXG5cdHZhciBtMTIgPSBtaWRwb2ludCh0aGlzLnAxLCB0aGlzLnAyKVxuXHRyZXR1cm4ge3AxOiByb3RhdGVkQXJvdW5kKHRoaXMucDEsIGRUaGV0YSwgbTEyKSxcblx0XHRwMjogcm90YXRlZEFyb3VuZCh0aGlzLnAyLCBkVGhldGEsIG0xMil9XG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludCA9IGZ1bmN0aW9uICBTa2V0Y2hwYWRfX2dlb21fX0NhcnRlc2lhblBvaW50Q29uc3RyYWludChwb3NpdGlvbiwgdmVjdG9yLCBvcmlnaW4sIHVuaXQpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMudmVjdG9yID0gdmVjdG9yXG5cdHRoaXMub3JpZ2luID0gb3JpZ2luXG5cdHRoaXMudW5pdCA9IHVuaXRcbiAgICB9XG4gICAgXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludCwgdHJ1ZSlcbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5DYXJ0ZXNpYW5Qb2ludENvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBcIlNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludChQb2ludCBQLCBWZWN0b3IgViwgUG9pbnQgTywgTnVtYmVyIFUpIHN0YXRlcyB0aGF0IFAgc2hvdWxkIGJlIHBvc2l0aW9uZWQgYmFzZWQgb24gdmVjdG9yIFYncyBYIGFuZCBZIGRpc2NyZXRlIGNvb3JkaW5hdGUgdmFsdWVzLCBhbmQgb24gb3JpZ2luIE8gYW5kIGVhY2ggdW5pdCBvbiBheGlzIGhhdmluZyBhIHZlcnRpY2FsIGFuZCBob3Jpem9udGFsIGxlbmd0aCBvZiBVXCJcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgb3JpZ2luID0gdGhpcy5vcmlnaW4sIHZlY3RvciA9IHRoaXMudmVjdG9yLCBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24sIHVuaXQgPSB0aGlzLnVuaXRcblx0dmFyIGRpZmZYID0gTWF0aC5hYnMob3JpZ2luLnggKyB1bml0ICogdmVjdG9yLnggLSBwb3NpdGlvbi54KVxuXHR2YXIgZGlmZlkgPSBNYXRoLmFicyhvcmlnaW4ueSAtIHVuaXQgKiB2ZWN0b3IueSAtIHBvc2l0aW9uLnkpXG5cdHJldHVybiBkaWZmWCArIGRpZmZZXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBvcmlnaW4gPSB0aGlzLm9yaWdpbiwgdmVjdG9yID0gdGhpcy52ZWN0b3IsIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiwgdW5pdCA9IHRoaXMudW5pdFxuXHR2YXIgeCA9IG9yaWdpbi54ICsgdW5pdCAqIHZlY3Rvci54XG5cdHZhciB5ID0gb3JpZ2luLnkgLSB1bml0ICogdmVjdG9yLnlcblx0cmV0dXJuIHtwb3NpdGlvbjoge3g6IHgsIHk6IHl9fVxuICAgIH1cbiAgICBcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHNcbiIsImZ1bmN0aW9uIGluc3RhbGxTaW11bGF0aW9uQ29uc3RyYWludHMoU2tldGNocGFkKSB7XG5cbiAgICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBzaW11bGF0aW9uIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgICAvLyBhcmJpdHJhcnkgcHJvcGVydGllcyBvZiBhcmJpdHJhcnkgb2JqZWN0cy4gXCJSZWZlcmVuY2VzXCIgYXJlIHJlcHJlc2VudGVkXG4gICAgLy8gYXMgKG9iamVjdCwgcHJvcGVydHlOYW1lKSB0dXBsZXMsIGUuZy4sIHtvYmo6IHlvdXJNb20sIHByb3A6ICd3ZWlnaHQnfS5cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uID0geyBnOiA5LjggfVxuXG4gICAgdmFyIG1pbnVzID0gU2tldGNocGFkLmdlb20ubWludXNcbiAgICB2YXIgcGx1cyA9IFNrZXRjaHBhZC5nZW9tLnBsdXNcbiAgICB2YXIgc2NhbGVkQnkgPSBTa2V0Y2hwYWQuZ2VvbS5zY2FsZWRCeVxuICAgIHZhciBtYWduaXR1ZGUgPSBTa2V0Y2hwYWQuZ2VvbS5tYWduaXR1ZGVcbiAgICB2YXIgZGlzdGFuY2UgPSBTa2V0Y2hwYWQuZ2VvbS5kaXN0YW5jZVxuXG4gICAgLy8gQ2xhc3Nlc1xuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZyA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fU3ByaW5nKGxpbmUsIGssIGxlbmd0aCwgdGVhclBvaW50QW1vdW50KSB7XG5cdHRoaXMubGluZSA9IGxpbmVcblx0dGhpcy5rID0ga1xuXHR0aGlzLmxlbmd0aCA9IGxlbmd0aCAgICBcblx0dGhpcy50ZWFyUG9pbnRBbW91bnQgPSB0ZWFyUG9pbnRBbW91bnRcblx0dGhpcy50b3JuID0gZmFsc2VcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2xpbmU6ICdMaW5lJywgazogJ051bWJlcicsIGxlbmd0aDogJ051bWJlcicsIHRlYXRQb2ludEFtb3VudDogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsID0gTGluZS5kdW1teSh4LCB5KVxuXHR2YXIgZCA9IGRpc3RhbmNlKGwucDEsIGwucDIpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nKGwsIDEwLCBkLCAgZCAqIDUpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuY29udGFpbnNQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIHRoaXMubGluZS5jb250YWluc1BvaW50KHgsIHkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5jZW50ZXIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMubGluZS5jZW50ZXIoKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBuZXcgTGluZSh0aGlzLmxpbmUucDEsIHRoaXMubGluZS5wMiwgdW5kZWZpbmVkLCA4KS5ib3JkZXIoKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuc29sdXRpb25Kb2lucyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge3Rvcm46IHJjLnNrZXRjaHBhZC5sYXN0T25lV2luc0pvaW5Tb2x1dGlvbnN9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0dmFyIGN0eHQgPSBjYW52YXMuY3R4dFxuXHR2YXIgbGluZSA9IHRoaXMubGluZVxuXHR2YXIgcDEgPSBsaW5lLnAxLCBwMiA9IGxpbmUucDJcblx0dmFyIHkxID0gb3JpZ2luLnkgKyBwMS55XG5cdHZhciB5MiA9IG9yaWdpbi55ICsgcDIueVxuXHR2YXIgeDEgPSBvcmlnaW4ueCArIHAxLnhcblx0dmFyIHgyID0gb3JpZ2luLnggKyBwMi54XG5cdGlmICghdGhpcy50b3JuKSB7XG5cdCAgICBsaW5lLmRyYXcoY2FudmFzLCBvcmlnaW4pXG5cdCAgICBjdHh0LmZpbGxTdHlsZSA9ICdibGFjaydcblx0ICAgIGN0eHQuZmlsbFRleHQoTWF0aC5mbG9vcihNYXRoLnNxcnQoTWF0aC5wb3coeTEgLSB5MiwgMikgKyBNYXRoLnBvdyh4MSAtIHgyLCAyKSkgLSB0aGlzLmxlbmd0aCksICh4MSArIHgyKSAvIDIsICh5MSArIHkyKSAvIDIpXG5cdH1cbiAgICB9XG5cbiAgICAvLyBVdGlsaXRpZXNcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QgPSBmdW5jdGlvbihoYWxmTGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSB7XG5cdHZhciBxdWFydGVyTGVuZ3RoID0gaGFsZkxlbmd0aCAvIDJcblx0dmFyIHBvc2l0aW9uWCA9IHBvc2l0aW9uLnhcblx0dmFyIHBvc2l0aW9uWSA9IHBvc2l0aW9uLnlcblx0dmFyIHN1cmZhY2VYMSA9IHN1cmZhY2VQMS54XG5cdHZhciBzdXJmYWNlWTEgPSBzdXJmYWNlUDEueVxuXHR2YXIgc3VyZmFjZVgyID0gc3VyZmFjZVAyLnhcblx0dmFyIHN1cmZhY2VZMiA9IHN1cmZhY2VQMi55XG5cdHZhciBzbG9wZSA9IChzdXJmYWNlWTIgLSBzdXJmYWNlWTEpIC8gKHN1cmZhY2VYMiAtIHN1cmZhY2VYMSlcblx0dmFyIHN1cmZhY2VIaXRQb3NYID0gKChwb3NpdGlvblkgLSBzdXJmYWNlWTEpIC8gc2xvcGUpICsgc3VyZmFjZVgxXG5cdHZhciBzdXJmYWNlSGl0UG9zWSA9ICgocG9zaXRpb25YIC0gc3VyZmFjZVgxKSAqIHNsb3BlKSArIHN1cmZhY2VZMVxuXHR2YXIgaXNWZXJ0aWNhbCA9IChwb3NpdGlvblggPj0gKHN1cmZhY2VYMSAtIHF1YXJ0ZXJMZW5ndGgpICYmIHBvc2l0aW9uWCA8PSAoc3VyZmFjZVgyICsgcXVhcnRlckxlbmd0aCkpXG5cdHZhciBpc0hvcml6b250YWwgPSAocG9zaXRpb25ZID49IChzdXJmYWNlWTEgLSBxdWFydGVyTGVuZ3RoKSAmJiBwb3NpdGlvblkgPD0gKHN1cmZhY2VZMiArIHF1YXJ0ZXJMZW5ndGgpKVxuXHR2YXIgaXNVcCA9IGlzVmVydGljYWwgJiYgcG9zaXRpb25ZIDw9IHN1cmZhY2VIaXRQb3NZXG5cdHZhciBpc0Rvd24gPSBpc1ZlcnRpY2FsICYmIHBvc2l0aW9uWSA+PSBzdXJmYWNlSGl0UG9zWVxuXHR2YXIgaXNMZWZ0ID0gaXNIb3Jpem9udGFsICYmIHBvc2l0aW9uWCA8PSBzdXJmYWNlSGl0UG9zWFxuXHR2YXIgaXNSaWdodCA9IGlzSG9yaXpvbnRhbCAmJiBwb3NpdGlvblggPj0gc3VyZmFjZUhpdFBvc1hcblx0cmV0dXJuICgoKGlzVXAgJiYgKHZlbG9jaXR5LnkgPj0gMCkgJiYgKHBvc2l0aW9uWSA+PSAoc3VyZmFjZUhpdFBvc1kgLSBoYWxmTGVuZ3RoKSkpXG5cdFx0IHx8IChpc0Rvd24gJiYgKHZlbG9jaXR5LnkgPD0gMCkgJiYgKHBvc2l0aW9uWSA8PSAoc3VyZmFjZUhpdFBvc1kgKyBoYWxmTGVuZ3RoKSkpKVxuXHRcdHx8ICgoaXNMZWZ0ICYmICh2ZWxvY2l0eS54ID49IDApICYmIChwb3NpdGlvblggPD0gc3VyZmFjZUhpdFBvc1gpICYmIChwb3NpdGlvblggPj0gKHN1cmZhY2VIaXRQb3NYIC0gaGFsZkxlbmd0aCkpKVxuXHRcdCAgICB8fCAoaXNSaWdodCAmJiAodmVsb2NpdHkueCA8PSAwKSAmJiAocG9zaXRpb25YID49IHN1cmZhY2VIaXRQb3NYKSAmJiAocG9zaXRpb25YIDw9IChzdXJmYWNlSGl0UG9zWCArIGhhbGZMZW5ndGgpKSkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLmNvbXB1dGVDb250YWN0ID0gZnVuY3Rpb24oaGFsZkxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikge1xuXHR2YXIgcXVhcnRlckxlbmd0aCA9IGhhbGZMZW5ndGggLyAyXG5cdHZhciBwb3NpdGlvblggPSBwb3NpdGlvbi54XG5cdHZhciBwb3NpdGlvblkgPSBwb3NpdGlvbi55XG5cdHZhciBzdXJmYWNlWDEgPSBzdXJmYWNlUDEueFxuXHR2YXIgc3VyZmFjZVkxID0gc3VyZmFjZVAxLnlcblx0dmFyIHN1cmZhY2VYMiA9IHN1cmZhY2VQMi54XG5cdHZhciBzdXJmYWNlWTIgPSBzdXJmYWNlUDIueVxuXHR2YXIgc2xvcGUgPSAoc3VyZmFjZVkyIC0gc3VyZmFjZVkxKSAvIChzdXJmYWNlWDIgLSBzdXJmYWNlWDEpXG5cdHZhciBzdXJmYWNlSGl0UG9zWCA9ICgocG9zaXRpb25ZIC0gc3VyZmFjZVkxKSAvIHNsb3BlKSArIHN1cmZhY2VYMVxuXHR2YXIgc3VyZmFjZUhpdFBvc1kgPSAoKHBvc2l0aW9uWCAtIHN1cmZhY2VYMSkgKiBzbG9wZSkgKyBzdXJmYWNlWTFcblx0dmFyIGlzVmVydGljYWwgPSAocG9zaXRpb25YID49IChzdXJmYWNlWDEgLSBxdWFydGVyTGVuZ3RoKSAmJiBwb3NpdGlvblggPD0gKHN1cmZhY2VYMiArIHF1YXJ0ZXJMZW5ndGgpKVxuXHR2YXIgaXNIb3Jpem9udGFsID0gKHBvc2l0aW9uWSA+PSAoc3VyZmFjZVkxIC0gcXVhcnRlckxlbmd0aCkgJiYgcG9zaXRpb25ZIDw9IChzdXJmYWNlWTIgKyBxdWFydGVyTGVuZ3RoKSlcblx0dmFyIGlzVXAgPSBpc1ZlcnRpY2FsICYmIHBvc2l0aW9uWSA8PSBzdXJmYWNlSGl0UG9zWVxuXHR2YXIgaXNEb3duID0gaXNWZXJ0aWNhbCAmJiBwb3NpdGlvblkgPj0gc3VyZmFjZUhpdFBvc1lcblx0dmFyIGlzTGVmdCA9IGlzSG9yaXpvbnRhbCAmJiBwb3NpdGlvblggPD0gc3VyZmFjZUhpdFBvc1hcblx0dmFyIGlzUmlnaHQgPSBpc0hvcml6b250YWwgJiYgcG9zaXRpb25YID49IHN1cmZhY2VIaXRQb3NYXG5cdHZhciB2ZWxvY2l0eU1hZ25pdHVkZSA9IG1hZ25pdHVkZSh2ZWxvY2l0eSlcblx0dmFyIGRpc3RhbmNlID0gMFxuXHQvL0hBQ0sgRklYTUVcblx0aWYgKGlzVXAgJiYgKHZlbG9jaXR5LnkgPj0gMCkpIHtcblx0ICAgIGRpc3RhbmNlID0gc3VyZmFjZUhpdFBvc1kgLSAocG9zaXRpb25ZICsgaGFsZkxlbmd0aClcblx0fSBlbHNlIGlmIChpc0Rvd24gJiYgKHZlbG9jaXR5LnkgPD0gMCkpIHtcblx0ICAgIGRpc3RhbmNlID0gKHBvc2l0aW9uWSAtIGhhbGZMZW5ndGgpIC0gc3VyZmFjZUhpdFBvc1lcblx0fSBlbHNlIGlmIChpc0xlZnQgJiYgKHZlbG9jaXR5LnggPj0gMCkgJiYgKHBvc2l0aW9uWCA8PSBzdXJmYWNlSGl0UG9zWCkpIHtcblx0ICAgIGRpc3RhbmNlID0gc3VyZmFjZUhpdFBvc1ggLSAocG9zaXRpb25YICsgaGFsZkxlbmd0aClcblx0fSBlbHNlIGlmIChpc1JpZ2h0ICYmICh2ZWxvY2l0eS54IDw9IDApICYmIChwb3NpdGlvblggPj0gc3VyZmFjZUhpdFBvc1gpKSB7XG5cdCAgICBkaXN0YW5jZSA9IChwb3NpdGlvblggLSBoYWxmTGVuZ3RoKSAtIHN1cmZhY2VIaXRQb3NYXG5cdH0gZWxzZSB7XG5cdCAgICByZXR1cm4gMTAwMDAwMFxuXHR9XG5cdHZhciB0aW1lID0gZGlzdGFuY2UgLyB2ZWxvY2l0eU1hZ25pdHVkZSBcblx0cmV0dXJuIE1hdGgubWF4KDAsIHRpbWUpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGUgPSBmdW5jdGlvbihwMSwgcDIpIHtcblx0cmV0dXJuIChwMS55IC0gcDIueSkgLyAocDIueCAtIHAxLngpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uYW5nbGUgPSBmdW5jdGlvbihwMSwgcDIpIHtcblx0cmV0dXJuIE1hdGguYXRhbjIocDEueSAtIHAyLnksIHAyLnggLSBwMS54KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yID0gZnVuY3Rpb24ocDEsIHAyKSB7XG5cdHZhciBzbG9wZSA9IHRoaXMuc2xvcGUocDEsIHAyKVxuXHRyZXR1cm4ge3g6IE1hdGguc2luKE1hdGguYXRhbihzbG9wZSkpLCB5OiBNYXRoLmNvcyhNYXRoLmF0YW4oc2xvcGUpKX1cbiAgICB9XG5cbiAgICAvLyBUaW1lciBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1RpbWVyQ29uc3RyYWludCh0aW1lcikge1xuXHR0aGlzLnRpbWVyID0gdGltZXJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lcihUaW1lciBUKSBzdGF0ZXMgdGhlIHN5c3RlbSBhZHZhbmNlcyBpdHMgcHNldWRvLXRpbWUgYnkgVCdzIHN0ZXAgc2l6ZSBhdCBlYWNoIGZyYW1lIGN5Y2xlLlwiIH1cblxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3RpbWVyOiAnVGltZXInfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludChTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lci5kdW1teSh4LCB5KSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wb3NlTmV4dFBzZXVkb1RpbWUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBwc2V1ZG9UaW1lICsgdGhpcy50aW1lci5zdGVwU2l6ZVxuICAgIH0gICAgXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiAwXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7fVxuICAgIH1cblxuICAgIC8vIFZhbHVlU2xpZGVyQ29uc3RyYWludCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1ZhbHVlU2xpZGVyQ29uc3RyYWludChzbGlkZXJQb2ludCwgeE9yWSwgc2xpZGVyWmVyb1ZhbHVlLCBzbGlkZXJSYW5nZUxlbmd0aCwgc2xpZGVkT2JqLCBzbGlkZWRQcm9wKSB7XG5cdHRoaXMuc2xpZGVyUG9pbnQgPSBzbGlkZXJQb2ludFxuXHR0aGlzLnhPclkgPSB4T3JZXG5cdHRoaXMuc2xpZGVyWmVyb1ZhbHVlID0gc2xpZGVyWmVyb1ZhbHVlXG5cdHRoaXMuc2xpZGVyUmFuZ2VMZW5ndGggPSBzbGlkZXJSYW5nZUxlbmd0aFxuXHR0aGlzLnNsaWRlZE9iaiA9IHNsaWRlZE9ialxuXHR0aGlzLnNsaWRlZFByb3AgPSBzbGlkZWRQcm9wXG5cdHRoaXMuc2xpZGVkT2JqUHJvcFplcm9WYWx1ZSA9IHNsaWRlZE9ialtzbGlkZWRQcm9wXVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7c2xpZGVyUG9pbnQ6ICdQb2ludCcsIHhPclk6ICdTdHJpbmcnLCBzbGlkZXJaZXJvVmFsdWU6ICdOdW1iZXInLCBzbGlkZXJSYW5nZUxlbmd0aDogJ051bWJlcicsIHNsaWRlZE9ialByb3BaZXJvVmFsdWU6ICdOdW1iZXInfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludChQb2ludC5kdW1teSh4LCB5KSwgJ3gnLCAwLCAxMDAsIHtmb286IDB9LCAnZm9vJylcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzbGlkZWRQcm9wID0gdGhpcy5zbGlkZWRQcm9wXG5cdHZhciBjdXJyU2xpZGVyRGlmZiA9ICh0aGlzLnNsaWRlclplcm9WYWx1ZSAtIHRoaXMuc2xpZGVyUG9pbnRbdGhpcy54T3JZXSkgLyB0aGlzLnNsaWRlclJhbmdlTGVuZ3RoXG5cdHZhciBzbGlkZWRPYmpQcm9wVGFyZ2V0ID0gKDEgKyBjdXJyU2xpZGVyRGlmZikgKiB0aGlzLnNsaWRlZE9ialByb3BaZXJvVmFsdWVcblx0cmV0dXJuIHNsaWRlZE9ialByb3BUYXJnZXQgLSB0aGlzLnNsaWRlZE9ialtzbGlkZWRQcm9wXVxuXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzb2xuID0ge31cblx0dmFyIHNsaWRlZFByb3AgPSB0aGlzLnNsaWRlZFByb3Bcblx0dmFyIGN1cnJTbGlkZXJEaWZmID0gKHRoaXMuc2xpZGVyWmVyb1ZhbHVlIC0gdGhpcy5zbGlkZXJQb2ludFt0aGlzLnhPclldKSAvIHRoaXMuc2xpZGVyUmFuZ2VMZW5ndGhcblx0dmFyIHNsaWRlZE9ialByb3BUYXJnZXQgPSAoMSArIGN1cnJTbGlkZXJEaWZmKSAqIHRoaXMuc2xpZGVkT2JqUHJvcFplcm9WYWx1ZVxuXHRzb2xuW3NsaWRlZFByb3BdID0gc2xpZGVkT2JqUHJvcFRhcmdldFxuXHR0aGlzLnNsaWRlclBvaW50LnNlbGVjdGlvbkluZGljZXNbMF0gPSBNYXRoLmZsb29yKDEwMCAqIGN1cnJTbGlkZXJEaWZmKVxuXHRyZXR1cm4ge3NsaWRlZE9iajogc29sbn1cbiAgICB9XG5cbiAgICAvLyBNb3Rpb24gQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19WZWxvY2l0eUNvbnN0cmFpbnQocG9zaXRpb24sIHZlbG9jaXR5KSB7XG5cdHRoaXMucG9zaXRpb24gPSBwb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50KFBvaW50IFBvcywgVmVjdG9yIFZlbG9jaXR5KSBzdGF0ZXMgUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cG9zaXRpb246ICdQb2ludCcsIHZlbG9jaXR5OiAnVmVjdG9yJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQoUG9pbnQuZHVtbXkoeCwgeSksIFNrZXRjaHBhZC5nZW9tLlZlY3Rvci5kdW1teSh4ICsgNTAsIHkgKyA1MCkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCBkdCkpLCB0aGlzLnBvc2l0aW9uKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSl9XG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0dmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKHRoaXMucG9zaXRpb24sIHRoaXMudmVsb2NpdHkpXHRcblx0dmFyIGxlbiA9IDUwXG5cdHZhciBwID0gcGx1cyh0aGlzLnBvc2l0aW9uLCB7eDogLXNsb3BlVi54ICogbGVuLCB5OiBzbG9wZVYueSAqIGxlbn0pXG5cdGNhbnZhcy5kcmF3QXJyb3codGhpcy5wb3NpdGlvbiwgcCwgb3JpZ2luLCAndicpXG4gICAgfVxuICAgIFxuICAgIC8vIEJvZHkgV2l0aCBWZWxvY2l0eSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19WZWxvY2l0eUNvbnN0cmFpbnQyKHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50MihQb2ludCBQb3MsIFBvaW50VmVjdG9yIFZlbG9jaXR5KSBzdGF0ZXMgUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3Bvc2l0aW9uOiAnUG9pbnQnLCB2ZWxvY2l0eTogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50MihQb2ludC5kdW1teSh4LCB5KSwgUG9pbnQuZHVtbXkoeCArIDUwLCB5ICsgNTApKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0UG9zaXRpb24gPSBzY2FsZWRCeSh0aGlzLnBvc2l0aW9uLCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiBwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5Lm1hZ25pdHVkZSgpLCBkdCkpfVxuICAgIH1cbiAgICBcbiAgICAvLyBBY2NlbGVyYXRpb24gQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fQWNjZWxlcmF0aW9uQ29uc3RyYWludCh2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuXHR0aGlzLmFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvblxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQoVmVjdG9yIFZlbG9jaXR5LCBWZWN0b3IgQWNjZWxlcmF0aW9uKSBzdGF0ZXMgVmVsb2NpdHkgPSBvbGQoVmVsb2NpdHkpICsgQWNjZWxlcmF0aW9uICogKHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZSkgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cG9zaXRpb246ICdQb2ludCcsIHZlbG9jaXR5OiAnVmVjdG9yJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludChTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIFNrZXRjaHBhZC5nZW9tLlZlY3Rvci5kdW1teSh4ICsgNTAsIHkgKyA1MCkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFZlbG9jaXR5ID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eSwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFZlbG9jaXR5LCBzY2FsZWRCeSh0aGlzLmFjY2VsZXJhdGlvbiwgZHQpKSwgdGhpcy52ZWxvY2l0eSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHt2ZWxvY2l0eTogcGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSl9XG4gICAgfVxuXG4gICAgLy8gQWlyIFJlc2lzdGFuY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0FpclJlc2lzdGFuY2VDb25zdHJhaW50KHZlbG9jaXR5LCBzY2FsZSkge1xuXHR0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHlcblx0dGhpcy5zY2FsZSA9IC1zY2FsZVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQoVmVjdG9yIFZlbG9jaXR5LCBOdW1iZXIgU2NhbGUpIHN0YXRlcyBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKiBTY2FsZSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7c2NhbGU6ICdOdW1iZXInLCB2ZWxvY2l0eTogJ1ZlY3Rvcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludChTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIC4xKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0VmVsb2NpdHkgPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHNjYWxlZEJ5KHRoaXMubGFzdFZlbG9jaXR5LCB0aGlzLnNjYWxlKSwgdGhpcy52ZWxvY2l0eSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpfVxuICAgIH1cblxuICAgIC8vICBCb3VuY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fQm91bmNlQ29uc3RyYWludChsZW5ndGgsIHBvc2l0aW9uLCB2ZWxvY2l0eSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpIHtcblx0dGhpcy5oYWxmTGVuZ3RoID0gbGVuZ3RoIC8gMlxuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG5cdHRoaXMuc3VyZmFjZVAxID0gc3VyZmFjZVAxXG5cdHRoaXMuc3VyZmFjZVAyID0gc3VyZmFjZVAyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludChOdW1iZXIgTCwgUG9pbnQgUG9zLCBWZWN0b3IgVmVsLCBQb2ludCBFbmQxLCBQb2ludCBFbmQyKSBzdGF0ZXMgdGhhdCB0aGUgYm9keSB3aXRoIGRpYW1ldGVyIEwgYW5kIHBvc2l0aW9uIFBvcyBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbCBpcyBnb2luZyB0byBib3VuY2Ugb2ZmIHRoZSBsaW5lIHdpdGggdHdvIGVuZCBwb2ludHMgRW5kMSAmIEVuZDIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtoYWxmTGVuZ3RoOiAnTnVtYmVyJywgcG9zaXRpb246ICdQb2ludCcsIHZlbG9jaXR5OiAnVmVjdG9yJywgc3VyZmFjZVAxOiAnUG9pbnQnLCBzdXJmYWNlUDI6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQoMTAsIFBvaW50LmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIFBvaW50LmR1bW15KHgsIHkpLCBQb2ludC5kdW1teSh4LCB5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wb3NlTmV4dFBzZXVkb1RpbWUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lKSB7XG5cdHZhciByZXMgPSBwc2V1ZG9UaW1lICsgU2tldGNocGFkLnNpbXVsYXRpb24uY29tcHV0ZUNvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCB0aGlzLnBvc2l0aW9uLCB0aGlzLnZlbG9jaXR5LCB0aGlzLnN1cmZhY2VQMSwgdGhpcy5zdXJmYWNlUDIpXG5cdHRoaXMudGNvbnRhY3QgPSByZXM7XG5cdHJldHVybiByZXNcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb25cblx0dmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eVxuXHR2YXIgc3VyZmFjZVAxID0gdGhpcy5zdXJmYWNlUDFcblx0dmFyIHN1cmZhY2VQMiA9IHRoaXMuc3VyZmFjZVAyXG4gICAgICAgIC8vU2tldGNocGFkLnNpbXVsYXRpb24uZGV0ZWN0Q29udGFjdCh0aGlzLmhhbGZMZW5ndGgsIHBvc2l0aW9uLCB2ZWxvY2l0eSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpKSB7XG5cdGlmICh0aGlzLnRjb250YWN0ID09IHBzZXVkb1RpbWUpIHsgXG5cdCAgICB0aGlzLnRjb250YWN0ID0gdW5kZWZpbmVkXG5cdCAgICB2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0ICAgIHZhciBzbG9wZSA9IChzdXJmYWNlUDIueSAtIHN1cmZhY2VQMS55KSAvIChzdXJmYWNlUDIueCAtIHN1cmZhY2VQMS54KVxuXHQgICAgdmFyIHN1cmZhY2VIaXRQb3NYID0gc3VyZmFjZVAyLnkgPT0gc3VyZmFjZVAxLnkgPyBwb3NpdGlvbi54IDogKChwb3NpdGlvbi55IC0gc3VyZmFjZVAxLnkpIC8gc2xvcGUpICsgc3VyZmFjZVAxLnhcblx0ICAgIHZhciBzdXJmYWNlSGl0UG9zWSA9IHN1cmZhY2VQMi54ID09IHN1cmZhY2VQMS54ID8gcG9zaXRpb24ueSA6ICgocG9zaXRpb24ueCAtIHN1cmZhY2VQMS54KSAqIHNsb3BlKSArIHN1cmZhY2VQMS55XG5cdCAgICB2YXIgc3VyZmFjZUFuZ2xlID0gU2tldGNocGFkLnNpbXVsYXRpb24uYW5nbGUoc3VyZmFjZVAxLCBzdXJmYWNlUDIpXG5cdCAgICB2YXIgdmVsb2NpdHlBbmdsZSA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLmFuZ2xlKHt4OiAwLCB5OiAwfSwgdmVsb2NpdHkpXG5cdCAgICB2YXIgcmVmbGVjdGlvbkFuZ2xlID0gc3VyZmFjZUFuZ2xlIC0gdmVsb2NpdHlBbmdsZSBcblx0ICAgIHZhciB2ZWxvY2l0eU1hZ25pdHVkZSA9IE1hdGguc3FydCgodmVsb2NpdHkueCAqIHZlbG9jaXR5LngpICsgKHZlbG9jaXR5LnkgKiB2ZWxvY2l0eS55KSlcblx0ICAgIHZhciBhbmdsZUMgPSBNYXRoLmNvcyhyZWZsZWN0aW9uQW5nbGUpXG5cdCAgICB2YXIgYW5nbGVTID0gTWF0aC5zaW4ocmVmbGVjdGlvbkFuZ2xlKVxuXHQgICAgdmFyIHggPSBhbmdsZUMgKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIDFcblx0ICAgIHZhciB5ID0gYW5nbGVTICogdmVsb2NpdHlNYWduaXR1ZGUgKiAtMVxuXHQgICAgdGhpcy5ib3VuY2VWZWxvY2l0eSA9IHNjYWxlZEJ5KHt4OiB4LCB5OiB5fSwgMSlcblx0ICAgIHZhciBzbG9wZVYgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZVZlY3RvcihzdXJmYWNlUDEsIHN1cmZhY2VQMilcblx0ICAgIHZhciBkZWx0YVBvc1ggPSBzbG9wZVYueCAqIHZlbG9jaXR5TWFnbml0dWRlICogZHRcblx0ICAgIHZhciBkZWx0YVBvc1kgPSBzbG9wZVYueSAqIC12ZWxvY2l0eU1hZ25pdHVkZSAqIGR0XG5cdCAgICB0aGlzLmJvdW5jZVBvc2l0aW9uID0ge3g6IHBvc2l0aW9uLnggKyBkZWx0YVBvc1gsIHk6IHBvc2l0aW9uLnkgKyBkZWx0YVBvc1l9XG5cblx0ICAgIC8vIEhBQ0sgRklYTUU/IHNldCB2ZWxvY2l0eSBhdG9taWNhbGx5IHJpZ2h0IGhlcmUhIVxuXHQgICAgLy90aGlzLmNvbnRhY3QgPSB0cnVlXG5cdCAgICB2ZWxvY2l0eS54ID0gdGhpcy5ib3VuY2VWZWxvY2l0eS54XG5cdCAgICB2ZWxvY2l0eS55ID0gdGhpcy5ib3VuY2VWZWxvY2l0eS55XG5cdCAgICBwb3NpdGlvbi54ID0gdGhpcy5ib3VuY2VQb3NpdGlvbi54XG5cdCAgICBwb3NpdGlvbi55ID0gdGhpcy5ib3VuY2VQb3NpdGlvbi55XG5cblx0fSBlbHNlXG5cdCAgICB0aGlzLmNvbnRhY3QgPSBmYWxzZVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdC8qXG5cdCAgdmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eVxuXHQgIHZhciBzdXJmYWNlUDEgPSB0aGlzLnN1cmZhY2VQMVxuXHQgIHZhciBzdXJmYWNlUDIgPSB0aGlzLnN1cmZhY2VQMlxuXHQgIHJldHVybiB0aGlzLmNvbnRhY3QgPyAoXG5cdCAgbWFnbml0dWRlKG1pbnVzKHRoaXMuYm91bmNlVmVsb2NpdHksIHRoaXMudmVsb2NpdHkpKSBcblx0ICArIG1hZ25pdHVkZShtaW51cyh0aGlzLmJvdW5jZVBvc2l0aW9uLCB0aGlzLnBvc2l0aW9uKSkgXG5cdCAgKSA6IDBcblx0Ki9cblx0cmV0dXJuIDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdC8qXG5cdCAgdmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdCAgcmV0dXJuIHt2ZWxvY2l0eTogXG5cdCAgbWludXMocGx1cyh0aGlzLmJvdW5jZVZlbG9jaXR5LCBzY2FsZWRCeSh7eDogMCwgeTogLVNrZXRjaHBhZC5zaW11bGF0aW9uLmd9LCBkdCkpLCB0aGlzLnZlbG9jaXR5KSxcblx0ICBwb3NpdGlvbjogKG1pbnVzKHRoaXMuYm91bmNlUG9zaXRpb24sIHRoaXMucG9zaXRpb24pKVxuXHQgIH1cblx0Ki9cblx0cmV0dXJuIHt9XG4gICAgfVxuXG4gICAgLy8gIEhpdFN1cmZhY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0hpdFN1cmZhY2VDb25zdHJhaW50KGxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikge1xuXHR0aGlzLmhhbGZMZW5ndGggPSBsZW5ndGggLyAyXG5cdHRoaXMucG9zaXRpb24gPSBwb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHlcblx0dGhpcy5zdXJmYWNlUDEgPSBzdXJmYWNlUDFcblx0dGhpcy5zdXJmYWNlUDIgPSBzdXJmYWNlUDJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50KE51bWJlciBMLCBQb2ludCBQb3MsIFZlY3RvciBWZWwsIFBvaW50IEVuZDEsIFBvaW50IEVuZDIpIHN0YXRlcyB0aGF0IHRoZSBib2R5IHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIHN0YXkgb24gdGhlIGxpbmUgd2l0aCB0d28gZW5kIHBvaW50cyBFbmQxICYgRW5kMi5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtoYWxmTGVuZ3RoOiAnTnVtYmVyJywgcG9zaXRpb246ICdQb2ludCcsIHZlbG9jaXR5OiAnVmVjdG9yJywgc3VyZmFjZVAxOiAnUG9pbnQnLCBzdXJmYWNlUDI6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludCgxMCwgUG9pbnQuZHVtbXkoeCwgeSksIFNrZXRjaHBhZC5nZW9tLlZlY3Rvci5kdW1teSh4LCB5KSwgUG9pbnQuZHVtbXkoeCwgeSksIFBvaW50LmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb25cblx0dmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eVxuXHR2YXIgc3VyZmFjZVAxID0gdGhpcy5zdXJmYWNlUDFcblx0dmFyIHN1cmZhY2VQMiA9IHRoaXMuc3VyZmFjZVAyXG5cdGlmIChTa2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikpIHtcblx0ICAgIHRoaXMuY29udGFjdCA9IHRydWVcblx0ICAgIHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHQgICAgdmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKHN1cmZhY2VQMSwgc3VyZmFjZVAyKVxuXHQgICAgdGhpcy5oaXRWZWxvY2l0eSA9IHNjYWxlZEJ5KHt4OiAwLCB5OiAtU2tldGNocGFkLnNpbXVsYXRpb24uZ30sIGR0KVxuXHQgICAgdmFyIHZlbG9jaXR5TWFnbml0dWRlID0gTWF0aC5zcXJ0KCh2ZWxvY2l0eS54ICogdmVsb2NpdHkueCkgKyAodmVsb2NpdHkueSAqIHZlbG9jaXR5LnkpKVxuXHQgICAgZGVsdGFQb3NYID0gc2xvcGVWLnggKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIGR0XG5cdCAgICBkZWx0YVBvc1kgPSBzbG9wZVYueSAqIC12ZWxvY2l0eU1hZ25pdHVkZSAqIGR0XG5cdCAgICB0aGlzLmhpdFBvc2l0aW9uID0ge3g6IHBvc2l0aW9uLnggKyBkZWx0YVBvc1gsIHk6IHBvc2l0aW9uLnkgKyBkZWx0YVBvc1l9XG5cdH0gZWxzZVxuXHQgICAgdGhpcy5jb250YWN0ID0gZmFsc2VcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB0aGlzLmNvbnRhY3QgPyAoXG5cdCAgICBtYWduaXR1ZGUobWludXModGhpcy5oaXRWZWxvY2l0eSwgdGhpcy52ZWxvY2l0eSkpICsgXG5cdFx0bWFnbml0dWRlKG1pbnVzKHRoaXMuaGl0UG9zaXRpb24sIHRoaXMucG9zaXRpb24pKSBcblx0KSA6IDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge3ZlbG9jaXR5OiB0aGlzLmhpdFZlbG9jaXR5LCBwb3NpdGlvbjogdGhpcy5oaXRQb3NpdGlvbn1cbiAgICB9XG5cbiAgICAvLyBDb252ZXlvciBCZWx0IENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0NvbnZleW9yQmVsdENvbnN0cmFpbnQobGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIGJlbHQpIHtcblx0dGhpcy5oYWxmTGVuZ3RoID0gbGVuZ3RoIC8gMlxuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG5cdHRoaXMuYmVsdCA9IGJlbHRcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50KE51bWJlciBMLCBQb2ludCBQb3MsIFZlY3RvciBWZWwsIENvbnZleW9yQmVsdCBCZWx0KSBzdGF0ZXMgdGhhdCB0aGUgYm9keSB3aXRoIGRpYW1ldGVyIEwgYW5kIHBvc2l0aW9uIFBvcyBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbCBpcyBnb2luZyB0byBsYW5kIGFuZCBtb3ZlIGJhc2VkIG9uIHRoZSBjb252ZXlvciBiZWx0IEJlbHQncyB2ZWxvY2l0eS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2hhbGZMZW5ndGg6ICdOdW1iZXInLCBwb3NpdGlvbjogJ1BvaW50JywgdmVsb2NpdHk6ICdWZWN0b3InLCBiZWx0OiAnQmVsdCd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQoMTAsIFBvaW50LmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIEJlbHQuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdHZhciBiZWx0ID0gdGhpcy5iZWx0XG5cdHZhciBiZWx0UDEgPSBiZWx0LnBvc2l0aW9uMVxuXHR2YXIgYmVsdFAyID0gYmVsdC5wb3NpdGlvbjJcblx0dmFyIGJlbHRTcGVlZCA9IGJlbHQuc3BlZWRcblx0aWYgKFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCB0aGlzLnBvc2l0aW9uLCB2ZWxvY2l0eSwgYmVsdFAxLCBiZWx0UDIpKSB7XG5cdCAgICB0aGlzLmNvbnRhY3QgPSB0cnVlXG5cdCAgICB2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3IoYmVsdFAxLCBiZWx0UDIpXG5cdCAgICB0aGlzLnRhcmdldFZlbG9jaXR5ID0ge3g6IHZlbG9jaXR5LnggKyAoLXNsb3BlVi55ICogYmVsdFNwZWVkKSwgeTogdmVsb2NpdHkueSArIChzbG9wZVYueCAqIGJlbHRTcGVlZCl9XG5cdH0gZWxzZVxuXHQgICAgdGhpcy5jb250YWN0ID0gZmFsc2VcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGJlbHQgPSB0aGlzLmJlbHRcblx0dmFyIGJlbHRQMSA9IGJlbHQucG9zaXRpb24xXG5cdHZhciBiZWx0UDIgPSBiZWx0LnBvc2l0aW9uMlxuXHRyZXR1cm4gKFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCB0aGlzLnBvc2l0aW9uLCB0aGlzLnZlbG9jaXR5LCBiZWx0UDEsIGJlbHRQMikpID8gMSA6IDBcdFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB0aGlzLmNvbnRhY3QgPyBtYWduaXR1ZGUobWludXModGhpcy50YXJnZXRWZWxvY2l0eSwgdGhpcy52ZWxvY2l0eSkpIDogMFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogdGhpcy50YXJnZXRWZWxvY2l0eX1cbiAgICB9XG5cbiAgICAvLyBOb092ZXJsYXAgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fTm9PdmVybGFwQ29uc3RyYWludChsZW5ndGgxLCBwb3NpdGlvbjEsIHZlbG9jaXR5MSwgbGVuZ3RoMiwgcG9zaXRpb24yLCB2ZWxvY2l0eTIpIHtcblx0dGhpcy5sZW5ndGgxID0gbGVuZ3RoMVxuXHR0aGlzLnBvc2l0aW9uMSA9IHBvc2l0aW9uMVxuXHR0aGlzLnZlbG9jaXR5MSA9IHZlbG9jaXR5MVxuXHR0aGlzLmxlbmd0aDIgPSBsZW5ndGgyXG5cdHRoaXMucG9zaXRpb24yID0gcG9zaXRpb24yXG5cdHRoaXMudmVsb2NpdHkyID0gdmVsb2NpdHkyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludChOdW1iZXIgTDEsIFBvaW50IFBvczEsIFZlY3RvciBWZWwxLCBOdW1iZXIgTDIsIFBvaW50IFBvczIsIFZlY3RvciBWZWwyKSBzdGF0ZXMgdGhhdCB0aGUgYm9keSB3aXRoIGRpYW1ldGVyIEwxIGFuZCBwb3NpdGlvbiBQb3MxIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsMSBhbmQgdGhlIGJvZHkgd2l0aCBkaWFtZXRlciBMMiBhbmQgcG9zaXRpb24gUG9zMiBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbDIgd2lsbCBwdXNoIGVhY2ggb3RoZXIgaWYgdG91Y2hpbmcuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtsZW5ndGgxOiAnTnVtYmVyJywgcG9zaXRpb24xOiAnUG9pbnQnLCB2ZWxvY2l0eTE6ICdWZWN0b3InLCBsZW5ndGgyOiAnTnVtYmVyJywgcG9zaXRpb24yOiAnUG9pbnQnLCB2ZWxvY2l0eTI6ICdWZWN0b3InfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50KDEwLCBQb2ludC5kdW1teSh4LCB5KSwgU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHgsIHkpLCAxMCwgUG9pbnQuZHVtbXkoeCwgeSksIFNrZXRjaHBhZC5nZW9tLlZlY3Rvci5kdW1teSh4LCB5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbGVuZ3RoMSA9IHRoaXMubGVuZ3RoMVxuXHR2YXIgcG9zaXRpb24xID0gdGhpcy5wb3NpdGlvbjFcblx0dmFyIHZlbG9jaXR5MSA9IHRoaXMudmVsb2NpdHkxXG5cdHZhciBsZW5ndGgyID0gdGhpcy5sZW5ndGgyXG5cdHZhciBwb3NpdGlvbjIgPSB0aGlzLnBvc2l0aW9uMlxuXHR2YXIgcDF4ID0gcG9zaXRpb24xLngsIHAxeSA9IHBvc2l0aW9uMS55XG5cdHZhciBwMnggPSBwb3NpdGlvbjIueCwgcDJ5ID0gcG9zaXRpb24yLnlcblx0cmV0dXJuICgocDF4ID4gcDJ4IC0gbGVuZ3RoMiAvIDIgJiYgcDF4IDwgcDJ4ICsgbGVuZ3RoMikgJiZcblx0XHQocDF5ID4gcDJ5IC0gbGVuZ3RoMiAvIDIgJiYgcDF5IDwgcDJ5ICsgbGVuZ3RoMikpID8gMSA6IDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsZW5ndGgxID0gdGhpcy5sZW5ndGgxXG5cdHZhciBwb3NpdGlvbjEgPSB0aGlzLnBvc2l0aW9uMVxuXHR2YXIgdmVsb2NpdHkxID0gdGhpcy52ZWxvY2l0eTFcblx0dmFyIGxlbmd0aDIgPSB0aGlzLmxlbmd0aDJcblx0dmFyIHBvc2l0aW9uMiA9IHRoaXMucG9zaXRpb24yXG5cdHZhciBwMXggPSBwb3NpdGlvbjEueFxuXHR2YXIgcDJ4ID0gcG9zaXRpb24yLnhcblx0dmFyIHNvbG4gPSBwMXggPiBwMnggPyB7cG9zaXRpb24yOiB7eDogcDF4IC0gKGxlbmd0aDIpfX0gOiB7cG9zaXRpb24xOiB7eDogcDJ4IC0gKGxlbmd0aDEpfX1cblx0cmV0dXJuIHNvbG5cbiAgICB9XG5cbiAgICAvLyAgU3ByaW5nIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1NwcmluZ0NvbnN0cmFpbnQocG9zaXRpb24xLCB2ZWxvY2l0eTEsIGFjY2VsZXJhdGlvbjEsIG1hc3MxLCBwb3NpdGlvbjIsIHZlbG9jaXR5MiwgYWNjZWxlcmF0aW9uMiwgbWFzczIsIHNwcmluZykge1xuXHR0aGlzLnBvc2l0aW9uMSA9IHBvc2l0aW9uMVxuXHR0aGlzLnZlbG9jaXR5MSA9IHZlbG9jaXR5MVxuXHR0aGlzLmFjY2VsZXJhdGlvbjEgPSBhY2NlbGVyYXRpb24xXG5cdHRoaXMubWFzczEgPSBtYXNzMVxuXHR0aGlzLnBvc2l0aW9uMiA9IHBvc2l0aW9uMlxuXHR0aGlzLnZlbG9jaXR5MiA9IHZlbG9jaXR5MlxuXHR0aGlzLmFjY2VsZXJhdGlvbjIgPSBhY2NlbGVyYXRpb24yXG5cdHRoaXMubWFzczIgPSBtYXNzMlxuXHR0aGlzLnNwcmluZyA9IHNwcmluZ1xuXHR0aGlzLl9sYXN0VmVsb2NpdGllcyA9IFt1bmRlZmluZWQsIHVuZGVmaW5lZF1cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50KFBvaW50IFBvczEsIFZlY3RvciBWZWwxLCBWZWN0b3IgQWNjMSwgTnVtYmVyIE1hc3MxLCBQb2ludCBQb3MyLCBWZWN0b3IgVmVsMiwgVmVjdG9yIEFjYzIsIE51bWJlciBNYXNzMiwgU3ByaW5nIFMpIHN0YXRlcyB0aGF0IHNwcmluZyBTIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHR3byBib2RpZXMgd2l0aCBwb3NpdGlvbnMsIHZlbG9jaXRpZXMsIGFjY2VsZXJhdGlvbnMsIGFuZCBtYXNzZXMgb2YgcmVzcGVjdGl2ZWx5IFBvczEsIFBvczIsIFZlbDEsIFZlbDIsIEFjYzEsIEFjYzIsIE1hc3MxLCBNYXNzMi4gXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwb3NpdGlvbjE6ICdQb2ludCcsIHZlbG9jaXR5MTogJ1ZlY3RvcicsIGFjY2VsZXJhdGlvbjE6ICdWZWN0b3InLCBtYXNzMTogJ051bWJlcicsIHBvc2l0aW9uMjogJ1BvaW50JywgdmVsb2NpdHkyOiAnVmVjdG9yJywgYWNjZWxlcmF0aW9uMjogJ1ZlY3RvcicsIG1hc3MyOiAnTnVtYmVyJywgc3ByaW5nOiAnU3ByaW5nJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludChQb2ludC5kdW1teSh4LCB5KSwgU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIDAsIFBvaW50LmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIFNrZXRjaHBhZC5nZW9tLlZlY3Rvci5kdW1teSh4LCB5KSwgMTAsIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5kdW1teSh4LCB5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5fbGFzdFZlbG9jaXRpZXNbMF0gPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5MSwgMSlcblx0dGhpcy5fbGFzdFZlbG9jaXRpZXNbMV0gPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5MiwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3ByaW5nID0gdGhpcy5zcHJpbmdcblx0aWYgKHNwcmluZy50b3JuKSB7XG5cdCAgICByZXR1cm4gMFxuXHR9XG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHR2YXIgZXJyID0gMFxuXHRmb3IgKHZhciBpID0gMDsgaSA8PSAxOyBpKyspIHtcblx0ICAgIHZhciBqID0gKGkgKyAxKSAlIDJcblx0ICAgIHZhciBtYXNzID0gbWFzc2VzW2pdXG5cdCAgICB2YXIgZCA9IHt4OiAwLCB5OiAwfVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFx0XHRcblx0XHR2YXIgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHBvc2l0aW9uWDEgPSBwb3NpdGlvbjEueFxuXHRcdHZhciBwb3NpdGlvblkxID0gcG9zaXRpb24xLnlcblx0XHR2YXIgcG9zaXRpb25YMiA9IHBvc2l0aW9uMi54XG5cdFx0dmFyIHBvc2l0aW9uWTIgPSBwb3NpdGlvbjIueVxuXHRcdHZhciBzbG9wZSA9IE1hdGguYWJzKE1hdGguYXRhbigocG9zaXRpb25ZMiAtIHBvc2l0aW9uWTEpIC8gKHBvc2l0aW9uWDIgLSBwb3NpdGlvblgxKSkpXG5cdFx0dmFyIHNwcmluZ0N1cnJMZW4gPSBNYXRoLnNxcnQoKChwb3NpdGlvblgxIC0gcG9zaXRpb25YMikgKiAocG9zaXRpb25YMSAtIHBvc2l0aW9uWDIpKSArICgocG9zaXRpb25ZMSAtIHBvc2l0aW9uWTIpICogKHBvc2l0aW9uWTEgLSBwb3NpdGlvblkyKSkpXG5cdFx0dmFyIHN0cmV0Y2hMZW4gPSAgc3ByaW5nQ3VyckxlbiAtIHNwcmluZy5sZW5ndGhcblx0XHR2YXIgbmV3QWNjZWxlcmF0aW9uTWFnMiA9IHNwcmluZy5rICogc3RyZXRjaExlbiAvIG1hc3Ncblx0XHR2YXIgZGlyZWN0aW9uWCA9IHBvc2l0aW9uWDIgPj0gcG9zaXRpb25YMSA/IC0xIDogMVxuXHRcdHZhciBkaXJlY3Rpb25ZID0gcG9zaXRpb25ZMiA+PSBwb3NpdGlvblkxID8gLTEgOiAxXG5cdFx0dmFyIGFjYyA9IHt4OiBuZXdBY2NlbGVyYXRpb25NYWcyICogTWF0aC5jb3Moc2xvcGUpICogZGlyZWN0aW9uWCwgeTogbmV3QWNjZWxlcmF0aW9uTWFnMiAqIE1hdGguc2luKHNsb3BlKSAqIGRpcmVjdGlvbll9XG5cdFx0ZXJyICs9IG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMuX2xhc3RWZWxvY2l0aWVzW2pdLCBzY2FsZWRCeShhY2MsIGR0KSksIHZlbG9jaXRpZXNbal0pKVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiBlcnJcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzb2xuID0ge31cblx0dmFyIHNwcmluZyA9IHRoaXMuc3ByaW5nXG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRmb3IgKHZhciBpID0gMDsgaSA8PSAxOyBpKyspIHtcblx0ICAgIHZhciBqID0gKGkgKyAxKSAlIDJcblx0ICAgIHZhciBtYXNzID0gbWFzc2VzW2pdXG5cdCAgICB2YXIgZCA9IHt4OiAwLCB5OiAwfVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFx0XHRcblx0XHR2YXIgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHBvc2l0aW9uWDEgPSBwb3NpdGlvbjEueFxuXHRcdHZhciBwb3NpdGlvblkxID0gcG9zaXRpb24xLnlcblx0XHR2YXIgcG9zaXRpb25YMiA9IHBvc2l0aW9uMi54XG5cdFx0dmFyIHBvc2l0aW9uWTIgPSBwb3NpdGlvbjIueVxuXHRcdHZhciBzbG9wZSA9IE1hdGguYWJzKE1hdGguYXRhbigocG9zaXRpb25ZMiAtIHBvc2l0aW9uWTEpIC8gKHBvc2l0aW9uWDIgLSBwb3NpdGlvblgxKSkpXG5cdFx0dmFyIHNwcmluZ0N1cnJMZW4gPSBNYXRoLnNxcnQoKChwb3NpdGlvblgxIC0gcG9zaXRpb25YMikgKiAocG9zaXRpb25YMSAtIHBvc2l0aW9uWDIpKSArICgocG9zaXRpb25ZMSAtIHBvc2l0aW9uWTIpICogKHBvc2l0aW9uWTEgLSBwb3NpdGlvblkyKSkpXG5cdFx0dmFyIHN0cmV0Y2hMZW4gPSAgc3ByaW5nQ3VyckxlbiAtIHNwcmluZy5sZW5ndGhcblx0XHQvLyBpZiBub3QgdG9ybiBhcGFydC4uLlxuXHRcdGlmIChzdHJldGNoTGVuIDwgc3ByaW5nLnRlYXJQb2ludEFtb3VudCkge1xuXHRcdCAgICB2YXIgbmV3QWNjZWxlcmF0aW9uTWFnMiA9IHNwcmluZy5rICogc3RyZXRjaExlbiAvIG1hc3Ncblx0XHQgICAgdmFyIGRpcmVjdGlvblggPSBwb3NpdGlvblgyID49IHBvc2l0aW9uWDEgPyAtMSA6IDFcblx0XHQgICAgdmFyIGRpcmVjdGlvblkgPSBwb3NpdGlvblkyID49IHBvc2l0aW9uWTEgPyAtMSA6IDFcblx0XHQgICAgdmFyIGFjYyA9IHt4OiBuZXdBY2NlbGVyYXRpb25NYWcyICogTWF0aC5jb3Moc2xvcGUpICogZGlyZWN0aW9uWCwgeTogbmV3QWNjZWxlcmF0aW9uTWFnMiAqIE1hdGguc2luKHNsb3BlKSAqIGRpcmVjdGlvbll9XG5cdFx0ICAgIGQgPSBwbHVzKHRoaXMuX2xhc3RWZWxvY2l0aWVzW2pdLCBzY2FsZWRCeShhY2MsIGR0KSlcblx0XHR9IGVsc2Uge1xuXHRcdCAgICBzb2xuWydzcHJpbmcnXSA9IHt0b3JuOiB0cnVlfVxuXHRcdH1cblx0ICAgIH1cblx0ICAgIHNvbG5bJ3ZlbG9jaXR5JyArIChqKzEpXSA9IGRcblx0fVx0XG5cdHJldHVybiBzb2xuXG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsM0RHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGdlb21ldHJpYyBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gICAgLy8gb2JqZWN0cyB0aGF0IGhhdmUgeCBhbmQgeSBwcm9wZXJ0aWVzLiBPdGhlciBwcm9wZXJ0aWVzIGFyZSBpZ25vcmVkLlxuXG4gICAgU2tldGNocGFkLmdlb20zZCA9IHt9XG5cbiAgICB2YXIgc3F1YXJlID0gU2tldGNocGFkLmdlb20uc3F1YXJlXG5cbiAgICBmdW5jdGlvbiBwbHVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggKyBwMi54LCB5OiBwMS55ICsgcDIueSwgejogcDEueiArIHAyLnp9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIG1pbnVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggLSBwMi54LCB5OiBwMS55IC0gcDIueSwgejogcDEueiAtIHAyLnp9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbGVkQnkocCwgbSkge1xuXHRyZXR1cm4ge3g6IHAueCAqIG0sIHk6IHAueSAqIG0sIHo6IHAueiAqIG19XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29weShwKSB7XG5cdHJldHVybiBzY2FsZWRCeShwLCAxKVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBtaWRwb2ludChwMSwgcDIpIHtcblx0cmV0dXJuIHNjYWxlZEJ5KHBsdXMocDEsIHAyKSwgMC41KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hZ25pdHVkZShwKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAueCkgKyBzcXVhcmUocC55KSArIHNxdWFyZShwLnopKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZWQocCkge1xuXHR2YXIgbSA9IG1hZ25pdHVkZShwKVxuXHRyZXR1cm4gbSA+IDAgPyBzY2FsZWRCeShwLCAxIC8gbSkgOiBwXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzdGFuY2UocDEsIHAyKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAxLnggLSBwMi54KSArIHNxdWFyZShwMS55IC0gcDIueSkgKyBzcXVhcmUocDEueiAtIHAyLnopKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJvdGF0ZWRCeShwLCBkVGhldGEpIHtcblx0dmFyIGMgPSBNYXRoLmNvcyhkVGhldGEpXG5cdHZhciBzID0gTWF0aC5zaW4oZFRoZXRhKVxuXHRyZXR1cm4ge3g6IGMqcC54IC0gcypwLnksIHk6IHMqcC54ICsgYypwLnksIHo6IHAuen1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByb3RhdGVkQXJvdW5kKHAsIGRUaGV0YSwgYXhpcykge1xuXHRyZXR1cm4gcGx1cyhheGlzLCByb3RhdGVkQnkobWludXMocCwgYXhpcyksIGRUaGV0YSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0RGVsdGEoZCwgcCwgc2NhbGUpIHtcblx0ZC54ID0gcC54ICogc2NhbGVcblx0ZC55ID0gcC55ICogc2NhbGVcblx0ZC56ID0gcC56ICogc2NhbGVcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLnBsdXMgPSBwbHVzXG4gICAgU2tldGNocGFkLmdlb20zZC5taW51cyA9IG1pbnVzXG4gICAgU2tldGNocGFkLmdlb20zZC5zY2FsZWRCeSA9IHNjYWxlZEJ5XG4gICAgU2tldGNocGFkLmdlb20zZC5jb3B5ID0gY29weVxuICAgIFNrZXRjaHBhZC5nZW9tM2QubWlkcG9pbnQgPSBtaWRwb2ludFxuICAgIFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlID0gbWFnbml0dWRlXG4gICAgU2tldGNocGFkLmdlb20zZC5ub3JtYWxpemVkID0gbm9ybWFsaXplZFxuICAgIFNrZXRjaHBhZC5nZW9tM2QuZGlzdGFuY2UgPSBkaXN0YW5jZVxuICAgIFNrZXRjaHBhZC5nZW9tM2Qucm90YXRlZEJ5ID0gcm90YXRlZEJ5XG4gICAgU2tldGNocGFkLmdlb20zZC5yb3RhdGVkQXJvdW5kID0gcm90YXRlZEFyb3VuZFxuICAgIFNrZXRjaHBhZC5nZW9tM2Quc2V0RGVsdGEgPSBzZXREZWx0YVxuXG4gICAgLy8gTW90b3IgY29uc3RyYWludCAtIGNhdXNlcyBQMSBhbmQgUDIgdG8gb3JiaXQgdGhlaXIgbWlkcG9pbnQgYXQgdGhlIGdpdmVuIHJhdGUuXG4gICAgLy8gdyBpcyBpbiB1bml0cyBvZiBIeiAtIHdob2xlIHJvdGF0aW9ucyBwZXIgc2Vjb25kLlxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX01vdG9yQ29uc3RyYWludChwMSwgcDIsIHcpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLncgPSB3XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tM2QuTW90b3JDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBXKSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlIG9mIHcsIGluIHVuaXRzIG9mIEh6OiB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cIiB9IFxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCB3OiAnTnVtYmVyJ31cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQobC5wMSwgbC5wMiwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIDFcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdCA9IChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC8gMTAwMC4wXG5cdHZhciBkVGhldGEgPSB0ICogdGhpcy53ICogKDIgKiBNYXRoLlBJKVxuXHR2YXIgbTEyID0gbWlkcG9pbnQodGhpcy5wMSwgdGhpcy5wMilcblx0cmV0dXJuIHtwMTogcm90YXRlZEFyb3VuZCh0aGlzLnAxLCBkVGhldGEsIG0xMiksXG5cdFx0cDI6IHJvdGF0ZWRBcm91bmQodGhpcy5wMiwgZFRoZXRhLCBtMTIpfVxuICAgIH1cbiAgICAgICAgXG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbDNER2VvbWV0cmljQ29uc3RyYWludHNcbiIsImZ1bmN0aW9uIGluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIHNpbXVsYXRpb24gY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZCA9IHsgZzogOS44IH1cblxuICAgIHZhciBtaW51cyA9IFNrZXRjaHBhZC5nZW9tM2QubWludXNcbiAgICB2YXIgcGx1cyA9IFNrZXRjaHBhZC5nZW9tM2QucGx1c1xuICAgIHZhciBzY2FsZWRCeSA9IFNrZXRjaHBhZC5nZW9tM2Quc2NhbGVkQnlcbiAgICB2YXIgbWFnbml0dWRlID0gU2tldGNocGFkLmdlb20zZC5tYWduaXR1ZGVcbiAgICB2YXIgZGlzdGFuY2UgPSBTa2V0Y2hwYWQuZ2VvbTNkLmRpc3RhbmNlXG5cbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50c1xuIiwiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEltcG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyA9IHJlcXVpcmUoJy4vMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzJkL2dlb21ldHJpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8yZC9zaW11bGF0aW9uLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxudmFyIGluc3RhbGwzREdlb21ldHJpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMnKS5pbnN0YWxsXG52YXIgaW5zdGFsbDNEU2ltdWxhdGlvbkNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8zZC9zaW11bGF0aW9uLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gR2xvYmFsIE1lc3N5IFN0dWZmXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgX19pZEN0ciA9IDFcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19pZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoJ19fX2lkJykpXG5cdCAgICB0aGlzLl9fX2lkID0gX19pZEN0cisrXG5cdHJldHVybiB0aGlzLl9fX2lkXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX190eXBlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fdHlwZScpKVxuXHQgICAgdGhpcy5fX190eXBlID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLnJlcGxhY2UoL19fL2csICcuJylcblx0cmV0dXJuIHRoaXMuX19fdHlwZVxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fc2hvcnRUeXBlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdHZhciByZXMgPSB0aGlzLl9fdHlwZVxuXHRyZXR1cm4gcmVzLnN1YnN0cmluZyhyZXMubGFzdEluZGV4T2YoJy4nKSArIDEpXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX190b1N0cmluZycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fX3Nob3J0VHlwZSArICdAJyArIHRoaXMuX19pZFxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fY29udGFpbmVyJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fY29udGFpbmVyJykpXG5cdCAgICB0aGlzLl9fX2NvbnRhaW5lciA9IHJjXG5cdHJldHVybiB0aGlzLl9fX2NvbnRhaW5lclxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fc2NyYXRjaCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoJ19fX3NjcmF0Y2gnKSlcblx0ICAgIHRoaXMuX19fc2NyYXRjaCA9IHt9XG5cdHJldHVybiB0aGlzLl9fX3NjcmF0Y2hcbiAgICB9XG59KVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFB1YmxpY1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gU2tldGNocGFkKCkge1xuICAgIHRoaXMucmhvID0gMC4yNVxuICAgIHRoaXMuZXBzaWxvbiA9IDAuMDFcbiAgICB0aGlzLmRlYnVnID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvciA9IGZhbHNlXG4gICAgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMgPSBmYWxzZVxuICAgIHRoaXMuY29uc3RyYWludHMgPSBbXVxuICAgIHRoaXMudGhpbmdDb25zdHJ1Y3RvcnMgPSB7fVxuICAgIHRoaXMuY29uc3RyYWludENvbnN0cnVjdG9ycyA9IHt9XG4gICAgdGhpcy5vYmpNYXAgPSB7fVxuICAgIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMgPSB7fVxuICAgIHRoaXMuZXZlbnRIYW5kbGVycyA9IFtdXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWwgPSB7fVxuICAgIHRoaXMuZXZlbnREZXNjcmlwdGlvbnMgPSB7fVxuICAgIHRoaXMub25FYWNoVGltZVN0ZXBIYW5kbGVyRGVzY3JpcHRpb25zID0ge31cbiAgICB0aGlzLmV2ZW50cyA9IFtdXG4gICAgdGhpcy5jb25zdHJhaW50c1dpdGhPbkVhY2hUaW1lU3RlcEZuID0gW11cbiAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICB0aGlzLnBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5wcmV2UHNldWRvVGltZSA9IDBcbiAgICB0aGlzLnNjcmF0Y2ggPSB7fVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24oYUNsYXNzLCBpc0NvbnN0cmFpbnQpIHtcbiAgICB2YXIgY2xhc3NOYW1lID0gYUNsYXNzLm5hbWUucmVwbGFjZSgvX18vZywgJy4nKVxuICAgIHZhciBsaXN0ID0gaXNDb25zdHJhaW50ID8gdGhpcy5jb25zdHJhaW50Q29uc3RydWN0b3JzIDogdGhpcy50aGluZ0NvbnN0cnVjdG9ycyAgICBcbiAgICBsaXN0W2NsYXNzTmFtZV0gPSBhQ2xhc3NcbiAgICBhQ2xhc3MucHJvdG90eXBlLl9faXNTa2V0Y2hwYWRUaGluZyA9IHRydWVcbiAgICBhQ2xhc3MucHJvdG90eXBlLl9faXNDb25zdHJhaW50ID0gaXNDb25zdHJhaW50XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUubWFya09iamVjdFdpdGhJZElmTmV3ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGlkID0gb2JqLl9faWRcbiAgICBpZiAodGhpcy5vYmpNYXBbaWRdKVxuXHRyZXR1cm4gdHJ1ZVxuICAgIHRoaXMub2JqTWFwW2lkXSA9IG9ialxuICAgIHJldHVybiBmYWxzZVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmdldE9iamVjdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMub2JqTWFwW2lkXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFkZENvbnN0cmFpbnQgPSBmdW5jdGlvbihjb25zdHJhaW50KSB7XG4gICAgaWYgKCFjb25zdHJhaW50Ll9fcHJpb3JpdHkpXG5cdGNvbnN0cmFpbnQuX19wcmlvcml0eSA9IDBcbiAgICAvL3RoaXMuY29uc3RyYWludHMucHVzaChjb25zdHJhaW50KVxuICAgIHZhciBwcmlvID0gY29uc3RyYWludC5fX3ByaW9yaXR5XG4gICAgdmFyIGFkZElkeCA9IDBcbiAgICB3aGlsZSAoYWRkSWR4IDwgdGhpcy5jb25zdHJhaW50cy5sZW5ndGggJiYgdGhpcy5jb25zdHJhaW50c1thZGRJZHhdLl9fcHJpb3JpdHkgPCBwcmlvKVxuXHRhZGRJZHgrK1xuICAgIGlmICh0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcykge1xuXHR0aGlzLmFkZFRvUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9yc0ZvckNvbnN0cmFpbnQoY29uc3RyYWludCwgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cylcblx0dGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVGb3JDb25zdHJhaW50KGNvbnN0cmFpbnQpXG4gICAgfVxuICAgIHRoaXMuY29uc3RyYWludHMuc3BsaWNlKGFkZElkeCwgMCwgY29uc3RyYWludClcbiAgICBmb3IgKHZhciBwIGluIGNvbnN0cmFpbnQpIHtcblx0aWYgKGNvbnN0cmFpbnQuaGFzT3duUHJvcGVydHkocCkpIHtcblx0ICAgIHZhciBvYmogPSBjb25zdHJhaW50W3BdXG5cdCAgICBpZiAob2JqICE9PSB1bmRlZmluZWQgJiYgIXRoaXMub2JqTWFwW29iai5fX2lkXSlcblx0XHR0aGlzLm9iak1hcFtvYmouX19pZF0gPSBvYmpcblx0fVxuICAgIH1cbiAgICByZXR1cm4gY29uc3RyYWludFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnJlbW92ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbih1bndhbnRlZENvbnN0cmFpbnQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB0aGlzLmNvbnN0cmFpbnRzID0gdGhpcy5jb25zdHJhaW50cy5maWx0ZXIoZnVuY3Rpb24oY29uc3RyYWludCkge1xuXHRyZXR1cm4gY29uc3RyYWludCAhPT0gdW53YW50ZWRDb25zdHJhaW50ICYmXG4gICAgICAgICAgICAhKGludm9sdmVzKGNvbnN0cmFpbnQsIHVud2FudGVkQ29uc3RyYWludCkpXG4gICAgfSlcbiAgICBpZiAodGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMpXG5cdHRoaXMuY29tcHV0ZVBlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnMoKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yaG8gPSAwLjI1XG4gICAgdGhpcy5lcHNpbG9uID0gMC4wMVxuICAgIHRoaXMuc2VhcmNoT24gPSBmYWxzZVxuICAgIHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcyA9IGZhbHNlXG4gICAgdGhpcy5jb25zdHJhaW50cyA9IFtdXG4gICAgdGhpcy5vYmpNYXAgPSB7fVxuICAgIHRoaXMuZXZlbnRIYW5kbGVycyA9IFtdXG4gICAgdGhpcy5ldmVudHMgPSBbXVxuICAgIHRoaXMuY29uc3RyYWludHNXaXRoT25FYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cyA9IHt9XG4gICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gICAgdGhpcy5wc2V1ZG9UaW1lID0gMFxuICAgIHRoaXMucHJldlBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5zY3JhdGNoID0ge31cbiAgICAvLyByZW1vdmUgZXhpc3RpbmcgZXZlbnQgaGFuZGxlcnNcbiAgICBmb3IgKHZhciBuYW1lIGluIHRoaXMuZXZlbnRIYW5kbGVyc0ludGVybmFsKVxuXHR0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uKGhhbmRsZXIpIHsgZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGhhbmRsZXIpIH0pXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWwgPSB7fVxuICAgIHRoaXMuZXZlbnREZXNjcmlwdGlvbnMgPSB7fVxuICAgIHRoaXMub25FYWNoVGltZVN0ZXBIYW5kbGVyRGVzY3JpcHRpb25zID0ge31cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlQ3VycmVudEVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBzZXVkb1RpbWUgPSB0aGlzLnBzZXVkb1RpbWVcbiAgICB2YXIgcHJldlBzZXVkb1RpbWUgPSB0aGlzLnByZXZQc2V1ZG9UaW1lIFxuICAgIHZhciB0b3RhbEVycm9yID0gMFxuICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IHRoaXMuY29uc3RyYWludHMubGVuZ3RoOyBpZHgrKykge1xuXHR2YXIgYyA9IHRoaXMuY29uc3RyYWludHNbaWR4XVxuXHR2YXIgZXIgPSBNYXRoLmFicyhjLmNvbXB1dGVFcnJvcihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkpXHRcblx0dG90YWxFcnJvciArPSBlclxuICAgIH1cbiAgICByZXR1cm4gdG90YWxFcnJvclxufVxuICAgIFxuU2tldGNocGFkLnByb3RvdHlwZS5jb2xsZWN0UGVyQ29uc3RyYWludFNvbHV0aW9ucyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMsIGluRml4UG9pbnRQcm9jZXNzKSB7XG4gICAgdmFyIHBzZXVkb1RpbWUgPSB0aGlzLnBzZXVkb1RpbWVcbiAgICB2YXIgcHJldlBzZXVkb1RpbWUgPSB0aGlzLnByZXZQc2V1ZG9UaW1lIFxuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHZhciBhbGxTb2x1dGlvbnMgPSBbXVxuICAgIHZhciBkaWRTb21ldGhpbmcgPSBmYWxzZSwgbG9jYWxEaWRTb21ldGhpbmcgPSBmYWxzZSwgdG90YWxFcnJvciA9IDBcbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCB0aGlzLmNvbnN0cmFpbnRzLmxlbmd0aDsgaWR4KyspIHtcblx0dmFyIGMgPSB0aGlzLmNvbnN0cmFpbnRzW2lkeF1cblx0dmFyIHNlYXJjaGFibGUgPSBjLl9fc2VhcmNoYWJsZVxuXHRpZiAoaW5GaXhQb2ludFByb2Nlc3MgJiYgc2VhcmNoYWJsZSlcblx0ICAgIGNvbnRpbnVlXG5cdHZhciBlciA9IE1hdGguYWJzKGMuY29tcHV0ZUVycm9yKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSlcdFxuXHR0b3RhbEVycm9yICs9IGVyXG5cdGlmIChlciA+IHNlbGYuZXBzaWxvblxuXHQgICAgfHwgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3IgfHwgKHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yT25Qcmlvcml0eURpZmZlcmVuY2VzICYmIHRoaXMuY29uc3RyYWludElzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lKGMpKVxuXHQgICApIHtcblx0ICAgIHZhciBzb2x1dGlvbnMgPSBjLnNvbHZlKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuXHQgICAgLypcblx0ICAgIGlmIChzb2x1dGlvbnMgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdGlmIChpbkZpeFBvaW50UHJvY2Vzcykge1xuXHRcdCAgICB2YXIgY291bnQgPSBzb2x1dGlvbnMubGVuZ3RoXG5cdFx0ICAgIHZhciBjaG9pY2UgPSAgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY291bnQpXG5cdFx0ICAgIHNvbHV0aW9ucyA9IHNvbHV0aW9uc1tjaG9pY2VdXG5cdFx0fVxuXHQgICAgfSBlbHNlIGlmICghaW5GaXhQb2ludFByb2Nlc3MpIHtcblx0XHRzb2x1dGlvbnMgPSBbc29sdXRpb25zXVxuXHQgICAgfVxuXHQgICAgKi9cblx0ICAgIGlmICghKGluRml4UG9pbnRQcm9jZXNzIHx8IHNlYXJjaGFibGUpKVxuXHRcdHNvbHV0aW9ucyA9IFtzb2x1dGlvbnNdXG5cdCAgICBsb2NhbERpZFNvbWV0aGluZyA9IHRydWVcblx0ICAgIGFsbFNvbHV0aW9ucy5wdXNoKHtjb25zdHJhaW50OiBjLCBzb2x1dGlvbnM6IHNvbHV0aW9uc30pXG5cdH1cbiAgICB9XG4gICAgaWYgKGxvY2FsRGlkU29tZXRoaW5nKSB7XG5cdGRpZFNvbWV0aGluZyA9IHRydWVcbiAgICB9IGVsc2Vcblx0dG90YWxFcnJvciA9IDBcbiAgICByZXR1cm4ge2RpZFNvbWV0aGluZzogZGlkU29tZXRoaW5nLCBlcnJvcjogdG90YWxFcnJvciwgc29sdXRpb25zOiBhbGxTb2x1dGlvbnN9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zID0gZnVuY3Rpb24oYWxsU29sdXRpb25zKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIGNvbGxlY3RlZFNvbHV0aW9ucyA9IHt9LCBzZWVuUHJpb3JpdGllcyA9IHt9XG4gICAgYWxsU29sdXRpb25zLmZvckVhY2goZnVuY3Rpb24oZCkge1xuXHRjb2xsZWN0UGVyUHJvcGVydHlTb2x1dGlvbnNBZGRTb2x1dGlvbihzZWxmLCBkLCBjb2xsZWN0ZWRTb2x1dGlvbnMsIHNlZW5Qcmlvcml0aWVzKVxuICAgIH0pXG4gICAgcmV0dXJuIGNvbGxlY3RlZFNvbHV0aW9uc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvT25lSXRlcmF0aW9uID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIGlmICh0aGlzLmJlZm9yZUVhY2hJdGVyYXRpb24pXG5cdCh0aGlzLmJlZm9yZUVhY2hJdGVyYXRpb24pKClcbiAgICB2YXIgcmVzID0gdGhpcy5jb2xsZWN0UGVyQ29uc3RyYWludFNvbHV0aW9ucyh0aW1lTWlsbGlzLCB0cnVlKVxuICAgIHZhciBkaWRTb21ldGhpbmcgPSByZXMuZGlkU29tZXRoaW5nXG4gICAgdmFyIHRvdGFsRXJyb3IgPSByZXMuZXJyb3JcbiAgICBpZiAoZGlkU29tZXRoaW5nKSB7XG5cdHZhciBhbGxTb2x1dGlvbnMgPSByZXMuc29sdXRpb25zXG5cdHZhciBjb2xsZWN0ZWRTb2x1dGlvbnMgPSB0aGlzLmNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9ucyhhbGxTb2x1dGlvbnMpXG5cdGFwcGx5U29sdXRpb25zKHRoaXMsIGNvbGxlY3RlZFNvbHV0aW9ucylcbiAgICB9XG4gICAgcmV0dXJuIHRvdGFsRXJyb3Jcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXMgPSB7fVxuICAgIHRoaXMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbihjKSB7XG5cdHRoaXMuYWRkVG9QZXJUaGluZ1BlclByb3BlcnR5RWZmZWN0b3JzRm9yQ29uc3RyYWludChjLCByZXMpXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMgPSByZXMgIFxuICAgIHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lKClcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hZGRUb1BlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnNGb3JDb25zdHJhaW50ID0gZnVuY3Rpb24oYywgcmVzKSB7XG4gICAgaWYgKGMuZWZmZWN0cykge1xuXHRjLmVmZmVjdHMoKS5mb3JFYWNoKGZ1bmN0aW9uKGUpIHsgXG5cdCAgICB2YXIgaWQgPSBlLm9iai5fX2lkXG5cdCAgICB2YXIgZVByb3BzID0gZS5wcm9wc1xuXHQgICAgdmFyIHByb3BzLCBjc1xuXHQgICAgaWYgKHJlc1tpZF0pXG5cdFx0cHJvcHMgPSByZXNbaWRdXG5cdCAgICBlbHNlIHtcblx0XHRwcm9wcyA9IHt9XG5cdFx0cmVzW2lkXSA9IHByb3BzXG5cdCAgICB9XG5cdCAgICBlUHJvcHMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG5cdFx0aWYgKHByb3BzW3Byb3BdKVxuXHRcdCAgICBjcyA9IHByb3BzW3Byb3BdXG5cdFx0ZWxzZSB7XG5cdFx0ICAgIGNzID0gW11cblx0XHQgICAgcHJvcHNbcHJvcF0gPSBjc1xuXHRcdH1cblx0XHRjcy5wdXNoKGMpXHRcdFxuXHQgICAgfSlcblx0fSlcdCAgICBcbiAgICB9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29uc3RyYWludElzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lID0gZnVuY3Rpb24oY29uc3RyYWludCkge1xuICAgIHJldHVybiB0aGlzLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZVtjb25zdHJhaW50Ll9faWRdICE9PSB1bmRlZmluZWRcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVGb3JDb25zdHJhaW50ID0gZnVuY3Rpb24oY29uc3RyYWludCkge1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMpIHtcblx0dmFyIHRoaW5nRWZmcyA9IHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHNbaWRdXG5cdGZvciAodmFyIHAgaW4gdGhpbmdFZmZzKSB7XG5cdCAgICB2YXIgY3MgPSB0aGluZ0VmZnNbcF1cblx0ICAgIGlmIChjcy5pbmRleE9mKGNvbnN0cmFpbnQpID49IDApIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNzLmxlbmd0aDsgaSsrKSB7XG5cdFx0ICAgIHZhciBjID0gY3NbaV1cblx0XHQgICAgaWYgKGMgIT09IGNvbnN0cmFpbnQgJiYgYy5fX3ByaW9yaXR5IDwgY29uc3RyYWludC5fX3ByaW9yaXR5KSB7XG5cdFx0XHR0aGlzLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZVtjb25zdHJhaW50Ll9faWRdID0gdHJ1ZVxuXHRcdFx0cmV0dXJuXG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdH1cbiAgICB9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lID0gZnVuY3Rpb24oKSB7ICAgIFxuICAgIHRoaXMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbihjb25zdHJhaW50KSB7ICAgIFxuXHR0aGlzLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZUZvckNvbnN0cmFpbnQoY29uc3RyYWludClcbiAgICB9LmJpbmQodGhpcykpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY3VycmVudFRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnRUaW1lXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZG9UYXNrc09uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcbiAgICB0aGlzLmhhbmRsZUV2ZW50cygpXG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcENvbnN0cmFpbnRzKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuICAgIGlmICh0aGlzLm9uRWFjaFRpbWVTdGVwKSBcblx0KHRoaXMub25FYWNoVGltZVN0ZXApKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvVGFza3NPblNvbHZpbmdEb25lID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcbiAgICBpZiAodGhpcy5vblNvbHZpbmdEb25lKSBcblx0KHRoaXMub25Tb2x2aW5nRG9uZSkocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpXG4gICAgdGhpcy5tYXliZVN0ZXBQc2V1ZG9UaW1lKClcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlTmV4dFBzZXVkb1RpbWVGcm9tUHJvcG9zYWxzID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJvcG9zYWxzKSB7XG4gICAgdmFyIHJlcyA9IHByb3Bvc2Fsc1swXS50aW1lXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBwcm9wb3NhbHMubGVuZ3RoOyBpKyspIHtcblx0dGltZSA9IHByb3Bvc2Fsc1tpXS50aW1lXG5cdGlmICh0aW1lIDwgcmVzKVxuXHQgICAgcmVzID0gdGltZVxuICAgIH1cbiAgICByZXR1cm4gcmVzXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUubWF5YmVTdGVwUHNldWRvVGltZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvID0ge31cbiAgICB2YXIgcHNldWRvVGltZSA9IHRoaXMucHNldWRvVGltZVxuICAgIHRoaXMucHJldlBzZXVkb1RpbWUgPSBwc2V1ZG9UaW1lXG4gICAgdmFyIHByb3Bvc2FscyA9IFtdXG4gICAgdGhpcy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYodC5wcm9wb3NlTmV4dFBzZXVkb1RpbWUpXG4gICAgICAgICAgICBwcm9wb3NhbHMucHVzaCh7cHJvcG9zZXI6IHQsIHRpbWU6IHQucHJvcG9zZU5leHRQc2V1ZG9UaW1lKHBzZXVkb1RpbWUpfSlcbiAgICB9KVxuICAgIGlmIChwcm9wb3NhbHMubGVuZ3RoID4gMClcblx0dGhpcy5wc2V1ZG9UaW1lID0gdGhpcy5jb21wdXRlTmV4dFBzZXVkb1RpbWVGcm9tUHJvcG9zYWxzKHBzZXVkb1RpbWUsIHByb3Bvc2FscylcdFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLml0ZXJhdGVTZWFyY2hDaG9pY2VzRm9yVXBUb01pbGxpcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgZXBzaWxvbiA9IHRoaXMuZXBzaWxvblxuICAgIHZhciBzb2xzID0gdGhpcy5jb2xsZWN0UGVyQ29uc3RyYWludFNvbHV0aW9ucyh0aW1lTWlsbGlzLCBmYWxzZSlcbiAgICB2YXIgZGlkU29tZXRoaW5nID0gc29scy5kaWRTb21ldGhpbmdcbiAgICB2YXIgdG90YWxFcnJvciA9IHNvbHMuZXJyb3JcbiAgICB2YXIgcmVzID0ge2Vycm9yOiB0b3RhbEVycm9yLCBjb3VudDogMH0gLy9GSVhNRVxuICAgIGlmIChkaWRTb21ldGhpbmcpIHtcblx0dmFyIGFsbFNvbHV0aW9uQ2hvaWNlcyA9IHNvbHMuc29sdXRpb25zXG5cdC8vZmluZCBhbGwgc29sdXRpb24gY29tYmluYXRpb25zIGJldHdlZW4gY29uc3RyYWludHNcblx0Ly9sb2coYWxsU29sdXRpb25DaG9pY2VzKVxuXHR2YXIgY2hvaWNlc0NzID0gYWxsU29sdXRpb25DaG9pY2VzLm1hcChmdW5jdGlvbihjKSB7IHJldHVybiBjLmNvbnN0cmFpbnQgfSlcblx0dmFyIGNDb3VudCA9IGNob2ljZXNDcy5sZW5ndGhcblx0dmFyIGNob2ljZXNTcyA9IGFsbFNvbHV0aW9uQ2hvaWNlcy5tYXAoZnVuY3Rpb24oYykgeyByZXR1cm4gYy5zb2x1dGlvbnMgfSlcblx0dmFyIGFsbFNvbHV0aW9uQ29tYm9zID0gYWxsQ29tYmluYXRpb25zT2ZBcnJheUVsZW1lbnRzKGNob2ljZXNTcykubWFwKGZ1bmN0aW9uKGNvbWJvKSB7XHQgICAgXG5cdCAgICB2YXIgY3VyciA9IFtdXG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNDb3VudDsgaSsrKSB7XG5cdFx0Y3Vyci5wdXNoKHtjb25zdHJhaW50OiBjaG9pY2VzQ3NbaV0sIHNvbHV0aW9uczogY29tYm9baV19KVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGN1cnJcblx0fSlcblx0Ly9sb2coYWxsU29sdXRpb25Db21ib3MpXG5cdC8vIGNvcHkgY3VyciBzdGF0ZSBhbmQgdHJ5IG9uZSwgaWYgd29ya3MgcmV0dXJuIGVsc2UgcmV2ZXJ0IHN0YXRlIG1vdmUgdG8gbmV4dCB1bnRpbCBub25lIGxlZnRcblx0dmFyIGNvdW50ID0gYWxsU29sdXRpb25Db21ib3MubGVuZ3RoXG5cdHZhciBjaG9pY2VUTyA9IHRpbWVNaWxsaXMgLyBjb3VudFxuXHRpZiAodGhpcy5kZWJ1ZykgbG9nKCdwb3NzaWJsZSBjaG9pY2VzJywgY291bnQsICdwZXIgY2hvaWNlIHRpbWVvdXQnLCBjaG9pY2VUTylcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG5cdCAgICB2YXIgY29waWVkLCBsYXN0ID0gaSA9PSBjb3VudCAtIDFcblx0ICAgIGlmICh0aGlzLmRlYnVnKSBsb2coJ3RyeWluZyBjaG9pY2U6ICcgKyBpKVxuXHQgICAgdmFyIGFsbFNvbHV0aW9ucyA9IGFsbFNvbHV0aW9uQ29tYm9zW2ldXG5cdCAgICAvL2xvZyhhbGxTb2x1dGlvbnMpXG5cdCAgICB2YXIgY29sbGVjdGVkU29sdXRpb25zID0gdGhpcy5jb2xsZWN0UGVyUHJvcGVydHlTb2x1dGlvbnMoYWxsU29sdXRpb25zKVxuXHQgICAgLy9jb3B5IGhlcmUuLi5cdCAgICBcblx0ICAgIGlmICghbGFzdClcblx0XHRjb3BpZWQgPSB0aGlzLmdldEN1cnJlbnRQcm9wVmFsdWVzQWZmZWN0YWJsZUJ5U29sdXRpb25zKGNvbGxlY3RlZFNvbHV0aW9ucylcblx0ICAgIGFwcGx5U29sdXRpb25zKHRoaXMsIGNvbGxlY3RlZFNvbHV0aW9ucylcblx0ICAgIHJlcyA9IHRoaXMuaXRlcmF0ZUZvclVwVG9NaWxsaXMoY2hvaWNlVE8pXHQgICAgXG5cdCAgICB2YXIgY2hvaWNlRXJyID0gdGhpcy5jb21wdXRlQ3VycmVudEVycm9yKClcblx0ICAgIC8vbG9nKGNob2ljZUVycilcblx0ICAgIGlmIChjaG9pY2VFcnIgPCBlcHNpbG9uIHx8IGxhc3QpXG5cdFx0YnJlYWtcblx0ICAgIC8vcmV2ZXJ0IGhlcmVcblx0ICAgIHRoaXMucmV2ZXJ0UHJvcFZhbHVlc0Jhc2VkT25BcmcoY29waWVkKVxuXHR9XG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5nZXRDdXJyZW50UHJvcFZhbHVlc0FmZmVjdGFibGVCeVNvbHV0aW9ucyA9IGZ1bmN0aW9uKHNvbHV0aW9ucykge1xuICAgIHZhciByZXMgPSB7fVxuICAgIGZvciAodmFyIG9iaklkIGluIHNvbHV0aW9ucykge1xuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBwcm9wc04gPSB7fVxuXHRyZXNbb2JqSWRdID0gcHJvcHNOXG5cdHZhciBwcm9wcyA9IHNvbHV0aW9uc1tvYmpJZF1cblx0Zm9yICh2YXIgcCBpbiBwcm9wcykge1xuXHQgICAgcHJvcHNOW3BdID0gY3Vyck9ialtwXVxuXHR9XG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yZXZlcnRQcm9wVmFsdWVzQmFzZWRPbkFyZyA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIGZvciAodmFyIG9iaklkIGluIHZhbHVlcykge1xuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBwcm9wcyA9IHZhbHVlc1tvYmpJZF1cblx0Zm9yICh2YXIgcCBpbiBwcm9wcykge1xuXHQgICAgY3Vyck9ialtwXSA9IHByb3BzW3BdXG5cdH1cbiAgICB9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuc29sdmVGb3JVcFRvTWlsbGlzID0gZnVuY3Rpb24odE1pbGxpcykge1xuICAgIHRoaXMuZG9UYXNrc09uRWFjaFRpbWVTdGVwKHRoaXMucHNldWRvVGltZSwgdGhpcy5wcmV2UHNldWRvVGltZSlcbiAgICB2YXIgcmVzXG4gICAgaWYgKHRoaXMuc2VhcmNoT24pXHRcblx0cmVzID0gdGhpcy5pdGVyYXRlU2VhcmNoQ2hvaWNlc0ZvclVwVG9NaWxsaXModE1pbGxpcylcbiAgICBlbHNlXG5cdHJlcyA9IHRoaXMuaXRlcmF0ZUZvclVwVG9NaWxsaXModE1pbGxpcylcbiAgICB0aGlzLmRvVGFza3NPblNvbHZpbmdEb25lKHRoaXMucHNldWRvVGltZSwgdGhpcy5wcmV2UHNldWRvVGltZSlcbiAgICByZXR1cm4gcmVzXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuaXRlcmF0ZUZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0TWlsbGlzKSB7XG4gICAgdmFyIGNvdW50ID0gMCwgdG90YWxFcnJvciA9IDAsIGVwc2lsb24gPSB0aGlzLmVwc2lsb25cbiAgICAvL3ZhciBkaWRTb21ldGhpbmdcbiAgICB2YXIgY3VyckVycm9yLCBsYXN0RXJyb3JcbiAgICB2YXIgdDAsIHRcbiAgICB0MCA9IHRoaXMuY3VycmVudFRpbWUoKVxuICAgIGRvIHtcblx0bGFzdEVycm9yID0gY3VyckVycm9yXG5cdC8qZGlkU29tZXRoaW5nKi8gY3VyckVycm9yID0gdGhpcy5kb09uZUl0ZXJhdGlvbih0MClcblx0dCA9ICB0aGlzLmN1cnJlbnRUaW1lKCkgLSB0MFxuXHQvL2NvdW50ICs9IGRpZFNvbWV0aGluZyA/IDEgOiAwXG5cdGlmIChjdXJyRXJyb3IgPiAwKSB7XG5cdCAgICBjb3VudCsrXG5cdCAgICB0b3RhbEVycm9yICs9IGN1cnJFcnJvclxuXHR9XG5cdC8vbG9nKGN1cnJFcnJvciwgbGFzdEVycm9yKVxuICAgIH0gd2hpbGUgKFxuXHRjdXJyRXJyb3IgPiBlcHNpbG9uXG5cdCAgICAmJiAhKGN1cnJFcnJvciA+PSBsYXN0RXJyb3IpXG5cdC8vY3VyckVycm9yID4gMC8vZGlkU29tZXRoaW5nIFxuXHQgICAgJiYgdCA8IHRNaWxsaXMpXG4gICAgLy9sb2coe2Vycm9yOiB0b3RhbEVycm9yLCBjb3VudDogY291bnR9KVxuICAgIHJldHVybiB7ZXJyb3I6IHRvdGFsRXJyb3IsIGNvdW50OiBjb3VudH1cbn1cblxuLy8gdmFyaW91cyB3YXlzIHdlIGNhbiBqb2luIHNvbHV0aW9ucyBmcm9tIGFsbCBzb2x2ZXJzXG4vLyBkYW1wZWQgYXZlcmFnZSBqb2luIGZuOlxuU2tldGNocGFkLnByb3RvdHlwZS5zdW1Kb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgLy92YXIgcmVzID0gY3VyclxuICAgIHZhciByaG8gPSB0aGlzLnJob1xuICAgIHZhciBzdW0gPSAwXG4gICAgLy9zb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IHJlcyArPSAodiAtIGN1cnIpICogcmhvIH0pXG4gICAgc29sdXRpb25zLmZvckVhY2goZnVuY3Rpb24odikgeyBzdW0gKz0gdiB9KVxuICAgIHZhciByZXMgPSBjdXJyICsgKHJobyAqICgoc3VtIC8gc29sdXRpb25zLmxlbmd0aCkgLSBjdXJyKSlcbiAgICByZXR1cm4gcmVzXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUubGFzdE9uZVdpbnNKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgcmV0dXJuIHNvbHV0aW9uc1tzb2x1dGlvbnMubGVuZ3RoIC0gMV1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yYW5kb21DaG9pY2VKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgcmV0dXJuIHNvbHV0aW9uc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzb2x1dGlvbnMubGVuZ3RoKV1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hcnJheUFkZEpvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICBzb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IGN1cnIucHVzaCh2KSB9KVxuICAgIHJldHVybiBjdXJyXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZGljdGlvbmFyeUFkZEpvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICBzb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IGZvciAodmFyIGsgaW4gdikgY3VycltrXSA9IHZba10gfSlcbiAgICByZXR1cm4gY3VyclxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRlZmF1bHRKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgcmV0dXJuICB0aGlzLnN1bUpvaW5Tb2x1dGlvbnMoY3Vyciwgc29sdXRpb25zKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnJlZ2lzdGVyRXZlbnQgPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgb3B0RGVzY3JpcHRpb24pIHtcbiAgICB2YXIgaWQgPSB0aGlzLmV2ZW50SGFuZGxlcnMubGVuZ3RoXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzLnB1c2goY2FsbGJhY2spXG4gICAgdmFyIGhhbmRsZXIgPSBmdW5jdGlvbihlKSB7IHRoaXMuZXZlbnRzLnB1c2goW2lkLCBlXSkgfS5iaW5kKHRoaXMpXG4gICAgaWYgKCF0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXSkge1xuXHR0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXSA9IFtdXG5cdHRoaXMuZXZlbnREZXNjcmlwdGlvbnNbbmFtZV0gPSBbXVxuICAgIH1cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXS5wdXNoKGhhbmRsZXIpXG4gICAgdGhpcy5ldmVudERlc2NyaXB0aW9uc1tuYW1lXS5wdXNoKG9wdERlc2NyaXB0aW9uKVxuICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmhhbmRsZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZXZlbnRzLmZvckVhY2goZnVuY3Rpb24obmFtZUFuZEUpIHsgXG5cdHZhciBpZCA9IG5hbWVBbmRFWzBdOyBcblx0dmFyIGUgPSBuYW1lQW5kRVsxXTsgXG5cdHZhciBoID0gdGhpcy5ldmVudEhhbmRsZXJzW2lkXVxuXHRpZiAoaCAhPT0gdW5kZWZpbmVkKVxuXHQgICAgaChlKSBcbiAgICB9LmJpbmQodGhpcykpXG4gICAgdGhpcy5ldmVudHMgPSBbXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwQ29uc3RyYWludHMgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuICAgIHRoaXMuY29uc3RyYWludHNXaXRoT25FYWNoVGltZVN0ZXBGbi5mb3JFYWNoKGZ1bmN0aW9uKHQpIHsgdC5vbkVhY2hUaW1lU3RlcChwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkgfSlcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5zZXRPbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKG9uRWFjaFRpbWVGbiwgb3B0RGVzY3JpcHRpb24pIHtcbiAgICB0aGlzLm9uRWFjaFRpbWVTdGVwID0gb25FYWNoVGltZUZuXG4gICAgaWYgKG9wdERlc2NyaXB0aW9uKVxuXHR0aGlzLm9uRWFjaFRpbWVTdGVwSGFuZGxlckRlc2NyaXB0aW9uc1snZ2VuZXJhbCddID0gW29wdERlc2NyaXB0aW9uXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnVuc2V0T25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm9uRWFjaFRpbWVTdGVwID0gdW5kZWZpbmVkXG4gICAgZGVsZXRlKHRoaXMub25FYWNoVGltZVN0ZXBIYW5kbGVyRGVzY3JpcHRpb25zWydnZW5lcmFsJ10pXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZnVuY3Rpb24gY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zQWRkU29sdXRpb24oc2tldGNocGFkLCBzb2xuLCBzb2Zhciwgc2VlblByaW9yaXRpZXMpIHtcbiAgICB2YXIgYyA9IHNvbG4uY29uc3RyYWludFxuICAgIHZhciBwcmlvcml0eSA9IGMuX19wcmlvcml0eVxuICAgIGZvciAodmFyIG9iaiBpbiBzb2xuLnNvbHV0aW9ucykge1xuXHR2YXIgY3Vyck9iaiA9IGNbb2JqXVxuXHR2YXIgY3Vyck9iaklkID0gY3Vyck9iai5fX2lkXG5cdHZhciBkID0gc29sbi5zb2x1dGlvbnNbb2JqXVxuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKGQpXG5cdGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzW2ldXG5cdCAgICB2YXIgcGVyUHJvcFNvbG4gPSBzb2ZhcltjdXJyT2JqSWRdXG5cdCAgICB2YXIgcGVyUHJvcFByaW8gPSBzZWVuUHJpb3JpdGllc1tjdXJyT2JqSWRdXG5cdCAgICB2YXIgcHJvcFNvbG5zLCBwcmlvXG5cdCAgICBpZiAocGVyUHJvcFNvbG4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHBlclByb3BTb2xuID0ge31cblx0XHRwZXJQcm9wUHJpbyA9IHt9XG5cdFx0c29mYXJbY3Vyck9iaklkXSA9IHBlclByb3BTb2xuXG5cdFx0c2VlblByaW9yaXRpZXNbY3Vyck9iaklkXSA9IHBlclByb3BQcmlvXG5cdFx0cHJvcFNvbG5zID0gW11cblx0XHRwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdHBlclByb3BQcmlvW3Byb3BdID0gcHJpb3JpdHlcblx0ICAgIH0gZWxzZSB7XHRcdCAgICBcblx0XHRwcm9wU29sbnMgPSBwZXJQcm9wU29sbltwcm9wXVxuXHRcdGlmIChwcm9wU29sbnMgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICBwcm9wU29sbnMgPSBbXVxuXHRcdCAgICBwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdCAgICBwZXJQcm9wUHJpb1twcm9wXSA9IHByaW9yaXR5XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgdmFyIGxhc3RQcmlvID0gcGVyUHJvcFByaW9bcHJvcF1cblx0ICAgIGlmIChwcmlvcml0eSA+IGxhc3RQcmlvKSB7XG5cdFx0cGVyUHJvcFByaW9bcHJvcF0gPSBwcmlvcml0eVxuXHRcdHdoaWxlIChwcm9wU29sbnMubGVuZ3RoID4gMCkgcHJvcFNvbG5zLnBvcCgpXG5cdCAgICB9IGVsc2UgaWYgKHByaW9yaXR5IDwgbGFzdFByaW8pIHtcblx0XHRicmVha1xuXHQgICAgfSBcblx0ICAgIHByb3BTb2xucy5wdXNoKGRbcHJvcF0pXG5cdH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFwcGx5U29sdXRpb25zKHNrZXRjaHBhZCwgc29sdXRpb25zKSB7ICAgIFxuICAgIC8vbG9nMihzb2x1dGlvbnMpXG4gICAgdmFyIGtleXMxID0gT2JqZWN0LmtleXMoc29sdXRpb25zKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5czEubGVuZ3RoOyBpKyspIHtcblx0dmFyIG9iaklkID0ga2V5czFbaV1cblx0dmFyIHBlclByb3AgPSBzb2x1dGlvbnNbb2JqSWRdXG5cdHZhciBjdXJyT2JqID0gc2tldGNocGFkLm9iak1hcFtvYmpJZF1cblx0dmFyIGtleXMyID0gT2JqZWN0LmtleXMocGVyUHJvcClcblx0Zm9yICh2YXIgaiA9IDA7IGogPCBrZXlzMi5sZW5ndGg7IGorKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzMltqXVxuXHQgICAgdmFyIHByb3BTb2xucyA9IHBlclByb3BbcHJvcF1cblx0ICAgIHZhciBjdXJyVmFsID0gY3Vyck9ialtwcm9wXVxuXHQgICAgdmFyIGpvaW5GbiA9IChjdXJyT2JqLnNvbHV0aW9uSm9pbnMgIT09IHVuZGVmaW5lZCAmJiAoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdICE9PSB1bmRlZmluZWQpID9cblx0XHQoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdIDogc2tldGNocGFkLnN1bUpvaW5Tb2x1dGlvbnNcblx0ICAgIGN1cnJPYmpbcHJvcF0gPSAoam9pbkZuLmJpbmQoc2tldGNocGFkKSkoY3VyclZhbCwgcHJvcFNvbG5zKVxuXHR9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbnZvbHZlcyhjb25zdHJhaW50LCBvYmopIHtcbiAgICBmb3IgKHZhciBwIGluIGNvbnN0cmFpbnQpIHtcblx0aWYgKGNvbnN0cmFpbnRbcF0gPT09IG9iaikge1xuXHQgICAgcmV0dXJuIHRydWVcblx0fVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gYWxsQ29tYmluYXRpb25zT2ZBcnJheUVsZW1lbnRzKGFycmF5T2ZBcnJheXMpIHtcbiAgICBpZiAoYXJyYXlPZkFycmF5cy5sZW5ndGggPiAxKSB7XG5cdHZhciBmaXJzdCA9IGFycmF5T2ZBcnJheXNbMF1cblx0dmFyIHJlc3QgPSBhbGxDb21iaW5hdGlvbnNPZkFycmF5RWxlbWVudHMoYXJyYXlPZkFycmF5cy5zbGljZSgxKSlcblx0dmFyIHJlcyA9IFtdXG5cdGZvciAodmFyIGogPSAwOyBqIDwgcmVzdC5sZW5ndGggOyBqKyspIHtcblx0ICAgIHZhciByID0gcmVzdFtqXVxuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaXJzdC5sZW5ndGg7IGkrKykge1xuXHRcdHJlcy5wdXNoKFtmaXJzdFtpXV0uY29uY2F0KHIpKVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiByZXNcbiAgICB9ICBlbHNlIGlmIChhcnJheU9mQXJyYXlzLmxlbmd0aCA9PSAxKSB7XG5cdHJldHVybiBhcnJheU9mQXJyYXlzWzBdLm1hcChmdW5jdGlvbihlKSB7IHJldHVybiBbZV0gfSlcbiAgICB9IGVsc2Vcblx0cmV0dXJuIFtdXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBCb290c3RyYXAgJiBJbnN0YWxsIGNvbnN0cmFpbnQgbGlicmFyaWVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuc2tldGNocGFkID0gbmV3IFNrZXRjaHBhZCgpXG5pbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzKFNrZXRjaHBhZClcbmluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzKFNrZXRjaHBhZClcbmluc3RhbGwzREdlb21ldHJpY0NvbnN0cmFpbnRzKFNrZXRjaHBhZClcbmluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNrZXRjaHBhZFxuXG4iXX0=
