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
    
    Sketchpad.arith.ValueConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.value - ref(this, 'v')
    }

    Sketchpad.arith.ValueConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return patch(this, 'v', this.value)
    }

    Sketchpad.arith.ValueConstraint.description = function() { return  "Sketchpad.arith.ValueConstraint({obj: O, prop: p}, Value) states that O.p = Value." }

    Sketchpad.arith.ValueConstraint.prototype.description = function() { return this.v_obj.__toString + "." + this.v_prop + " = " + this.value + "." }

    Sketchpad.arith.ValueConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.ValueConstraint({obj: new Point(1,1), prop: 'x'}, 42) 
    }

    // Equality Constraint, i.e., k1 * o1.p1 = k2 * o2.p2

    Sketchpad.arith.EqualityConstraint = function Sketchpad__arith__EqualityConstraint(ref1, ref2, optOnlyWriteTo, k1, k2) {
	this.k1 = k1 || 1, this.k2 = k2 || 1
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.onlyWriteTo = optOnlyWriteTo || [1, 2]
    }

    sketchpad.addClass(Sketchpad.arith.EqualityConstraint, true)

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

    
    Sketchpad.arith.EqualityConstraint.description = function() { return  "Sketchpad.arith.EqualityConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, WritableIdxs, Number K1, Number K2) states that K1 * O1.p1 = K2 * O2.p2 . Constants K1-2 default to 1. Optional WritableIdxs gives a list of indices (elements 1,and/or 2) the constraint is allowed to change," }

    Sketchpad.arith.EqualityConstraint.prototype.description = function() { return  this.k1 + " * " + this.v1_obj.__toString + "." + this.v1_prop + " = " + this.k2 + " * " + this.v2_obj.__toString + "." + this.v2_prop + " ." }

    Sketchpad.arith.EqualityConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}, {obj: this.v2_obj, props: [this.v2_prop]}]
    }

    Sketchpad.arith.EqualityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.EqualityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    // OnWayEquality Constraint, i.e., o1.p1 = o2.p2

    Sketchpad.arith.OneWayEqualityConstraint = function Sketchpad__arith__OneWayEqualityConstraint(ref1, ref2, optSecondPropIsFn) {
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.secondPropIsFn = optSecondPropIsFn
    }

    sketchpad.addClass(Sketchpad.arith.OneWayEqualityConstraint, true)

    Sketchpad.arith.OneWayEqualityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v2 = this.secondPropIsFn ? fnRef(this, 'v2') : ref(this, 'v2')
	var e = ref(this, 'v1') == v2 ? 0 : 1
	return e
    }

    Sketchpad.arith.OneWayEqualityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v2 = this.secondPropIsFn ? fnRef(this, 'v2') : ref(this, 'v2')
	return patch(this, 'v1', v2)
    }
    
    Sketchpad.arith.OneWayEqualityConstraint.description = function() { return  "Sketchpad.arith.OneWayEqualityConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, Boolean secondPropIsFn) states that O1.p1 = O2.p2 (right hand-side is  read-only). If secondPropIsFn = true then O2.p2() is invoked instead." }
    
    Sketchpad.arith.OneWayEqualityConstraint.prototype.description = function() {  var r1 = ref(this, 'v1'), r2 = ref(this, 'v2'); return  this.v1_obj.__toString + "." + this.v1_prop + " = " + this.v2_obj.__toString + "." + this.v2_prop + " and right hand-side is read-only." }

    Sketchpad.arith.OneWayEqualityConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}]
    }

    Sketchpad.arith.OneWayEqualityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.OneWayEqualityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    // Inequality Constraint, i.e., k1 * o1.p1 >= k2 * o2.p2 + k3 or k1 * o1.p1 <= k2 * o2.p2 + k3

    Sketchpad.arith.InequalityConstraint = function Sketchpad__arith__InequalityConstraint(ref1, ref2, isGeq, k1, k2, k3) {
	this.k1 = k1 || 1, this.k2 = k2 || 1, this.k3 = k3 || 0
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.isGeq = isGeq
    }

    sketchpad.addClass(Sketchpad.arith.InequalityConstraint, true)

    Sketchpad.arith.InequalityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v1 = this.k1 * ref(this, 'v1') , v2 = (this.k2 * ref(this, 'v2')) + this.k3, cond = this.isGeq ? v1 >= v2 : v1 <= v2, e = cond ? 0 : v2 - v1
	return e
    }

    Sketchpad.arith.InequalityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v2 = (this.k2 * ref(this, 'v2')) + this.k3
	res = patch(this, 'v1', v2 / this.k1)
	return res
    }

    Sketchpad.arith.InequalityConstraint.description = function() { return  "Sketchpad.arith.InequalityConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, isGeq, Number K1, Number K2, Number K3) states that K1 * O1.p1 >= K2 * O2.p2 + K3 (when isGeq=true) or K1 * O1.p1 <= K2 * O2.p2 + K3 (when isGeq=false). Constants K1-2 default to 1 and K3 to 0" }

    Sketchpad.arith.InequalityConstraint.prototype.description = function() { var r1 = ref(this, 'v1'), r2 = ref(this, 'v2'); return this.k1 + " * " + this.v1_obj.__toString + "." + this.v1_prop + " " + (this.isGeq ? ">" : "<") + "= " + this.k2 + " * " + this.v2_obj.__toString + "." + this.v2_prop + " + " + this.k3 + " ." }

    Sketchpad.arith.InequalityConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}, {obj: this.v2_obj, props: [this.v2_prop]}]
    }

    Sketchpad.arith.InequalityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.InequalityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, true) 
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

    Sketchpad.arith.SumConstraint.description = function() { return  "Sketchpad.arith.SumConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, {obj: O3, prop: p3}, WritableIdxs, Number K1, Number K2, Number K3, Number K4) states that K1 * O1.p1 + K2 * O2.p2 = K3 * O3.p3 + K4 . Constants K1-3 default to 1 and K4 to 0. Optional WritableIdxs gives a list of indices (1, 2, or, 3) the constraint is allowed to change." } 

    Sketchpad.arith.SumConstraint.prototype.description = function() { var r1 = ref(this, 'v1'), r2 = ref(this, 'v2'), r3 = ref(this, 'v3'); return this.k1 + " * " + this.v1_obj.__toString + "." + this.v1_prop + " + " + this.k2 + " * " + this.v2_obj.__toString  + "." + this.v2_prop + " = " + this.k3 + " * " + this.v3_obj.__toString + "." + this.v3_prop + " + " + this.k4 + " ." }

    Sketchpad.arith.SumConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}, {obj: this.v2_obj, props: [this.v2_prop]}, {obj: this.v3_obj, props: [this.v3_prop]}]
    }

    Sketchpad.arith.SumConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.SumConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
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

    Sketchpad.arith.SumInequalityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v1 = this.k1 * ref(this, 'v1'), v2 = this.k2 * ref(this, 'v2'), v3 = this.k3 * ref(this, 'v3'), sum = v2 + v3 + this.k4, cond = this.isGeq ? v1 >= sum : v1 <= sum, e = cond ? 0 : sum - v1
	return e
    }

    Sketchpad.arith.SumInequalityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	v2 = this.k2 * ref(this, 'v2'), v3 = this.k3 * ref(this, 'v3'), sum = v2 + v3 + this.k4
	res = patch(this, 'v1', sum / this.k1)
	return res
    }

    Sketchpad.arith.SumInequalityConstraint.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}]
    }

    Sketchpad.arith.SumInequalityConstraint.description = function() { return  "Sketchpad.arith.SumInequalityConstraint({obj: O1, prop: p1}, {obj: O2, prop: p2}, {obj: O3, prop: p3}, isGeq, Number K1, Number K2, Number K3, Number K4) states that K1 * O1.p1 >=  k2 * O2.p2  + k3 * O3.p3 + K4  or  K1 * O1.p1 <=  K2 * O2.p2 + K3 * O3.p3 + K4 (>= when isGeq=true)" } 

    Sketchpad.arith.SumInequalityConstraint.prototype.description = function() { var r1 = ref(this, 'v1'), r2 = ref(this, 'v2'), r3 = ref(this, 'v3'); return  this.k1 + " * " + this.v1_obj.__toString + "." + this.v1_prop + " " + (this.isGeq ? ">" : "<") + "= " + this.k2 + " * " + this.v2_obj.__toString + " + " + this.k3 + " * " + this.v3_obj.__toString + "." + this.v3_prop + " + " + this.k4 + " ." }

    Sketchpad.arith.SumInequalityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.SumInequalityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, true) 
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

    Sketchpad.geom.CoordinateConstraint.prototype.propertyTypes = {p: 'Point', c: 'Point'}

    Sketchpad.geom.CoordinateConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.c, this.p))
    }

    Sketchpad.geom.CoordinateConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p: {x: this.c.x, y: this.c.y}}
    }

    Sketchpad.geom.CoordinateConstraint.description = function() { return  "Sketchpad.geom.CoordinateConstraint(Point P, Number X, Number Y) states that point P should stay at coordinate (X, Y)." }

    Sketchpad.geom.CoordinateConstraint.prototype.description = function() { return  "point p (" + this.p.__toString + ") should stay at coordinate (" + this.c.x + ", " + this.c.y + ")." }

    Sketchpad.geom.CoordinateConstraint.prototype.effects = function() {
	return [{obj: this.p, props: ['x', 'y']}]
    }

    Sketchpad.geom.CoordinateConstraint.dummy = function(x, y) {
	var p1 = Point.dummy(x, y)
	var p2 = Point.dummy(y, x)
	return new Sketchpad.geom.CoordinateConstraint(p1, p2.x, p2.y)
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

    // Coincidence Constraint, i.e., I want these two points to be at the same place.

    Sketchpad.geom.CoincidenceConstraint = function Sketchpad__geom__CoincidenceConstraint(p1, p2) {
	this.p1 = p1
	this.p2 = p2
    }

    sketchpad.addClass(Sketchpad.geom.CoincidenceConstraint, true)

        Sketchpad.geom.CoincidenceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.p2, this.p1))
    }

    Sketchpad.geom.CoincidenceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(this.p2, this.p1), 0.5)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1))}
    }

    Sketchpad.geom.CoincidenceConstraint.description = function() { return  "Sketchpad.geom.CoincidenceConstraint(Point P1, Poiont P2) states that points P1 & P2 should be at the same place." }

    Sketchpad.geom.CoincidenceConstraint.prototype.description = function() { return  "points p1 (" + this.p1.__toString + ") & p2 (" + this.p2.__toString + ") should be at the same place." }
    
    Sketchpad.geom.CoincidenceConstraint.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	return new Sketchpad.geom.CoincidenceConstraint(l.p1, l.p2)
    }
   
    // Equivalence Constraint, i.e., I want the vectors p1->p2 and p3->p4 to be the same.

    Sketchpad.geom.EquivalenceConstraint = function Sketchpad__geom__EquivalenceConstraint(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.EquivalenceConstraint, true)

    Sketchpad.geom.EquivalenceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

    Sketchpad.geom.EquivalenceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)))
    }
    
    Sketchpad.geom.EquivalenceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.25)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1)), p3: plus(this.p3, scaledBy(splitDiff, -1)), p4: plus(this.p4, splitDiff)}
    }

    Sketchpad.geom.EquivalenceConstraint.description = function() { return  "Sketchpad.geom.EquivalenceConstraint(Point P1, Point P2, Point P3, Point P4) says line sections P1-2 and P3-4 are parallel and of the same lengths." }

    Sketchpad.geom.EquivalenceConstraint.prototype.description = function() { return  "line sections  p1 (" + this.p1.__toString + ") -p2 (" + this.p2.__toString + ") and  p3 (" + this.p3.__toString + ") -p4 (" + this.p4.__toString + ") are parallel and of the same lengths." }

    Sketchpad.geom.EquivalenceConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.EquivalenceConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
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

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}
    
    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)))
    }
    
    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.5)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1))}
    }

    Sketchpad.geom.OneWayEquivalenceConstraint.description = function() { return  "Sketchpad.geom.OneWayEquivalenceConstraint(Point P1, Point P2, Point P3, Point P4) says the vectors P1->P2 always matches with P3->P4" }

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.description = function() { return  "vectors p1 (" + this.p1.__toString + ") ->p2 (" + this.p2.__toString + ") always matches with p3 (" + this.p3.__toString + ") ->p4 (" + this.p4.__toString + ") ." }

    Sketchpad.geom.OneWayEquivalenceConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.OneWayEquivalenceConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    // Equal Distance constraint - keeps distances P1-->P2, P3-->P4 equal

    Sketchpad.geom.EqualDistanceConstraint = function Sketchpad__geom__EqualDistanceConstraint(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.EqualDistanceConstraint, true)
    
    Sketchpad.geom.EqualDistanceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

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

    Sketchpad.geom.EqualDistanceConstraint.description = function() { return  "Sketchpad.geom.EqualDistanceConstraint(Point P1, Point P2, Point P3, Point P4) keeps distances P1->P2, P3->P4 equal." }

    Sketchpad.geom.EqualDistanceConstraint.prototype.description = function() { return  "distances p1 (" + this.p1.__toString + ") ->p2 (" + this.p2.__toString + ") & p3 (" + this.p3.__toString + ") ->p4 (" + this.p4.__toString + ") are equal." }

    Sketchpad.geom.EqualDistanceConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.EqualDistanceConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    // Length constraint - maintains distance between P1 and P2 at L.

    Sketchpad.geom.LengthConstraint = function Sketchpad__geom__LengthConstraint(p1, p2, l, onlyOneWritable) {
	this.p1 = p1
	this.p2 = p2
	this.l = l
	this._onlyOneWritable = onlyOneWritable
    }

    sketchpad.addClass(Sketchpad.geom.LengthConstraint, true)

    Sketchpad.geom.LengthConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', l: 'Number'}

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
    
    Sketchpad.geom.LengthConstraint.description = function() { return  "Sketchpad.geom.LengthConstraint(Point P1, Point P2, Number L) says points P1 and P2 always maintain a distance of L." }

    Sketchpad.geom.LengthConstraint.prototype.description = function() { return  "points p1 (" + this.p1.__toString + ") and p2 (" + this.p2.__toString + ") always maintain a distance of " + this.l + "." }

    Sketchpad.geom.LengthConstraint.prototype.effects = function() {
	return [{obj: this.p1, props: ['x', 'y']}, {obj: this.p2, props: ['x', 'y']}]
    }

    Sketchpad.geom.LengthConstraint.dummy = function(x, y) {
	return new Sketchpad.geom.LengthConstraint(new Point(x - 50, y - 50), new Point(x + 50, y + 50), 100)
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

    Sketchpad.geom.OrientationConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point', theta: 'Number'}

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

	return {p1: rotatedAround(this.p1, dTheta, m12),
		p2: rotatedAround(this.p2, dTheta, m12),
		p3: rotatedAround(this.p3, -dTheta, m34),
		p4: rotatedAround(this.p4, -dTheta, m34)}
    }

    Sketchpad.geom.OrientationConstraint.description = function() { return  "Sketchpad.geom.OrientationConstraint(Point P1, Point P2, Point P3, Point P4, Number Theta) maintains angle between P1->P2 and P3->P4 at Theta." }

    Sketchpad.geom.OrientationConstraint.prototype.description = function() { return  "angle is maintained between p1 (" + this.p1.__toString + ") ->p2 (" + this.p2.__toString + ") and p3 (" + this.p3.__toString + ") ->p4 (" + this.p4.__toString + ") at " + this.theta + " radians." }

    Sketchpad.geom.OrientationConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.OrientationConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
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

    Sketchpad.geom.MotorConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', w: 'Number'}
    
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

    Sketchpad.geom.MotorConstraint.description = function() { return  "Sketchpad.geom.MotorConstraint(Point P1, Point P2, Number W) causes P1 and P2 to orbit their midpoint at the given rate of w, in units of Hz: whole rotations per second." } 

    Sketchpad.geom.MotorConstraint.prototype.description = function() { return  "p1 (" + this.p1.__toString + ") and p2 (" + this.p2.__toString + ") to orbit their midpoint at the given rate of " + this.w + ", in units of Hz: whole rotations per second." } 
    
    Sketchpad.geom.MotorConstraint.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	return new Sketchpad.geom.MotorConstraint(l.p1, l.p2, 1)
    }
    
    Sketchpad.geom.CartesianPointConstraint = function  Sketchpad__geom__CartesianPointConstraint(position, vector, origin, unit) {
	this.position = position
	this.vector = vector
	this.origin = origin
	this.unit = unit
    }
    
    sketchpad.addClass(Sketchpad.geom.CartesianPointConstraint, true)
    
    Sketchpad.geom.CartesianPointConstraint.description = function() {
	return "Sketchpad.geom.CartesianPointConstraint(Point P, Vector V, Point O, Number U) states that P should be positioned based on vector V's X and Y discrete coordinate values, and on origin O and each unit on axis having a vertical and horizontal length of U"
    }

    Sketchpad.geom.CartesianPointConstraint.prototype.description = function() {
	return "" + this.position.__toString + " should be positioned based on vector " + this.vector.__toString + "'s X and Y discrete coordinate values, and on origin " + this.origin.__toString + " and each unit on axis having a vertical and horizontal length of " + this.unit
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

    Sketchpad.simulation.TimerConstraint.description = function() { return "Sketchpad.simulation.Timer(Timer T) states the system advances its pseudo-time by T's step size at each frame cycle." }

    Sketchpad.simulation.TimerConstraint.prototype.description = function() { return "the system advances its pseudo-time by " + this.timer.stepSize + " at each frame cycle." }

    Sketchpad.simulation.TimerConstraint.prototype.propertyTypes = {timer: 'Timer'}

    Sketchpad.simulation.TimerConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return 0
    }
    
    Sketchpad.simulation.TimerConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {}
    }

    Sketchpad.simulation.TimerConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.TimerConstraint(Sketchpad.simulation.Timer.dummy(x, y))
    }
    
    Sketchpad.simulation.TimerConstraint.prototype.proposeNextPseudoTime = function(pseudoTime) {
	return pseudoTime + this.timer.stepSize
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

    Sketchpad.simulation.ValueSliderConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.ValueSliderConstraint(Point.dummy(x, y), 'x', 0, 100, {foo: 0}, 'foo')
    }

    // Motion Constraint

    Sketchpad.simulation.VelocityConstraint = function Sketchpad__simulation__VelocityConstraint(body) {
	this.body = body
	this.position = body.position
	this.velocity = body.velocity
    }

    sketchpad.addClass(Sketchpad.simulation.VelocityConstraint, true)

    Sketchpad.simulation.VelocityConstraint.prototype.propertyTypes = {body: 'FreeBody'}

    Sketchpad.simulation.VelocityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity, dt)), this.position))
    }
    
    Sketchpad.simulation.VelocityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity, dt))}
    }
    
    Sketchpad.simulation.VelocityConstraint.description = function() { return  "Sketchpad.simulation.VelocityConstraint(FreeBody Body) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.VelocityConstraint.prototype.description = function() { return  "for Body " + this.body.__toString + " Pos = old(Pos) + (" + this.velocity.x + "," +  this.velocity.y + ") * dt, where dt is the frame step time amount." }


    Sketchpad.simulation.VelocityConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.VelocityConstraint(FreeBody.dummy(x, y))
    }

    Sketchpad.simulation.VelocityConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	this.lastPosition = scaledBy(this.position, 1)
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

    Sketchpad.simulation.VelocityConstraint2.prototype.propertyTypes = {body: 'FreeBody', velocity: 'PointVector'}

    Sketchpad.simulation.VelocityConstraint2.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt)), this.position))
    }
    
    Sketchpad.simulation.VelocityConstraint2.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt))}
    }

    Sketchpad.simulation.VelocityConstraint2.description = function() { return  "Sketchpad.simulation.VelocityConstraint2(FreeBody Body, PointVector Velocity) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.VelocityConstraint2.prototype.description = function() { return  "for Body " + this.body.__toString + ": Pos = old(Pos) + (vector " + this.velocity.__toString + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation.VelocityConstraint2.dummy = function(x, y) {
	return new Sketchpad.simulation.VelocityConstraint2(FreeBody.dummy(x, y), PointVector.dummy(x, y))
    }
    
    Sketchpad.simulation.VelocityConstraint2.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastPosition = scaledBy(this.position, 1)
    }
    
    // Acceleration Constraint

    Sketchpad.simulation.AccelerationConstraint = function Sketchpad__simulation__AccelerationConstraint(body, acceleration) {
	this.body = body
	this.velocity = body.velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation.AccelerationConstraint, true)
    
    Sketchpad.simulation.AccelerationConstraint.prototype.propertyTypes = {body: 'FreeBody', acceleration: 'Vector'}

    Sketchpad.simulation.AccelerationConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastVelocity, scaledBy(this.acceleration, dt)), this.velocity))
    }

    Sketchpad.simulation.AccelerationConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {velocity: plus(this.lastVelocity, scaledBy(this.acceleration, dt))}
    }

    Sketchpad.simulation.AccelerationConstraint.description = function() { return  "Sketchpad.simulation.AccelerationConstraint(FreeBody Body, Vector Acceleration) states for Body: Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.AccelerationConstraint.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) + (" + this.acceleration.x + "," +  this.acceleration.y + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation.AccelerationConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.AccelerationConstraint(FreeBody.dummy(x, y), Sketchpad.geom.Vector.dummy(x + 50, y + 50))
    }

    Sketchpad.simulation.AccelerationConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    // Air Resistance Constraint

    Sketchpad.simulation.AirResistanceConstraint = function Sketchpad__simulation__AirResistanceConstraint(body, scale) {
	this.body = body
	this.velocity = body.velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation.AirResistanceConstraint, true)

    Sketchpad.simulation.AirResistanceConstraint.prototype.propertyTypes = {scale: 'Number', velocity: 'Vector'}

    Sketchpad.simulation.AirResistanceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(scaledBy(this.lastVelocity, this.scale), this.velocity))
    }

    Sketchpad.simulation.AirResistanceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: scaledBy(this.lastVelocity, this.scale)}
    }

    Sketchpad.simulation.AirResistanceConstraint.description = function() { return  "Sketchpad.simulation.AirResistanceConstraint(FreeBody Body) states for Body: Velocity = old(Velocity) * Scale ." }

    Sketchpad.simulation.AirResistanceConstraint.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) * " + this.scale +" ." }

    Sketchpad.simulation.AirResistanceConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.AirResistanceConstraint(Sketchpad.geom.Vector.dummy(x, y), .1)
    }

    Sketchpad.simulation.AirResistanceConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
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

    Sketchpad.simulation.BounceConstraint.prototype.propertyTypes = {body: 'FreeBody', surfaceP1: 'Point', surfaceP2: 'Point'}
    
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

    Sketchpad.simulation.BounceConstraint.description = function() { return  "Sketchpad.simulation.BounceConstraint(FreeBody Body, Point End1, Point End2) states that the Body with diameter L and position Pos and velocity vector Vel is going to bounce off the line with two end points End1 & End2." }

    Sketchpad.simulation.BounceConstraint.prototype.description = function() { return  "Body " + this.body.__toString + " with diameter L and position Pos and velocity vector Vel is going to bounce off the line with two end points " + this.surfaceP1.__toString + " & " + this.surfaceP2.__toString + "." }

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

    Sketchpad.simulation.HitSurfaceConstraint.prototype.propertyTypes = {body: 'FreeBody', surfaceP1: 'Point', surfaceP2: 'Point'}

    Sketchpad.simulation.HitSurfaceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.contact ? (
	    magnitude(minus(this.hitVelocity, this.velocity)) + 
		magnitude(minus(this.hitPosition, this.position)) 
	) : 0
    }

    Sketchpad.simulation.HitSurfaceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: this.hitVelocity, position: this.hitPosition}
    }

    Sketchpad.simulation.HitSurfaceConstraint.description = function() { return  "Sketchpad.simulation.HitSurfaceConstraint(FreeBody Body, Point End1, Point End2) states that the Body with diameter L and position Pos and velocity vector Vel is going to land and stay on the line with two end points End1 & End2." }

    Sketchpad.simulation.HitSurfaceConstraint.prototype.description = function() { return  "Body " + this.body.__toString + " with diameter L and position Pos and velocity vector Vel is going to land and stay on the line with two end points " + this.surfaceP1.__toString + " & " + this.surfaceP2.__toString + "." }

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
    
    // Conveyor Belt Constraint

    Sketchpad.simulation.ConveyorBeltConstraint = function Sketchpad__simulation__ConveyorBeltConstraint(body, belt) {
	this.body = body
	this.halfLength = body.radius
	this.position = body.position
	this.velocity = body.velocity
	this.belt = belt
    }

    sketchpad.addClass(Sketchpad.simulation.ConveyorBeltConstraint, true)

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.propertyTypes = {body: 'FreeBody', belt: 'Belt'}

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	//var belt = this.belt
	//var beltP1 = belt.position1
	//var beltP2 = belt.position2
	//return (Sketchpad.simulation.detectContact(this.halfLength, this.position, this.velocity, beltP1, beltP2)) ? 1 : 0	
	return this.contact ? magnitude(minus(this.targetVelocity, this.velocity)) : 0
    }

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: this.targetVelocity}
    }

    Sketchpad.simulation.ConveyorBeltConstraint.description = function() { return  "Sketchpad.simulation.ConveyorBeltConstraint(Number L, FreeBody Body, ConveyorBelt Belt) states that the body with diameter L and position Pos and velocity vector Vel is going to land and move based on the conveyor belt Belt's velocity." }

    Sketchpad.simulation.ConveyorBeltConstraint.prototype.description = function() { return  "Body" + this.body.__toString + " with diameter L and position Pos and velocity vector Vel is going to land and move based on the conveyor belt Belt " + this.belt.__toString + "'s velocity." }

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
    
    Sketchpad.simulation.NoOverlapConstraint.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody'}

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

    Sketchpad.simulation.NoOverlapConstraint.description = function() { return  "Sketchpad.simulation.NoOverlapConstraint(FreeBody Body1, FreeBody Body1) states that the Body1 with diameter L1 and position Pos1 and velocity vector Vel1 and the Body2 with diameter L2 and position Pos2 and velocity vector Vel2 will push each other if touching." }

    Sketchpad.simulation.NoOverlapConstraint.prototype.description = function() { return  "Body " + this.body1.__toString + " with diameter L1 and position Pos1 and velocity vector Vel1 and the Body " + this.body2.__toString + " with diameter L2 and position Pos2 and velocity vector Vel2 will push each other if touching." }

    Sketchpad.simulation.NoOverlapConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.NoOverlapConstraint(FreeBody.dummy(x, y), FreeBody.dummy(x +100, y + 100))
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

    Sketchpad.simulation.SpringConstraint.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody', spring: 'Spring'}

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

    Sketchpad.simulation.SpringConstraint.description = function() { return  "Sketchpad.simulation.SpringConstraint(FreeBody Body1, FreeBody Body2, Spring S) states that spring S has been attached to two bodies Body1 and Body2." }

    Sketchpad.simulation.SpringConstraint.prototype.description = function() { return  "spring " + this.spring.__toString + " has been attached to two bodies " + this.body1.__toString + " and " + this.body2.__toString + "." }

    Sketchpad.simulation.SpringConstraint.dummy = function(x, y) {
	return new Sketchpad.simulation.SpringConstraint(FreeBody.dummy(x, y), FreeBody.dummy(x+100, y+100), Sketchpad.simulation.Spring.dummy(x, y))
    }

    //  OrbitalMotion Constraint

    Sketchpad.simulation.OrbitalMotionConstraint = function Sketchpad__simulation__OrbitalMotionConstraint(sun, moon, distanceDownscale) {
	this.sun = sun
	this.moon = moon
	this.acceleration = moon.acceleration
	this.distanceDownscale = (distanceDownscale || (1e9 / 2))
    }

    sketchpad.addClass(Sketchpad.simulation.OrbitalMotionConstraint, true)

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.propertyTypes = {sun: 'FreeBody', moon: 'FreeBody'}

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	this._targetAcceleration = this.currentGravityAcceleration()
	return magnitude(minus(this._targetAcceleration, this.acceleration))	
    }

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {acceleration: this._targetAcceleration}
    }

    Sketchpad.simulation.OrbitalMotionConstraint.description = function() { return  "Sketchpad.simulation.OrbitalMotionConstraint(FreeBody Sun, FreeBody Moon) states that Moon body is orbiting around Sun body according to simple orbital motion formula." }

    Sketchpad.simulation.OrbitalMotionConstraint.prototype.description = function() { return  "Moon body " + this.moon.__toString + " is orbiting around Sun body " + this.sun.__toString + " according to simple orbital motion formula." }

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

    Sketchpad.geom3d.CoordinateConstraint.prototype.propertyTypes = {p: 'Point3D', c: 'Point3D'}

    Sketchpad.geom3d.CoordinateConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.c, this.p))
    }

    Sketchpad.geom3d.CoordinateConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p: {x: this.c.x, y: this.c.y, z: this.c.z}}
    }

    Sketchpad.geom3d.CoordinateConstraint.description = function() { return  "Sketchpad.geom3d.CoordinateConstraint(Point P, Number X, Number Y, Number Z) states that point P should stay at coordinate (X, Y, Z)." }

    Sketchpad.geom3d.CoordinateConstraint.prototype.description = function() { return  "point " + this.p.__toString + " should stay at coordinate (" + this.c.x + ", " + this.c.y + ", " + this.c.z + ")." }

    Sketchpad.geom3d.CoordinateConstraint.prototype.effects = function() {
	return [{obj: this.p, props: ['x', 'y', 'z']}]
    }

    // Length constraint - maintains distance between P1 and P2 at L.

    Sketchpad.geom3d.LengthConstraint = function Sketchpad__geom3d__LengthConstraint(p1, p2, l) {
	this.p1 = p1
	this.p2 = p2
	this.l = l
    }

    sketchpad.addClass(Sketchpad.geom3d.LengthConstraint, true)

    Sketchpad.geom3d.LengthConstraint.prototype.propertyTypes = {p1: 'Point3D', p2: 'Point3D', l: 'Number'}
    
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

    Sketchpad.geom3d.LengthConstraint.description = function() { return  "Sketchpad.geom3d.LengthConstraint(Point3D P1, Point3D P2, Number L) says points P1 and P2 always maintain a distance of L." }

    Sketchpad.geom3d.LengthConstraint.prototype.description = function() { return  "points " + this.p1.__toString + " and " + this.p2.__toString + " always maintain a distance of " + this.l + "." }

    Sketchpad.geom3d.LengthConstraint.prototype.effects = function() {
	return [{obj: this.p1, props: ['x', 'y', 'z']}, {obj: this.p2, props: ['x', 'y', 'z']}]
    }


    // Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
    // w is in units of Hz - whole rotations per second.

    Sketchpad.geom3d.MotorConstraint = function Sketchpad__geom__MotorConstraint(p1, p2, w) {
	this.p1 = p1
	this.p2 = p2
	this.w = w
    }

    sketchpad.addClass(Sketchpad.geom3d.MotorConstraint, true)

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

    Sketchpad.geom3d.MotorConstraint.description = function() { return  "Sketchpad.geom3d.MotorConstraint(Point P1, Point P2, Number W) causes P1 and P2 to orbit their midpoint at the given rate of w, in units of Hz: whole rotations per second." } 

    Sketchpad.geom3d.MotorConstraint.prototype.description = function() { return  "" + this.p1.__toString + " and " + this.p2.__toString + " to orbit their midpoint at the given rate of " + this.w + ", in units of Hz: whole rotations per second." }
            
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

    Sketchpad.simulation3d.VelocityConstraint.prototype.propertyTypes = {body: 'FreeBody'}

    Sketchpad.simulation3d.VelocityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity, dt)), this.position))
    }

    Sketchpad.simulation3d.VelocityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity, dt))}
    }

    Sketchpad.simulation3d.VelocityConstraint.description = function() { return  "Sketchpad.simulation3d.VelocityConstraint(FreeBody Body) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityConstraint.prototype.description = function() { return  "for Body " + this.body.__toString + " Pos = old(Pos) + (" + this.velocity.x + "," +  this.velocity.y + "," +  this.velocity.z + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation3d.VelocityConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	this.lastPosition = scaledBy(this.position, 1)
    }
    
    // Body With Velocity Constraint

    Sketchpad.simulation3d.VelocityConstraint2 = function Sketchpad__simulation3d__VelocityConstraint2(body, velocity) {
	this.body = body
	this.position = body.position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityConstraint2, true)

    Sketchpad.simulation3d.VelocityConstraint2.prototype.propertyTypes = {body: 'FreeBody', velocity: 'Point'}
    
    Sketchpad.simulation3d.VelocityConstraint2.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt)), this.position))
    }
    
    Sketchpad.simulation3d.VelocityConstraint2.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt))}
    }

    Sketchpad.simulation3d.VelocityConstraint2.description = function() { return  "Sketchpad.simulation3d.VelocityConstraint2(FreeBody Body, PointVector3D Velocity) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityConstraint2.prototype.description = function() { return  "for Body " + this.body.__toString + ": Pos = old(Pos) + (" + this.velocity.x + "," +  this.velocity.y + "," +  this.velocity.z + ") * dt, where dt is the frame step time amount ." }
    
    Sketchpad.simulation3d.VelocityConstraint2.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastPosition = scaledBy(this.position, 1)
    }

    // Acceleration Constraint

    Sketchpad.simulation3d.AccelerationConstraint = function Sketchpad__simulation3d__AccelerationConstraint(body, acceleration) {
	this.body = body
	this.velocity = body.velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation3d.AccelerationConstraint, true)

    Sketchpad.simulation3d.AccelerationConstraint.prototype.propertyTypes = {body: 'FreeBody', velocity: 'Vector3D'}

    Sketchpad.simulation3d.AccelerationConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastVelocity, scaledBy(this.acceleration, dt)), this.velocity))
    }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {velocity: plus(this.lastVelocity, scaledBy(this.acceleration, dt))}
    }

    Sketchpad.simulation3d.AccelerationConstraint.description = function() { return  "Sketchpad.simulation3d.AccelerationConstraint(FreeBody Body, Vector Acceleration) states for Body: Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) + (" + this.acceleration.x + "," +  this.acceleration.y + "," +  this.acceleration.z + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    // Air Resistance Constraint

    Sketchpad.simulation3d.AirResistanceConstraint = function Sketchpad__simulation3d__AirResistanceConstraint(body, scale) {
	this.body = body
	this.velocity = body.velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation3d.AirResistanceConstraint, true)

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.propertyTypes = {scale: 'Number', body: 'FreeBody'}

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(scaledBy(this.lastVelocity, this.scale), this.velocity))
    }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: scaledBy(this.lastVelocity, this.scale)}
    }

    Sketchpad.simulation3d.AirResistanceConstraint.description = function() { return  "Sketchpad.simulation3d.AirResistanceConstraint(FreeBody Body, Number Scale) states for Body: Velocity = old(Velocity) * Scale ." }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) * " + this.scale +" ." }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
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
    
    Sketchpad.simulation3d.SpringConstraint.description = function() { return  "Sketchpad.simulation3d.SpringConstraint(FreeBody Body1, FreeBody Body2, Spring S) states that spring S has been attached to two bodies Body1 and Body2." }

    Sketchpad.simulation3d.SpringConstraint.prototype.description = function() { return  "spring " + this.spring.__toString + " has been attached to two bodies " + this.body1.__toString + " and " + this.body2.__toString + "." }


    //  OrbitalMotion Constraint

    Sketchpad.simulation3d.OrbitalMotionConstraint = function Sketchpad__simulation3d__OrbitalMotionConstraint(sun, moon, distanceDownscale) {
	this.sun = sun
	this.moon = moon
	this.acceleration = moon.acceleration
	this.distanceDownscale = (distanceDownscale || (1e9 / 2))
    }

    sketchpad.addClass(Sketchpad.simulation3d.OrbitalMotionConstraint, true)

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.propertyTypes = {sun: 'FreeBody', moon: 'FreeBody'}

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	this._targetAcceleration = this.currentGravityAcceleration()
	return magnitude(minus(this._targetAcceleration, this.acceleration))	
    }

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {acceleration: this._targetAcceleration}
    }

    Sketchpad.simulation3d.OrbitalMotionConstraint.description = function() { return  "Sketchpad.simulation3d.OrbitalMotionConstraint(FreeBody Sun, FreeBody Moon) states that Moon body is orbiting around Sun body according to simple orbital motion formula." }

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.description = function() { return  "Moon body " + this.moon.__toString + " is orbiting around Sun body " + this.sun.__toString + " according to simple orbital motion formula." }

    Sketchpad.simulation3d.OrbitalMotionConstraint.prototype.currentGravityAcceleration = function() {
	var p1 = this.moon.position, p2 = this.sun.position
	var dist0 = distance(p1, p2)
	var dist = dist0 * this.distanceDownscale	
	var aMag0 = (Sketchpad.simulation3d.G * this.sun.mass) / (dist * dist)
	var aMag = aMag0 / this.distanceDownscale
	var slopeV = Sketchpad.simulation.slopeVector({x: p1.x, y: p1.z}, {x: p2.x, y: p2.z}) //cheat to use 2D X-Z plane
	return {x: slopeV.x * aMag, y: 0, z: slopeV.y * aMag}
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
    this.numberOfSameErrorOcurrToBeConsideredConvergence = 20
    this.debug = false
    this.solveEvenWithoutError = false
    this.solveEvenWithoutErrorOnPriorityDifferences = false
    this.constraints = []
    this.constraintTreeList = {}
    this.disabledConstraints = {}
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

Sketchpad.prototype.addConstraint = function(constraint, wasDisabled) {
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
    if (wasDisabled)
	delete this.disabledConstraints[constraint.__id]
    else {
	var cTp = constraint.__type    
	if (!this.constraintTreeList[cTp])
	    this.constraintTreeList[cTp] = []
	this.constraintTreeList[cTp].push(constraint)
    }
    for (var p in constraint) {
	if (constraint.hasOwnProperty(p)) {
	    var obj = constraint[p]
	    if (obj !== undefined && !this.objMap[obj.__id])
		this.objMap[obj.__id] = obj
	}
    }
    this.converged = false    
    return constraint
}

Sketchpad.prototype.removeConstraint = function(unwantedConstraint, markAsDisabled) {
    var self = this
    var removed = [unwantedConstraint]
    this.constraints = this.constraints.filter(function(constraint) {
	var keep = true
	if (constraint === unwantedConstraint) {
	    keep = false
	} else {
	    keep = !involves(constraint, unwantedConstraint)
	    if (!keep)
		removed.push(constraint)
	}
	return keep
    })
    var tree = this.constraintTreeList
    removed.forEach(function(constraint) {
	if (markAsDisabled) {
	    self.disabledConstraints[constraint.__id] = constraint	
	} else {
	    var list = tree[constraint.__type]
	    list.splice(list.indexOf(constraint), 1)
	}
    })
    if (this.solveEvenWithoutErrorOnPriorityDifferences)
	this.computePerThingPerPropertyEffectors()
    this.converged = false    
}

Sketchpad.prototype.clear = function() {
    this.rho = 1
    this.epsilon = 0.01
    this.searchOn = false
    this.solveEvenWithoutError = false
    this.solveEvenWithoutErrorOnPriorityDifferences = false
    this.constraints = []
    this.constraintTreeList = {}
    this.disabledConstraints = {}
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
    this.converged = false    
    this.errorUnmovedCount = 0
    this.lastIterationError = undefined
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
    if (proposals.length > 0) {	
	this.pseudoTime = this.computeNextPseudoTimeFromProposals(pseudoTime, proposals)
	this.converged = false
    }
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

Sketchpad.prototype.checkConvergence = function (currError) {
    if (currError <= this.epsilon) {
	this.converged = true
    } else {
	this.errorUnmovedCount = (this.lastIterationError == currError) ? (this.errorUnmovedCount + 1) : 0
	if (this.errorUnmovedCount == this.numberOfSameErrorOcurrToBeConsideredConvergence) {
	    this.converged = true
	    this.errorUnmovedCount = 0
	} else 
	    this.converged = false
    }
    this.lastIterationError = currError
}

Sketchpad.prototype.solveForUpToMillis = function(tMillis) {
    this.doTasksOnEachTimeStep(this.pseudoTime, this.prevPseudoTime)
    var res
    if (this.searchOn)	
	res = this.iterateSearchChoicesForUpToMillis(tMillis)
    else
	res = this.iterateForUpToMillis(tMillis)
    this.checkConvergence(res.error)
    this.doTasksAfterEachTimeStep(this.pseudoTime, this.prevPseudoTime)
    return res
}

Sketchpad.prototype.doOneIterationAsEntirePhase = function(timeMillis) {
    var res = this.doOneIteration(timeMillis)
    this.checkConvergence(res)
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
    if (this.events.length > 0)
	this.converged = false
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8yZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvM2Qvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0aUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ253QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGFyaXRobWV0aWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLmFyaXRoID0ge31cblxuICAgIC8vIEhlbHBlcnNcblxuICAgIGZ1bmN0aW9uIGluc3RhbGxSZWYodGFyZ2V0LCByZWYsIHByZWZpeCkge1xuXHR0YXJnZXRbcHJlZml4ICsgJ19vYmonXSA9IHJlZi5vYmpcblx0dGFyZ2V0W3ByZWZpeCArICdfcHJvcCddID0gcmVmLnByb3BcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWYodGFyZ2V0LCBwcmVmaXgpIHtcblx0cmV0dXJuIHRhcmdldFtwcmVmaXggKyAnX29iaiddW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmblJlZih0YXJnZXQsIHByZWZpeCkge1xuXHR2YXIgcmN2ciA9IHRhcmdldFtwcmVmaXggKyAnX29iaiddXG5cdHJldHVybiByY3ZyW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV0uY2FsbChyY3ZyKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhdGNoKHRhcmdldCAvKiAsIHByZWZpeCwgbmV3VmFsLCAuLi4gKi8pIHtcblx0dmFyIHJlc3VsdCA9IHt9XG5cdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG5cdCAgICB2YXIgcHJlZml4ID0gYXJndW1lbnRzW2ldXG5cdCAgICB2YXIgbmV3VmFsID0gYXJndW1lbnRzW2krMV1cblx0ICAgIHZhciBkID0gcmVzdWx0W3ByZWZpeCArICdfb2JqJ11cblx0ICAgIGlmICghZCkge1xuXHRcdHJlc3VsdFtwcmVmaXggKyAnX29iaiddID0gZCA9IHt9XG5cdCAgICB9XG5cdCAgICBkW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV0gPSBuZXdWYWxcblx0fVxuXHRyZXR1cm4gcmVzdWx0XG4gICAgfVxuXG4gICAgLy8gVmFsdWUgQ29uc3RyYWludCwgaS5lLiwgby5wID0gdmFsdWVcblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19WYWx1ZUNvbnN0cmFpbnQocmVmLCB2YWx1ZSkge1xuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZiwgJ3YnKVxuXHR0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludCwgdHJ1ZSlcbiAgICBcbiAgICBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy52YWx1ZSAtIHJlZih0aGlzLCAndicpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gcGF0Y2godGhpcywgJ3YnLCB0aGlzLnZhbHVlKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQoe29iajogTywgcHJvcDogcH0sIFZhbHVlKSBzdGF0ZXMgdGhhdCBPLnAgPSBWYWx1ZS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy52X29iai5fX3RvU3RyaW5nICsgXCIuXCIgKyB0aGlzLnZfcHJvcCArIFwiID0gXCIgKyB0aGlzLnZhbHVlICsgXCIuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlZhbHVlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguVmFsdWVDb25zdHJhaW50KHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCA0MikgXG4gICAgfVxuXG4gICAgLy8gRXF1YWxpdHkgQ29uc3RyYWludCwgaS5lLiwgazEgKiBvMS5wMSA9IGsyICogbzIucDJcblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19FcXVhbGl0eUNvbnN0cmFpbnQocmVmMSwgcmVmMiwgb3B0T25seVdyaXRlVG8sIGsxLCBrMikge1xuXHR0aGlzLmsxID0gazEgfHwgMSwgdGhpcy5rMiA9IGsyIHx8IDFcblx0aW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpXG5cdHRoaXMub25seVdyaXRlVG8gPSBvcHRPbmx5V3JpdGVUbyB8fCBbMSwgMl1cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkaWZmID0gKHRoaXMuazEgKiByZWYodGhpcywgJ3YxJykpIC0gKHRoaXMuazIgKiByZWYodGhpcywgJ3YyJykpXG5cdHJldHVybiBkaWZmXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjEgPSB0aGlzLmsxICogcmVmKHRoaXMsICd2MScpLCB2MiA9IHRoaXMuazIgKiByZWYodGhpcywgJ3YyJylcblx0a3MgPSBbdGhpcy5rMSwgdGhpcy5rMl1cblx0dmFyIHZzID0gW3YxLCB2Ml1cblx0dmFyIG9ubHlXcml0ZVRvID0gdGhpcy5vbmx5V3JpdGVUb1xuXHR2YXIgZGlmZiA9IHYxIC0gdjJcblx0dmFyIGRpdiA9IG9ubHlXcml0ZVRvLmxlbmd0aFxuXHR2YXIgYXJncyA9IFt0aGlzXVxuXHRvbmx5V3JpdGVUby5mb3JFYWNoKGZ1bmN0aW9uKGkpIHsgdmFyIHNpZ24gPSBpID4gMSA/IDEgOiAtMTsgYXJncy5wdXNoKCd2JyArIGkpOyBhcmdzLnB1c2goKHZzW2kgLSAxXSArIHNpZ24gKiBkaWZmIC8gZGl2KSAvIGtzW2kgLSAxXSkgfSlcblx0cmVzID0gcGF0Y2guYXBwbHkodGhpcywgYXJncylcblx0cmV0dXJuIHJlcyAvL3BhdGNoKHRoaXMsICd2MScsIHYxIC0gKGRpZmYgLyAyKSwgJ3YyJywgdjIgKyBkaWZmIC8gMilcbiAgICB9XG5cbiAgICBcbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50KHtvYmo6IE8xLCBwcm9wOiBwMX0sIHtvYmo6IE8yLCBwcm9wOiBwMn0sIFdyaXRhYmxlSWR4cywgTnVtYmVyIEsxLCBOdW1iZXIgSzIpIHN0YXRlcyB0aGF0IEsxICogTzEucDEgPSBLMiAqIE8yLnAyIC4gQ29uc3RhbnRzIEsxLTIgZGVmYXVsdCB0byAxLiBPcHRpb25hbCBXcml0YWJsZUlkeHMgZ2l2ZXMgYSBsaXN0IG9mIGluZGljZXMgKGVsZW1lbnRzIDEsYW5kL29yIDIpIHRoZSBjb25zdHJhaW50IGlzIGFsbG93ZWQgdG8gY2hhbmdlLFwiIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgdGhpcy5rMSArIFwiICogXCIgKyB0aGlzLnYxX29iai5fX3RvU3RyaW5nICsgXCIuXCIgKyB0aGlzLnYxX3Byb3AgKyBcIiA9IFwiICsgdGhpcy5rMiArIFwiICogXCIgKyB0aGlzLnYyX29iai5fX3RvU3RyaW5nICsgXCIuXCIgKyB0aGlzLnYyX3Byb3AgKyBcIiAuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMudjFfb2JqLCBwcm9wczogW3RoaXMudjFfcHJvcF19LCB7b2JqOiB0aGlzLnYyX29iaiwgcHJvcHM6IFt0aGlzLnYyX3Byb3BdfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9KSBcbiAgICB9XG5cbiAgICAvLyBPbldheUVxdWFsaXR5IENvbnN0cmFpbnQsIGkuZS4sIG8xLnAxID0gbzIucDJcblxuICAgIFNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbGl0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19PbmVXYXlFcXVhbGl0eUNvbnN0cmFpbnQocmVmMSwgcmVmMiwgb3B0U2Vjb25kUHJvcElzRm4pIHtcblx0aW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpXG5cdHRoaXMuc2Vjb25kUHJvcElzRm4gPSBvcHRTZWNvbmRQcm9wSXNGblxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxpdHlDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmFyaXRoLk9uZVdheUVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYyID0gdGhpcy5zZWNvbmRQcm9wSXNGbiA/IGZuUmVmKHRoaXMsICd2MicpIDogcmVmKHRoaXMsICd2MicpXG5cdHZhciBlID0gcmVmKHRoaXMsICd2MScpID09IHYyID8gMCA6IDFcblx0cmV0dXJuIGVcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MiA9IHRoaXMuc2Vjb25kUHJvcElzRm4gPyBmblJlZih0aGlzLCAndjInKSA6IHJlZih0aGlzLCAndjInKVxuXHRyZXR1cm4gcGF0Y2godGhpcywgJ3YxJywgdjIpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbGl0eUNvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbGl0eUNvbnN0cmFpbnQoe29iajogTzEsIHByb3A6IHAxfSwge29iajogTzIsIHByb3A6IHAyfSwgQm9vbGVhbiBzZWNvbmRQcm9wSXNGbikgc3RhdGVzIHRoYXQgTzEucDEgPSBPMi5wMiAocmlnaHQgaGFuZC1zaWRlIGlzICByZWFkLW9ubHkpLiBJZiBzZWNvbmRQcm9wSXNGbiA9IHRydWUgdGhlbiBPMi5wMigpIGlzIGludm9rZWQgaW5zdGVhZC5cIiB9XG4gICAgXG4gICAgU2tldGNocGFkLmFyaXRoLk9uZVdheUVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgIHZhciByMSA9IHJlZih0aGlzLCAndjEnKSwgcjIgPSByZWYodGhpcywgJ3YyJyk7IHJldHVybiAgdGhpcy52MV9vYmouX190b1N0cmluZyArIFwiLlwiICsgdGhpcy52MV9wcm9wICsgXCIgPSBcIiArIHRoaXMudjJfb2JqLl9fdG9TdHJpbmcgKyBcIi5cIiArIHRoaXMudjJfcHJvcCArIFwiIGFuZCByaWdodCBoYW5kLXNpZGUgaXMgcmVhZC1vbmx5LlwiIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnYxX29iaiwgcHJvcHM6IFt0aGlzLnYxX3Byb3BdfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxpdHlDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbGl0eUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9KSBcbiAgICB9XG5cbiAgICAvLyBJbmVxdWFsaXR5IENvbnN0cmFpbnQsIGkuZS4sIGsxICogbzEucDEgPj0gazIgKiBvMi5wMiArIGszIG9yIGsxICogbzEucDEgPD0gazIgKiBvMi5wMiArIGszXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19JbmVxdWFsaXR5Q29uc3RyYWludChyZWYxLCByZWYyLCBpc0dlcSwgazEsIGsyLCBrMykge1xuXHR0aGlzLmsxID0gazEgfHwgMSwgdGhpcy5rMiA9IGsyIHx8IDEsIHRoaXMuazMgPSBrMyB8fCAwXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMSwgJ3YxJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYyLCAndjInKVxuXHR0aGlzLmlzR2VxID0gaXNHZXFcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLkluZXF1YWxpdHlDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkluZXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjEgPSB0aGlzLmsxICogcmVmKHRoaXMsICd2MScpICwgdjIgPSAodGhpcy5rMiAqIHJlZih0aGlzLCAndjInKSkgKyB0aGlzLmszLCBjb25kID0gdGhpcy5pc0dlcSA/IHYxID49IHYyIDogdjEgPD0gdjIsIGUgPSBjb25kID8gMCA6IHYyIC0gdjFcblx0cmV0dXJuIGVcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYyID0gKHRoaXMuazIgKiByZWYodGhpcywgJ3YyJykpICsgdGhpcy5rM1xuXHRyZXMgPSBwYXRjaCh0aGlzLCAndjEnLCB2MiAvIHRoaXMuazEpXG5cdHJldHVybiByZXNcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5JbmVxdWFsaXR5Q29uc3RyYWludCh7b2JqOiBPMSwgcHJvcDogcDF9LCB7b2JqOiBPMiwgcHJvcDogcDJ9LCBpc0dlcSwgTnVtYmVyIEsxLCBOdW1iZXIgSzIsIE51bWJlciBLMykgc3RhdGVzIHRoYXQgSzEgKiBPMS5wMSA+PSBLMiAqIE8yLnAyICsgSzMgKHdoZW4gaXNHZXE9dHJ1ZSkgb3IgSzEgKiBPMS5wMSA8PSBLMiAqIE8yLnAyICsgSzMgKHdoZW4gaXNHZXE9ZmFsc2UpLiBDb25zdGFudHMgSzEtMiBkZWZhdWx0IHRvIDEgYW5kIEszIHRvIDBcIiB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHZhciByMSA9IHJlZih0aGlzLCAndjEnKSwgcjIgPSByZWYodGhpcywgJ3YyJyk7IHJldHVybiB0aGlzLmsxICsgXCIgKiBcIiArIHRoaXMudjFfb2JqLl9fdG9TdHJpbmcgKyBcIi5cIiArIHRoaXMudjFfcHJvcCArIFwiIFwiICsgKHRoaXMuaXNHZXEgPyBcIj5cIiA6IFwiPFwiKSArIFwiPSBcIiArIHRoaXMuazIgKyBcIiAqIFwiICsgdGhpcy52Ml9vYmouX190b1N0cmluZyArIFwiLlwiICsgdGhpcy52Ml9wcm9wICsgXCIgKyBcIiArIHRoaXMuazMgKyBcIiAuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkluZXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy52MV9vYmosIHByb3BzOiBbdGhpcy52MV9wcm9wXX0sIHtvYmo6IHRoaXMudjJfb2JqLCBwcm9wczogW3RoaXMudjJfcHJvcF19XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5JbmVxdWFsaXR5Q29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB0cnVlKSBcbiAgICB9XG5cbiAgICAvLyBTdW0gQ29uc3RyYWludCwgaS5lLiwgazEgKiBvMS5wMSArIGsyICogbzIucDIgPSBrMyAqIG8zLnAzICsgazRcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19hcml0aF9fU3VtQ29uc3RyYWludChyZWYxLCByZWYyLCByZWYzLCBvcHRPbmx5V3JpdGVUbywgazEsIGsyLCBrMywgazQpIHtcblx0dGhpcy5rMSA9IGsxIHx8IDEsIHRoaXMuazIgPSBrMiB8fCAxLCB0aGlzLmszID0gazMgfHwgMSwgdGhpcy5rNCA9IGs0IHx8IDBcblx0aW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMywgJ3YzJylcblx0dGhpcy5vbmx5V3JpdGVUbyA9IG9wdE9ubHlXcml0ZVRvIHx8IFsxLCAyLCAzXVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZGlmZiA9IHRoaXMuazMgKiByZWYodGhpcywgJ3YzJykgKyB0aGlzLms0IC0gKCh0aGlzLmsxICogcmVmKHRoaXMsICd2MScpKSArICh0aGlzLmsyICogcmVmKHRoaXMsICd2MicpKSlcblx0cmV0dXJuIGRpZmZcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjEgPSB0aGlzLmsxICogcmVmKHRoaXMsICd2MScpXG5cdHZhciB2MiA9IHRoaXMuazIgKiByZWYodGhpcywgJ3YyJylcblx0dmFyIHYzID0gdGhpcy5rMyAqIHJlZih0aGlzLCAndjMnKVxuXHR2YXIgdnMgPSBbdjEsIHYyLCB2M10sIGtzID0gW3RoaXMuazEsIHRoaXMuazIsIHRoaXMuazNdXG5cdHZhciBkaWZmID0gdjMgKyB0aGlzLms0IC0gKHYxICsgdjIpXG5cdHZhciBvbmx5V3JpdGVUbyA9IHRoaXMub25seVdyaXRlVG9cblx0dmFyIGRpdiA9IG9ubHlXcml0ZVRvLmxlbmd0aFxuXHR2YXIgYXJncyA9IFt0aGlzXVxuXHRvbmx5V3JpdGVUby5mb3JFYWNoKGZ1bmN0aW9uKGkpIHsgdmFyIHNpZ24gPSBpID4gMiA/IC0xIDogMTsgYXJncy5wdXNoKCd2JyArIGkpOyBhcmdzLnB1c2goKHZzW2kgLSAxXSArIHNpZ24gKiBkaWZmIC8gZGl2KSAvIGtzW2kgLSAxXSkgfSlcblx0cmVzID0gcGF0Y2guYXBwbHkodGhpcywgYXJncylcblx0cmV0dXJuIHJlc1xuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1Db25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludCh7b2JqOiBPMSwgcHJvcDogcDF9LCB7b2JqOiBPMiwgcHJvcDogcDJ9LCB7b2JqOiBPMywgcHJvcDogcDN9LCBXcml0YWJsZUlkeHMsIE51bWJlciBLMSwgTnVtYmVyIEsyLCBOdW1iZXIgSzMsIE51bWJlciBLNCkgc3RhdGVzIHRoYXQgSzEgKiBPMS5wMSArIEsyICogTzIucDIgPSBLMyAqIE8zLnAzICsgSzQgLiBDb25zdGFudHMgSzEtMyBkZWZhdWx0IHRvIDEgYW5kIEs0IHRvIDAuIE9wdGlvbmFsIFdyaXRhYmxlSWR4cyBnaXZlcyBhIGxpc3Qgb2YgaW5kaWNlcyAoMSwgMiwgb3IsIDMpIHRoZSBjb25zdHJhaW50IGlzIGFsbG93ZWQgdG8gY2hhbmdlLlwiIH0gXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgdmFyIHIxID0gcmVmKHRoaXMsICd2MScpLCByMiA9IHJlZih0aGlzLCAndjInKSwgcjMgPSByZWYodGhpcywgJ3YzJyk7IHJldHVybiB0aGlzLmsxICsgXCIgKiBcIiArIHRoaXMudjFfb2JqLl9fdG9TdHJpbmcgKyBcIi5cIiArIHRoaXMudjFfcHJvcCArIFwiICsgXCIgKyB0aGlzLmsyICsgXCIgKiBcIiArIHRoaXMudjJfb2JqLl9fdG9TdHJpbmcgICsgXCIuXCIgKyB0aGlzLnYyX3Byb3AgKyBcIiA9IFwiICsgdGhpcy5rMyArIFwiICogXCIgKyB0aGlzLnYzX29iai5fX3RvU3RyaW5nICsgXCIuXCIgKyB0aGlzLnYzX3Byb3AgKyBcIiArIFwiICsgdGhpcy5rNCArIFwiIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMudjFfb2JqLCBwcm9wczogW3RoaXMudjFfcHJvcF19LCB7b2JqOiB0aGlzLnYyX29iaiwgcHJvcHM6IFt0aGlzLnYyX3Byb3BdfSwge29iajogdGhpcy52M19vYmosIHByb3BzOiBbdGhpcy52M19wcm9wXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLmFyaXRoLlN1bUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSkgXG4gICAgfVxuXG4gICAgLy8gU3VtSW5lcXVhbGl0eSBDb25zdHJhaW50LCBpLmUuLCBrMSAqIG8xLnAxID49IGsyICogbzIucDIgKyBrMyAqIG8zLnAzICsgazQgb3IgazEgKiBvMS5wMSA+PSBrMiAqIG8yLnAyICsgazMgKiBvMy5wMyArIGs0XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19TdW1JbmVxdWFsaXR5Q29uc3RyYWludChyZWYxLCByZWYyLCByZWYzLCBpc0dlcSwgazEsIGsyLCBrMywgazQpIHtcblx0dGhpcy5rMSA9IGsxIHx8IDEsIHRoaXMuazIgPSBrMiB8fCAxLCB0aGlzLmszID0gazMgfHwgMSwgdGhpcy5rNCA9IGs0IHx8IDBcblx0aW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMywgJ3YzJylcblx0dGhpcy5pc0dlcSA9IGlzR2VxXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5Q29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxID0gdGhpcy5rMSAqIHJlZih0aGlzLCAndjEnKSwgdjIgPSB0aGlzLmsyICogcmVmKHRoaXMsICd2MicpLCB2MyA9IHRoaXMuazMgKiByZWYodGhpcywgJ3YzJyksIHN1bSA9IHYyICsgdjMgKyB0aGlzLms0LCBjb25kID0gdGhpcy5pc0dlcSA/IHYxID49IHN1bSA6IHYxIDw9IHN1bSwgZSA9IGNvbmQgPyAwIDogc3VtIC0gdjFcblx0cmV0dXJuIGVcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0djIgPSB0aGlzLmsyICogcmVmKHRoaXMsICd2MicpLCB2MyA9IHRoaXMuazMgKiByZWYodGhpcywgJ3YzJyksIHN1bSA9IHYyICsgdjMgKyB0aGlzLms0XG5cdHJlcyA9IHBhdGNoKHRoaXMsICd2MScsIHN1bSAvIHRoaXMuazEpXG5cdHJldHVybiByZXNcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnYxX29iaiwgcHJvcHM6IFt0aGlzLnYxX3Byb3BdfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eUNvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5Q29uc3RyYWludCh7b2JqOiBPMSwgcHJvcDogcDF9LCB7b2JqOiBPMiwgcHJvcDogcDJ9LCB7b2JqOiBPMywgcHJvcDogcDN9LCBpc0dlcSwgTnVtYmVyIEsxLCBOdW1iZXIgSzIsIE51bWJlciBLMywgTnVtYmVyIEs0KSBzdGF0ZXMgdGhhdCBLMSAqIE8xLnAxID49ICBrMiAqIE8yLnAyICArIGszICogTzMucDMgKyBLNCAgb3IgIEsxICogTzEucDEgPD0gIEsyICogTzIucDIgKyBLMyAqIE8zLnAzICsgSzQgKD49IHdoZW4gaXNHZXE9dHJ1ZSlcIiB9IFxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUluZXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyB2YXIgcjEgPSByZWYodGhpcywgJ3YxJyksIHIyID0gcmVmKHRoaXMsICd2MicpLCByMyA9IHJlZih0aGlzLCAndjMnKTsgcmV0dXJuICB0aGlzLmsxICsgXCIgKiBcIiArIHRoaXMudjFfb2JqLl9fdG9TdHJpbmcgKyBcIi5cIiArIHRoaXMudjFfcHJvcCArIFwiIFwiICsgKHRoaXMuaXNHZXEgPyBcIj5cIiA6IFwiPFwiKSArIFwiPSBcIiArIHRoaXMuazIgKyBcIiAqIFwiICsgdGhpcy52Ml9vYmouX190b1N0cmluZyArIFwiICsgXCIgKyB0aGlzLmszICsgXCIgKiBcIiArIHRoaXMudjNfb2JqLl9fdG9TdHJpbmcgKyBcIi5cIiArIHRoaXMudjNfcHJvcCArIFwiICsgXCIgKyB0aGlzLms0ICsgXCIgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5Q29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eUNvbnN0cmFpbnQoe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwgdHJ1ZSkgXG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoU2tldGNocGFkKSB7XG5cbiAgICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBnZW9tZXRyaWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIG9iamVjdHMgdGhhdCBoYXZlIHggYW5kIHkgcHJvcGVydGllcy4gT3RoZXIgcHJvcGVydGllcyBhcmUgaWdub3JlZC5cblxuICAgIFNrZXRjaHBhZC5nZW9tID0ge31cblxuICAgIC8vIEhlbHBlcnNcblxuICAgIGZ1bmN0aW9uIHNxdWFyZShuKSB7XG5cdHJldHVybiBuICogblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBsdXMocDEsIHAyKSB7XG5cdHJldHVybiB7eDogcDEueCArIHAyLngsIHk6IHAxLnkgKyBwMi55fVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pbnVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggLSBwMi54LCB5OiBwMS55IC0gcDIueX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FsZWRCeShwLCBtKSB7XG5cdHJldHVybiB7eDogcC54ICogbSwgeTogcC55ICogbX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb3B5KHApIHtcblx0cmV0dXJuIHNjYWxlZEJ5KHAsIDEpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlkcG9pbnQocDEsIHAyKSB7XG5cdHJldHVybiBzY2FsZWRCeShwbHVzKHAxLCBwMiksIDAuNSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWduaXR1ZGUocCkge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KHNxdWFyZShwLngpICsgc3F1YXJlKHAueSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplZChwKSB7XG5cdHZhciBtID0gbWFnbml0dWRlKHApXG5cdHJldHVybiBtID4gMCA/IHNjYWxlZEJ5KHAsIDEgLyBtKSA6IHBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXN0YW5jZShwMSwgcDIpIHtcblx0cmV0dXJuIE1hdGguc3FydChzcXVhcmUocDEueCAtIHAyLngpICsgc3F1YXJlKHAxLnkgLSBwMi55KSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByb3RhdGVkQnkocCwgZFRoZXRhKSB7XG5cdHZhciBjID0gTWF0aC5jb3MoZFRoZXRhKVxuXHR2YXIgcyA9IE1hdGguc2luKGRUaGV0YSlcblx0cmV0dXJuIHt4OiBjKnAueCAtIHMqcC55LCB5OiBzKnAueCArIGMqcC55fVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJvdGF0ZWRBcm91bmQocCwgZFRoZXRhLCBheGlzKSB7XG5cdHJldHVybiBwbHVzKGF4aXMsIHJvdGF0ZWRCeShtaW51cyhwLCBheGlzKSwgZFRoZXRhKSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXREZWx0YShkLCBwLCBzY2FsZSkge1xuXHRkLnggPSBwLnggKiBzY2FsZVxuXHRkLnkgPSBwLnkgKiBzY2FsZVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLnNxdWFyZSA9IHNxdWFyZVxuICAgIFNrZXRjaHBhZC5nZW9tLnBsdXMgPSBwbHVzXG4gICAgU2tldGNocGFkLmdlb20ubWludXMgPSBtaW51c1xuICAgIFNrZXRjaHBhZC5nZW9tLnNjYWxlZEJ5ID0gc2NhbGVkQnlcbiAgICBTa2V0Y2hwYWQuZ2VvbS5jb3B5ID0gY29weVxuICAgIFNrZXRjaHBhZC5nZW9tLm1pZHBvaW50ID0gbWlkcG9pbnRcbiAgICBTa2V0Y2hwYWQuZ2VvbS5tYWduaXR1ZGUgPSBtYWduaXR1ZGVcbiAgICBTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkID0gbm9ybWFsaXplZFxuICAgIFNrZXRjaHBhZC5nZW9tLmRpc3RhbmNlID0gZGlzdGFuY2VcbiAgICBTa2V0Y2hwYWQuZ2VvbS5yb3RhdGVkQnkgPSByb3RhdGVkQnlcbiAgICBTa2V0Y2hwYWQuZ2VvbS5yb3RhdGVkQXJvdW5kID0gcm90YXRlZEFyb3VuZFxuICAgIFNrZXRjaHBhZC5nZW9tLnNldERlbHRhID0gc2V0RGVsdGFcblxuICAgIFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZSA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luLCBwMSwgcDIsIGwpIHtcblx0dmFyIGN0eHQgPSBjYW52YXMuY3R4dFxuXHRjdHh0LmxpbmVXaWR0aCA9IDFcblx0Y3R4dC5zdHJva2VTdHlsZSA9ICd5ZWxsb3cnXG5cdGN0eHQuYmVnaW5QYXRoKClcblxuXHR2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHAyLnkgLSBwMS55LCBwMi54IC0gcDEueClcblx0dmFyIGRpc3QgPSAyNVxuXHR2YXIgcDF4ID0gb3JpZ2luLnggKyBwMS54IC0gZGlzdCAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMXkgPSBvcmlnaW4ueSArIHAxLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeCA9IG9yaWdpbi54ICsgcDIueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ5ID0gb3JpZ2luLnkgKyBwMi55IC0gZGlzdCAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cblx0dmFyIHRleHRDZW50ZXJYID0gKHAxeCArIHAyeCkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclkgPSAocDF5ICsgcDJ5KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cblx0Y3R4dC5tb3ZlVG8oXG5cdCAgICBwMXggKyA1ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMiksXG5cdCAgICBwMXkgKyA1ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0KVxuXHRjdHh0LmxpbmVUbyhcblx0ICAgIHAxeCAtIDUgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKSxcblx0ICAgIHAxeSAtIDUgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHQpXG5cblx0Y3R4dC5tb3ZlVG8ocDF4LCBwMXkpXG5cdGN0eHQubGluZVRvKHAyeCwgcDJ5KVxuXG5cdGN0eHQubW92ZVRvKFxuXHQgICAgcDJ4ICsgNSAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpLFxuXHQgICAgcDJ5ICsgNSAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdClcblx0Y3R4dC5saW5lVG8oXG5cdCAgICBwMnggLSA1ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMiksXG5cdCAgICBwMnkgLSA1ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0KVxuXHRjdHh0LmNsb3NlUGF0aCgpXG5cdGN0eHQuc3Ryb2tlKClcblxuXHRjdHh0LnRleHRBbGlnbiA9ICdjZW50ZXInXG5cdGN0eHQudGV4dEJhc2VsaW5lID0gJ21pZGRsZSdcblx0Y3R4dC5zdHJva2VUZXh0KE1hdGgucm91bmQobCksIHRleHRDZW50ZXJYLCB0ZXh0Q2VudGVyWSlcblx0Y3R4dC5zdHJva2UoKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLmNhbGN1bGF0ZUFuZ2xlID0gZnVuY3Rpb24ocDEsIHAyLCBwMywgcDQpIHtcblx0dmFyIHYxMiA9IHt4OiBwMi54IC0gcDEueCwgeTogcDIueSAtIHAxLnl9XG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIHYzNCA9IHt4OiBwNC54IC0gcDMueCwgeTogcDQueSAtIHAzLnl9XG5cdHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueClcblx0cmV0dXJuIChhMTIgLSBhMzQgKyAyICogTWF0aC5QSSkgJSAoMiAqIE1hdGguUEkpXG4gICAgfVxuXG4gICAgLy8gQ29vcmRpbmF0ZSBDb25zdHJhaW50LCBpLmUuLCBcIkkgd2FudCB0aGlzIHBvaW50IHRvIGJlIGhlcmVcIi5cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19Db29yZGluYXRlQ29uc3RyYWludChwLCB4LCB5KSB7XG5cdHRoaXMucCA9IHBcblx0dGhpcy5jID0gbmV3IFBvaW50KHgsIHkpXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDogJ1BvaW50JywgYzogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMuYywgdGhpcy5wKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge3A6IHt4OiB0aGlzLmMueCwgeTogdGhpcy5jLnl9fVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludChQb2ludCBQLCBOdW1iZXIgWCwgTnVtYmVyIFkpIHN0YXRlcyB0aGF0IHBvaW50IFAgc2hvdWxkIHN0YXkgYXQgY29vcmRpbmF0ZSAoWCwgWSkuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJwb2ludCBwIChcIiArIHRoaXMucC5fX3RvU3RyaW5nICsgXCIpIHNob3VsZCBzdGF5IGF0IGNvb3JkaW5hdGUgKFwiICsgdGhpcy5jLnggKyBcIiwgXCIgKyB0aGlzLmMueSArIFwiKS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMucCwgcHJvcHM6IFsneCcsICd5J119XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgcDEgPSBQb2ludC5kdW1teSh4LCB5KVxuXHR2YXIgcDIgPSBQb2ludC5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50KHAxLCBwMi54LCBwMi55KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0dmFyIGN0eHQgPSBjYW52YXMuY3R4dFxuXHRpZiAodGhpcy5wLmlzU2VsZWN0ZWQpIHJldHVybiAvLyBkb24ndCBkcmF3IG92ZXIgdGhlIHNlbGVjdGlvbiBoaWdobGlnaHRcblx0Y3R4dC5maWxsU3R5bGUgPSAnYmxhY2snXG5cdGN0eHQuYmVnaW5QYXRoKClcblx0Y3R4dC5hcmModGhpcy5jLnggKyBvcmlnaW4ueCwgdGhpcy5jLnkgKyBvcmlnaW4ueSwgY2FudmFzLnBvaW50UmFkaXVzICogMC42NjYsIDAsIDIgKiBNYXRoLlBJKVxuXHRjdHh0LmNsb3NlUGF0aCgpXG5cdGN0eHQuZmlsbCgpXG4gICAgfVxuXG4gICAgLy8gQ29pbmNpZGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZXNlIHR3byBwb2ludHMgdG8gYmUgYXQgdGhlIHNhbWUgcGxhY2UuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0NvaW5jaWRlbmNlQ29uc3RyYWludChwMSwgcDIpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICAgICAgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMucDIsIHRoaXMucDEpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXModGhpcy5wMiwgdGhpcy5wMSksIDAuNSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBzcGxpdERpZmYpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW9udCBQMikgc3RhdGVzIHRoYXQgcG9pbnRzIFAxICYgUDIgc2hvdWxkIGJlIGF0IHRoZSBzYW1lIHBsYWNlLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcInBvaW50cyBwMSAoXCIgKyB0aGlzLnAxLl9fdG9TdHJpbmcgKyBcIikgJiBwMiAoXCIgKyB0aGlzLnAyLl9fdG9TdHJpbmcgKyBcIikgc2hvdWxkIGJlIGF0IHRoZSBzYW1lIHBsYWNlLlwiIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsID0gTGluZS5kdW1teSh4LCB5KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludChsLnAxLCBsLnAyKVxuICAgIH1cbiAgIFxuICAgIC8vIEVxdWl2YWxlbmNlIENvbnN0cmFpbnQsIGkuZS4sIEkgd2FudCB0aGUgdmVjdG9ycyBwMS0+cDIgYW5kIHAzLT5wNCB0byBiZSB0aGUgc2FtZS5cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fRXF1aXZhbGVuY2VDb25zdHJhaW50KHAxLCBwMiwgcDMsIHA0KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSkpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSksIDAuMjUpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgc3BsaXREaWZmKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoc3BsaXREaWZmLCAtMSkpLCBwMzogcGx1cyh0aGlzLnAzLCBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSksIHA0OiBwbHVzKHRoaXMucDQsIHNwbGl0RGlmZil9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQpIHNheXMgbGluZSBzZWN0aW9ucyBQMS0yIGFuZCBQMy00IGFyZSBwYXJhbGxlbCBhbmQgb2YgdGhlIHNhbWUgbGVuZ3Rocy5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJsaW5lIHNlY3Rpb25zICBwMSAoXCIgKyB0aGlzLnAxLl9fdG9TdHJpbmcgKyBcIikgLXAyIChcIiArIHRoaXMucDIuX190b1N0cmluZyArIFwiKSBhbmQgIHAzIChcIiArIHRoaXMucDMuX190b1N0cmluZyArIFwiKSAtcDQgKFwiICsgdGhpcy5wNC5fX3RvU3RyaW5nICsgXCIpIGFyZSBwYXJhbGxlbCBhbmQgb2YgdGhlIHNhbWUgbGVuZ3Rocy5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsMSA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGwyID0gTGluZS5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludChsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgbCA9IGRpc3RhbmNlKHRoaXMucDEsIHRoaXMucDIpXG5cdFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZShjYW52YXMsIG9yaWdpbiwgdGhpcy5wMSwgdGhpcy5wMiwgbClcblx0U2tldGNocGFkLmdlb20uZHJhd1Zpc3VhbGl6YXRpb25MaW5lKGNhbnZhcywgb3JpZ2luLCB0aGlzLnAzLCB0aGlzLnA0LCBsKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29udGFpbnNQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIHAxID0gdGhpcy5wMSwgcDIgPSB0aGlzLnAyLCBwMyA9IHRoaXMucDMsIHA0ID0gdGhpcy5wNFxuXHR2YXIgeDEgPSBNYXRoLm1pbihwMS54LCBwMi54LCBwMy54LCBwNC54KSwgeDIgPSBNYXRoLm1heChwMS54LCBwMi54LCBwMy54LCBwNC54KVxuXHR2YXIgeTEgPSBNYXRoLm1pbihwMS55LCBwMi55LCBwMy55LCBwNC55KSwgeTIgPSBNYXRoLm1heChwMS55LCBwMi55LCBwMy55LCBwNC55KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQoeDEsIHkxKSwgeDIgLSB4MSwgeTIgLSB5MSkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyLmNvbnRhaW5zUG9pbnQoeCwgeSkgXG4gICAgfVxuICAgXG4gICAgU2tldGNocGFkLmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5ib3JkZXIgPSBmdW5jdGlvbigpIHtcblx0dmFyIHAxID0gdGhpcy5wMSwgcDIgPSB0aGlzLnAyLCBwMyA9IHRoaXMucDMsIHA0ID0gdGhpcy5wNFxuXHR2YXIgeDEgPSBNYXRoLm1pbihwMS54LCBwMi54LCBwMy54LCBwNC54KSwgeDIgPSBNYXRoLm1heChwMS54LCBwMi54LCBwMy54LCBwNC54KVxuXHR2YXIgeTEgPSBNYXRoLm1pbihwMS55LCBwMi55LCBwMy55LCBwNC55KSwgeTIgPSBNYXRoLm1heChwMS55LCBwMi55LCBwMy55LCBwNC55KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQoeDEsIHkxKSwgeDIgLSB4MSwgeTIgLSB5MSkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyXG4gICAgfSBcblxuICAgIC8vIE9uZSBXYXkgRXF1aXZhbGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZSB2ZWN0b3JzIHAxLT5wMiB0byBhbHdheXMgbWF0Y2ggd2l0aCBwMy0+cDRcblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50KHAxLCBwMiwgcDMsIHA0KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCd9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5wMiwgdGhpcy5wMyksIHBsdXModGhpcy5wMSwgdGhpcy5wNCkpKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNwbGl0RGlmZiA9IHNjYWxlZEJ5KG1pbnVzKHBsdXModGhpcy5wMiwgdGhpcy5wMyksIHBsdXModGhpcy5wMSwgdGhpcy5wNCkpLCAwLjUpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgc3BsaXREaWZmKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoc3BsaXREaWZmLCAtMSkpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uT25lV2F5RXF1aXZhbGVuY2VDb25zdHJhaW50KFBvaW50IFAxLCBQb2ludCBQMiwgUG9pbnQgUDMsIFBvaW50IFA0KSBzYXlzIHRoZSB2ZWN0b3JzIFAxLT5QMiBhbHdheXMgbWF0Y2hlcyB3aXRoIFAzLT5QNFwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcInZlY3RvcnMgcDEgKFwiICsgdGhpcy5wMS5fX3RvU3RyaW5nICsgXCIpIC0+cDIgKFwiICsgdGhpcy5wMi5fX3RvU3RyaW5nICsgXCIpIGFsd2F5cyBtYXRjaGVzIHdpdGggcDMgKFwiICsgdGhpcy5wMy5fX3RvU3RyaW5nICsgXCIpIC0+cDQgKFwiICsgdGhpcy5wNC5fX3RvU3RyaW5nICsgXCIpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVpdmFsZW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsMSA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGwyID0gTGluZS5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWl2YWxlbmNlQ29uc3RyYWludChsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG5cbiAgICAvLyBFcXVhbCBEaXN0YW5jZSBjb25zdHJhaW50IC0ga2VlcHMgZGlzdGFuY2VzIFAxLS0+UDIsIFAzLS0+UDQgZXF1YWxcblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19FcXVhbERpc3RhbmNlQ29uc3RyYWludChwMSwgcDIsIHAzLCBwNCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMucDMgPSBwM1xuXHR0aGlzLnA0ID0gcDRcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQsIHRydWUpXG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSlcblx0dmFyIGwzNCA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAzLCB0aGlzLnA0KSlcblx0cmV0dXJuIGwxMiAtIGwzNFxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKVxuXHR2YXIgbDM0ID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDMsIHRoaXMucDQpKVxuXHR2YXIgZGVsdGEgPSAobDEyIC0gbDM0KSAvIDRcblx0dmFyIGUxMiA9IHNjYWxlZEJ5KFNrZXRjaHBhZC5nZW9tLm5vcm1hbGl6ZWQobWludXModGhpcy5wMiwgdGhpcy5wMSkpLCBkZWx0YSlcblx0dmFyIGUzNCA9IHNjYWxlZEJ5KFNrZXRjaHBhZC5nZW9tLm5vcm1hbGl6ZWQobWludXModGhpcy5wNCwgdGhpcy5wMykpLCBkZWx0YSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBlMTIpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShlMTIsIC0xKSksIHAzOiBwbHVzKHRoaXMucDMsIHNjYWxlZEJ5KGUzNCwgLTEpKSwgcDQ6IHBsdXModGhpcy5wNCwgZTM0KX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQpIGtlZXBzIGRpc3RhbmNlcyBQMS0+UDIsIFAzLT5QNCBlcXVhbC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcImRpc3RhbmNlcyBwMSAoXCIgKyB0aGlzLnAxLl9fdG9TdHJpbmcgKyBcIikgLT5wMiAoXCIgKyB0aGlzLnAyLl9fdG9TdHJpbmcgKyBcIikgJiBwMyAoXCIgKyB0aGlzLnAzLl9fdG9TdHJpbmcgKyBcIikgLT5wNCAoXCIgKyB0aGlzLnA0Ll9fdG9TdHJpbmcgKyBcIikgYXJlIGVxdWFsLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbDEgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHZhciBsMiA9IExpbmUuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludChsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG5cbiAgICAvLyBMZW5ndGggY29uc3RyYWludCAtIG1haW50YWlucyBkaXN0YW5jZSBiZXR3ZWVuIFAxIGFuZCBQMiBhdCBMLlxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fTGVuZ3RoQ29uc3RyYWludChwMSwgcDIsIGwsIG9ubHlPbmVXcml0YWJsZSkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMubCA9IGxcblx0dGhpcy5fb25seU9uZVdyaXRhYmxlID0gb25seU9uZVdyaXRhYmxlXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgbDogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKVxuXHRyZXR1cm4gbDEyIC0gdGhpcy5sXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyhwMSwgcDIpKVxuXHRpZiAobDEyID09IDApIHtcblx0ICAgIHAxID0gcGx1cyhwMSwge3g6IDAuMSwgeTogMH0pXG5cdCAgICBwMiA9IHBsdXMocDIsIHt4OiAtMC4xLCB5OiAwfSlcblx0fVx0XG5cdHZhciBkZWx0YSA9IChsMTIgLSB0aGlzLmwpIC8gKHRoaXMuX29ubHlPbmVXcml0YWJsZSA/IDEgOiAyKVxuXHR2YXIgZTEyID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20ubm9ybWFsaXplZChtaW51cyhwMiwgcDEpKSwgZGVsdGEpXG5cdHZhciByZXMgPSB7cDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoZTEyLCAtMSkpfVxuXHRpZiAoIXRoaXMuX29ubHlPbmVXcml0YWJsZSlcblx0ICAgIHJlc1sncDEnXSA9IHBsdXModGhpcy5wMSwgZTEyKVxuXHRyZXR1cm4gcmVzXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBOdW1iZXIgTCkgc2F5cyBwb2ludHMgUDEgYW5kIFAyIGFsd2F5cyBtYWludGFpbiBhIGRpc3RhbmNlIG9mIEwuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcInBvaW50cyBwMSAoXCIgKyB0aGlzLnAxLl9fdG9TdHJpbmcgKyBcIikgYW5kIHAyIChcIiArIHRoaXMucDIuX190b1N0cmluZyArIFwiKSBhbHdheXMgbWFpbnRhaW4gYSBkaXN0YW5jZSBvZiBcIiArIHRoaXMubCArIFwiLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnAxLCBwcm9wczogWyd4JywgJ3knXX0sIHtvYmo6IHRoaXMucDIsIHByb3BzOiBbJ3gnLCAneSddfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQobmV3IFBvaW50KHggLSA1MCwgeSAtIDUwKSwgbmV3IFBvaW50KHggKyA1MCwgeSArIDUwKSwgMTAwKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHRTa2V0Y2hwYWQuZ2VvbS5kcmF3VmlzdWFsaXphdGlvbkxpbmUoY2FudmFzLCBvcmlnaW4sIHRoaXMucDEsIHRoaXMucDIsIHRoaXMubClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5jb250YWluc1BvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGFuZ2xlID0gTWF0aC5hdGFuMihwMi55IC0gcDEueSwgcDIueCAtIHAxLngpXG5cdHZhciBkaXN0ID0gMjVcblx0dmFyIHAxeCA9IHAxLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAxeSA9IHAxLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeCA9IHAyLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeSA9IHAyLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHRleHRDZW50ZXJYID0gKHAxeCArIHAyeCkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclkgPSAocDF5ICsgcDJ5KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludCh0ZXh0Q2VudGVyWCAtIDUwLCB0ZXh0Q2VudGVyWSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlci5jb250YWluc1BvaW50KHgsIHkpIFxuICAgIH1cbiAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmJvcmRlciA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGFuZ2xlID0gTWF0aC5hdGFuMihwMi55IC0gcDEueSwgcDIueCAtIHAxLngpXG5cdHZhciBkaXN0ID0gMjVcblx0dmFyIHAxeCA9IHAxLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAxeSA9IHAxLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeCA9IHAyLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeSA9IHAyLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHRleHRDZW50ZXJYID0gKHAxeCArIHAyeCkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclkgPSAocDF5ICsgcDJ5KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludCh0ZXh0Q2VudGVyWCAtIDUwLCB0ZXh0Q2VudGVyWSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlclxuICAgIH0gXG5cbiAgICAvLyBPcmllbnRhdGlvbiBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGFuZ2xlIGJldHdlZW4gUDEtPlAyIGFuZCBQMy0+UDQgYXQgVGhldGFcblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbV9fT3JpZW50YXRpb25Db25zdHJhaW50KHAxLCBwMiwgcDMsIHA0LCB0aGV0YSkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMucDMgPSBwM1xuXHR0aGlzLnA0ID0gcDRcblx0dGhpcy50aGV0YSA9IHRoZXRhID09PSB1bmRlZmluZWQgPyBTa2V0Y2hwYWQuZ2VvbS5jYWxjdWxhdGVBbmdsZShwMSwgcDIsIHAzLCBwNCkgOiB0aGV0YVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCBwMzogJ1BvaW50JywgcDQ6ICdQb2ludCcsIHRoZXRhOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxMiA9IG1pbnVzKHRoaXMucDIsIHRoaXMucDEpXG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cdFxuXHR2YXIgdjM0ID0gbWludXModGhpcy5wNCwgdGhpcy5wMylcblx0dmFyIGEzNCA9IE1hdGguYXRhbjIodjM0LnksIHYzNC54KVxuXHR2YXIgbTM0ID0gbWlkcG9pbnQodGhpcy5wMywgdGhpcy5wNClcblx0XG5cdHZhciBjdXJyVGhldGEgPSBhMTIgLSBhMzRcblx0dmFyIGRUaGV0YSA9IHRoaXMudGhldGEgLSBjdXJyVGhldGFcblx0cmV0dXJuIGRUaGV0YVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxMiA9IG1pbnVzKHRoaXMucDIsIHRoaXMucDEpXG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cblx0dmFyIHYzNCA9IG1pbnVzKHRoaXMucDQsIHRoaXMucDMpXG5cdHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueClcblx0dmFyIG0zNCA9IG1pZHBvaW50KHRoaXMucDMsIHRoaXMucDQpXG5cblx0dmFyIGN1cnJUaGV0YSA9IGExMiAtIGEzNFxuXHR2YXIgZFRoZXRhID0gdGhpcy50aGV0YSAtIGN1cnJUaGV0YVxuXG5cdHJldHVybiB7cDE6IHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLFxuXHRcdHAyOiByb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKSxcblx0XHRwMzogcm90YXRlZEFyb3VuZCh0aGlzLnAzLCAtZFRoZXRhLCBtMzQpLFxuXHRcdHA0OiByb3RhdGVkQXJvdW5kKHRoaXMucDQsIC1kVGhldGEsIG0zNCl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQsIE51bWJlciBUaGV0YSkgbWFpbnRhaW5zIGFuZ2xlIGJldHdlZW4gUDEtPlAyIGFuZCBQMy0+UDQgYXQgVGhldGEuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiYW5nbGUgaXMgbWFpbnRhaW5lZCBiZXR3ZWVuIHAxIChcIiArIHRoaXMucDEuX190b1N0cmluZyArIFwiKSAtPnAyIChcIiArIHRoaXMucDIuX190b1N0cmluZyArIFwiKSBhbmQgcDMgKFwiICsgdGhpcy5wMy5fX3RvU3RyaW5nICsgXCIpIC0+cDQgKFwiICsgdGhpcy5wNC5fX3RvU3RyaW5nICsgXCIpIGF0IFwiICsgdGhpcy50aGV0YSArIFwiIHJhZGlhbnMuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbDEgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHZhciBsMiA9IExpbmUuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQobDEucDEsIGwxLnAyLCBsMi5wMSwgbDIucDIpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0dmFyIG0xID0gc2NhbGVkQnkocGx1cyh0aGlzLnAxLCB0aGlzLnAyKSwgMC41KVxuXHR2YXIgbTIgPSBzY2FsZWRCeShwbHVzKHRoaXMucDMsIHRoaXMucDQpLCAwLjUpXG5cdHZhciBtID0gc2NhbGVkQnkocGx1cyhtMSwgbTIpLCAwLjUpXG5cdGNhbnZhcy5kcmF3QXJyb3cobTEsIG0yLCBvcmlnaW4pXG5cdGN0eHQuZmlsbFN0eWxlID0gJ3JlZCdcblx0Y3R4dC5maWxsVGV4dCgndGhldGEgPSAnICsgTWF0aC5mbG9vcih0aGlzLnRoZXRhIC8gTWF0aC5QSSAqIDE4MCksIG0ueCArIG9yaWdpbi54LCBtLnkgKyBvcmlnaW4ueSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBtMSA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMSwgdGhpcy5wMiksIDAuNSlcblx0dmFyIG0yID0gc2NhbGVkQnkocGx1cyh0aGlzLnAzLCB0aGlzLnA0KSwgMC41KVxuXHR2YXIgbSA9IHNjYWxlZEJ5KHBsdXMobTEsIG0yKSwgMC41KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQobS54IC0gNTAsIG0ueSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlci5jb250YWluc1BvaW50KHgsIHkpIFxuICAgIH1cbiAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHZhciBtMSA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMSwgdGhpcy5wMiksIDAuNSlcblx0dmFyIG0yID0gc2NhbGVkQnkocGx1cyh0aGlzLnAzLCB0aGlzLnA0KSwgMC41KVxuXHR2YXIgbSA9IHNjYWxlZEJ5KHBsdXMobTEsIG0yKSwgMC41KVxuXHR0aGlzLl9fYm9yZGVyID0gbmV3IEJveChuZXcgUG9pbnQobS54IC0gNTAsIG0ueSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlclxuICAgIH0gXG5cbiAgICAvLyBNb3RvciBjb25zdHJhaW50IC0gY2F1c2VzIFAxIGFuZCBQMiB0byBvcmJpdCB0aGVpciBtaWRwb2ludCBhdCB0aGUgZ2l2ZW4gcmF0ZS5cbiAgICAvLyB3IGlzIGluIHVuaXRzIG9mIEh6IC0gd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX01vdG9yQ29uc3RyYWludChwMSwgcDIsIHcpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLncgPSB3XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCcsIHc6ICdOdW1iZXInfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIDFcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHQgPSAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAvIDEwMDAuMFxuXHR2YXIgZFRoZXRhID0gdCAqIHRoaXMudyAqICgyICogTWF0aC5QSSlcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cdHJldHVybiB7cDE6IHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLFxuXHRcdHAyOiByb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLk1vdG9yQ29uc3RyYWludChQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBXKSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlIG9mIHcsIGluIHVuaXRzIG9mIEh6OiB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cIiB9IFxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwicDEgKFwiICsgdGhpcy5wMS5fX3RvU3RyaW5nICsgXCIpIGFuZCBwMiAoXCIgKyB0aGlzLnAyLl9fdG9TdHJpbmcgKyBcIikgdG8gb3JiaXQgdGhlaXIgbWlkcG9pbnQgYXQgdGhlIGdpdmVuIHJhdGUgb2YgXCIgKyB0aGlzLncgKyBcIiwgaW4gdW5pdHMgb2YgSHo6IHdob2xlIHJvdGF0aW9ucyBwZXIgc2Vjb25kLlwiIH0gXG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbCA9IExpbmUuZHVtbXkoeCwgeSlcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5Nb3RvckNvbnN0cmFpbnQobC5wMSwgbC5wMiwgMSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50ID0gZnVuY3Rpb24gIFNrZXRjaHBhZF9fZ2VvbV9fQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50KHBvc2l0aW9uLCB2ZWN0b3IsIG9yaWdpbiwgdW5pdCkge1xuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy52ZWN0b3IgPSB2ZWN0b3Jcblx0dGhpcy5vcmlnaW4gPSBvcmlnaW5cblx0dGhpcy51bml0ID0gdW5pdFxuICAgIH1cbiAgICBcbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50LCB0cnVlKVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gXCJTa2V0Y2hwYWQuZ2VvbS5DYXJ0ZXNpYW5Qb2ludENvbnN0cmFpbnQoUG9pbnQgUCwgVmVjdG9yIFYsIFBvaW50IE8sIE51bWJlciBVKSBzdGF0ZXMgdGhhdCBQIHNob3VsZCBiZSBwb3NpdGlvbmVkIGJhc2VkIG9uIHZlY3RvciBWJ3MgWCBhbmQgWSBkaXNjcmV0ZSBjb29yZGluYXRlIHZhbHVlcywgYW5kIG9uIG9yaWdpbiBPIGFuZCBlYWNoIHVuaXQgb24gYXhpcyBoYXZpbmcgYSB2ZXJ0aWNhbCBhbmQgaG9yaXpvbnRhbCBsZW5ndGggb2YgVVwiXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gXCJcIiArIHRoaXMucG9zaXRpb24uX190b1N0cmluZyArIFwiIHNob3VsZCBiZSBwb3NpdGlvbmVkIGJhc2VkIG9uIHZlY3RvciBcIiArIHRoaXMudmVjdG9yLl9fdG9TdHJpbmcgKyBcIidzIFggYW5kIFkgZGlzY3JldGUgY29vcmRpbmF0ZSB2YWx1ZXMsIGFuZCBvbiBvcmlnaW4gXCIgKyB0aGlzLm9yaWdpbi5fX3RvU3RyaW5nICsgXCIgYW5kIGVhY2ggdW5pdCBvbiBheGlzIGhhdmluZyBhIHZlcnRpY2FsIGFuZCBob3Jpem9udGFsIGxlbmd0aCBvZiBcIiArIHRoaXMudW5pdFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIG9yaWdpbiA9IHRoaXMub3JpZ2luLCB2ZWN0b3IgPSB0aGlzLnZlY3RvciwgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLCB1bml0ID0gdGhpcy51bml0XG5cdHZhciBkaWZmWCA9IE1hdGguYWJzKG9yaWdpbi54ICsgdW5pdCAqIHZlY3Rvci54IC0gcG9zaXRpb24ueClcblx0dmFyIGRpZmZZID0gTWF0aC5hYnMob3JpZ2luLnkgLSB1bml0ICogdmVjdG9yLnkgLSBwb3NpdGlvbi55KVxuXHRyZXR1cm4gZGlmZlggKyBkaWZmWVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50Q29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgb3JpZ2luID0gdGhpcy5vcmlnaW4sIHZlY3RvciA9IHRoaXMudmVjdG9yLCBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24sIHVuaXQgPSB0aGlzLnVuaXRcblx0dmFyIHggPSBvcmlnaW4ueCArIHVuaXQgKiB2ZWN0b3IueFxuXHR2YXIgeSA9IG9yaWdpbi55IC0gdW5pdCAqIHZlY3Rvci55XG5cdHJldHVybiB7cG9zaXRpb246IHt4OiB4LCB5OiB5fX1cbiAgICB9XG4gICAgXG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbEdlb21ldHJpY0NvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzKFNrZXRjaHBhZCkge1xuXG4gICAgLy8gVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2Ygc2ltdWxhdGlvbiBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gICAgLy8gYXJiaXRyYXJ5IHByb3BlcnRpZXMgb2YgYXJiaXRyYXJ5IG9iamVjdHMuIFwiUmVmZXJlbmNlc1wiIGFyZSByZXByZXNlbnRlZFxuICAgIC8vIGFzIChvYmplY3QsIHByb3BlcnR5TmFtZSkgdHVwbGVzLCBlLmcuLCB7b2JqOiB5b3VyTW9tLCBwcm9wOiAnd2VpZ2h0J30uXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbiA9IHsgZzogOS44LCBHOiA2LjdlLTExIH0gLy8gRzogTm0yL2tnMiBcblxuICAgIHZhciBtaW51cyA9IFNrZXRjaHBhZC5nZW9tLm1pbnVzXG4gICAgdmFyIHBsdXMgPSBTa2V0Y2hwYWQuZ2VvbS5wbHVzXG4gICAgdmFyIHNjYWxlZEJ5ID0gU2tldGNocGFkLmdlb20uc2NhbGVkQnlcbiAgICB2YXIgbm9ybWFsaXplZCA9IFNrZXRjaHBhZC5nZW9tLm5vcm1hbGl6ZWRcbiAgICB2YXIgbWFnbml0dWRlID0gU2tldGNocGFkLmdlb20ubWFnbml0dWRlXG4gICAgdmFyIGRpc3RhbmNlID0gU2tldGNocGFkLmdlb20uZGlzdGFuY2VcblxuICAgIC8vIENsYXNzZXNcbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keSA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fRnJlZUJvZHkocG9zaXRpb24sIG9wdFJhZGl1cywgb3B0TWFzcykge1xuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy5tYXNzID0gb3B0TWFzcyB8fCAxMFxuXHR0aGlzLnZlbG9jaXR5ID0gbmV3IFZlY3RvcigwLCAwKVxuXHR0aGlzLmFjY2VsZXJhdGlvbiA9IG5ldyBWZWN0b3IoMCwgMClcblx0dGhpcy5yYWRpdXMgPSBvcHRSYWRpdXMgfHwgdGhpcy5wb3NpdGlvbi5yYWRpdXNcblx0cmMuYWRkKHBvc2l0aW9uKVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3Bvc2l0aW9uOiAnUG9pbnQnLCBtYXNzOiAnTnVtYmVyJywgcmFkaXVzOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5KFBvaW50LmR1bW15KHgsIHkpLCAxMCwgMTApXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5LnByb3RvdHlwZS5jb250YWluc1BvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gdGhpcy5wb3NpdGlvbi5jb250YWluc1BvaW50KHgsIHkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkucHJvdG90eXBlLmNlbnRlciA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5wb3NpdGlvblxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5LnByb3RvdHlwZS5ib3JkZXIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMucG9zaXRpb24uYm9yZGVyKClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdC8vdGhpcy5wb3NpdGlvbi5kcmF3KGNhbnZhcywgb3JpZ2luKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZyA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fU3ByaW5nKGJvZHkxLCBib2R5MiwgaywgbGVuZ3RoLCB0ZWFyUG9pbnRBbW91bnQpIHtcblx0dGhpcy5ib2R5MSA9IGJvZHkxXG5cdHRoaXMuYm9keTEgPSBib2R5MlxuXHR0aGlzLmxpbmUgPSBuZXcgTGluZShib2R5MS5wb3NpdGlvbiwgYm9keTIucG9zaXRpb24pXG5cdHRoaXMuayA9IGtcblx0dGhpcy5sZW5ndGggPSBsZW5ndGggICAgXG5cdHRoaXMudGVhclBvaW50QW1vdW50ID0gdGVhclBvaW50QW1vdW50XG5cdHRoaXMudG9ybiA9IGZhbHNlXG5cdHRoaXMuX25vcm1hbENvbG9yID0gbmV3IENvbG9yKDE1MCwgMTUwLCAxNTApXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZylcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5MTogJ0ZyZWVCb2R5JywgYm9keTI6ICdGcmVlQm9keScsIGs6ICdOdW1iZXInLCBsZW5ndGg6ICdOdW1iZXInLCB0ZWF0UG9pbnRBbW91bnQ6ICdOdW1iZXInfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgYjEgPSBGcmVlQm9keS5kdW1teSh4LCB5KVxuXHR2YXIgYjIgPSBGcmVlQm9keS5kdW1teSh4ICsgMTAwLCB5ICsgMTAwKVxuXHR2YXIgZCA9IGRpc3RhbmNlKGIxLnAxLCBiMi5wMilcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcoYjEsIGIyLCAxMCwgZCwgIGQgKiA1KVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiB0aGlzLmxpbmUuY29udGFpbnNQb2ludCh4LCB5KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuY2VudGVyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLmxpbmUuY2VudGVyKClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLmJvcmRlciA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gbmV3IExpbmUodGhpcy5saW5lLnAxLCB0aGlzLmxpbmUucDIsIHVuZGVmaW5lZCwgOCkuYm9yZGVyKClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLnNvbHV0aW9uSm9pbnMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHt0b3JuOiByYy5za2V0Y2hwYWQubGFzdE9uZVdpbnNKb2luU29sdXRpb25zfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0dmFyIGxpbmUgPSB0aGlzLmxpbmVcblx0dmFyIHAxID0gbGluZS5wMSwgcDIgPSBsaW5lLnAyXG5cdHZhciB5MSA9IG9yaWdpbi55ICsgcDEueVxuXHR2YXIgeTIgPSBvcmlnaW4ueSArIHAyLnlcblx0dmFyIHgxID0gb3JpZ2luLnggKyBwMS54XG5cdHZhciB4MiA9IG9yaWdpbi54ICsgcDIueFxuXHRpZiAoIXRoaXMudG9ybikge1xuXHQgICAgdmFyIHN0cmV0Y2ggPSBNYXRoLmZsb29yKE1hdGguc3FydChNYXRoLnBvdyh5MSAtIHkyLCAyKSArIE1hdGgucG93KHgxIC0geDIsIDIpKSAtIHRoaXMubGVuZ3RoKVxuXHQgICAgdmFyIHN0cmV0Y2hQID0gTWF0aC5hYnMoc3RyZXRjaClcblx0ICAgIHRoaXMuX25vcm1hbENvbG9yLnJlZCA9IE1hdGgubWluKDI1NSwgMTUwICsgc3RyZXRjaFApXG5cdCAgICBsaW5lLmNvbG9yID0gdGhpcy5fbm9ybWFsQ29sb3IuaGV4U3RyaW5nKClcblx0ICAgIGxpbmUuZHJhdyhjYW52YXMsIG9yaWdpbilcblx0ICAgIGN0eHQuZmlsbFN0eWxlID0gJ2JsYWNrJ1xuXHQgICAgY3R4dC5maWxsVGV4dChzdHJldGNoLCAoeDEgKyB4MikgLyAyLCAoeTEgKyB5MikgLyAyKVxuXHR9XG4gICAgfVxuXG4gICAgLy8gVXRpbGl0aWVzXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0ID0gZnVuY3Rpb24oaGFsZkxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikge1xuXHR2YXIgcXVhcnRlckxlbmd0aCA9IGhhbGZMZW5ndGggLyAyXG5cdHZhciBwb3NpdGlvblggPSBwb3NpdGlvbi54XG5cdHZhciBwb3NpdGlvblkgPSBwb3NpdGlvbi55XG5cdHZhciBzdXJmYWNlWDEgPSBzdXJmYWNlUDEueFxuXHR2YXIgc3VyZmFjZVkxID0gc3VyZmFjZVAxLnlcblx0dmFyIHN1cmZhY2VYMiA9IHN1cmZhY2VQMi54XG5cdHZhciBzdXJmYWNlWTIgPSBzdXJmYWNlUDIueVxuXHR2YXIgc2xvcGUgPSAoc3VyZmFjZVkyIC0gc3VyZmFjZVkxKSAvIChzdXJmYWNlWDIgLSBzdXJmYWNlWDEpXG5cdHZhciBzdXJmYWNlSGl0UG9zWCA9ICgocG9zaXRpb25ZIC0gc3VyZmFjZVkxKSAvIHNsb3BlKSArIHN1cmZhY2VYMVxuXHR2YXIgc3VyZmFjZUhpdFBvc1kgPSAoKHBvc2l0aW9uWCAtIHN1cmZhY2VYMSkgKiBzbG9wZSkgKyBzdXJmYWNlWTFcblx0dmFyIGlzVmVydGljYWwgPSAocG9zaXRpb25YID49IChzdXJmYWNlWDEgLSBxdWFydGVyTGVuZ3RoKSAmJiBwb3NpdGlvblggPD0gKHN1cmZhY2VYMiArIHF1YXJ0ZXJMZW5ndGgpKVxuXHR2YXIgaXNIb3Jpem9udGFsID0gKHBvc2l0aW9uWSA+PSAoc3VyZmFjZVkxIC0gcXVhcnRlckxlbmd0aCkgJiYgcG9zaXRpb25ZIDw9IChzdXJmYWNlWTIgKyBxdWFydGVyTGVuZ3RoKSlcblx0dmFyIGlzVXAgPSBpc1ZlcnRpY2FsICYmIHBvc2l0aW9uWSA8PSBzdXJmYWNlSGl0UG9zWVxuXHR2YXIgaXNEb3duID0gaXNWZXJ0aWNhbCAmJiBwb3NpdGlvblkgPj0gc3VyZmFjZUhpdFBvc1lcblx0dmFyIGlzTGVmdCA9IGlzSG9yaXpvbnRhbCAmJiBwb3NpdGlvblggPD0gc3VyZmFjZUhpdFBvc1hcblx0dmFyIGlzUmlnaHQgPSBpc0hvcml6b250YWwgJiYgcG9zaXRpb25YID49IHN1cmZhY2VIaXRQb3NYXG5cdHJldHVybiAoKChpc1VwICYmICh2ZWxvY2l0eS55ID49IDApICYmIChwb3NpdGlvblkgPj0gKHN1cmZhY2VIaXRQb3NZIC0gaGFsZkxlbmd0aCkpKVxuXHRcdCB8fCAoaXNEb3duICYmICh2ZWxvY2l0eS55IDw9IDApICYmIChwb3NpdGlvblkgPD0gKHN1cmZhY2VIaXRQb3NZICsgaGFsZkxlbmd0aCkpKSlcblx0XHR8fCAoKGlzTGVmdCAmJiAodmVsb2NpdHkueCA+PSAwKSAmJiAocG9zaXRpb25YIDw9IHN1cmZhY2VIaXRQb3NYKSAmJiAocG9zaXRpb25YID49IChzdXJmYWNlSGl0UG9zWCAtIGhhbGZMZW5ndGgpKSlcblx0XHQgICAgfHwgKGlzUmlnaHQgJiYgKHZlbG9jaXR5LnggPD0gMCkgJiYgKHBvc2l0aW9uWCA+PSBzdXJmYWNlSGl0UG9zWCkgJiYgKHBvc2l0aW9uWCA8PSAoc3VyZmFjZUhpdFBvc1ggKyBoYWxmTGVuZ3RoKSkpKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5jb21wdXRlQ29udGFjdCA9IGZ1bmN0aW9uKGhhbGZMZW5ndGgsIHBvc2l0aW9uLCB2ZWxvY2l0eSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpIHtcblx0dmFyIHF1YXJ0ZXJMZW5ndGggPSBoYWxmTGVuZ3RoIC8gMlxuXHR2YXIgcG9zaXRpb25YID0gcG9zaXRpb24ueFxuXHR2YXIgcG9zaXRpb25ZID0gcG9zaXRpb24ueVxuXHR2YXIgc3VyZmFjZVgxID0gc3VyZmFjZVAxLnhcblx0dmFyIHN1cmZhY2VZMSA9IHN1cmZhY2VQMS55XG5cdHZhciBzdXJmYWNlWDIgPSBzdXJmYWNlUDIueFxuXHR2YXIgc3VyZmFjZVkyID0gc3VyZmFjZVAyLnlcblx0dmFyIHNsb3BlID0gKHN1cmZhY2VZMiAtIHN1cmZhY2VZMSkgLyAoc3VyZmFjZVgyIC0gc3VyZmFjZVgxKVxuXHR2YXIgc3VyZmFjZUhpdFBvc1ggPSAoKHBvc2l0aW9uWSAtIHN1cmZhY2VZMSkgLyBzbG9wZSkgKyBzdXJmYWNlWDFcblx0dmFyIHN1cmZhY2VIaXRQb3NZID0gKChwb3NpdGlvblggLSBzdXJmYWNlWDEpICogc2xvcGUpICsgc3VyZmFjZVkxXG5cdHZhciBpc1ZlcnRpY2FsID0gKHBvc2l0aW9uWCA+PSAoc3VyZmFjZVgxIC0gcXVhcnRlckxlbmd0aCkgJiYgcG9zaXRpb25YIDw9IChzdXJmYWNlWDIgKyBxdWFydGVyTGVuZ3RoKSlcblx0dmFyIGlzSG9yaXpvbnRhbCA9IChwb3NpdGlvblkgPj0gKHN1cmZhY2VZMSAtIHF1YXJ0ZXJMZW5ndGgpICYmIHBvc2l0aW9uWSA8PSAoc3VyZmFjZVkyICsgcXVhcnRlckxlbmd0aCkpXG5cdHZhciBpc1VwID0gaXNWZXJ0aWNhbCAmJiBwb3NpdGlvblkgPD0gc3VyZmFjZUhpdFBvc1lcblx0dmFyIGlzRG93biA9IGlzVmVydGljYWwgJiYgcG9zaXRpb25ZID49IHN1cmZhY2VIaXRQb3NZXG5cdHZhciBpc0xlZnQgPSBpc0hvcml6b250YWwgJiYgcG9zaXRpb25YIDw9IHN1cmZhY2VIaXRQb3NYXG5cdHZhciBpc1JpZ2h0ID0gaXNIb3Jpem9udGFsICYmIHBvc2l0aW9uWCA+PSBzdXJmYWNlSGl0UG9zWFxuXHR2YXIgdmVsb2NpdHlNYWduaXR1ZGUgPSBtYWduaXR1ZGUodmVsb2NpdHkpXG5cdHZhciBkaXN0YW5jZSA9IDBcblx0Ly9IQUNLIEZJWE1FXG5cdGlmIChpc1VwICYmICh2ZWxvY2l0eS55ID49IDApKSB7XG5cdCAgICBkaXN0YW5jZSA9IHN1cmZhY2VIaXRQb3NZIC0gKHBvc2l0aW9uWSArIGhhbGZMZW5ndGgpXG5cdH0gZWxzZSBpZiAoaXNEb3duICYmICh2ZWxvY2l0eS55IDw9IDApKSB7XG5cdCAgICBkaXN0YW5jZSA9IChwb3NpdGlvblkgLSBoYWxmTGVuZ3RoKSAtIHN1cmZhY2VIaXRQb3NZXG5cdH0gZWxzZSBpZiAoaXNMZWZ0ICYmICh2ZWxvY2l0eS54ID49IDApICYmIChwb3NpdGlvblggPD0gc3VyZmFjZUhpdFBvc1gpKSB7XG5cdCAgICBkaXN0YW5jZSA9IHN1cmZhY2VIaXRQb3NYIC0gKHBvc2l0aW9uWCArIGhhbGZMZW5ndGgpXG5cdH0gZWxzZSBpZiAoaXNSaWdodCAmJiAodmVsb2NpdHkueCA8PSAwKSAmJiAocG9zaXRpb25YID49IHN1cmZhY2VIaXRQb3NYKSkge1xuXHQgICAgZGlzdGFuY2UgPSAocG9zaXRpb25YIC0gaGFsZkxlbmd0aCkgLSBzdXJmYWNlSGl0UG9zWFxuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIDEwMDAwMDBcblx0fVxuXHR2YXIgdGltZSA9IGRpc3RhbmNlIC8gdmVsb2NpdHlNYWduaXR1ZGUgXG5cdHJldHVybiBNYXRoLm1heCgwLCB0aW1lKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlID0gZnVuY3Rpb24ocDEsIHAyKSB7XG5cdHJldHVybiAocDEueSAtIHAyLnkpIC8gKHAxLnggLSBwMi54KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLmFuZ2xlID0gZnVuY3Rpb24ocDEsIHAyKSB7XG5cdHJldHVybiBNYXRoLmF0YW4yKHAxLnkgLSBwMi55LCBwMi54IC0gcDEueClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZVZlY3Rvcldyb25nID0gZnVuY3Rpb24ocDEsIHAyKSB7XG5cdHZhciBzbG9wZSA9IHRoaXMuc2xvcGUocDEsIHAyKSwgYXRuID0gTWF0aC5hdGFuKHNsb3BlKVxuXHR2YXIgc2lnbiA9IHAxLnggPCBwMi54ID8gLTEgOiAxXG5cdHJldHVybiBub3JtYWxpemVkKHt4OiBzaWduICogTWF0aC5zaW4oYXRuKSwgeTogc2lnbiAqIE1hdGguY29zKGF0bil9KVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZVZlY3RvciA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHR2YXIgc2xvcGUgPSB0aGlzLnNsb3BlKHAxLCBwMiksIGF0biA9IE1hdGguYXRhbihzbG9wZSlcblx0dmFyIHNpZ25YID0gcDEueCA8IHAyLnggPyAxIDogLTFcblx0dmFyIHNpZ25ZID0gcDEueSA8IHAyLnkgPyAxIDogLTFcblx0cmV0dXJuIG5vcm1hbGl6ZWQoe3g6IHNpZ25YICogTWF0aC5jb3MoYXRuKSwgeTogc2lnblggKiBNYXRoLnNpbihhdG4pfSlcbiAgICB9XG5cbiAgICAvLyBUaW1lciBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1RpbWVyQ29uc3RyYWludCh0aW1lcikge1xuXHR0aGlzLnRpbWVyID0gdGltZXJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyKFRpbWVyIFQpIHN0YXRlcyB0aGUgc3lzdGVtIGFkdmFuY2VzIGl0cyBwc2V1ZG8tdGltZSBieSBUJ3Mgc3RlcCBzaXplIGF0IGVhY2ggZnJhbWUgY3ljbGUuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJ0aGUgc3lzdGVtIGFkdmFuY2VzIGl0cyBwc2V1ZG8tdGltZSBieSBcIiArIHRoaXMudGltZXIuc3RlcFNpemUgKyBcIiBhdCBlYWNoIGZyYW1lIGN5Y2xlLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHt0aW1lcjogJ1RpbWVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIDBcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXJDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7fVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lckNvbnN0cmFpbnQoU2tldGNocGFkLnNpbXVsYXRpb24uVGltZXIuZHVtbXkoeCwgeSkpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyQ29uc3RyYWludC5wcm90b3R5cGUucHJvcG9zZU5leHRQc2V1ZG9UaW1lID0gZnVuY3Rpb24ocHNldWRvVGltZSkge1xuXHRyZXR1cm4gcHNldWRvVGltZSArIHRoaXMudGltZXIuc3RlcFNpemVcbiAgICB9ICAgIFxuXG4gICAgLy8gVmFsdWVTbGlkZXJDb25zdHJhaW50IENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fVmFsdWVTbGlkZXJDb25zdHJhaW50KHNsaWRlclBvaW50LCB4T3JZLCBzbGlkZXJaZXJvVmFsdWUsIHNsaWRlclJhbmdlTGVuZ3RoLCBzbGlkZWRPYmosIHNsaWRlZFByb3ApIHtcblx0dGhpcy5zbGlkZXJQb2ludCA9IHNsaWRlclBvaW50XG5cdHRoaXMueE9yWSA9IHhPcllcblx0dGhpcy5zbGlkZXJaZXJvVmFsdWUgPSBzbGlkZXJaZXJvVmFsdWVcblx0dGhpcy5zbGlkZXJSYW5nZUxlbmd0aCA9IHNsaWRlclJhbmdlTGVuZ3RoXG5cdHRoaXMuc2xpZGVkT2JqID0gc2xpZGVkT2JqXG5cdHRoaXMuc2xpZGVkUHJvcCA9IHNsaWRlZFByb3Bcblx0dGhpcy5zbGlkZWRPYmpQcm9wWmVyb1ZhbHVlID0gc2xpZGVkT2JqW3NsaWRlZFByb3BdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzbGlkZXJQb2ludDogJ1BvaW50JywgeE9yWTogJ1N0cmluZycsIHNsaWRlclplcm9WYWx1ZTogJ051bWJlcicsIHNsaWRlclJhbmdlTGVuZ3RoOiAnTnVtYmVyJywgc2xpZGVkT2JqUHJvcFplcm9WYWx1ZTogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzbGlkZWRQcm9wID0gdGhpcy5zbGlkZWRQcm9wXG5cdHZhciBjdXJyU2xpZGVyRGlmZiA9ICh0aGlzLnNsaWRlclplcm9WYWx1ZSAtIHRoaXMuc2xpZGVyUG9pbnRbdGhpcy54T3JZXSkgLyB0aGlzLnNsaWRlclJhbmdlTGVuZ3RoXG5cdHZhciBzbGlkZWRPYmpQcm9wVGFyZ2V0ID0gKDEgKyBjdXJyU2xpZGVyRGlmZikgKiB0aGlzLnNsaWRlZE9ialByb3BaZXJvVmFsdWVcblx0cmV0dXJuIHNsaWRlZE9ialByb3BUYXJnZXQgLSB0aGlzLnNsaWRlZE9ialtzbGlkZWRQcm9wXVxuXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzb2xuID0ge31cblx0dmFyIHNsaWRlZFByb3AgPSB0aGlzLnNsaWRlZFByb3Bcblx0dmFyIGN1cnJTbGlkZXJEaWZmID0gKHRoaXMuc2xpZGVyWmVyb1ZhbHVlIC0gdGhpcy5zbGlkZXJQb2ludFt0aGlzLnhPclldKSAvIHRoaXMuc2xpZGVyUmFuZ2VMZW5ndGhcblx0dmFyIHNsaWRlZE9ialByb3BUYXJnZXQgPSAoMSArIGN1cnJTbGlkZXJEaWZmKSAqIHRoaXMuc2xpZGVkT2JqUHJvcFplcm9WYWx1ZVxuXHRzb2xuW3NsaWRlZFByb3BdID0gc2xpZGVkT2JqUHJvcFRhcmdldFxuXHR0aGlzLnNsaWRlclBvaW50LnNlbGVjdGlvbkluZGljZXNbMF0gPSBNYXRoLmZsb29yKDEwMCAqIGN1cnJTbGlkZXJEaWZmKVxuXHRyZXR1cm4ge3NsaWRlZE9iajogc29sbn1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJDb25zdHJhaW50KFBvaW50LmR1bW15KHgsIHkpLCAneCcsIDAsIDEwMCwge2ZvbzogMH0sICdmb28nKVxuICAgIH1cblxuICAgIC8vIE1vdGlvbiBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1ZlbG9jaXR5Q29uc3RyYWludChib2R5KSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keSd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSl9XG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50KEZyZWVCb2R5IEJvZHkpIHN0YXRlcyBmb3IgQm9keTogUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJmb3IgQm9keSBcIiArIHRoaXMuYm9keS5fX3RvU3RyaW5nICsgXCIgUG9zID0gb2xkKFBvcykgKyAoXCIgKyB0aGlzLnZlbG9jaXR5LnggKyBcIixcIiArICB0aGlzLnZlbG9jaXR5LnkgKyBcIikgKiBkdCwgd2hlcmUgZHQgaXMgdGhlIGZyYW1lIHN0ZXAgdGltZSBhbW91bnQuXCIgfVxuXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR0aGlzLmxhc3RQb3NpdGlvbiA9IHNjYWxlZEJ5KHRoaXMucG9zaXRpb24sIDEpXG4gICAgfVxuICAgICAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgY3R4dCA9IGNhbnZhcy5jdHh0XG5cdHZhciBzbG9wZVYgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZVZlY3Rvcih0aGlzLnBvc2l0aW9uLCB0aGlzLnZlbG9jaXR5KVx0XG5cdHZhciBsZW4gPSA1MFxuXHR2YXIgcCA9IHBsdXModGhpcy5wb3NpdGlvbiwge3g6IHNsb3BlVi54ICogbGVuLCB5OiBzbG9wZVYueSAqIGxlbn0pXG5cdGNhbnZhcy5kcmF3QXJyb3codGhpcy5wb3NpdGlvbiwgcCwgb3JpZ2luLCAndicpXG4gICAgfVxuICAgIFxuICAgIC8vIEJvZHkgV2l0aCBWZWxvY2l0eSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19WZWxvY2l0eUNvbnN0cmFpbnQyKGJvZHksIHZlbG9jaXR5KSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIHZlbG9jaXR5OiAnUG9pbnRWZWN0b3InfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eS5tYWduaXR1ZGUoKSwgZHQpKSwgdGhpcy5wb3NpdGlvbikpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50MihGcmVlQm9keSBCb2R5LCBQb2ludFZlY3RvciBWZWxvY2l0eSkgc3RhdGVzIGZvciBCb2R5OiBQb3MgPSBvbGQoUG9zKSArIFZlbG9jaXR5ICogKHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZSkgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJmb3IgQm9keSBcIiArIHRoaXMuYm9keS5fX3RvU3RyaW5nICsgXCI6IFBvcyA9IG9sZChQb3MpICsgKHZlY3RvciBcIiArIHRoaXMudmVsb2NpdHkuX190b1N0cmluZyArIFwiKSAqIGR0LCB3aGVyZSBkdCBpcyB0aGUgZnJhbWUgc3RlcCB0aW1lIGFtb3VudCAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUNvbnN0cmFpbnQyKEZyZWVCb2R5LmR1bW15KHgsIHkpLCBQb2ludFZlY3Rvci5kdW1teSh4LCB5KSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG4gICAgXG4gICAgLy8gQWNjZWxlcmF0aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0FjY2VsZXJhdGlvbkNvbnN0cmFpbnQoYm9keSwgYWNjZWxlcmF0aW9uKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb25cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludCwgdHJ1ZSlcbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIGFjY2VsZXJhdGlvbjogJ1ZlY3Rvcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFZlbG9jaXR5LCBzY2FsZWRCeSh0aGlzLmFjY2VsZXJhdGlvbiwgZHQpKSwgdGhpcy52ZWxvY2l0eSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHt2ZWxvY2l0eTogcGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludChGcmVlQm9keSBCb2R5LCBWZWN0b3IgQWNjZWxlcmF0aW9uKSBzdGF0ZXMgZm9yIEJvZHk6IFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSArIEFjY2VsZXJhdGlvbiAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiZm9yIEJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiOiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKyAoXCIgKyB0aGlzLmFjY2VsZXJhdGlvbi54ICsgXCIsXCIgKyAgdGhpcy5hY2NlbGVyYXRpb24ueSArIFwiKSAqIGR0LCB3aGVyZSBkdCBpcyB0aGUgZnJhbWUgc3RlcCB0aW1lIGFtb3VudCAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25Db25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCArIDUwLCB5ICsgNTApKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RWZWxvY2l0eSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIDEpXG4gICAgfVxuXG4gICAgLy8gQWlyIFJlc2lzdGFuY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0FpclJlc2lzdGFuY2VDb25zdHJhaW50KGJvZHksIHNjYWxlKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5zY2FsZSA9IC1zY2FsZVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3NjYWxlOiAnTnVtYmVyJywgdmVsb2NpdHk6ICdWZWN0b3InfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMoc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpLCB0aGlzLnZlbG9jaXR5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge3ZlbG9jaXR5OiBzY2FsZWRCeSh0aGlzLmxhc3RWZWxvY2l0eSwgdGhpcy5zY2FsZSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50KEZyZWVCb2R5IEJvZHkpIHN0YXRlcyBmb3IgQm9keTogVmVsb2NpdHkgPSBvbGQoVmVsb2NpdHkpICogU2NhbGUgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiZm9yIEJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiOiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKiBcIiArIHRoaXMuc2NhbGUgK1wiIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BaXJSZXNpc3RhbmNlQ29uc3RyYWludChTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIC4xKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0VmVsb2NpdHkgPSBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCAxKVxuICAgIH1cblxuICAgIC8vICBCb3VuY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fQm91bmNlQ29uc3RyYWludChib2R5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMuaGFsZkxlbmd0aCA9IGJvZHkucmFkaXVzXG5cdHRoaXMucG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG5cdHRoaXMuc3VyZmFjZVAxID0gc3VyZmFjZVAxXG5cdHRoaXMuc3VyZmFjZVAyID0gc3VyZmFjZVAyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIHN1cmZhY2VQMTogJ1BvaW50Jywgc3VyZmFjZVAyOiAnUG9pbnQnfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdC8qXG5cdCAgdmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eVxuXHQgIHZhciBzdXJmYWNlUDEgPSB0aGlzLnN1cmZhY2VQMVxuXHQgIHZhciBzdXJmYWNlUDIgPSB0aGlzLnN1cmZhY2VQMlxuXHQgIHJldHVybiB0aGlzLmNvbnRhY3QgPyAoXG5cdCAgbWFnbml0dWRlKG1pbnVzKHRoaXMuYm91bmNlVmVsb2NpdHksIHRoaXMudmVsb2NpdHkpKSBcblx0ICArIG1hZ25pdHVkZShtaW51cyh0aGlzLmJvdW5jZVBvc2l0aW9uLCB0aGlzLnBvc2l0aW9uKSkgXG5cdCAgKSA6IDBcblx0Ki9cblx0cmV0dXJuIDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdC8qXG5cdCAgdmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdCAgcmV0dXJuIHt2ZWxvY2l0eTogXG5cdCAgbWludXMocGx1cyh0aGlzLmJvdW5jZVZlbG9jaXR5LCBzY2FsZWRCeSh7eDogMCwgeTogLVNrZXRjaHBhZC5zaW11bGF0aW9uLmd9LCBkdCkpLCB0aGlzLnZlbG9jaXR5KSxcblx0ICBwb3NpdGlvbjogKG1pbnVzKHRoaXMuYm91bmNlUG9zaXRpb24sIHRoaXMucG9zaXRpb24pKVxuXHQgIH1cblx0Ki9cblx0cmV0dXJuIHt9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludChGcmVlQm9keSBCb2R5LCBQb2ludCBFbmQxLCBQb2ludCBFbmQyKSBzdGF0ZXMgdGhhdCB0aGUgQm9keSB3aXRoIGRpYW1ldGVyIEwgYW5kIHBvc2l0aW9uIFBvcyBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbCBpcyBnb2luZyB0byBib3VuY2Ugb2ZmIHRoZSBsaW5lIHdpdGggdHdvIGVuZCBwb2ludHMgRW5kMSAmIEVuZDIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIkJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiIHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGJvdW5jZSBvZmYgdGhlIGxpbmUgd2l0aCB0d28gZW5kIHBvaW50cyBcIiArIHRoaXMuc3VyZmFjZVAxLl9fdG9TdHJpbmcgKyBcIiAmIFwiICsgdGhpcy5zdXJmYWNlUDIuX190b1N0cmluZyArIFwiLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQ29uc3RyYWludChGcmVlQm9keS5kdW1teSh4LCB5KSwgUG9pbnQuZHVtbXkoeCwgeSksIFBvaW50LmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnByb3Bvc2VOZXh0UHNldWRvVGltZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUpIHtcblx0dmFyIHJlcyA9IHBzZXVkb1RpbWUgKyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5jb21wdXRlQ29udGFjdCh0aGlzLmhhbGZMZW5ndGgsIHRoaXMucG9zaXRpb24sIHRoaXMudmVsb2NpdHksIHRoaXMuc3VyZmFjZVAxLCB0aGlzLnN1cmZhY2VQMilcblx0dGhpcy50Y29udGFjdCA9IHJlcztcblx0cmV0dXJuIHJlc1xuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvblxuXHR2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdHZhciBzdXJmYWNlUDEgPSB0aGlzLnN1cmZhY2VQMVxuXHR2YXIgc3VyZmFjZVAyID0gdGhpcy5zdXJmYWNlUDJcbiAgICAgICAgLy9Ta2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikpIHtcblx0aWYgKHRoaXMudGNvbnRhY3QgPT0gcHNldWRvVGltZSkgeyBcblx0ICAgIHRoaXMudGNvbnRhY3QgPSB1bmRlZmluZWRcblx0ICAgIHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHQgICAgdmFyIHNsb3BlID0gKHN1cmZhY2VQMi55IC0gc3VyZmFjZVAxLnkpIC8gKHN1cmZhY2VQMi54IC0gc3VyZmFjZVAxLngpXG5cdCAgICB2YXIgc3VyZmFjZUhpdFBvc1ggPSBzdXJmYWNlUDIueSA9PSBzdXJmYWNlUDEueSA/IHBvc2l0aW9uLnggOiAoKHBvc2l0aW9uLnkgLSBzdXJmYWNlUDEueSkgLyBzbG9wZSkgKyBzdXJmYWNlUDEueFxuXHQgICAgdmFyIHN1cmZhY2VIaXRQb3NZID0gc3VyZmFjZVAyLnggPT0gc3VyZmFjZVAxLnggPyBwb3NpdGlvbi55IDogKChwb3NpdGlvbi54IC0gc3VyZmFjZVAxLngpICogc2xvcGUpICsgc3VyZmFjZVAxLnlcblx0ICAgIHZhciBzdXJmYWNlQW5nbGUgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5hbmdsZShzdXJmYWNlUDEsIHN1cmZhY2VQMilcblx0ICAgIHZhciB2ZWxvY2l0eUFuZ2xlID0gU2tldGNocGFkLnNpbXVsYXRpb24uYW5nbGUoe3g6IDAsIHk6IDB9LCB2ZWxvY2l0eSlcblx0ICAgIHZhciByZWZsZWN0aW9uQW5nbGUgPSBzdXJmYWNlQW5nbGUgLSB2ZWxvY2l0eUFuZ2xlIFxuXHQgICAgdmFyIHZlbG9jaXR5TWFnbml0dWRlID0gTWF0aC5zcXJ0KCh2ZWxvY2l0eS54ICogdmVsb2NpdHkueCkgKyAodmVsb2NpdHkueSAqIHZlbG9jaXR5LnkpKVxuXHQgICAgdmFyIGFuZ2xlQyA9IE1hdGguY29zKHJlZmxlY3Rpb25BbmdsZSlcblx0ICAgIHZhciBhbmdsZVMgPSBNYXRoLnNpbihyZWZsZWN0aW9uQW5nbGUpXG5cdCAgICB2YXIgeCA9IGFuZ2xlQyAqIHZlbG9jaXR5TWFnbml0dWRlICogMVxuXHQgICAgdmFyIHkgPSBhbmdsZVMgKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIC0xXG5cdCAgICB0aGlzLmJvdW5jZVZlbG9jaXR5ID0gc2NhbGVkQnkoe3g6IHgsIHk6IHl9LCAxKVxuXHQgICAgdmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yV3Jvbmcoc3VyZmFjZVAxLCBzdXJmYWNlUDIpXG5cdCAgICB2YXIgZGVsdGFQb3NYID0gc2xvcGVWLnggKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIGR0XG5cdCAgICB2YXIgZGVsdGFQb3NZID0gc2xvcGVWLnkgKiAtdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgdGhpcy5ib3VuY2VQb3NpdGlvbiA9IHt4OiBwb3NpdGlvbi54ICsgZGVsdGFQb3NYLCB5OiBwb3NpdGlvbi55ICsgZGVsdGFQb3NZfVxuXG5cdCAgICAvLyBIQUNLIEZJWE1FPyBzZXQgdmVsb2NpdHkgYXRvbWljYWxseSByaWdodCBoZXJlISFcblx0ICAgIC8vdGhpcy5jb250YWN0ID0gdHJ1ZVxuXHQgICAgdmVsb2NpdHkueCA9IHRoaXMuYm91bmNlVmVsb2NpdHkueFxuXHQgICAgdmVsb2NpdHkueSA9IHRoaXMuYm91bmNlVmVsb2NpdHkueVxuXHQgICAgcG9zaXRpb24ueCA9IHRoaXMuYm91bmNlUG9zaXRpb24ueFxuXHQgICAgcG9zaXRpb24ueSA9IHRoaXMuYm91bmNlUG9zaXRpb24ueVxuXG5cdH0gZWxzZVxuXHQgICAgdGhpcy5jb250YWN0ID0gZmFsc2VcbiAgICB9XG5cbiAgICAvLyAgSGl0U3VyZmFjZSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fSGl0U3VyZmFjZUNvbnN0cmFpbnQoYm9keSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLmhhbGZMZW5ndGggPSBib2R5LnJhZGl1cyAvIDJcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5zdXJmYWNlUDEgPSBzdXJmYWNlUDFcblx0dGhpcy5zdXJmYWNlUDIgPSBzdXJmYWNlUDJcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknLCBzdXJmYWNlUDE6ICdQb2ludCcsIHN1cmZhY2VQMjogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gdGhpcy5jb250YWN0ID8gKFxuXHQgICAgbWFnbml0dWRlKG1pbnVzKHRoaXMuaGl0VmVsb2NpdHksIHRoaXMudmVsb2NpdHkpKSArIFxuXHRcdG1hZ25pdHVkZShtaW51cyh0aGlzLmhpdFBvc2l0aW9uLCB0aGlzLnBvc2l0aW9uKSkgXG5cdCkgOiAwXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogdGhpcy5oaXRWZWxvY2l0eSwgcG9zaXRpb246IHRoaXMuaGl0UG9zaXRpb259XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50KEZyZWVCb2R5IEJvZHksIFBvaW50IEVuZDEsIFBvaW50IEVuZDIpIHN0YXRlcyB0aGF0IHRoZSBCb2R5IHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIHN0YXkgb24gdGhlIGxpbmUgd2l0aCB0d28gZW5kIHBvaW50cyBFbmQxICYgRW5kMi5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIkJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiIHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIHN0YXkgb24gdGhlIGxpbmUgd2l0aCB0d28gZW5kIHBvaW50cyBcIiArIHRoaXMuc3VyZmFjZVAxLl9fdG9TdHJpbmcgKyBcIiAmIFwiICsgdGhpcy5zdXJmYWNlUDIuX190b1N0cmluZyArIFwiLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VDb25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBQb2ludC5kdW1teSh4LCB5KSwgUG9pbnQuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvblxuXHR2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdHZhciBzdXJmYWNlUDEgPSB0aGlzLnN1cmZhY2VQMVxuXHR2YXIgc3VyZmFjZVAyID0gdGhpcy5zdXJmYWNlUDJcblx0aWYgKFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSkge1xuXHQgICAgdGhpcy5jb250YWN0ID0gdHJ1ZVxuXHQgICAgdmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdCAgICB2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3JXcm9uZyhzdXJmYWNlUDEsIHN1cmZhY2VQMilcblx0ICAgIHRoaXMuaGl0VmVsb2NpdHkgPSBzY2FsZWRCeSh7eDogMCwgeTogLVNrZXRjaHBhZC5zaW11bGF0aW9uLmd9LCBkdClcblx0ICAgIHZhciB2ZWxvY2l0eU1hZ25pdHVkZSA9IE1hdGguc3FydCgodmVsb2NpdHkueCAqIHZlbG9jaXR5LngpICsgKHZlbG9jaXR5LnkgKiB2ZWxvY2l0eS55KSlcblx0ICAgIGRlbHRhUG9zWCA9IHNsb3BlVi54ICogdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgZGVsdGFQb3NZID0gc2xvcGVWLnkgKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIGR0XG5cdCAgICB0aGlzLmhpdFBvc2l0aW9uID0ge3g6IHBvc2l0aW9uLnggKyBkZWx0YVBvc1gsIHk6IHBvc2l0aW9uLnkgKyBkZWx0YVBvc1l9XG5cdH0gZWxzZVxuXHQgICAgdGhpcy5jb250YWN0ID0gZmFsc2VcbiAgICB9XG4gICAgXG4gICAgLy8gQ29udmV5b3IgQmVsdCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19Db252ZXlvckJlbHRDb25zdHJhaW50KGJvZHksIGJlbHQpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLmhhbGZMZW5ndGggPSBib2R5LnJhZGl1c1xuXHR0aGlzLnBvc2l0aW9uID0gYm9keS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuXHR0aGlzLmJlbHQgPSBiZWx0XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIGJlbHQ6ICdCZWx0J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdC8vdmFyIGJlbHQgPSB0aGlzLmJlbHRcblx0Ly92YXIgYmVsdFAxID0gYmVsdC5wb3NpdGlvbjFcblx0Ly92YXIgYmVsdFAyID0gYmVsdC5wb3NpdGlvbjJcblx0Ly9yZXR1cm4gKFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCB0aGlzLnBvc2l0aW9uLCB0aGlzLnZlbG9jaXR5LCBiZWx0UDEsIGJlbHRQMikpID8gMSA6IDBcdFxuXHRyZXR1cm4gdGhpcy5jb250YWN0ID8gbWFnbml0dWRlKG1pbnVzKHRoaXMudGFyZ2V0VmVsb2NpdHksIHRoaXMudmVsb2NpdHkpKSA6IDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7dmVsb2NpdHk6IHRoaXMudGFyZ2V0VmVsb2NpdHl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludChOdW1iZXIgTCwgRnJlZUJvZHkgQm9keSwgQ29udmV5b3JCZWx0IEJlbHQpIHN0YXRlcyB0aGF0IHRoZSBib2R5IHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIG1vdmUgYmFzZWQgb24gdGhlIGNvbnZleW9yIGJlbHQgQmVsdCdzIHZlbG9jaXR5LlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJCb2R5XCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiIHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIG1vdmUgYmFzZWQgb24gdGhlIGNvbnZleW9yIGJlbHQgQmVsdCBcIiArIHRoaXMuYmVsdC5fX3RvU3RyaW5nICsgXCIncyB2ZWxvY2l0eS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdENvbnN0cmFpbnQoRnJlZUJvZHkuZHVtbXkoeCwgeSksIEJlbHQuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0Q29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdHZhciBiZWx0ID0gdGhpcy5iZWx0XG5cdHZhciBiZWx0UDEgPSBiZWx0LnBvc2l0aW9uMVxuXHR2YXIgYmVsdFAyID0gYmVsdC5wb3NpdGlvbjJcblx0dmFyIGJlbHRTcGVlZCA9IGJlbHQuc3BlZWRcblx0aWYgKFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCB0aGlzLnBvc2l0aW9uLCB2ZWxvY2l0eSwgYmVsdFAxLCBiZWx0UDIpKSB7XG5cdCAgICB0aGlzLmNvbnRhY3QgPSB0cnVlXG5cdCAgICB2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3JXcm9uZyhiZWx0UDEsIGJlbHRQMilcblx0ICAgIHRoaXMudGFyZ2V0VmVsb2NpdHkgPSB7eDogdmVsb2NpdHkueCArIChzbG9wZVYueSAqIGJlbHRTcGVlZCksIHk6IHZlbG9jaXR5LnkgKyAoc2xvcGVWLnggKiBiZWx0U3BlZWQpfVxuXHR9IGVsc2Vcblx0ICAgIHRoaXMuY29udGFjdCA9IGZhbHNlXG4gICAgfVxuICAgIFxuICAgIC8vIE5vT3ZlcmxhcCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19Ob092ZXJsYXBDb25zdHJhaW50KGJvZHkxLCBib2R5Mikge1xuXHR0aGlzLmJvZHkxID0gYm9keTFcblx0dGhpcy5sZW5ndGgxID0gYm9keTEucmFkaXVzIC8gMlxuXHR0aGlzLnBvc2l0aW9uMSA9IGJvZHkxLnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkxID0gYm9keTEudmVsb2NpdHlcblx0dGhpcy5ib2R5MiA9IGJvZHkyXG5cdHRoaXMubGVuZ3RoMiA9IGJvZHkyLnJhZGl1cyAvIDJcblx0dGhpcy5wb3NpdGlvbjIgPSBib2R5Mi5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5MiA9IGJvZHkyLnZlbG9jaXR5XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQsIHRydWUpXG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5MTogJ0ZyZWVCb2R5JywgYm9keTI6ICdGcmVlQm9keSd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgbGVuZ3RoMSA9IHRoaXMubGVuZ3RoMVxuXHR2YXIgcG9zaXRpb24xID0gdGhpcy5wb3NpdGlvbjFcblx0dmFyIHZlbG9jaXR5MSA9IHRoaXMudmVsb2NpdHkxXG5cdHZhciBsZW5ndGgyID0gdGhpcy5sZW5ndGgyXG5cdHZhciBwb3NpdGlvbjIgPSB0aGlzLnBvc2l0aW9uMlxuXHR2YXIgcDF4ID0gcG9zaXRpb24xLngsIHAxeSA9IHBvc2l0aW9uMS55XG5cdHZhciBwMnggPSBwb3NpdGlvbjIueCwgcDJ5ID0gcG9zaXRpb24yLnlcblx0cmV0dXJuICgocDF4ID4gcDJ4IC0gbGVuZ3RoMiAvIDIgJiYgcDF4IDwgcDJ4ICsgbGVuZ3RoMikgJiZcblx0XHQocDF5ID4gcDJ5IC0gbGVuZ3RoMiAvIDIgJiYgcDF5IDwgcDJ5ICsgbGVuZ3RoMikpID8gMSA6IDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsZW5ndGgxID0gdGhpcy5sZW5ndGgxXG5cdHZhciBwb3NpdGlvbjEgPSB0aGlzLnBvc2l0aW9uMVxuXHR2YXIgdmVsb2NpdHkxID0gdGhpcy52ZWxvY2l0eTFcblx0dmFyIGxlbmd0aDIgPSB0aGlzLmxlbmd0aDJcblx0dmFyIHBvc2l0aW9uMiA9IHRoaXMucG9zaXRpb24yXG5cdHZhciBwMXggPSBwb3NpdGlvbjEueFxuXHR2YXIgcDJ4ID0gcG9zaXRpb24yLnhcblx0dmFyIHNvbG4gPSBwMXggPiBwMnggPyB7cG9zaXRpb24yOiB7eDogcDF4IC0gKGxlbmd0aDIpfX0gOiB7cG9zaXRpb24xOiB7eDogcDJ4IC0gKGxlbmd0aDEpfX1cblx0cmV0dXJuIHNvbG5cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50KEZyZWVCb2R5IEJvZHkxLCBGcmVlQm9keSBCb2R5MSkgc3RhdGVzIHRoYXQgdGhlIEJvZHkxIHdpdGggZGlhbWV0ZXIgTDEgYW5kIHBvc2l0aW9uIFBvczEgYW5kIHZlbG9jaXR5IHZlY3RvciBWZWwxIGFuZCB0aGUgQm9keTIgd2l0aCBkaWFtZXRlciBMMiBhbmQgcG9zaXRpb24gUG9zMiBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbDIgd2lsbCBwdXNoIGVhY2ggb3RoZXIgaWYgdG91Y2hpbmcuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uTm9PdmVybGFwQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIkJvZHkgXCIgKyB0aGlzLmJvZHkxLl9fdG9TdHJpbmcgKyBcIiB3aXRoIGRpYW1ldGVyIEwxIGFuZCBwb3NpdGlvbiBQb3MxIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsMSBhbmQgdGhlIEJvZHkgXCIgKyB0aGlzLmJvZHkyLl9fdG9TdHJpbmcgKyBcIiB3aXRoIGRpYW1ldGVyIEwyIGFuZCBwb3NpdGlvbiBQb3MyIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsMiB3aWxsIHB1c2ggZWFjaCBvdGhlciBpZiB0b3VjaGluZy5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Ob092ZXJsYXBDb25zdHJhaW50LmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5zaW11bGF0aW9uLk5vT3ZlcmxhcENvbnN0cmFpbnQoRnJlZUJvZHkuZHVtbXkoeCwgeSksIEZyZWVCb2R5LmR1bW15KHggKzEwMCwgeSArIDEwMCkpXG4gICAgfVxuXG4gICAgLy8gIFNwcmluZyBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19TcHJpbmdDb25zdHJhaW50KGJvZHkxLCBib2R5Miwgc3ByaW5nKSB7XG5cdHRoaXMuYm9keTEgPSBib2R5MVxuXHR0aGlzLmJvZHkyID0gYm9keTJcblx0dGhpcy5wb3NpdGlvbjEgPSBib2R5MS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5MSA9IGJvZHkxLnZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uMSA9IGJvZHkxLmFjY2VsZXJhdGlvblxuXHR0aGlzLm1hc3MxID0gYm9keTEubWFzc1xuXHR0aGlzLnBvc2l0aW9uMiA9IGJvZHkyLnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkyID0gYm9keTIudmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24yID0gYm9keTIuYWNjZWxlcmF0aW9uXG5cdHRoaXMubWFzczIgPSBib2R5Mi5tYXNzXG5cdHRoaXMuc3ByaW5nID0gc3ByaW5nXG5cdHRoaXMuX2xhc3RWZWxvY2l0aWVzID0gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5MTogJ0ZyZWVCb2R5JywgYm9keTI6ICdGcmVlQm9keScsIHNwcmluZzogJ1NwcmluZyd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3ByaW5nID0gdGhpcy5zcHJpbmdcblx0aWYgKHNwcmluZy50b3JuKSB7XG5cdCAgICByZXR1cm4gMFxuXHR9XG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHR2YXIgZXJyID0gMFxuXHRmb3IgKHZhciBpID0gMDsgaSA8PSAxOyBpKyspIHtcblx0ICAgIHZhciBqID0gKGkgKyAxKSAlIDJcblx0ICAgIHZhciBtYXNzID0gbWFzc2VzW2pdXG5cdCAgICBpZiAobWFzcyA+IDApIHsgLy8gaWYgbm90IGFuY2hvcmVkXG5cdFx0dmFyIGN1cnJBY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb25zW2pdXG5cdFx0dmFyIHBvc2l0aW9uMSA9IHBvc2l0aW9uc1tpXVxuXHRcdHZhciBwb3NpdGlvbjIgPSBwb3NpdGlvbnNbal1cblx0XHR2YXIgdmVjdG9yID0gbWludXMocG9zaXRpb24yLCBwb3NpdGlvbjEpXG5cdFx0dmFyIHNwcmluZ0N1cnJMZW4gPSBtYWduaXR1ZGUodmVjdG9yKVx0XHRcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0dmFyIGFjYyA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQodmVjdG9yKSwgLW5ld0FjY2VsZXJhdGlvbk1hZylcblx0XHRlcnIgKz0gbWFnbml0dWRlKG1pbnVzKGFjYywgY3VyckFjY2VsZXJhdGlvbikpXG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIGVyclxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNvbG4gPSB7fVxuXHR2YXIgc3ByaW5nID0gdGhpcy5zcHJpbmdcblx0dmFyIHBvc2l0aW9ucyA9IFt0aGlzLnBvc2l0aW9uMSwgdGhpcy5wb3NpdGlvbjJdXG5cdHZhciBtYXNzZXMgPSBbdGhpcy5tYXNzMSwgdGhpcy5tYXNzMl1cblx0dmFyIHZlbG9jaXRpZXMgPSBbdGhpcy52ZWxvY2l0eTEsIHRoaXMudmVsb2NpdHkyXVxuXHR2YXIgYWNjZWxlcmF0aW9ucyA9IFt0aGlzLmFjY2VsZXJhdGlvbjEsIHRoaXMuYWNjZWxlcmF0aW9uMl1cblx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gMTsgaSsrKSB7XG5cdCAgICB2YXIgaiA9IChpICsgMSkgJSAyXG5cdCAgICB2YXIgbWFzcyA9IG1hc3Nlc1tqXVxuXHQgICAgdmFyIGFjYywgdG9ybiA9IGZhbHNlXG5cdCAgICBpZiAobWFzcyA+IDApIHsgLy8gaWYgbm90IGFuY2hvcmVkXG5cdFx0dmFyIHBvc2l0aW9uMSA9IHBvc2l0aW9uc1tpXVxuXHRcdHZhciBwb3NpdGlvbjIgPSBwb3NpdGlvbnNbal1cblx0XHR2YXIgdmVjdG9yID0gbWludXMocG9zaXRpb24yLCBwb3NpdGlvbjEpXG5cdFx0dmFyIHNwcmluZ0N1cnJMZW4gPSBtYWduaXR1ZGUodmVjdG9yKVxuXHRcdHZhciBzdHJldGNoTGVuID0gIHNwcmluZ0N1cnJMZW4gLSBzcHJpbmcubGVuZ3RoXG5cdFx0Ly8gaWYgbm90IHRvcm4gYXBhcnQuLi5cblx0XHR0b3JuID0gc3RyZXRjaExlbiA+IHNwcmluZy50ZWFyUG9pbnRBbW91bnRcblx0XHRpZiAoIXRvcm4pIHtcblx0XHQgICAgdmFyIG5ld0FjY2VsZXJhdGlvbk1hZyA9IHNwcmluZy5rICogc3RyZXRjaExlbiAvIG1hc3Ncblx0XHQgICAgYWNjID0gc2NhbGVkQnkobm9ybWFsaXplZCh2ZWN0b3IpLCAtbmV3QWNjZWxlcmF0aW9uTWFnKVxuXHRcdH0gXG5cdCAgICB9XG5cdCAgICBpZiAodG9ybilcblx0XHRzb2xuWydzcHJpbmcnXSA9IHt0b3JuOiB0cnVlfVxuXHQgICAgaWYgKGFjYylcblx0XHRzb2xuWydhY2NlbGVyYXRpb24nICsgKGorMSldID0gYWNjXG5cdH1cdFxuXHRyZXR1cm4gc29sblxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ0NvbnN0cmFpbnQoRnJlZUJvZHkgQm9keTEsIEZyZWVCb2R5IEJvZHkyLCBTcHJpbmcgUykgc3RhdGVzIHRoYXQgc3ByaW5nIFMgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdHdvIGJvZGllcyBCb2R5MSBhbmQgQm9keTIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcInNwcmluZyBcIiArIHRoaXMuc3ByaW5nLl9fdG9TdHJpbmcgKyBcIiBoYXMgYmVlbiBhdHRhY2hlZCB0byB0d28gYm9kaWVzIFwiICsgdGhpcy5ib2R5MS5fX3RvU3RyaW5nICsgXCIgYW5kIFwiICsgdGhpcy5ib2R5Mi5fX3RvU3RyaW5nICsgXCIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nQ29uc3RyYWludC5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdDb25zdHJhaW50KEZyZWVCb2R5LmR1bW15KHgsIHkpLCBGcmVlQm9keS5kdW1teSh4KzEwMCwgeSsxMDApLCBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcuZHVtbXkoeCwgeSkpXG4gICAgfVxuXG4gICAgLy8gIE9yYml0YWxNb3Rpb24gQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX09yYml0YWxNb3Rpb25Db25zdHJhaW50KHN1biwgbW9vbiwgZGlzdGFuY2VEb3duc2NhbGUpIHtcblx0dGhpcy5zdW4gPSBzdW5cblx0dGhpcy5tb29uID0gbW9vblxuXHR0aGlzLmFjY2VsZXJhdGlvbiA9IG1vb24uYWNjZWxlcmF0aW9uXG5cdHRoaXMuZGlzdGFuY2VEb3duc2NhbGUgPSAoZGlzdGFuY2VEb3duc2NhbGUgfHwgKDFlOSAvIDIpKVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3N1bjogJ0ZyZWVCb2R5JywgbW9vbjogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR0aGlzLl90YXJnZXRBY2NlbGVyYXRpb24gPSB0aGlzLmN1cnJlbnRHcmF2aXR5QWNjZWxlcmF0aW9uKClcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyh0aGlzLl90YXJnZXRBY2NlbGVyYXRpb24sIHRoaXMuYWNjZWxlcmF0aW9uKSlcdFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7YWNjZWxlcmF0aW9uOiB0aGlzLl90YXJnZXRBY2NlbGVyYXRpb259XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb25Db25zdHJhaW50KEZyZWVCb2R5IFN1biwgRnJlZUJvZHkgTW9vbikgc3RhdGVzIHRoYXQgTW9vbiBib2R5IGlzIG9yYml0aW5nIGFyb3VuZCBTdW4gYm9keSBhY2NvcmRpbmcgdG8gc2ltcGxlIG9yYml0YWwgbW90aW9uIGZvcm11bGEuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJNb29uIGJvZHkgXCIgKyB0aGlzLm1vb24uX190b1N0cmluZyArIFwiIGlzIG9yYml0aW5nIGFyb3VuZCBTdW4gYm9keSBcIiArIHRoaXMuc3VuLl9fdG9TdHJpbmcgKyBcIiBhY2NvcmRpbmcgdG8gc2ltcGxlIG9yYml0YWwgbW90aW9uIGZvcm11bGEuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQoRnJlZUJvZHkuZHVtbXkoeCwgeSksIEZyZWVCb2R5LmR1bW15KHggKyAyMDAsIHkpKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uQ29uc3RyYWludC5wcm90b3R5cGUuY3VycmVudEdyYXZpdHlBY2NlbGVyYXRpb24gPSBmdW5jdGlvbigpIHtcblx0dmFyIHAxID0gdGhpcy5tb29uLnBvc2l0aW9uLCBwMiA9IHRoaXMuc3VuLnBvc2l0aW9uXG5cdHZhciBkaXN0MCA9IGRpc3RhbmNlKHAxLCBwMilcblx0dmFyIGRpc3QgPSBkaXN0MCAqIHRoaXMuZGlzdGFuY2VEb3duc2NhbGVcdFxuXHR2YXIgYU1hZzAgPSAoU2tldGNocGFkLnNpbXVsYXRpb24uRyAqIHRoaXMuc3VuLm1hc3MpIC8gKGRpc3QgKiBkaXN0KVxuXHR2YXIgYU1hZyA9IGFNYWcwIC8gdGhpcy5kaXN0YW5jZURvd25zY2FsZVxuXHR2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3IocDEsIHAyKVxuXHRyZXR1cm4ge3g6IHNsb3BlVi54ICogYU1hZywgeTogc2xvcGVWLnkgKiBhTWFnfVxuICAgIH1cbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGxTaW11bGF0aW9uQ29uc3RyYWludHNcbiIsImZ1bmN0aW9uIGluc3RhbGwzREdlb21ldHJpY0NvbnN0cmFpbnRzKFNrZXRjaHBhZCkge1xuXG4gICAgLy8gVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2YgZ2VvbWV0cmljIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgICAvLyBvYmplY3RzIHRoYXQgaGF2ZSB4IGFuZCB5IHByb3BlcnRpZXMuIE90aGVyIHByb3BlcnRpZXMgYXJlIGlnbm9yZWQuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkID0ge31cblxuICAgIHZhciBzcXVhcmUgPSBTa2V0Y2hwYWQuZ2VvbS5zcXVhcmVcblxuICAgIGZ1bmN0aW9uIHBsdXMocDEsIHAyKSB7XG5cdHJldHVybiB7eDogcDEueCArIHAyLngsIHk6IHAxLnkgKyBwMi55LCB6OiBwMS56ICsgcDIuen1cbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gbWludXMocDEsIHAyKSB7XG5cdHJldHVybiB7eDogcDEueCAtIHAyLngsIHk6IHAxLnkgLSBwMi55LCB6OiBwMS56IC0gcDIuen1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FsZWRCeShwLCBtKSB7XG5cdHJldHVybiB7eDogcC54ICogbSwgeTogcC55ICogbSwgejogcC56ICogbX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb3B5KHApIHtcblx0cmV0dXJuIHNjYWxlZEJ5KHAsIDEpXG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIG1pZHBvaW50KHAxLCBwMikge1xuXHRyZXR1cm4gc2NhbGVkQnkocGx1cyhwMSwgcDIpLCAwLjUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFnbml0dWRlKHApIHtcblx0cmV0dXJuIE1hdGguc3FydChzcXVhcmUocC54KSArIHNxdWFyZShwLnkpICsgc3F1YXJlKHAueikpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplZChwKSB7XG5cdHZhciBtID0gbWFnbml0dWRlKHApXG5cdHJldHVybiBtID4gMCA/IHNjYWxlZEJ5KHAsIDEgLyBtKSA6IHBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXN0YW5jZShwMSwgcDIpIHtcblx0cmV0dXJuIE1hdGguc3FydChzcXVhcmUocDEueCAtIHAyLngpICsgc3F1YXJlKHAxLnkgLSBwMi55KSArIHNxdWFyZShwMS56IC0gcDIueikpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcm90YXRlZEJ5KHAsIGRUaGV0YSkge1xuXHR2YXIgYyA9IE1hdGguY29zKGRUaGV0YSlcblx0dmFyIHMgPSBNYXRoLnNpbihkVGhldGEpXG5cdHJldHVybiB7eDogYypwLnggLSBzKnAueSwgeTogcypwLnggKyBjKnAueSwgejogcC56fVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiByb3RhdGVkQXJvdW5kKHAsIGRUaGV0YSwgYXhpcykge1xuXHRyZXR1cm4gcGx1cyhheGlzLCByb3RhdGVkQnkobWludXMocCwgYXhpcyksIGRUaGV0YSkpXG5cdC8qXG5cdC8vIHJvdGF0ZSB0aGUgcG9pbnQgKHgseSx6KSBhYm91dCB0aGUgdmVjdG9yIOKfqHUsdix34p+pIGJ5IHRoZSBhbmdsZSDOuCAoYXJvdW5kIG9yaWdpbj8pXG5cdHZhciB4ID0gcC54LCB5ID0gcC55LCB6ID0gcC56LCB1ID0gYXhpcy54LCB2ID0gYXhpcy55LCB3ID0gYXhpcy56XG5cdHZhciBjID0gTWF0aC5jb3MoZFRoZXRhKSwgcyA9IE1hdGguc2luKGRUaGV0YSlcblx0dmFyIG9uZSA9ICh1ICogeCkgKyAodiAqIHkpICsgKHcgKiB6KSwgdHdvID0gKHUgKiB1KSArICh2ICogdikgKyAodyAqIHcpLCB0aHJlZSA9IE1hdGguc3FydCh0d28pXG5cdHJldHVybiB7eDogKCh1ICogb25lICogKDEgLSBjKSkgICsgKHR3byAqIHggKiBjKSArICh0aHJlZSAqIHMgKiAoKHYgKiB6KSAtICh3ICogeSkpKSkgLyB0d28sXG5cdHk6ICgodiAqIG9uZSAqICgxIC0gYykpICArICh0d28gKiB5ICogYykgKyAodGhyZWUgKiBzICogKCh3ICogeCkgLSAodSAqIHopKSkpIC8gdHdvLFxuIFx0ejogKCh3ICogb25lICogKDEgLSBjKSkgICsgKHR3byAqIHogKiBjKSArICh0aHJlZSAqIHMgKiAoKHUgKiB5KSAtICh2ICogeCkpKSkgLyB0d299XG5cdCovXG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIHNldERlbHRhKGQsIHAsIHNjYWxlKSB7XG5cdGQueCA9IHAueCAqIHNjYWxlXG5cdGQueSA9IHAueSAqIHNjYWxlXG5cdGQueiA9IHAueiAqIHNjYWxlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZG90UHJvZHVjdCh2MSwgdjIpIHtcblx0cmV0dXJuICh2MS54ICogdjIueCkgKyAodjEueSAqIHYyLnkpICsgKHYxLnogKiB2Mi56KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyb3NzUHJvZHVjdCh2MSwgdjIpIHtcblx0dmFyIGEgPSBuZXcgVEhSRUUuVmVjdG9yMyh2MS54LCB2MS55LCB2MS56KVxuXHR2YXIgYiA9IG5ldyBUSFJFRS5WZWN0b3IzKHYyLngsIHYyLnksIHYyLnopXG5cdHZhciBjID0gbmV3IFRIUkVFLlZlY3RvcjMoKVxuXHRjLmNyb3NzVmVjdG9ycyggYSwgYiApXG5cdHJldHVybiBuZXcgUG9pbnQzRChjLngsIGMueSwgYy56KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFuZ2xlKHYxLCB2MiwgYXhpcykge1xuXHQvL3ZhciBsYW5nbGUgPSBNYXRoLmFjb3MoTWF0aC5taW4oMSwgZG90UHJvZHVjdChub3JtYWxpemVkKHYxKSwgbm9ybWFsaXplZCh2MikpKSlcblx0dmFyIHYxbSA9IFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlKHYxKSwgdjJtID0gU2tldGNocGFkLmdlb20zZC5tYWduaXR1ZGUodjIpXG5cdHZhciBwcm9kMiA9ICh2MW0gKiB2Mm0pXG5cdGlmIChwcm9kMiA9PSAwKVxuXHQgICAgbGFuZ2xlID0gMFxuXHRlbHNlIHtcblx0ICAgIHZhciBwcm9kMSA9IGRvdFByb2R1Y3QodjEsIHYyKVxuXHQgICAgdmFyIGRpdiA9IE1hdGgubWluKDEsIHByb2QxIC8gcHJvZDIpXG5cdCAgICBsYW5nbGUgPSBNYXRoLmFjb3MoZGl2KVxuXHQgICAgdmFyIGNyb3NzID0gY3Jvc3NQcm9kdWN0KHYxLCB2Milcblx0ICAgIHZhciBkb3QgPSBkb3RQcm9kdWN0KGF4aXMsIGNyb3NzKVxuXHQgICAgaWYgKGRvdCA+IDApIC8vIE9yID4gMFxuXHRcdGxhbmdsZSA9IC1sYW5nbGVcblx0fVx0XG5cdHJldHVybiBsYW5nbGVcbiAgICB9XG4gICAgICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tM2QucGx1cyA9IHBsdXNcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLm1pbnVzID0gbWludXNcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLnNjYWxlZEJ5ID0gc2NhbGVkQnlcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLmNvcHkgPSBjb3B5XG4gICAgU2tldGNocGFkLmdlb20zZC5taWRwb2ludCA9IG1pZHBvaW50XG4gICAgU2tldGNocGFkLmdlb20zZC5tYWduaXR1ZGUgPSBtYWduaXR1ZGVcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLm5vcm1hbGl6ZWQgPSBub3JtYWxpemVkXG4gICAgU2tldGNocGFkLmdlb20zZC5kaXN0YW5jZSA9IGRpc3RhbmNlXG4gICAgU2tldGNocGFkLmdlb20zZC5yb3RhdGVkQnkgPSByb3RhdGVkQnlcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLmFuZ2xlID0gYW5nbGVcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLmRvdFByb2R1Y3QgPSBkb3RQcm9kdWN0XG4gICAgU2tldGNocGFkLmdlb20zZC5jcm9zc1Byb2R1Y3QgPSBjcm9zc1Byb2R1Y3RcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLnJvdGF0ZWRBcm91bmQgPSByb3RhdGVkQXJvdW5kXG4gICAgU2tldGNocGFkLmdlb20zZC5zZXREZWx0YSA9IHNldERlbHRhXG5cbiAgICAvLyBDb29yZGluYXRlIENvbnN0cmFpbnQsIGkuZS4sIFwiSSB3YW50IHRoaXMgcG9pbnQgdG8gYmUgaGVyZVwiLlxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Db29yZGluYXRlQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbTNfX0Nvb3JkaW5hdGVDb25zdHJhaW50KHAsIHgsIHksIHopIHtcblx0dGhpcy5wID0gcFxuXHR0aGlzLmMgPSBuZXcgUG9pbnQzRCh4LCB5LCB6KVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbTNkLkNvb3JkaW5hdGVDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwOiAnUG9pbnQzRCcsIGM6ICdQb2ludDNEJ31cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXModGhpcy5jLCB0aGlzLnApKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHtwOiB7eDogdGhpcy5jLngsIHk6IHRoaXMuYy55LCB6OiB0aGlzLmMuen19XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Db29yZGluYXRlQ29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20zZC5Db29yZGluYXRlQ29uc3RyYWludChQb2ludCBQLCBOdW1iZXIgWCwgTnVtYmVyIFksIE51bWJlciBaKSBzdGF0ZXMgdGhhdCBwb2ludCBQIHNob3VsZCBzdGF5IGF0IGNvb3JkaW5hdGUgKFgsIFksIFopLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJwb2ludCBcIiArIHRoaXMucC5fX3RvU3RyaW5nICsgXCIgc2hvdWxkIHN0YXkgYXQgY29vcmRpbmF0ZSAoXCIgKyB0aGlzLmMueCArIFwiLCBcIiArIHRoaXMuYy55ICsgXCIsIFwiICsgdGhpcy5jLnogKyBcIikuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMucCwgcHJvcHM6IFsneCcsICd5JywgJ3onXX1dXG4gICAgfVxuXG4gICAgLy8gTGVuZ3RoIGNvbnN0cmFpbnQgLSBtYWludGFpbnMgZGlzdGFuY2UgYmV0d2VlbiBQMSBhbmQgUDIgYXQgTC5cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbTNkX19MZW5ndGhDb25zdHJhaW50KHAxLCBwMiwgbCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMubCA9IGxcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQzRCcsIHAyOiAnUG9pbnQzRCcsIGw6ICdOdW1iZXInfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSlcblx0cmV0dXJuIGwxMiAtIHRoaXMubFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyhwMSwgcDIpKVxuXHRpZiAobDEyID09IDApIHtcblx0ICAgIHAxID0gcGx1cyhwMSwge3g6IDAuMSwgeTogMCwgejogMH0pXG5cdCAgICBwMiA9IHBsdXMocDIsIHt4OiAtMC4xLCB5OiAwLCB6OiAwfSlcblx0fVxuXHR2YXIgZGVsdGEgPSAobDEyIC0gdGhpcy5sKSAvIDJcblx0dmFyIGUxMiA9IHNjYWxlZEJ5KFNrZXRjaHBhZC5nZW9tM2Qubm9ybWFsaXplZChtaW51cyhwMiwgcDEpKSwgZGVsdGEpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgZTEyKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoZTEyLCAtMSkpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20zZC5MZW5ndGhDb25zdHJhaW50KFBvaW50M0QgUDEsIFBvaW50M0QgUDIsIE51bWJlciBMKSBzYXlzIHBvaW50cyBQMSBhbmQgUDIgYWx3YXlzIG1haW50YWluIGEgZGlzdGFuY2Ugb2YgTC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJwb2ludHMgXCIgKyB0aGlzLnAxLl9fdG9TdHJpbmcgKyBcIiBhbmQgXCIgKyB0aGlzLnAyLl9fdG9TdHJpbmcgKyBcIiBhbHdheXMgbWFpbnRhaW4gYSBkaXN0YW5jZSBvZiBcIiArIHRoaXMubCArIFwiLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMucDEsIHByb3BzOiBbJ3gnLCAneScsICd6J119LCB7b2JqOiB0aGlzLnAyLCBwcm9wczogWyd4JywgJ3knLCAneiddfV1cbiAgICB9XG5cblxuICAgIC8vIE1vdG9yIGNvbnN0cmFpbnQgLSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlLlxuICAgIC8vIHcgaXMgaW4gdW5pdHMgb2YgSHogLSB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTW90b3JDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19Nb3RvckNvbnN0cmFpbnQocDEsIHAyLCB3KSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy53ID0gd1xuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgdzogJ051bWJlcid9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiAxXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHQgPSAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAvIDEwMDAuMFxuXHR2YXIgZFRoZXRhID0gdCAqIHRoaXMudyAqICgyICogTWF0aC5QSSlcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cdHJldHVybiB7cDE6IHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLFxuXHRcdHAyOiByb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yQ29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20zZC5Nb3RvckNvbnN0cmFpbnQoUG9pbnQgUDEsIFBvaW50IFAyLCBOdW1iZXIgVykgY2F1c2VzIFAxIGFuZCBQMiB0byBvcmJpdCB0aGVpciBtaWRwb2ludCBhdCB0aGUgZ2l2ZW4gcmF0ZSBvZiB3LCBpbiB1bml0cyBvZiBIejogd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXCIgfSBcblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiXCIgKyB0aGlzLnAxLl9fdG9TdHJpbmcgKyBcIiBhbmQgXCIgKyB0aGlzLnAyLl9fdG9TdHJpbmcgKyBcIiB0byBvcmJpdCB0aGVpciBtaWRwb2ludCBhdCB0aGUgZ2l2ZW4gcmF0ZSBvZiBcIiArIHRoaXMudyArIFwiLCBpbiB1bml0cyBvZiBIejogd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXCIgfVxuICAgICAgICAgICAgXG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbDNER2VvbWV0cmljQ29uc3RyYWludHNcbiIsImZ1bmN0aW9uIGluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIHNpbXVsYXRpb24gY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZCA9IHsgZzogOS44LCBHOiA2LjdlLTExIH0gLy8gRzogTm0yL2tnMiBcblxuICAgIHZhciBtaW51cyA9IFNrZXRjaHBhZC5nZW9tM2QubWludXNcbiAgICB2YXIgcGx1cyA9IFNrZXRjaHBhZC5nZW9tM2QucGx1c1xuICAgIHZhciBzY2FsZWRCeSA9IFNrZXRjaHBhZC5nZW9tM2Quc2NhbGVkQnlcbiAgICB2YXIgbWFnbml0dWRlID0gU2tldGNocGFkLmdlb20zZC5tYWduaXR1ZGVcbiAgICB2YXIgbm9ybWFsaXplZCA9IFNrZXRjaHBhZC5nZW9tM2Qubm9ybWFsaXplZFxuICAgIHZhciBkaXN0YW5jZSA9IFNrZXRjaHBhZC5nZW9tM2QuZGlzdGFuY2VcbiAgICB2YXIgYW5nbGUgPSBTa2V0Y2hwYWQuZ2VvbTNkLmFuZ2xlXG5cbiAgICAvLyBDbGFzc2VzXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkZyZWVCb2R5ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX0ZyZWVCb2R5KHBvc2l0aW9uLCBvcHRSYWRpdXMsIG9wdERyYXduUmFkaXVzLCBvcHRNYXNzLCBvcHRDb2xvcikge1xuXHR0aGlzLnBvc2l0aW9uID0gcG9zaXRpb25cblx0dGhpcy5tYXNzID0gb3B0TWFzcyB8fCAxMFxuXHR0aGlzLnZlbG9jaXR5ID0gbmV3IFZlY3RvcjNEKDAsIDAsIDApXG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gbmV3IFZlY3RvcjNEKDAsIDAsIDApXG5cdHRoaXMucmFkaXVzID0gb3B0UmFkaXVzIHx8IHRoaXMucG9zaXRpb24ucmFkaXVzXG5cdHRoaXMuZHJhd25SYWRpdXMgPSBvcHREcmF3blJhZGl1cyB8fCB0aGlzLnJhZGl1c1xuXHRyYy5hZGQobmV3IFNwaGVyZShwb3NpdGlvbiwgb3B0Q29sb3IsIHRoaXMuZHJhd25SYWRpdXMpKVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkZyZWVCb2R5KVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5GcmVlQm9keS5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwb3NpdGlvbjogJ1BvaW50M0QnLCBtYXNzOiAnTnVtYmVyJywgcmFkaXVzOiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX1NwcmluZyhib2R5MSwgYm9keTIsIGssIGxlbmd0aCwgdGVhclBvaW50QW1vdW50LCBvcHRDb2xvcikge1xuXHR0aGlzLmJvZHkxID0gYm9keTFcblx0dGhpcy5ib2R5MSA9IGJvZHkyXG5cdHRoaXMubGluZSA9IHJjLmFkZChuZXcgQ3lsaW5kZXIoYm9keTEucG9zaXRpb24sIGJvZHkyLnBvc2l0aW9uLCBvcHRDb2xvcikpXG5cdHRoaXMuayA9IGtcblx0dGhpcy5sZW5ndGggPSBsZW5ndGggICAgXG5cdHRoaXMudGVhclBvaW50QW1vdW50ID0gdGVhclBvaW50QW1vdW50XG5cdHRoaXMudG9ybiA9IGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZylcbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZy5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5MTogJ0ZyZWVCb2R5JywgYm9keTI6ICdGcmVlQm9keScsIGs6ICdOdW1iZXInLCBsZW5ndGg6ICdOdW1iZXInLCB0ZWF0UG9pbnRBbW91bnQ6ICdOdW1iZXInfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nLnByb3RvdHlwZS5zb2x1dGlvbkpvaW5zID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7dG9ybjogcmMuc2tldGNocGFkLmxhc3RPbmVXaW5zSm9pblNvbHV0aW9uc31cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZy5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRpZiAodGhpcy5saW5lKSB7XG5cdCAgICBpZiAodGhpcy50b3JuKSB7XG5cdFx0cmMucmVtb3ZlKHRoaXMubGluZSlcblx0XHR0aGlzLmxpbmUgPSB1bmRlZmluZWRcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIGhlaWdodCA9IHRoaXMubGluZS5nZXRIZWlnaHQoKSwgbGVuZ3RoID0gdGhpcy5sZW5ndGhcblx0XHR2YXIgc3RyZXRjaCA9IE1hdGguYWJzKGhlaWdodCAtIGxlbmd0aCkgLyBsZW5ndGhcblx0XHR2YXIgY29sb3IgPSB0aGlzLmxpbmUuX3NjZW5lT2JqLm1hdGVyaWFsLmNvbG9yXG5cdFx0Y29sb3Iuc2V0KCdncmF5Jylcblx0XHRjb2xvci5yICs9IHN0cmV0Y2hcblx0ICAgIH1cblx0fVxuICAgIH1cblx0ICAgIFxuICAgIC8vIE1vdGlvbiBDb25zdHJhaW50XG5cdFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX1ZlbG9jaXR5Q29uc3RyYWludChib2R5KSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiBwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCBkdCkpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludChGcmVlQm9keSBCb2R5KSBzdGF0ZXMgZm9yIEJvZHk6IFBvcyA9IG9sZChQb3MpICsgVmVsb2NpdHkgKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJmb3IgQm9keSBcIiArIHRoaXMuYm9keS5fX3RvU3RyaW5nICsgXCIgUG9zID0gb2xkKFBvcykgKyAoXCIgKyB0aGlzLnZlbG9jaXR5LnggKyBcIixcIiArICB0aGlzLnZlbG9jaXR5LnkgKyBcIixcIiArICB0aGlzLnZlbG9jaXR5LnogKyBcIikgKiBkdCwgd2hlcmUgZHQgaXMgdGhlIGZyYW1lIHN0ZXAgdGltZSBhbW91bnQgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50LnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHRoaXMubGFzdFBvc2l0aW9uID0gc2NhbGVkQnkodGhpcy5wb3NpdGlvbiwgMSlcbiAgICB9XG4gICAgXG4gICAgLy8gQm9keSBXaXRoIFZlbG9jaXR5IENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50MiA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19WZWxvY2l0eUNvbnN0cmFpbnQyKGJvZHksIHZlbG9jaXR5KSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50MiwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknLCB2ZWxvY2l0eTogJ1BvaW50J31cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiB7cG9zaXRpb246IHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUNvbnN0cmFpbnQyLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIoRnJlZUJvZHkgQm9keSwgUG9pbnRWZWN0b3IzRCBWZWxvY2l0eSkgc3RhdGVzIGZvciBCb2R5OiBQb3MgPSBvbGQoUG9zKSArIFZlbG9jaXR5ICogKHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZSkgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlDb25zdHJhaW50Mi5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcImZvciBCb2R5IFwiICsgdGhpcy5ib2R5Ll9fdG9TdHJpbmcgKyBcIjogUG9zID0gb2xkKFBvcykgKyAoXCIgKyB0aGlzLnZlbG9jaXR5LnggKyBcIixcIiArICB0aGlzLnZlbG9jaXR5LnkgKyBcIixcIiArICB0aGlzLnZlbG9jaXR5LnogKyBcIikgKiBkdCwgd2hlcmUgZHQgaXMgdGhlIGZyYW1lIHN0ZXAgdGltZSBhbW91bnQgLlwiIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5Q29uc3RyYWludDIucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RQb3NpdGlvbiA9IHNjYWxlZEJ5KHRoaXMucG9zaXRpb24sIDEpXG4gICAgfVxuXG4gICAgLy8gQWNjZWxlcmF0aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19BY2NlbGVyYXRpb25Db25zdHJhaW50KGJvZHksIGFjY2VsZXJhdGlvbikge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludCwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknLCB2ZWxvY2l0eTogJ1ZlY3RvcjNEJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSksIHRoaXMudmVsb2NpdHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHt2ZWxvY2l0eTogcGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25Db25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFjY2VsZXJhdGlvbkNvbnN0cmFpbnQoRnJlZUJvZHkgQm9keSwgVmVjdG9yIEFjY2VsZXJhdGlvbikgc3RhdGVzIGZvciBCb2R5OiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKyBBY2NlbGVyYXRpb24gKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiZm9yIEJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiOiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKyAoXCIgKyB0aGlzLmFjY2VsZXJhdGlvbi54ICsgXCIsXCIgKyAgdGhpcy5hY2NlbGVyYXRpb24ueSArIFwiLFwiICsgIHRoaXMuYWNjZWxlcmF0aW9uLnogKyBcIikgKiBkdCwgd2hlcmUgZHQgaXMgdGhlIGZyYW1lIHN0ZXAgdGltZSBhbW91bnQgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uQ29uc3RyYWludC5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFZlbG9jaXR5ID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eSwgMSlcbiAgICB9XG5cbiAgICAvLyBBaXIgUmVzaXN0YW5jZSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX0FpclJlc2lzdGFuY2VDb25zdHJhaW50KGJvZHksIHNjYWxlKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5zY2FsZSA9IC1zY2FsZVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzY2FsZTogJ051bWJlcicsIGJvZHk6ICdGcmVlQm9keSd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFpclJlc2lzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHNjYWxlZEJ5KHRoaXMubGFzdFZlbG9jaXR5LCB0aGlzLnNjYWxlKSwgdGhpcy52ZWxvY2l0eSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge3ZlbG9jaXR5OiBzY2FsZWRCeSh0aGlzLmxhc3RWZWxvY2l0eSwgdGhpcy5zY2FsZSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24zZC5BaXJSZXNpc3RhbmNlQ29uc3RyYWludChGcmVlQm9keSBCb2R5LCBOdW1iZXIgU2NhbGUpIHN0YXRlcyBmb3IgQm9keTogVmVsb2NpdHkgPSBvbGQoVmVsb2NpdHkpICogU2NhbGUgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJmb3IgQm9keSBcIiArIHRoaXMuYm9keS5fX3RvU3RyaW5nICsgXCI6IFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSAqIFwiICsgdGhpcy5zY2FsZSArXCIgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWlyUmVzaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RWZWxvY2l0eSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIDEpXG4gICAgfVxuXG5cbiAgICAvLyAgU3ByaW5nIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5nQ29uc3RyYWludCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19TcHJpbmdDb25zdHJhaW50KGJvZHkxLCBib2R5Miwgc3ByaW5nKSB7XG5cdHRoaXMuYm9keTEgPSBib2R5MVxuXHR0aGlzLmJvZHkyID0gYm9keTJcblx0dGhpcy5wb3NpdGlvbjEgPSBib2R5MS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5MSA9IGJvZHkxLnZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uMSA9IGJvZHkxLmFjY2VsZXJhdGlvblxuXHR0aGlzLm1hc3MxID0gYm9keTEubWFzc1xuXHR0aGlzLnBvc2l0aW9uMiA9IGJvZHkyLnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkyID0gYm9keTIudmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24yID0gYm9keTIuYWNjZWxlcmF0aW9uXG5cdHRoaXMubWFzczIgPSBib2R5Mi5tYXNzXG5cdHRoaXMuc3ByaW5nID0gc3ByaW5nXG5cdHRoaXMuX2xhc3RWZWxvY2l0aWVzID0gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ0NvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ0NvbnN0cmFpbnQucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTE6ICdGcmVlQm9keScsIGJvZHkyOiAnRnJlZUJvZHknLCBzcHJpbmc6ICdTcHJpbmcnfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3ByaW5nID0gdGhpcy5zcHJpbmdcblx0aWYgKHNwcmluZy50b3JuKSB7XG5cdCAgICByZXR1cm4gMFxuXHR9XG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdHZhciBlcnIgPSAwXG5cdGZvciAodmFyIGkgPSAwOyBpIDw9IDE7IGkrKykge1xuXHQgICAgdmFyIGogPSAoaSArIDEpICUgMlxuXHQgICAgdmFyIG1hc3MgPSBtYXNzZXNbal1cblx0ICAgIGlmIChtYXNzID4gMCkgeyAvLyBpZiBub3QgYW5jaG9yZWRcblx0XHR2YXIgY3VyckFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvbnNbal1cblx0XHR2YXIgcG9zaXRpb24xID0gcG9zaXRpb25zW2ldXG5cdFx0dmFyIHBvc2l0aW9uMiA9IHBvc2l0aW9uc1tqXVxuXHRcdHZhciB2ZWN0b3IgPSBtaW51cyhwb3NpdGlvbjIsIHBvc2l0aW9uMSlcblx0XHR2YXIgc3ByaW5nQ3VyckxlbiA9IG1hZ25pdHVkZSh2ZWN0b3IpXHRcdFxuXHRcdHZhciBzdHJldGNoTGVuID0gIHNwcmluZ0N1cnJMZW4gLSBzcHJpbmcubGVuZ3RoXG5cdFx0dmFyIG5ld0FjY2VsZXJhdGlvbk1hZyA9IHNwcmluZy5rICogc3RyZXRjaExlbiAvIG1hc3Ncblx0XHR2YXIgYWNjID0gc2NhbGVkQnkobm9ybWFsaXplZCh2ZWN0b3IpLCAtbmV3QWNjZWxlcmF0aW9uTWFnKVxuXHRcdGVyciArPSBtYWduaXR1ZGUobWludXMoYWNjLCBjdXJyQWNjZWxlcmF0aW9uKSlcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gZXJyXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzb2xuID0ge31cblx0dmFyIHNwcmluZyA9IHRoaXMuc3ByaW5nXG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdGZvciAodmFyIGkgPSAwOyBpIDw9IDE7IGkrKykge1xuXHQgICAgdmFyIGogPSAoaSArIDEpICUgMlxuXHQgICAgdmFyIG1hc3MgPSBtYXNzZXNbal1cblx0ICAgIHZhciBhY2MsIHRvcm4gPSBmYWxzZVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFx0XHRcblx0XHR2YXIgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3Rvcilcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdC8vIGlmIG5vdCB0b3JuIGFwYXJ0Li4uXG5cdFx0dG9ybiA9IHN0cmV0Y2hMZW4gPiBzcHJpbmcudGVhclBvaW50QW1vdW50XG5cdFx0aWYgKCF0b3JuKSB7XG5cdFx0ICAgIHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0ICAgIGFjYyA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQodmVjdG9yKSwgLW5ld0FjY2VsZXJhdGlvbk1hZylcblx0XHR9IFxuXHQgICAgfVxuXHQgICAgaWYgKHRvcm4pXG5cdFx0c29sblsnc3ByaW5nJ10gPSB7dG9ybjogdHJ1ZX1cblx0ICAgIGlmIChhY2MpXG5cdFx0c29sblsnYWNjZWxlcmF0aW9uJyArIChqKzEpXSA9IGFjY1xuXHR9XHRcblx0cmV0dXJuIHNvbG5cbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ0NvbnN0cmFpbnQoRnJlZUJvZHkgQm9keTEsIEZyZWVCb2R5IEJvZHkyLCBTcHJpbmcgUykgc3RhdGVzIHRoYXQgc3ByaW5nIFMgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdHdvIGJvZGllcyBCb2R5MSBhbmQgQm9keTIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdDb25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwic3ByaW5nIFwiICsgdGhpcy5zcHJpbmcuX190b1N0cmluZyArIFwiIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHR3byBib2RpZXMgXCIgKyB0aGlzLmJvZHkxLl9fdG9TdHJpbmcgKyBcIiBhbmQgXCIgKyB0aGlzLmJvZHkyLl9fdG9TdHJpbmcgKyBcIi5cIiB9XG5cblxuICAgIC8vICBPcmJpdGFsTW90aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb24zZF9fT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQoc3VuLCBtb29uLCBkaXN0YW5jZURvd25zY2FsZSkge1xuXHR0aGlzLnN1biA9IHN1blxuXHR0aGlzLm1vb24gPSBtb29uXG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gbW9vbi5hY2NlbGVyYXRpb25cblx0dGhpcy5kaXN0YW5jZURvd25zY2FsZSA9IChkaXN0YW5jZURvd25zY2FsZSB8fCAoMWU5IC8gMikpXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3N1bjogJ0ZyZWVCb2R5JywgbW9vbjogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHRoaXMuX3RhcmdldEFjY2VsZXJhdGlvbiA9IHRoaXMuY3VycmVudEdyYXZpdHlBY2NlbGVyYXRpb24oKVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMuX3RhcmdldEFjY2VsZXJhdGlvbiwgdGhpcy5hY2NlbGVyYXRpb24pKVx0XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5PcmJpdGFsTW90aW9uQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge2FjY2VsZXJhdGlvbjogdGhpcy5fdGFyZ2V0QWNjZWxlcmF0aW9ufVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQoRnJlZUJvZHkgU3VuLCBGcmVlQm9keSBNb29uKSBzdGF0ZXMgdGhhdCBNb29uIGJvZHkgaXMgb3JiaXRpbmcgYXJvdW5kIFN1biBib2R5IGFjY29yZGluZyB0byBzaW1wbGUgb3JiaXRhbCBtb3Rpb24gZm9ybXVsYS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb25Db25zdHJhaW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiTW9vbiBib2R5IFwiICsgdGhpcy5tb29uLl9fdG9TdHJpbmcgKyBcIiBpcyBvcmJpdGluZyBhcm91bmQgU3VuIGJvZHkgXCIgKyB0aGlzLnN1bi5fX3RvU3RyaW5nICsgXCIgYWNjb3JkaW5nIHRvIHNpbXBsZSBvcmJpdGFsIG1vdGlvbiBmb3JtdWxhLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmN1cnJlbnRHcmF2aXR5QWNjZWxlcmF0aW9uID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwMSA9IHRoaXMubW9vbi5wb3NpdGlvbiwgcDIgPSB0aGlzLnN1bi5wb3NpdGlvblxuXHR2YXIgZGlzdDAgPSBkaXN0YW5jZShwMSwgcDIpXG5cdHZhciBkaXN0ID0gZGlzdDAgKiB0aGlzLmRpc3RhbmNlRG93bnNjYWxlXHRcblx0dmFyIGFNYWcwID0gKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuRyAqIHRoaXMuc3VuLm1hc3MpIC8gKGRpc3QgKiBkaXN0KVxuXHR2YXIgYU1hZyA9IGFNYWcwIC8gdGhpcy5kaXN0YW5jZURvd25zY2FsZVxuXHR2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3Ioe3g6IHAxLngsIHk6IHAxLnp9LCB7eDogcDIueCwgeTogcDIuen0pIC8vY2hlYXQgdG8gdXNlIDJEIFgtWiBwbGFuZVxuXHRyZXR1cm4ge3g6IHNsb3BlVi54ICogYU1hZywgeTogMCwgejogc2xvcGVWLnkgKiBhTWFnfVxuICAgIH1cbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGwzRFNpbXVsYXRpb25Db25zdHJhaW50c1xuIiwiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEltcG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyA9IHJlcXVpcmUoJy4vMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzJkL2dlb21ldHJpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8yZC9zaW11bGF0aW9uLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxudmFyIGluc3RhbGwzREdlb21ldHJpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMnKS5pbnN0YWxsXG52YXIgaW5zdGFsbDNEU2ltdWxhdGlvbkNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8zZC9zaW11bGF0aW9uLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gR2xvYmFsIE1lc3N5IFN0dWZmXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgX19pZEN0ciA9IDFcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19pZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoJ19fX2lkJykpXG5cdCAgICB0aGlzLl9fX2lkID0gX19pZEN0cisrXG5cdHJldHVybiB0aGlzLl9fX2lkXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX190eXBlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fdHlwZScpKVxuXHQgICAgdGhpcy5fX190eXBlID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLnJlcGxhY2UoL19fL2csICcuJylcblx0cmV0dXJuIHRoaXMuX19fdHlwZVxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fc2hvcnRUeXBlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdHZhciByZXMgPSB0aGlzLl9fdHlwZVxuXHRyZXR1cm4gcmVzLnN1YnN0cmluZyhyZXMubGFzdEluZGV4T2YoJy4nKSArIDEpXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX190b1N0cmluZycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fX3Nob3J0VHlwZSArICdAJyArIHRoaXMuX19pZFxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fY29udGFpbmVyJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fY29udGFpbmVyJykpXG5cdCAgICB0aGlzLl9fX2NvbnRhaW5lciA9IHJjXG5cdHJldHVybiB0aGlzLl9fX2NvbnRhaW5lclxuICAgIH1cbn0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ19fc2NyYXRjaCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoJ19fX3NjcmF0Y2gnKSlcblx0ICAgIHRoaXMuX19fc2NyYXRjaCA9IHt9XG5cdHJldHVybiB0aGlzLl9fX3NjcmF0Y2hcbiAgICB9XG59KVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFB1YmxpY1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gU2tldGNocGFkKCkge1xuICAgIHRoaXMucmhvID0gMVxuICAgIHRoaXMuZXBzaWxvbiA9IDAuMDFcbiAgICB0aGlzLm51bWJlck9mU2FtZUVycm9yT2N1cnJUb0JlQ29uc2lkZXJlZENvbnZlcmdlbmNlID0gMjBcbiAgICB0aGlzLmRlYnVnID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvciA9IGZhbHNlXG4gICAgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMgPSBmYWxzZVxuICAgIHRoaXMuY29uc3RyYWludHMgPSBbXVxuICAgIHRoaXMuY29uc3RyYWludFRyZWVMaXN0ID0ge31cbiAgICB0aGlzLmRpc2FibGVkQ29uc3RyYWludHMgPSB7fVxuICAgIHRoaXMudGhpbmdDb25zdHJ1Y3RvcnMgPSB7fVxuICAgIHRoaXMuY29uc3RyYWludENvbnN0cnVjdG9ycyA9IHt9XG4gICAgdGhpcy5vYmpNYXAgPSB7fVxuICAgIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMgPSB7fVxuICAgIHRoaXMuZXZlbnRIYW5kbGVycyA9IFtdXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWwgPSB7fVxuICAgIHRoaXMuZXZlbnREZXNjcmlwdGlvbnMgPSB7fVxuICAgIHRoaXMub25FYWNoVGltZVN0ZXBIYW5kbGVyRGVzY3JpcHRpb25zID0ge31cbiAgICB0aGlzLmV2ZW50cyA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoT25FYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoQWZ0ZXJFYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gICAgdGhpcy5wc2V1ZG9UaW1lID0gMFxuICAgIHRoaXMucHJldlBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5zY3JhdGNoID0ge31cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uKGFDbGFzcywgaXNDb25zdHJhaW50KSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGFDbGFzcy5uYW1lLnJlcGxhY2UoL19fL2csICcuJylcbiAgICB2YXIgbGlzdCA9IGlzQ29uc3RyYWludCA/IHRoaXMuY29uc3RyYWludENvbnN0cnVjdG9ycyA6IHRoaXMudGhpbmdDb25zdHJ1Y3RvcnMgICAgXG4gICAgbGlzdFtjbGFzc05hbWVdID0gYUNsYXNzXG4gICAgYUNsYXNzLnByb3RvdHlwZS5fX2lzU2tldGNocGFkVGhpbmcgPSB0cnVlXG4gICAgYUNsYXNzLnByb3RvdHlwZS5fX2lzQ29uc3RyYWludCA9IGlzQ29uc3RyYWludFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLm1hcmtPYmplY3RXaXRoSWRJZk5ldyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBpZCA9IG9iai5fX2lkXG4gICAgaWYgKHRoaXMub2JqTWFwW2lkXSlcblx0cmV0dXJuIHRydWVcbiAgICB0aGlzLm9iak1hcFtpZF0gPSBvYmpcbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5nZXRPYmplY3QgPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiB0aGlzLm9iak1hcFtpZF1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hZGRDb25zdHJhaW50ID0gZnVuY3Rpb24oY29uc3RyYWludCwgd2FzRGlzYWJsZWQpIHtcbiAgICBpZiAoY29uc3RyYWludC5fX3ByaW9yaXR5ID09PSB1bmRlZmluZWQpXG5cdGNvbnN0cmFpbnQuX19wcmlvcml0eSA9IDFcbiAgICB2YXIgcHJpbyA9IGNvbnN0cmFpbnQuX19wcmlvcml0eVxuICAgIHZhciBhZGRJZHggPSAwXG4gICAgd2hpbGUgKGFkZElkeCA8IHRoaXMuY29uc3RyYWludHMubGVuZ3RoICYmIHRoaXMuY29uc3RyYWludHNbYWRkSWR4XS5fX3ByaW9yaXR5IDwgcHJpbylcblx0YWRkSWR4KytcbiAgICBpZiAodGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMpIHtcblx0dGhpcy5hZGRUb1BlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnNGb3JDb25zdHJhaW50KGNvbnN0cmFpbnQsIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMpXG5cdHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lRm9yQ29uc3RyYWludChjb25zdHJhaW50KVxuXHRpZiAodGhpcy5kZWJ1ZykgbG9nKHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMpXG4gICAgfVxuICAgIHRoaXMuY29uc3RyYWludHMuc3BsaWNlKGFkZElkeCwgMCwgY29uc3RyYWludClcbiAgICBpZiAod2FzRGlzYWJsZWQpXG5cdGRlbGV0ZSB0aGlzLmRpc2FibGVkQ29uc3RyYWludHNbY29uc3RyYWludC5fX2lkXVxuICAgIGVsc2Uge1xuXHR2YXIgY1RwID0gY29uc3RyYWludC5fX3R5cGUgICAgXG5cdGlmICghdGhpcy5jb25zdHJhaW50VHJlZUxpc3RbY1RwXSlcblx0ICAgIHRoaXMuY29uc3RyYWludFRyZWVMaXN0W2NUcF0gPSBbXVxuXHR0aGlzLmNvbnN0cmFpbnRUcmVlTGlzdFtjVHBdLnB1c2goY29uc3RyYWludClcbiAgICB9XG4gICAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG5cdGlmIChjb25zdHJhaW50Lmhhc093blByb3BlcnR5KHApKSB7XG5cdCAgICB2YXIgb2JqID0gY29uc3RyYWludFtwXVxuXHQgICAgaWYgKG9iaiAhPT0gdW5kZWZpbmVkICYmICF0aGlzLm9iak1hcFtvYmouX19pZF0pXG5cdFx0dGhpcy5vYmpNYXBbb2JqLl9faWRdID0gb2JqXG5cdH1cbiAgICB9XG4gICAgdGhpcy5jb252ZXJnZWQgPSBmYWxzZSAgICBcbiAgICByZXR1cm4gY29uc3RyYWludFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnJlbW92ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbih1bndhbnRlZENvbnN0cmFpbnQsIG1hcmtBc0Rpc2FibGVkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIHJlbW92ZWQgPSBbdW53YW50ZWRDb25zdHJhaW50XVxuICAgIHRoaXMuY29uc3RyYWludHMgPSB0aGlzLmNvbnN0cmFpbnRzLmZpbHRlcihmdW5jdGlvbihjb25zdHJhaW50KSB7XG5cdHZhciBrZWVwID0gdHJ1ZVxuXHRpZiAoY29uc3RyYWludCA9PT0gdW53YW50ZWRDb25zdHJhaW50KSB7XG5cdCAgICBrZWVwID0gZmFsc2Vcblx0fSBlbHNlIHtcblx0ICAgIGtlZXAgPSAhaW52b2x2ZXMoY29uc3RyYWludCwgdW53YW50ZWRDb25zdHJhaW50KVxuXHQgICAgaWYgKCFrZWVwKVxuXHRcdHJlbW92ZWQucHVzaChjb25zdHJhaW50KVxuXHR9XG5cdHJldHVybiBrZWVwXG4gICAgfSlcbiAgICB2YXIgdHJlZSA9IHRoaXMuY29uc3RyYWludFRyZWVMaXN0XG4gICAgcmVtb3ZlZC5mb3JFYWNoKGZ1bmN0aW9uKGNvbnN0cmFpbnQpIHtcblx0aWYgKG1hcmtBc0Rpc2FibGVkKSB7XG5cdCAgICBzZWxmLmRpc2FibGVkQ29uc3RyYWludHNbY29uc3RyYWludC5fX2lkXSA9IGNvbnN0cmFpbnRcdFxuXHR9IGVsc2Uge1xuXHQgICAgdmFyIGxpc3QgPSB0cmVlW2NvbnN0cmFpbnQuX190eXBlXVxuXHQgICAgbGlzdC5zcGxpY2UobGlzdC5pbmRleE9mKGNvbnN0cmFpbnQpLCAxKVxuXHR9XG4gICAgfSlcbiAgICBpZiAodGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMpXG5cdHRoaXMuY29tcHV0ZVBlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnMoKVxuICAgIHRoaXMuY29udmVyZ2VkID0gZmFsc2UgICAgXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJobyA9IDFcbiAgICB0aGlzLmVwc2lsb24gPSAwLjAxXG4gICAgdGhpcy5zZWFyY2hPbiA9IGZhbHNlXG4gICAgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3IgPSBmYWxzZVxuICAgIHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yT25Qcmlvcml0eURpZmZlcmVuY2VzID0gZmFsc2VcbiAgICB0aGlzLmNvbnN0cmFpbnRzID0gW11cbiAgICB0aGlzLmNvbnN0cmFpbnRUcmVlTGlzdCA9IHt9XG4gICAgdGhpcy5kaXNhYmxlZENvbnN0cmFpbnRzID0ge31cbiAgICB0aGlzLm9iak1hcCA9IHt9XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzID0gW11cbiAgICB0aGlzLmV2ZW50cyA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoT25FYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy50aGluZ3NXaXRoQWZ0ZXJFYWNoVGltZVN0ZXBGbiA9IFtdXG4gICAgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cyA9IHt9XG4gICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gICAgdGhpcy5wc2V1ZG9UaW1lID0gMFxuICAgIHRoaXMucHJldlBzZXVkb1RpbWUgPSAwICAgIFxuICAgIHRoaXMuc2NyYXRjaCA9IHt9XG4gICAgLy8gcmVtb3ZlIGV4aXN0aW5nIGV2ZW50IGhhbmRsZXJzXG4gICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbClcblx0dGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWxbbmFtZV0uZm9yRWFjaChmdW5jdGlvbihoYW5kbGVyKSB7IGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKSB9KVxuICAgIHRoaXMuZXZlbnRIYW5kbGVyc0ludGVybmFsID0ge31cbiAgICB0aGlzLmV2ZW50RGVzY3JpcHRpb25zID0ge31cbiAgICB0aGlzLmNvbnZlcmdlZCA9IGZhbHNlICAgIFxuICAgIHRoaXMuZXJyb3JVbm1vdmVkQ291bnQgPSAwXG4gICAgdGhpcy5sYXN0SXRlcmF0aW9uRXJyb3IgPSB1bmRlZmluZWRcbiAgICB0aGlzLm9uRWFjaFRpbWVTdGVwSGFuZGxlckRlc2NyaXB0aW9ucyA9IHt9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29tcHV0ZUN1cnJlbnRFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwc2V1ZG9UaW1lID0gdGhpcy5wc2V1ZG9UaW1lXG4gICAgdmFyIHByZXZQc2V1ZG9UaW1lID0gdGhpcy5wcmV2UHNldWRvVGltZSBcbiAgICB2YXIgdG90YWxFcnJvciA9IDBcbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCB0aGlzLmNvbnN0cmFpbnRzLmxlbmd0aDsgaWR4KyspIHtcblx0dmFyIGMgPSB0aGlzLmNvbnN0cmFpbnRzW2lkeF1cblx0dmFyIGVyID0gTWF0aC5hYnMoYy5jb21wdXRlRXJyb3IocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpKVx0XG5cdHRvdGFsRXJyb3IgKz0gZXJcbiAgICB9XG4gICAgcmV0dXJuIHRvdGFsRXJyb3Jcbn1cbiAgICBcblNrZXRjaHBhZC5wcm90b3R5cGUuY29sbGVjdFBlckNvbnN0cmFpbnRTb2x1dGlvbnMgPSBmdW5jdGlvbih0aW1lTWlsbGlzLCBpbkZpeFBvaW50UHJvY2Vzcykge1xuICAgIHZhciBwc2V1ZG9UaW1lID0gdGhpcy5wc2V1ZG9UaW1lXG4gICAgdmFyIHByZXZQc2V1ZG9UaW1lID0gdGhpcy5wcmV2UHNldWRvVGltZSBcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB2YXIgYWxsU29sdXRpb25zID0gW11cbiAgICB2YXIgZGlkU29tZXRoaW5nID0gZmFsc2UsIGxvY2FsRGlkU29tZXRoaW5nID0gZmFsc2UsIHRvdGFsRXJyb3IgPSAwXG4gICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgdGhpcy5jb25zdHJhaW50cy5sZW5ndGg7IGlkeCsrKSB7XG5cdHZhciBjID0gdGhpcy5jb25zdHJhaW50c1tpZHhdXG5cdHZhciBzZWFyY2hhYmxlID0gYy5fX3NlYXJjaGFibGVcblx0aWYgKGluRml4UG9pbnRQcm9jZXNzICYmIHNlYXJjaGFibGUpXG5cdCAgICBjb250aW51ZVxuXHR2YXIgZXIgPSBNYXRoLmFicyhjLmNvbXB1dGVFcnJvcihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkpXHRcblx0dG90YWxFcnJvciArPSBlclxuXHRpZiAoZXIgPiBzZWxmLmVwc2lsb25cblx0ICAgIHx8IHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yIHx8ICh0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcyAmJiB0aGlzLmNvbnN0cmFpbnRJc0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZShjKSlcblx0ICAgKSB7XG5cdCAgICB2YXIgc29sdXRpb25zID0gYy5zb2x2ZShwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcblx0ICAgIGlmICghKGluRml4UG9pbnRQcm9jZXNzIHx8IHNlYXJjaGFibGUpKVxuXHRcdHNvbHV0aW9ucyA9IFtzb2x1dGlvbnNdXG5cdCAgICBsb2NhbERpZFNvbWV0aGluZyA9IHRydWVcblx0ICAgIGFsbFNvbHV0aW9ucy5wdXNoKHtjb25zdHJhaW50OiBjLCBzb2x1dGlvbnM6IHNvbHV0aW9uc30pXG5cdH1cbiAgICB9XG4gICAgaWYgKGxvY2FsRGlkU29tZXRoaW5nKSB7XG5cdGRpZFNvbWV0aGluZyA9IHRydWVcbiAgICB9IGVsc2Vcblx0dG90YWxFcnJvciA9IDBcbiAgICByZXR1cm4ge2RpZFNvbWV0aGluZzogZGlkU29tZXRoaW5nLCBlcnJvcjogdG90YWxFcnJvciwgc29sdXRpb25zOiBhbGxTb2x1dGlvbnN9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zID0gZnVuY3Rpb24oYWxsU29sdXRpb25zKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIGNvbGxlY3RlZFNvbHV0aW9ucyA9IHt9LCBzZWVuUHJpb3JpdGllcyA9IHt9XG4gICAgYWxsU29sdXRpb25zLmZvckVhY2goZnVuY3Rpb24oZCkge1xuXHRjb2xsZWN0UGVyUHJvcGVydHlTb2x1dGlvbnNBZGRTb2x1dGlvbihzZWxmLCBkLCBjb2xsZWN0ZWRTb2x1dGlvbnMsIHNlZW5Qcmlvcml0aWVzKVxuICAgIH0pXG4gICAgcmV0dXJuIGNvbGxlY3RlZFNvbHV0aW9uc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvT25lSXRlcmF0aW9uID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIGlmICh0aGlzLmJlZm9yZUVhY2hJdGVyYXRpb24pXG5cdCh0aGlzLmJlZm9yZUVhY2hJdGVyYXRpb24pKClcbiAgICB2YXIgcmVzID0gdGhpcy5jb2xsZWN0UGVyQ29uc3RyYWludFNvbHV0aW9ucyh0aW1lTWlsbGlzLCB0cnVlKVxuICAgIGlmICh0aGlzLmRlYnVnKSBsb2cocmVzKVxuICAgIHZhciBkaWRTb21ldGhpbmcgPSByZXMuZGlkU29tZXRoaW5nXG4gICAgdmFyIHRvdGFsRXJyb3IgPSByZXMuZXJyb3JcbiAgICBpZiAoZGlkU29tZXRoaW5nKSB7XG5cdHZhciBhbGxTb2x1dGlvbnMgPSByZXMuc29sdXRpb25zXG5cdHZhciBjb2xsZWN0ZWRTb2x1dGlvbnMgPSB0aGlzLmNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9ucyhhbGxTb2x1dGlvbnMpXG5cdGlmICh0aGlzLnVucm9sbE9uQ29uZmxpY3RzKVxuXHQgICAgYXBwbHlTb2x1dGlvbnNXaXRoVW5yb2xsT25Db25mbGljdCh0aGlzLCBjb2xsZWN0ZWRTb2x1dGlvbnMpXG5cdGVsc2Vcblx0ICAgIGFwcGx5U29sdXRpb25zKHRoaXMsIGNvbGxlY3RlZFNvbHV0aW9ucylcbiAgICB9XG4gICAgcmV0dXJuIHRvdGFsRXJyb3Jcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXMgPSB7fVxuICAgIHRoaXMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbihjKSB7XG5cdHRoaXMuYWRkVG9QZXJUaGluZ1BlclByb3BlcnR5RWZmZWN0b3JzRm9yQ29uc3RyYWludChjLCByZXMpXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMgPSByZXMgIFxuICAgIHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lKClcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hZGRUb1BlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnNGb3JDb25zdHJhaW50ID0gZnVuY3Rpb24oYywgcmVzKSB7XG4gICAgaWYgKGMuZWZmZWN0cykge1xuXHRjLmVmZmVjdHMoKS5mb3JFYWNoKGZ1bmN0aW9uKGUpIHsgXG5cdCAgICB2YXIgaWQgPSBlLm9iai5fX2lkXG5cdCAgICB2YXIgZVByb3BzID0gZS5wcm9wc1xuXHQgICAgdmFyIHByb3BzLCBjc1xuXHQgICAgaWYgKHJlc1tpZF0pXG5cdFx0cHJvcHMgPSByZXNbaWRdXG5cdCAgICBlbHNlIHtcblx0XHRwcm9wcyA9IHt9XG5cdFx0cmVzW2lkXSA9IHByb3BzXG5cdCAgICB9XG5cdCAgICBlUHJvcHMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG5cdFx0aWYgKHByb3BzW3Byb3BdKVxuXHRcdCAgICBjcyA9IHByb3BzW3Byb3BdXG5cdFx0ZWxzZSB7XG5cdFx0ICAgIGNzID0gW11cblx0XHQgICAgcHJvcHNbcHJvcF0gPSBjc1xuXHRcdH1cblx0XHRjcy5wdXNoKGMpXHRcdFxuXHQgICAgfSlcblx0fSlcdCAgICBcbiAgICB9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29uc3RyYWludElzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lID0gZnVuY3Rpb24oY29uc3RyYWludCkge1xuICAgIHJldHVybiB0aGlzLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZVtjb25zdHJhaW50Ll9faWRdICE9PSB1bmRlZmluZWRcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVGb3JDb25zdHJhaW50ID0gZnVuY3Rpb24oY29uc3RyYWludCkge1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHMpIHtcblx0dmFyIHRoaW5nRWZmcyA9IHRoaXMucGVyVGhpbmdQZXJQcm9wRWZmZWN0aW5nQ29uc3RyYWludHNbaWRdXG5cdGZvciAodmFyIHAgaW4gdGhpbmdFZmZzKSB7XG5cdCAgICB2YXIgY3MgPSB0aGluZ0VmZnNbcF1cblx0ICAgIGlmIChjcy5pbmRleE9mKGNvbnN0cmFpbnQpID49IDApIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNzLmxlbmd0aDsgaSsrKSB7XG5cdFx0ICAgIHZhciBjID0gY3NbaV1cblx0XHQgICAgaWYgKGMgIT09IGNvbnN0cmFpbnQgJiYgYy5fX3ByaW9yaXR5ICE9PSBjb25zdHJhaW50Ll9fcHJpb3JpdHkpIHtcdFx0XHRcblx0XHRcdHZhciBoQyA9IGNvbnN0cmFpbnQuX19wcmlvcml0eSA+IGMuX19wcmlvcml0eSA/IGNvbnN0cmFpbnQgOiBjXG5cdFx0XHR0aGlzLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZVtoQy5fX2lkXSA9IHRydWVcblx0XHRcdHJldHVyblxuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHR9XG4gICAgfVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZSA9IGZ1bmN0aW9uKCkgeyAgICBcbiAgICB0aGlzLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24oY29uc3RyYWludCkgeyAgICBcblx0dGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVGb3JDb25zdHJhaW50KGNvbnN0cmFpbnQpXG4gICAgfS5iaW5kKHRoaXMpKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmN1cnJlbnRUaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnN0YXJ0VGltZVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvVGFza3NPbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG4gICAgdGhpcy5oYW5kbGVFdmVudHMoKVxuICAgIHRoaXMuZG9PbkVhY2hUaW1lU3RlcEZucyhwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcbiAgICBpZiAodGhpcy5vbkVhY2hUaW1lU3RlcCkgXG5cdCh0aGlzLm9uRWFjaFRpbWVTdGVwKShwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kb1Rhc2tzQWZ0ZXJFYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuICAgIHRoaXMuZG9BZnRlckVhY2hUaW1lU3RlcEZucyhwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcbiAgICBpZiAodGhpcy5hZnRlckVhY2hUaW1lU3RlcCkgXG5cdCh0aGlzLmFmdGVyRWFjaFRpbWVTdGVwKShwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSlcbiAgICB0aGlzLm1heWJlU3RlcFBzZXVkb1RpbWUoKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVOZXh0UHNldWRvVGltZUZyb21Qcm9wb3NhbHMgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcm9wb3NhbHMpIHtcbiAgICB2YXIgcmVzID0gcHJvcG9zYWxzWzBdLnRpbWVcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHByb3Bvc2Fscy5sZW5ndGg7IGkrKykge1xuXHR0aW1lID0gcHJvcG9zYWxzW2ldLnRpbWVcblx0aWYgKHRpbWUgPCByZXMpXG5cdCAgICByZXMgPSB0aW1lXG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5tYXliZVN0ZXBQc2V1ZG9UaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG8gPSB7fVxuICAgIHZhciBwc2V1ZG9UaW1lID0gdGhpcy5wc2V1ZG9UaW1lXG4gICAgdGhpcy5wcmV2UHNldWRvVGltZSA9IHBzZXVkb1RpbWVcbiAgICB2YXIgcHJvcG9zYWxzID0gW11cbiAgICB0aGlzLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24odCkge1xuICAgICAgICBpZih0LnByb3Bvc2VOZXh0UHNldWRvVGltZSlcbiAgICAgICAgICAgIHByb3Bvc2Fscy5wdXNoKHtwcm9wb3NlcjogdCwgdGltZTogdC5wcm9wb3NlTmV4dFBzZXVkb1RpbWUocHNldWRvVGltZSl9KVxuICAgIH0pXG4gICAgaWYgKHByb3Bvc2Fscy5sZW5ndGggPiAwKSB7XHRcblx0dGhpcy5wc2V1ZG9UaW1lID0gdGhpcy5jb21wdXRlTmV4dFBzZXVkb1RpbWVGcm9tUHJvcG9zYWxzKHBzZXVkb1RpbWUsIHByb3Bvc2Fscylcblx0dGhpcy5jb252ZXJnZWQgPSBmYWxzZVxuICAgIH1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5pdGVyYXRlU2VhcmNoQ2hvaWNlc0ZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGVwc2lsb24gPSB0aGlzLmVwc2lsb25cbiAgICB2YXIgc29scyA9IHRoaXMuY29sbGVjdFBlckNvbnN0cmFpbnRTb2x1dGlvbnModGltZU1pbGxpcywgZmFsc2UpXG4gICAgdmFyIGRpZFNvbWV0aGluZyA9IHNvbHMuZGlkU29tZXRoaW5nXG4gICAgdmFyIHRvdGFsRXJyb3IgPSBzb2xzLmVycm9yXG4gICAgdmFyIHJlcyA9IHtlcnJvcjogdG90YWxFcnJvciwgY291bnQ6IDB9IC8vRklYTUVcbiAgICBpZiAoZGlkU29tZXRoaW5nKSB7XG5cdHZhciBhbGxTb2x1dGlvbkNob2ljZXMgPSBzb2xzLnNvbHV0aW9uc1xuXHQvL2ZpbmQgYWxsIHNvbHV0aW9uIGNvbWJpbmF0aW9ucyBiZXR3ZWVuIGNvbnN0cmFpbnRzXG5cdC8vaWYgKHRoaXMuZGVidWcpIGxvZyhhbGxTb2x1dGlvbkNob2ljZXMpXG5cdHZhciBjaG9pY2VzQ3MgPSBhbGxTb2x1dGlvbkNob2ljZXMubWFwKGZ1bmN0aW9uKGMpIHsgcmV0dXJuIGMuY29uc3RyYWludCB9KVxuXHR2YXIgY0NvdW50ID0gY2hvaWNlc0NzLmxlbmd0aFxuXHR2YXIgY2hvaWNlc1NzID0gYWxsU29sdXRpb25DaG9pY2VzLm1hcChmdW5jdGlvbihjKSB7IHJldHVybiBjLnNvbHV0aW9ucyB9KVxuXHR2YXIgYWxsU29sdXRpb25Db21ib3MgPSBhbGxDb21iaW5hdGlvbnNPZkFycmF5RWxlbWVudHMoY2hvaWNlc1NzKS5tYXAoZnVuY3Rpb24oY29tYm8pIHtcdCAgICBcblx0ICAgIHZhciBjdXJyID0gW11cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY0NvdW50OyBpKyspIHtcblx0XHRjdXJyLnB1c2goe2NvbnN0cmFpbnQ6IGNob2ljZXNDc1tpXSwgc29sdXRpb25zOiBjb21ib1tpXX0pXG5cdCAgICB9XG5cdCAgICByZXR1cm4gY3VyclxuXHR9KVxuXHQvL2xvZyhhbGxTb2x1dGlvbkNvbWJvcylcblx0Ly8gY29weSBjdXJyIHN0YXRlIGFuZCB0cnkgb25lLCBpZiB3b3JrcyByZXR1cm4gZWxzZSByZXZlcnQgc3RhdGUgbW92ZSB0byBuZXh0IHVudGlsIG5vbmUgbGVmdFxuXHR2YXIgY291bnQgPSBhbGxTb2x1dGlvbkNvbWJvcy5sZW5ndGhcblx0dmFyIGNob2ljZVRPID0gdGltZU1pbGxpcyAvIGNvdW50XG5cdGlmICh0aGlzLmRlYnVnKSBsb2coJ3Bvc3NpYmxlIGNob2ljZXMnLCBjb3VudCwgJ3BlciBjaG9pY2UgdGltZW91dCcsIGNob2ljZVRPKVxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcblx0ICAgIHZhciBjb3BpZWQsIGxhc3QgPSBpID09IGNvdW50IC0gMVxuXHQgICAgaWYgKHRoaXMuZGVidWcpIGxvZygndHJ5aW5nIGNob2ljZTogJyArIGkpXG5cdCAgICB2YXIgYWxsU29sdXRpb25zID0gYWxsU29sdXRpb25Db21ib3NbaV1cblx0ICAgIC8vbG9nKGFsbFNvbHV0aW9ucylcblx0ICAgIHZhciBjb2xsZWN0ZWRTb2x1dGlvbnMgPSB0aGlzLmNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9ucyhhbGxTb2x1dGlvbnMpXG5cdCAgICAvL2NvcHkgaGVyZS4uLlx0ICAgIFxuXHQgICAgaWYgKCFsYXN0KVxuXHRcdGNvcGllZCA9IHRoaXMuZ2V0Q3VycmVudFByb3BWYWx1ZXNBZmZlY3RhYmxlQnlTb2x1dGlvbnMoY29sbGVjdGVkU29sdXRpb25zKVxuXHQgICAgaWYgKHRoaXMudW5yb2xsT25Db25mbGljdHMpXG5cdCAgICBhcHBseVNvbHV0aW9uc1dpdGhVbnJvbGxPbkNvbmZsaWN0KHRoaXMsIGNvbGxlY3RlZFNvbHV0aW9ucylcblx0ZWxzZVxuXHQgICAgYXBwbHlTb2x1dGlvbnModGhpcywgY29sbGVjdGVkU29sdXRpb25zKVxuXHQgICAgcmVzID0gdGhpcy5pdGVyYXRlRm9yVXBUb01pbGxpcyhjaG9pY2VUTylcdCAgICBcblx0ICAgIHZhciBjaG9pY2VFcnIgPSB0aGlzLmNvbXB1dGVDdXJyZW50RXJyb3IoKVxuXHQgICAgLy9pZiAodGhpcy5kZWJ1ZykgbG9nKCdjaG9pY2UgcmVzdWx0ZWQgaW4gZXJyb3I6ICcsIGNob2ljZUVycilcblx0ICAgIGlmIChjaG9pY2VFcnIgPCBlcHNpbG9uIHx8IGxhc3QpXG5cdFx0YnJlYWtcblx0ICAgIC8vcmV2ZXJ0IGhlcmVcblx0ICAgIHRoaXMucmV2ZXJ0UHJvcFZhbHVlc0Jhc2VkT25BcmcoY29waWVkKVxuXHR9XG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5nZXRDdXJyZW50UHJvcFZhbHVlc0FmZmVjdGFibGVCeVNvbHV0aW9ucyA9IGZ1bmN0aW9uKHNvbHV0aW9ucykge1xuICAgIHZhciByZXMgPSB7fVxuICAgIGZvciAodmFyIG9iaklkIGluIHNvbHV0aW9ucykge1xuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBwcm9wc04gPSB7fVxuXHRyZXNbb2JqSWRdID0gcHJvcHNOXG5cdHZhciBwcm9wcyA9IHNvbHV0aW9uc1tvYmpJZF1cblx0Zm9yICh2YXIgcCBpbiBwcm9wcykge1xuXHQgICAgcHJvcHNOW3BdID0gY3Vyck9ialtwXVxuXHR9XG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yZXZlcnRQcm9wVmFsdWVzQmFzZWRPbkFyZyA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIGZvciAodmFyIG9iaklkIGluIHZhbHVlcykge1xuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBwcm9wcyA9IHZhbHVlc1tvYmpJZF1cblx0Zm9yICh2YXIgcCBpbiBwcm9wcykge1xuXHQgICAgY3Vyck9ialtwXSA9IHByb3BzW3BdXG5cdH1cbiAgICB9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY2hlY2tDb252ZXJnZW5jZSA9IGZ1bmN0aW9uIChjdXJyRXJyb3IpIHtcbiAgICBpZiAoY3VyckVycm9yIDw9IHRoaXMuZXBzaWxvbikge1xuXHR0aGlzLmNvbnZlcmdlZCA9IHRydWVcbiAgICB9IGVsc2Uge1xuXHR0aGlzLmVycm9yVW5tb3ZlZENvdW50ID0gKHRoaXMubGFzdEl0ZXJhdGlvbkVycm9yID09IGN1cnJFcnJvcikgPyAodGhpcy5lcnJvclVubW92ZWRDb3VudCArIDEpIDogMFxuXHRpZiAodGhpcy5lcnJvclVubW92ZWRDb3VudCA9PSB0aGlzLm51bWJlck9mU2FtZUVycm9yT2N1cnJUb0JlQ29uc2lkZXJlZENvbnZlcmdlbmNlKSB7XG5cdCAgICB0aGlzLmNvbnZlcmdlZCA9IHRydWVcblx0ICAgIHRoaXMuZXJyb3JVbm1vdmVkQ291bnQgPSAwXG5cdH0gZWxzZSBcblx0ICAgIHRoaXMuY29udmVyZ2VkID0gZmFsc2VcbiAgICB9XG4gICAgdGhpcy5sYXN0SXRlcmF0aW9uRXJyb3IgPSBjdXJyRXJyb3Jcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5zb2x2ZUZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0TWlsbGlzKSB7XG4gICAgdGhpcy5kb1Rhc2tzT25FYWNoVGltZVN0ZXAodGhpcy5wc2V1ZG9UaW1lLCB0aGlzLnByZXZQc2V1ZG9UaW1lKVxuICAgIHZhciByZXNcbiAgICBpZiAodGhpcy5zZWFyY2hPbilcdFxuXHRyZXMgPSB0aGlzLml0ZXJhdGVTZWFyY2hDaG9pY2VzRm9yVXBUb01pbGxpcyh0TWlsbGlzKVxuICAgIGVsc2Vcblx0cmVzID0gdGhpcy5pdGVyYXRlRm9yVXBUb01pbGxpcyh0TWlsbGlzKVxuICAgIHRoaXMuY2hlY2tDb252ZXJnZW5jZShyZXMuZXJyb3IpXG4gICAgdGhpcy5kb1Rhc2tzQWZ0ZXJFYWNoVGltZVN0ZXAodGhpcy5wc2V1ZG9UaW1lLCB0aGlzLnByZXZQc2V1ZG9UaW1lKVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kb09uZUl0ZXJhdGlvbkFzRW50aXJlUGhhc2UgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIHJlcyA9IHRoaXMuZG9PbmVJdGVyYXRpb24odGltZU1pbGxpcylcbiAgICB0aGlzLmNoZWNrQ29udmVyZ2VuY2UocmVzKVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5pdGVyYXRlRm9yVXBUb01pbGxpcyA9IGZ1bmN0aW9uKHRNaWxsaXMpIHtcbiAgICB2YXIgY291bnQgPSAwLCB0b3RhbEVycm9yID0gMCwgZXBzaWxvbiA9IHRoaXMuZXBzaWxvblxuICAgIHZhciBjdXJyRXJyb3IsIGxhc3RFcnJvclxuICAgIHZhciB0MCwgdFxuICAgIHQwID0gdGhpcy5jdXJyZW50VGltZSgpXG4gICAgZG8ge1xuXHRsYXN0RXJyb3IgPSBjdXJyRXJyb3Jcblx0Y3VyckVycm9yID0gdGhpcy5kb09uZUl0ZXJhdGlvbih0MClcblx0dCA9ICB0aGlzLmN1cnJlbnRUaW1lKCkgLSB0MFxuXHRpZiAoY3VyckVycm9yID4gMCkge1xuXHQgICAgY291bnQrK1xuXHQgICAgdG90YWxFcnJvciArPSBjdXJyRXJyb3Jcblx0fVxuICAgIH0gd2hpbGUgKFxuXHRjdXJyRXJyb3IgPiBlcHNpbG9uXG5cdCAgICAmJiAhKGN1cnJFcnJvciA+PSBsYXN0RXJyb3IpXG5cdCAgICAmJiB0IDwgdE1pbGxpcylcbiAgICByZXR1cm4ge2Vycm9yOiB0b3RhbEVycm9yLCBjb3VudDogY291bnR9XG59XG5cbi8vIHZhcmlvdXMgd2F5cyB3ZSBjYW4gam9pbiBzb2x1dGlvbnMgZnJvbSBhbGwgc29sdmVyc1xuLy8gZGFtcGVkIGF2ZXJhZ2Ugam9pbiBmbjpcblNrZXRjaHBhZC5wcm90b3R5cGUuc3VtSm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHZhciByaG8gPSB0aGlzLnJob1xuICAgIHZhciBzdW0gPSAwXG4gICAgc29sdXRpb25zLmZvckVhY2goZnVuY3Rpb24odikgeyBzdW0gKz0gdiB9KVxuICAgIHZhciByZXMgPSBjdXJyICsgKHJobyAqICgoc3VtIC8gc29sdXRpb25zLmxlbmd0aCkgLSBjdXJyKSlcbiAgICByZXR1cm4gcmVzXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUubGFzdE9uZVdpbnNKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgcmV0dXJuIHNvbHV0aW9uc1tzb2x1dGlvbnMubGVuZ3RoIC0gMV1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yYW5kb21DaG9pY2VKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgcmV0dXJuIHNvbHV0aW9uc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzb2x1dGlvbnMubGVuZ3RoKV1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5hcnJheUFkZEpvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICBzb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IGN1cnIucHVzaCh2KSB9KVxuICAgIHJldHVybiBjdXJyXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZGljdGlvbmFyeUFkZEpvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICBzb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IGZvciAodmFyIGsgaW4gdikgY3VycltrXSA9IHZba10gfSlcbiAgICByZXR1cm4gY3VyclxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRpY3Rpb25hcnlBZGROb0NvbmZsaWN0Sm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHZhciBzZWVuID0ge31cbiAgICBzb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7XG5cdGZvciAodmFyIGsgaW4gdikge1xuXHQgICAgdmFyIHByZXYgPSBzZWVuW2tdXG5cdCAgICB2YXIgbmV3ViA9IHZba11cblx0ICAgIGlmIChwcmV2ICYmIHByZXYgIT09IG5ld1YpIHtcblx0XHR0aGlzLmRpc2NhcmRJdGVyYXRpb24gPSB0cnVlXG5cdFx0bG9nKCdjb25mbGljdCBpbiB0aGlzIHNvbHV0aW9uIHNldDonLCBzb2x1dGlvbnMpIFxuXHRcdHJldHVybiBjdXJyXG5cdCAgICB9XG5cdCAgICBzZWVuW2tdID0gbmV3VlxuXHR9XG4gICAgfSlcbiAgICByZXR1cm4gdGhpcy5kaWN0aW9uYXJ5QWRkSm9pblNvbHV0aW9ucyhjdXJyLCBzb2x1dGlvbnMpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZGVmYXVsdEpvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICByZXR1cm4gIHRoaXMuc3VtSm9pblNvbHV0aW9ucyhjdXJyLCBzb2x1dGlvbnMpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUucmVnaXN0ZXJFdmVudCA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBvcHREZXNjcmlwdGlvbikge1xuICAgIHZhciBpZCA9IHRoaXMuZXZlbnRIYW5kbGVycy5sZW5ndGhcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMucHVzaChjYWxsYmFjaylcbiAgICB2YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGUpIHsgdGhpcy5ldmVudHMucHVzaChbaWQsIGVdKSB9LmJpbmQodGhpcylcbiAgICBpZiAoIXRoaXMuZXZlbnRIYW5kbGVyc0ludGVybmFsW25hbWVdKSB7XG5cdHRoaXMuZXZlbnRIYW5kbGVyc0ludGVybmFsW25hbWVdID0gW11cblx0dGhpcy5ldmVudERlc2NyaXB0aW9uc1tuYW1lXSA9IFtdXG4gICAgfVxuICAgIHRoaXMuZXZlbnRIYW5kbGVyc0ludGVybmFsW25hbWVdLnB1c2goaGFuZGxlcilcbiAgICB0aGlzLmV2ZW50RGVzY3JpcHRpb25zW25hbWVdLnB1c2gob3B0RGVzY3JpcHRpb24pXG4gICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGhhbmRsZXIpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuaGFuZGxlRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuZXZlbnRzLmxlbmd0aCA+IDApXG5cdHRoaXMuY29udmVyZ2VkID0gZmFsc2VcbiAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWVBbmRFKSB7IFxuXHR2YXIgaWQgPSBuYW1lQW5kRVswXTsgXG5cdHZhciBlID0gbmFtZUFuZEVbMV07IFxuXHR2YXIgaCA9IHRoaXMuZXZlbnRIYW5kbGVyc1tpZF1cblx0aWYgKGggIT09IHVuZGVmaW5lZClcblx0ICAgIGgoZSkgXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHRoaXMuZXZlbnRzID0gW11cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kb09uRWFjaFRpbWVTdGVwRm5zID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcbiAgICB0aGlzLnRoaW5nc1dpdGhPbkVhY2hUaW1lU3RlcEZuLmZvckVhY2goZnVuY3Rpb24odCkgeyB0Lm9uRWFjaFRpbWVTdGVwKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB9KVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvQWZ0ZXJFYWNoVGltZVN0ZXBGbnMgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuICAgIHRoaXMudGhpbmdzV2l0aEFmdGVyRWFjaFRpbWVTdGVwRm4uZm9yRWFjaChmdW5jdGlvbih0KSB7IHQuYWZ0ZXJFYWNoVGltZVN0ZXAocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIH0pXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuc2V0T25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihvbkVhY2hUaW1lRm4sIG9wdERlc2NyaXB0aW9uKSB7XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcCA9IG9uRWFjaFRpbWVGblxuICAgIGlmIChvcHREZXNjcmlwdGlvbilcblx0dGhpcy5vbkVhY2hUaW1lU3RlcEhhbmRsZXJEZXNjcmlwdGlvbnNbJ2dlbmVyYWwnXSA9IFtvcHREZXNjcmlwdGlvbl1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS51bnNldE9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcCA9IHVuZGVmaW5lZFxuICAgIGRlbGV0ZSh0aGlzLm9uRWFjaFRpbWVTdGVwSGFuZGxlckRlc2NyaXB0aW9uc1snZ2VuZXJhbCddKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnNldE9wdGlvbiA9IGZ1bmN0aW9uKG9wdCwgdmFsKSB7XG4gICAgdGhpc1tvcHRdID0gdmFsXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZnVuY3Rpb24gY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zQWRkU29sdXRpb24oc2tldGNocGFkLCBzb2xuLCBzb2Zhciwgc2VlblByaW9yaXRpZXMpIHtcbiAgICB2YXIgYyA9IHNvbG4uY29uc3RyYWludFxuICAgIHZhciBwcmlvcml0eSA9IGMuX19wcmlvcml0eVxuICAgIGZvciAodmFyIG9iaiBpbiBzb2xuLnNvbHV0aW9ucykge1xuXHR2YXIgY3Vyck9iaiA9IGNbb2JqXVxuXHR2YXIgY3Vyck9iaklkID0gY3Vyck9iai5fX2lkXG5cdHZhciBkID0gc29sbi5zb2x1dGlvbnNbb2JqXVxuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKGQpXG5cdGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzW2ldXG5cdCAgICB2YXIgcGVyUHJvcFNvbG4gPSBzb2ZhcltjdXJyT2JqSWRdXG5cdCAgICB2YXIgcGVyUHJvcFByaW8gPSBzZWVuUHJpb3JpdGllc1tjdXJyT2JqSWRdXG5cdCAgICB2YXIgcHJvcFNvbG5zLCBwcmlvXG5cdCAgICBpZiAocGVyUHJvcFNvbG4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHBlclByb3BTb2xuID0ge31cblx0XHRwZXJQcm9wUHJpbyA9IHt9XG5cdFx0c29mYXJbY3Vyck9iaklkXSA9IHBlclByb3BTb2xuXG5cdFx0c2VlblByaW9yaXRpZXNbY3Vyck9iaklkXSA9IHBlclByb3BQcmlvXG5cdFx0cHJvcFNvbG5zID0gW11cblx0XHRwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdHBlclByb3BQcmlvW3Byb3BdID0gcHJpb3JpdHlcblx0ICAgIH0gZWxzZSB7XHRcdCAgICBcblx0XHRwcm9wU29sbnMgPSBwZXJQcm9wU29sbltwcm9wXVxuXHRcdGlmIChwcm9wU29sbnMgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICBwcm9wU29sbnMgPSBbXVxuXHRcdCAgICBwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdCAgICBwZXJQcm9wUHJpb1twcm9wXSA9IHByaW9yaXR5XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgdmFyIGxhc3RQcmlvID0gcGVyUHJvcFByaW9bcHJvcF1cblx0ICAgIGlmIChwcmlvcml0eSA+IGxhc3RQcmlvKSB7XG5cdFx0cGVyUHJvcFByaW9bcHJvcF0gPSBwcmlvcml0eVxuXHRcdHdoaWxlIChwcm9wU29sbnMubGVuZ3RoID4gMCkgcHJvcFNvbG5zLnBvcCgpXG5cdCAgICB9IGVsc2UgaWYgKHByaW9yaXR5IDwgbGFzdFByaW8pIHtcblx0XHRicmVha1xuXHQgICAgfSBcblx0ICAgIHByb3BTb2xucy5wdXNoKGRbcHJvcF0pXG5cdH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFwcGx5U29sdXRpb25zKHNrZXRjaHBhZCwgc29sdXRpb25zKSB7ICAgIFxuICAgIC8vbG9nMihzb2x1dGlvbnMpXG4gICAgdmFyIGtleXMxID0gT2JqZWN0LmtleXMoc29sdXRpb25zKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5czEubGVuZ3RoOyBpKyspIHtcblx0dmFyIG9iaklkID0ga2V5czFbaV1cblx0dmFyIHBlclByb3AgPSBzb2x1dGlvbnNbb2JqSWRdXG5cdHZhciBjdXJyT2JqID0gc2tldGNocGFkLm9iak1hcFtvYmpJZF1cblx0dmFyIGtleXMyID0gT2JqZWN0LmtleXMocGVyUHJvcClcblx0Zm9yICh2YXIgaiA9IDA7IGogPCBrZXlzMi5sZW5ndGg7IGorKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzMltqXVxuXHQgICAgdmFyIHByb3BTb2xucyA9IHBlclByb3BbcHJvcF1cblx0ICAgIHZhciBjdXJyVmFsID0gY3Vyck9ialtwcm9wXVxuXHQgICAgdmFyIGpvaW5GbiA9IChjdXJyT2JqLnNvbHV0aW9uSm9pbnMgIT09IHVuZGVmaW5lZCAmJiAoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdICE9PSB1bmRlZmluZWQpID9cblx0XHQoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdIDogc2tldGNocGFkLnN1bUpvaW5Tb2x1dGlvbnNcblx0ICAgIGN1cnJPYmpbcHJvcF0gPSAoam9pbkZuLmJpbmQoc2tldGNocGFkKSkoY3VyclZhbCwgcHJvcFNvbG5zKVxuXHR9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhcHBseVNvbHV0aW9uc1dpdGhVbnJvbGxPbkNvbmZsaWN0KHNrZXRjaHBhZCwgc29sdXRpb25zKSB7XG4gICAgdGhpcy5kaXNjYXJkSXRlcmF0aW9uID0gZmFsc2UgICBcbiAgICAvL2xvZzIoc29sdXRpb25zKVxuICAgIHZhciBrZXlzMSA9IE9iamVjdC5rZXlzKHNvbHV0aW9ucylcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMxLmxlbmd0aDsgaSsrKSB7XG5cdHZhciBvYmpJZCA9IGtleXMxW2ldXG5cdHZhciBwZXJQcm9wID0gc29sdXRpb25zW29iaklkXVxuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBrZXlzMiA9IE9iamVjdC5rZXlzKHBlclByb3ApXG5cdGZvciAodmFyIGogPSAwOyBqIDwga2V5czIubGVuZ3RoOyBqKyspIHtcblx0ICAgIHZhciBwcm9wID0ga2V5czJbal1cblx0ICAgIHZhciBwcm9wU29sbnMgPSBwZXJQcm9wW3Byb3BdXG5cdCAgICB2YXIgY3VyclZhbCA9IGN1cnJPYmpbcHJvcF1cblx0ICAgIGN1cnJPYmpbcHJvcCArICdfX29sZCddID0gY3VyclZhbFxuXHQgICAgdmFyIGpvaW5GbiA9IChjdXJyT2JqLnNvbHV0aW9uSm9pbnMgIT09IHVuZGVmaW5lZCAmJiAoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdICE9PSB1bmRlZmluZWQpID9cblx0XHQoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdIDogc2tldGNocGFkLnN1bUpvaW5Tb2x1dGlvbnNcblx0ICAgIGN1cnJPYmpbcHJvcF0gPSAoam9pbkZuLmJpbmQoc2tldGNocGFkKSkoY3VyclZhbCwgcHJvcFNvbG5zKVxuXHR9XG4gICAgfVxuICAgIGlmICghdGhpcy5kaXNjYXJkSXRlcmF0aW9uKVxuXHRyZXR1cm5cbiAgICBsb2coJ2Rpc2NhcmRpbmcgc29sdXRpb25zIHNpbmNlIHRoZXJlIHdhcyBhIGNvbmZsaWN0Li4uJylcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMxLmxlbmd0aDsgaSsrKSB7XG5cdHZhciBvYmpJZCA9IGtleXMxW2ldXG5cdHZhciBwZXJQcm9wID0gc29sdXRpb25zW29iaklkXVxuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBrZXlzMiA9IE9iamVjdC5rZXlzKHBlclByb3ApXG5cdGZvciAodmFyIGogPSAwOyBqIDwga2V5czIubGVuZ3RoOyBqKyspIHtcblx0ICAgIHZhciBwcm9wID0ga2V5czJbal1cblx0ICAgIHZhciBwcm9wU29sbnMgPSBwZXJQcm9wW3Byb3BdXG5cdCAgICB2YXIgY3VyclZhbCA9IGN1cnJPYmpbcHJvcF1cblx0ICAgIGN1cnJPYmpbcHJvcF0gPSBjdXJyT2JqW3Byb3AgKyAnX19vbGQnXVxuXHQgICAgZGVsZXRlIGN1cnJPYmpbcHJvcCArICdfX29sZCddXG5cdH1cbiAgICB9XG59XG5cblxuZnVuY3Rpb24gaW52b2x2ZXMoY29uc3RyYWludCwgb2JqKSB7XG4gICAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG5cdGlmIChjb25zdHJhaW50W3BdID09PSBvYmopIHtcblx0ICAgIHJldHVybiB0cnVlXG5cdH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGFsbENvbWJpbmF0aW9uc09mQXJyYXlFbGVtZW50cyhhcnJheU9mQXJyYXlzKSB7XG4gICAgaWYgKGFycmF5T2ZBcnJheXMubGVuZ3RoID4gMSkge1xuXHR2YXIgZmlyc3QgPSBhcnJheU9mQXJyYXlzWzBdXG5cdHZhciByZXN0ID0gYWxsQ29tYmluYXRpb25zT2ZBcnJheUVsZW1lbnRzKGFycmF5T2ZBcnJheXMuc2xpY2UoMSkpXG5cdHZhciByZXMgPSBbXVxuXHRmb3IgKHZhciBqID0gMDsgaiA8IHJlc3QubGVuZ3RoIDsgaisrKSB7XG5cdCAgICB2YXIgciA9IHJlc3Rbal1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlyc3QubGVuZ3RoOyBpKyspIHtcblx0XHRyZXMucHVzaChbZmlyc3RbaV1dLmNvbmNhdChyKSlcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gcmVzXG4gICAgfSAgZWxzZSBpZiAoYXJyYXlPZkFycmF5cy5sZW5ndGggPT0gMSkge1xuXHRyZXR1cm4gYXJyYXlPZkFycmF5c1swXS5tYXAoZnVuY3Rpb24oZSkgeyByZXR1cm4gW2VdIH0pXG4gICAgfSBlbHNlXG5cdHJldHVybiBbXVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQm9vdHN0cmFwICYgSW5zdGFsbCBjb25zdHJhaW50IGxpYnJhcmllc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNrZXRjaHBhZCA9IG5ldyBTa2V0Y2hwYWQoKVxuaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoU2tldGNocGFkKVxuaW5zdGFsbFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsM0RHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsM0RTaW11bGF0aW9uQ29uc3RyYWludHMoU2tldGNocGFkKVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXhwb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSBTa2V0Y2hwYWRcblxuIl19
