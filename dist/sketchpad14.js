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

    function fnRef(target, prefix) {
	var rcvr = target[prefix + '_obj']
	return rcvr[target[prefix + '_prop']].call(rcvr)
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

    // Equality Constraint, i.e., k1 * o1.p1 = k2 * o2.p2

    Sketchpad.arith.EqualityConstraint = function Sketchpad__arith__EqualityConstraint(ref1, ref2, optOnlyWriteTo, k1, k2) {
	this.k1 = k1 || 1, this.k2 = k2 || 1
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.onlyWriteTo = optOnlyWriteTo || [1, 2]
    }

    sketchpad.addClass(Sketchpad.arith.EqualityConstraint, true)

    Sketchpad.arith.EqualityConstraint.prototype.description = function() { return  "Sketchpad.arith.EqualityConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, WritableIdxs, Number K1, Number K2) states that K1 * O1.p1 = K2 * O2.p2 . Constants K1-2 default to 1. Optional WritableIdxs gives a list of indices (elements 1,and/or 2) the constraint is allowed to change," }

    Sketchpad.arith.EqualityConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}, {obj: this.v2_obj, props: [this.v2_prop]}]
    }

    Sketchpad.arith.EqualityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.EqualityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    Sketchpad.arith.EqualityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var diff = (this.k1 * ref(this, 'v1')) - (this.k2 * ref(this, 'v2'))
	return diff
    }

    Sketchpad.arith.EqualityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v1 = this.k1 * ref(this, 'v1'), v2 = this.k2 * ref(this, 'v2')
	ks = [this.k1, this.k2]
	var vs = [v1, v2]
	var onlyWriteTo = this.onlyWriteTo
	var diff = v1 - v2
	var div = onlyWriteTo.length
	var args = [this]
	onlyWriteTo.forEach(function(i) { var sign = i > 1 ? 1 : -1; args.push('v' + i); args.push((vs[i - 1] + sign * diff / div) / ks[i - 1]) })
	res = patch.apply(this, args)
	return res //patch(this, 'v1', v1 - (diff / 2), 'v2', v2 + diff / 2)
    }

    // OnWayEquality Constraint, i.e., o1.p1 = o2.p2

    Sketchpad.arith.OneWayEqualityConstraint = function Sketchpad__arith__OneWayEqualityConstraint(ref1, ref2, optSecondPropIsFn) {
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.secondPropIsFn = optSecondPropIsFn
    }

    sketchpad.addClass(Sketchpad.arith.OneWayEqualityConstraint, true)

    Sketchpad.arith.OneWayEqualityConstraint.prototype.description = function() { return  "Sketchpad.arith.OneWayEqualityConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, Boolean secondPropIsFn) states that O1.p1 = O2.p2 (right hand-side is  read-only). If secondPropIsFn = true then O2.p2() is invoked instead." }

    Sketchpad.arith.OneWayEqualityConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}]
    }

    Sketchpad.arith.OneWayEqualityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.OneWayEqualityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    Sketchpad.arith.OneWayEqualityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v2 = this.secondPropIsFn ? fnRef(this, 'v2') : ref(this, 'v2')
	var e = ref(this, 'v1') == v2 ? 0 : 1
	return e
    }

    Sketchpad.arith.OneWayEqualityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v2 = this.secondPropIsFn ? fnRef(this, 'v2') : ref(this, 'v2')
	return patch(this, 'v1', v2)
    }

    // Inequality Constraint, i.e., k1 * o1.p1 >= k2 * o2.p2 + k3 or k1 * o1.p1 <= k2 * o2.p2 + k3

    Sketchpad.arith.InequalityConstraint = function Sketchpad__arith__InequalityConstraint(ref1, ref2, isGeq, k1, k2, k3) {
	this.k1 = k1 || 1, this.k2 = k2 || 1, this.k3 = k3 || 0
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.isGeq = isGeq
    }

    sketchpad.addClass(Sketchpad.arith.InequalityConstraint, true)

    Sketchpad.arith.InequalityConstraint.prototype.description = function() { return  "Sketchpad.arith.InequalityConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, isGeq, Number K1, Number K2, Number K3) states that K1 * O1.p1 >= K2 * O2.p2 + K3 (when isGeq=true) or K1 * O1.p1 <= K2 * O2.p2 + K3 (when isGeq=false). Constants K1-2 default to 1 and K3 to 0" }

    Sketchpad.arith.InequalityConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}, {obj: this.v2_obj, props: [this.v2_prop]}]
    }

    Sketchpad.arith.InequalityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.InequalityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, true) 
    }

    Sketchpad.arith.InequalityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v1 = this.k1 * ref(this, 'v1') , v2 = (this.k2 * ref(this, 'v2')) + this.k3, cond = this.isGeq ? v1 >= v2 : v1 <= v2, e = cond ? 0 : v2 - v1
	return e
    }

    Sketchpad.arith.InequalityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v2 = (this.k2 * ref(this, 'v2')) + this.k3
	res = patch(this, 'v1', v2 / this.k1)
	return res
    }

    // Sum Constraint, i.e., k1 * o1.p1 + k2 * o2.p2 = k3 * o3.p3 + k4

    Sketchpad.arith.SumConstraint = function Sketchpad__arith__SumConstraint(ref1, ref2, ref3, optOnlyWriteTo, k1, k2, k3, k4) {
	this.k1 = k1 || 1, this.k2 = k2 || 1, this.k3 = k3 || 1, this.k4 = k4 || 0
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	installRef(this, ref3, 'v3')
	this.onlyWriteTo = optOnlyWriteTo || [1, 2, 3]
    }

    sketchpad.addClass(Sketchpad.arith.SumConstraint, true)

    Sketchpad.arith.SumConstraint.prototype.description = function() { return  "Sketchpad.arith.SumConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, {obj: O3, prop: p3}, WritableIdxs, Number K1, Number K2, Number K3, Number K4) states that K1 * O1.p1 + K2 * O2.p2 = K3 * O3.p3 + K4 . Constants K1-3 default to 1 and K4 to 0. Optional WritableIdxs gives a list of indices (1, 2, or, 3) the constraint is allowed to change." } 

    Sketchpad.arith.SumConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}, {obj: this.v2_obj, props: [this.v2_prop]}, {obj: this.v3_obj, props: [this.v3_prop]}]
    }

    Sketchpad.arith.SumConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.SumConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    Sketchpad.arith.SumConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var diff = this.k3 * ref(this, 'v3') + this.k4 - ((this.k1 * ref(this, 'v1')) + (this.k2 * ref(this, 'v2')))
	return diff
    }

    Sketchpad.arith.SumConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v1 = this.k1 * ref(this, 'v1')
	var v2 = this.k2 * ref(this, 'v2')
	var v3 = this.k3 * ref(this, 'v3')
	var vs = [v1, v2, v3], ks = [this.k1, this.k2, this.k3]
	var diff = v3 + this.k4 - (v1 + v2)
	var onlyWriteTo = this.onlyWriteTo
	var div = onlyWriteTo.length
	var args = [this]
	onlyWriteTo.forEach(function(i) { var sign = i > 2 ? -1 : 1; args.push('v' + i); args.push((vs[i - 1] + sign * diff / div) / ks[i - 1]) })
	res = patch.apply(this, args)
	return res
    }

    // SumInequality Constraint, i.e., k1 * o1.p1 >= k2 * o2.p2 + k3 * o3.p3 + k4 or k1 * o1.p1 >= k2 * o2.p2 + k3 * o3.p3 + k4

    Sketchpad.arith.SumInequalityConstraint = function Sketchpad__arith__SumInequalityConstraint(ref1, ref2, ref3, isGeq, k1, k2, k3, k4) {
	this.k1 = k1 || 1, this.k2 = k2 || 1, this.k3 = k3 || 1, this.k4 = k4 || 0
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	installRef(this, ref3, 'v3')
	this.isGeq = isGeq
    }

    sketchpad.addClass(Sketchpad.arith.SumInequalityConstraint, true)

    Sketchpad.arith.SumInequalityConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}]
    }

    Sketchpad.arith.SumInequalityConstraint.prototype.description = function() { return  "Sketchpad.arith.SumInequalityConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, {obj: O3, prop: p3}, isGeq, Number K1, Number K2, Number K3, Number K4) states that K1 * O1.p1 >=  k2 * O2.p2  + k3 * O3.p3 + K4  or  K1 * O1.p1 <=  K2 * O2.p2 + K3 * O3.p3 + K4 (>= when isGeq=true)" } 

    Sketchpad.arith.SumInequalityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.SumInequalityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, true) 
    }

    Sketchpad.arith.SumInequalityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v1 = this.k1 * ref(this, 'v1'), v2 = this.k2 * ref(this, 'v2'), v3 = this.k3 * ref(this, 'v3'), sum = v2 + v3 + this.k4, cond = this.isGeq ? v1 >= sum : v1 <= sum, e = cond ? 0 : sum - v1
	return e
    }

    Sketchpad.arith.SumInequalityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	v2 = this.k2 * ref(this, 'v2'), v3 = this.k3 * ref(this, 'v3'), sum = v2 + v3 + this.k4
	res = patch(this, 'v1', sum / this.k1)
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
	this._normalColor = new Color(150, 150, 150)
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
	    var stretch = Math.floor(Math.sqrt(Math.pow(y1 - y2, 2) + Math.pow(x1 - x2, 2)) - this.length)
	    var stretchP = Math.abs(stretch)
	    this._normalColor.red = Math.min(255, 150 + stretchP)
	    line.color = this._normalColor.hexString()
	    line.draw(canvas, origin)
	    ctxt.fillStyle = 'black'
	    ctxt.fillText(stretch, (x1 + x2) / 2, (y1 + y2) / 2)
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
	return (p1.y - p2.y) / (p1.x - p2.x)
    }

    Sketchpad.simulation.angle = function(p1, p2) {
	return Math.atan2(p1.y - p2.y, p2.x - p1.x)
    }

    Sketchpad.simulation.slopeVectorWrong = function(p1, p2) {
	var slope = this.slope(p1, p2), atn = Math.atan(slope)
	var sign = p1.x < p2.x ? -1 : 1
	return normalized({x: sign * Math.sin(atn), y: sign * Math.cos(atn)})
    }
    
    Sketchpad.simulation.slopeVector = function(p1, p2) {
	var slope = this.slope(p1, p2), atn = Math.atan(slope)
	var signX = p1.x < p2.x ? 1 : -1
	var signY = p1.y < p2.y ? 1 : -1
	return normalized({x: signX * Math.cos(atn), y: signX * Math.sin(atn)})
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
	    var slopeV = Sketchpad.simulation.slopeVectorWrong(surfaceP1, surfaceP2)
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
	    var slopeV = Sketchpad.simulation.slopeVectorWrong(surfaceP1, surfaceP2)
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
	    var slopeV = Sketchpad.simulation.slopeVectorWrong(beltP1, beltP2)
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
	    if (mass > 0) { // if not anchored
		var currAcceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)		
		var stretchLen =  springCurrLen - spring.length
		var newAccelerationMag = spring.k * stretchLen / mass
		var acc = scaledBy(normalized(vector), -newAccelerationMag)
		err += magnitude(minus(acc, currAcceleration))
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
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    var acc, torn = false
	    if (mass > 0) { // if not anchored
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)
		var stretchLen =  springCurrLen - spring.length
		// if not torn apart...
		torn = stretchLen > spring.tearPointAmount
		if (!torn) {
		    var newAccelerationMag = spring.k * stretchLen / mass
		    acc = scaledBy(normalized(vector), -newAccelerationMag)
		} 
	    }
	    if (torn)
		soln['spring'] = {torn: true}
	    if (acc)
		soln['acceleration' + (j+1)] = acc
	}	
	return soln
    }

    //  OrbitalMotion Constraint

    Sketchpad.simulation.OrbitalMotionConstraint = function Sketchpad__simulation__OrbitalMotionConstraint(sun, moon, distanceDownscale) {
	this.sun = sun
	this.moon = moon
	this.acceleration = moon.acceleration
	this.distanceDownscale = (distanceDownscale || (1e9 / 2))
    }

    sketchpad.addClass(Sketchpad.simulation.OrbitalMotionConstraint, true)

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.description = function() { return  "Sketchpad.simulation.OrbitalMotionConstraint(FreeBody Sun, FreeBody Moon) states that Moon body is orbiting around Sun body according to simple orbital motion formula." }

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.propertyTypes = {sun: 'FreeBody', moon: 'FreeBody'}

    Sketchpad.simulation.OrbitalMotionConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.OrbitalMotionConstraint(FreeBody.dummy(x, y), FreeBody.dummy(x + 200, y))
    }
    
    Sketchpad.simulation.OrbitalMotionConstraint.prototype.currentGravityAcceleration = function() {
	var p1 = this.moon.position, p2 = this.sun.position
	var dist0 = distance(p1, p2)
	var dist = dist0 * this.distanceDownscale	
	var aMag0 = (Sketchpad.simulation.G * this.sun.mass) / (dist * dist)
	var aMag = aMag0 / this.distanceDownscale
	var slopeV = Sketchpad.simulation.slopeVector(p1, p2)
	return {x: slopeV.x * aMag, y: slopeV.y * aMag}
    }
    
    Sketchpad.simulation.OrbitalMotionConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	this._targetAcceleration = this.currentGravityAcceleration()
	return magnitude(minus(this._targetAcceleration, this.acceleration))	
    }

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {acceleration: this._targetAcceleration}
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

    Sketchpad.simulation3d.SpringConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var spring = this.spring
	if (spring.torn) {
	    return 0
	}
	var positions = [this.position1, this.position2]
	var masses = [this.mass1, this.mass2]
	var velocities = [this.velocity1, this.velocity2]
	var accelerations = [this.acceleration1, this.acceleration2]
	var err = 0
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    if (mass > 0) { // if not anchored
		var currAcceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)		
		var stretchLen =  springCurrLen - spring.length
		var newAccelerationMag = spring.k * stretchLen / mass
		var acc = scaledBy(normalized(vector), -newAccelerationMag)
		err += magnitude(minus(acc, currAcceleration))
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
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    var acc, torn = false
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
		    acc = scaledBy(normalized(vector), -newAccelerationMag)
		} 
	    }
	    if (torn)
		soln['spring'] = {torn: true}
	    if (acc)
		soln['acceleration' + (j+1)] = acc
	}	
	return soln
    }

    //  OrbitalMotion Constraint

    Sketchpad.simulation3d.OrbitalMotionConstraint = function Sketchpad__simulation3d__OrbitalMotionConstraint(sun, moon, distanceDownscale) {
	this.sun = sun
	this.moon = moon
	this.acceleration = moon.acceleration
	this.distanceDownscale = (distanceDownscale || (1e9 / 2))
    }

    sketchpad.addClass(Sketchpad.simulation3d.OrbitalMotionConstraint, true)

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.OrbitalMotionConstraint(FreeBody Sun, FreeBody Moon) states that Moon body is orbiting around Sun body according to simple orbital motion formula." }

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.propertyTypes = {sun: 'FreeBody', moon: 'FreeBody'}

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.currentGravityAcceleration = function() {
	var p1 = this.moon.position, p2 = this.sun.position
	var dist0 = distance(p1, p2)
	var dist = dist0 * this.distanceDownscale	
	var aMag0 = (Sketchpad.simulation3d.G * this.sun.mass) / (dist * dist)
	var aMag = aMag0 / this.distanceDownscale
	var slopeV = Sketchpad.simulation.slopeVector({x: p1.x, y: p1.z}, {x: p2.x, y: p2.z}) //cheat to use 2D X-Z plane
	return {x: slopeV.x * aMag, y: 0, z: slopeV.y * aMag}
    }
    
    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	this._targetAcceleration = this.currentGravityAcceleration()
	return magnitude(minus(this._targetAcceleration, this.acceleration))	
    }

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {acceleration: this._targetAcceleration}
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
    this.rho = 1
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
    if (constraint.__priority === undefined)
	constraint.__priority = 1
    var prio = constraint.__priority
    var addIdx = 0
    while (addIdx < this.constraints.length && this.constraints[addIdx].__priority < prio)
	addIdx++
    if (this.solveEvenWithoutErrorOnPriorityDifferences) {
	this.addToPerThingPerPropertyEffectorsForConstraint(constraint, this.perThingPerPropEffectingConstraints)
	this.computeConstraintsCompetingWithALowerPriorityOneForConstraint(constraint)
	if (this.debug) log(this.perThingPerPropEffectingConstraints)
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
    this.rho = 1
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
    if (this.debug) log(res)
    var didSomething = res.didSomething
    var totalError = res.error
    if (didSomething) {
	var allSolutions = res.solutions
	var collectedSolutions = this.collectPerPropertySolutions(allSolutions)
	if (this.unrollOnConflicts)
	    applySolutionsWithUnrollOnConflict(this, collectedSolutions)
	else
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
		    if (c !== constraint && c.__priority !== constraint.__priority) {			
			var hC = constraint.__priority > c.__priority ? constraint : c
			this.computeConstraintsCompetingWithALowerPriorityOne[hC.__id] = true
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
	//if (this.debug) log(allSolutionChoices)
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
	    if (this.unrollOnConflicts)
	    applySolutionsWithUnrollOnConflict(this, collectedSolutions)
	else
	    applySolutions(this, collectedSolutions)
	    res = this.iterateForUpToMillis(choiceTO)	    
	    var choiceErr = this.computeCurrentError()
	    //if (this.debug) log('choice resulted in error: ', choiceErr)
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
    var currError, lastError
    var t0, t
    t0 = this.currentTime()
    do {
	lastError = currError
	currError = this.doOneIteration(t0)
	t =  this.currentTime() - t0
	if (currError > 0) {
	    count++
	    totalError += currError
	}
    } while (
	currError > epsilon
	    && !(currError >= lastError)
	    && t < tMillis)
    return {error: totalError, count: count}
}

// various ways we can join solutions from all solvers
// damped average join fn:
Sketchpad.prototype.sumJoinSolutions = function(curr, solutions) {
    var rho = this.rho
    var sum = 0
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

Sketchpad.prototype.dictionaryAddNoConflictJoinSolutions = function(curr, solutions) {
    var seen = {}
    solutions.forEach(function(v) {
	for (var k in v) {
	    var prev = seen[k]
	    var newV = v[k]
	    if (prev && prev !== newV) {
		this.discardIteration = true
		log('conflict in this solution set:', solutions) 
		return curr
	    }
	    seen[k] = newV
	}
    })
    return this.dictionaryAddJoinSolutions(curr, solutions)
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

Sketchpad.prototype.setOption = function(opt, val) {
    this[opt] = val
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

function applySolutionsWithUnrollOnConflict(sketchpad, solutions) {
    this.discardIteration = false   
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
	    currObj[prop + '__old'] = currVal
	    var joinFn = (currObj.solutionJoins !== undefined && (currObj.solutionJoins())[prop] !== undefined) ?
		(currObj.solutionJoins())[prop] : sketchpad.sumJoinSolutions
	    currObj[prop] = (joinFn.bind(sketchpad))(currVal, propSolns)
	}
    }
    if (!this.discardIteration)
	return
    log('discarding solutions since there was a conflict...')
    for (var i = 0; i < keys1.length; i++) {
	var objId = keys1[i]
	var perProp = solutions[objId]
	var currObj = sketchpad.objMap[objId]
	var keys2 = Object.keys(perProp)
	for (var j = 0; j < keys2.length; j++) {
	    var prop = keys2[j]
	    var propSolns = perProp[prop]
	    var currVal = currObj[prop]
	    currObj[prop] = currObj[prop + '__old']
	    delete currObj[prop + '__old']
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8yZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvM2Qvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy91QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGFyaXRobWV0aWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLmFyaXRoID0ge31cblxuICAgIC8vIEhlbHBlcnNcblxuICAgIGZ1bmN0aW9uIGluc3RhbGxSZWYodGFyZ2V0LCByZWYsIHByZWZpeCkge1xuXHR0YXJnZXRbcHJlZml4ICsgJ19vYmonXSA9IHJlZi5vYmpcblx0dGFyZ2V0W3ByZWZpeCArICdfcHJvcCddID0gcmVmLnByb3BcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWYodGFyZ2V0LCBwcmVmaXgpIHtcblx0cmV0dXJuIHRhcmdldFtwcmVmaXggKyAnX29iaiddW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmblJlZih0YXJnZXQsIHByZWZpeCkge1xuXHR2YXIgcmN2ciA9IHRhcmdldFtwcmVmaXggKyAnX29iaiddXG5cdHJldHVybiByY3ZyW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV0uY2FsbChyY3ZyKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhdGNoKHRhcmdldCAvKiAsIHByZWZpeCwgbmV3VmFsLCAuLi4gKi8pIHtcblx0dmFyIHJlc3VsdCA9IHt9XG5cdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG5cdCAgICB2YXIgcHJlZml4ID0gYXJndW1lbnRzW2ldXG5cdCAgICB2YXIgbmV3VmFsID0gYXJndW1lbnRzW2krMV1cblx0ICAgIHZhciBkID0gcmVzdWx0W3ByZWZpeCArICdfb2JqJ11cblx0ICAgIGlmICghZCkge1xuXHRcdHJlc3VsdFtwcmVmaXggKyAnX29iaiddID0gZCA9IHt9XG5cdCAgICB9XG5cdCAgICBkW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV0gPSBuZXdWYWxcblx0fVxuXHRyZXR1cm4gcmVzdWx0XG4gICAgfVxuXG4gICAgLy8gVmFsdWUgQ29uc3RyYWludCwgaS5lLiwgby5wID0gdmFsdWVcblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19WYWx1ZUNvbnN0cmFpbnQocmVmLCB2YWx1ZSkge1xuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZiwgJ3YnKVxuXHR0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50KHtvYmo6IE8sIHByb3A6IHB9LCBWYWx1ZSkgc3RhdGVzIHRoYXQgTy5wID0gVmFsdWUuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50KHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCA0MikgXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHRoaXMudmFsdWUgLSByZWYodGhpcywgJ3YnKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHBhdGNoKHRoaXMsICd2JywgdGhpcy52YWx1ZSlcbiAgICB9XG5cbiAgICAvLyBFcXVhbGl0eSBDb25zdHJhaW50LCBpLmUuLCBrMSAqIG8xLnAxID0gazIgKiBvMi5wMlxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fYXJpdGhfX0VxdWFsaXR5Q29uc3RyYWludChyZWYxLCByZWYyLCBvcHRPbmx5V3JpdGVUbywgazEsIGsyKSB7XG5cdHRoaXMuazEgPSBrMSB8fCAxLCB0aGlzLmsyID0gazIgfHwgMVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjEsICd2MScpXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMiwgJ3YyJylcblx0dGhpcy5vbmx5V3JpdGVUbyA9IG9wdE9ubHlXcml0ZVRvIHx8IFsxLCAyXVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQoe29iajogTzEsIHByb3A6IHAxfSwge29iajogTzIsIHByb3A6IHAyfSwgV3JpdGFibGVJZHhzLCBOdW1iZXIgSzEsIE51bWJlciBLMikgc3RhdGVzIHRoYXQgSzEgKiBPMS5wMSA9IEsyICogTzIucDIgLiBDb25zdGFudHMgSzEtMiBkZWZhdWx0IHRvIDEuIE9wdGlvbmFsIFdyaXRhYmxlSWR4cyBnaXZlcyBhIGxpc3Qgb2YgaW5kaWNlcyAoZWxlbWVudHMgMSxhbmQvb3IgMikgdGhlIGNvbnN0cmFpbnQgaXMgYWxsb3dlZCB0byBjaGFuZ2UsXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMudjFfb2JqLCBwcm9wczogW3RoaXMudjFfcHJvcF19LCB7b2JqOiB0aGlzLnYyX29iaiwgcHJvcHM6IFt0aGlzLnYyX3Byb3BdfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9KSBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZGlmZiA9ICh0aGlzLmsxICogcmVmKHRoaXMsICd2MScpKSAtICh0aGlzLmsyICogcmVmKHRoaXMsICd2MicpKVxuXHRyZXR1cm4gZGlmZlxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxID0gdGhpcy5rMSAqIHJlZih0aGlzLCAndjEnKSwgdjIgPSB0aGlzLmsyICogcmVmKHRoaXMsICd2MicpXG5cdGtzID0gW3RoaXMuazEsIHRoaXMuazJdXG5cdHZhciB2cyA9IFt2MSwgdjJdXG5cdHZhciBvbmx5V3JpdGVUbyA9IHRoaXMub25seVdyaXRlVG9cblx0dmFyIGRpZmYgPSB2MSAtIHYyXG5cdHZhciBkaXYgPSBvbmx5V3JpdGVUby5sZW5ndGhcblx0dmFyIGFyZ3MgPSBbdGhpc11cblx0b25seVdyaXRlVG8uZm9yRWFjaChmdW5jdGlvbihpKSB7IHZhciBzaWduID0gaSA+IDEgPyAxIDogLTE7IGFyZ3MucHVzaCgndicgKyBpKTsgYXJncy5wdXNoKCh2c1tpIC0gMV0gKyBzaWduICogZGlmZiAvIGRpdikgLyBrc1tpIC0gMV0pIH0pXG5cdHJlcyA9IHBhdGNoLmFwcGx5KHRoaXMsIGFyZ3MpXG5cdHJldHVybiByZXMgLy9wYXRjaCh0aGlzLCAndjEnLCB2MSAtIChkaWZmIC8gMiksICd2MicsIHYyICsgZGlmZiAvIDIpXG4gICAgfVxuXG4gICAgLy8gT25XYXlFcXVhbGl0eSBDb25zdHJhaW50LCBpLmUuLCBvMS5wMSA9IG8yLnAyXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxpdHlDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19hcml0aF9fT25lV2F5RXF1YWxpdHlDb25zdHJhaW50KHJlZjEsIHJlZjIsIG9wdFNlY29uZFByb3BJc0ZuKSB7XG5cdGluc3RhbGxSZWYodGhpcywgcmVmMSwgJ3YxJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYyLCAndjInKVxuXHR0aGlzLnNlY29uZFByb3BJc0ZuID0gb3B0U2Vjb25kUHJvcElzRm5cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLk9uZVdheUVxdWFsaXR5Q29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxpdHlDb25zdHJhaW50KHtvYmo6IE8xLCBwcm9wOiBwMX0sIHtvYmo6IE8yLCBwcm9wOiBwMn0sIEJvb2xlYW4gc2Vjb25kUHJvcElzRm4pIHN0YXRlcyB0aGF0IE8xLnAxID0gTzIucDIgKHJpZ2h0IGhhbmQtc2lkZSBpcyAgcmVhZC1vbmx5KS4gSWYgc2Vjb25kUHJvcElzRm4gPSB0cnVlIHRoZW4gTzIucDIoKSBpcyBpbnZva2VkIGluc3RlYWQuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLk9uZVdheUVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMudjFfb2JqLCBwcm9wczogW3RoaXMudjFfcHJvcF19XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbGl0eUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLmFyaXRoLk9uZVdheUVxdWFsaXR5Q29uc3RyYWludCh7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwge29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30pIFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MiA9IHRoaXMuc2Vjb25kUHJvcElzRm4gPyBmblJlZih0aGlzLCAndjInKSA6IHJlZih0aGlzLCAndjInKVxuXHR2YXIgZSA9IHJlZih0aGlzLCAndjEnKSA9PSB2MiA/IDAgOiAxXG5cdHJldHVybiBlXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLk9uZVdheUVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjIgPSB0aGlzLnNlY29uZFByb3BJc0ZuID8gZm5SZWYodGhpcywgJ3YyJykgOiByZWYodGhpcywgJ3YyJylcblx0cmV0dXJuIHBhdGNoKHRoaXMsICd2MScsIHYyKVxuICAgIH1cblxuICAgIC8vIEluZXF1YWxpdHkgQ29uc3RyYWludCwgaS5lLiwgazEgKiBvMS5wMSA+PSBrMiAqIG8yLnAyICsgazMgb3IgazEgKiBvMS5wMSA8PSBrMiAqIG8yLnAyICsgazNcblxuICAgIFNrZXRjaHBhZC5hcml0aC5JbmVxdWFsaXR5Q29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fYXJpdGhfX0luZXF1YWxpdHlDb25zdHJhaW50KHJlZjEsIHJlZjIsIGlzR2VxLCBrMSwgazIsIGszKSB7XG5cdHRoaXMuazEgPSBrMSB8fCAxLCB0aGlzLmsyID0gazIgfHwgMSwgdGhpcy5rMyA9IGszIHx8IDBcblx0aW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpXG5cdHRoaXMuaXNHZXEgPSBpc0dlcVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQoe29iajogTzEsIHByb3A6IHAxfSwge29iajogTzIsIHByb3A6IHAyfSwgaXNHZXEsIE51bWJlciBLMSwgTnVtYmVyIEsyLCBOdW1iZXIgSzMpIHN0YXRlcyB0aGF0IEsxICogTzEucDEgPj0gSzIgKiBPMi5wMiArIEszICh3aGVuIGlzR2VxPXRydWUpIG9yIEsxICogTzEucDEgPD0gSzIgKiBPMi5wMiArIEszICh3aGVuIGlzR2VxPWZhbHNlKS4gQ29uc3RhbnRzIEsxLTIgZGVmYXVsdCB0byAxIGFuZCBLMyB0byAwXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkluZXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy52MV9vYmosIHByb3BzOiBbdGhpcy52MV9wcm9wXX0sIHtvYmo6IHRoaXMudjJfb2JqLCBwcm9wczogW3RoaXMudjJfcHJvcF19XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5JbmVxdWFsaXR5Q29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB0cnVlKSBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MSA9IHRoaXMuazEgKiByZWYodGhpcywgJ3YxJykgLCB2MiA9ICh0aGlzLmsyICogcmVmKHRoaXMsICd2MicpKSArIHRoaXMuazMsIGNvbmQgPSB0aGlzLmlzR2VxID8gdjEgPj0gdjIgOiB2MSA8PSB2MiwgZSA9IGNvbmQgPyAwIDogdjIgLSB2MVxuXHRyZXR1cm4gZVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5JbmVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjIgPSAodGhpcy5rMiAqIHJlZih0aGlzLCAndjInKSkgKyB0aGlzLmszXG5cdHJlcyA9IHBhdGNoKHRoaXMsICd2MScsIHYyIC8gdGhpcy5rMSlcblx0cmV0dXJuIHJlc1xuICAgIH1cblxuICAgIC8vIFN1bSBDb25zdHJhaW50LCBpLmUuLCBrMSAqIG8xLnAxICsgazIgKiBvMi5wMiA9IGszICogbzMucDMgKyBrNFxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19TdW1Db25zdHJhaW50KHJlZjEsIHJlZjIsIHJlZjMsIG9wdE9ubHlXcml0ZVRvLCBrMSwgazIsIGszLCBrNCkge1xuXHR0aGlzLmsxID0gazEgfHwgMSwgdGhpcy5rMiA9IGsyIHx8IDEsIHRoaXMuazMgPSBrMyB8fCAxLCB0aGlzLms0ID0gazQgfHwgMFxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjEsICd2MScpXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMiwgJ3YyJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYzLCAndjMnKVxuXHR0aGlzLm9ubHlXcml0ZVRvID0gb3B0T25seVdyaXRlVG8gfHwgWzEsIDIsIDNdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludCh7b2JqOiBPMSwgcHJvcDogcDF9LCB7b2JqOiBPMiwgcHJvcDogcDJ9LCB7b2JqOiBPMywgcHJvcDogcDN9LCBXcml0YWJsZUlkeHMsIE51bWJlciBLMSwgTnVtYmVyIEsyLCBOdW1iZXIgSzMsIE51bWJlciBLNCkgc3RhdGVzIHRoYXQgSzEgKiBPMS5wMSArIEsyICogTzIucDIgPSBLMyAqIE8zLnAzICsgSzQgLiBDb25zdGFudHMgSzEtMyBkZWZhdWx0IHRvIDEgYW5kIEs0IHRvIDAuIE9wdGlvbmFsIFdyaXRhYmxlSWR4cyBnaXZlcyBhIGxpc3Qgb2YgaW5kaWNlcyAoMSwgMiwgb3IsIDMpIHRoZSBjb25zdHJhaW50IGlzIGFsbG93ZWQgdG8gY2hhbmdlLlwiIH0gXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMudjFfb2JqLCBwcm9wczogW3RoaXMudjFfcHJvcF19LCB7b2JqOiB0aGlzLnYyX29iaiwgcHJvcHM6IFt0aGlzLnYyX3Byb3BdfSwge29iajogdGhpcy52M19vYmosIHByb3BzOiBbdGhpcy52M19wcm9wXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSkgXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkaWZmID0gdGhpcy5rMyAqIHJlZih0aGlzLCAndjMnKSArIHRoaXMuazQgLSAoKHRoaXMuazEgKiByZWYodGhpcywgJ3YxJykpICsgKHRoaXMuazIgKiByZWYodGhpcywgJ3YyJykpKVxuXHRyZXR1cm4gZGlmZlxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MSA9IHRoaXMuazEgKiByZWYodGhpcywgJ3YxJylcblx0dmFyIHYyID0gdGhpcy5rMiAqIHJlZih0aGlzLCAndjInKVxuXHR2YXIgdjMgPSB0aGlzLmszICogcmVmKHRoaXMsICd2MycpXG5cdHZhciB2cyA9IFt2MSwgdjIsIHYzXSwga3MgPSBbdGhpcy5rMSwgdGhpcy5rMiwgdGhpcy5rM11cblx0dmFyIGRpZmYgPSB2MyArIHRoaXMuazQgLSAodjEgKyB2Milcblx0dmFyIG9ubHlXcml0ZVRvID0gdGhpcy5vbmx5V3JpdGVUb1xuXHR2YXIgZGl2ID0gb25seVdyaXRlVG8ubGVuZ3RoXG5cdHZhciBhcmdzID0gW3RoaXNdXG5cdG9ubHlXcml0ZVRvLmZvckVhY2goZnVuY3Rpb24oaSkgeyB2YXIgc2lnbiA9IGkgPiAyID8gLTEgOiAxOyBhcmdzLnB1c2goJ3YnICsgaSk7IGFyZ3MucHVzaCgodnNbaSAtIDFdICsgc2lnbiAqIGRpZmYgLyBkaXYpIC8ga3NbaSAtIDFdKSB9KVxuXHRyZXMgPSBwYXRjaC5hcHBseSh0aGlzLCBhcmdzKVxuXHRyZXR1cm4gcmVzXG4gICAgfVxuXG4gICAgLy8gU3VtSW5lcXVhbGl0eSBDb25zdHJhaW50LCBpLmUuLCBrMSAqIG8xLnAxID49IGsyICogbzIucDIgKyBrMyAqIG8zLnAzICsgazQgb3IgazEgKiBvMS5wMSA+PSBrMiAqIG8yLnAyICsgazMgKiBvMy5wMyArIGs0XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19TdW1JbmVxdWFsaXR5Q29uc3RyYWludChyZWYxLCByZWYyLCByZWYzLCBpc0dlcSwgazEsIGsyLCBrMywgazQpIHtcblx0dGhpcy5rMSA9IGsxIHx8IDEsIHRoaXMuazIgPSBrMiB8fCAxLCB0aGlzLmszID0gazMgfHwgMSwgdGhpcy5rNCA9IGs0IHx8IDBcblx0aW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMywgJ3YzJylcblx0dGhpcy5pc0dlcSA9IGlzR2VxXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5Q29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMudjFfb2JqLCBwcm9wczogW3RoaXMudjFfcHJvcF19XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5Q29uc3RyYWludCh7b2JqOiBPMSwgcHJvcDogcDF9LCB7b2JqOiBPMiwgcHJvcDogcDJ9LCB7b2JqOiBPMywgcHJvcDogcDN9LCBpc0dlcSwgTnVtYmVyIEsxLCBOdW1iZXIgSzIsIE51bWJlciBLMywgTnVtYmVyIEs0KSBzdGF0ZXMgdGhhdCBLMSAqIE8xLnAxID49ICBrMiAqIE8yLnAyICArIGszICogTzMucDMgKyBLNCAgb3IgIEsxICogTzEucDEgPD0gIEsyICogTzIucDIgKyBLMyAqIE8zLnAzICsgSzQgKD49IHdoZW4gaXNHZXE9dHJ1ZSlcIiB9IFxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUluZXF1YWxpdHlDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5Q29uc3RyYWludCh7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwge29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB0cnVlKSBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MSA9IHRoaXMuazEgKiByZWYodGhpcywgJ3YxJyksIHYyID0gdGhpcy5rMiAqIHJlZih0aGlzLCAndjInKSwgdjMgPSB0aGlzLmszICogcmVmKHRoaXMsICd2MycpLCBzdW0gPSB2MiArIHYzICsgdGhpcy5rNCwgY29uZCA9IHRoaXMuaXNHZXEgPyB2MSA+PSBzdW0gOiB2MSA8PSBzdW0sIGUgPSBjb25kID8gMCA6IHN1bSAtIHYxXG5cdHJldHVybiBlXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUluZXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHYyID0gdGhpcy5rMiAqIHJlZih0aGlzLCAndjInKSwgdjMgPSB0aGlzLmszICogcmVmKHRoaXMsICd2MycpLCBzdW0gPSB2MiArIHYzICsgdGhpcy5rNFxuXHRyZXMgPSBwYXRjaCh0aGlzLCAndjEnLCBzdW0gLyB0aGlzLmsxKVxuXHRyZXR1cm4gcmVzXG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoU2tldGNocGFkKSB7XG5cbiAgICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBnZW9tZXRyaWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIG9iamVjdHMgdGhhdCBoYXZlIHggYW5kIHkgcHJvcGVydGllcy4gT3RoZXIgcHJvcGVydGllcyBhcmUgaWdub3JlZC5cblxuICAgIFNrZXRjaHBhZC5nZW9tID0ge31cblxuICAgIC8vIEhlbHBlcnNcblxuICAgIGZ1bmN0aW9uIHNxdWFyZShuKSB7XG5cdHJldHVybiBuICogblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBsdXMocDEsIHAyKSB7XG5cdHJldHVybiB7eDogcDEueCArIHAyLngsIHk6IHAxLnkgKyBwMi55fVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pbnVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggLSBwMi54LCB5OiBwMS55IC0gcDIueX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FsZWRCeShwLCBtKSB7XG5cdHJldHVybiB7eDogcC54ICogbSwgeTogcC55ICogbX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb3B5KHApIHtcblx0cmV0dXJuIHNjYWxlZEJ5KHAsIDEpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlkcG9pbnQocDEsIHAyKSB7XG5cdHJldHVybiBzY2FsZWRCeShwbHVzKHAxLCBwMiksIDAuNSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWduaXR1ZGUocCkge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KHNxdWFyZShwLngpICsgc3F1YXJlKHAueSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplZChwKSB7XG5cdHZhciBtID0gbWFnbml0dWRlKHApXG5cdHJldHVybiBtID4gMCA/IHNjYWxlZEJ5KHAsIDEgLyBtKSA6IHBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXN0YW5jZShwMSwgcDIpIHtcblx0cmV0dXJuIE1hdGguc3FydChzcXVhcmUocDEueCAtIHAyLngpICsgc3F1YXJlKHAxLnkgLSBwMi55KSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByb3RhdGVkQnkocCwgZFRoZXRhKSB7XG5cdHZhciBjID0gTWF0aC5jb3MoZFRoZXRhKVxuXHR2YXIgcyA9IE1hdGguc2luKGRUaGV0YSlcblx0cmV0dXJuIHt4OiBjKnAueCAtIHMqcC55LCB5OiBzKnAueCArIGMqcC55fVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJvdGF0ZWRBcm91bmQocCwgZFRoZXRhLCBheGlzKSB7XG5cdHJldHVybiBwbHVzKGF4aXMsIHJvdGF0ZWRCeShtaW51cyhwLCBheGlzKSwgZFRoZXRhKSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXREZWx0YShkLCBwLCBzY2FsZSkge1xuXHRkLnggPSBwLnggKiBzY2FsZVxuXHRkLnkgPSBwLnkgKiBzY2FsZVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLnNxdWFyZSA9IHNxdWFyZVxuICAgIFNrZXRjaHBhZC5nZW9tLnBsdXMgPSBwbHVzXG4gICAgU2tldGNocGFkLmdlb20ubWludXMgPSBtaW51c1xuICAgIFNrZXRjaHBhZC5nZW9tLnNjYWxlZEJ5ID0gc2NhbGVkQnlcbiAgICBTa2V0Y2hwYWQuZ2VvbS5jb3B5ID0gY29weVxuICAgIFNrZXRjaHBhZC5nZW9tLm1pZHBvaW50ID0gbWlkcG9pbnRcbiAgICBTa2V0Y2hwYWQuZ2VvbS5tYWduaXR1ZGUgPSBtYWduaXR1ZGVcbiAgICBTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkID0gbm9ybWFsaXplZFxuICAgIFNrZXRjaHBhZC5nZW9tLmRpc3RhbmNlID0gZGlzdGFuY2VcbiAgICBTa2V0Y2hwYWQuZ2VvbS5yb3RhdGVkQnkgPSByb3RhdGVkQnlcbiAgICBTa2V0Y2hwYWQuZ2VvbS5yb3RhdGVkQXJvdW5kID0gcm90YXRlZEFyb3VuZFxuICAgIFNrZXRjaHBhZC5nZW9tLnNldERlbHRhID0gc2V0RGVsdGFcblxuICAgIFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZSA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luLCBwMSwgcDIsIGwpIHtcblx0dmFyIGN0eHQgPSBjYW52YXMuY3R4dFxuXHRjdHh0LmxpbmVXaWR0aCA9IDFcblx0Y3R4dC5zdHJva2VTdHlsZSA9ICd5ZWxsb3cnXG5cdGN0eHQuYmVnaW5QYXRoKClcblxuXHR2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHAyLnkgLSBwMS55LCBwMi54IC0gcDEueClcblx0dmFyIGRpc3QgPSAyNVxuXHR2YXIgcDF4ID0gb3JpZ2luLnggKyBwMS54IC0gZGlzdCAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMXkgPSBvcmlnaW4ueSArIHAxLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeCA9IG9yaWdpbi54ICsgcDIueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ5ID0gb3JpZ2luLnkgKyBwMi55IC0gZGlzdCAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cblx0dmFyIHRleHRDZW50ZXJYID0gKHAxeCArIHAyeCkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclkgPSAocDF5ICsgcDJ5KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cblx0Y3R4dC5tb3ZlVG8oXG5cdCAgICBwMXggKyA1ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMiksXG5cdCAgICBwMXkgKyA1ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0KVxuXHRjdHh0LmxpbmVUbyhcblx0ICAgIHAxeCAtIDUgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKSxcblx0ICAgIHAxeSAtIDUgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHQpXG5cblx0Y3R4dC5tb3ZlVG8ocDF4LCBwMXkpXG5cdGN0eHQubGluZVRvKHAyeCwgcDJ5KVxuXG5cdGN0eHQubW92ZVRvKFxuXHQgICAgcDJ4ICsgNSAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpLFxuXHQgICAgcDJ5ICsgNSAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdClcblx0Y3R4dC5saW5lVG8oXG5cdCAgICBwMnggLSA1ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMiksXG5cdCAgICBwMnkgLSA1ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0KVxuXHRjdHh0LmNsb3NlUGF0aCgpXG5cdGN0eHQuc3Ryb2tlKClcblxuXHRjdHh0LnRleHRBbGlnbiA9ICdjZW50ZXInXG5cdGN0eHQudGV4dEJhc2VsaW5lID0gJ21pZGRsZSdcblx0Y3R4dC5zdHJva2VUZXh0KE1hdGgucm91bmQobCksIHRleHRDZW50ZXJYLCB0ZXh0Q2VudGVyWSlcblx0Y3R4dC5zdHJva2UoKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLmNhbGN1bGF0ZUFuZ2xlID0gZnVuY3Rpb24ocDEsIHAyLCBwMywgcDQpIHtcblx0dmFyIHYxMiA9IHt4OiBwMi54IC0gcDEueCwgeTogcDIueSAtIHAxLnl9XG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIHYzNCA9IHt4OiBwNC54IC0gcDMueCwgeTogcDQueSAtIHAzLnl9XG5cdHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueClcblx0cmV0dXJuIChhMTIgLSBhMzQgKyAyICogTWF0aC5QSSkgJSAoMiAqIE1hdGguUEkpXG4gICAgfVxuXG4gICAgLy8gQ29vcmRpbmF0ZSBDb25zdHJhaW50LCBpLmUuLCBcIkkgd2FudCB0aGlzIHBvaW50IHRvIGJlIGhlcmVcIi5cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19Db29yZGluYXRlQ29uc3RyYWludChwLCB4LCB5KSB7XG5cdHRoaXMucCA9IHBcblx0dGhpcy5jID0gbmV3IFBvaW50KHgsIHkpXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludChQb2ludCBQLCBOdW1iZXIgWCwgTnVtYmVyIFkpIHN0YXRlcyB0aGF0IHBvaW50IFAgc2hvdWxkIHN0YXkgYXQgY29vcmRpbmF0ZSAoWCwgWSkuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDogJ1BvaW50JywgYzogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy5wLCBwcm9wczogWyd4JywgJ3knXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBwMSA9IFBvaW50LmR1bW15KHgsIHkpXG5cdHZhciBwMiA9IFBvaW50LmR1bW15KHksIHgpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQocDEsIHAyLngsIHAyLnkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXModGhpcy5jLCB0aGlzLnApKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7cDoge3g6IHRoaXMuYy54LCB5OiB0aGlzLmMueX19XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgY3R4dCA9IGNhbnZhcy5jdHh0XG5cdGlmICh0aGlzLnAuaXNTZWxlY3RlZCkgcmV0dXJuIC8vIGRvbid0IGRyYXcgb3ZlciB0aGUgc2VsZWN0aW9uIGhpZ2hsaWdodFxuXHRjdHh0LmZpbGxTdHlsZSA9ICdibGFjaydcblx0Y3R4dC5iZWdpblBhdGgoKVxuXHRjdHh0LmFyYyh0aGlzLmMueCArIG9yaWdpbi54LCB0aGlzLmMueSArIG9yaWdpbi55LCBjYW52YXMucG9pbnRSYWRpdXMgKiAwLjY2NiwgMCwgMiAqIE1hdGguUEkpXG5cdGN0eHQuY2xvc2VQYXRoKClcblx0Y3R4dC5maWxsKClcbiAgICB9XG5cbiAgICAvLyBYQ29vcmRpbmF0ZUNvbnN0cmFpbnQgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19YQ29vcmRpbmF0ZUNvbnN0cmFpbnQocDEsIHAyKSB7XG4gICAgICAgIHRoaXMucDEgPSBwMVxuICAgICAgICB0aGlzLnAyID0gcDJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQoUG9pbnQgUCwgTnVtYmVyIFgpIHN0YXRlcyB0aGF0IHBvaW50IFAneCB4LWNvb3JkaW5hdGUgc2hvdWxkIGJlIGF0IFguXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLlhDb29yZGluYXRlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIHAxID0gUG9pbnQuZHVtbXkoeCwgeSlcblx0dmFyIHAyID0gUG9pbnQuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5YQ29vcmRpbmF0ZUNvbnN0cmFpbnQocDEsIHAyLngsIHAyLnkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy5wMi54IC0gdGhpcy5wMS54XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uWENvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7cDE6IHt4OiB0aGlzLnAyLnh9fVxuICAgIH1cblxuICAgIC8vIFlDb29yZGluYXRlQ29uc3RyYWludCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5ZQ29vcmRpbmF0ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX1lDb29yZGluYXRlQ29uc3RyYWludChwMSwgcDIpIHtcbiAgICAgICAgdGhpcy5wMSA9IHAxXG4gICAgICAgIHRoaXMucDIgPSBwMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5ZQ29vcmRpbmF0ZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5ZQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB0aGlzLnAyLnkgLSB0aGlzLnAxLnlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5ZQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHtwMToge3k6IHRoaXMucDIueX19XG4gICAgfVxuXG4gICAgLy8gQ29pbmNpZGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZXNlIHR3byBwb2ludHMgdG8gYmUgYXQgdGhlIHNhbWUgcGxhY2UuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0NvaW5jaWRlbmNlQ29uc3RyYWludChwMSwgcDIpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW9udCBQMikgc3RhdGVzIHRoYXQgcG9pbnRzIFAxICYgUDIgc2hvdWxkIGJlIGF0IHRoZSBzYW1lIHBsYWNlLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsID0gTGluZS5kdW1teSh4LCB5KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludChsLnAxLCBsLnAyKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyh0aGlzLnAyLCB0aGlzLnAxKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNwbGl0RGlmZiA9IHNjYWxlZEJ5KG1pbnVzKHRoaXMucDIsIHRoaXMucDEpLCAwLjUpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgc3BsaXREaWZmKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoc3BsaXREaWZmLCAtMSkpfVxuICAgIH1cblxuICAgIC8vIEVxdWl2YWxlbmNlIENvbnN0cmFpbnQsIGkuZS4sIEkgd2FudCB0aGUgdmVjdG9ycyBwMS0+cDIgYW5kIHAzLT5wNCB0byBiZSB0aGUgc2FtZS5cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fRXF1aXZhbGVuY2VDb25zdHJhaW50KHAxLCBwMiwgcDMsIHA0KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQpIHNheXMgbGluZSBzZWN0aW9ucyBQMS0yIGFuZCBQMy00IGFyZSBwYXJhbGxlbCBhbmQgb2YgdGhlIHNhbWUgbGVuZ3Rocy5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsMSA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGwyID0gTGluZS5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludChsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzcGxpdERpZmYgPSBzY2FsZWRCeShtaW51cyhwbHVzKHRoaXMucDIsIHRoaXMucDMpLCBwbHVzKHRoaXMucDEsIHRoaXMucDQpKSwgMC4yNSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBzcGxpdERpZmYpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSksIHAzOiBwbHVzKHRoaXMucDMsIHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpKSwgcDQ6IHBsdXModGhpcy5wNCwgc3BsaXREaWZmKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgbCA9IGRpc3RhbmNlKHRoaXMucDEsIHRoaXMucDIpXG5cdFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZShjYW52YXMsIG9yaWdpbiwgdGhpcy5wMSwgdGhpcy5wMiwgbClcblx0U2tldGNocGFkLmdlb20uZHJhd1Zpc3VhbGl6YXRpb25MaW5lKGNhbnZhcywgb3JpZ2luLCB0aGlzLnAzLCB0aGlzLnA0LCBsKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29udGFpbnNQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIHAxID0gdGhpcy5wMSwgcDIgPSB0aGlzLnAyLCBwMyA9IHRoaXMucDMsIHA0ID0gdGhpcy5wNFxuXHR2YXIgeDEgPSBNYXRoLm1pbihwMS54LCBwMi54LCBwMy54LCBwNC54KSwgeDIgPSBNYXRoLm1heChwMS54LCBwMi54LCBwMy54LCBwNC54KVxuXHR2YXIgeTEgPSBNYXRoLm1pbihwMS55LCBwMi55LCBwMy55LCBwNC55KSwgeTIgPSBNYXRoLm1heChwMS55LCBwMi55LCBwMy55LCBwNC55KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQoeDEsIHkxKSwgeDIgLSB4MSwgeTIgLSB5MSkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyLmNvbnRhaW5zUG9pbnQoeCwgeSkgXG4gICAgfVxuICAgXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5ib3JkZXIgPSBmdW5jdGlvbigpIHtcblx0dmFyIHAxID0gdGhpcy5wMSwgcDIgPSB0aGlzLnAyLCBwMyA9IHRoaXMucDMsIHA0ID0gdGhpcy5wNFxuXHR2YXIgeDEgPSBNYXRoLm1pbihwMS54LCBwMi54LCBwMy54LCBwNC54KSwgeDIgPSBNYXRoLm1heChwMS54LCBwMi54LCBwMy54LCBwNC54KVxuXHR2YXIgeTEgPSBNYXRoLm1pbihwMS55LCBwMi55LCBwMy55LCBwNC55KSwgeTIgPSBNYXRoLm1heChwMS55LCBwMi55LCBwMy55LCBwNC55KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQoeDEsIHkxKSwgeDIgLSB4MSwgeTIgLSB5MSkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyXG4gICAgfSBcblxuICAgIC8vIE9uZSBXYXkgRXF1aXZhbGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZSB2ZWN0b3JzIHAxLT5wMiB0byBhbHdheXMgbWF0Y2ggd2l0aCBwMy0+cDRcblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50KHAxLCBwMiwgcDMsIHA0KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQpIHNheXMgdGhlIHZlY3RvcnMgUDEtPlAyIGFsd2F5cyBtYXRjaGVzIHdpdGggUDMtPlA0XCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgcDM6ICdQb2ludCcsIHA0OiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbDEgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHZhciBsMiA9IExpbmUuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQobDEucDEsIGwxLnAyLCBsMi5wMSwgbDIucDIpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5wMiwgdGhpcy5wMyksIHBsdXModGhpcy5wMSwgdGhpcy5wNCkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSksIDAuNSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBzcGxpdERpZmYpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSl9XG4gICAgfVxuXG4gICAgLy8gRXF1YWwgRGlzdGFuY2UgY29uc3RyYWludCAtIGtlZXBzIGRpc3RhbmNlcyBQMS0tPlAyLCBQMy0tPlA0IGVxdWFsXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQocDEsIHAyLCBwMywgcDQpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLnAzID0gcDNcblx0dGhpcy5wNCA9IHA0XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIFBvaW50IFAzLCBQb2ludCBQNCkga2VlcHMgZGlzdGFuY2VzIFAxLT5QMiwgUDMtPlA0IGVxdWFsLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgcDM6ICdQb2ludCcsIHA0OiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsMSA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGwyID0gTGluZS5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50KGwxLnAxLCBsMS5wMiwgbDIucDEsIGwyLnAyKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKVxuXHR2YXIgbDM0ID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDMsIHRoaXMucDQpKVxuXHRyZXR1cm4gbDEyIC0gbDM0XG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsMTIgPSBtYWduaXR1ZGUobWludXModGhpcy5wMSwgdGhpcy5wMikpXG5cdHZhciBsMzQgPSBtYWduaXR1ZGUobWludXModGhpcy5wMywgdGhpcy5wNCkpXG5cdHZhciBkZWx0YSA9IChsMTIgLSBsMzQpIC8gNFxuXHR2YXIgZTEyID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20ubm9ybWFsaXplZChtaW51cyh0aGlzLnAyLCB0aGlzLnAxKSksIGRlbHRhKVxuXHR2YXIgZTM0ID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20ubm9ybWFsaXplZChtaW51cyh0aGlzLnA0LCB0aGlzLnAzKSksIGRlbHRhKVxuXHRyZXR1cm4ge3AxOiBwbHVzKHRoaXMucDEsIGUxMiksIHAyOiBwbHVzKHRoaXMucDIsIHNjYWxlZEJ5KGUxMiwgLTEpKSwgcDM6IHBsdXModGhpcy5wMywgc2NhbGVkQnkoZTM0LCAtMSkpLCBwNDogcGx1cyh0aGlzLnA0LCBlMzQpfVxuICAgIH1cblxuICAgIC8vIExlbmd0aCBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGRpc3RhbmNlIGJldHdlZW4gUDEgYW5kIFAyIGF0IEwuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19MZW5ndGhDb25zdHJhaW50KHAxLCBwMiwgbCwgb25seU9uZVdyaXRhYmxlKSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5sID0gbFxuXHR0aGlzLl9vbmx5T25lV3JpdGFibGUgPSBvbmx5T25lV3JpdGFibGVcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50KFBvaW50IFAxLCBQb2ludCBQMiwgTnVtYmVyIEwpIHNheXMgcG9pbnRzIFAxIGFuZCBQMiBhbHdheXMgbWFpbnRhaW4gYSBkaXN0YW5jZSBvZiBMLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBsOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnAxLCBwcm9wczogWyd4JywgJ3knXX0sIHtvYmo6IHRoaXMucDIsIHByb3BzOiBbJ3gnLCAneSddfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQobmV3IFBvaW50KHggLSA1MCwgeSAtIDUwKSwgbmV3IFBvaW50KHggKyA1MCwgeSArIDUwKSwgMTAwKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsMTIgPSBtYWduaXR1ZGUobWludXModGhpcy5wMSwgdGhpcy5wMikpXG5cdHJldHVybiBsMTIgLSB0aGlzLmxcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHAxLCBwMikpXG5cdGlmIChsMTIgPT0gMCkge1xuXHQgICAgcDEgPSBwbHVzKHAxLCB7eDogMC4xLCB5OiAwfSlcblx0ICAgIHAyID0gcGx1cyhwMiwge3g6IC0wLjEsIHk6IDB9KVxuXHR9XHRcblx0dmFyIGRlbHRhID0gKGwxMiAtIHRoaXMubCkgLyAodGhpcy5fb25seU9uZVdyaXRhYmxlID8gMSA6IDIpXG5cdHZhciBlMTIgPSBzY2FsZWRCeShTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkKG1pbnVzKHAyLCBwMSkpLCBkZWx0YSlcblx0dmFyIHJlcyA9IHtwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShlMTIsIC0xKSl9XG5cdGlmICghdGhpcy5fb25seU9uZVdyaXRhYmxlKVxuXHQgICAgcmVzWydwMSddID0gcGx1cyh0aGlzLnAxLCBlMTIpXG5cdHJldHVybiByZXNcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0U2tldGNocGFkLmdlb20uZHJhd1Zpc3VhbGl6YXRpb25MaW5lKGNhbnZhcywgb3JpZ2luLCB0aGlzLnAxLCB0aGlzLnAyLCB0aGlzLmwpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuY29udGFpbnNQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIHAxID0gdGhpcy5wMSwgcDIgPSB0aGlzLnAyXG5cdHZhciBhbmdsZSA9IE1hdGguYXRhbjIocDIueSAtIHAxLnksIHAyLnggLSBwMS54KVxuXHR2YXIgZGlzdCA9IDI1XG5cdHZhciBwMXggPSBwMS54IC0gZGlzdCAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMXkgPSBwMS55IC0gZGlzdCAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMnggPSBwMi54IC0gZGlzdCAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMnkgPSBwMi55IC0gZGlzdCAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciB0ZXh0Q2VudGVyWCA9IChwMXggKyBwMngpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHRleHRDZW50ZXJZID0gKHAxeSArIHAyeSkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQodGV4dENlbnRlclggLSA1MCwgdGV4dENlbnRlclkgLSA1MCksIDEwMCwgMTAwKSBcblx0cmV0dXJuIHRoaXMuX19ib3JkZXIuY29udGFpbnNQb2ludCh4LCB5KSBcbiAgICB9XG4gICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5ib3JkZXIgPSBmdW5jdGlvbigpIHtcblx0dmFyIHAxID0gdGhpcy5wMSwgcDIgPSB0aGlzLnAyXG5cdHZhciBhbmdsZSA9IE1hdGguYXRhbjIocDIueSAtIHAxLnksIHAyLnggLSBwMS54KVxuXHR2YXIgZGlzdCA9IDI1XG5cdHZhciBwMXggPSBwMS54IC0gZGlzdCAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMXkgPSBwMS55IC0gZGlzdCAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMnggPSBwMi54IC0gZGlzdCAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMnkgPSBwMi55IC0gZGlzdCAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciB0ZXh0Q2VudGVyWCA9IChwMXggKyBwMngpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHRleHRDZW50ZXJZID0gKHAxeSArIHAyeSkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQodGV4dENlbnRlclggLSA1MCwgdGV4dENlbnRlclkgLSA1MCksIDEwMCwgMTAwKSBcblx0cmV0dXJuIHRoaXMuX19ib3JkZXJcbiAgICB9IFxuXG4gICAgLy8gT3JpZW50YXRpb24gY29uc3RyYWludCAtIG1haW50YWlucyBhbmdsZSBiZXR3ZWVuIFAxLT5QMiBhbmQgUDMtPlA0IGF0IFRoZXRhXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX09yaWVudGF0aW9uQ29uc3RyYWludChwMSwgcDIsIHAzLCBwNCwgdGhldGEpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLnAzID0gcDNcblx0dGhpcy5wNCA9IHA0XG5cdHRoaXMudGhldGEgPSB0aGV0YSA9PT0gdW5kZWZpbmVkID8gU2tldGNocGFkLmdlb20uY2FsY3VsYXRlQW5nbGUocDEsIHAyLCBwMywgcDQpIDogdGhldGFcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50KFBvaW50IFAxLCBQb2ludCBQMiwgUG9pbnQgUDMsIFBvaW50IFA0LCBOdW1iZXIgVGhldGEpIG1haW50YWlucyBhbmdsZSBiZXR3ZWVuIFAxLT5QMiBhbmQgUDMtPlA0IGF0IFRoZXRhLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCcsIHAzOiAnUG9pbnQnLCBwNDogJ1BvaW50JywgdGhldGE6ICdOdW1iZXInfVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbDEgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHZhciBsMiA9IExpbmUuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQobDEucDEsIGwxLnAyLCBsMi5wMSwgbDIucDIpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjEyID0gbWludXModGhpcy5wMiwgdGhpcy5wMSlcblx0dmFyIGExMiA9IE1hdGguYXRhbjIodjEyLnksIHYxMi54KVxuXHR2YXIgbTEyID0gbWlkcG9pbnQodGhpcy5wMSwgdGhpcy5wMilcblx0XG5cdHZhciB2MzQgPSBtaW51cyh0aGlzLnA0LCB0aGlzLnAzKVxuXHR2YXIgYTM0ID0gTWF0aC5hdGFuMih2MzQueSwgdjM0LngpXG5cdHZhciBtMzQgPSBtaWRwb2ludCh0aGlzLnAzLCB0aGlzLnA0KVxuXHRcblx0dmFyIGN1cnJUaGV0YSA9IGExMiAtIGEzNFxuXHR2YXIgZFRoZXRhID0gdGhpcy50aGV0YSAtIGN1cnJUaGV0YVxuXHRyZXR1cm4gZFRoZXRhXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjEyID0gbWludXModGhpcy5wMiwgdGhpcy5wMSlcblx0dmFyIGExMiA9IE1hdGguYXRhbjIodjEyLnksIHYxMi54KVxuXHR2YXIgbTEyID0gbWlkcG9pbnQodGhpcy5wMSwgdGhpcy5wMilcblxuXHR2YXIgdjM0ID0gbWludXModGhpcy5wNCwgdGhpcy5wMylcblx0dmFyIGEzNCA9IE1hdGguYXRhbjIodjM0LnksIHYzNC54KVxuXHR2YXIgbTM0ID0gbWlkcG9pbnQodGhpcy5wMywgdGhpcy5wNClcblxuXHR2YXIgY3VyclRoZXRhID0gYTEyIC0gYTM0XG5cdHZhciBkVGhldGEgPSB0aGlzLnRoZXRhIC0gY3VyclRoZXRhXG5cdC8vIFRPRE86IGZpZ3VyZSBvdXQgd2h5IHNldHRpbmcgZFRoZXRhIHRvIDEvMiB0aW1lcyB0aGlzIHZhbHVlIChhcyBzaG93biBpbiB0aGUgcGFwZXJcblx0Ly8gYW5kIHNlZW1zIHRvIG1ha2Ugc2Vuc2UpIHJlc3VsdHMgaW4ganVtcHkvdW5zdGFibGUgYmVoYXZpb3IuXG5cdHJldHVybiB7cDE6IHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLFxuXHRcdHAyOiByb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKSxcblx0XHRwMzogcm90YXRlZEFyb3VuZCh0aGlzLnAzLCAtZFRoZXRhLCBtMzQpLFxuXHRcdHA0OiByb3RhdGVkQXJvdW5kKHRoaXMucDQsIC1kVGhldGEsIG0zNCl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0dmFyIGN0eHQgPSBjYW52YXMuY3R4dFxuXHR2YXIgbTEgPSBzY2FsZWRCeShwbHVzKHRoaXMucDEsIHRoaXMucDIpLCAwLjUpXG5cdHZhciBtMiA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMywgdGhpcy5wNCksIDAuNSlcblx0dmFyIG0gPSBzY2FsZWRCeShwbHVzKG0xLCBtMiksIDAuNSlcblx0Y2FudmFzLmRyYXdBcnJvdyhtMSwgbTIsIG9yaWdpbilcblx0Y3R4dC5maWxsU3R5bGUgPSAncmVkJ1xuXHRjdHh0LmZpbGxUZXh0KCd0aGV0YSA9ICcgKyBNYXRoLmZsb29yKHRoaXMudGhldGEgLyBNYXRoLlBJICogMTgwKSwgbS54ICsgb3JpZ2luLngsIG0ueSArIG9yaWdpbi55KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuY29udGFpbnNQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIG0xID0gc2NhbGVkQnkocGx1cyh0aGlzLnAxLCB0aGlzLnAyKSwgMC41KVxuXHR2YXIgbTIgPSBzY2FsZWRCeShwbHVzKHRoaXMucDMsIHRoaXMucDQpLCAwLjUpXG5cdHZhciBtID0gc2NhbGVkQnkocGx1cyhtMSwgbTIpLCAwLjUpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludChtLnggLSA1MCwgbS55IC0gNTApLCAxMDAsIDEwMCkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyLmNvbnRhaW5zUG9pbnQoeCwgeSkgXG4gICAgfVxuICAgXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5ib3JkZXIgPSBmdW5jdGlvbigpIHtcblx0dmFyIG0xID0gc2NhbGVkQnkocGx1cyh0aGlzLnAxLCB0aGlzLnAyKSwgMC41KVxuXHR2YXIgbTIgPSBzY2FsZWRCeShwbHVzKHRoaXMucDMsIHRoaXMucDQpLCAwLjUpXG5cdHZhciBtID0gc2NhbGVkQnkocGx1cyhtMSwgbTIpLCAwLjUpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludChtLnggLSA1MCwgbS55IC0gNTApLCAxMDAsIDEwMCkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyXG4gICAgfSBcblxuICAgIC8vIE1vdG9yIGNvbnN0cmFpbnQgLSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlLlxuICAgIC8vIHcgaXMgaW4gdW5pdHMgb2YgSHogLSB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cblxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fTW90b3JDb25zdHJhaW50KHAxLCBwMiwgdykge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMudyA9IHdcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50KFBvaW50IFAxLCBQb2ludCBQMiwgTnVtYmVyIFcpIGNhdXNlcyBQMSBhbmQgUDIgdG8gb3JiaXQgdGhlaXIgbWlkcG9pbnQgYXQgdGhlIGdpdmVuIHJhdGUgb2YgdywgaW4gdW5pdHMgb2YgSHo6IHdob2xlIHJvdGF0aW9ucyBwZXIgc2Vjb25kLlwiIH0gXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCB3OiAnTnVtYmVyJ31cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsID0gTGluZS5kdW1teSh4LCB5KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludChsLnAxLCBsLnAyLCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIDFcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHQgPSAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAvIDEwMDAuMFxuXHR2YXIgZFRoZXRhID0gdCAqIHRoaXMudyAqICgyICogTWF0aC5QSSlcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cdHJldHVybiB7cDE6IHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLFxuXHRcdHAyOiByb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKX1cbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50ID0gZnVuY3Rpb24gIFNrZXRjaHBhZF9fZ2VvbV9fQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50KHBvc2l0aW9uLCB2ZWN0b3IsIG9yaWdpbiwgdW5pdCkge1xuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy52ZWN0b3IgPSB2ZWN0b3Jcblx0dGhpcy5vcmlnaW4gPSBvcmlnaW5cblx0dGhpcy51bml0ID0gdW5pdFxuICAgIH1cbiAgICBcbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50LCB0cnVlKVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFwiU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50KFBvaW50IFAsIFZlY3RvciBWLCBQb2ludCBPLCBOdW1iZXIgVSkgc3RhdGVzIHRoYXQgUCBzaG91bGQgYmUgcG9zaXRpb25lZCBiYXNlZCBvbiB2ZWN0b3IgVidzIFggYW5kIFkgZGlzY3JldGUgY29vcmRpbmF0ZSB2YWx1ZXMsIGFuZCBvbiBvcmlnaW4gTyBhbmQgZWFjaCB1bml0IG9uIGF4aXMgaGF2aW5nIGEgdmVydGljYWwgYW5kIGhvcml6b250YWwgbGVuZ3RoIG9mIFVcIlxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5DYXJ0ZXNpYW5Qb2ludENvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBvcmlnaW4gPSB0aGlzLm9yaWdpbiwgdmVjdG9yID0gdGhpcy52ZWN0b3IsIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiwgdW5pdCA9IHRoaXMudW5pdFxuXHR2YXIgZGlmZlggPSBNYXRoLmFicyhvcmlnaW4ueCArIHVuaXQgKiB2ZWN0b3IueCAtIHBvc2l0aW9uLngpXG5cdHZhciBkaWZmWSA9IE1hdGguYWJzKG9yaWdpbi55IC0gdW5pdCAqIHZlY3Rvci55IC0gcG9zaXRpb24ueSlcblx0cmV0dXJuIGRpZmZYICsgZGlmZllcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5DYXJ0ZXNpYW5Qb2ludENvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIG9yaWdpbiA9IHRoaXMub3JpZ2luLCB2ZWN0b3IgPSB0aGlzLnZlY3RvciwgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLCB1bml0ID0gdGhpcy51bml0XG5cdHZhciB4ID0gb3JpZ2luLnggKyB1bml0ICogdmVjdG9yLnhcblx0dmFyIHkgPSBvcmlnaW4ueSAtIHVuaXQgKiB2ZWN0b3IueVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiB7eDogeCwgeTogeX19XG4gICAgfVxuICAgIFxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50c1xuIiwiZnVuY3Rpb24gaW5zdGFsbFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIHNpbXVsYXRpb24gY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24gPSB7IGc6IDkuOCwgRzogNi43ZS0xMSB9IC8vIEc6IE5tMi9rZzIgXG5cbiAgICB2YXIgbWludXMgPSBTa2V0Y2hwYWQuZ2VvbS5taW51c1xuICAgIHZhciBwbHVzID0gU2tldGNocGFkLmdlb20ucGx1c1xuICAgIHZhciBzY2FsZWRCeSA9IFNrZXRjaHBhZC5nZW9tLnNjYWxlZEJ5XG4gICAgdmFyIG5vcm1hbGl6ZWQgPSBTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkXG4gICAgdmFyIG1hZ25pdHVkZSA9IFNrZXRjaHBhZC5nZW9tLm1hZ25pdHVkZVxuICAgIHZhciBkaXN0YW5jZSA9IFNrZXRjaHBhZC5nZW9tLmRpc3RhbmNlXG5cbiAgICAvLyBDbGFzc2VzXG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0ZyZWVCb2R5KHBvc2l0aW9uLCBvcHRSYWRpdXMsIG9wdE1hc3MpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMubWFzcyA9IG9wdE1hc3MgfHwgMTBcblx0dGhpcy52ZWxvY2l0eSA9IG5ldyBWZWN0b3IoMCwgMClcblx0dGhpcy5hY2NlbGVyYXRpb24gPSBuZXcgVmVjdG9yKDAsIDApXG5cdHRoaXMucmFkaXVzID0gb3B0UmFkaXVzIHx8IHRoaXMucG9zaXRpb24ucmFkaXVzXG5cdHJjLmFkZChwb3NpdGlvbilcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwb3NpdGlvbjogJ1BvaW50JywgbWFzczogJ051bWJlcicsIHJhZGl1czogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keShQb2ludC5kdW1teSh4LCB5KSwgMTAsIDEwKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5wcm90b3R5cGUuY29udGFpbnNQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIHRoaXMucG9zaXRpb24uY29udGFpbnNQb2ludCh4LCB5KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5LnByb3RvdHlwZS5jZW50ZXIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMucG9zaXRpb25cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLnBvc2l0aW9uLmJvcmRlcigpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHQvL3RoaXMucG9zaXRpb24uZHJhdyhjYW52YXMsIG9yaWdpbilcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1NwcmluZyhib2R5MSwgYm9keTIsIGssIGxlbmd0aCwgdGVhclBvaW50QW1vdW50KSB7XG5cdHRoaXMuYm9keTEgPSBib2R5MVxuXHR0aGlzLmJvZHkxID0gYm9keTJcblx0dGhpcy5saW5lID0gbmV3IExpbmUoYm9keTEucG9zaXRpb24sIGJvZHkyLnBvc2l0aW9uKVxuXHR0aGlzLmsgPSBrXG5cdHRoaXMubGVuZ3RoID0gbGVuZ3RoICAgIFxuXHR0aGlzLnRlYXJQb2ludEFtb3VudCA9IHRlYXJQb2ludEFtb3VudFxuXHR0aGlzLnRvcm4gPSBmYWxzZVxuXHR0aGlzLl9ub3JtYWxDb2xvciA9IG5ldyBDb2xvcigxNTAsIDE1MCwgMTUwKVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTE6ICdGcmVlQm9keScsIGJvZHkyOiAnRnJlZUJvZHknLCBrOiAnTnVtYmVyJywgbGVuZ3RoOiAnTnVtYmVyJywgdGVhdFBvaW50QW1vdW50OiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGIxID0gRnJlZUJvZHkuZHVtbXkoeCwgeSlcblx0dmFyIGIyID0gRnJlZUJvZHkuZHVtbXkoeCArIDEwMCwgeSArIDEwMClcblx0dmFyIGQgPSBkaXN0YW5jZShiMS5wMSwgYjIucDIpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nKGIxLCBiMiwgMTAsIGQsICBkICogNSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5jb250YWluc1BvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gdGhpcy5saW5lLmNvbnRhaW5zUG9pbnQoeCwgeSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLmNlbnRlciA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5saW5lLmNlbnRlcigpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5ib3JkZXIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG5ldyBMaW5lKHRoaXMubGluZS5wMSwgdGhpcy5saW5lLnAyLCB1bmRlZmluZWQsIDgpLmJvcmRlcigpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5zb2x1dGlvbkpvaW5zID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7dG9ybjogcmMuc2tldGNocGFkLmxhc3RPbmVXaW5zSm9pblNvbHV0aW9uc31cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgY3R4dCA9IGNhbnZhcy5jdHh0XG5cdHZhciBsaW5lID0gdGhpcy5saW5lXG5cdHZhciBwMSA9IGxpbmUucDEsIHAyID0gbGluZS5wMlxuXHR2YXIgeTEgPSBvcmlnaW4ueSArIHAxLnlcblx0dmFyIHkyID0gb3JpZ2luLnkgKyBwMi55XG5cdHZhciB4MSA9IG9yaWdpbi54ICsgcDEueFxuXHR2YXIgeDIgPSBvcmlnaW4ueCArIHAyLnhcblx0aWYgKCF0aGlzLnRvcm4pIHtcblx0ICAgIHZhciBzdHJldGNoID0gTWF0aC5mbG9vcihNYXRoLnNxcnQoTWF0aC5wb3coeTEgLSB5MiwgMikgKyBNYXRoLnBvdyh4MSAtIHgyLCAyKSkgLSB0aGlzLmxlbmd0aClcblx0ICAgIHZhciBzdHJldGNoUCA9IE1hdGguYWJzKHN0cmV0Y2gpXG5cdCAgICB0aGlzLl9ub3JtYWxDb2xvci5yZWQgPSBNYXRoLm1pbigyNTUsIDE1MCArIHN0cmV0Y2hQKVxuXHQgICAgbGluZS5jb2xvciA9IHRoaXMuX25vcm1hbENvbG9yLmhleFN0cmluZygpXG5cdCAgICBsaW5lLmRyYXcoY2FudmFzLCBvcmlnaW4pXG5cdCAgICBjdHh0LmZpbGxTdHlsZSA9ICdibGFjaydcblx0ICAgIGN0eHQuZmlsbFRleHQoc3RyZXRjaCwgKHgxICsgeDIpIC8gMiwgKHkxICsgeTIpIC8gMilcblx0fVxuICAgIH1cblxuICAgIC8vIFV0aWxpdGllc1xuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uZGV0ZWN0Q29udGFjdCA9IGZ1bmN0aW9uKGhhbGZMZW5ndGgsIHBvc2l0aW9uLCB2ZWxvY2l0eSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpIHtcblx0dmFyIHF1YXJ0ZXJMZW5ndGggPSBoYWxmTGVuZ3RoIC8gMlxuXHR2YXIgcG9zaXRpb25YID0gcG9zaXRpb24ueFxuXHR2YXIgcG9zaXRpb25ZID0gcG9zaXRpb24ueVxuXHR2YXIgc3VyZmFjZVgxID0gc3VyZmFjZVAxLnhcblx0dmFyIHN1cmZhY2VZMSA9IHN1cmZhY2VQMS55XG5cdHZhciBzdXJmYWNlWDIgPSBzdXJmYWNlUDIueFxuXHR2YXIgc3VyZmFjZVkyID0gc3VyZmFjZVAyLnlcblx0dmFyIHNsb3BlID0gKHN1cmZhY2VZMiAtIHN1cmZhY2VZMSkgLyAoc3VyZmFjZVgyIC0gc3VyZmFjZVgxKVxuXHR2YXIgc3VyZmFjZUhpdFBvc1ggPSAoKHBvc2l0aW9uWSAtIHN1cmZhY2VZMSkgLyBzbG9wZSkgKyBzdXJmYWNlWDFcblx0dmFyIHN1cmZhY2VIaXRQb3NZID0gKChwb3NpdGlvblggLSBzdXJmYWNlWDEpICogc2xvcGUpICsgc3VyZmFjZVkxXG5cdHZhciBpc1ZlcnRpY2FsID0gKHBvc2l0aW9uWCA+PSAoc3VyZmFjZVgxIC0gcXVhcnRlckxlbmd0aCkgJiYgcG9zaXRpb25YIDw9IChzdXJmYWNlWDIgKyBxdWFydGVyTGVuZ3RoKSlcblx0dmFyIGlzSG9yaXpvbnRhbCA9IChwb3NpdGlvblkgPj0gKHN1cmZhY2VZMSAtIHF1YXJ0ZXJMZW5ndGgpICYmIHBvc2l0aW9uWSA8PSAoc3VyZmFjZVkyICsgcXVhcnRlckxlbmd0aCkpXG5cdHZhciBpc1VwID0gaXNWZXJ0aWNhbCAmJiBwb3NpdGlvblkgPD0gc3VyZmFjZUhpdFBvc1lcblx0dmFyIGlzRG93biA9IGlzVmVydGljYWwgJiYgcG9zaXRpb25ZID49IHN1cmZhY2VIaXRQb3NZXG5cdHZhciBpc0xlZnQgPSBpc0hvcml6b250YWwgJiYgcG9zaXRpb25YIDw9IHN1cmZhY2VIaXRQb3NYXG5cdHZhciBpc1JpZ2h0ID0gaXNIb3Jpem9udGFsICYmIHBvc2l0aW9uWCA+PSBzdXJmYWNlSGl0UG9zWFxuXHRyZXR1cm4gKCgoaXNVcCAmJiAodmVsb2NpdHkueSA+PSAwKSAmJiAocG9zaXRpb25ZID49IChzdXJmYWNlSGl0UG9zWSAtIGhhbGZMZW5ndGgpKSlcblx0XHQgfHwgKGlzRG93biAmJiAodmVsb2NpdHkueSA8PSAwKSAmJiAocG9zaXRpb25ZIDw9IChzdXJmYWNlSGl0UG9zWSArIGhhbGZMZW5ndGgpKSkpXG5cdFx0fHwgKChpc0xlZnQgJiYgKHZlbG9jaXR5LnggPj0gMCkgJiYgKHBvc2l0aW9uWCA8PSBzdXJmYWNlSGl0UG9zWCkgJiYgKHBvc2l0aW9uWCA+PSAoc3VyZmFjZUhpdFBvc1ggLSBoYWxmTGVuZ3RoKSkpXG5cdFx0ICAgIHx8IChpc1JpZ2h0ICYmICh2ZWxvY2l0eS54IDw9IDApICYmIChwb3NpdGlvblggPj0gc3VyZmFjZUhpdFBvc1gpICYmIChwb3NpdGlvblggPD0gKHN1cmZhY2VIaXRQb3NYICsgaGFsZkxlbmd0aCkpKSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uY29tcHV0ZUNvbnRhY3QgPSBmdW5jdGlvbihoYWxmTGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSB7XG5cdHZhciBxdWFydGVyTGVuZ3RoID0gaGFsZkxlbmd0aCAvIDJcblx0dmFyIHBvc2l0aW9uWCA9IHBvc2l0aW9uLnhcblx0dmFyIHBvc2l0aW9uWSA9IHBvc2l0aW9uLnlcblx0dmFyIHN1cmZhY2VYMSA9IHN1cmZhY2VQMS54XG5cdHZhciBzdXJmYWNlWTEgPSBzdXJmYWNlUDEueVxuXHR2YXIgc3VyZmFjZVgyID0gc3VyZmFjZVAyLnhcblx0dmFyIHN1cmZhY2VZMiA9IHN1cmZhY2VQMi55XG5cdHZhciBzbG9wZSA9IChzdXJmYWNlWTIgLSBzdXJmYWNlWTEpIC8gKHN1cmZhY2VYMiAtIHN1cmZhY2VYMSlcblx0dmFyIHN1cmZhY2VIaXRQb3NYID0gKChwb3NpdGlvblkgLSBzdXJmYWNlWTEpIC8gc2xvcGUpICsgc3VyZmFjZVgxXG5cdHZhciBzdXJmYWNlSGl0UG9zWSA9ICgocG9zaXRpb25YIC0gc3VyZmFjZVgxKSAqIHNsb3BlKSArIHN1cmZhY2VZMVxuXHR2YXIgaXNWZXJ0aWNhbCA9IChwb3NpdGlvblggPj0gKHN1cmZhY2VYMSAtIHF1YXJ0ZXJMZW5ndGgpICYmIHBvc2l0aW9uWCA8PSAoc3VyZmFjZVgyICsgcXVhcnRlckxlbmd0aCkpXG5cdHZhciBpc0hvcml6b250YWwgPSAocG9zaXRpb25ZID49IChzdXJmYWNlWTEgLSBxdWFydGVyTGVuZ3RoKSAmJiBwb3NpdGlvblkgPD0gKHN1cmZhY2VZMiArIHF1YXJ0ZXJMZW5ndGgpKVxuXHR2YXIgaXNVcCA9IGlzVmVydGljYWwgJiYgcG9zaXRpb25ZIDw9IHN1cmZhY2VIaXRQb3NZXG5cdHZhciBpc0Rvd24gPSBpc1ZlcnRpY2FsICYmIHBvc2l0aW9uWSA+PSBzdXJmYWNlSGl0UG9zWVxuXHR2YXIgaXNMZWZ0ID0gaXNIb3Jpem9udGFsICYmIHBvc2l0aW9uWCA8PSBzdXJmYWNlSGl0UG9zWFxuXHR2YXIgaXNSaWdodCA9IGlzSG9yaXpvbnRhbCAmJiBwb3NpdGlvblggPj0gc3VyZmFjZUhpdFBvc1hcblx0dmFyIHZlbG9jaXR5TWFnbml0dWRlID0gbWFnbml0dWRlKHZlbG9jaXR5KVxuXHR2YXIgZGlzdGFuY2UgPSAwXG5cdC8vSEFDSyBGSVhNRVxuXHRpZiAoaXNVcCAmJiAodmVsb2NpdHkueSA+PSAwKSkge1xuXHQgICAgZGlzdGFuY2UgPSBzdXJmYWNlSGl0UG9zWSAtIChwb3NpdGlvblkgKyBoYWxmTGVuZ3RoKVxuXHR9IGVsc2UgaWYgKGlzRG93biAmJiAodmVsb2NpdHkueSA8PSAwKSkge1xuXHQgICAgZGlzdGFuY2UgPSAocG9zaXRpb25ZIC0gaGFsZkxlbmd0aCkgLSBzdXJmYWNlSGl0UG9zWVxuXHR9IGVsc2UgaWYgKGlzTGVmdCAmJiAodmVsb2NpdHkueCA+PSAwKSAmJiAocG9zaXRpb25YIDw9IHN1cmZhY2VIaXRQb3NYKSkge1xuXHQgICAgZGlzdGFuY2UgPSBzdXJmYWNlSGl0UG9zWCAtIChwb3NpdGlvblggKyBoYWxmTGVuZ3RoKVxuXHR9IGVsc2UgaWYgKGlzUmlnaHQgJiYgKHZlbG9jaXR5LnggPD0gMCkgJiYgKHBvc2l0aW9uWCA+PSBzdXJmYWNlSGl0UG9zWCkpIHtcblx0ICAgIGRpc3RhbmNlID0gKHBvc2l0aW9uWCAtIGhhbGZMZW5ndGgpIC0gc3VyZmFjZUhpdFBvc1hcblx0fSBlbHNlIHtcblx0ICAgIHJldHVybiAxMDAwMDAwXG5cdH1cblx0dmFyIHRpbWUgPSBkaXN0YW5jZSAvIHZlbG9jaXR5TWFnbml0dWRlIFxuXHRyZXR1cm4gTWF0aC5tYXgoMCwgdGltZSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZSA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHRyZXR1cm4gKHAxLnkgLSBwMi55KSAvIChwMS54IC0gcDIueClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5hbmdsZSA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHRyZXR1cm4gTWF0aC5hdGFuMihwMS55IC0gcDIueSwgcDIueCAtIHAxLngpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3JXcm9uZyA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHR2YXIgc2xvcGUgPSB0aGlzLnNsb3BlKHAxLCBwMiksIGF0biA9IE1hdGguYXRhbihzbG9wZSlcblx0dmFyIHNpZ24gPSBwMS54IDwgcDIueCA/IC0xIDogMVxuXHRyZXR1cm4gbm9ybWFsaXplZCh7eDogc2lnbiAqIE1hdGguc2luKGF0biksIHk6IHNpZ24gKiBNYXRoLmNvcyhhdG4pfSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3IgPSBmdW5jdGlvbihwMSwgcDIpIHtcblx0dmFyIHNsb3BlID0gdGhpcy5zbG9wZShwMSwgcDIpLCBhdG4gPSBNYXRoLmF0YW4oc2xvcGUpXG5cdHZhciBzaWduWCA9IHAxLnggPCBwMi54ID8gMSA6IC0xXG5cdHZhciBzaWduWSA9IHAxLnkgPCBwMi55ID8gMSA6IC0xXG5cdHJldHVybiBub3JtYWxpemVkKHt4OiBzaWduWCAqIE1hdGguY29zKGF0biksIHk6IHNpZ25YICogTWF0aC5zaW4oYXRuKX0pXG4gICAgfVxuXG4gICAgLy8gVGltZXIgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19UaW1lckNvbnN0cmFpbnQodGltZXIpIHtcblx0dGhpcy50aW1lciA9IHRpbWVyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuIFwiU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXIoVGltZXIgVCkgc3RhdGVzIHRoZSBzeXN0ZW0gYWR2YW5jZXMgaXRzIHBzZXVkby10aW1lIGJ5IFQncyBzdGVwIHNpemUgYXQgZWFjaCBmcmFtZSBjeWNsZS5cIiB9XG5cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHt0aW1lcjogJ1RpbWVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQoU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXIuZHVtbXkoeCwgeSkpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUucHJvcG9zZU5leHRQc2V1ZG9UaW1lID0gZnVuY3Rpb24ocHNldWRvVGltZSkge1xuXHRyZXR1cm4gcHNldWRvVGltZSArIHRoaXMudGltZXIuc3RlcFNpemVcbiAgICB9ICAgIFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gMFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge31cbiAgICB9XG5cbiAgICAvLyBWYWx1ZVNsaWRlckNvbnN0cmFpbnQgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19WYWx1ZVNsaWRlckNvbnN0cmFpbnQoc2xpZGVyUG9pbnQsIHhPclksIHNsaWRlclplcm9WYWx1ZSwgc2xpZGVyUmFuZ2VMZW5ndGgsIHNsaWRlZE9iaiwgc2xpZGVkUHJvcCkge1xuXHR0aGlzLnNsaWRlclBvaW50ID0gc2xpZGVyUG9pbnRcblx0dGhpcy54T3JZID0geE9yWVxuXHR0aGlzLnNsaWRlclplcm9WYWx1ZSA9IHNsaWRlclplcm9WYWx1ZVxuXHR0aGlzLnNsaWRlclJhbmdlTGVuZ3RoID0gc2xpZGVyUmFuZ2VMZW5ndGhcblx0dGhpcy5zbGlkZWRPYmogPSBzbGlkZWRPYmpcblx0dGhpcy5zbGlkZWRQcm9wID0gc2xpZGVkUHJvcFxuXHR0aGlzLnNsaWRlZE9ialByb3BaZXJvVmFsdWUgPSBzbGlkZWRPYmpbc2xpZGVkUHJvcF1cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3NsaWRlclBvaW50OiAnUG9pbnQnLCB4T3JZOiAnU3RyaW5nJywgc2xpZGVyWmVyb1ZhbHVlOiAnTnVtYmVyJywgc2xpZGVyUmFuZ2VMZW5ndGg6ICdOdW1iZXInLCBzbGlkZWRPYmpQcm9wWmVyb1ZhbHVlOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQoUG9pbnQuZHVtbXkoeCwgeSksICd4JywgMCwgMTAwLCB7Zm9vOiAwfSwgJ2ZvbycpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc2xpZGVkUHJvcCA9IHRoaXMuc2xpZGVkUHJvcFxuXHR2YXIgY3VyclNsaWRlckRpZmYgPSAodGhpcy5zbGlkZXJaZXJvVmFsdWUgLSB0aGlzLnNsaWRlclBvaW50W3RoaXMueE9yWV0pIC8gdGhpcy5zbGlkZXJSYW5nZUxlbmd0aFxuXHR2YXIgc2xpZGVkT2JqUHJvcFRhcmdldCA9ICgxICsgY3VyclNsaWRlckRpZmYpICogdGhpcy5zbGlkZWRPYmpQcm9wWmVyb1ZhbHVlXG5cdHJldHVybiBzbGlkZWRPYmpQcm9wVGFyZ2V0IC0gdGhpcy5zbGlkZWRPYmpbc2xpZGVkUHJvcF1cblxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc29sbiA9IHt9XG5cdHZhciBzbGlkZWRQcm9wID0gdGhpcy5zbGlkZWRQcm9wXG5cdHZhciBjdXJyU2xpZGVyRGlmZiA9ICh0aGlzLnNsaWRlclplcm9WYWx1ZSAtIHRoaXMuc2xpZGVyUG9pbnRbdGhpcy54T3JZXSkgLyB0aGlzLnNsaWRlclJhbmdlTGVuZ3RoXG5cdHZhciBzbGlkZWRPYmpQcm9wVGFyZ2V0ID0gKDEgKyBjdXJyU2xpZGVyRGlmZikgKiB0aGlzLnNsaWRlZE9ialByb3BaZXJvVmFsdWVcblx0c29sbltzbGlkZWRQcm9wXSA9IHNsaWRlZE9ialByb3BUYXJnZXRcblx0dGhpcy5zbGlkZXJQb2ludC5zZWxlY3Rpb25JbmRpY2VzWzBdID0gTWF0aC5mbG9vcigxMDAgKiBjdXJyU2xpZGVyRGlmZilcblx0cmV0dXJuIHtzbGlkZWRPYmo6IHNvbG59XG4gICAgfVxuXG4gICAgLy8gTW90aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fVmVsb2NpdHlDb25zdHJhaW50KGJvZHkpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLnBvc2l0aW9uID0gYm9keS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQoRnJlZUJvZHkgQm9keSkgc3RhdGVzIGZvciBCb2R5OiBQb3MgPSBvbGQoUG9zKSArIFZlbG9jaXR5ICogKHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZSkgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludChGcmVlQm9keS5kdW1teSh4LCB5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dGhpcy5sYXN0UG9zaXRpb24gPSBzY2FsZWRCeSh0aGlzLnBvc2l0aW9uLCAxKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHtwb3NpdGlvbjogcGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eSwgZHQpKX1cbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0dmFyIGN0eHQgPSBjYW52YXMuY3R4dFxuXHR2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3IodGhpcy5wb3NpdGlvbiwgdGhpcy52ZWxvY2l0eSlcdFxuXHR2YXIgbGVuID0gNTBcblx0dmFyIHAgPSBwbHVzKHRoaXMucG9zaXRpb24sIHt4OiBzbG9wZVYueCAqIGxlbiwgeTogc2xvcGVWLnkgKiBsZW59KVxuXHRjYW52YXMuZHJhd0Fycm93KHRoaXMucG9zaXRpb24sIHAsIG9yaWdpbiwgJ3YnKVxuICAgIH1cbiAgICBcbiAgICAvLyBCb2R5IFdpdGggVmVsb2NpdHkgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50MiA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fVmVsb2NpdHlDb25zdHJhaW50Mihib2R5LCB2ZWxvY2l0eSkge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMucG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIoRnJlZUJvZHkgQm9keSwgUG9pbnRWZWN0b3IgVmVsb2NpdHkpIHN0YXRlcyBmb3IgQm9keTogUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIHZlbG9jaXR5OiAnUG9pbnRWZWN0b3InfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyKEZyZWVCb2R5LmR1bW15KHgsIHkpLCBQb2ludFZlY3Rvci5kdW1teSh4LCB5KSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5Lm1hZ25pdHVkZSgpLCBkdCkpLCB0aGlzLnBvc2l0aW9uKSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHtwb3NpdGlvbjogcGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eS5tYWduaXR1ZGUoKSwgZHQpKX1cbiAgICB9XG4gICAgXG4gICAgLy8gQWNjZWxlcmF0aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0FjY2VsZXJhdGlvbkNvbnN0cmFpbnQoYm9keSwgYWNjZWxlcmF0aW9uKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb25cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50KEZyZWVCb2R5IEJvZHksIFZlY3RvciBBY2NlbGVyYXRpb24pIHN0YXRlcyBmb3IgQm9keTogVmVsb2NpdHkgPSBvbGQoVmVsb2NpdHkpICsgQWNjZWxlcmF0aW9uICogKHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZSkgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5JywgYWNjZWxlcmF0aW9uOiAnVmVjdG9yJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludChGcmVlQm9keS5kdW1teSh4LCB5KSwgU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHggKyA1MCwgeSArIDUwKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0VmVsb2NpdHkgPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCAxKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0VmVsb2NpdHksIHNjYWxlZEJ5KHRoaXMuYWNjZWxlcmF0aW9uLCBkdCkpLCB0aGlzLnZlbG9jaXR5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3ZlbG9jaXR5OiBwbHVzKHRoaXMubGFzdFZlbG9jaXR5LCBzY2FsZWRCeSh0aGlzLmFjY2VsZXJhdGlvbiwgZHQpKX1cbiAgICB9XG5cbiAgICAvLyBBaXIgUmVzaXN0YW5jZSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQoYm9keSwgc2NhbGUpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLnZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuXHR0aGlzLnNjYWxlID0gLXNjYWxlXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludChGcmVlQm9keSBCb2R5KSBzdGF0ZXMgZm9yIEJvZHk6IFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSAqIFNjYWxlIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzY2FsZTogJ051bWJlcicsIHZlbG9jaXR5OiAnVmVjdG9yJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50KFNrZXRjaHBhZC5nZW9tLlZlY3Rvci5kdW1teSh4LCB5KSwgLjEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RWZWxvY2l0eSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMoc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpLCB0aGlzLnZlbG9jaXR5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge3ZlbG9jaXR5OiBzY2FsZWRCeSh0aGlzLmxhc3RWZWxvY2l0eSwgdGhpcy5zY2FsZSl9XG4gICAgfVxuXG4gICAgLy8gIEJvdW5jZSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19Cb3VuY2VDb25zdHJhaW50KGJvZHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5oYWxmTGVuZ3RoID0gYm9keS5yYWRpdXNcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5zdXJmYWNlUDEgPSBzdXJmYWNlUDFcblx0dGhpcy5zdXJmYWNlUDIgPSBzdXJmYWNlUDJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50KEZyZWVCb2R5IEJvZHksIFBvaW50IEVuZDEsIFBvaW50IEVuZDIpIHN0YXRlcyB0aGF0IHRoZSBCb2R5IHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGJvdW5jZSBvZmYgdGhlIGxpbmUgd2l0aCB0d28gZW5kIHBvaW50cyBFbmQxICYgRW5kMi5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIHN1cmZhY2VQMTogJ1BvaW50Jywgc3VyZmFjZVAyOiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBQb2ludC5kdW1teSh4LCB5KSwgUG9pbnQuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcG9zZU5leHRQc2V1ZG9UaW1lID0gZnVuY3Rpb24ocHNldWRvVGltZSkge1xuXHR2YXIgcmVzID0gcHNldWRvVGltZSArIFNrZXRjaHBhZC5zaW11bGF0aW9uLmNvbXB1dGVDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgdGhpcy5wb3NpdGlvbiwgdGhpcy52ZWxvY2l0eSwgdGhpcy5zdXJmYWNlUDEsIHRoaXMuc3VyZmFjZVAyKVxuXHR0aGlzLnRjb250YWN0ID0gcmVzO1xuXHRyZXR1cm4gcmVzXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uXG5cdHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHlcblx0dmFyIHN1cmZhY2VQMSA9IHRoaXMuc3VyZmFjZVAxXG5cdHZhciBzdXJmYWNlUDIgPSB0aGlzLnN1cmZhY2VQMlxuICAgICAgICAvL1NrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSkge1xuXHRpZiAodGhpcy50Y29udGFjdCA9PSBwc2V1ZG9UaW1lKSB7IFxuXHQgICAgdGhpcy50Y29udGFjdCA9IHVuZGVmaW5lZFxuXHQgICAgdmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdCAgICB2YXIgc2xvcGUgPSAoc3VyZmFjZVAyLnkgLSBzdXJmYWNlUDEueSkgLyAoc3VyZmFjZVAyLnggLSBzdXJmYWNlUDEueClcblx0ICAgIHZhciBzdXJmYWNlSGl0UG9zWCA9IHN1cmZhY2VQMi55ID09IHN1cmZhY2VQMS55ID8gcG9zaXRpb24ueCA6ICgocG9zaXRpb24ueSAtIHN1cmZhY2VQMS55KSAvIHNsb3BlKSArIHN1cmZhY2VQMS54XG5cdCAgICB2YXIgc3VyZmFjZUhpdFBvc1kgPSBzdXJmYWNlUDIueCA9PSBzdXJmYWNlUDEueCA/IHBvc2l0aW9uLnkgOiAoKHBvc2l0aW9uLnggLSBzdXJmYWNlUDEueCkgKiBzbG9wZSkgKyBzdXJmYWNlUDEueVxuXHQgICAgdmFyIHN1cmZhY2VBbmdsZSA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLmFuZ2xlKHN1cmZhY2VQMSwgc3VyZmFjZVAyKVxuXHQgICAgdmFyIHZlbG9jaXR5QW5nbGUgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5hbmdsZSh7eDogMCwgeTogMH0sIHZlbG9jaXR5KVxuXHQgICAgdmFyIHJlZmxlY3Rpb25BbmdsZSA9IHN1cmZhY2VBbmdsZSAtIHZlbG9jaXR5QW5nbGUgXG5cdCAgICB2YXIgdmVsb2NpdHlNYWduaXR1ZGUgPSBNYXRoLnNxcnQoKHZlbG9jaXR5LnggKiB2ZWxvY2l0eS54KSArICh2ZWxvY2l0eS55ICogdmVsb2NpdHkueSkpXG5cdCAgICB2YXIgYW5nbGVDID0gTWF0aC5jb3MocmVmbGVjdGlvbkFuZ2xlKVxuXHQgICAgdmFyIGFuZ2xlUyA9IE1hdGguc2luKHJlZmxlY3Rpb25BbmdsZSlcblx0ICAgIHZhciB4ID0gYW5nbGVDICogdmVsb2NpdHlNYWduaXR1ZGUgKiAxXG5cdCAgICB2YXIgeSA9IGFuZ2xlUyAqIHZlbG9jaXR5TWFnbml0dWRlICogLTFcblx0ICAgIHRoaXMuYm91bmNlVmVsb2NpdHkgPSBzY2FsZWRCeSh7eDogeCwgeTogeX0sIDEpXG5cdCAgICB2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3JXcm9uZyhzdXJmYWNlUDEsIHN1cmZhY2VQMilcblx0ICAgIHZhciBkZWx0YVBvc1ggPSBzbG9wZVYueCAqIHZlbG9jaXR5TWFnbml0dWRlICogZHRcblx0ICAgIHZhciBkZWx0YVBvc1kgPSBzbG9wZVYueSAqIC12ZWxvY2l0eU1hZ25pdHVkZSAqIGR0XG5cdCAgICB0aGlzLmJvdW5jZVBvc2l0aW9uID0ge3g6IHBvc2l0aW9uLnggKyBkZWx0YVBvc1gsIHk6IHBvc2l0aW9uLnkgKyBkZWx0YVBvc1l9XG5cblx0ICAgIC8vIEhBQ0sgRklYTUU/IHNldCB2ZWxvY2l0eSBhdG9taWNhbGx5IHJpZ2h0IGhlcmUhIVxuXHQgICAgLy90aGlzLmNvbnRhY3QgPSB0cnVlXG5cdCAgICB2ZWxvY2l0eS54ID0gdGhpcy5ib3VuY2VWZWxvY2l0eS54XG5cdCAgICB2ZWxvY2l0eS55ID0gdGhpcy5ib3VuY2VWZWxvY2l0eS55XG5cdCAgICBwb3NpdGlvbi54ID0gdGhpcy5ib3VuY2VQb3NpdGlvbi54XG5cdCAgICBwb3NpdGlvbi55ID0gdGhpcy5ib3VuY2VQb3NpdGlvbi55XG5cblx0fSBlbHNlXG5cdCAgICB0aGlzLmNvbnRhY3QgPSBmYWxzZVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdC8qXG5cdCAgdmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eVxuXHQgIHZhciBzdXJmYWNlUDEgPSB0aGlzLnN1cmZhY2VQMVxuXHQgIHZhciBzdXJmYWNlUDIgPSB0aGlzLnN1cmZhY2VQMlxuXHQgIHJldHVybiB0aGlzLmNvbnRhY3QgPyAoXG5cdCAgbWFnbml0dWRlKG1pbnVzKHRoaXMuYm91bmNlVmVsb2NpdHksIHRoaXMudmVsb2NpdHkpKSBcblx0ICArIG1hZ25pdHVkZShtaW51cyh0aGlzLmJvdW5jZVBvc2l0aW9uLCB0aGlzLnBvc2l0aW9uKSkgXG5cdCAgKSA6IDBcblx0Ki9cblx0cmV0dXJuIDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdC8qXG5cdCAgdmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdCAgcmV0dXJuIHt2ZWxvY2l0eTogXG5cdCAgbWludXMocGx1cyh0aGlzLmJvdW5jZVZlbG9jaXR5LCBzY2FsZWRCeSh7eDogMCwgeTogLVNrZXRjaHBhZC5zaW11bGF0aW9uLmd9LCBkdCkpLCB0aGlzLnZlbG9jaXR5KSxcblx0ICBwb3NpdGlvbjogKG1pbnVzKHRoaXMuYm91bmNlUG9zaXRpb24sIHRoaXMucG9zaXRpb24pKVxuXHQgIH1cblx0Ki9cblx0cmV0dXJuIHt9XG4gICAgfVxuXG4gICAgLy8gIEhpdFN1cmZhY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0hpdFN1cmZhY2VDb25zdHJhaW50KGJvZHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5oYWxmTGVuZ3RoID0gYm9keS5yYWRpdXMgLyAyXG5cdHRoaXMucG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG5cdHRoaXMuc3VyZmFjZVAxID0gc3VyZmFjZVAxXG5cdHRoaXMuc3VyZmFjZVAyID0gc3VyZmFjZVAyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludChGcmVlQm9keSBCb2R5LCBQb2ludCBFbmQxLCBQb2ludCBFbmQyKSBzdGF0ZXMgdGhhdCB0aGUgQm9keSB3aXRoIGRpYW1ldGVyIEwgYW5kIHBvc2l0aW9uIFBvcyBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbCBpcyBnb2luZyB0byBsYW5kIGFuZCBzdGF5IG9uIHRoZSBsaW5lIHdpdGggdHdvIGVuZCBwb2ludHMgRW5kMSAmIEVuZDIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5Jywgc3VyZmFjZVAxOiAnUG9pbnQnLCBzdXJmYWNlUDI6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludChGcmVlQm9keS5kdW1teSh4LCB5KSwgUG9pbnQuZHVtbXkoeCwgeSksIFBvaW50LmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb25cblx0dmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eVxuXHR2YXIgc3VyZmFjZVAxID0gdGhpcy5zdXJmYWNlUDFcblx0dmFyIHN1cmZhY2VQMiA9IHRoaXMuc3VyZmFjZVAyXG5cdGlmIChTa2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikpIHtcblx0ICAgIHRoaXMuY29udGFjdCA9IHRydWVcblx0ICAgIHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHQgICAgdmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yV3Jvbmcoc3VyZmFjZVAxLCBzdXJmYWNlUDIpXG5cdCAgICB0aGlzLmhpdFZlbG9jaXR5ID0gc2NhbGVkQnkoe3g6IDAsIHk6IC1Ta2V0Y2hwYWQuc2ltdWxhdGlvbi5nfSwgZHQpXG5cdCAgICB2YXIgdmVsb2NpdHlNYWduaXR1ZGUgPSBNYXRoLnNxcnQoKHZlbG9jaXR5LnggKiB2ZWxvY2l0eS54KSArICh2ZWxvY2l0eS55ICogdmVsb2NpdHkueSkpXG5cdCAgICBkZWx0YVBvc1ggPSBzbG9wZVYueCAqIHZlbG9jaXR5TWFnbml0dWRlICogZHRcblx0ICAgIGRlbHRhUG9zWSA9IHNsb3BlVi55ICogdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgdGhpcy5oaXRQb3NpdGlvbiA9IHt4OiBwb3NpdGlvbi54ICsgZGVsdGFQb3NYLCB5OiBwb3NpdGlvbi55ICsgZGVsdGFQb3NZfVxuXHR9IGVsc2Vcblx0ICAgIHRoaXMuY29udGFjdCA9IGZhbHNlXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy5jb250YWN0ID8gKFxuXHQgICAgbWFnbml0dWRlKG1pbnVzKHRoaXMuaGl0VmVsb2NpdHksIHRoaXMudmVsb2NpdHkpKSArIFxuXHRcdG1hZ25pdHVkZShtaW51cyh0aGlzLmhpdFBvc2l0aW9uLCB0aGlzLnBvc2l0aW9uKSkgXG5cdCkgOiAwXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogdGhpcy5oaXRWZWxvY2l0eSwgcG9zaXRpb246IHRoaXMuaGl0UG9zaXRpb259XG4gICAgfVxuXG4gICAgLy8gQ29udmV5b3IgQmVsdCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19Db252ZXlvckJlbHRDb25zdHJhaW50KGJvZHksIGJlbHQpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLmhhbGZMZW5ndGggPSBib2R5LnJhZGl1c1xuXHR0aGlzLnBvc2l0aW9uID0gYm9keS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuXHR0aGlzLmJlbHQgPSBiZWx0XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludChOdW1iZXIgTCwgRnJlZUJvZHkgQm9keSwgQ29udmV5b3JCZWx0IEJlbHQpIHN0YXRlcyB0aGF0IHRoZSBib2R5IHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIG1vdmUgYmFzZWQgb24gdGhlIGNvbnZleW9yIGJlbHQgQmVsdCdzIHZlbG9jaXR5LlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5JywgYmVsdDogJ0JlbHQnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBCZWx0LmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eVxuXHR2YXIgYmVsdCA9IHRoaXMuYmVsdFxuXHR2YXIgYmVsdFAxID0gYmVsdC5wb3NpdGlvbjFcblx0dmFyIGJlbHRQMiA9IGJlbHQucG9zaXRpb24yXG5cdHZhciBiZWx0U3BlZWQgPSBiZWx0LnNwZWVkXG5cdGlmIChTa2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgdGhpcy5wb3NpdGlvbiwgdmVsb2NpdHksIGJlbHRQMSwgYmVsdFAyKSkge1xuXHQgICAgdGhpcy5jb250YWN0ID0gdHJ1ZVxuXHQgICAgdmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yV3JvbmcoYmVsdFAxLCBiZWx0UDIpXG5cdCAgICB0aGlzLnRhcmdldFZlbG9jaXR5ID0ge3g6IHZlbG9jaXR5LnggKyAoc2xvcGVWLnkgKiBiZWx0U3BlZWQpLCB5OiB2ZWxvY2l0eS55ICsgKHNsb3BlVi54ICogYmVsdFNwZWVkKX1cblx0fSBlbHNlXG5cdCAgICB0aGlzLmNvbnRhY3QgPSBmYWxzZVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgYmVsdCA9IHRoaXMuYmVsdFxuXHR2YXIgYmVsdFAxID0gYmVsdC5wb3NpdGlvbjFcblx0dmFyIGJlbHRQMiA9IGJlbHQucG9zaXRpb24yXG5cdHJldHVybiAoU2tldGNocGFkLnNpbXVsYXRpb24uZGV0ZWN0Q29udGFjdCh0aGlzLmhhbGZMZW5ndGgsIHRoaXMucG9zaXRpb24sIHRoaXMudmVsb2NpdHksIGJlbHRQMSwgYmVsdFAyKSkgPyAxIDogMFx0XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHRoaXMuY29udGFjdCA/IG1hZ25pdHVkZShtaW51cyh0aGlzLnRhcmdldFZlbG9jaXR5LCB0aGlzLnZlbG9jaXR5KSkgOiAwXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge3ZlbG9jaXR5OiB0aGlzLnRhcmdldFZlbG9jaXR5fVxuICAgIH1cblxuICAgIC8vIE5vT3ZlcmxhcCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19Ob092ZXJsYXBDb25zdHJhaW50KGJvZHkxLCBib2R5Mikge1xuXHR0aGlzLmJvZHkxID0gYm9keTFcblx0dGhpcy5sZW5ndGgxID0gYm9keTEucmFkaXVzIC8gMlxuXHR0aGlzLnBvc2l0aW9uMSA9IGJvZHkxLnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkxID0gYm9keTEudmVsb2NpdHlcblx0dGhpcy5ib2R5MiA9IGJvZHkyXG5cdHRoaXMubGVuZ3RoMiA9IGJvZHkyLnJhZGl1cyAvIDJcblx0dGhpcy5wb3NpdGlvbjIgPSBib2R5Mi5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5MiA9IGJvZHkyLnZlbG9jaXR5XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludChGcmVlQm9keSBCb2R5MSwgRnJlZUJvZHkgQm9keTEpIHN0YXRlcyB0aGF0IHRoZSBCb2R5MSB3aXRoIGRpYW1ldGVyIEwxIGFuZCBwb3NpdGlvbiBQb3MxIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsMSBhbmQgdGhlIEJvZHkyIHdpdGggZGlhbWV0ZXIgTDIgYW5kIHBvc2l0aW9uIFBvczIgYW5kIHZlbG9jaXR5IHZlY3RvciBWZWwyIHdpbGwgcHVzaCBlYWNoIG90aGVyIGlmIHRvdWNoaW5nLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTE6ICdGcmVlQm9keScsIGJvZHkyOiAnRnJlZUJvZHknfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBGcmVlQm9keS5kdW1teSh4ICsxMDAsIHkgKyAxMDApKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsZW5ndGgxID0gdGhpcy5sZW5ndGgxXG5cdHZhciBwb3NpdGlvbjEgPSB0aGlzLnBvc2l0aW9uMVxuXHR2YXIgdmVsb2NpdHkxID0gdGhpcy52ZWxvY2l0eTFcblx0dmFyIGxlbmd0aDIgPSB0aGlzLmxlbmd0aDJcblx0dmFyIHBvc2l0aW9uMiA9IHRoaXMucG9zaXRpb24yXG5cdHZhciBwMXggPSBwb3NpdGlvbjEueCwgcDF5ID0gcG9zaXRpb24xLnlcblx0dmFyIHAyeCA9IHBvc2l0aW9uMi54LCBwMnkgPSBwb3NpdGlvbjIueVxuXHRyZXR1cm4gKChwMXggPiBwMnggLSBsZW5ndGgyIC8gMiAmJiBwMXggPCBwMnggKyBsZW5ndGgyKSAmJlxuXHRcdChwMXkgPiBwMnkgLSBsZW5ndGgyIC8gMiAmJiBwMXkgPCBwMnkgKyBsZW5ndGgyKSkgPyAxIDogMFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGxlbmd0aDEgPSB0aGlzLmxlbmd0aDFcblx0dmFyIHBvc2l0aW9uMSA9IHRoaXMucG9zaXRpb24xXG5cdHZhciB2ZWxvY2l0eTEgPSB0aGlzLnZlbG9jaXR5MVxuXHR2YXIgbGVuZ3RoMiA9IHRoaXMubGVuZ3RoMlxuXHR2YXIgcG9zaXRpb24yID0gdGhpcy5wb3NpdGlvbjJcblx0dmFyIHAxeCA9IHBvc2l0aW9uMS54XG5cdHZhciBwMnggPSBwb3NpdGlvbjIueFxuXHR2YXIgc29sbiA9IHAxeCA+IHAyeCA/IHtwb3NpdGlvbjI6IHt4OiBwMXggLSAobGVuZ3RoMil9fSA6IHtwb3NpdGlvbjE6IHt4OiBwMnggLSAobGVuZ3RoMSl9fVxuXHRyZXR1cm4gc29sblxuICAgIH1cblxuICAgIC8vICBTcHJpbmcgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fU3ByaW5nQ29uc3RyYWludChib2R5MSwgYm9keTIsIHNwcmluZykge1xuXHR0aGlzLmJvZHkxID0gYm9keTFcblx0dGhpcy5ib2R5MiA9IGJvZHkyXG5cdHRoaXMucG9zaXRpb24xID0gYm9keTEucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eTEgPSBib2R5MS52ZWxvY2l0eVxuXHR0aGlzLmFjY2VsZXJhdGlvbjEgPSBib2R5MS5hY2NlbGVyYXRpb25cblx0dGhpcy5tYXNzMSA9IGJvZHkxLm1hc3Ncblx0dGhpcy5wb3NpdGlvbjIgPSBib2R5Mi5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5MiA9IGJvZHkyLnZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uMiA9IGJvZHkyLmFjY2VsZXJhdGlvblxuXHR0aGlzLm1hc3MyID0gYm9keTIubWFzc1xuXHR0aGlzLnNwcmluZyA9IHNwcmluZ1xuXHR0aGlzLl9sYXN0VmVsb2NpdGllcyA9IFt1bmRlZmluZWQsIHVuZGVmaW5lZF1cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50KEZyZWVCb2R5IEJvZHkxLCBGcmVlQm9keSBCb2R5MiwgU3ByaW5nIFMpIHN0YXRlcyB0aGF0IHNwcmluZyBTIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHR3byBib2RpZXMgQm9keTEgYW5kIEJvZHkyLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTE6ICdGcmVlQm9keScsIGJvZHkyOiAnRnJlZUJvZHknLCBzcHJpbmc6ICdTcHJpbmcnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBGcmVlQm9keS5kdW1teSh4KzEwMCwgeSsxMDApLCBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNwcmluZyA9IHRoaXMuc3ByaW5nXG5cdGlmIChzcHJpbmcudG9ybikge1xuXHQgICAgcmV0dXJuIDBcblx0fVxuXHR2YXIgcG9zaXRpb25zID0gW3RoaXMucG9zaXRpb24xLCB0aGlzLnBvc2l0aW9uMl1cblx0dmFyIG1hc3NlcyA9IFt0aGlzLm1hc3MxLCB0aGlzLm1hc3MyXVxuXHR2YXIgdmVsb2NpdGllcyA9IFt0aGlzLnZlbG9jaXR5MSwgdGhpcy52ZWxvY2l0eTJdXG5cdHZhciBhY2NlbGVyYXRpb25zID0gW3RoaXMuYWNjZWxlcmF0aW9uMSwgdGhpcy5hY2NlbGVyYXRpb24yXVxuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0dmFyIGVyciA9IDBcblx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gMTsgaSsrKSB7XG5cdCAgICB2YXIgaiA9IChpICsgMSkgJSAyXG5cdCAgICB2YXIgbWFzcyA9IG1hc3Nlc1tqXVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFxuXHRcdHZhciBjdXJyQWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3RvcilcdFx0XG5cdFx0dmFyIHN0cmV0Y2hMZW4gPSAgc3ByaW5nQ3VyckxlbiAtIHNwcmluZy5sZW5ndGhcblx0XHR2YXIgbmV3QWNjZWxlcmF0aW9uTWFnID0gc3ByaW5nLmsgKiBzdHJldGNoTGVuIC8gbWFzc1xuXHRcdHZhciBhY2MgPSBzY2FsZWRCeShub3JtYWxpemVkKHZlY3RvciksIC1uZXdBY2NlbGVyYXRpb25NYWcpXG5cdFx0ZXJyICs9IG1hZ25pdHVkZShtaW51cyhhY2MsIGN1cnJBY2NlbGVyYXRpb24pKVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiBlcnJcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzb2xuID0ge31cblx0dmFyIHNwcmluZyA9IHRoaXMuc3ByaW5nXG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdGZvciAodmFyIGkgPSAwOyBpIDw9IDE7IGkrKykge1xuXHQgICAgdmFyIGogPSAoaSArIDEpICUgMlxuXHQgICAgdmFyIG1hc3MgPSBtYXNzZXNbal1cblx0ICAgIHZhciBhY2MsIHRvcm4gPSBmYWxzZVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3Rvcilcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdC8vIGlmIG5vdCB0b3JuIGFwYXJ0Li4uXG5cdFx0dG9ybiA9IHN0cmV0Y2hMZW4gPiBzcHJpbmcudGVhclBvaW50QW1vdW50XG5cdFx0aWYgKCF0b3JuKSB7XG5cdFx0ICAgIHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0ICAgIGFjYyA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQodmVjdG9yKSwgLW5ld0FjY2VsZXJhdGlvbk1hZylcblx0XHR9IFxuXHQgICAgfVxuXHQgICAgaWYgKHRvcm4pXG5cdFx0c29sblsnc3ByaW5nJ10gPSB7dG9ybjogdHJ1ZX1cblx0ICAgIGlmIChhY2MpXG5cdFx0c29sblsnYWNjZWxlcmF0aW9uJyArIChqKzEpXSA9IGFjY1xuXHR9XHRcblx0cmV0dXJuIHNvbG5cbiAgICB9XG5cbiAgICAvLyAgT3JiaXRhbE1vdGlvbiBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQoc3VuLCBtb29uLCBkaXN0YW5jZURvd25zY2FsZSkge1xuXHR0aGlzLnN1biA9IHN1blxuXHR0aGlzLm1vb24gPSBtb29uXG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gbW9vbi5hY2NlbGVyYXRpb25cblx0dGhpcy5kaXN0YW5jZURvd25zY2FsZSA9IChkaXN0YW5jZURvd25zY2FsZSB8fCAoMWU5IC8gMikpXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uQ29uc3RyYWludChGcmVlQm9keSBTdW4sIEZyZWVCb2R5IE1vb24pIHN0YXRlcyB0aGF0IE1vb24gYm9keSBpcyBvcmJpdGluZyBhcm91bmQgU3VuIGJvZHkgYWNjb3JkaW5nIHRvIHNpbXBsZSBvcmJpdGFsIG1vdGlvbiBmb3JtdWxhLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3N1bjogJ0ZyZWVCb2R5JywgbW9vbjogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBGcmVlQm9keS5kdW1teSh4ICsgMjAwLCB5KSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmN1cnJlbnRHcmF2aXR5QWNjZWxlcmF0aW9uID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwMSA9IHRoaXMubW9vbi5wb3NpdGlvbiwgcDIgPSB0aGlzLnN1bi5wb3NpdGlvblxuXHR2YXIgZGlzdDAgPSBkaXN0YW5jZShwMSwgcDIpXG5cdHZhciBkaXN0ID0gZGlzdDAgKiB0aGlzLmRpc3RhbmNlRG93bnNjYWxlXHRcblx0dmFyIGFNYWcwID0gKFNrZXRjaHBhZC5zaW11bGF0aW9uLkcgKiB0aGlzLnN1bi5tYXNzKSAvIChkaXN0ICogZGlzdClcblx0dmFyIGFNYWcgPSBhTWFnMCAvIHRoaXMuZGlzdGFuY2VEb3duc2NhbGVcblx0dmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKHAxLCBwMilcblx0cmV0dXJuIHt4OiBzbG9wZVYueCAqIGFNYWcsIHk6IHNsb3BlVi55ICogYU1hZ31cbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHRoaXMuX3RhcmdldEFjY2VsZXJhdGlvbiA9IHRoaXMuY3VycmVudEdyYXZpdHlBY2NlbGVyYXRpb24oKVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMuX3RhcmdldEFjY2VsZXJhdGlvbiwgdGhpcy5hY2NlbGVyYXRpb24pKVx0XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHthY2NlbGVyYXRpb246IHRoaXMuX3RhcmdldEFjY2VsZXJhdGlvbn1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsM0RHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGdlb21ldHJpYyBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gICAgLy8gb2JqZWN0cyB0aGF0IGhhdmUgeCBhbmQgeSBwcm9wZXJ0aWVzLiBPdGhlciBwcm9wZXJ0aWVzIGFyZSBpZ25vcmVkLlxuXG4gICAgU2tldGNocGFkLmdlb20zZCA9IHt9XG5cbiAgICB2YXIgc3F1YXJlID0gU2tldGNocGFkLmdlb20uc3F1YXJlXG5cbiAgICBmdW5jdGlvbiBwbHVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggKyBwMi54LCB5OiBwMS55ICsgcDIueSwgejogcDEueiArIHAyLnp9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIG1pbnVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggLSBwMi54LCB5OiBwMS55IC0gcDIueSwgejogcDEueiAtIHAyLnp9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbGVkQnkocCwgbSkge1xuXHRyZXR1cm4ge3g6IHAueCAqIG0sIHk6IHAueSAqIG0sIHo6IHAueiAqIG19XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29weShwKSB7XG5cdHJldHVybiBzY2FsZWRCeShwLCAxKVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBtaWRwb2ludChwMSwgcDIpIHtcblx0cmV0dXJuIHNjYWxlZEJ5KHBsdXMocDEsIHAyKSwgMC41KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hZ25pdHVkZShwKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAueCkgKyBzcXVhcmUocC55KSArIHNxdWFyZShwLnopKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZWQocCkge1xuXHR2YXIgbSA9IG1hZ25pdHVkZShwKVxuXHRyZXR1cm4gbSA+IDAgPyBzY2FsZWRCeShwLCAxIC8gbSkgOiBwXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzdGFuY2UocDEsIHAyKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAxLnggLSBwMi54KSArIHNxdWFyZShwMS55IC0gcDIueSkgKyBzcXVhcmUocDEueiAtIHAyLnopKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJvdGF0ZWRCeShwLCBkVGhldGEpIHtcblx0dmFyIGMgPSBNYXRoLmNvcyhkVGhldGEpXG5cdHZhciBzID0gTWF0aC5zaW4oZFRoZXRhKVxuXHRyZXR1cm4ge3g6IGMqcC54IC0gcypwLnksIHk6IHMqcC54ICsgYypwLnksIHo6IHAuen1cbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gcm90YXRlZEFyb3VuZChwLCBkVGhldGEsIGF4aXMpIHtcblx0cmV0dXJuIHBsdXMoYXhpcywgcm90YXRlZEJ5KG1pbnVzKHAsIGF4aXMpLCBkVGhldGEpKVxuXHQvKlxuXHQvLyByb3RhdGUgdGhlIHBvaW50ICh4LHkseikgYWJvdXQgdGhlIHZlY3RvciDin6h1LHYsd+KfqSBieSB0aGUgYW5nbGUgzrggKGFyb3VuZCBvcmlnaW4/KVxuXHR2YXIgeCA9IHAueCwgeSA9IHAueSwgeiA9IHAueiwgdSA9IGF4aXMueCwgdiA9IGF4aXMueSwgdyA9IGF4aXMuelxuXHR2YXIgYyA9IE1hdGguY29zKGRUaGV0YSksIHMgPSBNYXRoLnNpbihkVGhldGEpXG5cdHZhciBvbmUgPSAodSAqIHgpICsgKHYgKiB5KSArICh3ICogeiksIHR3byA9ICh1ICogdSkgKyAodiAqIHYpICsgKHcgKiB3KSwgdGhyZWUgPSBNYXRoLnNxcnQodHdvKVxuXHRyZXR1cm4ge3g6ICgodSAqIG9uZSAqICgxIC0gYykpICArICh0d28gKiB4ICogYykgKyAodGhyZWUgKiBzICogKCh2ICogeikgLSAodyAqIHkpKSkpIC8gdHdvLFxuXHR5OiAoKHYgKiBvbmUgKiAoMSAtIGMpKSAgKyAodHdvICogeSAqIGMpICsgKHRocmVlICogcyAqICgodyAqIHgpIC0gKHUgKiB6KSkpKSAvIHR3byxcbiBcdHo6ICgodyAqIG9uZSAqICgxIC0gYykpICArICh0d28gKiB6ICogYykgKyAodGhyZWUgKiBzICogKCh1ICogeSkgLSAodiAqIHgpKSkpIC8gdHdvfVxuXHQqL1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBzZXREZWx0YShkLCBwLCBzY2FsZSkge1xuXHRkLnggPSBwLnggKiBzY2FsZVxuXHRkLnkgPSBwLnkgKiBzY2FsZVxuXHRkLnogPSBwLnogKiBzY2FsZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvdFByb2R1Y3QodjEsIHYyKSB7XG5cdHJldHVybiAodjEueCAqIHYyLngpICsgKHYxLnkgKiB2Mi55KSArICh2MS56ICogdjIueilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcm9zc1Byb2R1Y3QodjEsIHYyKSB7XG5cdHZhciBhID0gbmV3IFRIUkVFLlZlY3RvcjModjEueCwgdjEueSwgdjEueilcblx0dmFyIGIgPSBuZXcgVEhSRUUuVmVjdG9yMyh2Mi54LCB2Mi55LCB2Mi56KVxuXHR2YXIgYyA9IG5ldyBUSFJFRS5WZWN0b3IzKClcblx0Yy5jcm9zc1ZlY3RvcnMoIGEsIGIgKVxuXHRyZXR1cm4gbmV3IFBvaW50M0QoYy54LCBjLnksIGMueilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhbmdsZSh2MSwgdjIsIGF4aXMpIHtcblx0Ly92YXIgbGFuZ2xlID0gTWF0aC5hY29zKE1hdGgubWluKDEsIGRvdFByb2R1Y3Qobm9ybWFsaXplZCh2MSksIG5vcm1hbGl6ZWQodjIpKSkpXG5cdHZhciB2MW0gPSBTa2V0Y2hwYWQuZ2VvbTNkLm1hZ25pdHVkZSh2MSksIHYybSA9IFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlKHYyKVxuXHR2YXIgcHJvZDIgPSAodjFtICogdjJtKVxuXHRpZiAocHJvZDIgPT0gMClcblx0ICAgIGxhbmdsZSA9IDBcblx0ZWxzZSB7XG5cdCAgICB2YXIgcHJvZDEgPSBkb3RQcm9kdWN0KHYxLCB2Milcblx0ICAgIHZhciBkaXYgPSBNYXRoLm1pbigxLCBwcm9kMSAvIHByb2QyKVxuXHQgICAgbGFuZ2xlID0gTWF0aC5hY29zKGRpdilcblx0ICAgIHZhciBjcm9zcyA9IGNyb3NzUHJvZHVjdCh2MSwgdjIpXG5cdCAgICB2YXIgZG90ID0gZG90UHJvZHVjdChheGlzLCBjcm9zcylcblx0ICAgIGlmIChkb3QgPiAwKSAvLyBPciA+IDBcblx0XHRsYW5nbGUgPSAtbGFuZ2xlXG5cdH1cdFxuXHRyZXR1cm4gbGFuZ2xlXG4gICAgfVxuICAgICAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLnBsdXMgPSBwbHVzXG4gICAgU2tldGNocGFkLmdlb20zZC5taW51cyA9IG1pbnVzXG4gICAgU2tldGNocGFkLmdlb20zZC5zY2FsZWRCeSA9IHNjYWxlZEJ5XG4gICAgU2tldGNocGFkLmdlb20zZC5jb3B5ID0gY29weVxuICAgIFNrZXRjaHBhZC5nZW9tM2QubWlkcG9pbnQgPSBtaWRwb2ludFxuICAgIFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlID0gbWFnbml0dWRlXG4gICAgU2tldGNocGFkLmdlb20zZC5ub3JtYWxpemVkID0gbm9ybWFsaXplZFxuICAgIFNrZXRjaHBhZC5nZW9tM2QuZGlzdGFuY2UgPSBkaXN0YW5jZVxuICAgIFNrZXRjaHBhZC5nZW9tM2Qucm90YXRlZEJ5ID0gcm90YXRlZEJ5XG4gICAgU2tldGNocGFkLmdlb20zZC5hbmdsZSA9IGFuZ2xlXG4gICAgU2tldGNocGFkLmdlb20zZC5kb3RQcm9kdWN0ID0gZG90UHJvZHVjdFxuICAgIFNrZXRjaHBhZC5nZW9tM2QuY3Jvc3NQcm9kdWN0ID0gY3Jvc3NQcm9kdWN0XG4gICAgU2tldGNocGFkLmdlb20zZC5yb3RhdGVkQXJvdW5kID0gcm90YXRlZEFyb3VuZFxuICAgIFNrZXRjaHBhZC5nZW9tM2Quc2V0RGVsdGEgPSBzZXREZWx0YVxuXG4gICAgLy8gQ29vcmRpbmF0ZSBDb25zdHJhaW50LCBpLmUuLCBcIkkgd2FudCB0aGlzIHBvaW50IHRvIGJlIGhlcmVcIi5cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb20zX19Db29yZGluYXRlQ29uc3RyYWludChwLCB4LCB5LCB6KSB7XG5cdHRoaXMucCA9IHBcblx0dGhpcy5jID0gbmV3IFBvaW50M0QoeCwgeSwgeilcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20zZC5Db29yZGluYXRlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbTNkLkNvb3JkaW5hdGVDb25zdHJhaW50KFBvaW50IFAsIE51bWJlciBYLCBOdW1iZXIgWSwgTnVtYmVyIFopIHN0YXRlcyB0aGF0IHBvaW50IFAgc2hvdWxkIHN0YXkgYXQgY29vcmRpbmF0ZSAoWCwgWSwgWikuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwOiAnUG9pbnQzRCcsIGM6ICdQb2ludDNEJ31cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnAsIHByb3BzOiBbJ3gnLCAneScsICd6J119XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXModGhpcy5jLCB0aGlzLnApKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHtwOiB7eDogdGhpcy5jLngsIHk6IHRoaXMuYy55LCB6OiB0aGlzLmMuen19XG4gICAgfVxuXG4gICAgLy8gTGVuZ3RoIGNvbnN0cmFpbnQgLSBtYWludGFpbnMgZGlzdGFuY2UgYmV0d2VlbiBQMSBhbmQgUDIgYXQgTC5cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbTNkX19MZW5ndGhDb25zdHJhaW50KHAxLCBwMiwgbCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMubCA9IGxcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50KFBvaW50M0QgUDEsIFBvaW50M0QgUDIsIE51bWJlciBMKSBzYXlzIHBvaW50cyBQMSBhbmQgUDIgYWx3YXlzIG1haW50YWluIGEgZGlzdGFuY2Ugb2YgTC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludDNEJywgcDI6ICdQb2ludDNEJywgbDogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnAxLCBwcm9wczogWyd4JywgJ3knLCAneiddfSwge29iajogdGhpcy5wMiwgcHJvcHM6IFsneCcsICd5JywgJ3onXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKVxuXHRyZXR1cm4gbDEyIC0gdGhpcy5sXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHAxLCBwMikpXG5cdGlmIChsMTIgPT0gMCkge1xuXHQgICAgcDEgPSBwbHVzKHAxLCB7eDogMC4xLCB5OiAwLCB6OiAwfSlcblx0ICAgIHAyID0gcGx1cyhwMiwge3g6IC0wLjEsIHk6IDAsIHo6IDB9KVxuXHR9XG5cdHZhciBkZWx0YSA9IChsMTIgLSB0aGlzLmwpIC8gMlxuXHR2YXIgZTEyID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20zZC5ub3JtYWxpemVkKG1pbnVzKHAyLCBwMSkpLCBkZWx0YSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBlMTIpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShlMTIsIC0xKSl9XG4gICAgfVxuXG4gICAgLy8gTW90b3IgY29uc3RyYWludCAtIGNhdXNlcyBQMSBhbmQgUDIgdG8gb3JiaXQgdGhlaXIgbWlkcG9pbnQgYXQgdGhlIGdpdmVuIHJhdGUuXG4gICAgLy8gdyBpcyBpbiB1bml0cyBvZiBIeiAtIHdob2xlIHJvdGF0aW9ucyBwZXIgc2Vjb25kLlxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX01vdG9yQ29uc3RyYWludChwMSwgcDIsIHcpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLncgPSB3XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tM2QuTW90b3JDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBXKSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlIG9mIHcsIGluIHVuaXRzIG9mIEh6OiB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cIiB9IFxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCB3OiAnTnVtYmVyJ31cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIDFcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdCA9IChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC8gMTAwMC4wXG5cdHZhciBkVGhldGEgPSB0ICogdGhpcy53ICogKDIgKiBNYXRoLlBJKVxuXHR2YXIgbTEyID0gbWlkcG9pbnQodGhpcy5wMSwgdGhpcy5wMilcblx0cmV0dXJuIHtwMTogcm90YXRlZEFyb3VuZCh0aGlzLnAxLCBkVGhldGEsIG0xMiksXG5cdFx0cDI6IHJvdGF0ZWRBcm91bmQodGhpcy5wMiwgZFRoZXRhLCBtMTIpfVxuICAgIH1cbiAgICAgICAgXG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbDNER2VvbWV0cmljQ29uc3RyYWludHNcbiIsImZ1bmN0aW9uIGluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIHNpbXVsYXRpb24gY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZCA9IHsgZzogOS44LCBHOiA2LjdlLTExIH0gLy8gRzogTm0yL2tnMiBcblxuICAgIHZhciBtaW51cyA9IFNrZXRjaHBhZC5nZW9tM2QubWludXNcbiAgICB2YXIgcGx1cyA9IFNrZXRjaHBhZC5nZW9tM2QucGx1c1xuICAgIHZhciBzY2FsZWRCeSA9IFNrZXRjaHBhZC5nZW9tM2Quc2NhbGVkQnlcbiAgICB2YXIgbWFnbml0dWRlID0gU2tldGNocGFkLmdlb20zZC5tYWduaXR1ZGVcbiAgICB2YXIgbm9ybWFsaXplZCA9IFNrZXRjaHBhZC5nZW9tM2Qubm9ybWFsaXplZFxuICAgIHZhciBkaXN0YW5jZSA9IFNrZXRjaHBhZC5nZW9tM2QuZGlzdGFuY2VcbiAgICB2YXIgYW5nbGUgPSBTa2V0Y2hwYWQuZ2VvbTNkLmFuZ2xlXG5cbiAgICAvLyBDbGFzc2VzXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkZyZWVCb2R5ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX0ZyZWVCb2R5KHBvc2l0aW9uLCBvcHRSYWRpdXMsIG9wdERyYXduUmFkaXVzLCBvcHRNYXNzLCBvcHRDb2xvcikge1xuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy5tYXNzID0gb3B0TWFzcyB8fCAxMFxuXHR0aGlzLnZlbG9jaXR5ID0gbmV3IFZlY3RvcjNEKDAsIDAsIDApXG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gbmV3IFZlY3RvcjNEKDAsIDAsIDApXG5cdHRoaXMucmFkaXVzID0gb3B0UmFkaXVzIHx8IHRoaXMucG9zaXRpb24ucmFkaXVzXG5cdHRoaXMuZHJhd25SYWRpdXMgPSBvcHREcmF3blJhZGl1cyB8fCB0aGlzLnJhZGl1c1xuXHRyYy5hZGQobmV3IFNwaGVyZShwb3NpdGlvbiwgb3B0Q29sb3IsIHRoaXMuZHJhd25SYWRpdXMpKVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkZyZWVCb2R5KVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5GcmVlQm9keS5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwb3NpdGlvbjogJ1BvaW50M0QnLCBtYXNzOiAnTnVtYmVyJywgcmFkaXVzOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX1NwcmluZyhib2R5MSwgYm9keTIsIGssIGxlbmd0aCwgdGVhclBvaW50QW1vdW50LCBvcHRDb2xvcikge1xuXHR0aGlzLmJvZHkxID0gYm9keTFcblx0dGhpcy5ib2R5MSA9IGJvZHkyXG5cdHRoaXMubGluZSA9IHJjLmFkZChuZXcgQ3lsaW5kZXIoYm9keTEucG9zaXRpb24sIGJvZHkyLnBvc2l0aW9uLCBvcHRDb2xvcikpXG5cdHRoaXMuayA9IGtcblx0dGhpcy5sZW5ndGggPSBsZW5ndGggICAgXG5cdHRoaXMudGVhclBvaW50QW1vdW50ID0gdGVhclBvaW50QW1vdW50XG5cdHRoaXMudG9ybiA9IGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZylcbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZy5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5MTogJ0ZyZWVCb2R5JywgYm9keTI6ICdGcmVlQm9keScsIGs6ICdOdW1iZXInLCBsZW5ndGg6ICdOdW1iZXInLCB0ZWF0UG9pbnRBbW91bnQ6ICdOdW1iZXInfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nLnByb3RvdHlwZS5zb2x1dGlvbkpvaW5zID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7dG9ybjogcmMuc2tldGNocGFkLmxhc3RPbmVXaW5zSm9pblNvbHV0aW9uc31cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZy5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRpZiAodGhpcy5saW5lKSB7XG5cdCAgICBpZiAodGhpcy50b3JuKSB7XG5cdFx0cmMucmVtb3ZlKHRoaXMubGluZSlcblx0XHR0aGlzLmxpbmUgPSB1bmRlZmluZWRcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIGhlaWdodCA9IHRoaXMubGluZS5nZXRIZWlnaHQoKSwgbGVuZ3RoID0gdGhpcy5sZW5ndGhcblx0XHR2YXIgc3RyZXRjaCA9IE1hdGguYWJzKGhlaWdodCAtIGxlbmd0aCkgLyBsZW5ndGhcblx0XHR2YXIgY29sb3IgPSB0aGlzLmxpbmUuX3NjZW5lT2JqLm1hdGVyaWFsLmNvbG9yXG5cdFx0Y29sb3Iuc2V0KCdncmF5Jylcblx0XHRjb2xvci5yICs9IHN0cmV0Y2hcblx0ICAgIH1cblx0fVxuICAgIH1cblx0ICAgIFxuICAgIC8vIE1vdGlvbiBDb25zdHJhaW50XG5cdFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX1ZlbG9jaXR5Q29uc3RyYWludChib2R5KSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50KEZyZWVCb2R5IEJvZHkpIHN0YXRlcyBmb3IgQm9keTogUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dGhpcy5sYXN0UG9zaXRpb24gPSBzY2FsZWRCeSh0aGlzLnBvc2l0aW9uLCAxKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eSwgZHQpKSwgdGhpcy5wb3NpdGlvbikpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSl9XG4gICAgfVxuXG4gICAgLy8gQm9keSBXaXRoIFZlbG9jaXR5IENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50MiA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19WZWxvY2l0eUNvbnN0cmFpbnQyKGJvZHksIHZlbG9jaXR5KSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50MiwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50MihGcmVlQm9keSBCb2R5LCBQb2ludFZlY3RvcjNEIFZlbG9jaXR5KSBzdGF0ZXMgZm9yIEJvZHk6IFBvcyA9IG9sZChQb3MpICsgVmVsb2NpdHkgKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIHZlbG9jaXR5OiAnUG9pbnQnfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSl9XG4gICAgfVxuXG4gICAgLy8gQWNjZWxlcmF0aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19BY2NlbGVyYXRpb25Db25zdHJhaW50KGJvZHksIGFjY2VsZXJhdGlvbikge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludChGcmVlQm9keSBCb2R5LCBWZWN0b3IgQWNjZWxlcmF0aW9uKSBzdGF0ZXMgZm9yIEJvZHk6IFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSArIEFjY2VsZXJhdGlvbiAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5JywgdmVsb2NpdHk6ICdWZWN0b3IzRCd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RWZWxvY2l0eSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFZlbG9jaXR5LCBzY2FsZWRCeSh0aGlzLmFjY2VsZXJhdGlvbiwgZHQpKSwgdGhpcy52ZWxvY2l0eSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3ZlbG9jaXR5OiBwbHVzKHRoaXMubGFzdFZlbG9jaXR5LCBzY2FsZWRCeSh0aGlzLmFjY2VsZXJhdGlvbiwgZHQpKX1cbiAgICB9XG5cbiAgICAvLyBBaXIgUmVzaXN0YW5jZSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX0FpclJlc2lzdGFuY2VDb25zdHJhaW50KGJvZHksIHNjYWxlKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5zY2FsZSA9IC1zY2FsZVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQoRnJlZUJvZHkgQm9keSwgTnVtYmVyIFNjYWxlKSBzdGF0ZXMgZm9yIEJvZHk6IFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSAqIFNjYWxlIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3NjYWxlOiAnTnVtYmVyJywgYm9keTogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RWZWxvY2l0eSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIDEpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhzY2FsZWRCeSh0aGlzLmxhc3RWZWxvY2l0eSwgdGhpcy5zY2FsZSksIHRoaXMudmVsb2NpdHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpfVxuICAgIH1cblxuICAgIC8vICBTcHJpbmcgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX1NwcmluZ0NvbnN0cmFpbnQoYm9keTEsIGJvZHkyLCBzcHJpbmcpIHtcblx0dGhpcy5ib2R5MSA9IGJvZHkxXG5cdHRoaXMuYm9keTIgPSBib2R5MlxuXHR0aGlzLnBvc2l0aW9uMSA9IGJvZHkxLnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkxID0gYm9keTEudmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24xID0gYm9keTEuYWNjZWxlcmF0aW9uXG5cdHRoaXMubWFzczEgPSBib2R5MS5tYXNzXG5cdHRoaXMucG9zaXRpb24yID0gYm9keTIucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eTIgPSBib2R5Mi52ZWxvY2l0eVxuXHR0aGlzLmFjY2VsZXJhdGlvbjIgPSBib2R5Mi5hY2NlbGVyYXRpb25cblx0dGhpcy5tYXNzMiA9IGJvZHkyLm1hc3Ncblx0dGhpcy5zcHJpbmcgPSBzcHJpbmdcblx0dGhpcy5fbGFzdFZlbG9jaXRpZXMgPSBbdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludChGcmVlQm9keSBCb2R5MSwgRnJlZUJvZHkgQm9keTIsIFNwcmluZyBTKSBzdGF0ZXMgdGhhdCBzcHJpbmcgUyBoYXMgYmVlbiBhdHRhY2hlZCB0byB0d28gYm9kaWVzIEJvZHkxIGFuZCBCb2R5Mi5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTE6ICdGcmVlQm9keScsIGJvZHkyOiAnRnJlZUJvZHknLCBzcHJpbmc6ICdTcHJpbmcnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3ByaW5nID0gdGhpcy5zcHJpbmdcblx0aWYgKHNwcmluZy50b3JuKSB7XG5cdCAgICByZXR1cm4gMFxuXHR9XG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdHZhciBlcnIgPSAwXG5cdGZvciAodmFyIGkgPSAwOyBpIDw9IDE7IGkrKykge1xuXHQgICAgdmFyIGogPSAoaSArIDEpICUgMlxuXHQgICAgdmFyIG1hc3MgPSBtYXNzZXNbal1cblx0ICAgIGlmIChtYXNzID4gMCkgeyAvLyBpZiBub3QgYW5jaG9yZWRcblx0XHR2YXIgY3VyckFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvbnNbal1cblx0XHR2YXIgcG9zaXRpb24xID0gcG9zaXRpb25zW2ldXG5cdFx0dmFyIHBvc2l0aW9uMiA9IHBvc2l0aW9uc1tqXVxuXHRcdHZhciB2ZWN0b3IgPSBtaW51cyhwb3NpdGlvbjIsIHBvc2l0aW9uMSlcblx0XHR2YXIgc3ByaW5nQ3VyckxlbiA9IG1hZ25pdHVkZSh2ZWN0b3IpXHRcdFxuXHRcdHZhciBzdHJldGNoTGVuID0gIHNwcmluZ0N1cnJMZW4gLSBzcHJpbmcubGVuZ3RoXG5cdFx0dmFyIG5ld0FjY2VsZXJhdGlvbk1hZyA9IHNwcmluZy5rICogc3RyZXRjaExlbiAvIG1hc3Ncblx0XHR2YXIgYWNjID0gc2NhbGVkQnkobm9ybWFsaXplZCh2ZWN0b3IpLCAtbmV3QWNjZWxlcmF0aW9uTWFnKVxuXHRcdGVyciArPSBtYWduaXR1ZGUobWludXMoYWNjLCBjdXJyQWNjZWxlcmF0aW9uKSlcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gZXJyXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzb2xuID0ge31cblx0dmFyIHNwcmluZyA9IHRoaXMuc3ByaW5nXG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdGZvciAodmFyIGkgPSAwOyBpIDw9IDE7IGkrKykge1xuXHQgICAgdmFyIGogPSAoaSArIDEpICUgMlxuXHQgICAgdmFyIG1hc3MgPSBtYXNzZXNbal1cblx0ICAgIHZhciBhY2MsIHRvcm4gPSBmYWxzZVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFx0XHRcblx0XHR2YXIgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3Rvcilcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdC8vIGlmIG5vdCB0b3JuIGFwYXJ0Li4uXG5cdFx0dG9ybiA9IHN0cmV0Y2hMZW4gPiBzcHJpbmcudGVhclBvaW50QW1vdW50XG5cdFx0aWYgKCF0b3JuKSB7XG5cdFx0ICAgIHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0ICAgIGFjYyA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQodmVjdG9yKSwgLW5ld0FjY2VsZXJhdGlvbk1hZylcblx0XHR9IFxuXHQgICAgfVxuXHQgICAgaWYgKHRvcm4pXG5cdFx0c29sblsnc3ByaW5nJ10gPSB7dG9ybjogdHJ1ZX1cblx0ICAgIGlmIChhY2MpXG5cdFx0c29sblsnYWNjZWxlcmF0aW9uJyArIChqKzEpXSA9IGFjY1xuXHR9XHRcblx0cmV0dXJuIHNvbG5cbiAgICB9XG5cbiAgICAvLyAgT3JiaXRhbE1vdGlvbiBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX09yYml0YWxNb3Rpb25Db25zdHJhaW50KHN1biwgbW9vbiwgZGlzdGFuY2VEb3duc2NhbGUpIHtcblx0dGhpcy5zdW4gPSBzdW5cblx0dGhpcy5tb29uID0gbW9vblxuXHR0aGlzLmFjY2VsZXJhdGlvbiA9IG1vb24uYWNjZWxlcmF0aW9uXG5cdHRoaXMuZGlzdGFuY2VEb3duc2NhbGUgPSAoZGlzdGFuY2VEb3duc2NhbGUgfHwgKDFlOSAvIDIpKVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5PcmJpdGFsTW90aW9uQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQoRnJlZUJvZHkgU3VuLCBGcmVlQm9keSBNb29uKSBzdGF0ZXMgdGhhdCBNb29uIGJvZHkgaXMgb3JiaXRpbmcgYXJvdW5kIFN1biBib2R5IGFjY29yZGluZyB0byBzaW1wbGUgb3JiaXRhbCBtb3Rpb24gZm9ybXVsYS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3N1bjogJ0ZyZWVCb2R5JywgbW9vbjogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmN1cnJlbnRHcmF2aXR5QWNjZWxlcmF0aW9uID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwMSA9IHRoaXMubW9vbi5wb3NpdGlvbiwgcDIgPSB0aGlzLnN1bi5wb3NpdGlvblxuXHR2YXIgZGlzdDAgPSBkaXN0YW5jZShwMSwgcDIpXG5cdHZhciBkaXN0ID0gZGlzdDAgKiB0aGlzLmRpc3RhbmNlRG93bnNjYWxlXHRcblx0dmFyIGFNYWcwID0gKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuRyAqIHRoaXMuc3VuLm1hc3MpIC8gKGRpc3QgKiBkaXN0KVxuXHR2YXIgYU1hZyA9IGFNYWcwIC8gdGhpcy5kaXN0YW5jZURvd25zY2FsZVxuXHR2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3Ioe3g6IHAxLngsIHk6IHAxLnp9LCB7eDogcDIueCwgeTogcDIuen0pIC8vY2hlYXQgdG8gdXNlIDJEIFgtWiBwbGFuZVxuXHRyZXR1cm4ge3g6IHNsb3BlVi54ICogYU1hZywgeTogMCwgejogc2xvcGVWLnkgKiBhTWFnfVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR0aGlzLl90YXJnZXRBY2NlbGVyYXRpb24gPSB0aGlzLmN1cnJlbnRHcmF2aXR5QWNjZWxlcmF0aW9uKClcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyh0aGlzLl90YXJnZXRBY2NlbGVyYXRpb24sIHRoaXMuYWNjZWxlcmF0aW9uKSlcdFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHthY2NlbGVyYXRpb246IHRoaXMuX3RhcmdldEFjY2VsZXJhdGlvbn1cbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50c1xuIiwiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEltcG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyA9IHJlcXVpcmUoJy4vMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzJkL2dlb21ldHJpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8yZC9zaW11bGF0aW9uLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxudmFyIGluc3RhbGwzREdlb21ldHJpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMnKS5pbnN0YWxsXG52YXIgaW5zdGFsbDNEU2ltdWxhdGlvbkNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8zZC9zaW11bGF0aW9uLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gR2xvYmFsIE1lc3N5IFN0dWZmXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgX19pZEN0ciA9IDFcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19pZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoJ19fX2lkJykpXG5cdCAgICB0aGlzLl9fX2lkID0gX19pZEN0cisrXG5cdHJldHVybiB0aGlzLl9fX2lkXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX190eXBlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fdHlwZScpKVxuXHQgICAgdGhpcy5fX190eXBlID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLnJlcGxhY2UoL19fL2csICcuJylcblx0cmV0dXJuIHRoaXMuX19fdHlwZVxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fc2hvcnRUeXBlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdHZhciByZXMgPSB0aGlzLl9fdHlwZVxuXHRyZXR1cm4gcmVzLnN1YnN0cmluZyhyZXMubGFzdEluZGV4T2YoJy4nKSArIDEpXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX190b1N0cmluZycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fX3Nob3J0VHlwZSArICdAJyArIHRoaXMuX19pZFxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fY29udGFpbmVyJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fY29udGFpbmVyJykpXG5cdCAgICB0aGlzLl9fX2NvbnRhaW5lciA9IHJjXG5cdHJldHVybiB0aGlzLl9fX2NvbnRhaW5lclxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fc2NyYXRjaCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoJ19fX3NjcmF0Y2gnKSlcblx0ICAgIHRoaXMuX19fc2NyYXRjaCA9IHt9XG5cdHJldHVybiB0aGlzLl9fX3NjcmF0Y2hcbiAgICB9XG59KVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFB1YmxpY1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gU2tldGNocGFkKCkge1xuICAgIHRoaXMucmhvID0gMVxuICAgIHRoaXMuZXBzaWxvbiA9IDAuMDFcbiAgICB0aGlzLmRlYnVnID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvciA9IGZhbHNlXG4gICAgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMgPSBmYWxzZVxuICAgIHRoaXMuY29uc3RyYWludHMgPSBbXVxuICAgIHRoaXMudGhpbmdDb25zdHJ1Y3RvcnMgPSB7fVxuICAgIHRoaXMuY29uc3RyYWludENvbnN0cnVjdG9ycyA9IHt9XG4gICAgdGhpcy5vYmpNYXAgPSB7fVxuICAgIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMgPSB7fVxuICAgIHRoaXMuZXZlbnRIYW5kbGVycyA9IFtdXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWwgPSB7fVxuICAgIHRoaXMuZXZlbnREZXNjcmlwdGlvbnMgPSB7fVxuICAgIHRoaXMub25FYWNoVGltZVN0ZXBIYW5kbGVyRGVzY3JpcHRpb25zID0ge31cbiAgICB0aGlzLmV2ZW50cyA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoT25FYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoQWZ0ZXJFYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gICAgdGhpcy5wc2V1ZG9UaW1lID0gMFxuICAgIHRoaXMucHJldlBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5zY3JhdGNoID0ge31cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uKGFDbGFzcywgaXNDb25zdHJhaW50KSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGFDbGFzcy5uYW1lLnJlcGxhY2UoL19fL2csICcuJylcbiAgICB2YXIgbGlzdCA9IGlzQ29uc3RyYWludCA/IHRoaXMuY29uc3RyYWludENvbnN0cnVjdG9ycyA6IHRoaXMudGhpbmdDb25zdHJ1Y3RvcnMgICAgXG4gICAgbGlzdFtjbGFzc05hbWVdID0gYUNsYXNzXG4gICAgYUNsYXNzLnByb3RvdHlwZS5fX2lzU2tldGNocGFkVGhpbmcgPSB0cnVlXG4gICAgYUNsYXNzLnByb3RvdHlwZS5fX2lzQ29uc3RyYWludCA9IGlzQ29uc3RyYWludFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLm1hcmtPYmplY3RXaXRoSWRJZk5ldyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBpZCA9IG9iai5fX2lkXG4gICAgaWYgKHRoaXMub2JqTWFwW2lkXSlcblx0cmV0dXJuIHRydWVcbiAgICB0aGlzLm9iak1hcFtpZF0gPSBvYmpcbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5nZXRPYmplY3QgPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiB0aGlzLm9iak1hcFtpZF1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hZGRDb25zdHJhaW50ID0gZnVuY3Rpb24oY29uc3RyYWludCkge1xuICAgIGlmIChjb25zdHJhaW50Ll9fcHJpb3JpdHkgPT09IHVuZGVmaW5lZClcblx0Y29uc3RyYWludC5fX3ByaW9yaXR5ID0gMVxuICAgIHZhciBwcmlvID0gY29uc3RyYWludC5fX3ByaW9yaXR5XG4gICAgdmFyIGFkZElkeCA9IDBcbiAgICB3aGlsZSAoYWRkSWR4IDwgdGhpcy5jb25zdHJhaW50cy5sZW5ndGggJiYgdGhpcy5jb25zdHJhaW50c1thZGRJZHhdLl9fcHJpb3JpdHkgPCBwcmlvKVxuXHRhZGRJZHgrK1xuICAgIGlmICh0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcykge1xuXHR0aGlzLmFkZFRvUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9yc0ZvckNvbnN0cmFpbnQoY29uc3RyYWludCwgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cylcblx0dGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVGb3JDb25zdHJhaW50KGNvbnN0cmFpbnQpXG5cdGlmICh0aGlzLmRlYnVnKSBsb2codGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cylcbiAgICB9XG4gICAgdGhpcy5jb25zdHJhaW50cy5zcGxpY2UoYWRkSWR4LCAwLCBjb25zdHJhaW50KVxuICAgIGZvciAodmFyIHAgaW4gY29uc3RyYWludCkge1xuXHRpZiAoY29uc3RyYWludC5oYXNPd25Qcm9wZXJ0eShwKSkge1xuXHQgICAgdmFyIG9iaiA9IGNvbnN0cmFpbnRbcF1cblx0ICAgIGlmIChvYmogIT09IHVuZGVmaW5lZCAmJiAhdGhpcy5vYmpNYXBbb2JqLl9faWRdKVxuXHRcdHRoaXMub2JqTWFwW29iai5fX2lkXSA9IG9ialxuXHR9XG4gICAgfVxuICAgIHJldHVybiBjb25zdHJhaW50XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUucmVtb3ZlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHVud2FudGVkQ29uc3RyYWludCkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHRoaXMuY29uc3RyYWludHMgPSB0aGlzLmNvbnN0cmFpbnRzLmZpbHRlcihmdW5jdGlvbihjb25zdHJhaW50KSB7XG5cdHJldHVybiBjb25zdHJhaW50ICE9PSB1bndhbnRlZENvbnN0cmFpbnQgJiZcbiAgICAgICAgICAgICEoaW52b2x2ZXMoY29uc3RyYWludCwgdW53YW50ZWRDb25zdHJhaW50KSlcbiAgICB9KVxuICAgIGlmICh0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcylcblx0dGhpcy5jb21wdXRlUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9ycygpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJobyA9IDFcbiAgICB0aGlzLmVwc2lsb24gPSAwLjAxXG4gICAgdGhpcy5zZWFyY2hPbiA9IGZhbHNlXG4gICAgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3IgPSBmYWxzZVxuICAgIHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yT25Qcmlvcml0eURpZmZlcmVuY2VzID0gZmFsc2VcbiAgICB0aGlzLmNvbnN0cmFpbnRzID0gW11cbiAgICB0aGlzLm9iak1hcCA9IHt9XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzID0gW11cbiAgICB0aGlzLmV2ZW50cyA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoT25FYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoQWZ0ZXJFYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cyA9IHt9XG4gICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gICAgdGhpcy5wc2V1ZG9UaW1lID0gMFxuICAgIHRoaXMucHJldlBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5zY3JhdGNoID0ge31cbiAgICAvLyByZW1vdmUgZXhpc3RpbmcgZXZlbnQgaGFuZGxlcnNcbiAgICBmb3IgKHZhciBuYW1lIGluIHRoaXMuZXZlbnRIYW5kbGVyc0ludGVybmFsKVxuXHR0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uKGhhbmRsZXIpIHsgZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGhhbmRsZXIpIH0pXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWwgPSB7fVxuICAgIHRoaXMuZXZlbnREZXNjcmlwdGlvbnMgPSB7fVxuICAgIHRoaXMub25FYWNoVGltZVN0ZXBIYW5kbGVyRGVzY3JpcHRpb25zID0ge31cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlQ3VycmVudEVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBzZXVkb1RpbWUgPSB0aGlzLnBzZXVkb1RpbWVcbiAgICB2YXIgcHJldlBzZXVkb1RpbWUgPSB0aGlzLnByZXZQc2V1ZG9UaW1lIFxuICAgIHZhciB0b3RhbEVycm9yID0gMFxuICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IHRoaXMuY29uc3RyYWludHMubGVuZ3RoOyBpZHgrKykge1xuXHR2YXIgYyA9IHRoaXMuY29uc3RyYWludHNbaWR4XVxuXHR2YXIgZXIgPSBNYXRoLmFicyhjLmNvbXB1dGVFcnJvcihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkpXHRcblx0dG90YWxFcnJvciArPSBlclxuICAgIH1cbiAgICByZXR1cm4gdG90YWxFcnJvclxufVxuICAgIFxuU2tldGNocGFkLnByb3RvdHlwZS5jb2xsZWN0UGVyQ29uc3RyYWludFNvbHV0aW9ucyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMsIGluRml4UG9pbnRQcm9jZXNzKSB7XG4gICAgdmFyIHBzZXVkb1RpbWUgPSB0aGlzLnBzZXVkb1RpbWVcbiAgICB2YXIgcHJldlBzZXVkb1RpbWUgPSB0aGlzLnByZXZQc2V1ZG9UaW1lIFxuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHZhciBhbGxTb2x1dGlvbnMgPSBbXVxuICAgIHZhciBkaWRTb21ldGhpbmcgPSBmYWxzZSwgbG9jYWxEaWRTb21ldGhpbmcgPSBmYWxzZSwgdG90YWxFcnJvciA9IDBcbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCB0aGlzLmNvbnN0cmFpbnRzLmxlbmd0aDsgaWR4KyspIHtcblx0dmFyIGMgPSB0aGlzLmNvbnN0cmFpbnRzW2lkeF1cblx0dmFyIHNlYXJjaGFibGUgPSBjLl9fc2VhcmNoYWJsZVxuXHRpZiAoaW5GaXhQb2ludFByb2Nlc3MgJiYgc2VhcmNoYWJsZSlcblx0ICAgIGNvbnRpbnVlXG5cdHZhciBlciA9IE1hdGguYWJzKGMuY29tcHV0ZUVycm9yKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSlcdFxuXHR0b3RhbEVycm9yICs9IGVyXG5cdGlmIChlciA+IHNlbGYuZXBzaWxvblxuXHQgICAgfHwgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3IgfHwgKHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yT25Qcmlvcml0eURpZmZlcmVuY2VzICYmIHRoaXMuY29uc3RyYWludElzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lKGMpKVxuXHQgICApIHtcblx0ICAgIHZhciBzb2x1dGlvbnMgPSBjLnNvbHZlKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuXHQgICAgaWYgKCEoaW5GaXhQb2ludFByb2Nlc3MgfHwgc2VhcmNoYWJsZSkpXG5cdFx0c29sdXRpb25zID0gW3NvbHV0aW9uc11cblx0ICAgIGxvY2FsRGlkU29tZXRoaW5nID0gdHJ1ZVxuXHQgICAgYWxsU29sdXRpb25zLnB1c2goe2NvbnN0cmFpbnQ6IGMsIHNvbHV0aW9uczogc29sdXRpb25zfSlcblx0fVxuICAgIH1cbiAgICBpZiAobG9jYWxEaWRTb21ldGhpbmcpIHtcblx0ZGlkU29tZXRoaW5nID0gdHJ1ZVxuICAgIH0gZWxzZVxuXHR0b3RhbEVycm9yID0gMFxuICAgIHJldHVybiB7ZGlkU29tZXRoaW5nOiBkaWRTb21ldGhpbmcsIGVycm9yOiB0b3RhbEVycm9yLCBzb2x1dGlvbnM6IGFsbFNvbHV0aW9uc31cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb2xsZWN0UGVyUHJvcGVydHlTb2x1dGlvbnMgPSBmdW5jdGlvbihhbGxTb2x1dGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB2YXIgY29sbGVjdGVkU29sdXRpb25zID0ge30sIHNlZW5Qcmlvcml0aWVzID0ge31cbiAgICBhbGxTb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbihkKSB7XG5cdGNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9uc0FkZFNvbHV0aW9uKHNlbGYsIGQsIGNvbGxlY3RlZFNvbHV0aW9ucywgc2VlblByaW9yaXRpZXMpXG4gICAgfSlcbiAgICByZXR1cm4gY29sbGVjdGVkU29sdXRpb25zXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZG9PbmVJdGVyYXRpb24gPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgaWYgKHRoaXMuYmVmb3JlRWFjaEl0ZXJhdGlvbilcblx0KHRoaXMuYmVmb3JlRWFjaEl0ZXJhdGlvbikoKVxuICAgIHZhciByZXMgPSB0aGlzLmNvbGxlY3RQZXJDb25zdHJhaW50U29sdXRpb25zKHRpbWVNaWxsaXMsIHRydWUpXG4gICAgaWYgKHRoaXMuZGVidWcpIGxvZyhyZXMpXG4gICAgdmFyIGRpZFNvbWV0aGluZyA9IHJlcy5kaWRTb21ldGhpbmdcbiAgICB2YXIgdG90YWxFcnJvciA9IHJlcy5lcnJvclxuICAgIGlmIChkaWRTb21ldGhpbmcpIHtcblx0dmFyIGFsbFNvbHV0aW9ucyA9IHJlcy5zb2x1dGlvbnNcblx0dmFyIGNvbGxlY3RlZFNvbHV0aW9ucyA9IHRoaXMuY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zKGFsbFNvbHV0aW9ucylcblx0aWYgKHRoaXMudW5yb2xsT25Db25mbGljdHMpXG5cdCAgICBhcHBseVNvbHV0aW9uc1dpdGhVbnJvbGxPbkNvbmZsaWN0KHRoaXMsIGNvbGxlY3RlZFNvbHV0aW9ucylcblx0ZWxzZVxuXHQgICAgYXBwbHlTb2x1dGlvbnModGhpcywgY29sbGVjdGVkU29sdXRpb25zKVxuICAgIH1cbiAgICByZXR1cm4gdG90YWxFcnJvclxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVQZXJUaGluZ1BlclByb3BlcnR5RWZmZWN0b3JzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlcyA9IHt9XG4gICAgdGhpcy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtcblx0dGhpcy5hZGRUb1BlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnNGb3JDb25zdHJhaW50KGMsIHJlcylcbiAgICB9LmJpbmQodGhpcykpXG4gICAgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cyA9IHJlcyAgXG4gICAgdGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmUoKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFkZFRvUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9yc0ZvckNvbnN0cmFpbnQgPSBmdW5jdGlvbihjLCByZXMpIHtcbiAgICBpZiAoYy5lZmZlY3RzKSB7XG5cdGMuZWZmZWN0cygpLmZvckVhY2goZnVuY3Rpb24oZSkgeyBcblx0ICAgIHZhciBpZCA9IGUub2JqLl9faWRcblx0ICAgIHZhciBlUHJvcHMgPSBlLnByb3BzXG5cdCAgICB2YXIgcHJvcHMsIGNzXG5cdCAgICBpZiAocmVzW2lkXSlcblx0XHRwcm9wcyA9IHJlc1tpZF1cblx0ICAgIGVsc2Uge1xuXHRcdHByb3BzID0ge31cblx0XHRyZXNbaWRdID0gcHJvcHNcblx0ICAgIH1cblx0ICAgIGVQcm9wcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcblx0XHRpZiAocHJvcHNbcHJvcF0pXG5cdFx0ICAgIGNzID0gcHJvcHNbcHJvcF1cblx0XHRlbHNlIHtcblx0XHQgICAgY3MgPSBbXVxuXHRcdCAgICBwcm9wc1twcm9wXSA9IGNzXG5cdFx0fVxuXHRcdGNzLnB1c2goYylcdFx0XG5cdCAgICB9KVxuXHR9KVx0ICAgIFxuICAgIH1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb25zdHJhaW50SXNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmUgPSBmdW5jdGlvbihjb25zdHJhaW50KSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lW2NvbnN0cmFpbnQuX19pZF0gIT09IHVuZGVmaW5lZFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZUZvckNvbnN0cmFpbnQgPSBmdW5jdGlvbihjb25zdHJhaW50KSB7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cykge1xuXHR2YXIgdGhpbmdFZmZzID0gdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50c1tpZF1cblx0Zm9yICh2YXIgcCBpbiB0aGluZ0VmZnMpIHtcblx0ICAgIHZhciBjcyA9IHRoaW5nRWZmc1twXVxuXHQgICAgaWYgKGNzLmluZGV4T2YoY29uc3RyYWludCkgPj0gMCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY3MubGVuZ3RoOyBpKyspIHtcblx0XHQgICAgdmFyIGMgPSBjc1tpXVxuXHRcdCAgICBpZiAoYyAhPT0gY29uc3RyYWludCAmJiBjLl9fcHJpb3JpdHkgIT09IGNvbnN0cmFpbnQuX19wcmlvcml0eSkge1x0XHRcdFxuXHRcdFx0dmFyIGhDID0gY29uc3RyYWludC5fX3ByaW9yaXR5ID4gYy5fX3ByaW9yaXR5ID8gY29uc3RyYWludCA6IGNcblx0XHRcdHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lW2hDLl9faWRdID0gdHJ1ZVxuXHRcdFx0cmV0dXJuXG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdH1cbiAgICB9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lID0gZnVuY3Rpb24oKSB7ICAgIFxuICAgIHRoaXMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbihjb25zdHJhaW50KSB7ICAgIFxuXHR0aGlzLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZUZvckNvbnN0cmFpbnQoY29uc3RyYWludClcbiAgICB9LmJpbmQodGhpcykpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY3VycmVudFRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnRUaW1lXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZG9UYXNrc09uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcbiAgICB0aGlzLmhhbmRsZUV2ZW50cygpXG4gICAgdGhpcy5kb09uRWFjaFRpbWVTdGVwRm5zKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuICAgIGlmICh0aGlzLm9uRWFjaFRpbWVTdGVwKSBcblx0KHRoaXMub25FYWNoVGltZVN0ZXApKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvVGFza3NBZnRlckVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG4gICAgdGhpcy5kb0FmdGVyRWFjaFRpbWVTdGVwRm5zKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuICAgIGlmICh0aGlzLmFmdGVyRWFjaFRpbWVTdGVwKSBcblx0KHRoaXMuYWZ0ZXJFYWNoVGltZVN0ZXApKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuICAgIHRoaXMubWF5YmVTdGVwUHNldWRvVGltZSgpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29tcHV0ZU5leHRQc2V1ZG9UaW1lRnJvbVByb3Bvc2FscyA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByb3Bvc2Fscykge1xuICAgIHZhciByZXMgPSBwcm9wb3NhbHNbMF0udGltZVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcHJvcG9zYWxzLmxlbmd0aDsgaSsrKSB7XG5cdHRpbWUgPSBwcm9wb3NhbHNbaV0udGltZVxuXHRpZiAodGltZSA8IHJlcylcblx0ICAgIHJlcyA9IHRpbWVcbiAgICB9XG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLm1heWJlU3RlcFBzZXVkb1RpbWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbyA9IHt9XG4gICAgdmFyIHBzZXVkb1RpbWUgPSB0aGlzLnBzZXVkb1RpbWVcbiAgICB0aGlzLnByZXZQc2V1ZG9UaW1lID0gcHNldWRvVGltZVxuICAgIHZhciBwcm9wb3NhbHMgPSBbXVxuICAgIHRoaXMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmKHQucHJvcG9zZU5leHRQc2V1ZG9UaW1lKVxuICAgICAgICAgICAgcHJvcG9zYWxzLnB1c2goe3Byb3Bvc2VyOiB0LCB0aW1lOiB0LnByb3Bvc2VOZXh0UHNldWRvVGltZShwc2V1ZG9UaW1lKX0pXG4gICAgfSlcbiAgICBpZiAocHJvcG9zYWxzLmxlbmd0aCA+IDApXG5cdHRoaXMucHNldWRvVGltZSA9IHRoaXMuY29tcHV0ZU5leHRQc2V1ZG9UaW1lRnJvbVByb3Bvc2Fscyhwc2V1ZG9UaW1lLCBwcm9wb3NhbHMpXHRcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5pdGVyYXRlU2VhcmNoQ2hvaWNlc0ZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGVwc2lsb24gPSB0aGlzLmVwc2lsb25cbiAgICB2YXIgc29scyA9IHRoaXMuY29sbGVjdFBlckNvbnN0cmFpbnRTb2x1dGlvbnModGltZU1pbGxpcywgZmFsc2UpXG4gICAgdmFyIGRpZFNvbWV0aGluZyA9IHNvbHMuZGlkU29tZXRoaW5nXG4gICAgdmFyIHRvdGFsRXJyb3IgPSBzb2xzLmVycm9yXG4gICAgdmFyIHJlcyA9IHtlcnJvcjogdG90YWxFcnJvciwgY291bnQ6IDB9IC8vRklYTUVcbiAgICBpZiAoZGlkU29tZXRoaW5nKSB7XG5cdHZhciBhbGxTb2x1dGlvbkNob2ljZXMgPSBzb2xzLnNvbHV0aW9uc1xuXHQvL2ZpbmQgYWxsIHNvbHV0aW9uIGNvbWJpbmF0aW9ucyBiZXR3ZWVuIGNvbnN0cmFpbnRzXG5cdC8vaWYgKHRoaXMuZGVidWcpIGxvZyhhbGxTb2x1dGlvbkNob2ljZXMpXG5cdHZhciBjaG9pY2VzQ3MgPSBhbGxTb2x1dGlvbkNob2ljZXMubWFwKGZ1bmN0aW9uKGMpIHsgcmV0dXJuIGMuY29uc3RyYWludCB9KVxuXHR2YXIgY0NvdW50ID0gY2hvaWNlc0NzLmxlbmd0aFxuXHR2YXIgY2hvaWNlc1NzID0gYWxsU29sdXRpb25DaG9pY2VzLm1hcChmdW5jdGlvbihjKSB7IHJldHVybiBjLnNvbHV0aW9ucyB9KVxuXHR2YXIgYWxsU29sdXRpb25Db21ib3MgPSBhbGxDb21iaW5hdGlvbnNPZkFycmF5RWxlbWVudHMoY2hvaWNlc1NzKS5tYXAoZnVuY3Rpb24oY29tYm8pIHtcdCAgICBcblx0ICAgIHZhciBjdXJyID0gW11cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY0NvdW50OyBpKyspIHtcblx0XHRjdXJyLnB1c2goe2NvbnN0cmFpbnQ6IGNob2ljZXNDc1tpXSwgc29sdXRpb25zOiBjb21ib1tpXX0pXG5cdCAgICB9XG5cdCAgICByZXR1cm4gY3VyclxuXHR9KVxuXHQvL2xvZyhhbGxTb2x1dGlvbkNvbWJvcylcblx0Ly8gY29weSBjdXJyIHN0YXRlIGFuZCB0cnkgb25lLCBpZiB3b3JrcyByZXR1cm4gZWxzZSByZXZlcnQgc3RhdGUgbW92ZSB0byBuZXh0IHVudGlsIG5vbmUgbGVmdFxuXHR2YXIgY291bnQgPSBhbGxTb2x1dGlvbkNvbWJvcy5sZW5ndGhcblx0dmFyIGNob2ljZVRPID0gdGltZU1pbGxpcyAvIGNvdW50XG5cdGlmICh0aGlzLmRlYnVnKSBsb2coJ3Bvc3NpYmxlIGNob2ljZXMnLCBjb3VudCwgJ3BlciBjaG9pY2UgdGltZW91dCcsIGNob2ljZVRPKVxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcblx0ICAgIHZhciBjb3BpZWQsIGxhc3QgPSBpID09IGNvdW50IC0gMVxuXHQgICAgaWYgKHRoaXMuZGVidWcpIGxvZygndHJ5aW5nIGNob2ljZTogJyArIGkpXG5cdCAgICB2YXIgYWxsU29sdXRpb25zID0gYWxsU29sdXRpb25Db21ib3NbaV1cblx0ICAgIC8vbG9nKGFsbFNvbHV0aW9ucylcblx0ICAgIHZhciBjb2xsZWN0ZWRTb2x1dGlvbnMgPSB0aGlzLmNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9ucyhhbGxTb2x1dGlvbnMpXG5cdCAgICAvL2NvcHkgaGVyZS4uLlx0ICAgIFxuXHQgICAgaWYgKCFsYXN0KVxuXHRcdGNvcGllZCA9IHRoaXMuZ2V0Q3VycmVudFByb3BWYWx1ZXNBZmZlY3RhYmxlQnlTb2x1dGlvbnMoY29sbGVjdGVkU29sdXRpb25zKVxuXHQgICAgaWYgKHRoaXMudW5yb2xsT25Db25mbGljdHMpXG5cdCAgICBhcHBseVNvbHV0aW9uc1dpdGhVbnJvbGxPbkNvbmZsaWN0KHRoaXMsIGNvbGxlY3RlZFNvbHV0aW9ucylcblx0ZWxzZVxuXHQgICAgYXBwbHlTb2x1dGlvbnModGhpcywgY29sbGVjdGVkU29sdXRpb25zKVxuXHQgICAgcmVzID0gdGhpcy5pdGVyYXRlRm9yVXBUb01pbGxpcyhjaG9pY2VUTylcdCAgICBcblx0ICAgIHZhciBjaG9pY2VFcnIgPSB0aGlzLmNvbXB1dGVDdXJyZW50RXJyb3IoKVxuXHQgICAgLy9pZiAodGhpcy5kZWJ1ZykgbG9nKCdjaG9pY2UgcmVzdWx0ZWQgaW4gZXJyb3I6ICcsIGNob2ljZUVycilcblx0ICAgIGlmIChjaG9pY2VFcnIgPCBlcHNpbG9uIHx8IGxhc3QpXG5cdFx0YnJlYWtcblx0ICAgIC8vcmV2ZXJ0IGhlcmVcblx0ICAgIHRoaXMucmV2ZXJ0UHJvcFZhbHVlc0Jhc2VkT25BcmcoY29waWVkKVxuXHR9XG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5nZXRDdXJyZW50UHJvcFZhbHVlc0FmZmVjdGFibGVCeVNvbHV0aW9ucyA9IGZ1bmN0aW9uKHNvbHV0aW9ucykge1xuICAgIHZhciByZXMgPSB7fVxuICAgIGZvciAodmFyIG9iaklkIGluIHNvbHV0aW9ucykge1xuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBwcm9wc04gPSB7fVxuXHRyZXNbb2JqSWRdID0gcHJvcHNOXG5cdHZhciBwcm9wcyA9IHNvbHV0aW9uc1tvYmpJZF1cblx0Zm9yICh2YXIgcCBpbiBwcm9wcykge1xuXHQgICAgcHJvcHNOW3BdID0gY3Vyck9ialtwXVxuXHR9XG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yZXZlcnRQcm9wVmFsdWVzQmFzZWRPbkFyZyA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIGZvciAodmFyIG9iaklkIGluIHZhbHVlcykge1xuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBwcm9wcyA9IHZhbHVlc1tvYmpJZF1cblx0Zm9yICh2YXIgcCBpbiBwcm9wcykge1xuXHQgICAgY3Vyck9ialtwXSA9IHByb3BzW3BdXG5cdH1cbiAgICB9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuc29sdmVGb3JVcFRvTWlsbGlzID0gZnVuY3Rpb24odE1pbGxpcykge1xuICAgIHRoaXMuZG9UYXNrc09uRWFjaFRpbWVTdGVwKHRoaXMucHNldWRvVGltZSwgdGhpcy5wcmV2UHNldWRvVGltZSlcbiAgICB2YXIgcmVzXG4gICAgaWYgKHRoaXMuc2VhcmNoT24pXHRcblx0cmVzID0gdGhpcy5pdGVyYXRlU2VhcmNoQ2hvaWNlc0ZvclVwVG9NaWxsaXModE1pbGxpcylcbiAgICBlbHNlXG5cdHJlcyA9IHRoaXMuaXRlcmF0ZUZvclVwVG9NaWxsaXModE1pbGxpcylcbiAgICB0aGlzLmRvVGFza3NBZnRlckVhY2hUaW1lU3RlcCh0aGlzLnBzZXVkb1RpbWUsIHRoaXMucHJldlBzZXVkb1RpbWUpXG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLml0ZXJhdGVGb3JVcFRvTWlsbGlzID0gZnVuY3Rpb24odE1pbGxpcykge1xuICAgIHZhciBjb3VudCA9IDAsIHRvdGFsRXJyb3IgPSAwLCBlcHNpbG9uID0gdGhpcy5lcHNpbG9uXG4gICAgdmFyIGN1cnJFcnJvciwgbGFzdEVycm9yXG4gICAgdmFyIHQwLCB0XG4gICAgdDAgPSB0aGlzLmN1cnJlbnRUaW1lKClcbiAgICBkbyB7XG5cdGxhc3RFcnJvciA9IGN1cnJFcnJvclxuXHRjdXJyRXJyb3IgPSB0aGlzLmRvT25lSXRlcmF0aW9uKHQwKVxuXHR0ID0gIHRoaXMuY3VycmVudFRpbWUoKSAtIHQwXG5cdGlmIChjdXJyRXJyb3IgPiAwKSB7XG5cdCAgICBjb3VudCsrXG5cdCAgICB0b3RhbEVycm9yICs9IGN1cnJFcnJvclxuXHR9XG4gICAgfSB3aGlsZSAoXG5cdGN1cnJFcnJvciA+IGVwc2lsb25cblx0ICAgICYmICEoY3VyckVycm9yID49IGxhc3RFcnJvcilcblx0ICAgICYmIHQgPCB0TWlsbGlzKVxuICAgIHJldHVybiB7ZXJyb3I6IHRvdGFsRXJyb3IsIGNvdW50OiBjb3VudH1cbn1cblxuLy8gdmFyaW91cyB3YXlzIHdlIGNhbiBqb2luIHNvbHV0aW9ucyBmcm9tIGFsbCBzb2x2ZXJzXG4vLyBkYW1wZWQgYXZlcmFnZSBqb2luIGZuOlxuU2tldGNocGFkLnByb3RvdHlwZS5zdW1Kb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgdmFyIHJobyA9IHRoaXMucmhvXG4gICAgdmFyIHN1bSA9IDBcbiAgICBzb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IHN1bSArPSB2IH0pXG4gICAgdmFyIHJlcyA9IGN1cnIgKyAocmhvICogKChzdW0gLyBzb2x1dGlvbnMubGVuZ3RoKSAtIGN1cnIpKVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5sYXN0T25lV2luc0pvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICByZXR1cm4gc29sdXRpb25zW3NvbHV0aW9ucy5sZW5ndGggLSAxXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnJhbmRvbUNob2ljZUpvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICByZXR1cm4gc29sdXRpb25zW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNvbHV0aW9ucy5sZW5ndGgpXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFycmF5QWRkSm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHNvbHV0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHsgY3Vyci5wdXNoKHYpIH0pXG4gICAgcmV0dXJuIGN1cnJcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kaWN0aW9uYXJ5QWRkSm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHNvbHV0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHsgZm9yICh2YXIgayBpbiB2KSBjdXJyW2tdID0gdltrXSB9KVxuICAgIHJldHVybiBjdXJyXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZGljdGlvbmFyeUFkZE5vQ29uZmxpY3RKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgdmFyIHNlZW4gPSB7fVxuICAgIHNvbHV0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcblx0Zm9yICh2YXIgayBpbiB2KSB7XG5cdCAgICB2YXIgcHJldiA9IHNlZW5ba11cblx0ICAgIHZhciBuZXdWID0gdltrXVxuXHQgICAgaWYgKHByZXYgJiYgcHJldiAhPT0gbmV3Vikge1xuXHRcdHRoaXMuZGlzY2FyZEl0ZXJhdGlvbiA9IHRydWVcblx0XHRsb2coJ2NvbmZsaWN0IGluIHRoaXMgc29sdXRpb24gc2V0OicsIHNvbHV0aW9ucykgXG5cdFx0cmV0dXJuIGN1cnJcblx0ICAgIH1cblx0ICAgIHNlZW5ba10gPSBuZXdWXG5cdH1cbiAgICB9KVxuICAgIHJldHVybiB0aGlzLmRpY3Rpb25hcnlBZGRKb2luU29sdXRpb25zKGN1cnIsIHNvbHV0aW9ucylcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kZWZhdWx0Sm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHJldHVybiAgdGhpcy5zdW1Kb2luU29sdXRpb25zKGN1cnIsIHNvbHV0aW9ucylcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yZWdpc3RlckV2ZW50ID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIG9wdERlc2NyaXB0aW9uKSB7XG4gICAgdmFyIGlkID0gdGhpcy5ldmVudEhhbmRsZXJzLmxlbmd0aFxuICAgIHRoaXMuZXZlbnRIYW5kbGVycy5wdXNoKGNhbGxiYWNrKVxuICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24oZSkgeyB0aGlzLmV2ZW50cy5wdXNoKFtpZCwgZV0pIH0uYmluZCh0aGlzKVxuICAgIGlmICghdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWxbbmFtZV0pIHtcblx0dGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWxbbmFtZV0gPSBbXVxuXHR0aGlzLmV2ZW50RGVzY3JpcHRpb25zW25hbWVdID0gW11cbiAgICB9XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWxbbmFtZV0ucHVzaChoYW5kbGVyKVxuICAgIHRoaXMuZXZlbnREZXNjcmlwdGlvbnNbbmFtZV0ucHVzaChvcHREZXNjcmlwdGlvbilcbiAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgaGFuZGxlcilcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5oYW5kbGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWVBbmRFKSB7IFxuXHR2YXIgaWQgPSBuYW1lQW5kRVswXTsgXG5cdHZhciBlID0gbmFtZUFuZEVbMV07IFxuXHR2YXIgaCA9IHRoaXMuZXZlbnRIYW5kbGVyc1tpZF1cblx0aWYgKGggIT09IHVuZGVmaW5lZClcblx0ICAgIGgoZSkgXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHRoaXMuZXZlbnRzID0gW11cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kb09uRWFjaFRpbWVTdGVwRm5zID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcbiAgICB0aGlzLnRoaW5nc1dpdGhPbkVhY2hUaW1lU3RlcEZuLmZvckVhY2goZnVuY3Rpb24odCkgeyB0Lm9uRWFjaFRpbWVTdGVwKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB9KVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvQWZ0ZXJFYWNoVGltZVN0ZXBGbnMgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuICAgIHRoaXMudGhpbmdzV2l0aEFmdGVyRWFjaFRpbWVTdGVwRm4uZm9yRWFjaChmdW5jdGlvbih0KSB7IHQuYWZ0ZXJFYWNoVGltZVN0ZXAocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIH0pXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuc2V0T25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihvbkVhY2hUaW1lRm4sIG9wdERlc2NyaXB0aW9uKSB7XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcCA9IG9uRWFjaFRpbWVGblxuICAgIGlmIChvcHREZXNjcmlwdGlvbilcblx0dGhpcy5vbkVhY2hUaW1lU3RlcEhhbmRsZXJEZXNjcmlwdGlvbnNbJ2dlbmVyYWwnXSA9IFtvcHREZXNjcmlwdGlvbl1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS51bnNldE9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcCA9IHVuZGVmaW5lZFxuICAgIGRlbGV0ZSh0aGlzLm9uRWFjaFRpbWVTdGVwSGFuZGxlckRlc2NyaXB0aW9uc1snZ2VuZXJhbCddKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnNldE9wdGlvbiA9IGZ1bmN0aW9uKG9wdCwgdmFsKSB7XG4gICAgdGhpc1tvcHRdID0gdmFsXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZnVuY3Rpb24gY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zQWRkU29sdXRpb24oc2tldGNocGFkLCBzb2xuLCBzb2Zhciwgc2VlblByaW9yaXRpZXMpIHtcbiAgICB2YXIgYyA9IHNvbG4uY29uc3RyYWludFxuICAgIHZhciBwcmlvcml0eSA9IGMuX19wcmlvcml0eVxuICAgIGZvciAodmFyIG9iaiBpbiBzb2xuLnNvbHV0aW9ucykge1xuXHR2YXIgY3Vyck9iaiA9IGNbb2JqXVxuXHR2YXIgY3Vyck9iaklkID0gY3Vyck9iai5fX2lkXG5cdHZhciBkID0gc29sbi5zb2x1dGlvbnNbb2JqXVxuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKGQpXG5cdGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzW2ldXG5cdCAgICB2YXIgcGVyUHJvcFNvbG4gPSBzb2ZhcltjdXJyT2JqSWRdXG5cdCAgICB2YXIgcGVyUHJvcFByaW8gPSBzZWVuUHJpb3JpdGllc1tjdXJyT2JqSWRdXG5cdCAgICB2YXIgcHJvcFNvbG5zLCBwcmlvXG5cdCAgICBpZiAocGVyUHJvcFNvbG4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHBlclByb3BTb2xuID0ge31cblx0XHRwZXJQcm9wUHJpbyA9IHt9XG5cdFx0c29mYXJbY3Vyck9iaklkXSA9IHBlclByb3BTb2xuXG5cdFx0c2VlblByaW9yaXRpZXNbY3Vyck9iaklkXSA9IHBlclByb3BQcmlvXG5cdFx0cHJvcFNvbG5zID0gW11cblx0XHRwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdHBlclByb3BQcmlvW3Byb3BdID0gcHJpb3JpdHlcblx0ICAgIH0gZWxzZSB7XHRcdCAgICBcblx0XHRwcm9wU29sbnMgPSBwZXJQcm9wU29sbltwcm9wXVxuXHRcdGlmIChwcm9wU29sbnMgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICBwcm9wU29sbnMgPSBbXVxuXHRcdCAgICBwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdCAgICBwZXJQcm9wUHJpb1twcm9wXSA9IHByaW9yaXR5XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgdmFyIGxhc3RQcmlvID0gcGVyUHJvcFByaW9bcHJvcF1cblx0ICAgIGlmIChwcmlvcml0eSA+IGxhc3RQcmlvKSB7XG5cdFx0cGVyUHJvcFByaW9bcHJvcF0gPSBwcmlvcml0eVxuXHRcdHdoaWxlIChwcm9wU29sbnMubGVuZ3RoID4gMCkgcHJvcFNvbG5zLnBvcCgpXG5cdCAgICB9IGVsc2UgaWYgKHByaW9yaXR5IDwgbGFzdFByaW8pIHtcblx0XHRicmVha1xuXHQgICAgfSBcblx0ICAgIHByb3BTb2xucy5wdXNoKGRbcHJvcF0pXG5cdH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFwcGx5U29sdXRpb25zKHNrZXRjaHBhZCwgc29sdXRpb25zKSB7ICAgIFxuICAgIC8vbG9nMihzb2x1dGlvbnMpXG4gICAgdmFyIGtleXMxID0gT2JqZWN0LmtleXMoc29sdXRpb25zKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5czEubGVuZ3RoOyBpKyspIHtcblx0dmFyIG9iaklkID0ga2V5czFbaV1cblx0dmFyIHBlclByb3AgPSBzb2x1dGlvbnNbb2JqSWRdXG5cdHZhciBjdXJyT2JqID0gc2tldGNocGFkLm9iak1hcFtvYmpJZF1cblx0dmFyIGtleXMyID0gT2JqZWN0LmtleXMocGVyUHJvcClcblx0Zm9yICh2YXIgaiA9IDA7IGogPCBrZXlzMi5sZW5ndGg7IGorKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzMltqXVxuXHQgICAgdmFyIHByb3BTb2xucyA9IHBlclByb3BbcHJvcF1cblx0ICAgIHZhciBjdXJyVmFsID0gY3Vyck9ialtwcm9wXVxuXHQgICAgdmFyIGpvaW5GbiA9IChjdXJyT2JqLnNvbHV0aW9uSm9pbnMgIT09IHVuZGVmaW5lZCAmJiAoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdICE9PSB1bmRlZmluZWQpID9cblx0XHQoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdIDogc2tldGNocGFkLnN1bUpvaW5Tb2x1dGlvbnNcblx0ICAgIGN1cnJPYmpbcHJvcF0gPSAoam9pbkZuLmJpbmQoc2tldGNocGFkKSkoY3VyclZhbCwgcHJvcFNvbG5zKVxuXHR9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhcHBseVNvbHV0aW9uc1dpdGhVbnJvbGxPbkNvbmZsaWN0KHNrZXRjaHBhZCwgc29sdXRpb25zKSB7XG4gICAgdGhpcy5kaXNjYXJkSXRlcmF0aW9uID0gZmFsc2UgICBcbiAgICAvL2xvZzIoc29sdXRpb25zKVxuICAgIHZhciBrZXlzMSA9IE9iamVjdC5rZXlzKHNvbHV0aW9ucylcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMxLmxlbmd0aDsgaSsrKSB7XG5cdHZhciBvYmpJZCA9IGtleXMxW2ldXG5cdHZhciBwZXJQcm9wID0gc29sdXRpb25zW29iaklkXVxuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBrZXlzMiA9IE9iamVjdC5rZXlzKHBlclByb3ApXG5cdGZvciAodmFyIGogPSAwOyBqIDwga2V5czIubGVuZ3RoOyBqKyspIHtcblx0ICAgIHZhciBwcm9wID0ga2V5czJbal1cblx0ICAgIHZhciBwcm9wU29sbnMgPSBwZXJQcm9wW3Byb3BdXG5cdCAgICB2YXIgY3VyclZhbCA9IGN1cnJPYmpbcHJvcF1cblx0ICAgIGN1cnJPYmpbcHJvcCArICdfX29sZCddID0gY3VyclZhbFxuXHQgICAgdmFyIGpvaW5GbiA9IChjdXJyT2JqLnNvbHV0aW9uSm9pbnMgIT09IHVuZGVmaW5lZCAmJiAoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdICE9PSB1bmRlZmluZWQpID9cblx0XHQoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdIDogc2tldGNocGFkLnN1bUpvaW5Tb2x1dGlvbnNcblx0ICAgIGN1cnJPYmpbcHJvcF0gPSAoam9pbkZuLmJpbmQoc2tldGNocGFkKSkoY3VyclZhbCwgcHJvcFNvbG5zKVxuXHR9XG4gICAgfVxuICAgIGlmICghdGhpcy5kaXNjYXJkSXRlcmF0aW9uKVxuXHRyZXR1cm5cbiAgICBsb2coJ2Rpc2NhcmRpbmcgc29sdXRpb25zIHNpbmNlIHRoZXJlIHdhcyBhIGNvbmZsaWN0Li4uJylcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMxLmxlbmd0aDsgaSsrKSB7XG5cdHZhciBvYmpJZCA9IGtleXMxW2ldXG5cdHZhciBwZXJQcm9wID0gc29sdXRpb25zW29iaklkXVxuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBrZXlzMiA9IE9iamVjdC5rZXlzKHBlclByb3ApXG5cdGZvciAodmFyIGogPSAwOyBqIDwga2V5czIubGVuZ3RoOyBqKyspIHtcblx0ICAgIHZhciBwcm9wID0ga2V5czJbal1cblx0ICAgIHZhciBwcm9wU29sbnMgPSBwZXJQcm9wW3Byb3BdXG5cdCAgICB2YXIgY3VyclZhbCA9IGN1cnJPYmpbcHJvcF1cblx0ICAgIGN1cnJPYmpbcHJvcF0gPSBjdXJyT2JqW3Byb3AgKyAnX19vbGQnXVxuXHQgICAgZGVsZXRlIGN1cnJPYmpbcHJvcCArICdfX29sZCddXG5cdH1cbiAgICB9XG59XG5cblxuZnVuY3Rpb24gaW52b2x2ZXMoY29uc3RyYWludCwgb2JqKSB7XG4gICAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG5cdGlmIChjb25zdHJhaW50W3BdID09PSBvYmopIHtcblx0ICAgIHJldHVybiB0cnVlXG5cdH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGFsbENvbWJpbmF0aW9uc09mQXJyYXlFbGVtZW50cyhhcnJheU9mQXJyYXlzKSB7XG4gICAgaWYgKGFycmF5T2ZBcnJheXMubGVuZ3RoID4gMSkge1xuXHR2YXIgZmlyc3QgPSBhcnJheU9mQXJyYXlzWzBdXG5cdHZhciByZXN0ID0gYWxsQ29tYmluYXRpb25zT2ZBcnJheUVsZW1lbnRzKGFycmF5T2ZBcnJheXMuc2xpY2UoMSkpXG5cdHZhciByZXMgPSBbXVxuXHRmb3IgKHZhciBqID0gMDsgaiA8IHJlc3QubGVuZ3RoIDsgaisrKSB7XG5cdCAgICB2YXIgciA9IHJlc3Rbal1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlyc3QubGVuZ3RoOyBpKyspIHtcblx0XHRyZXMucHVzaChbZmlyc3RbaV1dLmNvbmNhdChyKSlcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gcmVzXG4gICAgfSAgZWxzZSBpZiAoYXJyYXlPZkFycmF5cy5sZW5ndGggPT0gMSkge1xuXHRyZXR1cm4gYXJyYXlPZkFycmF5c1swXS5tYXAoZnVuY3Rpb24oZSkgeyByZXR1cm4gW2VdIH0pXG4gICAgfSBlbHNlXG5cdHJldHVybiBbXVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQm9vdHN0cmFwICYgSW5zdGFsbCBjb25zdHJhaW50IGxpYnJhcmllc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNrZXRjaHBhZCA9IG5ldyBTa2V0Y2hwYWQoKVxuaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoU2tldGNocGFkKVxuaW5zdGFsbFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsM0RHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsM0RTaW11bGF0aW9uQ29uc3RyYWludHMoU2tldGNocGFkKVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXhwb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSBTa2V0Y2hwYWRcblxuIl19
