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
    var normalized = Sketchpad.geom.normalized
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
	    var d = {x: 0, y: 0}
	    if (mass > 0) { // if not anchored
				var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)
		var stretchLen =  springCurrLen - spring.length
		// if not torn apart...
		if (stretchLen < spring.tearPointAmount) {
		    var newAccelerationMag = spring.k * stretchLen / mass
		    var acc = scaledBy(normalized(vector), -newAccelerationMag)
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

    Sketchpad.simulation3d = { g: 9.8 }

    var minus = Sketchpad.geom3d.minus
    var plus = Sketchpad.geom3d.plus
    var scaledBy = Sketchpad.geom3d.scaledBy
    var magnitude = Sketchpad.geom3d.magnitude
    var normalized = Sketchpad.geom3d.normalized
    var distance = Sketchpad.geom3d.distance
    var angle = Sketchpad.geom3d.angle

    // Classes
    
    Sketchpad.simulation3d.Spring = function Sketchpad__simulation3d__Spring(line, k, length, tearPointAmount) {
	this.line = rc.add(line)
	this.k = k
	this.length = length    
	this.tearPointAmount = tearPointAmount
	this.torn = false
    }
    
    sketchpad.addClass(Sketchpad.simulation3d.Spring)
    
    Sketchpad.simulation3d.Spring.prototype.propertyTypes = {line: 'Cylinder', k: 'Number', length: 'Number', teatPointAmount: 'Number'}
    
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
		color.set('blue')
		color.r += stretch
	    }
	}
    }
	    
    // Motion Constraint

    Sketchpad.simulation3d.VelocityConstraint = function Sketchpad__simulation3d__VelocityConstraint(position, velocity) {
	this.position = position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityConstraint, true)

    Sketchpad.simulation3d.VelocityConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.VelocityConstraint(Point3D Pos, Vector3D Velocity) states Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityConstraint.prototype.propertyTypes = {position: 'Point3D', velocity: 'Vector3D'}

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

    Sketchpad.simulation3d.VelocityConstraint2 = function Sketchpad__simulation3d__VelocityConstraint2(position, velocity) {
	this.position = position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityConstraint2, true)

    Sketchpad.simulation3d.VelocityConstraint2.prototype.description = function() { return  "Sketchpad.simulation3d.VelocityConstraint2(Point Pos, PointVector3D Velocity) states Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityConstraint2.prototype.propertyTypes = {position: 'Point', velocity: 'Point'}
    
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

    Sketchpad.simulation3d.AccelerationConstraint = function Sketchpad__simulation3d__AccelerationConstraint(velocity, acceleration) {
	this.velocity = velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation3d.AccelerationConstraint, true)

    Sketchpad.simulation3d.AccelerationConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.AccelerationConstraint(Vector Velocity, Vector Acceleration) states Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.propertyTypes = {position: 'Point3D', velocity: 'Vector3D'}

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

    Sketchpad.simulation3d.AirResistanceConstraint = function Sketchpad__simulation3d__AirResistanceConstraint(velocity, scale) {
	this.velocity = velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation3d.AirResistanceConstraint, true)

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.AirResistanceConstraint(Vector3D Velocity, Number Scale) states Velocity = old(Velocity) * Scale ." }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.propertyTypes = {scale: 'Number', velocity: 'Vector'}

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

    Sketchpad.simulation3d.SpringConstraint = function Sketchpad__simulation3d__SpringConstraint(position1, velocity1, acceleration1, mass1, position2, velocity2, acceleration2, mass2, spring) {
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

    sketchpad.addClass(Sketchpad.simulation3d.SpringConstraint, true)

    Sketchpad.simulation3d.SpringConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.SpringConstraint(Point Pos1, Vector Vel1, Vector Acc1, Number Mass1, Point Pos2, Vector Vel2, Vector Acc2, Number Mass2, Spring S) states that spring S has been attached to two bodies with positions, velocities, accelerations, and masses of respectively Pos1, Pos2, Vel1, Vel2, Acc1, Acc2, Mass1, Mass2. " }

    Sketchpad.simulation3d.SpringConstraint.prototype.propertyTypes = {position1: 'Point', velocity1: 'Vector', acceleration1: 'Vector', mass1: 'Number', position2: 'Point', velocity2: 'Vector', acceleration2: 'Vector', mass2: 'Number', spring: 'Spring'}

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
	    var d = {x: 0, y: 0, z: 0}
	    if (mass > 0) { // if not anchored		
		var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)
		var stretchLen =  springCurrLen - spring.length
		// if not torn apart...
		if (stretchLen < spring.tearPointAmount) {
		    var newAccelerationMag = spring.k * stretchLen / mass
		    var acc = scaledBy(normalized(vector), -newAccelerationMag)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8yZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvM2Qvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIGluc3RhbGxBcml0aG1ldGljQ29uc3RyYWludHMoU2tldGNocGFkKSB7XG5cbiAgICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBhcml0aG1ldGljIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgICAvLyBhcmJpdHJhcnkgcHJvcGVydGllcyBvZiBhcmJpdHJhcnkgb2JqZWN0cy4gXCJSZWZlcmVuY2VzXCIgYXJlIHJlcHJlc2VudGVkXG4gICAgLy8gYXMgKG9iamVjdCwgcHJvcGVydHlOYW1lKSB0dXBsZXMsIGUuZy4sIHtvYmo6IHlvdXJNb20sIHByb3A6ICd3ZWlnaHQnfS5cblxuICAgIFNrZXRjaHBhZC5hcml0aCA9IHt9XG5cbiAgICAvLyBIZWxwZXJzXG5cbiAgICBmdW5jdGlvbiBpbnN0YWxsUmVmKHRhcmdldCwgcmVmLCBwcmVmaXgpIHtcblx0dGFyZ2V0W3ByZWZpeCArICdfb2JqJ10gPSByZWYub2JqXG5cdHRhcmdldFtwcmVmaXggKyAnX3Byb3AnXSA9IHJlZi5wcm9wXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVmKHRhcmdldCwgcHJlZml4KSB7XG5cdHJldHVybiB0YXJnZXRbcHJlZml4ICsgJ19vYmonXVt0YXJnZXRbcHJlZml4ICsgJ19wcm9wJ11dXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGF0Y2godGFyZ2V0IC8qICwgcHJlZml4LCBuZXdWYWwsIC4uLiAqLykge1xuXHR2YXIgcmVzdWx0ID0ge31cblx0Zm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDIpIHtcblx0ICAgIHZhciBwcmVmaXggPSBhcmd1bWVudHNbaV1cblx0ICAgIHZhciBuZXdWYWwgPSBhcmd1bWVudHNbaSsxXVxuXHQgICAgdmFyIGQgPSByZXN1bHRbcHJlZml4ICsgJ19vYmonXVxuXHQgICAgaWYgKCFkKSB7XG5cdFx0cmVzdWx0W3ByZWZpeCArICdfb2JqJ10gPSBkID0ge31cblx0ICAgIH1cblx0ICAgIGRbdGFyZ2V0W3ByZWZpeCArICdfcHJvcCddXSA9IG5ld1ZhbFxuXHR9XG5cdHJldHVybiByZXN1bHRcbiAgICB9XG5cbiAgICAvLyBWYWx1ZSBDb25zdHJhaW50LCBpLmUuLCBvLnAgPSB2YWx1ZVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fYXJpdGhfX1ZhbHVlQ29uc3RyYWludChyZWYsIHZhbHVlKSB7XG5cdGluc3RhbGxSZWYodGhpcywgcmVmLCAndicpXG5cdHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQoe29iajogTywgcHJvcDogcH0sIFZhbHVlKSBzdGF0ZXMgdGhhdCBPLnAgPSBWYWx1ZS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIDQyKSBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy52YWx1ZSAtIHJlZih0aGlzLCAndicpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gcGF0Y2godGhpcywgJ3YnLCB0aGlzLnZhbHVlKVxuICAgIH1cblxuICAgIC8vIEVxdWFsaXR5IENvbnN0cmFpbnQsIGkuZS4sIG8xLnAxID0gbzIucDJcblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19FcXVhbGl0eUNvbnN0cmFpbnQocmVmMSwgcmVmMiwgb3B0T25seVdyaXRlVG8pIHtcblx0aW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpXG5cdHRoaXMub25seVdyaXRlVG8gPSBvcHRPbmx5V3JpdGVUbyB8fCBbMSwgMl1cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50KHtvYmo6IE8xLCBwcm9wOiBwMX0sIHtvYmo6IE8yLCBwcm9wOiBwMn0pIHN0YXRlcyB0aGF0IE8xLnAxID0gTzIucDIgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludCh7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwge29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30pIFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkaWZmID0gcmVmKHRoaXMsICd2MScpIC0gcmVmKHRoaXMsICd2MicpXG5cdHJldHVybiBkaWZmXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjEgPSByZWYodGhpcywgJ3YxJyksIHYyID0gcmVmKHRoaXMsICd2MicpXG5cdHZhciB2cyA9IFt2MSwgdjJdXG5cdHZhciBvbmx5V3JpdGVUbyA9IHRoaXMub25seVdyaXRlVG9cblx0dmFyIGRpZmYgPSB2MSAtIHYyXG5cdHZhciBkaXYgPSBvbmx5V3JpdGVUby5sZW5ndGhcblx0dmFyIGFyZ3MgPSBbdGhpc11cblx0b25seVdyaXRlVG8uZm9yRWFjaChmdW5jdGlvbihpKSB7IHZhciBzaWduID0gaSA+IDEgPyAxIDogLTE7IGFyZ3MucHVzaCgndicgKyBpKTsgYXJncy5wdXNoKHZzW2kgLSAxXSArIHNpZ24gKiBkaWZmIC8gZGl2KSB9KVxuXHRyZXMgPSBwYXRjaC5hcHBseSh0aGlzLCBhcmdzKVxuXHRyZXR1cm4gcmVzIC8vcGF0Y2godGhpcywgJ3YxJywgdjEgLSAoZGlmZiAvIDIpLCAndjInLCB2MiArIGRpZmYgLyAyKVxuICAgIH1cblxuICAgIC8vIFN1bSBDb25zdHJhaW50LCBpLmUuLCBvMS5wMSArIG8yLnAyID0gbzMucDNcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19hcml0aF9fU3VtQ29uc3RyYWludChyZWYxLCByZWYyLCByZWYzLCBvcHRPbmx5V3JpdGVUbykge1xuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjEsICd2MScpXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMiwgJ3YyJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYzLCAndjMnKVxuXHR0aGlzLm9ubHlXcml0ZVRvID0gb3B0T25seVdyaXRlVG8gfHwgWzEsIDIsIDNdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludCh7b2JqOiBPMSwgcHJvcDogcDF9LCB7b2JqOiBPMiwgcHJvcDogcDJ9LCB7b2JqOiBPMywgcHJvcDogcDN9LCBXcml0YWJsZUlkeHMpIHN0YXRlcyB0aGF0IE8xLnAxICsgTzIucDIgPSBPMy5wMyAuIE9wdGlvbmFsIFdyaXRhYmxlSWR4cyBnaXZlcyBhIGxpc3Qgb2YgaW5kaWNlcyAoMSwgMiwgb3IsIDMpIHRoZSBjb25zdHJhaW50IGlzIGFsbG93ZWQgdG8gY2hhbmdlLlwiIH0gXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludCh7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwge29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9KSBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGRpZmYgPSByZWYodGhpcywgJ3YzJykgLSAocmVmKHRoaXMsICd2MScpICsgcmVmKHRoaXMsICd2MicpKVxuXHRyZXR1cm4gZGlmZlxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MSA9IHJlZih0aGlzLCAndjEnKVxuXHR2YXIgdjIgPSByZWYodGhpcywgJ3YyJylcblx0dmFyIHYzID0gcmVmKHRoaXMsICd2MycpXG5cdHZhciB2cyA9IFt2MSwgdjIsIHYzXVxuXHR2YXIgZGlmZiA9IHYzIC0gKHYxICsgdjIpXG5cdHZhciBvbmx5V3JpdGVUbyA9IHRoaXMub25seVdyaXRlVG9cblx0dmFyIGRpdiA9IG9ubHlXcml0ZVRvLmxlbmd0aFxuXHR2YXIgYXJncyA9IFt0aGlzXVxuXHRvbmx5V3JpdGVUby5mb3JFYWNoKGZ1bmN0aW9uKGkpIHsgdmFyIHNpZ24gPSBpID4gMiA/IC0xIDogMTsgYXJncy5wdXNoKCd2JyArIGkpOyBhcmdzLnB1c2godnNbaSAtIDFdICsgc2lnbiAqIGRpZmYgLyBkaXYpIH0pXG5cdHJlcyA9IHBhdGNoLmFwcGx5KHRoaXMsIGFyZ3MpXG5cdHJldHVybiByZXNcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoU2tldGNocGFkKSB7XG5cbiAgICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBnZW9tZXRyaWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIG9iamVjdHMgdGhhdCBoYXZlIHggYW5kIHkgcHJvcGVydGllcy4gT3RoZXIgcHJvcGVydGllcyBhcmUgaWdub3JlZC5cblxuICAgIFNrZXRjaHBhZC5nZW9tID0ge31cblxuICAgIC8vIEhlbHBlcnNcblxuICAgIGZ1bmN0aW9uIHNxdWFyZShuKSB7XG5cdHJldHVybiBuICogblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBsdXMocDEsIHAyKSB7XG5cdHJldHVybiB7eDogcDEueCArIHAyLngsIHk6IHAxLnkgKyBwMi55fVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pbnVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggLSBwMi54LCB5OiBwMS55IC0gcDIueX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FsZWRCeShwLCBtKSB7XG5cdHJldHVybiB7eDogcC54ICogbSwgeTogcC55ICogbX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb3B5KHApIHtcblx0cmV0dXJuIHNjYWxlZEJ5KHAsIDEpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlkcG9pbnQocDEsIHAyKSB7XG5cdHJldHVybiBzY2FsZWRCeShwbHVzKHAxLCBwMiksIDAuNSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWduaXR1ZGUocCkge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KHNxdWFyZShwLngpICsgc3F1YXJlKHAueSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplZChwKSB7XG5cdHZhciBtID0gbWFnbml0dWRlKHApXG5cdHJldHVybiBtID4gMCA/IHNjYWxlZEJ5KHAsIDEgLyBtKSA6IHBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXN0YW5jZShwMSwgcDIpIHtcblx0cmV0dXJuIE1hdGguc3FydChzcXVhcmUocDEueCAtIHAyLngpICsgc3F1YXJlKHAxLnkgLSBwMi55KSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByb3RhdGVkQnkocCwgZFRoZXRhKSB7XG5cdHZhciBjID0gTWF0aC5jb3MoZFRoZXRhKVxuXHR2YXIgcyA9IE1hdGguc2luKGRUaGV0YSlcblx0cmV0dXJuIHt4OiBjKnAueCAtIHMqcC55LCB5OiBzKnAueCArIGMqcC55fVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJvdGF0ZWRBcm91bmQocCwgZFRoZXRhLCBheGlzKSB7XG5cdHJldHVybiBwbHVzKGF4aXMsIHJvdGF0ZWRCeShtaW51cyhwLCBheGlzKSwgZFRoZXRhKSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXREZWx0YShkLCBwLCBzY2FsZSkge1xuXHRkLnggPSBwLnggKiBzY2FsZVxuXHRkLnkgPSBwLnkgKiBzY2FsZVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLnNxdWFyZSA9IHNxdWFyZVxuICAgIFNrZXRjaHBhZC5nZW9tLnBsdXMgPSBwbHVzXG4gICAgU2tldGNocGFkLmdlb20ubWludXMgPSBtaW51c1xuICAgIFNrZXRjaHBhZC5nZW9tLnNjYWxlZEJ5ID0gc2NhbGVkQnlcbiAgICBTa2V0Y2hwYWQuZ2VvbS5jb3B5ID0gY29weVxuICAgIFNrZXRjaHBhZC5nZW9tLm1pZHBvaW50ID0gbWlkcG9pbnRcbiAgICBTa2V0Y2hwYWQuZ2VvbS5tYWduaXR1ZGUgPSBtYWduaXR1ZGVcbiAgICBTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkID0gbm9ybWFsaXplZFxuICAgIFNrZXRjaHBhZC5nZW9tLmRpc3RhbmNlID0gZGlzdGFuY2VcbiAgICBTa2V0Y2hwYWQuZ2VvbS5yb3RhdGVkQnkgPSByb3RhdGVkQnlcbiAgICBTa2V0Y2hwYWQuZ2VvbS5yb3RhdGVkQXJvdW5kID0gcm90YXRlZEFyb3VuZFxuICAgIFNrZXRjaHBhZC5nZW9tLnNldERlbHRhID0gc2V0RGVsdGFcblxuICAgIFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZSA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luLCBwMSwgcDIsIGwpIHtcblx0dmFyIGN0eHQgPSBjYW52YXMuY3R4dFxuXHRjdHh0LmxpbmVXaWR0aCA9IDFcblx0Y3R4dC5zdHJva2VTdHlsZSA9ICd5ZWxsb3cnXG5cdGN0eHQuYmVnaW5QYXRoKClcblxuXHR2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHAyLnkgLSBwMS55LCBwMi54IC0gcDEueClcblx0dmFyIGRpc3QgPSAyNVxuXHR2YXIgcDF4ID0gb3JpZ2luLnggKyBwMS54IC0gZGlzdCAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMXkgPSBvcmlnaW4ueSArIHAxLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeCA9IG9yaWdpbi54ICsgcDIueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ5ID0gb3JpZ2luLnkgKyBwMi55IC0gZGlzdCAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cblx0dmFyIHRleHRDZW50ZXJYID0gKHAxeCArIHAyeCkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclkgPSAocDF5ICsgcDJ5KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cblx0Y3R4dC5tb3ZlVG8oXG5cdCAgICBwMXggKyA1ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMiksXG5cdCAgICBwMXkgKyA1ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0KVxuXHRjdHh0LmxpbmVUbyhcblx0ICAgIHAxeCAtIDUgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKSxcblx0ICAgIHAxeSAtIDUgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHQpXG5cblx0Y3R4dC5tb3ZlVG8ocDF4LCBwMXkpXG5cdGN0eHQubGluZVRvKHAyeCwgcDJ5KVxuXG5cdGN0eHQubW92ZVRvKFxuXHQgICAgcDJ4ICsgNSAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpLFxuXHQgICAgcDJ5ICsgNSAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdClcblx0Y3R4dC5saW5lVG8oXG5cdCAgICBwMnggLSA1ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMiksXG5cdCAgICBwMnkgLSA1ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0KVxuXHRjdHh0LmNsb3NlUGF0aCgpXG5cdGN0eHQuc3Ryb2tlKClcblxuXHRjdHh0LnRleHRBbGlnbiA9ICdjZW50ZXInXG5cdGN0eHQudGV4dEJhc2VsaW5lID0gJ21pZGRsZSdcblx0Y3R4dC5zdHJva2VUZXh0KE1hdGgucm91bmQobCksIHRleHRDZW50ZXJYLCB0ZXh0Q2VudGVyWSlcblx0Y3R4dC5zdHJva2UoKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLmNhbGN1bGF0ZUFuZ2xlID0gZnVuY3Rpb24ocDEsIHAyLCBwMywgcDQpIHtcblx0dmFyIHYxMiA9IHt4OiBwMi54IC0gcDEueCwgeTogcDIueSAtIHAxLnl9XG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIHYzNCA9IHt4OiBwNC54IC0gcDMueCwgeTogcDQueSAtIHAzLnl9XG5cdHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueClcblx0cmV0dXJuIChhMTIgLSBhMzQgKyAyICogTWF0aC5QSSkgJSAoMiAqIE1hdGguUEkpXG4gICAgfVxuXG4gICAgLy8gQ29vcmRpbmF0ZSBDb25zdHJhaW50LCBpLmUuLCBcIkkgd2FudCB0aGlzIHBvaW50IHRvIGJlIGhlcmVcIi5cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19Db29yZGluYXRlQ29uc3RyYWludChwLCB4LCB5KSB7XG5cdHRoaXMucCA9IHBcblx0dGhpcy5jID0gbmV3IFBvaW50KHgsIHkpXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludChQb2ludCBQLCBOdW1iZXIgWCwgTnVtYmVyIFkpIHN0YXRlcyB0aGF0IHBvaW50IFAgc2hvdWxkIHN0YXkgYXQgY29vcmRpbmF0ZSAoWCwgWSkuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDogJ1BvaW50JywgYzogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy5wLCBwcm9wczogWyd4JywgJ3knXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBwMSA9IFBvaW50LmR1bW15KHgsIHkpXG5cdHZhciBwMiA9IFBvaW50LmR1bW15KHksIHgpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQocDEsIHAyLngsIHAyLnkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXModGhpcy5jLCB0aGlzLnApKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7cDoge3g6IHRoaXMuYy54LCB5OiB0aGlzLmMueX19XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgY3R4dCA9IGNhbnZhcy5jdHh0XG5cdGlmICh0aGlzLnAuaXNTZWxlY3RlZCkgcmV0dXJuIC8vIGRvbid0IGRyYXcgb3ZlciB0aGUgc2VsZWN0aW9uIGhpZ2hsaWdodFxuXHRjdHh0LmZpbGxTdHlsZSA9ICdibGFjaydcblx0Y3R4dC5iZWdpblBhdGgoKVxuXHRjdHh0LmFyYyh0aGlzLmMueCArIG9yaWdpbi54LCB0aGlzLmMueSArIG9yaWdpbi55LCBjYW52YXMucG9pbnRSYWRpdXMgKiAwLjY2NiwgMCwgMiAqIE1hdGguUEkpXG5cdGN0eHQuY2xvc2VQYXRoKClcblx0Y3R4dC5maWxsKClcbiAgICB9XG5cbiAgICAvLyBYQ29vcmRpbmF0ZUNvbnN0cmFpbnQgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19YQ29vcmRpbmF0ZUNvbnN0cmFpbnQocDEsIHAyKSB7XG4gICAgICAgIHRoaXMucDEgPSBwMVxuICAgICAgICB0aGlzLnAyID0gcDJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQoUG9pbnQgUCwgTnVtYmVyIFgpIHN0YXRlcyB0aGF0IHBvaW50IFAneCB4LWNvb3JkaW5hdGUgc2hvdWxkIGJlIGF0IFguXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLlhDb29yZGluYXRlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIHAxID0gUG9pbnQuZHVtbXkoeCwgeSlcblx0dmFyIHAyID0gUG9pbnQuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQocDEsIHAyLngsIHAyLnkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy5wMi54IC0gdGhpcy5wMS54XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7cDE6IHt4OiB0aGlzLnAyLnh9fVxuICAgIH1cblxuICAgIC8vIFlDb29yZGluYXRlQ29uc3RyYWludCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5ZQ29vcmRpbmF0ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX1lDb29yZGluYXRlQ29uc3RyYWludChwMSwgcDIpIHtcbiAgICAgICAgdGhpcy5wMSA9IHAxXG4gICAgICAgIHRoaXMucDIgPSBwMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5ZQ29vcmRpbmF0ZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5ZQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB0aGlzLnAyLnkgLSB0aGlzLnAxLnlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5ZQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHtwMToge3k6IHRoaXMucDIueX19XG4gICAgfVxuXG4gICAgLy8gQ29pbmNpZGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZXNlIHR3byBwb2ludHMgdG8gYmUgYXQgdGhlIHNhbWUgcGxhY2UuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0NvaW5jaWRlbmNlQ29uc3RyYWludChwMSwgcDIpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW9udCBQMikgc3RhdGVzIHRoYXQgcG9pbnRzIFAxICYgUDIgc2hvdWxkIGJlIGF0IHRoZSBzYW1lIHBsYWNlLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsID0gTGluZS5kdW1teSh4LCB5KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludChsLnAxLCBsLnAyKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyh0aGlzLnAyLCB0aGlzLnAxKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNwbGl0RGlmZiA9IHNjYWxlZEJ5KG1pbnVzKHRoaXMucDIsIHRoaXMucDEpLCAwLjUpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgc3BsaXREaWZmKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoc3BsaXREaWZmLCAtMSkpfVxuICAgIH1cblxuICAgIC8vIEVxdWl2YWxlbmNlIENvbnN0cmFpbnQsIGkuZS4sIEkgd2FudCB0aGUgdmVjdG9ycyBwMS0+cDIgYW5kIHAzLT5wNCB0byBiZSB0aGUgc2FtZS5cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fRXF1aXZhbGVuY2VDb25zdHJhaW50KHAxLCBwMiwgcDMsIHA0KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQpIHNheXMgbGluZSBzZWN0aW9ucyBQMS0yIGFuZCBQMy00IGFyZSBwYXJhbGxlbCBhbmQgb2YgdGhlIHNhbWUgbGVuZ3Rocy5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsMSA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGwyID0gTGluZS5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludChsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzcGxpdERpZmYgPSBzY2FsZWRCeShtaW51cyhwbHVzKHRoaXMucDIsIHRoaXMucDMpLCBwbHVzKHRoaXMucDEsIHRoaXMucDQpKSwgMC4yNSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBzcGxpdERpZmYpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSksIHAzOiBwbHVzKHRoaXMucDMsIHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpKSwgcDQ6IHBsdXModGhpcy5wNCwgc3BsaXREaWZmKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgbCA9IGRpc3RhbmNlKHRoaXMucDEsIHRoaXMucDIpXG5cdFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZShjYW52YXMsIG9yaWdpbiwgdGhpcy5wMSwgdGhpcy5wMiwgbClcblx0U2tldGNocGFkLmdlb20uZHJhd1Zpc3VhbGl6YXRpb25MaW5lKGNhbnZhcywgb3JpZ2luLCB0aGlzLnAzLCB0aGlzLnA0LCBsKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29udGFpbnNQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIHAxID0gdGhpcy5wMSwgcDIgPSB0aGlzLnAyLCBwMyA9IHRoaXMucDMsIHA0ID0gdGhpcy5wNFxuXHR2YXIgeDEgPSBNYXRoLm1pbihwMS54LCBwMi54LCBwMy54LCBwNC54KSwgeDIgPSBNYXRoLm1heChwMS54LCBwMi54LCBwMy54LCBwNC54KVxuXHR2YXIgeTEgPSBNYXRoLm1pbihwMS55LCBwMi55LCBwMy55LCBwNC55KSwgeTIgPSBNYXRoLm1heChwMS55LCBwMi55LCBwMy55LCBwNC55KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQoeDEsIHkxKSwgeDIgLSB4MSwgeTIgLSB5MSkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyLmNvbnRhaW5zUG9pbnQoeCwgeSkgXG4gICAgfVxuICAgXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5ib3JkZXIgPSBmdW5jdGlvbigpIHtcblx0dmFyIHAxID0gdGhpcy5wMSwgcDIgPSB0aGlzLnAyLCBwMyA9IHRoaXMucDMsIHA0ID0gdGhpcy5wNFxuXHR2YXIgeDEgPSBNYXRoLm1pbihwMS54LCBwMi54LCBwMy54LCBwNC54KSwgeDIgPSBNYXRoLm1heChwMS54LCBwMi54LCBwMy54LCBwNC54KVxuXHR2YXIgeTEgPSBNYXRoLm1pbihwMS55LCBwMi55LCBwMy55LCBwNC55KSwgeTIgPSBNYXRoLm1heChwMS55LCBwMi55LCBwMy55LCBwNC55KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQoeDEsIHkxKSwgeDIgLSB4MSwgeTIgLSB5MSkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyXG4gICAgfSBcblxuICAgIC8vIE9uZSBXYXkgRXF1aXZhbGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZSB2ZWN0b3JzIHAxLT5wMiB0byBhbHdheXMgbWF0Y2ggd2l0aCBwMy0+cDRcblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50KHAxLCBwMiwgcDMsIHA0KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQpIHNheXMgdGhlIHZlY3RvcnMgUDEtPlAyIGFsd2F5cyBtYXRjaGVzIHdpdGggUDMtPlA0XCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgcDM6ICdQb2ludCcsIHA0OiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbDEgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHZhciBsMiA9IExpbmUuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQobDEucDEsIGwxLnAyLCBsMi5wMSwgbDIucDIpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5wMiwgdGhpcy5wMyksIHBsdXModGhpcy5wMSwgdGhpcy5wNCkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSksIDAuNSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBzcGxpdERpZmYpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSl9XG4gICAgfVxuXG4gICAgLy8gRXF1YWwgRGlzdGFuY2UgY29uc3RyYWludCAtIGtlZXBzIGRpc3RhbmNlcyBQMS0tPlAyLCBQMy0tPlA0IGVxdWFsXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQocDEsIHAyLCBwMywgcDQpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLnAzID0gcDNcblx0dGhpcy5wNCA9IHA0XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIFBvaW50IFAzLCBQb2ludCBQNCkga2VlcHMgZGlzdGFuY2VzIFAxLT5QMiwgUDMtPlA0IGVxdWFsLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgcDM6ICdQb2ludCcsIHA0OiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsMSA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGwyID0gTGluZS5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50KGwxLnAxLCBsMS5wMiwgbDIucDEsIGwyLnAyKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKVxuXHR2YXIgbDM0ID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDMsIHRoaXMucDQpKVxuXHRyZXR1cm4gbDEyIC0gbDM0XG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsMTIgPSBtYWduaXR1ZGUobWludXModGhpcy5wMSwgdGhpcy5wMikpXG5cdHZhciBsMzQgPSBtYWduaXR1ZGUobWludXModGhpcy5wMywgdGhpcy5wNCkpXG5cdHZhciBkZWx0YSA9IChsMTIgLSBsMzQpIC8gNFxuXHR2YXIgZTEyID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20ubm9ybWFsaXplZChtaW51cyh0aGlzLnAyLCB0aGlzLnAxKSksIGRlbHRhKVxuXHR2YXIgZTM0ID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20ubm9ybWFsaXplZChtaW51cyh0aGlzLnA0LCB0aGlzLnAzKSksIGRlbHRhKVxuXHRyZXR1cm4ge3AxOiBwbHVzKHRoaXMucDEsIGUxMiksIHAyOiBwbHVzKHRoaXMucDIsIHNjYWxlZEJ5KGUxMiwgLTEpKSwgcDM6IHBsdXModGhpcy5wMywgc2NhbGVkQnkoZTM0LCAtMSkpLCBwNDogcGx1cyh0aGlzLnA0LCBlMzQpfVxuICAgIH1cblxuICAgIC8vIExlbmd0aCBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGRpc3RhbmNlIGJldHdlZW4gUDEgYW5kIFAyIGF0IEwuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19MZW5ndGhDb25zdHJhaW50KHAxLCBwMiwgbCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMubCA9IGxcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50KFBvaW50IFAxLCBQb2ludCBQMiwgTnVtYmVyIEwpIHNheXMgcG9pbnRzIFAxIGFuZCBQMiBhbHdheXMgbWFpbnRhaW4gYSBkaXN0YW5jZSBvZiBMLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBsOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnAxLCBwcm9wczogWyd4JywgJ3knXX0sIHtvYmo6IHRoaXMucDIsIHByb3BzOiBbJ3gnLCAneSddfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQobmV3IFBvaW50KHggLSA1MCwgeSAtIDUwKSwgbmV3IFBvaW50KHggKyA1MCwgeSArIDUwKSwgMTAwKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsMTIgPSBtYWduaXR1ZGUobWludXModGhpcy5wMSwgdGhpcy5wMikpXG5cdHJldHVybiBsMTIgLSB0aGlzLmxcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHAxLCBwMikpXG5cdGlmIChsMTIgPT0gMCkge1xuXHQgICAgcDEgPSBwbHVzKHAxLCB7eDogMC4xLCB5OiAwfSlcblx0ICAgIHAyID0gcGx1cyhwMiwge3g6IC0wLjEsIHk6IDB9KVxuXHR9XG5cdHZhciBkZWx0YSA9IChsMTIgLSB0aGlzLmwpIC8gMlxuXHR2YXIgZTEyID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20ubm9ybWFsaXplZChtaW51cyhwMiwgcDEpKSwgZGVsdGEpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgZTEyKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoZTEyLCAtMSkpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHRTa2V0Y2hwYWQuZ2VvbS5kcmF3VmlzdWFsaXphdGlvbkxpbmUoY2FudmFzLCBvcmlnaW4sIHRoaXMucDEsIHRoaXMucDIsIHRoaXMubClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5jb250YWluc1BvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGFuZ2xlID0gTWF0aC5hdGFuMihwMi55IC0gcDEueSwgcDIueCAtIHAxLngpXG5cdHZhciBkaXN0ID0gMjVcblx0dmFyIHAxeCA9IHAxLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAxeSA9IHAxLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeCA9IHAyLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeSA9IHAyLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHRleHRDZW50ZXJYID0gKHAxeCArIHAyeCkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclkgPSAocDF5ICsgcDJ5KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludCh0ZXh0Q2VudGVyWCAtIDUwLCB0ZXh0Q2VudGVyWSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlci5jb250YWluc1BvaW50KHgsIHkpIFxuICAgIH1cbiAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmJvcmRlciA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGFuZ2xlID0gTWF0aC5hdGFuMihwMi55IC0gcDEueSwgcDIueCAtIHAxLngpXG5cdHZhciBkaXN0ID0gMjVcblx0dmFyIHAxeCA9IHAxLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAxeSA9IHAxLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeCA9IHAyLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeSA9IHAyLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHRleHRDZW50ZXJYID0gKHAxeCArIHAyeCkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclkgPSAocDF5ICsgcDJ5KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludCh0ZXh0Q2VudGVyWCAtIDUwLCB0ZXh0Q2VudGVyWSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlclxuICAgIH0gXG5cbiAgICAvLyBPcmllbnRhdGlvbiBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGFuZ2xlIGJldHdlZW4gUDEtPlAyIGFuZCBQMy0+UDQgYXQgVGhldGFcblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fT3JpZW50YXRpb25Db25zdHJhaW50KHAxLCBwMiwgcDMsIHA0LCB0aGV0YSkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMucDMgPSBwM1xuXHR0aGlzLnA0ID0gcDRcblx0dGhpcy50aGV0YSA9IHRoZXRhID09PSB1bmRlZmluZWQgPyBTa2V0Y2hwYWQuZ2VvbS5jYWxjdWxhdGVBbmdsZShwMSwgcDIsIHAzLCBwNCkgOiB0aGV0YVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQsIE51bWJlciBUaGV0YSkgbWFpbnRhaW5zIGFuZ2xlIGJldHdlZW4gUDEtPlAyIGFuZCBQMy0+UDQgYXQgVGhldGEuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgcDM6ICdQb2ludCcsIHA0OiAnUG9pbnQnLCB0aGV0YTogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsMSA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGwyID0gTGluZS5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludChsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MTIgPSBtaW51cyh0aGlzLnAyLCB0aGlzLnAxKVxuXHR2YXIgYTEyID0gTWF0aC5hdGFuMih2MTIueSwgdjEyLngpXG5cdHZhciBtMTIgPSBtaWRwb2ludCh0aGlzLnAxLCB0aGlzLnAyKVxuXHRcblx0dmFyIHYzNCA9IG1pbnVzKHRoaXMucDQsIHRoaXMucDMpXG5cdHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueClcblx0dmFyIG0zNCA9IG1pZHBvaW50KHRoaXMucDMsIHRoaXMucDQpXG5cdFxuXHR2YXIgY3VyclRoZXRhID0gYTEyIC0gYTM0XG5cdHZhciBkVGhldGEgPSB0aGlzLnRoZXRhIC0gY3VyclRoZXRhXG5cdHJldHVybiBkVGhldGFcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MTIgPSBtaW51cyh0aGlzLnAyLCB0aGlzLnAxKVxuXHR2YXIgYTEyID0gTWF0aC5hdGFuMih2MTIueSwgdjEyLngpXG5cdHZhciBtMTIgPSBtaWRwb2ludCh0aGlzLnAxLCB0aGlzLnAyKVxuXG5cdHZhciB2MzQgPSBtaW51cyh0aGlzLnA0LCB0aGlzLnAzKVxuXHR2YXIgYTM0ID0gTWF0aC5hdGFuMih2MzQueSwgdjM0LngpXG5cdHZhciBtMzQgPSBtaWRwb2ludCh0aGlzLnAzLCB0aGlzLnA0KVxuXG5cdHZhciBjdXJyVGhldGEgPSBhMTIgLSBhMzRcblx0dmFyIGRUaGV0YSA9IHRoaXMudGhldGEgLSBjdXJyVGhldGFcblx0Ly8gVE9ETzogZmlndXJlIG91dCB3aHkgc2V0dGluZyBkVGhldGEgdG8gMS8yIHRpbWVzIHRoaXMgdmFsdWUgKGFzIHNob3duIGluIHRoZSBwYXBlclxuXHQvLyBhbmQgc2VlbXMgdG8gbWFrZSBzZW5zZSkgcmVzdWx0cyBpbiBqdW1weS91bnN0YWJsZSBiZWhhdmlvci5cblx0cmV0dXJuIHtwMTogcm90YXRlZEFyb3VuZCh0aGlzLnAxLCBkVGhldGEsIG0xMiksXG5cdFx0cDI6IHJvdGF0ZWRBcm91bmQodGhpcy5wMiwgZFRoZXRhLCBtMTIpLFxuXHRcdHAzOiByb3RhdGVkQXJvdW5kKHRoaXMucDMsIC1kVGhldGEsIG0zNCksXG5cdFx0cDQ6IHJvdGF0ZWRBcm91bmQodGhpcy5wNCwgLWRUaGV0YSwgbTM0KX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgY3R4dCA9IGNhbnZhcy5jdHh0XG5cdHZhciBtMSA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMSwgdGhpcy5wMiksIDAuNSlcblx0dmFyIG0yID0gc2NhbGVkQnkocGx1cyh0aGlzLnAzLCB0aGlzLnA0KSwgMC41KVxuXHR2YXIgbSA9IHNjYWxlZEJ5KHBsdXMobTEsIG0yKSwgMC41KVxuXHRjYW52YXMuZHJhd0Fycm93KG0xLCBtMiwgb3JpZ2luKVxuXHRjdHh0LmZpbGxTdHlsZSA9ICdyZWQnXG5cdGN0eHQuZmlsbFRleHQoJ3RoZXRhID0gJyArIE1hdGguZmxvb3IodGhpcy50aGV0YSAvIE1hdGguUEkgKiAxODApLCBtLnggKyBvcmlnaW4ueCwgbS55ICsgb3JpZ2luLnkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb250YWluc1BvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbTEgPSBzY2FsZWRCeShwbHVzKHRoaXMucDEsIHRoaXMucDIpLCAwLjUpXG5cdHZhciBtMiA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMywgdGhpcy5wNCksIDAuNSlcblx0dmFyIG0gPSBzY2FsZWRCeShwbHVzKG0xLCBtMiksIDAuNSlcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KG0ueCAtIDUwLCBtLnkgLSA1MCksIDEwMCwgMTAwKSBcblx0cmV0dXJuIHRoaXMuX19ib3JkZXIuY29udGFpbnNQb2ludCh4LCB5KSBcbiAgICB9XG4gICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmJvcmRlciA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgbTEgPSBzY2FsZWRCeShwbHVzKHRoaXMucDEsIHRoaXMucDIpLCAwLjUpXG5cdHZhciBtMiA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMywgdGhpcy5wNCksIDAuNSlcblx0dmFyIG0gPSBzY2FsZWRCeShwbHVzKG0xLCBtMiksIDAuNSlcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KG0ueCAtIDUwLCBtLnkgLSA1MCksIDEwMCwgMTAwKSBcblx0cmV0dXJuIHRoaXMuX19ib3JkZXJcbiAgICB9IFxuXG4gICAgLy8gTW90b3IgY29uc3RyYWludCAtIGNhdXNlcyBQMSBhbmQgUDIgdG8gb3JiaXQgdGhlaXIgbWlkcG9pbnQgYXQgdGhlIGdpdmVuIHJhdGUuXG4gICAgLy8gdyBpcyBpbiB1bml0cyBvZiBIeiAtIHdob2xlIHJvdGF0aW9ucyBwZXIgc2Vjb25kLlxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19Nb3RvckNvbnN0cmFpbnQocDEsIHAyLCB3KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy53ID0gd1xuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBOdW1iZXIgVykgY2F1c2VzIFAxIGFuZCBQMiB0byBvcmJpdCB0aGVpciBtaWRwb2ludCBhdCB0aGUgZ2l2ZW4gcmF0ZSBvZiB3LCBpbiB1bml0cyBvZiBIejogd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXCIgfSBcblxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCcsIHc6ICdOdW1iZXInfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50KGwucDEsIGwucDIsIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gMVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdCA9IChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC8gMTAwMC4wXG5cdHZhciBkVGhldGEgPSB0ICogdGhpcy53ICogKDIgKiBNYXRoLlBJKVxuXHR2YXIgbTEyID0gbWlkcG9pbnQodGhpcy5wMSwgdGhpcy5wMilcblx0cmV0dXJuIHtwMTogcm90YXRlZEFyb3VuZCh0aGlzLnAxLCBkVGhldGEsIG0xMiksXG5cdFx0cDI6IHJvdGF0ZWRBcm91bmQodGhpcy5wMiwgZFRoZXRhLCBtMTIpfVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5DYXJ0ZXNpYW5Qb2ludENvbnN0cmFpbnQgPSBmdW5jdGlvbiAgU2tldGNocGFkX19nZW9tX19DYXJ0ZXNpYW5Qb2ludENvbnN0cmFpbnQocG9zaXRpb24sIHZlY3Rvciwgb3JpZ2luLCB1bml0KSB7XG5cdHRoaXMucG9zaXRpb24gPSBwb3NpdGlvblxuXHR0aGlzLnZlY3RvciA9IHZlY3RvclxuXHR0aGlzLm9yaWdpbiA9IG9yaWdpblxuXHR0aGlzLnVuaXQgPSB1bml0XG4gICAgfVxuICAgIFxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5DYXJ0ZXNpYW5Qb2ludENvbnN0cmFpbnQsIHRydWUpXG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gXCJTa2V0Y2hwYWQuZ2VvbS5DYXJ0ZXNpYW5Qb2ludENvbnN0cmFpbnQoUG9pbnQgUCwgVmVjdG9yIFYsIFBvaW50IE8sIE51bWJlciBVKSBzdGF0ZXMgdGhhdCBQIHNob3VsZCBiZSBwb3NpdGlvbmVkIGJhc2VkIG9uIHZlY3RvciBWJ3MgWCBhbmQgWSBkaXNjcmV0ZSBjb29yZGluYXRlIHZhbHVlcywgYW5kIG9uIG9yaWdpbiBPIGFuZCBlYWNoIHVuaXQgb24gYXhpcyBoYXZpbmcgYSB2ZXJ0aWNhbCBhbmQgaG9yaXpvbnRhbCBsZW5ndGggb2YgVVwiXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIG9yaWdpbiA9IHRoaXMub3JpZ2luLCB2ZWN0b3IgPSB0aGlzLnZlY3RvciwgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLCB1bml0ID0gdGhpcy51bml0XG5cdHZhciBkaWZmWCA9IE1hdGguYWJzKG9yaWdpbi54ICsgdW5pdCAqIHZlY3Rvci54IC0gcG9zaXRpb24ueClcblx0dmFyIGRpZmZZID0gTWF0aC5hYnMob3JpZ2luLnkgLSB1bml0ICogdmVjdG9yLnkgLSBwb3NpdGlvbi55KVxuXHRyZXR1cm4gZGlmZlggKyBkaWZmWVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgb3JpZ2luID0gdGhpcy5vcmlnaW4sIHZlY3RvciA9IHRoaXMudmVjdG9yLCBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24sIHVuaXQgPSB0aGlzLnVuaXRcblx0dmFyIHggPSBvcmlnaW4ueCArIHVuaXQgKiB2ZWN0b3IueFxuXHR2YXIgeSA9IG9yaWdpbi55IC0gdW5pdCAqIHZlY3Rvci55XG5cdHJldHVybiB7cG9zaXRpb246IHt4OiB4LCB5OiB5fX1cbiAgICB9XG4gICAgXG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbEdlb21ldHJpY0NvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzKFNrZXRjaHBhZCkge1xuXG4gICAgLy8gVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2Ygc2ltdWxhdGlvbiBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gICAgLy8gYXJiaXRyYXJ5IHByb3BlcnRpZXMgb2YgYXJiaXRyYXJ5IG9iamVjdHMuIFwiUmVmZXJlbmNlc1wiIGFyZSByZXByZXNlbnRlZFxuICAgIC8vIGFzIChvYmplY3QsIHByb3BlcnR5TmFtZSkgdHVwbGVzLCBlLmcuLCB7b2JqOiB5b3VyTW9tLCBwcm9wOiAnd2VpZ2h0J30uXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbiA9IHsgZzogOS44IH1cblxuICAgIHZhciBtaW51cyA9IFNrZXRjaHBhZC5nZW9tLm1pbnVzXG4gICAgdmFyIHBsdXMgPSBTa2V0Y2hwYWQuZ2VvbS5wbHVzXG4gICAgdmFyIHNjYWxlZEJ5ID0gU2tldGNocGFkLmdlb20uc2NhbGVkQnlcbiAgICB2YXIgbm9ybWFsaXplZCA9IFNrZXRjaHBhZC5nZW9tLm5vcm1hbGl6ZWRcbiAgICB2YXIgbWFnbml0dWRlID0gU2tldGNocGFkLmdlb20ubWFnbml0dWRlXG4gICAgdmFyIGRpc3RhbmNlID0gU2tldGNocGFkLmdlb20uZGlzdGFuY2VcblxuICAgIC8vIENsYXNzZXNcbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1NwcmluZyhsaW5lLCBrLCBsZW5ndGgsIHRlYXJQb2ludEFtb3VudCkge1xuXHR0aGlzLmxpbmUgPSBsaW5lXG5cdHRoaXMuayA9IGtcblx0dGhpcy5sZW5ndGggPSBsZW5ndGggICAgXG5cdHRoaXMudGVhclBvaW50QW1vdW50ID0gdGVhclBvaW50QW1vdW50XG5cdHRoaXMudG9ybiA9IGZhbHNlXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZylcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtsaW5lOiAnTGluZScsIGs6ICdOdW1iZXInLCBsZW5ndGg6ICdOdW1iZXInLCB0ZWF0UG9pbnRBbW91bnQ6ICdOdW1iZXInfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbCA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGQgPSBkaXN0YW5jZShsLnAxLCBsLnAyKVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZyhsLCAxMCwgZCwgIGQgKiA1KVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiB0aGlzLmxpbmUuY29udGFpbnNQb2ludCh4LCB5KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuY2VudGVyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLmxpbmUuY2VudGVyKClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLmJvcmRlciA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gbmV3IExpbmUodGhpcy5saW5lLnAxLCB0aGlzLmxpbmUucDIsIHVuZGVmaW5lZCwgOCkuYm9yZGVyKClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLnNvbHV0aW9uSm9pbnMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHt0b3JuOiByYy5za2V0Y2hwYWQubGFzdE9uZVdpbnNKb2luU29sdXRpb25zfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0dmFyIGxpbmUgPSB0aGlzLmxpbmVcblx0dmFyIHAxID0gbGluZS5wMSwgcDIgPSBsaW5lLnAyXG5cdHZhciB5MSA9IG9yaWdpbi55ICsgcDEueVxuXHR2YXIgeTIgPSBvcmlnaW4ueSArIHAyLnlcblx0dmFyIHgxID0gb3JpZ2luLnggKyBwMS54XG5cdHZhciB4MiA9IG9yaWdpbi54ICsgcDIueFxuXHRpZiAoIXRoaXMudG9ybikge1xuXHQgICAgbGluZS5kcmF3KGNhbnZhcywgb3JpZ2luKVxuXHQgICAgY3R4dC5maWxsU3R5bGUgPSAnYmxhY2snXG5cdCAgICBjdHh0LmZpbGxUZXh0KE1hdGguZmxvb3IoTWF0aC5zcXJ0KE1hdGgucG93KHkxIC0geTIsIDIpICsgTWF0aC5wb3coeDEgLSB4MiwgMikpIC0gdGhpcy5sZW5ndGgpLCAoeDEgKyB4MikgLyAyLCAoeTEgKyB5MikgLyAyKVxuXHR9XG4gICAgfVxuXG4gICAgLy8gVXRpbGl0aWVzXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0ID0gZnVuY3Rpb24oaGFsZkxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikge1xuXHR2YXIgcXVhcnRlckxlbmd0aCA9IGhhbGZMZW5ndGggLyAyXG5cdHZhciBwb3NpdGlvblggPSBwb3NpdGlvbi54XG5cdHZhciBwb3NpdGlvblkgPSBwb3NpdGlvbi55XG5cdHZhciBzdXJmYWNlWDEgPSBzdXJmYWNlUDEueFxuXHR2YXIgc3VyZmFjZVkxID0gc3VyZmFjZVAxLnlcblx0dmFyIHN1cmZhY2VYMiA9IHN1cmZhY2VQMi54XG5cdHZhciBzdXJmYWNlWTIgPSBzdXJmYWNlUDIueVxuXHR2YXIgc2xvcGUgPSAoc3VyZmFjZVkyIC0gc3VyZmFjZVkxKSAvIChzdXJmYWNlWDIgLSBzdXJmYWNlWDEpXG5cdHZhciBzdXJmYWNlSGl0UG9zWCA9ICgocG9zaXRpb25ZIC0gc3VyZmFjZVkxKSAvIHNsb3BlKSArIHN1cmZhY2VYMVxuXHR2YXIgc3VyZmFjZUhpdFBvc1kgPSAoKHBvc2l0aW9uWCAtIHN1cmZhY2VYMSkgKiBzbG9wZSkgKyBzdXJmYWNlWTFcblx0dmFyIGlzVmVydGljYWwgPSAocG9zaXRpb25YID49IChzdXJmYWNlWDEgLSBxdWFydGVyTGVuZ3RoKSAmJiBwb3NpdGlvblggPD0gKHN1cmZhY2VYMiArIHF1YXJ0ZXJMZW5ndGgpKVxuXHR2YXIgaXNIb3Jpem9udGFsID0gKHBvc2l0aW9uWSA+PSAoc3VyZmFjZVkxIC0gcXVhcnRlckxlbmd0aCkgJiYgcG9zaXRpb25ZIDw9IChzdXJmYWNlWTIgKyBxdWFydGVyTGVuZ3RoKSlcblx0dmFyIGlzVXAgPSBpc1ZlcnRpY2FsICYmIHBvc2l0aW9uWSA8PSBzdXJmYWNlSGl0UG9zWVxuXHR2YXIgaXNEb3duID0gaXNWZXJ0aWNhbCAmJiBwb3NpdGlvblkgPj0gc3VyZmFjZUhpdFBvc1lcblx0dmFyIGlzTGVmdCA9IGlzSG9yaXpvbnRhbCAmJiBwb3NpdGlvblggPD0gc3VyZmFjZUhpdFBvc1hcblx0dmFyIGlzUmlnaHQgPSBpc0hvcml6b250YWwgJiYgcG9zaXRpb25YID49IHN1cmZhY2VIaXRQb3NYXG5cdHJldHVybiAoKChpc1VwICYmICh2ZWxvY2l0eS55ID49IDApICYmIChwb3NpdGlvblkgPj0gKHN1cmZhY2VIaXRQb3NZIC0gaGFsZkxlbmd0aCkpKVxuXHRcdCB8fCAoaXNEb3duICYmICh2ZWxvY2l0eS55IDw9IDApICYmIChwb3NpdGlvblkgPD0gKHN1cmZhY2VIaXRQb3NZICsgaGFsZkxlbmd0aCkpKSlcblx0XHR8fCAoKGlzTGVmdCAmJiAodmVsb2NpdHkueCA+PSAwKSAmJiAocG9zaXRpb25YIDw9IHN1cmZhY2VIaXRQb3NYKSAmJiAocG9zaXRpb25YID49IChzdXJmYWNlSGl0UG9zWCAtIGhhbGZMZW5ndGgpKSlcblx0XHQgICAgfHwgKGlzUmlnaHQgJiYgKHZlbG9jaXR5LnggPD0gMCkgJiYgKHBvc2l0aW9uWCA+PSBzdXJmYWNlSGl0UG9zWCkgJiYgKHBvc2l0aW9uWCA8PSAoc3VyZmFjZUhpdFBvc1ggKyBoYWxmTGVuZ3RoKSkpKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5jb21wdXRlQ29udGFjdCA9IGZ1bmN0aW9uKGhhbGZMZW5ndGgsIHBvc2l0aW9uLCB2ZWxvY2l0eSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpIHtcblx0dmFyIHF1YXJ0ZXJMZW5ndGggPSBoYWxmTGVuZ3RoIC8gMlxuXHR2YXIgcG9zaXRpb25YID0gcG9zaXRpb24ueFxuXHR2YXIgcG9zaXRpb25ZID0gcG9zaXRpb24ueVxuXHR2YXIgc3VyZmFjZVgxID0gc3VyZmFjZVAxLnhcblx0dmFyIHN1cmZhY2VZMSA9IHN1cmZhY2VQMS55XG5cdHZhciBzdXJmYWNlWDIgPSBzdXJmYWNlUDIueFxuXHR2YXIgc3VyZmFjZVkyID0gc3VyZmFjZVAyLnlcblx0dmFyIHNsb3BlID0gKHN1cmZhY2VZMiAtIHN1cmZhY2VZMSkgLyAoc3VyZmFjZVgyIC0gc3VyZmFjZVgxKVxuXHR2YXIgc3VyZmFjZUhpdFBvc1ggPSAoKHBvc2l0aW9uWSAtIHN1cmZhY2VZMSkgLyBzbG9wZSkgKyBzdXJmYWNlWDFcblx0dmFyIHN1cmZhY2VIaXRQb3NZID0gKChwb3NpdGlvblggLSBzdXJmYWNlWDEpICogc2xvcGUpICsgc3VyZmFjZVkxXG5cdHZhciBpc1ZlcnRpY2FsID0gKHBvc2l0aW9uWCA+PSAoc3VyZmFjZVgxIC0gcXVhcnRlckxlbmd0aCkgJiYgcG9zaXRpb25YIDw9IChzdXJmYWNlWDIgKyBxdWFydGVyTGVuZ3RoKSlcblx0dmFyIGlzSG9yaXpvbnRhbCA9IChwb3NpdGlvblkgPj0gKHN1cmZhY2VZMSAtIHF1YXJ0ZXJMZW5ndGgpICYmIHBvc2l0aW9uWSA8PSAoc3VyZmFjZVkyICsgcXVhcnRlckxlbmd0aCkpXG5cdHZhciBpc1VwID0gaXNWZXJ0aWNhbCAmJiBwb3NpdGlvblkgPD0gc3VyZmFjZUhpdFBvc1lcblx0dmFyIGlzRG93biA9IGlzVmVydGljYWwgJiYgcG9zaXRpb25ZID49IHN1cmZhY2VIaXRQb3NZXG5cdHZhciBpc0xlZnQgPSBpc0hvcml6b250YWwgJiYgcG9zaXRpb25YIDw9IHN1cmZhY2VIaXRQb3NYXG5cdHZhciBpc1JpZ2h0ID0gaXNIb3Jpem9udGFsICYmIHBvc2l0aW9uWCA+PSBzdXJmYWNlSGl0UG9zWFxuXHR2YXIgdmVsb2NpdHlNYWduaXR1ZGUgPSBtYWduaXR1ZGUodmVsb2NpdHkpXG5cdHZhciBkaXN0YW5jZSA9IDBcblx0Ly9IQUNLIEZJWE1FXG5cdGlmIChpc1VwICYmICh2ZWxvY2l0eS55ID49IDApKSB7XG5cdCAgICBkaXN0YW5jZSA9IHN1cmZhY2VIaXRQb3NZIC0gKHBvc2l0aW9uWSArIGhhbGZMZW5ndGgpXG5cdH0gZWxzZSBpZiAoaXNEb3duICYmICh2ZWxvY2l0eS55IDw9IDApKSB7XG5cdCAgICBkaXN0YW5jZSA9IChwb3NpdGlvblkgLSBoYWxmTGVuZ3RoKSAtIHN1cmZhY2VIaXRQb3NZXG5cdH0gZWxzZSBpZiAoaXNMZWZ0ICYmICh2ZWxvY2l0eS54ID49IDApICYmIChwb3NpdGlvblggPD0gc3VyZmFjZUhpdFBvc1gpKSB7XG5cdCAgICBkaXN0YW5jZSA9IHN1cmZhY2VIaXRQb3NYIC0gKHBvc2l0aW9uWCArIGhhbGZMZW5ndGgpXG5cdH0gZWxzZSBpZiAoaXNSaWdodCAmJiAodmVsb2NpdHkueCA8PSAwKSAmJiAocG9zaXRpb25YID49IHN1cmZhY2VIaXRQb3NYKSkge1xuXHQgICAgZGlzdGFuY2UgPSAocG9zaXRpb25YIC0gaGFsZkxlbmd0aCkgLSBzdXJmYWNlSGl0UG9zWFxuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIDEwMDAwMDBcblx0fVxuXHR2YXIgdGltZSA9IGRpc3RhbmNlIC8gdmVsb2NpdHlNYWduaXR1ZGUgXG5cdHJldHVybiBNYXRoLm1heCgwLCB0aW1lKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlID0gZnVuY3Rpb24ocDEsIHAyKSB7XG5cdHJldHVybiAocDEueSAtIHAyLnkpIC8gKHAyLnggLSBwMS54KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLmFuZ2xlID0gZnVuY3Rpb24ocDEsIHAyKSB7XG5cdHJldHVybiBNYXRoLmF0YW4yKHAxLnkgLSBwMi55LCBwMi54IC0gcDEueClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZVZlY3RvciA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHR2YXIgc2xvcGUgPSB0aGlzLnNsb3BlKHAxLCBwMilcblx0cmV0dXJuIHt4OiBNYXRoLnNpbihNYXRoLmF0YW4oc2xvcGUpKSwgeTogTWF0aC5jb3MoTWF0aC5hdGFuKHNsb3BlKSl9XG4gICAgfVxuXG4gICAgLy8gVGltZXIgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19UaW1lckNvbnN0cmFpbnQodGltZXIpIHtcblx0dGhpcy50aW1lciA9IHRpbWVyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuIFwiU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXIoVGltZXIgVCkgc3RhdGVzIHRoZSBzeXN0ZW0gYWR2YW5jZXMgaXRzIHBzZXVkby10aW1lIGJ5IFQncyBzdGVwIHNpemUgYXQgZWFjaCBmcmFtZSBjeWNsZS5cIiB9XG5cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHt0aW1lcjogJ1RpbWVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQoU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXIuZHVtbXkoeCwgeSkpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUucHJvcG9zZU5leHRQc2V1ZG9UaW1lID0gZnVuY3Rpb24ocHNldWRvVGltZSkge1xuXHRyZXR1cm4gcHNldWRvVGltZSArIHRoaXMudGltZXIuc3RlcFNpemVcbiAgICB9ICAgIFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gMFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge31cbiAgICB9XG5cbiAgICAvLyBWYWx1ZVNsaWRlckNvbnN0cmFpbnQgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19WYWx1ZVNsaWRlckNvbnN0cmFpbnQoc2xpZGVyUG9pbnQsIHhPclksIHNsaWRlclplcm9WYWx1ZSwgc2xpZGVyUmFuZ2VMZW5ndGgsIHNsaWRlZE9iaiwgc2xpZGVkUHJvcCkge1xuXHR0aGlzLnNsaWRlclBvaW50ID0gc2xpZGVyUG9pbnRcblx0dGhpcy54T3JZID0geE9yWVxuXHR0aGlzLnNsaWRlclplcm9WYWx1ZSA9IHNsaWRlclplcm9WYWx1ZVxuXHR0aGlzLnNsaWRlclJhbmdlTGVuZ3RoID0gc2xpZGVyUmFuZ2VMZW5ndGhcblx0dGhpcy5zbGlkZWRPYmogPSBzbGlkZWRPYmpcblx0dGhpcy5zbGlkZWRQcm9wID0gc2xpZGVkUHJvcFxuXHR0aGlzLnNsaWRlZE9ialByb3BaZXJvVmFsdWUgPSBzbGlkZWRPYmpbc2xpZGVkUHJvcF1cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3NsaWRlclBvaW50OiAnUG9pbnQnLCB4T3JZOiAnU3RyaW5nJywgc2xpZGVyWmVyb1ZhbHVlOiAnTnVtYmVyJywgc2xpZGVyUmFuZ2VMZW5ndGg6ICdOdW1iZXInLCBzbGlkZWRPYmpQcm9wWmVyb1ZhbHVlOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQoUG9pbnQuZHVtbXkoeCwgeSksICd4JywgMCwgMTAwLCB7Zm9vOiAwfSwgJ2ZvbycpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc2xpZGVkUHJvcCA9IHRoaXMuc2xpZGVkUHJvcFxuXHR2YXIgY3VyclNsaWRlckRpZmYgPSAodGhpcy5zbGlkZXJaZXJvVmFsdWUgLSB0aGlzLnNsaWRlclBvaW50W3RoaXMueE9yWV0pIC8gdGhpcy5zbGlkZXJSYW5nZUxlbmd0aFxuXHR2YXIgc2xpZGVkT2JqUHJvcFRhcmdldCA9ICgxICsgY3VyclNsaWRlckRpZmYpICogdGhpcy5zbGlkZWRPYmpQcm9wWmVyb1ZhbHVlXG5cdHJldHVybiBzbGlkZWRPYmpQcm9wVGFyZ2V0IC0gdGhpcy5zbGlkZWRPYmpbc2xpZGVkUHJvcF1cblxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc29sbiA9IHt9XG5cdHZhciBzbGlkZWRQcm9wID0gdGhpcy5zbGlkZWRQcm9wXG5cdHZhciBjdXJyU2xpZGVyRGlmZiA9ICh0aGlzLnNsaWRlclplcm9WYWx1ZSAtIHRoaXMuc2xpZGVyUG9pbnRbdGhpcy54T3JZXSkgLyB0aGlzLnNsaWRlclJhbmdlTGVuZ3RoXG5cdHZhciBzbGlkZWRPYmpQcm9wVGFyZ2V0ID0gKDEgKyBjdXJyU2xpZGVyRGlmZikgKiB0aGlzLnNsaWRlZE9ialByb3BaZXJvVmFsdWVcblx0c29sbltzbGlkZWRQcm9wXSA9IHNsaWRlZE9ialByb3BUYXJnZXRcblx0dGhpcy5zbGlkZXJQb2ludC5zZWxlY3Rpb25JbmRpY2VzWzBdID0gTWF0aC5mbG9vcigxMDAgKiBjdXJyU2xpZGVyRGlmZilcblx0cmV0dXJuIHtzbGlkZWRPYmo6IHNvbG59XG4gICAgfVxuXG4gICAgLy8gTW90aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fVmVsb2NpdHlDb25zdHJhaW50KHBvc2l0aW9uLCB2ZWxvY2l0eSkge1xuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludChQb2ludCBQb3MsIFZlY3RvciBWZWxvY2l0eSkgc3RhdGVzIFBvcyA9IG9sZChQb3MpICsgVmVsb2NpdHkgKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3Bvc2l0aW9uOiAnUG9pbnQnLCB2ZWxvY2l0eTogJ1ZlY3Rvcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50KFBvaW50LmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCArIDUwLCB5ICsgNTApKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR0aGlzLmxhc3RQb3NpdGlvbiA9IHNjYWxlZEJ5KHRoaXMucG9zaXRpb24sIDEpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eSwgZHQpKSwgdGhpcy5wb3NpdGlvbikpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiBwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCBkdCkpfVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgY3R4dCA9IGNhbnZhcy5jdHh0XG5cdHZhciBzbG9wZVYgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZVZlY3Rvcih0aGlzLnBvc2l0aW9uLCB0aGlzLnZlbG9jaXR5KVx0XG5cdHZhciBsZW4gPSA1MFxuXHR2YXIgcCA9IHBsdXModGhpcy5wb3NpdGlvbiwge3g6IC1zbG9wZVYueCAqIGxlbiwgeTogc2xvcGVWLnkgKiBsZW59KVxuXHRjYW52YXMuZHJhd0Fycm93KHRoaXMucG9zaXRpb24sIHAsIG9yaWdpbiwgJ3YnKVxuICAgIH1cbiAgICBcbiAgICAvLyBCb2R5IFdpdGggVmVsb2NpdHkgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50MiA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fVmVsb2NpdHlDb25zdHJhaW50Mihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIoUG9pbnQgUG9zLCBQb2ludFZlY3RvciBWZWxvY2l0eSkgc3RhdGVzIFBvcyA9IG9sZChQb3MpICsgVmVsb2NpdHkgKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwb3NpdGlvbjogJ1BvaW50JywgdmVsb2NpdHk6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIoUG9pbnQuZHVtbXkoeCwgeSksIFBvaW50LmR1bW15KHggKyA1MCwgeSArIDUwKSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5Lm1hZ25pdHVkZSgpLCBkdCkpLCB0aGlzLnBvc2l0aW9uKSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHtwb3NpdGlvbjogcGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eS5tYWduaXR1ZGUoKSwgZHQpKX1cbiAgICB9XG4gICAgXG4gICAgLy8gQWNjZWxlcmF0aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0FjY2VsZXJhdGlvbkNvbnN0cmFpbnQodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuXHR0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb25cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50KFZlY3RvciBWZWxvY2l0eSwgVmVjdG9yIEFjY2VsZXJhdGlvbikgc3RhdGVzIFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSArIEFjY2VsZXJhdGlvbiAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3Bvc2l0aW9uOiAnUG9pbnQnLCB2ZWxvY2l0eTogJ1ZlY3Rvcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQoU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCArIDUwLCB5ICsgNTApKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RWZWxvY2l0eSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSksIHRoaXMudmVsb2NpdHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7dmVsb2NpdHk6IHBsdXModGhpcy5sYXN0VmVsb2NpdHksIHNjYWxlZEJ5KHRoaXMuYWNjZWxlcmF0aW9uLCBkdCkpfVxuICAgIH1cblxuICAgIC8vIEFpciBSZXNpc3RhbmNlIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19BaXJSZXNpc3RhbmNlQ29uc3RyYWludCh2ZWxvY2l0eSwgc2NhbGUpIHtcblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG5cdHRoaXMuc2NhbGUgPSAtc2NhbGVcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50KFZlY3RvciBWZWxvY2l0eSwgTnVtYmVyIFNjYWxlKSBzdGF0ZXMgVmVsb2NpdHkgPSBvbGQoVmVsb2NpdHkpICogU2NhbGUgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3NjYWxlOiAnTnVtYmVyJywgdmVsb2NpdHk6ICdWZWN0b3InfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQoU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHgsIHkpLCAuMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFZlbG9jaXR5ID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eSwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhzY2FsZWRCeSh0aGlzLmxhc3RWZWxvY2l0eSwgdGhpcy5zY2FsZSksIHRoaXMudmVsb2NpdHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7dmVsb2NpdHk6IHNjYWxlZEJ5KHRoaXMubGFzdFZlbG9jaXR5LCB0aGlzLnNjYWxlKX1cbiAgICB9XG5cbiAgICAvLyAgQm91bmNlIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0JvdW5jZUNvbnN0cmFpbnQobGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSB7XG5cdHRoaXMuaGFsZkxlbmd0aCA9IGxlbmd0aCAvIDJcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuXHR0aGlzLnN1cmZhY2VQMSA9IHN1cmZhY2VQMVxuXHR0aGlzLnN1cmZhY2VQMiA9IHN1cmZhY2VQMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQoTnVtYmVyIEwsIFBvaW50IFBvcywgVmVjdG9yIFZlbCwgUG9pbnQgRW5kMSwgUG9pbnQgRW5kMikgc3RhdGVzIHRoYXQgdGhlIGJvZHkgd2l0aCBkaWFtZXRlciBMIGFuZCBwb3NpdGlvbiBQb3MgYW5kIHZlbG9jaXR5IHZlY3RvciBWZWwgaXMgZ29pbmcgdG8gYm91bmNlIG9mZiB0aGUgbGluZSB3aXRoIHR3byBlbmQgcG9pbnRzIEVuZDEgJiBFbmQyLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7aGFsZkxlbmd0aDogJ051bWJlcicsIHBvc2l0aW9uOiAnUG9pbnQnLCB2ZWxvY2l0eTogJ1ZlY3RvcicsIHN1cmZhY2VQMTogJ1BvaW50Jywgc3VyZmFjZVAyOiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50KDEwLCBQb2ludC5kdW1teSh4LCB5KSwgU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHgsIHkpLCBQb2ludC5kdW1teSh4LCB5KSwgUG9pbnQuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcG9zZU5leHRQc2V1ZG9UaW1lID0gZnVuY3Rpb24ocHNldWRvVGltZSkge1xuXHR2YXIgcmVzID0gcHNldWRvVGltZSArIFNrZXRjaHBhZC5zaW11bGF0aW9uLmNvbXB1dGVDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgdGhpcy5wb3NpdGlvbiwgdGhpcy52ZWxvY2l0eSwgdGhpcy5zdXJmYWNlUDEsIHRoaXMuc3VyZmFjZVAyKVxuXHR0aGlzLnRjb250YWN0ID0gcmVzO1xuXHRyZXR1cm4gcmVzXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uXG5cdHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHlcblx0dmFyIHN1cmZhY2VQMSA9IHRoaXMuc3VyZmFjZVAxXG5cdHZhciBzdXJmYWNlUDIgPSB0aGlzLnN1cmZhY2VQMlxuICAgICAgICAvL1NrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSkge1xuXHRpZiAodGhpcy50Y29udGFjdCA9PSBwc2V1ZG9UaW1lKSB7IFxuXHQgICAgdGhpcy50Y29udGFjdCA9IHVuZGVmaW5lZFxuXHQgICAgdmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdCAgICB2YXIgc2xvcGUgPSAoc3VyZmFjZVAyLnkgLSBzdXJmYWNlUDEueSkgLyAoc3VyZmFjZVAyLnggLSBzdXJmYWNlUDEueClcblx0ICAgIHZhciBzdXJmYWNlSGl0UG9zWCA9IHN1cmZhY2VQMi55ID09IHN1cmZhY2VQMS55ID8gcG9zaXRpb24ueCA6ICgocG9zaXRpb24ueSAtIHN1cmZhY2VQMS55KSAvIHNsb3BlKSArIHN1cmZhY2VQMS54XG5cdCAgICB2YXIgc3VyZmFjZUhpdFBvc1kgPSBzdXJmYWNlUDIueCA9PSBzdXJmYWNlUDEueCA/IHBvc2l0aW9uLnkgOiAoKHBvc2l0aW9uLnggLSBzdXJmYWNlUDEueCkgKiBzbG9wZSkgKyBzdXJmYWNlUDEueVxuXHQgICAgdmFyIHN1cmZhY2VBbmdsZSA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLmFuZ2xlKHN1cmZhY2VQMSwgc3VyZmFjZVAyKVxuXHQgICAgdmFyIHZlbG9jaXR5QW5nbGUgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5hbmdsZSh7eDogMCwgeTogMH0sIHZlbG9jaXR5KVxuXHQgICAgdmFyIHJlZmxlY3Rpb25BbmdsZSA9IHN1cmZhY2VBbmdsZSAtIHZlbG9jaXR5QW5nbGUgXG5cdCAgICB2YXIgdmVsb2NpdHlNYWduaXR1ZGUgPSBNYXRoLnNxcnQoKHZlbG9jaXR5LnggKiB2ZWxvY2l0eS54KSArICh2ZWxvY2l0eS55ICogdmVsb2NpdHkueSkpXG5cdCAgICB2YXIgYW5nbGVDID0gTWF0aC5jb3MocmVmbGVjdGlvbkFuZ2xlKVxuXHQgICAgdmFyIGFuZ2xlUyA9IE1hdGguc2luKHJlZmxlY3Rpb25BbmdsZSlcblx0ICAgIHZhciB4ID0gYW5nbGVDICogdmVsb2NpdHlNYWduaXR1ZGUgKiAxXG5cdCAgICB2YXIgeSA9IGFuZ2xlUyAqIHZlbG9jaXR5TWFnbml0dWRlICogLTFcblx0ICAgIHRoaXMuYm91bmNlVmVsb2NpdHkgPSBzY2FsZWRCeSh7eDogeCwgeTogeX0sIDEpXG5cdCAgICB2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3Ioc3VyZmFjZVAxLCBzdXJmYWNlUDIpXG5cdCAgICB2YXIgZGVsdGFQb3NYID0gc2xvcGVWLnggKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIGR0XG5cdCAgICB2YXIgZGVsdGFQb3NZID0gc2xvcGVWLnkgKiAtdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgdGhpcy5ib3VuY2VQb3NpdGlvbiA9IHt4OiBwb3NpdGlvbi54ICsgZGVsdGFQb3NYLCB5OiBwb3NpdGlvbi55ICsgZGVsdGFQb3NZfVxuXG5cdCAgICAvLyBIQUNLIEZJWE1FPyBzZXQgdmVsb2NpdHkgYXRvbWljYWxseSByaWdodCBoZXJlISFcblx0ICAgIC8vdGhpcy5jb250YWN0ID0gdHJ1ZVxuXHQgICAgdmVsb2NpdHkueCA9IHRoaXMuYm91bmNlVmVsb2NpdHkueFxuXHQgICAgdmVsb2NpdHkueSA9IHRoaXMuYm91bmNlVmVsb2NpdHkueVxuXHQgICAgcG9zaXRpb24ueCA9IHRoaXMuYm91bmNlUG9zaXRpb24ueFxuXHQgICAgcG9zaXRpb24ueSA9IHRoaXMuYm91bmNlUG9zaXRpb24ueVxuXG5cdH0gZWxzZVxuXHQgICAgdGhpcy5jb250YWN0ID0gZmFsc2VcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHQvKlxuXHQgIHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHlcblx0ICB2YXIgc3VyZmFjZVAxID0gdGhpcy5zdXJmYWNlUDFcblx0ICB2YXIgc3VyZmFjZVAyID0gdGhpcy5zdXJmYWNlUDJcblx0ICByZXR1cm4gdGhpcy5jb250YWN0ID8gKFxuXHQgIG1hZ25pdHVkZShtaW51cyh0aGlzLmJvdW5jZVZlbG9jaXR5LCB0aGlzLnZlbG9jaXR5KSkgXG5cdCAgKyBtYWduaXR1ZGUobWludXModGhpcy5ib3VuY2VQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbikpIFxuXHQgICkgOiAwXG5cdCovXG5cdHJldHVybiAwXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHQvKlxuXHQgIHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHQgIHJldHVybiB7dmVsb2NpdHk6IFxuXHQgIG1pbnVzKHBsdXModGhpcy5ib3VuY2VWZWxvY2l0eSwgc2NhbGVkQnkoe3g6IDAsIHk6IC1Ta2V0Y2hwYWQuc2ltdWxhdGlvbi5nfSwgZHQpKSwgdGhpcy52ZWxvY2l0eSksXG5cdCAgcG9zaXRpb246IChtaW51cyh0aGlzLmJvdW5jZVBvc2l0aW9uLCB0aGlzLnBvc2l0aW9uKSlcblx0ICB9XG5cdCovXG5cdHJldHVybiB7fVxuICAgIH1cblxuICAgIC8vICBIaXRTdXJmYWNlIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19IaXRTdXJmYWNlQ29uc3RyYWludChsZW5ndGgsIHBvc2l0aW9uLCB2ZWxvY2l0eSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpIHtcblx0dGhpcy5oYWxmTGVuZ3RoID0gbGVuZ3RoIC8gMlxuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG5cdHRoaXMuc3VyZmFjZVAxID0gc3VyZmFjZVAxXG5cdHRoaXMuc3VyZmFjZVAyID0gc3VyZmFjZVAyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludChOdW1iZXIgTCwgUG9pbnQgUG9zLCBWZWN0b3IgVmVsLCBQb2ludCBFbmQxLCBQb2ludCBFbmQyKSBzdGF0ZXMgdGhhdCB0aGUgYm9keSB3aXRoIGRpYW1ldGVyIEwgYW5kIHBvc2l0aW9uIFBvcyBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbCBpcyBnb2luZyB0byBsYW5kIGFuZCBzdGF5IG9uIHRoZSBsaW5lIHdpdGggdHdvIGVuZCBwb2ludHMgRW5kMSAmIEVuZDIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7aGFsZkxlbmd0aDogJ051bWJlcicsIHBvc2l0aW9uOiAnUG9pbnQnLCB2ZWxvY2l0eTogJ1ZlY3RvcicsIHN1cmZhY2VQMTogJ1BvaW50Jywgc3VyZmFjZVAyOiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQoMTAsIFBvaW50LmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIFBvaW50LmR1bW15KHgsIHkpLCBQb2ludC5kdW1teSh4LCB5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uXG5cdHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHlcblx0dmFyIHN1cmZhY2VQMSA9IHRoaXMuc3VyZmFjZVAxXG5cdHZhciBzdXJmYWNlUDIgPSB0aGlzLnN1cmZhY2VQMlxuXHRpZiAoU2tldGNocGFkLnNpbXVsYXRpb24uZGV0ZWN0Q29udGFjdCh0aGlzLmhhbGZMZW5ndGgsIHBvc2l0aW9uLCB2ZWxvY2l0eSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpKSB7XG5cdCAgICB0aGlzLmNvbnRhY3QgPSB0cnVlXG5cdCAgICB2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0ICAgIHZhciBzbG9wZVYgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZVZlY3RvcihzdXJmYWNlUDEsIHN1cmZhY2VQMilcblx0ICAgIHRoaXMuaGl0VmVsb2NpdHkgPSBzY2FsZWRCeSh7eDogMCwgeTogLVNrZXRjaHBhZC5zaW11bGF0aW9uLmd9LCBkdClcblx0ICAgIHZhciB2ZWxvY2l0eU1hZ25pdHVkZSA9IE1hdGguc3FydCgodmVsb2NpdHkueCAqIHZlbG9jaXR5LngpICsgKHZlbG9jaXR5LnkgKiB2ZWxvY2l0eS55KSlcblx0ICAgIGRlbHRhUG9zWCA9IHNsb3BlVi54ICogdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgZGVsdGFQb3NZID0gc2xvcGVWLnkgKiAtdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgdGhpcy5oaXRQb3NpdGlvbiA9IHt4OiBwb3NpdGlvbi54ICsgZGVsdGFQb3NYLCB5OiBwb3NpdGlvbi55ICsgZGVsdGFQb3NZfVxuXHR9IGVsc2Vcblx0ICAgIHRoaXMuY29udGFjdCA9IGZhbHNlXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy5jb250YWN0ID8gKFxuXHQgICAgbWFnbml0dWRlKG1pbnVzKHRoaXMuaGl0VmVsb2NpdHksIHRoaXMudmVsb2NpdHkpKSArIFxuXHRcdG1hZ25pdHVkZShtaW51cyh0aGlzLmhpdFBvc2l0aW9uLCB0aGlzLnBvc2l0aW9uKSkgXG5cdCkgOiAwXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogdGhpcy5oaXRWZWxvY2l0eSwgcG9zaXRpb246IHRoaXMuaGl0UG9zaXRpb259XG4gICAgfVxuXG4gICAgLy8gQ29udmV5b3IgQmVsdCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19Db252ZXlvckJlbHRDb25zdHJhaW50KGxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBiZWx0KSB7XG5cdHRoaXMuaGFsZkxlbmd0aCA9IGxlbmd0aCAvIDJcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuXHR0aGlzLmJlbHQgPSBiZWx0XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludChOdW1iZXIgTCwgUG9pbnQgUG9zLCBWZWN0b3IgVmVsLCBDb252ZXlvckJlbHQgQmVsdCkgc3RhdGVzIHRoYXQgdGhlIGJvZHkgd2l0aCBkaWFtZXRlciBMIGFuZCBwb3NpdGlvbiBQb3MgYW5kIHZlbG9jaXR5IHZlY3RvciBWZWwgaXMgZ29pbmcgdG8gbGFuZCBhbmQgbW92ZSBiYXNlZCBvbiB0aGUgY29udmV5b3IgYmVsdCBCZWx0J3MgdmVsb2NpdHkuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtoYWxmTGVuZ3RoOiAnTnVtYmVyJywgcG9zaXRpb246ICdQb2ludCcsIHZlbG9jaXR5OiAnVmVjdG9yJywgYmVsdDogJ0JlbHQnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50KDEwLCBQb2ludC5kdW1teSh4LCB5KSwgU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHgsIHkpLCBCZWx0LmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eVxuXHR2YXIgYmVsdCA9IHRoaXMuYmVsdFxuXHR2YXIgYmVsdFAxID0gYmVsdC5wb3NpdGlvbjFcblx0dmFyIGJlbHRQMiA9IGJlbHQucG9zaXRpb24yXG5cdHZhciBiZWx0U3BlZWQgPSBiZWx0LnNwZWVkXG5cdGlmIChTa2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgdGhpcy5wb3NpdGlvbiwgdmVsb2NpdHksIGJlbHRQMSwgYmVsdFAyKSkge1xuXHQgICAgdGhpcy5jb250YWN0ID0gdHJ1ZVxuXHQgICAgdmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKGJlbHRQMSwgYmVsdFAyKVxuXHQgICAgdGhpcy50YXJnZXRWZWxvY2l0eSA9IHt4OiB2ZWxvY2l0eS54ICsgKC1zbG9wZVYueSAqIGJlbHRTcGVlZCksIHk6IHZlbG9jaXR5LnkgKyAoc2xvcGVWLnggKiBiZWx0U3BlZWQpfVxuXHR9IGVsc2Vcblx0ICAgIHRoaXMuY29udGFjdCA9IGZhbHNlXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBiZWx0ID0gdGhpcy5iZWx0XG5cdHZhciBiZWx0UDEgPSBiZWx0LnBvc2l0aW9uMVxuXHR2YXIgYmVsdFAyID0gYmVsdC5wb3NpdGlvbjJcblx0cmV0dXJuIChTa2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgdGhpcy5wb3NpdGlvbiwgdGhpcy52ZWxvY2l0eSwgYmVsdFAxLCBiZWx0UDIpKSA/IDEgOiAwXHRcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy5jb250YWN0ID8gbWFnbml0dWRlKG1pbnVzKHRoaXMudGFyZ2V0VmVsb2NpdHksIHRoaXMudmVsb2NpdHkpKSA6IDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7dmVsb2NpdHk6IHRoaXMudGFyZ2V0VmVsb2NpdHl9XG4gICAgfVxuXG4gICAgLy8gTm9PdmVybGFwIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX05vT3ZlcmxhcENvbnN0cmFpbnQobGVuZ3RoMSwgcG9zaXRpb24xLCB2ZWxvY2l0eTEsIGxlbmd0aDIsIHBvc2l0aW9uMiwgdmVsb2NpdHkyKSB7XG5cdHRoaXMubGVuZ3RoMSA9IGxlbmd0aDFcblx0dGhpcy5wb3NpdGlvbjEgPSBwb3NpdGlvbjFcblx0dGhpcy52ZWxvY2l0eTEgPSB2ZWxvY2l0eTFcblx0dGhpcy5sZW5ndGgyID0gbGVuZ3RoMlxuXHR0aGlzLnBvc2l0aW9uMiA9IHBvc2l0aW9uMlxuXHR0aGlzLnZlbG9jaXR5MiA9IHZlbG9jaXR5MlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQoTnVtYmVyIEwxLCBQb2ludCBQb3MxLCBWZWN0b3IgVmVsMSwgTnVtYmVyIEwyLCBQb2ludCBQb3MyLCBWZWN0b3IgVmVsMikgc3RhdGVzIHRoYXQgdGhlIGJvZHkgd2l0aCBkaWFtZXRlciBMMSBhbmQgcG9zaXRpb24gUG9zMSBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbDEgYW5kIHRoZSBib2R5IHdpdGggZGlhbWV0ZXIgTDIgYW5kIHBvc2l0aW9uIFBvczIgYW5kIHZlbG9jaXR5IHZlY3RvciBWZWwyIHdpbGwgcHVzaCBlYWNoIG90aGVyIGlmIHRvdWNoaW5nLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7bGVuZ3RoMTogJ051bWJlcicsIHBvc2l0aW9uMTogJ1BvaW50JywgdmVsb2NpdHkxOiAnVmVjdG9yJywgbGVuZ3RoMjogJ051bWJlcicsIHBvc2l0aW9uMjogJ1BvaW50JywgdmVsb2NpdHkyOiAnVmVjdG9yJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludCgxMCwgUG9pbnQuZHVtbXkoeCwgeSksIFNrZXRjaHBhZC5nZW9tLlZlY3Rvci5kdW1teSh4LCB5KSwgMTAsIFBvaW50LmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGxlbmd0aDEgPSB0aGlzLmxlbmd0aDFcblx0dmFyIHBvc2l0aW9uMSA9IHRoaXMucG9zaXRpb24xXG5cdHZhciB2ZWxvY2l0eTEgPSB0aGlzLnZlbG9jaXR5MVxuXHR2YXIgbGVuZ3RoMiA9IHRoaXMubGVuZ3RoMlxuXHR2YXIgcG9zaXRpb24yID0gdGhpcy5wb3NpdGlvbjJcblx0dmFyIHAxeCA9IHBvc2l0aW9uMS54LCBwMXkgPSBwb3NpdGlvbjEueVxuXHR2YXIgcDJ4ID0gcG9zaXRpb24yLngsIHAyeSA9IHBvc2l0aW9uMi55XG5cdHJldHVybiAoKHAxeCA+IHAyeCAtIGxlbmd0aDIgLyAyICYmIHAxeCA8IHAyeCArIGxlbmd0aDIpICYmXG5cdFx0KHAxeSA+IHAyeSAtIGxlbmd0aDIgLyAyICYmIHAxeSA8IHAyeSArIGxlbmd0aDIpKSA/IDEgOiAwXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbGVuZ3RoMSA9IHRoaXMubGVuZ3RoMVxuXHR2YXIgcG9zaXRpb24xID0gdGhpcy5wb3NpdGlvbjFcblx0dmFyIHZlbG9jaXR5MSA9IHRoaXMudmVsb2NpdHkxXG5cdHZhciBsZW5ndGgyID0gdGhpcy5sZW5ndGgyXG5cdHZhciBwb3NpdGlvbjIgPSB0aGlzLnBvc2l0aW9uMlxuXHR2YXIgcDF4ID0gcG9zaXRpb24xLnhcblx0dmFyIHAyeCA9IHBvc2l0aW9uMi54XG5cdHZhciBzb2xuID0gcDF4ID4gcDJ4ID8ge3Bvc2l0aW9uMjoge3g6IHAxeCAtIChsZW5ndGgyKX19IDoge3Bvc2l0aW9uMToge3g6IHAyeCAtIChsZW5ndGgxKX19XG5cdHJldHVybiBzb2xuXG4gICAgfVxuXG4gICAgLy8gIFNwcmluZyBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19TcHJpbmdDb25zdHJhaW50KHBvc2l0aW9uMSwgdmVsb2NpdHkxLCBhY2NlbGVyYXRpb24xLCBtYXNzMSwgcG9zaXRpb24yLCB2ZWxvY2l0eTIsIGFjY2VsZXJhdGlvbjIsIG1hc3MyLCBzcHJpbmcpIHtcblx0dGhpcy5wb3NpdGlvbjEgPSBwb3NpdGlvbjFcblx0dGhpcy52ZWxvY2l0eTEgPSB2ZWxvY2l0eTFcblx0dGhpcy5hY2NlbGVyYXRpb24xID0gYWNjZWxlcmF0aW9uMVxuXHR0aGlzLm1hc3MxID0gbWFzczFcblx0dGhpcy5wb3NpdGlvbjIgPSBwb3NpdGlvbjJcblx0dGhpcy52ZWxvY2l0eTIgPSB2ZWxvY2l0eTJcblx0dGhpcy5hY2NlbGVyYXRpb24yID0gYWNjZWxlcmF0aW9uMlxuXHR0aGlzLm1hc3MyID0gbWFzczJcblx0dGhpcy5zcHJpbmcgPSBzcHJpbmdcblx0dGhpcy5fbGFzdFZlbG9jaXRpZXMgPSBbdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludChQb2ludCBQb3MxLCBWZWN0b3IgVmVsMSwgVmVjdG9yIEFjYzEsIE51bWJlciBNYXNzMSwgUG9pbnQgUG9zMiwgVmVjdG9yIFZlbDIsIFZlY3RvciBBY2MyLCBOdW1iZXIgTWFzczIsIFNwcmluZyBTKSBzdGF0ZXMgdGhhdCBzcHJpbmcgUyBoYXMgYmVlbiBhdHRhY2hlZCB0byB0d28gYm9kaWVzIHdpdGggcG9zaXRpb25zLCB2ZWxvY2l0aWVzLCBhY2NlbGVyYXRpb25zLCBhbmQgbWFzc2VzIG9mIHJlc3BlY3RpdmVseSBQb3MxLCBQb3MyLCBWZWwxLCBWZWwyLCBBY2MxLCBBY2MyLCBNYXNzMSwgTWFzczIuIFwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cG9zaXRpb24xOiAnUG9pbnQnLCB2ZWxvY2l0eTE6ICdWZWN0b3InLCBhY2NlbGVyYXRpb24xOiAnVmVjdG9yJywgbWFzczE6ICdOdW1iZXInLCBwb3NpdGlvbjI6ICdQb2ludCcsIHZlbG9jaXR5MjogJ1ZlY3RvcicsIGFjY2VsZXJhdGlvbjI6ICdWZWN0b3InLCBtYXNzMjogJ051bWJlcicsIHNwcmluZzogJ1NwcmluZyd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQoUG9pbnQuZHVtbXkoeCwgeSksIFNrZXRjaHBhZC5nZW9tLlZlY3Rvci5kdW1teSh4LCB5KSwgU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHgsIHkpLCAwLCBQb2ludC5kdW1teSh4LCB5KSwgU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIDEwLCBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMuX2xhc3RWZWxvY2l0aWVzWzBdID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eTEsIDEpXG5cdHRoaXMuX2xhc3RWZWxvY2l0aWVzWzFdID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eTIsIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNwcmluZyA9IHRoaXMuc3ByaW5nXG5cdGlmIChzcHJpbmcudG9ybikge1xuXHQgICAgcmV0dXJuIDBcblx0fVxuXHR2YXIgcG9zaXRpb25zID0gW3RoaXMucG9zaXRpb24xLCB0aGlzLnBvc2l0aW9uMl1cblx0dmFyIG1hc3NlcyA9IFt0aGlzLm1hc3MxLCB0aGlzLm1hc3MyXVxuXHR2YXIgdmVsb2NpdGllcyA9IFt0aGlzLnZlbG9jaXR5MSwgdGhpcy52ZWxvY2l0eTJdXG5cdHZhciBhY2NlbGVyYXRpb25zID0gW3RoaXMuYWNjZWxlcmF0aW9uMSwgdGhpcy5hY2NlbGVyYXRpb24yXVxuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0dmFyIGVyciA9IDBcblx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gMTsgaSsrKSB7XG5cdCAgICB2YXIgaiA9IChpICsgMSkgJSAyXG5cdCAgICB2YXIgbWFzcyA9IG1hc3Nlc1tqXVxuXHQgICAgdmFyIGQgPSB7eDogMCwgeTogMH1cblx0ICAgIGlmIChtYXNzID4gMCkgeyAvLyBpZiBub3QgYW5jaG9yZWRcblx0XHR2YXIgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3RvcilcdFx0XG5cdFx0dmFyIHN0cmV0Y2hMZW4gPSAgc3ByaW5nQ3VyckxlbiAtIHNwcmluZy5sZW5ndGhcblx0XHR2YXIgbmV3QWNjZWxlcmF0aW9uTWFnID0gc3ByaW5nLmsgKiBzdHJldGNoTGVuIC8gbWFzc1xuXHRcdHZhciBhY2MgPSBzY2FsZWRCeShub3JtYWxpemVkKHZlY3RvciksIC1uZXdBY2NlbGVyYXRpb25NYWcpXG5cdFx0ZXJyICs9IG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMuX2xhc3RWZWxvY2l0aWVzW2pdLCBzY2FsZWRCeShhY2MsIGR0KSksIHZlbG9jaXRpZXNbal0pKVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiBlcnJcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzb2xuID0ge31cblx0dmFyIHNwcmluZyA9IHRoaXMuc3ByaW5nXG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRmb3IgKHZhciBpID0gMDsgaSA8PSAxOyBpKyspIHtcblx0ICAgIHZhciBqID0gKGkgKyAxKSAlIDJcblx0ICAgIHZhciBtYXNzID0gbWFzc2VzW2pdXG5cdCAgICB2YXIgZCA9IHt4OiAwLCB5OiAwfVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFxuXHRcdFx0XHR2YXIgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3Rvcilcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdC8vIGlmIG5vdCB0b3JuIGFwYXJ0Li4uXG5cdFx0aWYgKHN0cmV0Y2hMZW4gPCBzcHJpbmcudGVhclBvaW50QW1vdW50KSB7XG5cdFx0ICAgIHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0ICAgIHZhciBhY2MgPSBzY2FsZWRCeShub3JtYWxpemVkKHZlY3RvciksIC1uZXdBY2NlbGVyYXRpb25NYWcpXG5cdFx0ICAgIGQgPSBwbHVzKHRoaXMuX2xhc3RWZWxvY2l0aWVzW2pdLCBzY2FsZWRCeShhY2MsIGR0KSlcblx0XHR9IGVsc2Uge1xuXHRcdCAgICBzb2xuWydzcHJpbmcnXSA9IHt0b3JuOiB0cnVlfVxuXHRcdH1cblx0ICAgIH1cblx0ICAgIHNvbG5bJ3ZlbG9jaXR5JyArIChqKzEpXSA9IGRcblx0fVx0XG5cdHJldHVybiBzb2xuXG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsM0RHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGdlb21ldHJpYyBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gICAgLy8gb2JqZWN0cyB0aGF0IGhhdmUgeCBhbmQgeSBwcm9wZXJ0aWVzLiBPdGhlciBwcm9wZXJ0aWVzIGFyZSBpZ25vcmVkLlxuXG4gICAgU2tldGNocGFkLmdlb20zZCA9IHt9XG5cbiAgICB2YXIgc3F1YXJlID0gU2tldGNocGFkLmdlb20uc3F1YXJlXG5cbiAgICBmdW5jdGlvbiBwbHVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggKyBwMi54LCB5OiBwMS55ICsgcDIueSwgejogcDEueiArIHAyLnp9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIG1pbnVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggLSBwMi54LCB5OiBwMS55IC0gcDIueSwgejogcDEueiAtIHAyLnp9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbGVkQnkocCwgbSkge1xuXHRyZXR1cm4ge3g6IHAueCAqIG0sIHk6IHAueSAqIG0sIHo6IHAueiAqIG19XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29weShwKSB7XG5cdHJldHVybiBzY2FsZWRCeShwLCAxKVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBtaWRwb2ludChwMSwgcDIpIHtcblx0cmV0dXJuIHNjYWxlZEJ5KHBsdXMocDEsIHAyKSwgMC41KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hZ25pdHVkZShwKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAueCkgKyBzcXVhcmUocC55KSArIHNxdWFyZShwLnopKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZWQocCkge1xuXHR2YXIgbSA9IG1hZ25pdHVkZShwKVxuXHRyZXR1cm4gbSA+IDAgPyBzY2FsZWRCeShwLCAxIC8gbSkgOiBwXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzdGFuY2UocDEsIHAyKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAxLnggLSBwMi54KSArIHNxdWFyZShwMS55IC0gcDIueSkgKyBzcXVhcmUocDEueiAtIHAyLnopKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJvdGF0ZWRCeShwLCBkVGhldGEpIHtcblx0dmFyIGMgPSBNYXRoLmNvcyhkVGhldGEpXG5cdHZhciBzID0gTWF0aC5zaW4oZFRoZXRhKVxuXHRyZXR1cm4ge3g6IGMqcC54IC0gcypwLnksIHk6IHMqcC54ICsgYypwLnksIHo6IHAuen1cbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gcm90YXRlZEFyb3VuZChwLCBkVGhldGEsIGF4aXMpIHtcblx0cmV0dXJuIHBsdXMoYXhpcywgcm90YXRlZEJ5KG1pbnVzKHAsIGF4aXMpLCBkVGhldGEpKVxuXHQvKlxuXHQvLyByb3RhdGUgdGhlIHBvaW50ICh4LHkseikgYWJvdXQgdGhlIHZlY3RvciDin6h1LHYsd+KfqSBieSB0aGUgYW5nbGUgzrggKGFyb3VuZCBvcmlnaW4/KVxuXHR2YXIgeCA9IHAueCwgeSA9IHAueSwgeiA9IHAueiwgdSA9IGF4aXMueCwgdiA9IGF4aXMueSwgdyA9IGF4aXMuelxuXHR2YXIgYyA9IE1hdGguY29zKGRUaGV0YSksIHMgPSBNYXRoLnNpbihkVGhldGEpXG5cdHZhciBvbmUgPSAodSAqIHgpICsgKHYgKiB5KSArICh3ICogeiksIHR3byA9ICh1ICogdSkgKyAodiAqIHYpICsgKHcgKiB3KSwgdGhyZWUgPSBNYXRoLnNxcnQodHdvKVxuXHRyZXR1cm4ge3g6ICgodSAqIG9uZSAqICgxIC0gYykpICArICh0d28gKiB4ICogYykgKyAodGhyZWUgKiBzICogKCh2ICogeikgLSAodyAqIHkpKSkpIC8gdHdvLFxuXHR5OiAoKHYgKiBvbmUgKiAoMSAtIGMpKSAgKyAodHdvICogeSAqIGMpICsgKHRocmVlICogcyAqICgodyAqIHgpIC0gKHUgKiB6KSkpKSAvIHR3byxcbiBcdHo6ICgodyAqIG9uZSAqICgxIC0gYykpICArICh0d28gKiB6ICogYykgKyAodGhyZWUgKiBzICogKCh1ICogeSkgLSAodiAqIHgpKSkpIC8gdHdvfVxuXHQqL1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBzZXREZWx0YShkLCBwLCBzY2FsZSkge1xuXHRkLnggPSBwLnggKiBzY2FsZVxuXHRkLnkgPSBwLnkgKiBzY2FsZVxuXHRkLnogPSBwLnogKiBzY2FsZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvdFByb2R1Y3QodjEsIHYyKSB7XG5cdHJldHVybiAodjEueCAqIHYyLngpICsgKHYxLnkgKiB2Mi55KSArICh2MS56ICogdjIueilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcm9zc1Byb2R1Y3QodjEsIHYyKSB7XG5cdHZhciBhID0gbmV3IFRIUkVFLlZlY3RvcjModjEueCwgdjEueSwgdjEueilcblx0dmFyIGIgPSBuZXcgVEhSRUUuVmVjdG9yMyh2Mi54LCB2Mi55LCB2Mi56KVxuXHR2YXIgYyA9IG5ldyBUSFJFRS5WZWN0b3IzKClcblx0Yy5jcm9zc1ZlY3RvcnMoIGEsIGIgKVxuXHRyZXR1cm4gbmV3IFBvaW50M0QoYy54LCBjLnksIGMueilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhbmdsZSh2MSwgdjIsIGF4aXMpIHtcblx0Ly92YXIgbGFuZ2xlID0gTWF0aC5hY29zKE1hdGgubWluKDEsIGRvdFByb2R1Y3Qobm9ybWFsaXplZCh2MSksIG5vcm1hbGl6ZWQodjIpKSkpXG5cdHZhciB2MW0gPSBTa2V0Y2hwYWQuZ2VvbTNkLm1hZ25pdHVkZSh2MSksIHYybSA9IFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlKHYyKVxuXHR2YXIgcHJvZDIgPSAodjFtICogdjJtKVxuXHRpZiAocHJvZDIgPT0gMClcblx0ICAgIGxhbmdsZSA9IDBcblx0ZWxzZSB7XG5cdCAgICB2YXIgcHJvZDEgPSBkb3RQcm9kdWN0KHYxLCB2Milcblx0ICAgIHZhciBkaXYgPSBNYXRoLm1pbigxLCBwcm9kMSAvIHByb2QyKVxuXHQgICAgbGFuZ2xlID0gTWF0aC5hY29zKGRpdilcblx0ICAgIHZhciBjcm9zcyA9IGNyb3NzUHJvZHVjdCh2MSwgdjIpXG5cdCAgICB2YXIgZG90ID0gZG90UHJvZHVjdChheGlzLCBjcm9zcylcblx0ICAgIGlmIChkb3QgPiAwKSAvLyBPciA+IDBcblx0XHRsYW5nbGUgPSAtbGFuZ2xlXG5cdH1cdFxuXHRyZXR1cm4gbGFuZ2xlXG4gICAgfVxuICAgICAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLnBsdXMgPSBwbHVzXG4gICAgU2tldGNocGFkLmdlb20zZC5taW51cyA9IG1pbnVzXG4gICAgU2tldGNocGFkLmdlb20zZC5zY2FsZWRCeSA9IHNjYWxlZEJ5XG4gICAgU2tldGNocGFkLmdlb20zZC5jb3B5ID0gY29weVxuICAgIFNrZXRjaHBhZC5nZW9tM2QubWlkcG9pbnQgPSBtaWRwb2ludFxuICAgIFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlID0gbWFnbml0dWRlXG4gICAgU2tldGNocGFkLmdlb20zZC5ub3JtYWxpemVkID0gbm9ybWFsaXplZFxuICAgIFNrZXRjaHBhZC5nZW9tM2QuZGlzdGFuY2UgPSBkaXN0YW5jZVxuICAgIFNrZXRjaHBhZC5nZW9tM2Qucm90YXRlZEJ5ID0gcm90YXRlZEJ5XG4gICAgU2tldGNocGFkLmdlb20zZC5hbmdsZSA9IGFuZ2xlXG4gICAgU2tldGNocGFkLmdlb20zZC5kb3RQcm9kdWN0ID0gZG90UHJvZHVjdFxuICAgIFNrZXRjaHBhZC5nZW9tM2QuY3Jvc3NQcm9kdWN0ID0gY3Jvc3NQcm9kdWN0XG4gICAgU2tldGNocGFkLmdlb20zZC5yb3RhdGVkQXJvdW5kID0gcm90YXRlZEFyb3VuZFxuICAgIFNrZXRjaHBhZC5nZW9tM2Quc2V0RGVsdGEgPSBzZXREZWx0YVxuXG4gICAgLy8gTGVuZ3RoIGNvbnN0cmFpbnQgLSBtYWludGFpbnMgZGlzdGFuY2UgYmV0d2VlbiBQMSBhbmQgUDIgYXQgTC5cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbTNkX19MZW5ndGhDb25zdHJhaW50KHAxLCBwMiwgbCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMubCA9IGxcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50KFBvaW50M0QgUDEsIFBvaW50M0QgUDIsIE51bWJlciBMKSBzYXlzIHBvaW50cyBQMSBhbmQgUDIgYWx3YXlzIG1haW50YWluIGEgZGlzdGFuY2Ugb2YgTC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludDNEJywgcDI6ICdQb2ludDNEJywgbDogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnAxLCBwcm9wczogWyd4JywgJ3knLCAneiddfSwge29iajogdGhpcy5wMiwgcHJvcHM6IFsneCcsICd5JywgJ3onXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKVxuXHRyZXR1cm4gbDEyIC0gdGhpcy5sXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHAxLCBwMikpXG5cdGlmIChsMTIgPT0gMCkge1xuXHQgICAgcDEgPSBwbHVzKHAxLCB7eDogMC4xLCB5OiAwLCB6OiAwfSlcblx0ICAgIHAyID0gcGx1cyhwMiwge3g6IC0wLjEsIHk6IDAsIHo6IDB9KVxuXHR9XG5cdHZhciBkZWx0YSA9IChsMTIgLSB0aGlzLmwpIC8gMlxuXHR2YXIgZTEyID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20zZC5ub3JtYWxpemVkKG1pbnVzKHAyLCBwMSkpLCBkZWx0YSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBlMTIpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShlMTIsIC0xKSl9XG4gICAgfVxuXG4gICAgLy8gTW90b3IgY29uc3RyYWludCAtIGNhdXNlcyBQMSBhbmQgUDIgdG8gb3JiaXQgdGhlaXIgbWlkcG9pbnQgYXQgdGhlIGdpdmVuIHJhdGUuXG4gICAgLy8gdyBpcyBpbiB1bml0cyBvZiBIeiAtIHdob2xlIHJvdGF0aW9ucyBwZXIgc2Vjb25kLlxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX01vdG9yQ29uc3RyYWludChwMSwgcDIsIHcpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLncgPSB3XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tM2QuTW90b3JDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBXKSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlIG9mIHcsIGluIHVuaXRzIG9mIEh6OiB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cIiB9IFxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCB3OiAnTnVtYmVyJ31cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIDFcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdCA9IChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC8gMTAwMC4wXG5cdHZhciBkVGhldGEgPSB0ICogdGhpcy53ICogKDIgKiBNYXRoLlBJKVxuXHR2YXIgbTEyID0gbWlkcG9pbnQodGhpcy5wMSwgdGhpcy5wMilcblx0cmV0dXJuIHtwMTogcm90YXRlZEFyb3VuZCh0aGlzLnAxLCBkVGhldGEsIG0xMiksXG5cdFx0cDI6IHJvdGF0ZWRBcm91bmQodGhpcy5wMiwgZFRoZXRhLCBtMTIpfVxuICAgIH1cbiAgICAgICAgXG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbDNER2VvbWV0cmljQ29uc3RyYWludHNcbiIsImZ1bmN0aW9uIGluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIHNpbXVsYXRpb24gY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZCA9IHsgZzogOS44IH1cblxuICAgIHZhciBtaW51cyA9IFNrZXRjaHBhZC5nZW9tM2QubWludXNcbiAgICB2YXIgcGx1cyA9IFNrZXRjaHBhZC5nZW9tM2QucGx1c1xuICAgIHZhciBzY2FsZWRCeSA9IFNrZXRjaHBhZC5nZW9tM2Quc2NhbGVkQnlcbiAgICB2YXIgbWFnbml0dWRlID0gU2tldGNocGFkLmdlb20zZC5tYWduaXR1ZGVcbiAgICB2YXIgbm9ybWFsaXplZCA9IFNrZXRjaHBhZC5nZW9tM2Qubm9ybWFsaXplZFxuICAgIHZhciBkaXN0YW5jZSA9IFNrZXRjaHBhZC5nZW9tM2QuZGlzdGFuY2VcbiAgICB2YXIgYW5nbGUgPSBTa2V0Y2hwYWQuZ2VvbTNkLmFuZ2xlXG5cbiAgICAvLyBDbGFzc2VzXG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb24zZF9fU3ByaW5nKGxpbmUsIGssIGxlbmd0aCwgdGVhclBvaW50QW1vdW50KSB7XG5cdHRoaXMubGluZSA9IHJjLmFkZChsaW5lKVxuXHR0aGlzLmsgPSBrXG5cdHRoaXMubGVuZ3RoID0gbGVuZ3RoICAgIFxuXHR0aGlzLnRlYXJQb2ludEFtb3VudCA9IHRlYXJQb2ludEFtb3VudFxuXHR0aGlzLnRvcm4gPSBmYWxzZVxuICAgIH1cbiAgICBcbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcpXG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7bGluZTogJ0N5bGluZGVyJywgazogJ051bWJlcicsIGxlbmd0aDogJ051bWJlcicsIHRlYXRQb2ludEFtb3VudDogJ051bWJlcid9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcucHJvdG90eXBlLnNvbHV0aW9uSm9pbnMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHt0b3JuOiByYy5za2V0Y2hwYWQubGFzdE9uZVdpbnNKb2luU29sdXRpb25zfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nLnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdGlmICh0aGlzLmxpbmUpIHtcblx0ICAgIGlmICh0aGlzLnRvcm4pIHtcblx0XHRyYy5yZW1vdmUodGhpcy5saW5lKVxuXHRcdHRoaXMubGluZSA9IHVuZGVmaW5lZFxuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgaGVpZ2h0ID0gdGhpcy5saW5lLmdldEhlaWdodCgpLCBsZW5ndGggPSB0aGlzLmxlbmd0aFxuXHRcdHZhciBzdHJldGNoID0gTWF0aC5hYnMoaGVpZ2h0IC0gbGVuZ3RoKSAvIGxlbmd0aFxuXHRcdHZhciBjb2xvciA9IHRoaXMubGluZS5fc2NlbmVPYmoubWF0ZXJpYWwuY29sb3Jcblx0XHRjb2xvci5zZXQoJ2JsdWUnKVxuXHRcdGNvbG9yLnIgKz0gc3RyZXRjaFxuXHQgICAgfVxuXHR9XG4gICAgfVxuXHQgICAgXG4gICAgLy8gTW90aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX1ZlbG9jaXR5Q29uc3RyYWludChwb3NpdGlvbiwgdmVsb2NpdHkpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQoUG9pbnQzRCBQb3MsIFZlY3RvcjNEIFZlbG9jaXR5KSBzdGF0ZXMgUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwb3NpdGlvbjogJ1BvaW50M0QnLCB2ZWxvY2l0eTogJ1ZlY3RvcjNEJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiBwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCBkdCkpfVxuICAgIH1cblxuICAgIC8vIEJvZHkgV2l0aCBWZWxvY2l0eSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb24zZF9fVmVsb2NpdHlDb25zdHJhaW50Mihwb3NpdGlvbiwgdmVsb2NpdHkpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIoUG9pbnQgUG9zLCBQb2ludFZlY3RvcjNEIFZlbG9jaXR5KSBzdGF0ZXMgUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cG9zaXRpb246ICdQb2ludCcsIHZlbG9jaXR5OiAnUG9pbnQnfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSl9XG4gICAgfVxuXG4gICAgLy8gQWNjZWxlcmF0aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19BY2NlbGVyYXRpb25Db25zdHJhaW50KHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludChWZWN0b3IgVmVsb2NpdHksIFZlY3RvciBBY2NlbGVyYXRpb24pIHN0YXRlcyBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKyBBY2NlbGVyYXRpb24gKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3Bvc2l0aW9uOiAnUG9pbnQzRCcsIHZlbG9jaXR5OiAnVmVjdG9yM0QnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0VmVsb2NpdHkgPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSksIHRoaXMudmVsb2NpdHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHt2ZWxvY2l0eTogcGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSl9XG4gICAgfVxuXG4gICAgICAgIC8vIEFpciBSZXNpc3RhbmNlIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb24zZF9fQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQodmVsb2NpdHksIHNjYWxlKSB7XG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuXHR0aGlzLnNjYWxlID0gLXNjYWxlXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludChWZWN0b3IzRCBWZWxvY2l0eSwgTnVtYmVyIFNjYWxlKSBzdGF0ZXMgVmVsb2NpdHkgPSBvbGQoVmVsb2NpdHkpICogU2NhbGUgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7c2NhbGU6ICdOdW1iZXInLCB2ZWxvY2l0eTogJ1ZlY3Rvcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0VmVsb2NpdHkgPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMoc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpLCB0aGlzLnZlbG9jaXR5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7dmVsb2NpdHk6IHNjYWxlZEJ5KHRoaXMubGFzdFZlbG9jaXR5LCB0aGlzLnNjYWxlKX1cbiAgICB9XG5cbiAgICAvLyAgU3ByaW5nIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19TcHJpbmdDb25zdHJhaW50KHBvc2l0aW9uMSwgdmVsb2NpdHkxLCBhY2NlbGVyYXRpb24xLCBtYXNzMSwgcG9zaXRpb24yLCB2ZWxvY2l0eTIsIGFjY2VsZXJhdGlvbjIsIG1hc3MyLCBzcHJpbmcpIHtcblx0dGhpcy5wb3NpdGlvbjEgPSBwb3NpdGlvbjFcblx0dGhpcy52ZWxvY2l0eTEgPSB2ZWxvY2l0eTFcblx0dGhpcy5hY2NlbGVyYXRpb24xID0gYWNjZWxlcmF0aW9uMVxuXHR0aGlzLm1hc3MxID0gbWFzczFcblx0dGhpcy5wb3NpdGlvbjIgPSBwb3NpdGlvbjJcblx0dGhpcy52ZWxvY2l0eTIgPSB2ZWxvY2l0eTJcblx0dGhpcy5hY2NlbGVyYXRpb24yID0gYWNjZWxlcmF0aW9uMlxuXHR0aGlzLm1hc3MyID0gbWFzczJcblx0dGhpcy5zcHJpbmcgPSBzcHJpbmdcblx0dGhpcy5fbGFzdFZlbG9jaXRpZXMgPSBbdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludChQb2ludCBQb3MxLCBWZWN0b3IgVmVsMSwgVmVjdG9yIEFjYzEsIE51bWJlciBNYXNzMSwgUG9pbnQgUG9zMiwgVmVjdG9yIFZlbDIsIFZlY3RvciBBY2MyLCBOdW1iZXIgTWFzczIsIFNwcmluZyBTKSBzdGF0ZXMgdGhhdCBzcHJpbmcgUyBoYXMgYmVlbiBhdHRhY2hlZCB0byB0d28gYm9kaWVzIHdpdGggcG9zaXRpb25zLCB2ZWxvY2l0aWVzLCBhY2NlbGVyYXRpb25zLCBhbmQgbWFzc2VzIG9mIHJlc3BlY3RpdmVseSBQb3MxLCBQb3MyLCBWZWwxLCBWZWwyLCBBY2MxLCBBY2MyLCBNYXNzMSwgTWFzczIuIFwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwb3NpdGlvbjE6ICdQb2ludCcsIHZlbG9jaXR5MTogJ1ZlY3RvcicsIGFjY2VsZXJhdGlvbjE6ICdWZWN0b3InLCBtYXNzMTogJ051bWJlcicsIHBvc2l0aW9uMjogJ1BvaW50JywgdmVsb2NpdHkyOiAnVmVjdG9yJywgYWNjZWxlcmF0aW9uMjogJ1ZlY3RvcicsIG1hc3MyOiAnTnVtYmVyJywgc3ByaW5nOiAnU3ByaW5nJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMuX2xhc3RWZWxvY2l0aWVzWzBdID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eTEsIDEpXG5cdHRoaXMuX2xhc3RWZWxvY2l0aWVzWzFdID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eTIsIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3ByaW5nID0gdGhpcy5zcHJpbmdcblx0aWYgKHNwcmluZy50b3JuKSB7XG5cdCAgICByZXR1cm4gMFxuXHR9XG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHR2YXIgZXJyID0gMFxuXHRmb3IgKHZhciBpID0gMDsgaSA8PSAxOyBpKyspIHtcblx0ICAgIHZhciBqID0gKGkgKyAxKSAlIDJcblx0ICAgIHZhciBtYXNzID0gbWFzc2VzW2pdXG5cdCAgICBpZiAobWFzcyA+IDApIHsgLy8gaWYgbm90IGFuY2hvcmVkXHRcdFxuXHRcdHZhciBhY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb25zW2pdXG5cdFx0dmFyIHBvc2l0aW9uMSA9IHBvc2l0aW9uc1tpXVxuXHRcdHZhciBwb3NpdGlvbjIgPSBwb3NpdGlvbnNbal1cblx0XHR2YXIgdmVjdG9yID0gbWludXMocG9zaXRpb24yLCBwb3NpdGlvbjEpXG5cdFx0dmFyIHNwcmluZ0N1cnJMZW4gPSBtYWduaXR1ZGUodmVjdG9yKVx0XHRcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0dmFyIGFjYyA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQodmVjdG9yKSwgLW5ld0FjY2VsZXJhdGlvbk1hZylcblx0XHRlcnIgKz0gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5fbGFzdFZlbG9jaXRpZXNbal0sIHNjYWxlZEJ5KGFjYywgZHQpKSwgdmVsb2NpdGllc1tqXSkpXG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIGVyclxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc29sbiA9IHt9XG5cdHZhciBzcHJpbmcgPSB0aGlzLnNwcmluZ1xuXHR2YXIgcG9zaXRpb25zID0gW3RoaXMucG9zaXRpb24xLCB0aGlzLnBvc2l0aW9uMl1cblx0dmFyIG1hc3NlcyA9IFt0aGlzLm1hc3MxLCB0aGlzLm1hc3MyXVxuXHR2YXIgdmVsb2NpdGllcyA9IFt0aGlzLnZlbG9jaXR5MSwgdGhpcy52ZWxvY2l0eTJdXG5cdHZhciBhY2NlbGVyYXRpb25zID0gW3RoaXMuYWNjZWxlcmF0aW9uMSwgdGhpcy5hY2NlbGVyYXRpb24yXVxuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gMTsgaSsrKSB7XG5cdCAgICB2YXIgaiA9IChpICsgMSkgJSAyXG5cdCAgICB2YXIgbWFzcyA9IG1hc3Nlc1tqXVxuXHQgICAgdmFyIGQgPSB7eDogMCwgeTogMCwgejogMH1cblx0ICAgIGlmIChtYXNzID4gMCkgeyAvLyBpZiBub3QgYW5jaG9yZWRcdFx0XG5cdFx0dmFyIGFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvbnNbal1cblx0XHR2YXIgcG9zaXRpb24xID0gcG9zaXRpb25zW2ldXG5cdFx0dmFyIHBvc2l0aW9uMiA9IHBvc2l0aW9uc1tqXVxuXHRcdHZhciB2ZWN0b3IgPSBtaW51cyhwb3NpdGlvbjIsIHBvc2l0aW9uMSlcblx0XHR2YXIgc3ByaW5nQ3VyckxlbiA9IG1hZ25pdHVkZSh2ZWN0b3IpXG5cdFx0dmFyIHN0cmV0Y2hMZW4gPSAgc3ByaW5nQ3VyckxlbiAtIHNwcmluZy5sZW5ndGhcblx0XHQvLyBpZiBub3QgdG9ybiBhcGFydC4uLlxuXHRcdGlmIChzdHJldGNoTGVuIDwgc3ByaW5nLnRlYXJQb2ludEFtb3VudCkge1xuXHRcdCAgICB2YXIgbmV3QWNjZWxlcmF0aW9uTWFnID0gc3ByaW5nLmsgKiBzdHJldGNoTGVuIC8gbWFzc1xuXHRcdCAgICB2YXIgYWNjID0gc2NhbGVkQnkobm9ybWFsaXplZCh2ZWN0b3IpLCAtbmV3QWNjZWxlcmF0aW9uTWFnKVxuXHRcdCAgICBkID0gcGx1cyh0aGlzLl9sYXN0VmVsb2NpdGllc1tqXSwgc2NhbGVkQnkoYWNjLCBkdCkpXG5cdFx0fSBlbHNlIHtcblx0XHQgICAgc29sblsnc3ByaW5nJ10gPSB7dG9ybjogdHJ1ZX1cblx0XHR9XG5cdCAgICB9XG5cdCAgICBzb2xuWyd2ZWxvY2l0eScgKyAoaisxKV0gPSBkXG5cdH1cdFxuXHRyZXR1cm4gc29sblxuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbDNEU2ltdWxhdGlvbkNvbnN0cmFpbnRzXG4iLCIvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSW1wb3J0c1xuLy8gLS0tLS0tLS0tLS0tLSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnZhciBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8yZC9hcml0aG1ldGljLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxudmFyIGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyA9IHJlcXVpcmUoJy4vMmQvZ2VvbWV0cmljLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxudmFyIGluc3RhbGxTaW11bGF0aW9uQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzJkL3NpbXVsYXRpb24tY29uc3RyYWludHMuanMnKS5pbnN0YWxsXG52YXIgaW5zdGFsbDNER2VvbWV0cmljQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzNkL2dlb21ldHJpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsM0RTaW11bGF0aW9uQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzNkL3NpbXVsYXRpb24tY29uc3RyYWludHMuanMnKS5pbnN0YWxsXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBHbG9iYWwgTWVzc3kgU3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnZhciBfX2lkQ3RyID0gMVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdfX2lkJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19faWQnKSlcblx0ICAgIHRoaXMuX19faWQgPSBfX2lkQ3RyKytcblx0cmV0dXJuIHRoaXMuX19faWRcbiAgICB9XG59KVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdfX3R5cGUnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLmhhc093blByb3BlcnR5KCdfX190eXBlJykpXG5cdCAgICB0aGlzLl9fX3R5cGUgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWUucmVwbGFjZSgvX18vZywgJy4nKVxuXHRyZXR1cm4gdGhpcy5fX190eXBlXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19zaG9ydFR5cGUnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcblx0dmFyIHJlcyA9IHRoaXMuX190eXBlXG5cdHJldHVybiByZXMuc3Vic3RyaW5nKHJlcy5sYXN0SW5kZXhPZignLicpICsgMSlcbiAgICB9XG59KVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdfX3RvU3RyaW5nJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLl9fc2hvcnRUeXBlICsgJ0AnICsgdGhpcy5fX2lkXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19jb250YWluZXInLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLmhhc093blByb3BlcnR5KCdfX19jb250YWluZXInKSlcblx0ICAgIHRoaXMuX19fY29udGFpbmVyID0gcmNcblx0cmV0dXJuIHRoaXMuX19fY29udGFpbmVyXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19zY3JhdGNoJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fc2NyYXRjaCcpKVxuXHQgICAgdGhpcy5fX19zY3JhdGNoID0ge31cblx0cmV0dXJuIHRoaXMuX19fc2NyYXRjaFxuICAgIH1cbn0pXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHVibGljXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBTa2V0Y2hwYWQoKSB7XG4gICAgdGhpcy5yaG8gPSAwLjI1XG4gICAgdGhpcy5lcHNpbG9uID0gMC4wMVxuICAgIHRoaXMuZGVidWcgPSBmYWxzZVxuICAgIHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcyA9IGZhbHNlXG4gICAgdGhpcy5jb25zdHJhaW50cyA9IFtdXG4gICAgdGhpcy50aGluZ0NvbnN0cnVjdG9ycyA9IHt9XG4gICAgdGhpcy5jb25zdHJhaW50Q29uc3RydWN0b3JzID0ge31cbiAgICB0aGlzLm9iak1hcCA9IHt9XG4gICAgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cyA9IHt9XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzID0gW11cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbCA9IHt9XG4gICAgdGhpcy5ldmVudERlc2NyaXB0aW9ucyA9IHt9XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcEhhbmRsZXJEZXNjcmlwdGlvbnMgPSB7fVxuICAgIHRoaXMuZXZlbnRzID0gW11cbiAgICB0aGlzLnRoaW5nc1dpdGhPbkVhY2hUaW1lU3RlcEZuID0gW11cbiAgICB0aGlzLnRoaW5nc1dpdGhBZnRlckVhY2hUaW1lU3RlcEZuID0gW11cbiAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICB0aGlzLnBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5wcmV2UHNldWRvVGltZSA9IDBcbiAgICB0aGlzLnNjcmF0Y2ggPSB7fVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24oYUNsYXNzLCBpc0NvbnN0cmFpbnQpIHtcbiAgICB2YXIgY2xhc3NOYW1lID0gYUNsYXNzLm5hbWUucmVwbGFjZSgvX18vZywgJy4nKVxuICAgIHZhciBsaXN0ID0gaXNDb25zdHJhaW50ID8gdGhpcy5jb25zdHJhaW50Q29uc3RydWN0b3JzIDogdGhpcy50aGluZ0NvbnN0cnVjdG9ycyAgICBcbiAgICBsaXN0W2NsYXNzTmFtZV0gPSBhQ2xhc3NcbiAgICBhQ2xhc3MucHJvdG90eXBlLl9faXNTa2V0Y2hwYWRUaGluZyA9IHRydWVcbiAgICBhQ2xhc3MucHJvdG90eXBlLl9faXNDb25zdHJhaW50ID0gaXNDb25zdHJhaW50XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUubWFya09iamVjdFdpdGhJZElmTmV3ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGlkID0gb2JqLl9faWRcbiAgICBpZiAodGhpcy5vYmpNYXBbaWRdKVxuXHRyZXR1cm4gdHJ1ZVxuICAgIHRoaXMub2JqTWFwW2lkXSA9IG9ialxuICAgIHJldHVybiBmYWxzZVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmdldE9iamVjdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMub2JqTWFwW2lkXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFkZENvbnN0cmFpbnQgPSBmdW5jdGlvbihjb25zdHJhaW50KSB7XG4gICAgaWYgKCFjb25zdHJhaW50Ll9fcHJpb3JpdHkpXG5cdGNvbnN0cmFpbnQuX19wcmlvcml0eSA9IDBcbiAgICAvL3RoaXMuY29uc3RyYWludHMucHVzaChjb25zdHJhaW50KVxuICAgIHZhciBwcmlvID0gY29uc3RyYWludC5fX3ByaW9yaXR5XG4gICAgdmFyIGFkZElkeCA9IDBcbiAgICB3aGlsZSAoYWRkSWR4IDwgdGhpcy5jb25zdHJhaW50cy5sZW5ndGggJiYgdGhpcy5jb25zdHJhaW50c1thZGRJZHhdLl9fcHJpb3JpdHkgPCBwcmlvKVxuXHRhZGRJZHgrK1xuICAgIGlmICh0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcykge1xuXHR0aGlzLmFkZFRvUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9yc0ZvckNvbnN0cmFpbnQoY29uc3RyYWludCwgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cylcblx0dGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVGb3JDb25zdHJhaW50KGNvbnN0cmFpbnQpXG4gICAgfVxuICAgIHRoaXMuY29uc3RyYWludHMuc3BsaWNlKGFkZElkeCwgMCwgY29uc3RyYWludClcbiAgICBmb3IgKHZhciBwIGluIGNvbnN0cmFpbnQpIHtcblx0aWYgKGNvbnN0cmFpbnQuaGFzT3duUHJvcGVydHkocCkpIHtcblx0ICAgIHZhciBvYmogPSBjb25zdHJhaW50W3BdXG5cdCAgICBpZiAob2JqICE9PSB1bmRlZmluZWQgJiYgIXRoaXMub2JqTWFwW29iai5fX2lkXSlcblx0XHR0aGlzLm9iak1hcFtvYmouX19pZF0gPSBvYmpcblx0fVxuICAgIH1cbiAgICByZXR1cm4gY29uc3RyYWludFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnJlbW92ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbih1bndhbnRlZENvbnN0cmFpbnQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB0aGlzLmNvbnN0cmFpbnRzID0gdGhpcy5jb25zdHJhaW50cy5maWx0ZXIoZnVuY3Rpb24oY29uc3RyYWludCkge1xuXHRyZXR1cm4gY29uc3RyYWludCAhPT0gdW53YW50ZWRDb25zdHJhaW50ICYmXG4gICAgICAgICAgICAhKGludm9sdmVzKGNvbnN0cmFpbnQsIHVud2FudGVkQ29uc3RyYWludCkpXG4gICAgfSlcbiAgICBpZiAodGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMpXG5cdHRoaXMuY29tcHV0ZVBlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnMoKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yaG8gPSAwLjI1XG4gICAgdGhpcy5lcHNpbG9uID0gMC4wMVxuICAgIHRoaXMuc2VhcmNoT24gPSBmYWxzZVxuICAgIHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcyA9IGZhbHNlXG4gICAgdGhpcy5jb25zdHJhaW50cyA9IFtdXG4gICAgdGhpcy5vYmpNYXAgPSB7fVxuICAgIHRoaXMuZXZlbnRIYW5kbGVycyA9IFtdXG4gICAgdGhpcy5ldmVudHMgPSBbXVxuICAgIHRoaXMudGhpbmdzV2l0aE9uRWFjaFRpbWVTdGVwRm4gPSBbXVxuICAgIHRoaXMudGhpbmdzV2l0aEFmdGVyRWFjaFRpbWVTdGVwRm4gPSBbXVxuICAgIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMgPSB7fVxuICAgIHRoaXMuc3RhcnRUaW1lID0gRGF0ZS5ub3coKVxuICAgIHRoaXMucHNldWRvVGltZSA9IDBcbiAgICB0aGlzLnByZXZQc2V1ZG9UaW1lID0gMFxuICAgIHRoaXMuc2NyYXRjaCA9IHt9XG4gICAgLy8gcmVtb3ZlIGV4aXN0aW5nIGV2ZW50IGhhbmRsZXJzXG4gICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbClcblx0dGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWxbbmFtZV0uZm9yRWFjaChmdW5jdGlvbihoYW5kbGVyKSB7IGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKSB9KVxuICAgIHRoaXMuZXZlbnRIYW5kbGVyc0ludGVybmFsID0ge31cbiAgICB0aGlzLmV2ZW50RGVzY3JpcHRpb25zID0ge31cbiAgICB0aGlzLm9uRWFjaFRpbWVTdGVwSGFuZGxlckRlc2NyaXB0aW9ucyA9IHt9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29tcHV0ZUN1cnJlbnRFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwc2V1ZG9UaW1lID0gdGhpcy5wc2V1ZG9UaW1lXG4gICAgdmFyIHByZXZQc2V1ZG9UaW1lID0gdGhpcy5wcmV2UHNldWRvVGltZSBcbiAgICB2YXIgdG90YWxFcnJvciA9IDBcbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCB0aGlzLmNvbnN0cmFpbnRzLmxlbmd0aDsgaWR4KyspIHtcblx0dmFyIGMgPSB0aGlzLmNvbnN0cmFpbnRzW2lkeF1cblx0dmFyIGVyID0gTWF0aC5hYnMoYy5jb21wdXRlRXJyb3IocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpKVx0XG5cdHRvdGFsRXJyb3IgKz0gZXJcbiAgICB9XG4gICAgcmV0dXJuIHRvdGFsRXJyb3Jcbn1cbiAgICBcblNrZXRjaHBhZC5wcm90b3R5cGUuY29sbGVjdFBlckNvbnN0cmFpbnRTb2x1dGlvbnMgPSBmdW5jdGlvbih0aW1lTWlsbGlzLCBpbkZpeFBvaW50UHJvY2Vzcykge1xuICAgIHZhciBwc2V1ZG9UaW1lID0gdGhpcy5wc2V1ZG9UaW1lXG4gICAgdmFyIHByZXZQc2V1ZG9UaW1lID0gdGhpcy5wcmV2UHNldWRvVGltZSBcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB2YXIgYWxsU29sdXRpb25zID0gW11cbiAgICB2YXIgZGlkU29tZXRoaW5nID0gZmFsc2UsIGxvY2FsRGlkU29tZXRoaW5nID0gZmFsc2UsIHRvdGFsRXJyb3IgPSAwXG4gICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgdGhpcy5jb25zdHJhaW50cy5sZW5ndGg7IGlkeCsrKSB7XG5cdHZhciBjID0gdGhpcy5jb25zdHJhaW50c1tpZHhdXG5cdHZhciBzZWFyY2hhYmxlID0gYy5fX3NlYXJjaGFibGVcblx0aWYgKGluRml4UG9pbnRQcm9jZXNzICYmIHNlYXJjaGFibGUpXG5cdCAgICBjb250aW51ZVxuXHR2YXIgZXIgPSBNYXRoLmFicyhjLmNvbXB1dGVFcnJvcihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkpXHRcblx0dG90YWxFcnJvciArPSBlclxuXHRpZiAoZXIgPiBzZWxmLmVwc2lsb25cblx0ICAgIHx8IHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yIHx8ICh0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcyAmJiB0aGlzLmNvbnN0cmFpbnRJc0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZShjKSlcblx0ICAgKSB7XG5cdCAgICB2YXIgc29sdXRpb25zID0gYy5zb2x2ZShwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcblx0ICAgIC8qXG5cdCAgICBpZiAoc29sdXRpb25zIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRpZiAoaW5GaXhQb2ludFByb2Nlc3MpIHtcblx0XHQgICAgdmFyIGNvdW50ID0gc29sdXRpb25zLmxlbmd0aFxuXHRcdCAgICB2YXIgY2hvaWNlID0gIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNvdW50KVxuXHRcdCAgICBzb2x1dGlvbnMgPSBzb2x1dGlvbnNbY2hvaWNlXVxuXHRcdH1cblx0ICAgIH0gZWxzZSBpZiAoIWluRml4UG9pbnRQcm9jZXNzKSB7XG5cdFx0c29sdXRpb25zID0gW3NvbHV0aW9uc11cblx0ICAgIH1cblx0ICAgICovXG5cdCAgICBpZiAoIShpbkZpeFBvaW50UHJvY2VzcyB8fCBzZWFyY2hhYmxlKSlcblx0XHRzb2x1dGlvbnMgPSBbc29sdXRpb25zXVxuXHQgICAgbG9jYWxEaWRTb21ldGhpbmcgPSB0cnVlXG5cdCAgICBhbGxTb2x1dGlvbnMucHVzaCh7Y29uc3RyYWludDogYywgc29sdXRpb25zOiBzb2x1dGlvbnN9KVxuXHR9XG4gICAgfVxuICAgIGlmIChsb2NhbERpZFNvbWV0aGluZykge1xuXHRkaWRTb21ldGhpbmcgPSB0cnVlXG4gICAgfSBlbHNlXG5cdHRvdGFsRXJyb3IgPSAwXG4gICAgcmV0dXJuIHtkaWRTb21ldGhpbmc6IGRpZFNvbWV0aGluZywgZXJyb3I6IHRvdGFsRXJyb3IsIHNvbHV0aW9uczogYWxsU29sdXRpb25zfVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9ucyA9IGZ1bmN0aW9uKGFsbFNvbHV0aW9ucykge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHZhciBjb2xsZWN0ZWRTb2x1dGlvbnMgPSB7fSwgc2VlblByaW9yaXRpZXMgPSB7fVxuICAgIGFsbFNvbHV0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcblx0Y29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zQWRkU29sdXRpb24oc2VsZiwgZCwgY29sbGVjdGVkU29sdXRpb25zLCBzZWVuUHJpb3JpdGllcylcbiAgICB9KVxuICAgIHJldHVybiBjb2xsZWN0ZWRTb2x1dGlvbnNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kb09uZUl0ZXJhdGlvbiA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICBpZiAodGhpcy5iZWZvcmVFYWNoSXRlcmF0aW9uKVxuXHQodGhpcy5iZWZvcmVFYWNoSXRlcmF0aW9uKSgpXG4gICAgdmFyIHJlcyA9IHRoaXMuY29sbGVjdFBlckNvbnN0cmFpbnRTb2x1dGlvbnModGltZU1pbGxpcywgdHJ1ZSlcbiAgICB2YXIgZGlkU29tZXRoaW5nID0gcmVzLmRpZFNvbWV0aGluZ1xuICAgIHZhciB0b3RhbEVycm9yID0gcmVzLmVycm9yXG4gICAgaWYgKGRpZFNvbWV0aGluZykge1xuXHR2YXIgYWxsU29sdXRpb25zID0gcmVzLnNvbHV0aW9uc1xuXHR2YXIgY29sbGVjdGVkU29sdXRpb25zID0gdGhpcy5jb2xsZWN0UGVyUHJvcGVydHlTb2x1dGlvbnMoYWxsU29sdXRpb25zKVxuXHRhcHBseVNvbHV0aW9ucyh0aGlzLCBjb2xsZWN0ZWRTb2x1dGlvbnMpXG4gICAgfVxuICAgIHJldHVybiB0b3RhbEVycm9yXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29tcHV0ZVBlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzID0ge31cbiAgICB0aGlzLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24oYykge1xuXHR0aGlzLmFkZFRvUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9yc0ZvckNvbnN0cmFpbnQoYywgcmVzKVxuICAgIH0uYmluZCh0aGlzKSlcbiAgICB0aGlzLnBlclRoaW5nUGVyUHJvcEVmZmVjdGluZ0NvbnN0cmFpbnRzID0gcmVzICBcbiAgICB0aGlzLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZSgpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuYWRkVG9QZXJUaGluZ1BlclByb3BlcnR5RWZmZWN0b3JzRm9yQ29uc3RyYWludCA9IGZ1bmN0aW9uKGMsIHJlcykge1xuICAgIGlmIChjLmVmZmVjdHMpIHtcblx0Yy5lZmZlY3RzKCkuZm9yRWFjaChmdW5jdGlvbihlKSB7IFxuXHQgICAgdmFyIGlkID0gZS5vYmouX19pZFxuXHQgICAgdmFyIGVQcm9wcyA9IGUucHJvcHNcblx0ICAgIHZhciBwcm9wcywgY3Ncblx0ICAgIGlmIChyZXNbaWRdKVxuXHRcdHByb3BzID0gcmVzW2lkXVxuXHQgICAgZWxzZSB7XG5cdFx0cHJvcHMgPSB7fVxuXHRcdHJlc1tpZF0gPSBwcm9wc1xuXHQgICAgfVxuXHQgICAgZVByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuXHRcdGlmIChwcm9wc1twcm9wXSlcblx0XHQgICAgY3MgPSBwcm9wc1twcm9wXVxuXHRcdGVsc2Uge1xuXHRcdCAgICBjcyA9IFtdXG5cdFx0ICAgIHByb3BzW3Byb3BdID0gY3Ncblx0XHR9XG5cdFx0Y3MucHVzaChjKVx0XHRcblx0ICAgIH0pXG5cdH0pXHQgICAgXG4gICAgfVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbnN0cmFpbnRJc0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZSA9IGZ1bmN0aW9uKGNvbnN0cmFpbnQpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVbY29uc3RyYWludC5fX2lkXSAhPT0gdW5kZWZpbmVkXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lRm9yQ29uc3RyYWludCA9IGZ1bmN0aW9uKGNvbnN0cmFpbnQpIHtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnBlclRoaW5nUGVyUHJvcEVmZmVjdGluZ0NvbnN0cmFpbnRzKSB7XG5cdHZhciB0aGluZ0VmZnMgPSB0aGlzLnBlclRoaW5nUGVyUHJvcEVmZmVjdGluZ0NvbnN0cmFpbnRzW2lkXVxuXHRmb3IgKHZhciBwIGluIHRoaW5nRWZmcykge1xuXHQgICAgdmFyIGNzID0gdGhpbmdFZmZzW3BdXG5cdCAgICBpZiAoY3MuaW5kZXhPZihjb25zdHJhaW50KSA+PSAwKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjcy5sZW5ndGg7IGkrKykge1xuXHRcdCAgICB2YXIgYyA9IGNzW2ldXG5cdFx0ICAgIGlmIChjICE9PSBjb25zdHJhaW50ICYmIGMuX19wcmlvcml0eSA8IGNvbnN0cmFpbnQuX19wcmlvcml0eSkge1xuXHRcdFx0dGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVbY29uc3RyYWludC5fX2lkXSA9IHRydWVcblx0XHRcdHJldHVyblxuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHR9XG4gICAgfVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZSA9IGZ1bmN0aW9uKCkgeyAgICBcbiAgICB0aGlzLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24oY29uc3RyYWludCkgeyAgICBcblx0dGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVGb3JDb25zdHJhaW50KGNvbnN0cmFpbnQpXG4gICAgfS5iaW5kKHRoaXMpKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmN1cnJlbnRUaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnN0YXJ0VGltZVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvVGFza3NPbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG4gICAgdGhpcy5oYW5kbGVFdmVudHMoKVxuICAgIHRoaXMuZG9PbkVhY2hUaW1lU3RlcEZucyhwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcbiAgICBpZiAodGhpcy5vbkVhY2hUaW1lU3RlcCkgXG5cdCh0aGlzLm9uRWFjaFRpbWVTdGVwKShwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kb1Rhc2tzQWZ0ZXJFYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuICAgIHRoaXMuZG9BZnRlckVhY2hUaW1lU3RlcEZucyhwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcbiAgICBpZiAodGhpcy5hZnRlckVhY2hUaW1lU3RlcCkgXG5cdCh0aGlzLmFmdGVyRWFjaFRpbWVTdGVwKShwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcbiAgICB0aGlzLm1heWJlU3RlcFBzZXVkb1RpbWUoKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVOZXh0UHNldWRvVGltZUZyb21Qcm9wb3NhbHMgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcm9wb3NhbHMpIHtcbiAgICB2YXIgcmVzID0gcHJvcG9zYWxzWzBdLnRpbWVcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHByb3Bvc2Fscy5sZW5ndGg7IGkrKykge1xuXHR0aW1lID0gcHJvcG9zYWxzW2ldLnRpbWVcblx0aWYgKHRpbWUgPCByZXMpXG5cdCAgICByZXMgPSB0aW1lXG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5tYXliZVN0ZXBQc2V1ZG9UaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG8gPSB7fVxuICAgIHZhciBwc2V1ZG9UaW1lID0gdGhpcy5wc2V1ZG9UaW1lXG4gICAgdGhpcy5wcmV2UHNldWRvVGltZSA9IHBzZXVkb1RpbWVcbiAgICB2YXIgcHJvcG9zYWxzID0gW11cbiAgICB0aGlzLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24odCkge1xuICAgICAgICBpZih0LnByb3Bvc2VOZXh0UHNldWRvVGltZSlcbiAgICAgICAgICAgIHByb3Bvc2Fscy5wdXNoKHtwcm9wb3NlcjogdCwgdGltZTogdC5wcm9wb3NlTmV4dFBzZXVkb1RpbWUocHNldWRvVGltZSl9KVxuICAgIH0pXG4gICAgaWYgKHByb3Bvc2Fscy5sZW5ndGggPiAwKVxuXHR0aGlzLnBzZXVkb1RpbWUgPSB0aGlzLmNvbXB1dGVOZXh0UHNldWRvVGltZUZyb21Qcm9wb3NhbHMocHNldWRvVGltZSwgcHJvcG9zYWxzKVx0XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuaXRlcmF0ZVNlYXJjaENob2ljZXNGb3JVcFRvTWlsbGlzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBlcHNpbG9uID0gdGhpcy5lcHNpbG9uXG4gICAgdmFyIHNvbHMgPSB0aGlzLmNvbGxlY3RQZXJDb25zdHJhaW50U29sdXRpb25zKHRpbWVNaWxsaXMsIGZhbHNlKVxuICAgIHZhciBkaWRTb21ldGhpbmcgPSBzb2xzLmRpZFNvbWV0aGluZ1xuICAgIHZhciB0b3RhbEVycm9yID0gc29scy5lcnJvclxuICAgIHZhciByZXMgPSB7ZXJyb3I6IHRvdGFsRXJyb3IsIGNvdW50OiAwfSAvL0ZJWE1FXG4gICAgaWYgKGRpZFNvbWV0aGluZykge1xuXHR2YXIgYWxsU29sdXRpb25DaG9pY2VzID0gc29scy5zb2x1dGlvbnNcblx0Ly9maW5kIGFsbCBzb2x1dGlvbiBjb21iaW5hdGlvbnMgYmV0d2VlbiBjb25zdHJhaW50c1xuXHQvL2xvZyhhbGxTb2x1dGlvbkNob2ljZXMpXG5cdHZhciBjaG9pY2VzQ3MgPSBhbGxTb2x1dGlvbkNob2ljZXMubWFwKGZ1bmN0aW9uKGMpIHsgcmV0dXJuIGMuY29uc3RyYWludCB9KVxuXHR2YXIgY0NvdW50ID0gY2hvaWNlc0NzLmxlbmd0aFxuXHR2YXIgY2hvaWNlc1NzID0gYWxsU29sdXRpb25DaG9pY2VzLm1hcChmdW5jdGlvbihjKSB7IHJldHVybiBjLnNvbHV0aW9ucyB9KVxuXHR2YXIgYWxsU29sdXRpb25Db21ib3MgPSBhbGxDb21iaW5hdGlvbnNPZkFycmF5RWxlbWVudHMoY2hvaWNlc1NzKS5tYXAoZnVuY3Rpb24oY29tYm8pIHtcdCAgICBcblx0ICAgIHZhciBjdXJyID0gW11cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY0NvdW50OyBpKyspIHtcblx0XHRjdXJyLnB1c2goe2NvbnN0cmFpbnQ6IGNob2ljZXNDc1tpXSwgc29sdXRpb25zOiBjb21ib1tpXX0pXG5cdCAgICB9XG5cdCAgICByZXR1cm4gY3VyclxuXHR9KVxuXHQvL2xvZyhhbGxTb2x1dGlvbkNvbWJvcylcblx0Ly8gY29weSBjdXJyIHN0YXRlIGFuZCB0cnkgb25lLCBpZiB3b3JrcyByZXR1cm4gZWxzZSByZXZlcnQgc3RhdGUgbW92ZSB0byBuZXh0IHVudGlsIG5vbmUgbGVmdFxuXHR2YXIgY291bnQgPSBhbGxTb2x1dGlvbkNvbWJvcy5sZW5ndGhcblx0dmFyIGNob2ljZVRPID0gdGltZU1pbGxpcyAvIGNvdW50XG5cdGlmICh0aGlzLmRlYnVnKSBsb2coJ3Bvc3NpYmxlIGNob2ljZXMnLCBjb3VudCwgJ3BlciBjaG9pY2UgdGltZW91dCcsIGNob2ljZVRPKVxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcblx0ICAgIHZhciBjb3BpZWQsIGxhc3QgPSBpID09IGNvdW50IC0gMVxuXHQgICAgaWYgKHRoaXMuZGVidWcpIGxvZygndHJ5aW5nIGNob2ljZTogJyArIGkpXG5cdCAgICB2YXIgYWxsU29sdXRpb25zID0gYWxsU29sdXRpb25Db21ib3NbaV1cblx0ICAgIC8vbG9nKGFsbFNvbHV0aW9ucylcblx0ICAgIHZhciBjb2xsZWN0ZWRTb2x1dGlvbnMgPSB0aGlzLmNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9ucyhhbGxTb2x1dGlvbnMpXG5cdCAgICAvL2NvcHkgaGVyZS4uLlx0ICAgIFxuXHQgICAgaWYgKCFsYXN0KVxuXHRcdGNvcGllZCA9IHRoaXMuZ2V0Q3VycmVudFByb3BWYWx1ZXNBZmZlY3RhYmxlQnlTb2x1dGlvbnMoY29sbGVjdGVkU29sdXRpb25zKVxuXHQgICAgYXBwbHlTb2x1dGlvbnModGhpcywgY29sbGVjdGVkU29sdXRpb25zKVxuXHQgICAgcmVzID0gdGhpcy5pdGVyYXRlRm9yVXBUb01pbGxpcyhjaG9pY2VUTylcdCAgICBcblx0ICAgIHZhciBjaG9pY2VFcnIgPSB0aGlzLmNvbXB1dGVDdXJyZW50RXJyb3IoKVxuXHQgICAgLy9sb2coY2hvaWNlRXJyKVxuXHQgICAgaWYgKGNob2ljZUVyciA8IGVwc2lsb24gfHwgbGFzdClcblx0XHRicmVha1xuXHQgICAgLy9yZXZlcnQgaGVyZVxuXHQgICAgdGhpcy5yZXZlcnRQcm9wVmFsdWVzQmFzZWRPbkFyZyhjb3BpZWQpXG5cdH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmdldEN1cnJlbnRQcm9wVmFsdWVzQWZmZWN0YWJsZUJ5U29sdXRpb25zID0gZnVuY3Rpb24oc29sdXRpb25zKSB7XG4gICAgdmFyIHJlcyA9IHt9XG4gICAgZm9yICh2YXIgb2JqSWQgaW4gc29sdXRpb25zKSB7XG5cdHZhciBjdXJyT2JqID0gc2tldGNocGFkLm9iak1hcFtvYmpJZF1cblx0dmFyIHByb3BzTiA9IHt9XG5cdHJlc1tvYmpJZF0gPSBwcm9wc05cblx0dmFyIHByb3BzID0gc29sdXRpb25zW29iaklkXVxuXHRmb3IgKHZhciBwIGluIHByb3BzKSB7XG5cdCAgICBwcm9wc05bcF0gPSBjdXJyT2JqW3BdXG5cdH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnJldmVydFByb3BWYWx1ZXNCYXNlZE9uQXJnID0gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgZm9yICh2YXIgb2JqSWQgaW4gdmFsdWVzKSB7XG5cdHZhciBjdXJyT2JqID0gc2tldGNocGFkLm9iak1hcFtvYmpJZF1cblx0dmFyIHByb3BzID0gdmFsdWVzW29iaklkXVxuXHRmb3IgKHZhciBwIGluIHByb3BzKSB7XG5cdCAgICBjdXJyT2JqW3BdID0gcHJvcHNbcF1cblx0fVxuICAgIH1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5zb2x2ZUZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0TWlsbGlzKSB7XG4gICAgdGhpcy5kb1Rhc2tzT25FYWNoVGltZVN0ZXAodGhpcy5wc2V1ZG9UaW1lLCB0aGlzLnByZXZQc2V1ZG9UaW1lKVxuICAgIHZhciByZXNcbiAgICBpZiAodGhpcy5zZWFyY2hPbilcdFxuXHRyZXMgPSB0aGlzLml0ZXJhdGVTZWFyY2hDaG9pY2VzRm9yVXBUb01pbGxpcyh0TWlsbGlzKVxuICAgIGVsc2Vcblx0cmVzID0gdGhpcy5pdGVyYXRlRm9yVXBUb01pbGxpcyh0TWlsbGlzKVxuICAgIHRoaXMuZG9UYXNrc0FmdGVyRWFjaFRpbWVTdGVwKHRoaXMucHNldWRvVGltZSwgdGhpcy5wcmV2UHNldWRvVGltZSlcbiAgICByZXR1cm4gcmVzXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuaXRlcmF0ZUZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0TWlsbGlzKSB7XG4gICAgdmFyIGNvdW50ID0gMCwgdG90YWxFcnJvciA9IDAsIGVwc2lsb24gPSB0aGlzLmVwc2lsb25cbiAgICAvL3ZhciBkaWRTb21ldGhpbmdcbiAgICB2YXIgY3VyckVycm9yLCBsYXN0RXJyb3JcbiAgICB2YXIgdDAsIHRcbiAgICB0MCA9IHRoaXMuY3VycmVudFRpbWUoKVxuICAgIGRvIHtcblx0bGFzdEVycm9yID0gY3VyckVycm9yXG5cdC8qZGlkU29tZXRoaW5nKi8gY3VyckVycm9yID0gdGhpcy5kb09uZUl0ZXJhdGlvbih0MClcblx0dCA9ICB0aGlzLmN1cnJlbnRUaW1lKCkgLSB0MFxuXHQvL2NvdW50ICs9IGRpZFNvbWV0aGluZyA/IDEgOiAwXG5cdGlmIChjdXJyRXJyb3IgPiAwKSB7XG5cdCAgICBjb3VudCsrXG5cdCAgICB0b3RhbEVycm9yICs9IGN1cnJFcnJvclxuXHR9XG5cdC8vbG9nKGN1cnJFcnJvciwgbGFzdEVycm9yKVxuICAgIH0gd2hpbGUgKFxuXHRjdXJyRXJyb3IgPiBlcHNpbG9uXG5cdCAgICAmJiAhKGN1cnJFcnJvciA+PSBsYXN0RXJyb3IpXG5cdC8vY3VyckVycm9yID4gMC8vZGlkU29tZXRoaW5nIFxuXHQgICAgJiYgdCA8IHRNaWxsaXMpXG4gICAgLy9sb2coe2Vycm9yOiB0b3RhbEVycm9yLCBjb3VudDogY291bnR9KVxuICAgIHJldHVybiB7ZXJyb3I6IHRvdGFsRXJyb3IsIGNvdW50OiBjb3VudH1cbn1cblxuLy8gdmFyaW91cyB3YXlzIHdlIGNhbiBqb2luIHNvbHV0aW9ucyBmcm9tIGFsbCBzb2x2ZXJzXG4vLyBkYW1wZWQgYXZlcmFnZSBqb2luIGZuOlxuU2tldGNocGFkLnByb3RvdHlwZS5zdW1Kb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgLy92YXIgcmVzID0gY3VyclxuICAgIHZhciByaG8gPSB0aGlzLnJob1xuICAgIHZhciBzdW0gPSAwXG4gICAgLy9zb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IHJlcyArPSAodiAtIGN1cnIpICogcmhvIH0pXG4gICAgc29sdXRpb25zLmZvckVhY2goZnVuY3Rpb24odikgeyBzdW0gKz0gdiB9KVxuICAgIHZhciByZXMgPSBjdXJyICsgKHJobyAqICgoc3VtIC8gc29sdXRpb25zLmxlbmd0aCkgLSBjdXJyKSlcbiAgICByZXR1cm4gcmVzXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUubGFzdE9uZVdpbnNKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgcmV0dXJuIHNvbHV0aW9uc1tzb2x1dGlvbnMubGVuZ3RoIC0gMV1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yYW5kb21DaG9pY2VKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgcmV0dXJuIHNvbHV0aW9uc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzb2x1dGlvbnMubGVuZ3RoKV1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hcnJheUFkZEpvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICBzb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IGN1cnIucHVzaCh2KSB9KVxuICAgIHJldHVybiBjdXJyXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZGljdGlvbmFyeUFkZEpvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICBzb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IGZvciAodmFyIGsgaW4gdikgY3VycltrXSA9IHZba10gfSlcbiAgICByZXR1cm4gY3VyclxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRlZmF1bHRKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgcmV0dXJuICB0aGlzLnN1bUpvaW5Tb2x1dGlvbnMoY3Vyciwgc29sdXRpb25zKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnJlZ2lzdGVyRXZlbnQgPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgb3B0RGVzY3JpcHRpb24pIHtcbiAgICB2YXIgaWQgPSB0aGlzLmV2ZW50SGFuZGxlcnMubGVuZ3RoXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzLnB1c2goY2FsbGJhY2spXG4gICAgdmFyIGhhbmRsZXIgPSBmdW5jdGlvbihlKSB7IHRoaXMuZXZlbnRzLnB1c2goW2lkLCBlXSkgfS5iaW5kKHRoaXMpXG4gICAgaWYgKCF0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXSkge1xuXHR0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXSA9IFtdXG5cdHRoaXMuZXZlbnREZXNjcmlwdGlvbnNbbmFtZV0gPSBbXVxuICAgIH1cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXS5wdXNoKGhhbmRsZXIpXG4gICAgdGhpcy5ldmVudERlc2NyaXB0aW9uc1tuYW1lXS5wdXNoKG9wdERlc2NyaXB0aW9uKVxuICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmhhbmRsZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZXZlbnRzLmZvckVhY2goZnVuY3Rpb24obmFtZUFuZEUpIHsgXG5cdHZhciBpZCA9IG5hbWVBbmRFWzBdOyBcblx0dmFyIGUgPSBuYW1lQW5kRVsxXTsgXG5cdHZhciBoID0gdGhpcy5ldmVudEhhbmRsZXJzW2lkXVxuXHRpZiAoaCAhPT0gdW5kZWZpbmVkKVxuXHQgICAgaChlKSBcbiAgICB9LmJpbmQodGhpcykpXG4gICAgdGhpcy5ldmVudHMgPSBbXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvT25FYWNoVGltZVN0ZXBGbnMgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuICAgIHRoaXMudGhpbmdzV2l0aE9uRWFjaFRpbWVTdGVwRm4uZm9yRWFjaChmdW5jdGlvbih0KSB7IHQub25FYWNoVGltZVN0ZXAocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIH0pXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZG9BZnRlckVhY2hUaW1lU3RlcEZucyA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG4gICAgdGhpcy50aGluZ3NXaXRoQWZ0ZXJFYWNoVGltZVN0ZXBGbi5mb3JFYWNoKGZ1bmN0aW9uKHQpIHsgdC5hZnRlckVhY2hUaW1lU3RlcChwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkgfSlcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5zZXRPbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKG9uRWFjaFRpbWVGbiwgb3B0RGVzY3JpcHRpb24pIHtcbiAgICB0aGlzLm9uRWFjaFRpbWVTdGVwID0gb25FYWNoVGltZUZuXG4gICAgaWYgKG9wdERlc2NyaXB0aW9uKVxuXHR0aGlzLm9uRWFjaFRpbWVTdGVwSGFuZGxlckRlc2NyaXB0aW9uc1snZ2VuZXJhbCddID0gW29wdERlc2NyaXB0aW9uXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnVuc2V0T25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm9uRWFjaFRpbWVTdGVwID0gdW5kZWZpbmVkXG4gICAgZGVsZXRlKHRoaXMub25FYWNoVGltZVN0ZXBIYW5kbGVyRGVzY3JpcHRpb25zWydnZW5lcmFsJ10pXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZnVuY3Rpb24gY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zQWRkU29sdXRpb24oc2tldGNocGFkLCBzb2xuLCBzb2Zhciwgc2VlblByaW9yaXRpZXMpIHtcbiAgICB2YXIgYyA9IHNvbG4uY29uc3RyYWludFxuICAgIHZhciBwcmlvcml0eSA9IGMuX19wcmlvcml0eVxuICAgIGZvciAodmFyIG9iaiBpbiBzb2xuLnNvbHV0aW9ucykge1xuXHR2YXIgY3Vyck9iaiA9IGNbb2JqXVxuXHR2YXIgY3Vyck9iaklkID0gY3Vyck9iai5fX2lkXG5cdHZhciBkID0gc29sbi5zb2x1dGlvbnNbb2JqXVxuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKGQpXG5cdGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzW2ldXG5cdCAgICB2YXIgcGVyUHJvcFNvbG4gPSBzb2ZhcltjdXJyT2JqSWRdXG5cdCAgICB2YXIgcGVyUHJvcFByaW8gPSBzZWVuUHJpb3JpdGllc1tjdXJyT2JqSWRdXG5cdCAgICB2YXIgcHJvcFNvbG5zLCBwcmlvXG5cdCAgICBpZiAocGVyUHJvcFNvbG4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHBlclByb3BTb2xuID0ge31cblx0XHRwZXJQcm9wUHJpbyA9IHt9XG5cdFx0c29mYXJbY3Vyck9iaklkXSA9IHBlclByb3BTb2xuXG5cdFx0c2VlblByaW9yaXRpZXNbY3Vyck9iaklkXSA9IHBlclByb3BQcmlvXG5cdFx0cHJvcFNvbG5zID0gW11cblx0XHRwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdHBlclByb3BQcmlvW3Byb3BdID0gcHJpb3JpdHlcblx0ICAgIH0gZWxzZSB7XHRcdCAgICBcblx0XHRwcm9wU29sbnMgPSBwZXJQcm9wU29sbltwcm9wXVxuXHRcdGlmIChwcm9wU29sbnMgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICBwcm9wU29sbnMgPSBbXVxuXHRcdCAgICBwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdCAgICBwZXJQcm9wUHJpb1twcm9wXSA9IHByaW9yaXR5XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgdmFyIGxhc3RQcmlvID0gcGVyUHJvcFByaW9bcHJvcF1cblx0ICAgIGlmIChwcmlvcml0eSA+IGxhc3RQcmlvKSB7XG5cdFx0cGVyUHJvcFByaW9bcHJvcF0gPSBwcmlvcml0eVxuXHRcdHdoaWxlIChwcm9wU29sbnMubGVuZ3RoID4gMCkgcHJvcFNvbG5zLnBvcCgpXG5cdCAgICB9IGVsc2UgaWYgKHByaW9yaXR5IDwgbGFzdFByaW8pIHtcblx0XHRicmVha1xuXHQgICAgfSBcblx0ICAgIHByb3BTb2xucy5wdXNoKGRbcHJvcF0pXG5cdH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFwcGx5U29sdXRpb25zKHNrZXRjaHBhZCwgc29sdXRpb25zKSB7ICAgIFxuICAgIC8vbG9nMihzb2x1dGlvbnMpXG4gICAgdmFyIGtleXMxID0gT2JqZWN0LmtleXMoc29sdXRpb25zKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5czEubGVuZ3RoOyBpKyspIHtcblx0dmFyIG9iaklkID0ga2V5czFbaV1cblx0dmFyIHBlclByb3AgPSBzb2x1dGlvbnNbb2JqSWRdXG5cdHZhciBjdXJyT2JqID0gc2tldGNocGFkLm9iak1hcFtvYmpJZF1cblx0dmFyIGtleXMyID0gT2JqZWN0LmtleXMocGVyUHJvcClcblx0Zm9yICh2YXIgaiA9IDA7IGogPCBrZXlzMi5sZW5ndGg7IGorKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzMltqXVxuXHQgICAgdmFyIHByb3BTb2xucyA9IHBlclByb3BbcHJvcF1cblx0ICAgIHZhciBjdXJyVmFsID0gY3Vyck9ialtwcm9wXVxuXHQgICAgdmFyIGpvaW5GbiA9IChjdXJyT2JqLnNvbHV0aW9uSm9pbnMgIT09IHVuZGVmaW5lZCAmJiAoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdICE9PSB1bmRlZmluZWQpID9cblx0XHQoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdIDogc2tldGNocGFkLnN1bUpvaW5Tb2x1dGlvbnNcblx0ICAgIGN1cnJPYmpbcHJvcF0gPSAoam9pbkZuLmJpbmQoc2tldGNocGFkKSkoY3VyclZhbCwgcHJvcFNvbG5zKVxuXHR9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbnZvbHZlcyhjb25zdHJhaW50LCBvYmopIHtcbiAgICBmb3IgKHZhciBwIGluIGNvbnN0cmFpbnQpIHtcblx0aWYgKGNvbnN0cmFpbnRbcF0gPT09IG9iaikge1xuXHQgICAgcmV0dXJuIHRydWVcblx0fVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gYWxsQ29tYmluYXRpb25zT2ZBcnJheUVsZW1lbnRzKGFycmF5T2ZBcnJheXMpIHtcbiAgICBpZiAoYXJyYXlPZkFycmF5cy5sZW5ndGggPiAxKSB7XG5cdHZhciBmaXJzdCA9IGFycmF5T2ZBcnJheXNbMF1cblx0dmFyIHJlc3QgPSBhbGxDb21iaW5hdGlvbnNPZkFycmF5RWxlbWVudHMoYXJyYXlPZkFycmF5cy5zbGljZSgxKSlcblx0dmFyIHJlcyA9IFtdXG5cdGZvciAodmFyIGogPSAwOyBqIDwgcmVzdC5sZW5ndGggOyBqKyspIHtcblx0ICAgIHZhciByID0gcmVzdFtqXVxuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaXJzdC5sZW5ndGg7IGkrKykge1xuXHRcdHJlcy5wdXNoKFtmaXJzdFtpXV0uY29uY2F0KHIpKVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiByZXNcbiAgICB9ICBlbHNlIGlmIChhcnJheU9mQXJyYXlzLmxlbmd0aCA9PSAxKSB7XG5cdHJldHVybiBhcnJheU9mQXJyYXlzWzBdLm1hcChmdW5jdGlvbihlKSB7IHJldHVybiBbZV0gfSlcbiAgICB9IGVsc2Vcblx0cmV0dXJuIFtdXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBCb290c3RyYXAgJiBJbnN0YWxsIGNvbnN0cmFpbnQgbGlicmFyaWVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuc2tldGNocGFkID0gbmV3IFNrZXRjaHBhZCgpXG5pbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzKFNrZXRjaHBhZClcbmluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzKFNrZXRjaHBhZClcbmluc3RhbGwzREdlb21ldHJpY0NvbnN0cmFpbnRzKFNrZXRjaHBhZClcbmluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNrZXRjaHBhZFxuXG4iXX0=
