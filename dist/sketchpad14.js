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

    Sketchpad.arith.FixedProperty = function Sketchpad__arith__FixedProperty(ref, value) {
	installRef(this, ref, 'v')
	this.value = value
    }

    sketchpad.addClass(Sketchpad.arith.FixedProperty, true)
    
    Sketchpad.arith.FixedProperty.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.value - ref(this, 'v')
    }

    Sketchpad.arith.FixedProperty.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return patch(this, 'v', this.value)
    }

    Sketchpad.arith.FixedProperty.description = function() { return  "Sketchpad.arith.FixedProperty({obj: O, prop: p}, Value) states that O.p = Value." }

    Sketchpad.arith.FixedProperty.prototype.description = function() { return this.v_obj.__toString + "." + this.v_prop + " = " + this.value + "." }

    Sketchpad.arith.FixedProperty.dummy = function(x, y) {
	return new Sketchpad.arith.FixedProperty({obj: new Point(1,1), prop: 'x'}, 42) 
    }

    // Equality Constraint, i.e., k1 * o1.p1 = k2 * o2.p2

    Sketchpad.arith.EqualProperties = function Sketchpad__arith__EqualProperties(ref1, ref2, optOnlyWriteTo, k1, k2) {
	this.k1 = k1 || 1, this.k2 = k2 || 1
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.onlyWriteTo = optOnlyWriteTo || [1, 2]
    }

    sketchpad.addClass(Sketchpad.arith.EqualProperties, true)

    Sketchpad.arith.EqualProperties.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var diff = (this.k1 * ref(this, 'v1')) - (this.k2 * ref(this, 'v2'))
	return diff
    }

    Sketchpad.arith.EqualProperties.prototype.solve = function(pseudoTime, prevPseudoTime) {
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

    
    Sketchpad.arith.EqualProperties.description = function() { return  "Sketchpad.arith.EqualProperties({obj: O1, prop: p1}, {obj: O2, prop: p2}, WritableIdxs, Number K1, Number K2) states that K1 * O1.p1 = K2 * O2.p2 . Constants K1-2 default to 1. Optional WritableIdxs gives a list of indices (elements 1,and/or 2) the constraint is allowed to change," }

    Sketchpad.arith.EqualProperties.prototype.description = function() { return  this.k1 + " * " + this.v1_obj.__toString + "." + this.v1_prop + " = " + this.k2 + " * " + this.v2_obj.__toString + "." + this.v2_prop + " ." }

    Sketchpad.arith.EqualProperties.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}, {obj: this.v2_obj, props: [this.v2_prop]}]
    }

    Sketchpad.arith.EqualProperties.dummy = function(x, y) {
	return new Sketchpad.arith.EqualProperties({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    // OnWayEquality Constraint, i.e., o1.p1 = o2.p2

    Sketchpad.arith.OneWayEqualProperties = function Sketchpad__arith__OneWayEqualProperties(ref1, ref2, optSecondPropIsFn) {
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.secondPropIsFn = optSecondPropIsFn
    }

    sketchpad.addClass(Sketchpad.arith.OneWayEqualProperties, true)

    Sketchpad.arith.OneWayEqualProperties.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v2 = this.secondPropIsFn ? fnRef(this, 'v2') : ref(this, 'v2')
	var e = ref(this, 'v1') == v2 ? 0 : 1
	return e
    }

    Sketchpad.arith.OneWayEqualProperties.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v2 = this.secondPropIsFn ? fnRef(this, 'v2') : ref(this, 'v2')
	return patch(this, 'v1', v2)
    }
    
    Sketchpad.arith.OneWayEqualProperties.description = function() { return  "Sketchpad.arith.OneWayEqualProperties({obj: O1, prop: p1}, {obj: O2, prop: p2}, Boolean secondPropIsFn) states that O1.p1 = O2.p2 (right hand-side is  read-only). If secondPropIsFn = true then O2.p2() is invoked instead." }
    
    Sketchpad.arith.OneWayEqualProperties.prototype.description = function() {  var r1 = ref(this, 'v1'), r2 = ref(this, 'v2'); return  this.v1_obj.__toString + "." + this.v1_prop + " = " + this.v2_obj.__toString + "." + this.v2_prop + " and right hand-side is read-only." }

    Sketchpad.arith.OneWayEqualProperties.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}]
    }

    Sketchpad.arith.OneWayEqualProperties.dummy = function(x, y) {
	return new Sketchpad.arith.OneWayEqualProperties({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    // Inequality Constraint, i.e., k1 * o1.p1 >= k2 * o2.p2 + k3 or k1 * o1.p1 <= k2 * o2.p2 + k3

    Sketchpad.arith.InequalityRelation = function Sketchpad__arith__InequalityRelation(ref1, ref2, isGeq, k1, k2, k3) {
	this.k1 = k1 || 1, this.k2 = k2 || 1, this.k3 = k3 || 0
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.isGeq = isGeq
    }

    sketchpad.addClass(Sketchpad.arith.InequalityRelation, true)

    Sketchpad.arith.InequalityRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v1 = this.k1 * ref(this, 'v1') , v2 = (this.k2 * ref(this, 'v2')) + this.k3, cond = this.isGeq ? v1 >= v2 : v1 <= v2, e = cond ? 0 : v2 - v1
	return e
    }

    Sketchpad.arith.InequalityRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v2 = (this.k2 * ref(this, 'v2')) + this.k3
	res = patch(this, 'v1', v2 / this.k1)
	return res
    }

    Sketchpad.arith.InequalityRelation.description = function() { return  "Sketchpad.arith.InequalityRelation({obj: O1, prop: p1}, {obj: O2, prop: p2}, isGeq, Number K1, Number K2, Number K3) states that K1 * O1.p1 >= K2 * O2.p2 + K3 (when isGeq=true) or K1 * O1.p1 <= K2 * O2.p2 + K3 (when isGeq=false). Constants K1-2 default to 1 and K3 to 0" }

    Sketchpad.arith.InequalityRelation.prototype.description = function() { var r1 = ref(this, 'v1'), r2 = ref(this, 'v2'); return this.k1 + " * " + this.v1_obj.__toString + "." + this.v1_prop + " " + (this.isGeq ? ">" : "<") + "= " + this.k2 + " * " + this.v2_obj.__toString + "." + this.v2_prop + " + " + this.k3 + " ." }

    Sketchpad.arith.InequalityRelation.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}, {obj: this.v2_obj, props: [this.v2_prop]}]
    }

    Sketchpad.arith.InequalityRelation.dummy = function(x, y) {
	return new Sketchpad.arith.InequalityRelation({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, true) 
    }

    // Sum Constraint, i.e., k1 * o1.p1 + k2 * o2.p2 = k3 * o3.p3 + k4

    Sketchpad.arith.SumRelation = function Sketchpad__arith__SumRelation(ref1, ref2, ref3, optOnlyWriteTo, k1, k2, k3, k4) {
	this.k1 = k1 || 1, this.k2 = k2 || 1, this.k3 = k3 || 1, this.k4 = k4 || 0
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	installRef(this, ref3, 'v3')
	this.onlyWriteTo = optOnlyWriteTo || [1, 2, 3]
    }

    sketchpad.addClass(Sketchpad.arith.SumRelation, true)

    Sketchpad.arith.SumRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var diff = this.k3 * ref(this, 'v3') + this.k4 - ((this.k1 * ref(this, 'v1')) + (this.k2 * ref(this, 'v2')))
	return diff
    }

    Sketchpad.arith.SumRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.arith.SumRelation.description = function() { return  "Sketchpad.arith.SumRelation({obj: O1, prop: p1}, {obj: O2, prop: p2}, {obj: O3, prop: p3}, WritableIdxs, Number K1, Number K2, Number K3, Number K4) states that K1 * O1.p1 + K2 * O2.p2 = K3 * O3.p3 + K4 . Constants K1-3 default to 1 and K4 to 0. Optional WritableIdxs gives a list of indices (1, 2, or, 3) the constraint is allowed to change." } 

    Sketchpad.arith.SumRelation.prototype.description = function() { var r1 = ref(this, 'v1'), r2 = ref(this, 'v2'), r3 = ref(this, 'v3'); return this.k1 + " * " + this.v1_obj.__toString + "." + this.v1_prop + " + " + this.k2 + " * " + this.v2_obj.__toString  + "." + this.v2_prop + " = " + this.k3 + " * " + this.v3_obj.__toString + "." + this.v3_prop + " + " + this.k4 + " ." }

    Sketchpad.arith.SumRelation.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}, {obj: this.v2_obj, props: [this.v2_prop]}, {obj: this.v3_obj, props: [this.v3_prop]}]
    }

    Sketchpad.arith.SumRelation.dummy = function(x, y) {
	return new Sketchpad.arith.SumRelation({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}) 
    }

    // SumInequality Constraint, i.e., k1 * o1.p1 >= k2 * o2.p2 + k3 * o3.p3 + k4 or k1 * o1.p1 >= k2 * o2.p2 + k3 * o3.p3 + k4

    Sketchpad.arith.SumInequalityRelation = function Sketchpad__arith__SumInequalityRelation(ref1, ref2, ref3, isGeq, k1, k2, k3, k4) {
	this.k1 = k1 || 1, this.k2 = k2 || 1, this.k3 = k3 || 1, this.k4 = k4 || 0
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	installRef(this, ref3, 'v3')
	this.isGeq = isGeq
    }

    sketchpad.addClass(Sketchpad.arith.SumInequalityRelation, true)

    Sketchpad.arith.SumInequalityRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v1 = this.k1 * ref(this, 'v1'), v2 = this.k2 * ref(this, 'v2'), v3 = this.k3 * ref(this, 'v3'), sum = v2 + v3 + this.k4, cond = this.isGeq ? v1 >= sum : v1 <= sum, e = cond ? 0 : sum - v1
	return e
    }

    Sketchpad.arith.SumInequalityRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	v2 = this.k2 * ref(this, 'v2'), v3 = this.k3 * ref(this, 'v3'), sum = v2 + v3 + this.k4
	res = patch(this, 'v1', sum / this.k1)
	return res
    }

    Sketchpad.arith.SumInequalityRelation.prototype.effects = function() {
	return [{obj: this.v1_obj, props: [this.v1_prop]}]
    }

    Sketchpad.arith.SumInequalityRelation.description = function() { return  "Sketchpad.arith.SumInequalityRelation({obj: O1, prop: p1}, {obj: O2, prop: p2}, {obj: O3, prop: p3}, isGeq, Number K1, Number K2, Number K3, Number K4) states that K1 * O1.p1 >=  k2 * O2.p2  + k3 * O3.p3 + K4  or  K1 * O1.p1 <=  K2 * O2.p2 + K3 * O3.p3 + K4 (>= when isGeq=true)" } 

    Sketchpad.arith.SumInequalityRelation.prototype.description = function() { var r1 = ref(this, 'v1'), r2 = ref(this, 'v2'), r3 = ref(this, 'v3'); return  this.k1 + " * " + this.v1_obj.__toString + "." + this.v1_prop + " " + (this.isGeq ? ">" : "<") + "= " + this.k2 + " * " + this.v2_obj.__toString + " + " + this.k3 + " * " + this.v3_obj.__toString + "." + this.v3_prop + " + " + this.k4 + " ." }

    Sketchpad.arith.SumInequalityRelation.dummy = function(x, y) {
	return new Sketchpad.arith.SumInequalityRelation({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, true) 
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

    Sketchpad.geom.FixedCoordinate = function Sketchpad__geom__FixedCoordinate(p, x, y) {
	this.p = p
	this.c = new Point(x, y)
    }

    sketchpad.addClass(Sketchpad.geom.FixedCoordinate, true)

    Sketchpad.geom.FixedCoordinate.prototype.propertyTypes = {p: 'Point', c: 'Point'}

    Sketchpad.geom.FixedCoordinate.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.c, this.p))
    }

    Sketchpad.geom.FixedCoordinate.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p: {x: this.c.x, y: this.c.y}}
    }

    Sketchpad.geom.FixedCoordinate.description = function() { return  "Sketchpad.geom.FixedCoordinate(Point P, Number X, Number Y) states that point P should stay at coordinate (X, Y)." }

    Sketchpad.geom.FixedCoordinate.prototype.description = function() { return  "point p (" + this.p.__toString + ") should stay at coordinate (" + this.c.x + ", " + this.c.y + ")." }

    Sketchpad.geom.FixedCoordinate.prototype.effects = function() {
	return [{obj: this.p, props: ['x', 'y']}]
    }

    Sketchpad.geom.FixedCoordinate.dummy = function(x, y) {
	var p1 = Point.dummy(x, y)
	var p2 = Point.dummy(y, x)
	return new Sketchpad.geom.FixedCoordinate(p1, p2.x, p2.y)
    }

    Sketchpad.geom.FixedCoordinate.prototype.draw = function(canvas, origin) {
	var ctxt = canvas.ctxt
	if (this.p.isSelected) return // don't draw over the selection highlight
	ctxt.fillStyle = 'black'
	ctxt.beginPath()
	ctxt.arc(this.c.x + origin.x, this.c.y + origin.y, canvas.pointRadius * 0.666, 0, 2 * Math.PI)
	ctxt.closePath()
	ctxt.fill()
    }

    // Coincidence Constraint, i.e., I want these two points to be at the same place.

    Sketchpad.geom.Coincidence = function Sketchpad__geom__Coincidence(p1, p2) {
	this.p1 = p1
	this.p2 = p2
    }

    sketchpad.addClass(Sketchpad.geom.Coincidence, true)

    Sketchpad.geom.Coincidence.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.p2, this.p1))
    }
    
    Sketchpad.geom.Coincidence.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(this.p2, this.p1), 0.5)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1))}
    }

    Sketchpad.geom.Coincidence.description = function() { return  "Sketchpad.geom.Coincidence(Point P1, Poiont P2) states that points P1 & P2 should be at the same place." }

    Sketchpad.geom.Coincidence.prototype.description = function() { return  "points p1 (" + this.p1.__toString + ") & p2 (" + this.p2.__toString + ") should be at the same place." }
    
    Sketchpad.geom.Coincidence.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	return new Sketchpad.geom.Coincidence(l.p1, l.p2)
    }
   
    // Equivalence Constraint, i.e., I want the vectors p1->p2 and p3->p4 to be the same.

    Sketchpad.geom.EqualVectors = function Sketchpad__geom__EqualVectors(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.EqualVectors, true)

    Sketchpad.geom.EqualVectors.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

    Sketchpad.geom.EqualVectors.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)))
    }
    
    Sketchpad.geom.EqualVectors.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.25)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1)), p3: plus(this.p3, scaledBy(splitDiff, -1)), p4: plus(this.p4, splitDiff)}
    }

    Sketchpad.geom.EqualVectors.description = function() { return  "Sketchpad.geom.EqualVectors(Point P1, Point P2, Point P3, Point P4) says line sections P1-2 and P3-4 are parallel and of the same lengths." }

    Sketchpad.geom.EqualVectors.prototype.description = function() { return  "line sections  p1 (" + this.p1.__toString + ") -p2 (" + this.p2.__toString + ") and  p3 (" + this.p3.__toString + ") -p4 (" + this.p4.__toString + ") are parallel and of the same lengths." }

    Sketchpad.geom.EqualVectors.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.EqualVectors(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    Sketchpad.geom.EqualVectors.prototype.draw = function(canvas, origin) {
	var l = distance(this.p1, this.p2)
	Sketchpad.geom.drawVisualizationLine(canvas, origin, this.p1, this.p2, l)
	Sketchpad.geom.drawVisualizationLine(canvas, origin, this.p3, this.p4, l)
    }

    Sketchpad.geom.EqualVectors.prototype.containsPoint = function(x, y) {
	var p1 = this.p1, p2 = this.p2, p3 = this.p3, p4 = this.p4
	var x1 = Math.min(p1.x, p2.x, p3.x, p4.x), x2 = Math.max(p1.x, p2.x, p3.x, p4.x)
	var y1 = Math.min(p1.y, p2.y, p3.y, p4.y), y2 = Math.max(p1.y, p2.y, p3.y, p4.y)
	this.__border = new Box(new Point(x1, y1), x2 - x1, y2 - y1) 
	return this.__border.containsPoint(x, y) 
    }
   
    Sketchpad.geom.EqualVectors.prototype.border = function() {
	var p1 = this.p1, p2 = this.p2, p3 = this.p3, p4 = this.p4
	var x1 = Math.min(p1.x, p2.x, p3.x, p4.x), x2 = Math.max(p1.x, p2.x, p3.x, p4.x)
	var y1 = Math.min(p1.y, p2.y, p3.y, p4.y), y2 = Math.max(p1.y, p2.y, p3.y, p4.y)
	this.__border = new Box(new Point(x1, y1), x2 - x1, y2 - y1) 
	return this.__border
    } 

    // One Way Equivalence Constraint, i.e., I want the vectors p1->p2 to always match with p3->p4

    Sketchpad.geom.OneWayEqualVectors = function Sketchpad__geom__OneWayEqualVectors(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.OneWayEqualVectors, true)

    Sketchpad.geom.OneWayEqualVectors.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}
    
    Sketchpad.geom.OneWayEqualVectors.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)))
    }
    
    Sketchpad.geom.OneWayEqualVectors.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.5)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1))}
    }

    Sketchpad.geom.OneWayEqualVectors.description = function() { return  "Sketchpad.geom.OneWayEqualVectors(Point P1, Point P2, Point P3, Point P4) says the vectors P1->P2 always matches with P3->P4" }

    Sketchpad.geom.OneWayEqualVectors.prototype.description = function() { return  "vectors p1 (" + this.p1.__toString + ") ->p2 (" + this.p2.__toString + ") always matches with p3 (" + this.p3.__toString + ") ->p4 (" + this.p4.__toString + ") ." }

    Sketchpad.geom.OneWayEqualVectors.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.OneWayEqualVectors(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    // Equal Distance constraint - keeps distances P1-->P2, P3-->P4 equal

    Sketchpad.geom.EqualLengths = function Sketchpad__geom__EqualLengths(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.EqualLengths, true)
    
    Sketchpad.geom.EqualLengths.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

    Sketchpad.geom.EqualLengths.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	var l34 = magnitude(minus(this.p3, this.p4))
	return l12 - l34
    }
    
    Sketchpad.geom.EqualLengths.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	var l34 = magnitude(minus(this.p3, this.p4))
	var delta = (l12 - l34) / 4
	var e12 = scaledBy(Sketchpad.geom.normalized(minus(this.p2, this.p1)), delta)
	var e34 = scaledBy(Sketchpad.geom.normalized(minus(this.p4, this.p3)), delta)
	return {p1: plus(this.p1, e12), p2: plus(this.p2, scaledBy(e12, -1)), p3: plus(this.p3, scaledBy(e34, -1)), p4: plus(this.p4, e34)}
    }

    Sketchpad.geom.EqualLengths.description = function() { return  "Sketchpad.geom.EqualLengths(Point P1, Point P2, Point P3, Point P4) keeps distances P1->P2, P3->P4 equal." }

    Sketchpad.geom.EqualLengths.prototype.description = function() { return  "distances p1 (" + this.p1.__toString + ") ->p2 (" + this.p2.__toString + ") & p3 (" + this.p3.__toString + ") ->p4 (" + this.p4.__toString + ") are equal." }

    Sketchpad.geom.EqualLengths.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.EqualLengths(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    // Length constraint - maintains distance between P1 and P2 at L.

    Sketchpad.geom.FixedLength = function Sketchpad__geom__FixedLength(p1, p2, l, onlyOneWritable) {
	this.p1 = p1
	this.p2 = p2
	this.l = l
	this._onlyOneWritable = onlyOneWritable
    }

    sketchpad.addClass(Sketchpad.geom.FixedLength, true)

    Sketchpad.geom.FixedLength.prototype.propertyTypes = {p1: 'Point', p2: 'Point', l: 'Number'}

    Sketchpad.geom.FixedLength.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	return l12 - this.l
    }

    Sketchpad.geom.FixedLength.prototype.solve = function(pseudoTime, prevPseudoTime) {
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
    
    Sketchpad.geom.FixedLength.description = function() { return  "Sketchpad.geom.FixedLength(Point P1, Point P2, Number L) says points P1 and P2 always maintain a distance of L." }

    Sketchpad.geom.FixedLength.prototype.description = function() { return  "points p1 (" + this.p1.__toString + ") and p2 (" + this.p2.__toString + ") always maintain a distance of " + this.l + "." }

    Sketchpad.geom.FixedLength.prototype.effects = function() {
	return [{obj: this.p1, props: ['x', 'y']}, {obj: this.p2, props: ['x', 'y']}]
    }

    Sketchpad.geom.FixedLength.dummy = function(x, y) {
	return new Sketchpad.geom.FixedLength(new Point(x - 50, y - 50), new Point(x + 50, y + 50), 100)
    }

    Sketchpad.geom.FixedLength.prototype.draw = function(canvas, origin) {
	Sketchpad.geom.drawVisualizationLine(canvas, origin, this.p1, this.p2, this.l)
    }

    Sketchpad.geom.FixedLength.prototype.containsPoint = function(x, y) {
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
   
    Sketchpad.geom.FixedLength.prototype.border = function() {
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

    Sketchpad.geom.FixedAngle = function Sketchpad__geom__FixedAngle(p1, p2, p3, p4, theta) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
	this.theta = theta === undefined ? Sketchpad.geom.calculateAngle(p1, p2, p3, p4) : theta
    }

    sketchpad.addClass(Sketchpad.geom.FixedAngle, true)

    Sketchpad.geom.FixedAngle.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point', theta: 'Number'}

    Sketchpad.geom.FixedAngle.prototype.computeError = function(pseudoTime, prevPseudoTime) {
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
    
    Sketchpad.geom.FixedAngle.prototype.solve = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.geom.FixedAngle.description = function() { return  "Sketchpad.geom.FixedAngle(Point P1, Point P2, Point P3, Point P4, Number Theta) maintains angle between P1->P2 and P3->P4 at Theta." }

    Sketchpad.geom.FixedAngle.prototype.description = function() { return  "angle is maintained between p1 (" + this.p1.__toString + ") ->p2 (" + this.p2.__toString + ") and p3 (" + this.p3.__toString + ") ->p4 (" + this.p4.__toString + ") at " + this.theta + " radians." }

    Sketchpad.geom.FixedAngle.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.FixedAngle(l1.p1, l1.p2, l2.p1, l2.p2)
    }
    
    Sketchpad.geom.FixedAngle.prototype.draw = function(canvas, origin) {
	var ctxt = canvas.ctxt
	var m1 = scaledBy(plus(this.p1, this.p2), 0.5)
	var m2 = scaledBy(plus(this.p3, this.p4), 0.5)
	var m = scaledBy(plus(m1, m2), 0.5)
	canvas.drawArrow(m1, m2, origin)
	ctxt.fillStyle = 'red'
	ctxt.fillText('theta = ' + Math.floor(this.theta / Math.PI * 180), m.x + origin.x, m.y + origin.y)
    }

    Sketchpad.geom.FixedAngle.prototype.containsPoint = function(x, y) {
	var m1 = scaledBy(plus(this.p1, this.p2), 0.5)
	var m2 = scaledBy(plus(this.p3, this.p4), 0.5)
	var m = scaledBy(plus(m1, m2), 0.5)
	this.__border = new Box(new Point(m.x - 50, m.y - 50), 100, 100) 
	return this.__border.containsPoint(x, y) 
    }
   
    Sketchpad.geom.FixedAngle.prototype.border = function() {
	var m1 = scaledBy(plus(this.p1, this.p2), 0.5)
	var m2 = scaledBy(plus(this.p3, this.p4), 0.5)
	var m = scaledBy(plus(m1, m2), 0.5)
	this.__border = new Box(new Point(m.x - 50, m.y - 50), 100, 100) 
	return this.__border
    } 

    // Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
    // w is in units of Hz - whole rotations per second.

    Sketchpad.geom.MotorMotion = function Sketchpad__geom__MotorMotion(p1, p2, w) {
	this.p1 = p1
	this.p2 = p2
	this.w = w
    }

    sketchpad.addClass(Sketchpad.geom.MotorMotion, true)

    Sketchpad.geom.MotorMotion.prototype.propertyTypes = {p1: 'Point', p2: 'Point', w: 'Number'}
    
    Sketchpad.geom.MotorMotion.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return 1
    }

    Sketchpad.geom.MotorMotion.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var t = (pseudoTime - prevPseudoTime) / 1000.0
	var dTheta = t * this.w * (2 * Math.PI)
	var m12 = midpoint(this.p1, this.p2)
	return {p1: rotatedAround(this.p1, dTheta, m12),
		p2: rotatedAround(this.p2, dTheta, m12)}
    }

    Sketchpad.geom.MotorMotion.description = function() { return  "Sketchpad.geom.MotorMotion(Point P1, Point P2, Number W) causes P1 and P2 to orbit their midpoint at the given rate of w, in units of Hz: whole rotations per second." } 

    Sketchpad.geom.MotorMotion.prototype.description = function() { return  "p1 (" + this.p1.__toString + ") and p2 (" + this.p2.__toString + ") to orbit their midpoint at the given rate of " + this.w + ", in units of Hz: whole rotations per second." } 
    
    Sketchpad.geom.MotorMotion.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	return new Sketchpad.geom.MotorMotion(l.p1, l.p2, 1)
    }
    
    Sketchpad.geom.CartesianPointPlacement = function  Sketchpad__geom__CartesianPointPlacement(position, vector, origin, unit) {
	this.position = position
	this.vector = vector
	this.origin = origin
	this.unit = unit
    }
    
    sketchpad.addClass(Sketchpad.geom.CartesianPointPlacement, true)
    
    Sketchpad.geom.CartesianPointPlacement.description = function() {
	return "Sketchpad.geom.CartesianPointPlacement(Point P, Vector V, Point O, Number U) states that P should be positioned based on vector V's X and Y discrete coordinate values, and on origin O and each unit on axis having a vertical and horizontal length of U"
    }

    Sketchpad.geom.CartesianPointPlacement.prototype.description = function() {
	return "" + this.position.__toString + " should be positioned based on vector " + this.vector.__toString + "'s X and Y discrete coordinate values, and on origin " + this.origin.__toString + " and each unit on axis having a vertical and horizontal length of " + this.unit
    }

    Sketchpad.geom.CartesianPointPlacement.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var origin = this.origin, vector = this.vector, position = this.position, unit = this.unit
	var diffX = Math.abs(origin.x + unit * vector.x - position.x)
	var diffY = Math.abs(origin.y - unit * vector.y - position.y)
	return diffX + diffY
    }

    Sketchpad.geom.CartesianPointPlacement.prototype.solve = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation.TickingTimer = function Sketchpad__simulation__TickingTimer(timer) {
	this.timer = timer
    }

    sketchpad.addClass(Sketchpad.simulation.TickingTimer, true)

    Sketchpad.simulation.TickingTimer.description = function() { return "Sketchpad.simulation.Timer(Timer T) states the system advances its pseudo-time by T's step size at each frame cycle." }

    Sketchpad.simulation.TickingTimer.prototype.description = function() { return "the system advances its pseudo-time by " + this.timer.stepSize + " at each frame cycle." }

    Sketchpad.simulation.TickingTimer.prototype.propertyTypes = {timer: 'Timer'}

    Sketchpad.simulation.TickingTimer.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return 0
    }
    
    Sketchpad.simulation.TickingTimer.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {}
    }

    Sketchpad.simulation.TickingTimer.dummy = function(x, y) {
	return new Sketchpad.simulation.TickingTimer(Sketchpad.simulation.Timer.dummy(x, y))
    }
    
    Sketchpad.simulation.TickingTimer.prototype.proposeNextPseudoTime = function(pseudoTime) {
	return pseudoTime + this.timer.stepSize
    }    

    // ValueSliderBehavior Constraint

    Sketchpad.simulation.ValueSliderBehavior = function Sketchpad__simulation__ValueSliderBehavior(sliderPoint, xOrY, sliderZeroValue, sliderRangeLength, slidedObj, slidedProp) {
	this.sliderPoint = sliderPoint
	this.xOrY = xOrY
	this.sliderZeroValue = sliderZeroValue
	this.sliderRangeLength = sliderRangeLength
	this.slidedObj = slidedObj
	this.slidedProp = slidedProp
	this.slidedObjPropZeroValue = slidedObj[slidedProp]
    }

    sketchpad.addClass(Sketchpad.simulation.ValueSliderBehavior, true)

    Sketchpad.simulation.ValueSliderBehavior.prototype.propertyTypes = {sliderPoint: 'Point', xOrY: 'String', sliderZeroValue: 'Number', sliderRangeLength: 'Number', slidedObjPropZeroValue: 'Number'}

    Sketchpad.simulation.ValueSliderBehavior.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var slidedProp = this.slidedProp
	var currSliderDiff = (this.sliderZeroValue - this.sliderPoint[this.xOrY]) / this.sliderRangeLength
	var slidedObjPropTarget = (1 + currSliderDiff) * this.slidedObjPropZeroValue
	return slidedObjPropTarget - this.slidedObj[slidedProp]

    }

    Sketchpad.simulation.ValueSliderBehavior.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var soln = {}
	var slidedProp = this.slidedProp
	var currSliderDiff = (this.sliderZeroValue - this.sliderPoint[this.xOrY]) / this.sliderRangeLength
	var slidedObjPropTarget = (1 + currSliderDiff) * this.slidedObjPropZeroValue
	soln[slidedProp] = slidedObjPropTarget
	this.sliderPoint.selectionIndices[0] = Math.floor(100 * currSliderDiff)
	return {slidedObj: soln}
    }

    Sketchpad.simulation.ValueSliderBehavior.dummy = function(x, y) {
	return new Sketchpad.simulation.ValueSliderBehavior(Point.dummy(x, y), 'x', 0, 100, {foo: 0}, 'foo')
    }

    // Motion Constraint

    Sketchpad.simulation.VelocityRelation = function Sketchpad__simulation__VelocityRelation(body) {
	this.body = body
	this.position = body.position
	this.velocity = body.velocity
    }

    sketchpad.addClass(Sketchpad.simulation.VelocityRelation, true)

    Sketchpad.simulation.VelocityRelation.prototype.propertyTypes = {body: 'FreeBody'}

    Sketchpad.simulation.VelocityRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity, dt)), this.position))
    }
    
    Sketchpad.simulation.VelocityRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity, dt))}
    }
    
    Sketchpad.simulation.VelocityRelation.description = function() { return  "Sketchpad.simulation.VelocityRelation(FreeBody Body) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.VelocityRelation.prototype.description = function() { return  "for Body " + this.body.__toString + " Pos = old(Pos) + (" + this.velocity.x + "," +  this.velocity.y + ") * dt, where dt is the frame step time amount." }


    Sketchpad.simulation.VelocityRelation.dummy = function(x, y) {
	return new Sketchpad.simulation.VelocityRelation(FreeBody.dummy(x, y))
    }

    Sketchpad.simulation.VelocityRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	this.lastPosition = scaledBy(this.position, 1)
    }
        
    Sketchpad.simulation.VelocityRelation.prototype.draw = function(canvas, origin) {
	var ctxt = canvas.ctxt
	var slopeV = Sketchpad.simulation.slopeVector(this.position, this.velocity)	
	var len = 50
	var p = plus(this.position, {x: slopeV.x * len, y: slopeV.y * len})
	canvas.drawArrow(this.position, p, origin, 'v')
    }
    
    // Body With Velocity Constraint

    Sketchpad.simulation.VelocityAsLineSegmentRelation = function Sketchpad__simulation__VelocityAsLineSegmentRelation(body, velocity) {
	this.body = body
	this.position = body.position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation.VelocityAsLineSegmentRelation, true)

    Sketchpad.simulation.VelocityAsLineSegmentRelation.prototype.propertyTypes = {body: 'FreeBody', velocity: 'PointVector'}

    Sketchpad.simulation.VelocityAsLineSegmentRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt)), this.position))
    }
    
    Sketchpad.simulation.VelocityAsLineSegmentRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt))}
    }

    Sketchpad.simulation.VelocityAsLineSegmentRelation.description = function() { return  "Sketchpad.simulation.VelocityAsLineSegmentRelation(FreeBody Body, PointVector Velocity) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.VelocityAsLineSegmentRelation.prototype.description = function() { return  "for Body " + this.body.__toString + ": Pos = old(Pos) + (vector " + this.velocity.__toString + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation.VelocityAsLineSegmentRelation.dummy = function(x, y) {
	return new Sketchpad.simulation.VelocityAsLineSegmentRelation(FreeBody.dummy(x, y), PointVector.dummy(x, y))
    }
    
    Sketchpad.simulation.VelocityAsLineSegmentRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastPosition = scaledBy(this.position, 1)
    }
    
    // Acceleration Constraint

    Sketchpad.simulation.AccelerationRelation = function Sketchpad__simulation__AccelerationRelation(body, acceleration) {
	this.body = body
	this.velocity = body.velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation.AccelerationRelation, true)
    
    Sketchpad.simulation.AccelerationRelation.prototype.propertyTypes = {body: 'FreeBody', acceleration: 'Vector'}

    Sketchpad.simulation.AccelerationRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastVelocity, scaledBy(this.acceleration, dt)), this.velocity))
    }

    Sketchpad.simulation.AccelerationRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {velocity: plus(this.lastVelocity, scaledBy(this.acceleration, dt))}
    }

    Sketchpad.simulation.AccelerationRelation.description = function() { return  "Sketchpad.simulation.AccelerationRelation(FreeBody Body, Vector Acceleration) states for Body: Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation.AccelerationRelation.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) + (" + this.acceleration.x + "," +  this.acceleration.y + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation.AccelerationRelation.dummy = function(x, y) {
	return new Sketchpad.simulation.AccelerationRelation(FreeBody.dummy(x, y), Sketchpad.geom.Vector.dummy(x + 50, y + 50))
    }

    Sketchpad.simulation.AccelerationRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    // Air Resistance Constraint

    Sketchpad.simulation.FrictionRelation = function Sketchpad__simulation__FrictionRelation(body, scale) {
	this.body = body
	this.velocity = body.velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation.FrictionRelation, true)

    Sketchpad.simulation.FrictionRelation.prototype.propertyTypes = {scale: 'Number', velocity: 'Vector'}

    Sketchpad.simulation.FrictionRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(scaledBy(this.lastVelocity, this.scale), this.velocity))
    }

    Sketchpad.simulation.FrictionRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: scaledBy(this.lastVelocity, this.scale)}
    }

    Sketchpad.simulation.FrictionRelation.description = function() { return  "Sketchpad.simulation.FrictionRelation(FreeBody Body) states for Body: Velocity = old(Velocity) * Scale ." }

    Sketchpad.simulation.FrictionRelation.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) * " + this.scale +" ." }

    Sketchpad.simulation.FrictionRelation.dummy = function(x, y) {
	return new Sketchpad.simulation.FrictionRelation(Sketchpad.geom.Vector.dummy(x, y), .1)
    }

    Sketchpad.simulation.FrictionRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    //  Bounce Constraint

    Sketchpad.simulation.BounceBehavior = function Sketchpad__simulation__BounceBehavior(body, surfaceP1, surfaceP2) {
	this.body = body
	this.halfLength = body.radius
	this.position = body.position
	this.velocity = body.velocity
	this.surfaceP1 = surfaceP1
	this.surfaceP2 = surfaceP2
    }

    sketchpad.addClass(Sketchpad.simulation.BounceBehavior, true)

    Sketchpad.simulation.BounceBehavior.prototype.propertyTypes = {body: 'FreeBody', surfaceP1: 'Point', surfaceP2: 'Point'}
    
    Sketchpad.simulation.BounceBehavior.prototype.computeError = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation.BounceBehavior.prototype.solve = function(pseudoTime, prevPseudoTime) {
	/*
	  var dt = pseudoTime - prevPseudoTime
	  return {velocity: 
	  minus(plus(this.bounceVelocity, scaledBy({x: 0, y: -Sketchpad.simulation.g}, dt)), this.velocity),
	  position: (minus(this.bouncePosition, this.position))
	  }
	*/
	return {}
    }

    Sketchpad.simulation.BounceBehavior.description = function() { return  "Sketchpad.simulation.BounceBehavior(FreeBody Body, Point End1, Point End2) states that the Body with diameter L and position Pos and velocity vector Vel is going to bounce off the line with two end points End1 & End2." }

    Sketchpad.simulation.BounceBehavior.prototype.description = function() { return  "Body " + this.body.__toString + " with diameter L and position Pos and velocity vector Vel is going to bounce off the line with two end points " + this.surfaceP1.__toString + " & " + this.surfaceP2.__toString + "." }

    Sketchpad.simulation.BounceBehavior.dummy = function(x, y) {
	return new Sketchpad.simulation.BounceBehavior(FreeBody.dummy(x, y), Point.dummy(x, y), Point.dummy(x, y))
    }

    Sketchpad.simulation.BounceBehavior.prototype.proposeNextPseudoTime = function(pseudoTime) {
	var res = pseudoTime + Sketchpad.simulation.computeContact(this.halfLength, this.position, this.velocity, this.surfaceP1, this.surfaceP2)
	this.tcontact = res;
	return res
    }

    Sketchpad.simulation.BounceBehavior.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation.HitSurfaceBehavior = function Sketchpad__simulation__HitSurfaceBehavior(body, surfaceP1, surfaceP2) {
	this.body = body
	this.halfLength = body.radius / 2
	this.position = body.position
	this.velocity = body.velocity
	this.surfaceP1 = surfaceP1
	this.surfaceP2 = surfaceP2
    }

    sketchpad.addClass(Sketchpad.simulation.HitSurfaceBehavior, true)

    Sketchpad.simulation.HitSurfaceBehavior.prototype.propertyTypes = {body: 'FreeBody', surfaceP1: 'Point', surfaceP2: 'Point'}

    Sketchpad.simulation.HitSurfaceBehavior.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.contact ? (
	    magnitude(minus(this.hitVelocity, this.velocity)) + 
		magnitude(minus(this.hitPosition, this.position)) 
	) : 0
    }

    Sketchpad.simulation.HitSurfaceBehavior.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: this.hitVelocity, position: this.hitPosition}
    }

    Sketchpad.simulation.HitSurfaceBehavior.description = function() { return  "Sketchpad.simulation.HitSurfaceBehavior(FreeBody Body, Point End1, Point End2) states that the Body with diameter L and position Pos and velocity vector Vel is going to land and stay on the line with two end points End1 & End2." }

    Sketchpad.simulation.HitSurfaceBehavior.prototype.description = function() { return  "Body " + this.body.__toString + " with diameter L and position Pos and velocity vector Vel is going to land and stay on the line with two end points " + this.surfaceP1.__toString + " & " + this.surfaceP2.__toString + "." }

    Sketchpad.simulation.HitSurfaceBehavior.dummy = function(x, y) {
	return new Sketchpad.simulation.HitSurfaceBehavior(FreeBody.dummy(x, y), Point.dummy(x, y), Point.dummy(x, y))
    }

    Sketchpad.simulation.HitSurfaceBehavior.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation.ConveyorBeltBehavior = function Sketchpad__simulation__ConveyorBeltBehavior(body, belt) {
	this.body = body
	this.halfLength = body.radius
	this.position = body.position
	this.velocity = body.velocity
	this.belt = belt
    }

    sketchpad.addClass(Sketchpad.simulation.ConveyorBeltBehavior, true)

    Sketchpad.simulation.ConveyorBeltBehavior.prototype.propertyTypes = {body: 'FreeBody', belt: 'Belt'}

    Sketchpad.simulation.ConveyorBeltBehavior.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	//var belt = this.belt
	//var beltP1 = belt.position1
	//var beltP2 = belt.position2
	//return (Sketchpad.simulation.detectContact(this.halfLength, this.position, this.velocity, beltP1, beltP2)) ? 1 : 0	
	return this.contact ? magnitude(minus(this.targetVelocity, this.velocity)) : 0
    }

    Sketchpad.simulation.ConveyorBeltBehavior.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: this.targetVelocity}
    }

    Sketchpad.simulation.ConveyorBeltBehavior.description = function() { return  "Sketchpad.simulation.ConveyorBeltBehavior(Number L, FreeBody Body, ConveyorBelt Belt) states that the body with diameter L and position Pos and velocity vector Vel is going to land and move based on the conveyor belt Belt's velocity." }

    Sketchpad.simulation.ConveyorBeltBehavior.prototype.description = function() { return  "Body" + this.body.__toString + " with diameter L and position Pos and velocity vector Vel is going to land and move based on the conveyor belt Belt " + this.belt.__toString + "'s velocity." }

    Sketchpad.simulation.ConveyorBeltBehavior.dummy = function(x, y) {
	return new Sketchpad.simulation.ConveyorBeltBehavior(FreeBody.dummy(x, y), Belt.dummy(x, y))
    }

    Sketchpad.simulation.ConveyorBeltBehavior.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation.PairOverlapAvoidance = function Sketchpad__simulation__PairOverlapAvoidance(body1, body2) {
	this.body1 = body1
	this.length1 = body1.radius / 2
	this.position1 = body1.position
	this.velocity1 = body1.velocity
	this.body2 = body2
	this.length2 = body2.radius / 2
	this.position2 = body2.position
	this.velocity2 = body2.velocity
    }

    sketchpad.addClass(Sketchpad.simulation.PairOverlapAvoidance, true)
    
    Sketchpad.simulation.PairOverlapAvoidance.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody'}

    Sketchpad.simulation.PairOverlapAvoidance.prototype.computeError = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation.PairOverlapAvoidance.prototype.solve = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation.PairOverlapAvoidance.description = function() { return  "Sketchpad.simulation.PairOverlapAvoidance(FreeBody Body1, FreeBody Body1) states that the Body1 with diameter L1 and position Pos1 and velocity vector Vel1 and the Body2 with diameter L2 and position Pos2 and velocity vector Vel2 will push each other if touching." }

    Sketchpad.simulation.PairOverlapAvoidance.prototype.description = function() { return  "Body " + this.body1.__toString + " with diameter L1 and position Pos1 and velocity vector Vel1 and the Body " + this.body2.__toString + " with diameter L2 and position Pos2 and velocity vector Vel2 will push each other if touching." }

    Sketchpad.simulation.PairOverlapAvoidance.dummy = function(x, y) {
	return new Sketchpad.simulation.PairOverlapAvoidance(FreeBody.dummy(x, y), FreeBody.dummy(x +100, y + 100))
    }

    //  Spring Constraint

    Sketchpad.simulation.Springiness = function Sketchpad__simulation__Springiness(body1, body2, spring) {
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

    sketchpad.addClass(Sketchpad.simulation.Springiness, true)

    Sketchpad.simulation.Springiness.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody', spring: 'Spring'}

    Sketchpad.simulation.Springiness.prototype.computeError = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation.Springiness.prototype.solve = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation.Springiness.description = function() { return  "Sketchpad.simulation.Springiness(FreeBody Body1, FreeBody Body2, Spring S) states that spring S has been attached to two bodies Body1 and Body2." }

    Sketchpad.simulation.Springiness.prototype.description = function() { return  "spring " + this.spring.__toString + " has been attached to two bodies " + this.body1.__toString + " and " + this.body2.__toString + "." }

    Sketchpad.simulation.Springiness.dummy = function(x, y) {
	return new Sketchpad.simulation.Springiness(FreeBody.dummy(x, y), FreeBody.dummy(x+100, y+100), Sketchpad.simulation.Spring.dummy(x, y))
    }

    //  OrbitalMotion Constraint

    Sketchpad.simulation.OrbitalMotion = function Sketchpad__simulation__OrbitalMotion(sun, moon, distanceDownscale) {
	this.sun = sun
	this.moon = moon
	this.acceleration = moon.acceleration
	this.distanceDownscale = (distanceDownscale || (1e9 / 2))
    }

    sketchpad.addClass(Sketchpad.simulation.OrbitalMotion, true)

    Sketchpad.simulation.OrbitalMotion.prototype.propertyTypes = {sun: 'FreeBody', moon: 'FreeBody'}

    Sketchpad.simulation.OrbitalMotion.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	this._targetAcceleration = this.currentGravityAcceleration()
	return magnitude(minus(this._targetAcceleration, this.acceleration))	
    }

    Sketchpad.simulation.OrbitalMotion.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {acceleration: this._targetAcceleration}
    }

    Sketchpad.simulation.OrbitalMotion.description = function() { return  "Sketchpad.simulation.OrbitalMotion(FreeBody Sun, FreeBody Moon) states that Moon body is orbiting around Sun body according to simple orbital motion formula." }

    Sketchpad.simulation.OrbitalMotion.prototype.description = function() { return  "Moon body " + this.moon.__toString + " is orbiting around Sun body " + this.sun.__toString + " according to simple orbital motion formula." }

    Sketchpad.simulation.OrbitalMotion.dummy = function(x, y) {
	return new Sketchpad.simulation.OrbitalMotion(FreeBody.dummy(x, y), FreeBody.dummy(x + 200, y))
    }
    
    Sketchpad.simulation.OrbitalMotion.prototype.currentGravityAcceleration = function() {
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

    Sketchpad.geom3d.FixedCoordinate = function Sketchpad__geom3__FixedCoordinate(p, x, y, z) {
	this.p = p
	this.c = new Point3D(x, y, z)
    }

    sketchpad.addClass(Sketchpad.geom3d.FixedCoordinate, true)

    Sketchpad.geom3d.FixedCoordinate.prototype.propertyTypes = {p: 'Point3D', c: 'Point3D'}

    Sketchpad.geom3d.FixedCoordinate.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.c, this.p))
    }

    Sketchpad.geom3d.FixedCoordinate.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p: {x: this.c.x, y: this.c.y, z: this.c.z}}
    }

    Sketchpad.geom3d.FixedCoordinate.description = function() { return  "Sketchpad.geom3d.FixedCoordinate(Point P, Number X, Number Y, Number Z) states that point P should stay at coordinate (X, Y, Z)." }

    Sketchpad.geom3d.FixedCoordinate.prototype.description = function() { return  "point " + this.p.__toString + " should stay at coordinate (" + this.c.x + ", " + this.c.y + ", " + this.c.z + ")." }

    Sketchpad.geom3d.FixedCoordinate.prototype.effects = function() {
	return [{obj: this.p, props: ['x', 'y', 'z']}]
    }

    // Length constraint - maintains distance between P1 and P2 at L.

    Sketchpad.geom3d.FixedLength = function Sketchpad__geom3d__FixedLength(p1, p2, l) {
	this.p1 = p1
	this.p2 = p2
	this.l = l
    }

    sketchpad.addClass(Sketchpad.geom3d.FixedLength, true)

    Sketchpad.geom3d.FixedLength.prototype.propertyTypes = {p1: 'Point3D', p2: 'Point3D', l: 'Number'}
    
    Sketchpad.geom3d.FixedLength.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	return l12 - this.l
    }

    Sketchpad.geom3d.FixedLength.prototype.solve = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.geom3d.FixedLength.description = function() { return  "Sketchpad.geom3d.FixedLength(Point3D P1, Point3D P2, Number L) says points P1 and P2 always maintain a distance of L." }

    Sketchpad.geom3d.FixedLength.prototype.description = function() { return  "points " + this.p1.__toString + " and " + this.p2.__toString + " always maintain a distance of " + this.l + "." }

    Sketchpad.geom3d.FixedLength.prototype.effects = function() {
	return [{obj: this.p1, props: ['x', 'y', 'z']}, {obj: this.p2, props: ['x', 'y', 'z']}]
    }


    // Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
    // w is in units of Hz - whole rotations per second.

    Sketchpad.geom3d.MotorMotion = function Sketchpad__geom__MotorConstraint(p1, p2, w) {
	this.p1 = p1
	this.p2 = p2
	this.w = w
    }

    sketchpad.addClass(Sketchpad.geom3d.MotorMotion, true)

    Sketchpad.geom3d.MotorMotion.prototype.propertyTypes = {p1: 'Point', p2: 'Point', w: 'Number'}
    
    Sketchpad.geom3d.MotorMotion.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return 1
    }

    Sketchpad.geom3d.MotorMotion.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var t = (pseudoTime - prevPseudoTime) / 1000.0
	var dTheta = t * this.w * (2 * Math.PI)
	var m12 = midpoint(this.p1, this.p2)
	return {p1: rotatedAround(this.p1, dTheta, m12),
		p2: rotatedAround(this.p2, dTheta, m12)}
    }

    Sketchpad.geom3d.MotorMotion.description = function() { return  "Sketchpad.geom3d.MotorMotion(Point P1, Point P2, Number W) causes P1 and P2 to orbit their midpoint at the given rate of w, in units of Hz: whole rotations per second." } 

    Sketchpad.geom3d.MotorMotion.prototype.description = function() { return  "" + this.p1.__toString + " and " + this.p2.__toString + " to orbit their midpoint at the given rate of " + this.w + ", in units of Hz: whole rotations per second." }
            
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
	
    Sketchpad.simulation3d.VelocityRelation = function Sketchpad__simulation3d__VelocityRelation(body) {
	this.body = body
	this.position = body.position
	this.velocity = body.velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityRelation, true)

    Sketchpad.simulation3d.VelocityRelation.prototype.propertyTypes = {body: 'FreeBody'}

    Sketchpad.simulation3d.VelocityRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity, dt)), this.position))
    }

    Sketchpad.simulation3d.VelocityRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity, dt))}
    }

    Sketchpad.simulation3d.VelocityRelation.description = function() { return  "Sketchpad.simulation3d.VelocityRelation(FreeBody Body) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityRelation.prototype.description = function() { return  "for Body " + this.body.__toString + " Pos = old(Pos) + (" + this.velocity.x + "," +  this.velocity.y + "," +  this.velocity.z + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation3d.VelocityRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	this.lastPosition = scaledBy(this.position, 1)
    }
    
    // Body With Velocity Constraint

    Sketchpad.simulation3d.VelocityAsLineSegmentRelation = function Sketchpad__simulation3d__VelocityAsLineSegmentRelation(body, velocity) {
	this.body = body
	this.position = body.position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityAsLineSegmentRelation, true)

    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.propertyTypes = {body: 'FreeBody', velocity: 'Point'}
    
    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt)), this.position))
    }
    
    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt))}
    }

    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.description = function() { return  "Sketchpad.simulation3d.VelocityAsLineSegmentRelation(FreeBody Body, PointVector3D Velocity) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.description = function() { return  "for Body " + this.body.__toString + ": Pos = old(Pos) + (" + this.velocity.x + "," +  this.velocity.y + "," +  this.velocity.z + ") * dt, where dt is the frame step time amount ." }
    
    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastPosition = scaledBy(this.position, 1)
    }

    // Acceleration Constraint

    Sketchpad.simulation3d.AccelerationRelation = function Sketchpad__simulation3d__AccelerationRelation(body, acceleration) {
	this.body = body
	this.velocity = body.velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation3d.AccelerationRelation, true)

    Sketchpad.simulation3d.AccelerationRelation.prototype.propertyTypes = {body: 'FreeBody', velocity: 'Vector3D'}

    Sketchpad.simulation3d.AccelerationRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastVelocity, scaledBy(this.acceleration, dt)), this.velocity))
    }

    Sketchpad.simulation3d.AccelerationRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {velocity: plus(this.lastVelocity, scaledBy(this.acceleration, dt))}
    }

    Sketchpad.simulation3d.AccelerationRelation.description = function() { return  "Sketchpad.simulation3d.AccelerationRelation(FreeBody Body, Vector Acceleration) states for Body: Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.AccelerationRelation.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) + (" + this.acceleration.x + "," +  this.acceleration.y + "," +  this.acceleration.z + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation3d.AccelerationRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    // Air Resistance Constraint

    Sketchpad.simulation3d.FrictionRelation = function Sketchpad__simulation3d__FrictionRelation(body, scale) {
	this.body = body
	this.velocity = body.velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation3d.FrictionRelation, true)

    Sketchpad.simulation3d.FrictionRelation.prototype.propertyTypes = {scale: 'Number', body: 'FreeBody'}

    Sketchpad.simulation3d.FrictionRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(scaledBy(this.lastVelocity, this.scale), this.velocity))
    }

    Sketchpad.simulation3d.FrictionRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: scaledBy(this.lastVelocity, this.scale)}
    }

    Sketchpad.simulation3d.FrictionRelation.description = function() { return  "Sketchpad.simulation3d.FrictionRelation(FreeBody Body, Number Scale) states for Body: Velocity = old(Velocity) * Scale ." }

    Sketchpad.simulation3d.FrictionRelation.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) * " + this.scale +" ." }

    Sketchpad.simulation3d.FrictionRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }


    //  Spring Constraint

    Sketchpad.simulation3d.Springiness = function Sketchpad__simulation3d__Springiness(body1, body2, spring) {
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

    sketchpad.addClass(Sketchpad.simulation3d.Springiness, true)

    Sketchpad.simulation3d.Springiness.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody', spring: 'Spring'}

    Sketchpad.simulation3d.Springiness.prototype.computeError = function(pseudoTime, prevPseudoTime) {
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

    Sketchpad.simulation3d.Springiness.prototype.solve = function(pseudoTime, prevPseudoTime) {
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
    
    Sketchpad.simulation3d.Springiness.description = function() { return  "Sketchpad.simulation3d.Springiness(FreeBody Body1, FreeBody Body2, Spring S) states that spring S has been attached to two bodies Body1 and Body2." }

    Sketchpad.simulation3d.Springiness.prototype.description = function() { return  "spring " + this.spring.__toString + " has been attached to two bodies " + this.body1.__toString + " and " + this.body2.__toString + "." }


    //  OrbitalMotion Constraint

    Sketchpad.simulation3d.OrbitalMotion = function Sketchpad__simulation3d__OrbitalMotion(sun, moon, distanceDownscale) {
	this.sun = sun
	this.moon = moon
	this.acceleration = moon.acceleration
	this.distanceDownscale = (distanceDownscale || (1e9 / 2))
    }

    sketchpad.addClass(Sketchpad.simulation3d.OrbitalMotion, true)

    Sketchpad.simulation3d.OrbitalMotion.prototype.propertyTypes = {sun: 'FreeBody', moon: 'FreeBody'}

    Sketchpad.simulation3d.OrbitalMotion.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	this._targetAcceleration = this.currentGravityAcceleration()
	return magnitude(minus(this._targetAcceleration, this.acceleration))	
    }

    Sketchpad.simulation3d.OrbitalMotion.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {acceleration: this._targetAcceleration}
    }

    Sketchpad.simulation3d.OrbitalMotion.description = function() { return  "Sketchpad.simulation3d.OrbitalMotion(FreeBody Sun, FreeBody Moon) states that Moon body is orbiting around Sun body according to simple orbital motion formula." }

    Sketchpad.simulation3d.OrbitalMotion.prototype.description = function() { return  "Moon body " + this.moon.__toString + " is orbiting around Sun body " + this.sun.__toString + " according to simple orbital motion formula." }

    Sketchpad.simulation3d.OrbitalMotion.prototype.currentGravityAcceleration = function() {
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
    var handler = function(e) { 	this.converged = false; this.events.push([id, e]) }.bind(this)
    if (!this.eventHandlersInternal[name]) {
	this.eventHandlersInternal[name] = []
	this.eventDescriptions[name] = []
    }
    this.eventHandlersInternal[name].push(handler)
    this.eventDescriptions[name].push(optDescription)
    document.body.addEventListener(name, handler)
}

Sketchpad.prototype.handleEvents = function() {
    //if (this.events.length > 0)
    //	this.converged = false
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8yZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvMmQvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy8zZC9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaGVzYW0vcHJvamVjdHMvcmVzZWFyY2gvY2RnLWMvc2tldGNocGFkMTQvdG9vbC9zcmMvM2Qvc2ltdWxhdGlvbi1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9oZXNhbS9wcm9qZWN0cy9yZXNlYXJjaC9jZGctYy9za2V0Y2hwYWQxNC90b29sL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0aUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ253QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGFyaXRobWV0aWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLmFyaXRoID0ge31cblxuICAgIC8vIEhlbHBlcnNcblxuICAgIGZ1bmN0aW9uIGluc3RhbGxSZWYodGFyZ2V0LCByZWYsIHByZWZpeCkge1xuXHR0YXJnZXRbcHJlZml4ICsgJ19vYmonXSA9IHJlZi5vYmpcblx0dGFyZ2V0W3ByZWZpeCArICdfcHJvcCddID0gcmVmLnByb3BcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWYodGFyZ2V0LCBwcmVmaXgpIHtcblx0cmV0dXJuIHRhcmdldFtwcmVmaXggKyAnX29iaiddW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmblJlZih0YXJnZXQsIHByZWZpeCkge1xuXHR2YXIgcmN2ciA9IHRhcmdldFtwcmVmaXggKyAnX29iaiddXG5cdHJldHVybiByY3ZyW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV0uY2FsbChyY3ZyKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhdGNoKHRhcmdldCAvKiAsIHByZWZpeCwgbmV3VmFsLCAuLi4gKi8pIHtcblx0dmFyIHJlc3VsdCA9IHt9XG5cdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG5cdCAgICB2YXIgcHJlZml4ID0gYXJndW1lbnRzW2ldXG5cdCAgICB2YXIgbmV3VmFsID0gYXJndW1lbnRzW2krMV1cblx0ICAgIHZhciBkID0gcmVzdWx0W3ByZWZpeCArICdfb2JqJ11cblx0ICAgIGlmICghZCkge1xuXHRcdHJlc3VsdFtwcmVmaXggKyAnX29iaiddID0gZCA9IHt9XG5cdCAgICB9XG5cdCAgICBkW3RhcmdldFtwcmVmaXggKyAnX3Byb3AnXV0gPSBuZXdWYWxcblx0fVxuXHRyZXR1cm4gcmVzdWx0XG4gICAgfVxuXG4gICAgLy8gVmFsdWUgQ29uc3RyYWludCwgaS5lLiwgby5wID0gdmFsdWVcblxuICAgIFNrZXRjaHBhZC5hcml0aC5GaXhlZFByb3BlcnR5ID0gZnVuY3Rpb24gU2tldGNocGFkX19hcml0aF9fRml4ZWRQcm9wZXJ0eShyZWYsIHZhbHVlKSB7XG5cdGluc3RhbGxSZWYodGhpcywgcmVmLCAndicpXG5cdHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuYXJpdGguRml4ZWRQcm9wZXJ0eSwgdHJ1ZSlcbiAgICBcbiAgICBTa2V0Y2hwYWQuYXJpdGguRml4ZWRQcm9wZXJ0eS5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHRoaXMudmFsdWUgLSByZWYodGhpcywgJ3YnKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5GaXhlZFByb3BlcnR5LnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBwYXRjaCh0aGlzLCAndicsIHRoaXMudmFsdWUpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkZpeGVkUHJvcGVydHkuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5GaXhlZFByb3BlcnR5KHtvYmo6IE8sIHByb3A6IHB9LCBWYWx1ZSkgc3RhdGVzIHRoYXQgTy5wID0gVmFsdWUuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkZpeGVkUHJvcGVydHkucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnZfb2JqLl9fdG9TdHJpbmcgKyBcIi5cIiArIHRoaXMudl9wcm9wICsgXCIgPSBcIiArIHRoaXMudmFsdWUgKyBcIi5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRml4ZWRQcm9wZXJ0eS5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguRml4ZWRQcm9wZXJ0eSh7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwgNDIpIFxuICAgIH1cblxuICAgIC8vIEVxdWFsaXR5IENvbnN0cmFpbnQsIGkuZS4sIGsxICogbzEucDEgPSBrMiAqIG8yLnAyXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxQcm9wZXJ0aWVzID0gZnVuY3Rpb24gU2tldGNocGFkX19hcml0aF9fRXF1YWxQcm9wZXJ0aWVzKHJlZjEsIHJlZjIsIG9wdE9ubHlXcml0ZVRvLCBrMSwgazIpIHtcblx0dGhpcy5rMSA9IGsxIHx8IDEsIHRoaXMuazIgPSBrMiB8fCAxXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMSwgJ3YxJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYyLCAndjInKVxuXHR0aGlzLm9ubHlXcml0ZVRvID0gb3B0T25seVdyaXRlVG8gfHwgWzEsIDJdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5hcml0aC5FcXVhbFByb3BlcnRpZXMsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxQcm9wZXJ0aWVzLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZGlmZiA9ICh0aGlzLmsxICogcmVmKHRoaXMsICd2MScpKSAtICh0aGlzLmsyICogcmVmKHRoaXMsICd2MicpKVxuXHRyZXR1cm4gZGlmZlxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbFByb3BlcnRpZXMucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxID0gdGhpcy5rMSAqIHJlZih0aGlzLCAndjEnKSwgdjIgPSB0aGlzLmsyICogcmVmKHRoaXMsICd2MicpXG5cdGtzID0gW3RoaXMuazEsIHRoaXMuazJdXG5cdHZhciB2cyA9IFt2MSwgdjJdXG5cdHZhciBvbmx5V3JpdGVUbyA9IHRoaXMub25seVdyaXRlVG9cblx0dmFyIGRpZmYgPSB2MSAtIHYyXG5cdHZhciBkaXYgPSBvbmx5V3JpdGVUby5sZW5ndGhcblx0dmFyIGFyZ3MgPSBbdGhpc11cblx0b25seVdyaXRlVG8uZm9yRWFjaChmdW5jdGlvbihpKSB7IHZhciBzaWduID0gaSA+IDEgPyAxIDogLTE7IGFyZ3MucHVzaCgndicgKyBpKTsgYXJncy5wdXNoKCh2c1tpIC0gMV0gKyBzaWduICogZGlmZiAvIGRpdikgLyBrc1tpIC0gMV0pIH0pXG5cdHJlcyA9IHBhdGNoLmFwcGx5KHRoaXMsIGFyZ3MpXG5cdHJldHVybiByZXMgLy9wYXRjaCh0aGlzLCAndjEnLCB2MSAtIChkaWZmIC8gMiksICd2MicsIHYyICsgZGlmZiAvIDIpXG4gICAgfVxuXG4gICAgXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsUHJvcGVydGllcy5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmFyaXRoLkVxdWFsUHJvcGVydGllcyh7b2JqOiBPMSwgcHJvcDogcDF9LCB7b2JqOiBPMiwgcHJvcDogcDJ9LCBXcml0YWJsZUlkeHMsIE51bWJlciBLMSwgTnVtYmVyIEsyKSBzdGF0ZXMgdGhhdCBLMSAqIE8xLnAxID0gSzIgKiBPMi5wMiAuIENvbnN0YW50cyBLMS0yIGRlZmF1bHQgdG8gMS4gT3B0aW9uYWwgV3JpdGFibGVJZHhzIGdpdmVzIGEgbGlzdCBvZiBpbmRpY2VzIChlbGVtZW50cyAxLGFuZC9vciAyKSB0aGUgY29uc3RyYWludCBpcyBhbGxvd2VkIHRvIGNoYW5nZSxcIiB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguRXF1YWxQcm9wZXJ0aWVzLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIHRoaXMuazEgKyBcIiAqIFwiICsgdGhpcy52MV9vYmouX190b1N0cmluZyArIFwiLlwiICsgdGhpcy52MV9wcm9wICsgXCIgPSBcIiArIHRoaXMuazIgKyBcIiAqIFwiICsgdGhpcy52Ml9vYmouX190b1N0cmluZyArIFwiLlwiICsgdGhpcy52Ml9wcm9wICsgXCIgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5FcXVhbFByb3BlcnRpZXMucHJvdG90eXBlLmVmZmVjdHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFt7b2JqOiB0aGlzLnYxX29iaiwgcHJvcHM6IFt0aGlzLnYxX3Byb3BdfSwge29iajogdGhpcy52Ml9vYmosIHByb3BzOiBbdGhpcy52Ml9wcm9wXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkVxdWFsUHJvcGVydGllcy5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguRXF1YWxQcm9wZXJ0aWVzKHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSkgXG4gICAgfVxuXG4gICAgLy8gT25XYXlFcXVhbGl0eSBDb25zdHJhaW50LCBpLmUuLCBvMS5wMSA9IG8yLnAyXG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxQcm9wZXJ0aWVzID0gZnVuY3Rpb24gU2tldGNocGFkX19hcml0aF9fT25lV2F5RXF1YWxQcm9wZXJ0aWVzKHJlZjEsIHJlZjIsIG9wdFNlY29uZFByb3BJc0ZuKSB7XG5cdGluc3RhbGxSZWYodGhpcywgcmVmMSwgJ3YxJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYyLCAndjInKVxuXHR0aGlzLnNlY29uZFByb3BJc0ZuID0gb3B0U2Vjb25kUHJvcElzRm5cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLk9uZVdheUVxdWFsUHJvcGVydGllcywgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbFByb3BlcnRpZXMucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MiA9IHRoaXMuc2Vjb25kUHJvcElzRm4gPyBmblJlZih0aGlzLCAndjInKSA6IHJlZih0aGlzLCAndjInKVxuXHR2YXIgZSA9IHJlZih0aGlzLCAndjEnKSA9PSB2MiA/IDAgOiAxXG5cdHJldHVybiBlXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLk9uZVdheUVxdWFsUHJvcGVydGllcy5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjIgPSB0aGlzLnNlY29uZFByb3BJc0ZuID8gZm5SZWYodGhpcywgJ3YyJykgOiByZWYodGhpcywgJ3YyJylcblx0cmV0dXJuIHBhdGNoKHRoaXMsICd2MScsIHYyKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxQcm9wZXJ0aWVzLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxQcm9wZXJ0aWVzKHtvYmo6IE8xLCBwcm9wOiBwMX0sIHtvYmo6IE8yLCBwcm9wOiBwMn0sIEJvb2xlYW4gc2Vjb25kUHJvcElzRm4pIHN0YXRlcyB0aGF0IE8xLnAxID0gTzIucDIgKHJpZ2h0IGhhbmQtc2lkZSBpcyAgcmVhZC1vbmx5KS4gSWYgc2Vjb25kUHJvcElzRm4gPSB0cnVlIHRoZW4gTzIucDIoKSBpcyBpbnZva2VkIGluc3RlYWQuXCIgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5hcml0aC5PbmVXYXlFcXVhbFByb3BlcnRpZXMucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7ICB2YXIgcjEgPSByZWYodGhpcywgJ3YxJyksIHIyID0gcmVmKHRoaXMsICd2MicpOyByZXR1cm4gIHRoaXMudjFfb2JqLl9fdG9TdHJpbmcgKyBcIi5cIiArIHRoaXMudjFfcHJvcCArIFwiID0gXCIgKyB0aGlzLnYyX29iai5fX3RvU3RyaW5nICsgXCIuXCIgKyB0aGlzLnYyX3Byb3AgKyBcIiBhbmQgcmlnaHQgaGFuZC1zaWRlIGlzIHJlYWQtb25seS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxQcm9wZXJ0aWVzLnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy52MV9vYmosIHByb3BzOiBbdGhpcy52MV9wcm9wXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLk9uZVdheUVxdWFsUHJvcGVydGllcy5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguT25lV2F5RXF1YWxQcm9wZXJ0aWVzKHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSkgXG4gICAgfVxuXG4gICAgLy8gSW5lcXVhbGl0eSBDb25zdHJhaW50LCBpLmUuLCBrMSAqIG8xLnAxID49IGsyICogbzIucDIgKyBrMyBvciBrMSAqIG8xLnAxIDw9IGsyICogbzIucDIgKyBrM1xuXG4gICAgU2tldGNocGFkLmFyaXRoLkluZXF1YWxpdHlSZWxhdGlvbiA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fYXJpdGhfX0luZXF1YWxpdHlSZWxhdGlvbihyZWYxLCByZWYyLCBpc0dlcSwgazEsIGsyLCBrMykge1xuXHR0aGlzLmsxID0gazEgfHwgMSwgdGhpcy5rMiA9IGsyIHx8IDEsIHRoaXMuazMgPSBrMyB8fCAwXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMSwgJ3YxJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYyLCAndjInKVxuXHR0aGlzLmlzR2VxID0gaXNHZXFcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmFyaXRoLkluZXF1YWxpdHlSZWxhdGlvbiwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5JbmVxdWFsaXR5UmVsYXRpb24ucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MSA9IHRoaXMuazEgKiByZWYodGhpcywgJ3YxJykgLCB2MiA9ICh0aGlzLmsyICogcmVmKHRoaXMsICd2MicpKSArIHRoaXMuazMsIGNvbmQgPSB0aGlzLmlzR2VxID8gdjEgPj0gdjIgOiB2MSA8PSB2MiwgZSA9IGNvbmQgPyAwIDogdjIgLSB2MVxuXHRyZXR1cm4gZVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5JbmVxdWFsaXR5UmVsYXRpb24ucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYyID0gKHRoaXMuazIgKiByZWYodGhpcywgJ3YyJykpICsgdGhpcy5rM1xuXHRyZXMgPSBwYXRjaCh0aGlzLCAndjEnLCB2MiAvIHRoaXMuazEpXG5cdHJldHVybiByZXNcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eVJlbGF0aW9uLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eVJlbGF0aW9uKHtvYmo6IE8xLCBwcm9wOiBwMX0sIHtvYmo6IE8yLCBwcm9wOiBwMn0sIGlzR2VxLCBOdW1iZXIgSzEsIE51bWJlciBLMiwgTnVtYmVyIEszKSBzdGF0ZXMgdGhhdCBLMSAqIE8xLnAxID49IEsyICogTzIucDIgKyBLMyAod2hlbiBpc0dlcT10cnVlKSBvciBLMSAqIE8xLnAxIDw9IEsyICogTzIucDIgKyBLMyAod2hlbiBpc0dlcT1mYWxzZSkuIENvbnN0YW50cyBLMS0yIGRlZmF1bHQgdG8gMSBhbmQgSzMgdG8gMFwiIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5JbmVxdWFsaXR5UmVsYXRpb24ucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHZhciByMSA9IHJlZih0aGlzLCAndjEnKSwgcjIgPSByZWYodGhpcywgJ3YyJyk7IHJldHVybiB0aGlzLmsxICsgXCIgKiBcIiArIHRoaXMudjFfb2JqLl9fdG9TdHJpbmcgKyBcIi5cIiArIHRoaXMudjFfcHJvcCArIFwiIFwiICsgKHRoaXMuaXNHZXEgPyBcIj5cIiA6IFwiPFwiKSArIFwiPSBcIiArIHRoaXMuazIgKyBcIiAqIFwiICsgdGhpcy52Ml9vYmouX190b1N0cmluZyArIFwiLlwiICsgdGhpcy52Ml9wcm9wICsgXCIgKyBcIiArIHRoaXMuazMgKyBcIiAuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLkluZXF1YWxpdHlSZWxhdGlvbi5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMudjFfb2JqLCBwcm9wczogW3RoaXMudjFfcHJvcF19LCB7b2JqOiB0aGlzLnYyX29iaiwgcHJvcHM6IFt0aGlzLnYyX3Byb3BdfV1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguSW5lcXVhbGl0eVJlbGF0aW9uLmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5hcml0aC5JbmVxdWFsaXR5UmVsYXRpb24oe29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB0cnVlKSBcbiAgICB9XG5cbiAgICAvLyBTdW0gQ29uc3RyYWludCwgaS5lLiwgazEgKiBvMS5wMSArIGsyICogbzIucDIgPSBrMyAqIG8zLnAzICsgazRcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1SZWxhdGlvbiA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fYXJpdGhfX1N1bVJlbGF0aW9uKHJlZjEsIHJlZjIsIHJlZjMsIG9wdE9ubHlXcml0ZVRvLCBrMSwgazIsIGszLCBrNCkge1xuXHR0aGlzLmsxID0gazEgfHwgMSwgdGhpcy5rMiA9IGsyIHx8IDEsIHRoaXMuazMgPSBrMyB8fCAxLCB0aGlzLms0ID0gazQgfHwgMFxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjEsICd2MScpXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMiwgJ3YyJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYzLCAndjMnKVxuXHR0aGlzLm9ubHlXcml0ZVRvID0gb3B0T25seVdyaXRlVG8gfHwgWzEsIDIsIDNdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5hcml0aC5TdW1SZWxhdGlvbiwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1SZWxhdGlvbi5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGRpZmYgPSB0aGlzLmszICogcmVmKHRoaXMsICd2MycpICsgdGhpcy5rNCAtICgodGhpcy5rMSAqIHJlZih0aGlzLCAndjEnKSkgKyAodGhpcy5rMiAqIHJlZih0aGlzLCAndjInKSkpXG5cdHJldHVybiBkaWZmXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bVJlbGF0aW9uLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB2MSA9IHRoaXMuazEgKiByZWYodGhpcywgJ3YxJylcblx0dmFyIHYyID0gdGhpcy5rMiAqIHJlZih0aGlzLCAndjInKVxuXHR2YXIgdjMgPSB0aGlzLmszICogcmVmKHRoaXMsICd2MycpXG5cdHZhciB2cyA9IFt2MSwgdjIsIHYzXSwga3MgPSBbdGhpcy5rMSwgdGhpcy5rMiwgdGhpcy5rM11cblx0dmFyIGRpZmYgPSB2MyArIHRoaXMuazQgLSAodjEgKyB2Milcblx0dmFyIG9ubHlXcml0ZVRvID0gdGhpcy5vbmx5V3JpdGVUb1xuXHR2YXIgZGl2ID0gb25seVdyaXRlVG8ubGVuZ3RoXG5cdHZhciBhcmdzID0gW3RoaXNdXG5cdG9ubHlXcml0ZVRvLmZvckVhY2goZnVuY3Rpb24oaSkgeyB2YXIgc2lnbiA9IGkgPiAyID8gLTEgOiAxOyBhcmdzLnB1c2goJ3YnICsgaSk7IGFyZ3MucHVzaCgodnNbaSAtIDFdICsgc2lnbiAqIGRpZmYgLyBkaXYpIC8ga3NbaSAtIDFdKSB9KVxuXHRyZXMgPSBwYXRjaC5hcHBseSh0aGlzLCBhcmdzKVxuXHRyZXR1cm4gcmVzXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bVJlbGF0aW9uLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuYXJpdGguU3VtUmVsYXRpb24oe29iajogTzEsIHByb3A6IHAxfSwge29iajogTzIsIHByb3A6IHAyfSwge29iajogTzMsIHByb3A6IHAzfSwgV3JpdGFibGVJZHhzLCBOdW1iZXIgSzEsIE51bWJlciBLMiwgTnVtYmVyIEszLCBOdW1iZXIgSzQpIHN0YXRlcyB0aGF0IEsxICogTzEucDEgKyBLMiAqIE8yLnAyID0gSzMgKiBPMy5wMyArIEs0IC4gQ29uc3RhbnRzIEsxLTMgZGVmYXVsdCB0byAxIGFuZCBLNCB0byAwLiBPcHRpb25hbCBXcml0YWJsZUlkeHMgZ2l2ZXMgYSBsaXN0IG9mIGluZGljZXMgKDEsIDIsIG9yLCAzKSB0aGUgY29uc3RyYWludCBpcyBhbGxvd2VkIHRvIGNoYW5nZS5cIiB9IFxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bVJlbGF0aW9uLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyB2YXIgcjEgPSByZWYodGhpcywgJ3YxJyksIHIyID0gcmVmKHRoaXMsICd2MicpLCByMyA9IHJlZih0aGlzLCAndjMnKTsgcmV0dXJuIHRoaXMuazEgKyBcIiAqIFwiICsgdGhpcy52MV9vYmouX190b1N0cmluZyArIFwiLlwiICsgdGhpcy52MV9wcm9wICsgXCIgKyBcIiArIHRoaXMuazIgKyBcIiAqIFwiICsgdGhpcy52Ml9vYmouX190b1N0cmluZyAgKyBcIi5cIiArIHRoaXMudjJfcHJvcCArIFwiID0gXCIgKyB0aGlzLmszICsgXCIgKiBcIiArIHRoaXMudjNfb2JqLl9fdG9TdHJpbmcgKyBcIi5cIiArIHRoaXMudjNfcHJvcCArIFwiICsgXCIgKyB0aGlzLms0ICsgXCIgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1SZWxhdGlvbi5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMudjFfb2JqLCBwcm9wczogW3RoaXMudjFfcHJvcF19LCB7b2JqOiB0aGlzLnYyX29iaiwgcHJvcHM6IFt0aGlzLnYyX3Byb3BdfSwge29iajogdGhpcy52M19vYmosIHByb3BzOiBbdGhpcy52M19wcm9wXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bVJlbGF0aW9uLmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5hcml0aC5TdW1SZWxhdGlvbih7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwge29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9KSBcbiAgICB9XG5cbiAgICAvLyBTdW1JbmVxdWFsaXR5IENvbnN0cmFpbnQsIGkuZS4sIGsxICogbzEucDEgPj0gazIgKiBvMi5wMiArIGszICogbzMucDMgKyBrNCBvciBrMSAqIG8xLnAxID49IGsyICogbzIucDIgKyBrMyAqIG8zLnAzICsgazRcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5UmVsYXRpb24gPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2FyaXRoX19TdW1JbmVxdWFsaXR5UmVsYXRpb24ocmVmMSwgcmVmMiwgcmVmMywgaXNHZXEsIGsxLCBrMiwgazMsIGs0KSB7XG5cdHRoaXMuazEgPSBrMSB8fCAxLCB0aGlzLmsyID0gazIgfHwgMSwgdGhpcy5rMyA9IGszIHx8IDEsIHRoaXMuazQgPSBrNCB8fCAwXG5cdGluc3RhbGxSZWYodGhpcywgcmVmMSwgJ3YxJylcblx0aW5zdGFsbFJlZih0aGlzLCByZWYyLCAndjInKVxuXHRpbnN0YWxsUmVmKHRoaXMsIHJlZjMsICd2MycpXG5cdHRoaXMuaXNHZXEgPSBpc0dlcVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eVJlbGF0aW9uLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUluZXF1YWxpdHlSZWxhdGlvbi5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxID0gdGhpcy5rMSAqIHJlZih0aGlzLCAndjEnKSwgdjIgPSB0aGlzLmsyICogcmVmKHRoaXMsICd2MicpLCB2MyA9IHRoaXMuazMgKiByZWYodGhpcywgJ3YzJyksIHN1bSA9IHYyICsgdjMgKyB0aGlzLms0LCBjb25kID0gdGhpcy5pc0dlcSA/IHYxID49IHN1bSA6IHYxIDw9IHN1bSwgZSA9IGNvbmQgPyAwIDogc3VtIC0gdjFcblx0cmV0dXJuIGVcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eVJlbGF0aW9uLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHYyID0gdGhpcy5rMiAqIHJlZih0aGlzLCAndjInKSwgdjMgPSB0aGlzLmszICogcmVmKHRoaXMsICd2MycpLCBzdW0gPSB2MiArIHYzICsgdGhpcy5rNFxuXHRyZXMgPSBwYXRjaCh0aGlzLCAndjEnLCBzdW0gLyB0aGlzLmsxKVxuXHRyZXR1cm4gcmVzXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUluZXF1YWxpdHlSZWxhdGlvbi5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMudjFfb2JqLCBwcm9wczogW3RoaXMudjFfcHJvcF19XVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5UmVsYXRpb24uZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5UmVsYXRpb24oe29iajogTzEsIHByb3A6IHAxfSwge29iajogTzIsIHByb3A6IHAyfSwge29iajogTzMsIHByb3A6IHAzfSwgaXNHZXEsIE51bWJlciBLMSwgTnVtYmVyIEsyLCBOdW1iZXIgSzMsIE51bWJlciBLNCkgc3RhdGVzIHRoYXQgSzEgKiBPMS5wMSA+PSAgazIgKiBPMi5wMiAgKyBrMyAqIE8zLnAzICsgSzQgIG9yICBLMSAqIE8xLnAxIDw9ICBLMiAqIE8yLnAyICsgSzMgKiBPMy5wMyArIEs0ICg+PSB3aGVuIGlzR2VxPXRydWUpXCIgfSBcblxuICAgIFNrZXRjaHBhZC5hcml0aC5TdW1JbmVxdWFsaXR5UmVsYXRpb24ucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHZhciByMSA9IHJlZih0aGlzLCAndjEnKSwgcjIgPSByZWYodGhpcywgJ3YyJyksIHIzID0gcmVmKHRoaXMsICd2MycpOyByZXR1cm4gIHRoaXMuazEgKyBcIiAqIFwiICsgdGhpcy52MV9vYmouX190b1N0cmluZyArIFwiLlwiICsgdGhpcy52MV9wcm9wICsgXCIgXCIgKyAodGhpcy5pc0dlcSA/IFwiPlwiIDogXCI8XCIpICsgXCI9IFwiICsgdGhpcy5rMiArIFwiICogXCIgKyB0aGlzLnYyX29iai5fX3RvU3RyaW5nICsgXCIgKyBcIiArIHRoaXMuazMgKyBcIiAqIFwiICsgdGhpcy52M19vYmouX190b1N0cmluZyArIFwiLlwiICsgdGhpcy52M19wcm9wICsgXCIgKyBcIiArIHRoaXMuazQgKyBcIiAuXCIgfVxuXG4gICAgU2tldGNocGFkLmFyaXRoLlN1bUluZXF1YWxpdHlSZWxhdGlvbi5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuYXJpdGguU3VtSW5lcXVhbGl0eVJlbGF0aW9uKHtvYmo6IG5ldyBQb2ludCgxLDEpLCBwcm9wOiAneCd9LCB7b2JqOiBuZXcgUG9pbnQoMSwxKSwgcHJvcDogJ3gnfSwge29iajogbmV3IFBvaW50KDEsMSksIHByb3A6ICd4J30sIHRydWUpIFxuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50c1xuIiwiZnVuY3Rpb24gaW5zdGFsbEdlb21ldHJpY0NvbnN0cmFpbnRzKFNrZXRjaHBhZCkge1xuXG4gICAgLy8gVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2YgZ2VvbWV0cmljIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgICAvLyBvYmplY3RzIHRoYXQgaGF2ZSB4IGFuZCB5IHByb3BlcnRpZXMuIE90aGVyIHByb3BlcnRpZXMgYXJlIGlnbm9yZWQuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbSA9IHt9XG5cbiAgICAvLyBIZWxwZXJzXG5cbiAgICBmdW5jdGlvbiBzcXVhcmUobikge1xuXHRyZXR1cm4gbiAqIG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwbHVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggKyBwMi54LCB5OiBwMS55ICsgcDIueX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaW51cyhwMSwgcDIpIHtcblx0cmV0dXJuIHt4OiBwMS54IC0gcDIueCwgeTogcDEueSAtIHAyLnl9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbGVkQnkocCwgbSkge1xuXHRyZXR1cm4ge3g6IHAueCAqIG0sIHk6IHAueSAqIG19XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29weShwKSB7XG5cdHJldHVybiBzY2FsZWRCeShwLCAxKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZHBvaW50KHAxLCBwMikge1xuXHRyZXR1cm4gc2NhbGVkQnkocGx1cyhwMSwgcDIpLCAwLjUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFnbml0dWRlKHApIHtcblx0cmV0dXJuIE1hdGguc3FydChzcXVhcmUocC54KSArIHNxdWFyZShwLnkpKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZWQocCkge1xuXHR2YXIgbSA9IG1hZ25pdHVkZShwKVxuXHRyZXR1cm4gbSA+IDAgPyBzY2FsZWRCeShwLCAxIC8gbSkgOiBwXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzdGFuY2UocDEsIHAyKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAxLnggLSBwMi54KSArIHNxdWFyZShwMS55IC0gcDIueSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcm90YXRlZEJ5KHAsIGRUaGV0YSkge1xuXHR2YXIgYyA9IE1hdGguY29zKGRUaGV0YSlcblx0dmFyIHMgPSBNYXRoLnNpbihkVGhldGEpXG5cdHJldHVybiB7eDogYypwLnggLSBzKnAueSwgeTogcypwLnggKyBjKnAueX1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByb3RhdGVkQXJvdW5kKHAsIGRUaGV0YSwgYXhpcykge1xuXHRyZXR1cm4gcGx1cyhheGlzLCByb3RhdGVkQnkobWludXMocCwgYXhpcyksIGRUaGV0YSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0RGVsdGEoZCwgcCwgc2NhbGUpIHtcblx0ZC54ID0gcC54ICogc2NhbGVcblx0ZC55ID0gcC55ICogc2NhbGVcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5zcXVhcmUgPSBzcXVhcmVcbiAgICBTa2V0Y2hwYWQuZ2VvbS5wbHVzID0gcGx1c1xuICAgIFNrZXRjaHBhZC5nZW9tLm1pbnVzID0gbWludXNcbiAgICBTa2V0Y2hwYWQuZ2VvbS5zY2FsZWRCeSA9IHNjYWxlZEJ5XG4gICAgU2tldGNocGFkLmdlb20uY29weSA9IGNvcHlcbiAgICBTa2V0Y2hwYWQuZ2VvbS5taWRwb2ludCA9IG1pZHBvaW50XG4gICAgU2tldGNocGFkLmdlb20ubWFnbml0dWRlID0gbWFnbml0dWRlXG4gICAgU2tldGNocGFkLmdlb20ubm9ybWFsaXplZCA9IG5vcm1hbGl6ZWRcbiAgICBTa2V0Y2hwYWQuZ2VvbS5kaXN0YW5jZSA9IGRpc3RhbmNlXG4gICAgU2tldGNocGFkLmdlb20ucm90YXRlZEJ5ID0gcm90YXRlZEJ5XG4gICAgU2tldGNocGFkLmdlb20ucm90YXRlZEFyb3VuZCA9IHJvdGF0ZWRBcm91bmRcbiAgICBTa2V0Y2hwYWQuZ2VvbS5zZXREZWx0YSA9IHNldERlbHRhXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5kcmF3VmlzdWFsaXphdGlvbkxpbmUgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbiwgcDEsIHAyLCBsKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0Y3R4dC5saW5lV2lkdGggPSAxXG5cdGN0eHQuc3Ryb2tlU3R5bGUgPSAneWVsbG93J1xuXHRjdHh0LmJlZ2luUGF0aCgpXG5cblx0dmFyIGFuZ2xlID0gTWF0aC5hdGFuMihwMi55IC0gcDEueSwgcDIueCAtIHAxLngpXG5cdHZhciBkaXN0ID0gMjVcblx0dmFyIHAxeCA9IG9yaWdpbi54ICsgcDEueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDF5ID0gb3JpZ2luLnkgKyBwMS55IC0gZGlzdCAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciBwMnggPSBvcmlnaW4ueCArIHAyLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeSA9IG9yaWdpbi55ICsgcDIueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXG5cdHZhciB0ZXh0Q2VudGVyWCA9IChwMXggKyBwMngpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHRleHRDZW50ZXJZID0gKHAxeSArIHAyeSkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXG5cdGN0eHQubW92ZVRvKFxuXHQgICAgcDF4ICsgNSAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpLFxuXHQgICAgcDF5ICsgNSAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdClcblx0Y3R4dC5saW5lVG8oXG5cdCAgICBwMXggLSA1ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMiksXG5cdCAgICBwMXkgLSA1ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0KVxuXG5cdGN0eHQubW92ZVRvKHAxeCwgcDF5KVxuXHRjdHh0LmxpbmVUbyhwMngsIHAyeSlcblxuXHRjdHh0Lm1vdmVUbyhcblx0ICAgIHAyeCArIDUgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKSxcblx0ICAgIHAyeSArIDUgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHQpXG5cdGN0eHQubGluZVRvKFxuXHQgICAgcDJ4IC0gNSAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpLFxuXHQgICAgcDJ5IC0gNSAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdClcblx0Y3R4dC5jbG9zZVBhdGgoKVxuXHRjdHh0LnN0cm9rZSgpXG5cblx0Y3R4dC50ZXh0QWxpZ24gPSAnY2VudGVyJ1xuXHRjdHh0LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnXG5cdGN0eHQuc3Ryb2tlVGV4dChNYXRoLnJvdW5kKGwpLCB0ZXh0Q2VudGVyWCwgdGV4dENlbnRlclkpXG5cdGN0eHQuc3Ryb2tlKClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5jYWxjdWxhdGVBbmdsZSA9IGZ1bmN0aW9uKHAxLCBwMiwgcDMsIHA0KSB7XG5cdHZhciB2MTIgPSB7eDogcDIueCAtIHAxLngsIHk6IHAyLnkgLSBwMS55fVxuXHR2YXIgYTEyID0gTWF0aC5hdGFuMih2MTIueSwgdjEyLngpXG5cdHZhciB2MzQgPSB7eDogcDQueCAtIHAzLngsIHk6IHA0LnkgLSBwMy55fVxuXHR2YXIgYTM0ID0gTWF0aC5hdGFuMih2MzQueSwgdjM0LngpXG5cdHJldHVybiAoYTEyIC0gYTM0ICsgMiAqIE1hdGguUEkpICUgKDIgKiBNYXRoLlBJKVxuICAgIH1cblxuICAgIC8vIENvb3JkaW5hdGUgQ29uc3RyYWludCwgaS5lLiwgXCJJIHdhbnQgdGhpcyBwb2ludCB0byBiZSBoZXJlXCIuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZENvb3JkaW5hdGUgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0ZpeGVkQ29vcmRpbmF0ZShwLCB4LCB5KSB7XG5cdHRoaXMucCA9IHBcblx0dGhpcy5jID0gbmV3IFBvaW50KHgsIHkpXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkZpeGVkQ29vcmRpbmF0ZSwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLkZpeGVkQ29vcmRpbmF0ZS5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwOiAnUG9pbnQnLCBjOiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRDb29yZGluYXRlLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMuYywgdGhpcy5wKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZENvb3JkaW5hdGUucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHtwOiB7eDogdGhpcy5jLngsIHk6IHRoaXMuYy55fX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZENvb3JkaW5hdGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLkZpeGVkQ29vcmRpbmF0ZShQb2ludCBQLCBOdW1iZXIgWCwgTnVtYmVyIFkpIHN0YXRlcyB0aGF0IHBvaW50IFAgc2hvdWxkIHN0YXkgYXQgY29vcmRpbmF0ZSAoWCwgWSkuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRDb29yZGluYXRlLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwicG9pbnQgcCAoXCIgKyB0aGlzLnAuX190b1N0cmluZyArIFwiKSBzaG91bGQgc3RheSBhdCBjb29yZGluYXRlIChcIiArIHRoaXMuYy54ICsgXCIsIFwiICsgdGhpcy5jLnkgKyBcIikuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRDb29yZGluYXRlLnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy5wLCBwcm9wczogWyd4JywgJ3knXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRDb29yZGluYXRlLmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgcDEgPSBQb2ludC5kdW1teSh4LCB5KVxuXHR2YXIgcDIgPSBQb2ludC5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkZpeGVkQ29vcmRpbmF0ZShwMSwgcDIueCwgcDIueSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZENvb3JkaW5hdGUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgY3R4dCA9IGNhbnZhcy5jdHh0XG5cdGlmICh0aGlzLnAuaXNTZWxlY3RlZCkgcmV0dXJuIC8vIGRvbid0IGRyYXcgb3ZlciB0aGUgc2VsZWN0aW9uIGhpZ2hsaWdodFxuXHRjdHh0LmZpbGxTdHlsZSA9ICdibGFjaydcblx0Y3R4dC5iZWdpblBhdGgoKVxuXHRjdHh0LmFyYyh0aGlzLmMueCArIG9yaWdpbi54LCB0aGlzLmMueSArIG9yaWdpbi55LCBjYW52YXMucG9pbnRSYWRpdXMgKiAwLjY2NiwgMCwgMiAqIE1hdGguUEkpXG5cdGN0eHQuY2xvc2VQYXRoKClcblx0Y3R4dC5maWxsKClcbiAgICB9XG5cbiAgICAvLyBDb2luY2lkZW5jZSBDb25zdHJhaW50LCBpLmUuLCBJIHdhbnQgdGhlc2UgdHdvIHBvaW50cyB0byBiZSBhdCB0aGUgc2FtZSBwbGFjZS5cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19Db2luY2lkZW5jZShwMSwgcDIpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZSwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMucDIsIHRoaXMucDEpKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZS5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXModGhpcy5wMiwgdGhpcy5wMSksIDAuNSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBzcGxpdERpZmYpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2UuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLkNvaW5jaWRlbmNlKFBvaW50IFAxLCBQb2lvbnQgUDIpIHN0YXRlcyB0aGF0IHBvaW50cyBQMSAmIFAyIHNob3VsZCBiZSBhdCB0aGUgc2FtZSBwbGFjZS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZS5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcInBvaW50cyBwMSAoXCIgKyB0aGlzLnAxLl9fdG9TdHJpbmcgKyBcIikgJiBwMiAoXCIgKyB0aGlzLnAyLl9fdG9TdHJpbmcgKyBcIikgc2hvdWxkIGJlIGF0IHRoZSBzYW1lIHBsYWNlLlwiIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5Db2luY2lkZW5jZS5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uQ29pbmNpZGVuY2UobC5wMSwgbC5wMilcbiAgICB9XG4gICBcbiAgICAvLyBFcXVpdmFsZW5jZSBDb25zdHJhaW50LCBpLmUuLCBJIHdhbnQgdGhlIHZlY3RvcnMgcDEtPnAyIGFuZCBwMy0+cDQgdG8gYmUgdGhlIHNhbWUuXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbFZlY3RvcnMgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0VxdWFsVmVjdG9ycyhwMSwgcDIsIHAzLCBwNCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMucDMgPSBwM1xuXHR0aGlzLnA0ID0gcDRcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uRXF1YWxWZWN0b3JzLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxWZWN0b3JzLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgcDM6ICdQb2ludCcsIHA0OiAnUG9pbnQnfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxWZWN0b3JzLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5wMiwgdGhpcy5wMyksIHBsdXModGhpcy5wMSwgdGhpcy5wNCkpKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbFZlY3RvcnMucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNwbGl0RGlmZiA9IHNjYWxlZEJ5KG1pbnVzKHBsdXModGhpcy5wMiwgdGhpcy5wMyksIHBsdXModGhpcy5wMSwgdGhpcy5wNCkpLCAwLjI1KVxuXHRyZXR1cm4ge3AxOiBwbHVzKHRoaXMucDEsIHNwbGl0RGlmZiksIHAyOiBwbHVzKHRoaXMucDIsIHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpKSwgcDM6IHBsdXModGhpcy5wMywgc2NhbGVkQnkoc3BsaXREaWZmLCAtMSkpLCBwNDogcGx1cyh0aGlzLnA0LCBzcGxpdERpZmYpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsVmVjdG9ycy5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uRXF1YWxWZWN0b3JzKFBvaW50IFAxLCBQb2ludCBQMiwgUG9pbnQgUDMsIFBvaW50IFA0KSBzYXlzIGxpbmUgc2VjdGlvbnMgUDEtMiBhbmQgUDMtNCBhcmUgcGFyYWxsZWwgYW5kIG9mIHRoZSBzYW1lIGxlbmd0aHMuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxWZWN0b3JzLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwibGluZSBzZWN0aW9ucyAgcDEgKFwiICsgdGhpcy5wMS5fX3RvU3RyaW5nICsgXCIpIC1wMiAoXCIgKyB0aGlzLnAyLl9fdG9TdHJpbmcgKyBcIikgYW5kICBwMyAoXCIgKyB0aGlzLnAzLl9fdG9TdHJpbmcgKyBcIikgLXA0IChcIiArIHRoaXMucDQuX190b1N0cmluZyArIFwiKSBhcmUgcGFyYWxsZWwgYW5kIG9mIHRoZSBzYW1lIGxlbmd0aHMuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxWZWN0b3JzLmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbDEgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHZhciBsMiA9IExpbmUuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5FcXVhbFZlY3RvcnMobDEucDEsIGwxLnAyLCBsMi5wMSwgbDIucDIpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxWZWN0b3JzLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0dmFyIGwgPSBkaXN0YW5jZSh0aGlzLnAxLCB0aGlzLnAyKVxuXHRTa2V0Y2hwYWQuZ2VvbS5kcmF3VmlzdWFsaXphdGlvbkxpbmUoY2FudmFzLCBvcmlnaW4sIHRoaXMucDEsIHRoaXMucDIsIGwpXG5cdFNrZXRjaHBhZC5nZW9tLmRyYXdWaXN1YWxpemF0aW9uTGluZShjYW52YXMsIG9yaWdpbiwgdGhpcy5wMywgdGhpcy5wNCwgbClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbFZlY3RvcnMucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMiwgcDMgPSB0aGlzLnAzLCBwNCA9IHRoaXMucDRcblx0dmFyIHgxID0gTWF0aC5taW4ocDEueCwgcDIueCwgcDMueCwgcDQueCksIHgyID0gTWF0aC5tYXgocDEueCwgcDIueCwgcDMueCwgcDQueClcblx0dmFyIHkxID0gTWF0aC5taW4ocDEueSwgcDIueSwgcDMueSwgcDQueSksIHkyID0gTWF0aC5tYXgocDEueSwgcDIueSwgcDMueSwgcDQueSlcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KHgxLCB5MSksIHgyIC0geDEsIHkyIC0geTEpIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlci5jb250YWluc1BvaW50KHgsIHkpIFxuICAgIH1cbiAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsVmVjdG9ycy5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMiwgcDMgPSB0aGlzLnAzLCBwNCA9IHRoaXMucDRcblx0dmFyIHgxID0gTWF0aC5taW4ocDEueCwgcDIueCwgcDMueCwgcDQueCksIHgyID0gTWF0aC5tYXgocDEueCwgcDIueCwgcDMueCwgcDQueClcblx0dmFyIHkxID0gTWF0aC5taW4ocDEueSwgcDIueSwgcDMueSwgcDQueSksIHkyID0gTWF0aC5tYXgocDEueSwgcDIueSwgcDMueSwgcDQueSlcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KHgxLCB5MSksIHgyIC0geDEsIHkyIC0geTEpIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlclxuICAgIH0gXG5cbiAgICAvLyBPbmUgV2F5IEVxdWl2YWxlbmNlIENvbnN0cmFpbnQsIGkuZS4sIEkgd2FudCB0aGUgdmVjdG9ycyBwMS0+cDIgdG8gYWx3YXlzIG1hdGNoIHdpdGggcDMtPnA0XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVhbFZlY3RvcnMgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX09uZVdheUVxdWFsVmVjdG9ycyhwMSwgcDIsIHAzLCBwNCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMucDMgPSBwM1xuXHR0aGlzLnA0ID0gcDRcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uT25lV2F5RXF1YWxWZWN0b3JzLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1YWxWZWN0b3JzLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgcDM6ICdQb2ludCcsIHA0OiAnUG9pbnQnfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWFsVmVjdG9ycy5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMucDIsIHRoaXMucDMpLCBwbHVzKHRoaXMucDEsIHRoaXMucDQpKSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1YWxWZWN0b3JzLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzcGxpdERpZmYgPSBzY2FsZWRCeShtaW51cyhwbHVzKHRoaXMucDIsIHRoaXMucDMpLCBwbHVzKHRoaXMucDEsIHRoaXMucDQpKSwgMC41KVxuXHRyZXR1cm4ge3AxOiBwbHVzKHRoaXMucDEsIHNwbGl0RGlmZiksIHAyOiBwbHVzKHRoaXMucDIsIHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVhbFZlY3RvcnMuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5nZW9tLk9uZVdheUVxdWFsVmVjdG9ycyhQb2ludCBQMSwgUG9pbnQgUDIsIFBvaW50IFAzLCBQb2ludCBQNCkgc2F5cyB0aGUgdmVjdG9ycyBQMS0+UDIgYWx3YXlzIG1hdGNoZXMgd2l0aCBQMy0+UDRcIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVhbFZlY3RvcnMucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJ2ZWN0b3JzIHAxIChcIiArIHRoaXMucDEuX190b1N0cmluZyArIFwiKSAtPnAyIChcIiArIHRoaXMucDIuX190b1N0cmluZyArIFwiKSBhbHdheXMgbWF0Y2hlcyB3aXRoIHAzIChcIiArIHRoaXMucDMuX190b1N0cmluZyArIFwiKSAtPnA0IChcIiArIHRoaXMucDQuX190b1N0cmluZyArIFwiKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uT25lV2F5RXF1YWxWZWN0b3JzLmR1bW15ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbDEgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHZhciBsMiA9IExpbmUuZHVtbXkoeSwgeClcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuZ2VvbS5PbmVXYXlFcXVhbFZlY3RvcnMobDEucDEsIGwxLnAyLCBsMi5wMSwgbDIucDIpXG4gICAgfVxuXG4gICAgLy8gRXF1YWwgRGlzdGFuY2UgY29uc3RyYWludCAtIGtlZXBzIGRpc3RhbmNlcyBQMS0tPlAyLCBQMy0tPlA0IGVxdWFsXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbExlbmd0aHMgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0VxdWFsTGVuZ3RocyhwMSwgcDIsIHAzLCBwNCkge1xuXHR0aGlzLnAxID0gcDFcblx0dGhpcy5wMiA9IHAyXG5cdHRoaXMucDMgPSBwM1xuXHR0aGlzLnA0ID0gcDRcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uRXF1YWxMZW5ndGhzLCB0cnVlKVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsTGVuZ3Rocy5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCcsIHAzOiAnUG9pbnQnLCBwNDogJ1BvaW50J31cblxuICAgIFNrZXRjaHBhZC5nZW9tLkVxdWFsTGVuZ3Rocy5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSlcblx0dmFyIGwzNCA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAzLCB0aGlzLnA0KSlcblx0cmV0dXJuIGwxMiAtIGwzNFxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbExlbmd0aHMucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSlcblx0dmFyIGwzNCA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAzLCB0aGlzLnA0KSlcblx0dmFyIGRlbHRhID0gKGwxMiAtIGwzNCkgLyA0XG5cdHZhciBlMTIgPSBzY2FsZWRCeShTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkKG1pbnVzKHRoaXMucDIsIHRoaXMucDEpKSwgZGVsdGEpXG5cdHZhciBlMzQgPSBzY2FsZWRCeShTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkKG1pbnVzKHRoaXMucDQsIHRoaXMucDMpKSwgZGVsdGEpXG5cdHJldHVybiB7cDE6IHBsdXModGhpcy5wMSwgZTEyKSwgcDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoZTEyLCAtMSkpLCBwMzogcGx1cyh0aGlzLnAzLCBzY2FsZWRCeShlMzQsIC0xKSksIHA0OiBwbHVzKHRoaXMucDQsIGUzNCl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRXF1YWxMZW5ndGhzLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5FcXVhbExlbmd0aHMoUG9pbnQgUDEsIFBvaW50IFAyLCBQb2ludCBQMywgUG9pbnQgUDQpIGtlZXBzIGRpc3RhbmNlcyBQMS0+UDIsIFAzLT5QNCBlcXVhbC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbExlbmd0aHMucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJkaXN0YW5jZXMgcDEgKFwiICsgdGhpcy5wMS5fX3RvU3RyaW5nICsgXCIpIC0+cDIgKFwiICsgdGhpcy5wMi5fX3RvU3RyaW5nICsgXCIpICYgcDMgKFwiICsgdGhpcy5wMy5fX3RvU3RyaW5nICsgXCIpIC0+cDQgKFwiICsgdGhpcy5wNC5fX3RvU3RyaW5nICsgXCIpIGFyZSBlcXVhbC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5FcXVhbExlbmd0aHMuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBsMSA9IExpbmUuZHVtbXkoeCwgeSlcblx0dmFyIGwyID0gTGluZS5kdW1teSh5LCB4KVxuXHRyZXR1cm4gbmV3IFNrZXRjaHBhZC5nZW9tLkVxdWFsTGVuZ3RocyhsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG5cbiAgICAvLyBMZW5ndGggY29uc3RyYWludCAtIG1haW50YWlucyBkaXN0YW5jZSBiZXR3ZWVuIFAxIGFuZCBQMiBhdCBMLlxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRMZW5ndGggPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0ZpeGVkTGVuZ3RoKHAxLCBwMiwgbCwgb25seU9uZVdyaXRhYmxlKSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5sID0gbFxuXHR0aGlzLl9vbmx5T25lV3JpdGFibGUgPSBvbmx5T25lV3JpdGFibGVcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLmdlb20uRml4ZWRMZW5ndGgsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZExlbmd0aC5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwMTogJ1BvaW50JywgcDI6ICdQb2ludCcsIGw6ICdOdW1iZXInfVxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRMZW5ndGgucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsMTIgPSBtYWduaXR1ZGUobWludXModGhpcy5wMSwgdGhpcy5wMikpXG5cdHJldHVybiBsMTIgLSB0aGlzLmxcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZExlbmd0aC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyhwMSwgcDIpKVxuXHRpZiAobDEyID09IDApIHtcblx0ICAgIHAxID0gcGx1cyhwMSwge3g6IDAuMSwgeTogMH0pXG5cdCAgICBwMiA9IHBsdXMocDIsIHt4OiAtMC4xLCB5OiAwfSlcblx0fVx0XG5cdHZhciBkZWx0YSA9IChsMTIgLSB0aGlzLmwpIC8gKHRoaXMuX29ubHlPbmVXcml0YWJsZSA/IDEgOiAyKVxuXHR2YXIgZTEyID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20ubm9ybWFsaXplZChtaW51cyhwMiwgcDEpKSwgZGVsdGEpXG5cdHZhciByZXMgPSB7cDI6IHBsdXModGhpcy5wMiwgc2NhbGVkQnkoZTEyLCAtMSkpfVxuXHRpZiAoIXRoaXMuX29ubHlPbmVXcml0YWJsZSlcblx0ICAgIHJlc1sncDEnXSA9IHBsdXModGhpcy5wMSwgZTEyKVxuXHRyZXR1cm4gcmVzXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkZpeGVkTGVuZ3RoLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5GaXhlZExlbmd0aChQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBMKSBzYXlzIHBvaW50cyBQMSBhbmQgUDIgYWx3YXlzIG1haW50YWluIGEgZGlzdGFuY2Ugb2YgTC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZExlbmd0aC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcInBvaW50cyBwMSAoXCIgKyB0aGlzLnAxLl9fdG9TdHJpbmcgKyBcIikgYW5kIHAyIChcIiArIHRoaXMucDIuX190b1N0cmluZyArIFwiKSBhbHdheXMgbWFpbnRhaW4gYSBkaXN0YW5jZSBvZiBcIiArIHRoaXMubCArIFwiLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkZpeGVkTGVuZ3RoLnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy5wMSwgcHJvcHM6IFsneCcsICd5J119LCB7b2JqOiB0aGlzLnAyLCBwcm9wczogWyd4JywgJ3knXX1dXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRMZW5ndGguZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uRml4ZWRMZW5ndGgobmV3IFBvaW50KHggLSA1MCwgeSAtIDUwKSwgbmV3IFBvaW50KHggKyA1MCwgeSArIDUwKSwgMTAwKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkZpeGVkTGVuZ3RoLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzLCBvcmlnaW4pIHtcblx0U2tldGNocGFkLmdlb20uZHJhd1Zpc3VhbGl6YXRpb25MaW5lKGNhbnZhcywgb3JpZ2luLCB0aGlzLnAxLCB0aGlzLnAyLCB0aGlzLmwpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRMZW5ndGgucHJvdG90eXBlLmNvbnRhaW5zUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHAyLnkgLSBwMS55LCBwMi54IC0gcDEueClcblx0dmFyIGRpc3QgPSAyNVxuXHR2YXIgcDF4ID0gcDEueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDF5ID0gcDEueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ4ID0gcDIueCAtIGRpc3QgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgcDJ5ID0gcDIueSAtIGRpc3QgKiBNYXRoLnNpbihhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclggPSAocDF4ICsgcDJ4KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguY29zKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHZhciB0ZXh0Q2VudGVyWSA9IChwMXkgKyBwMnkpIC8gMiAtIGRpc3QgLyAyICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KHRleHRDZW50ZXJYIC0gNTAsIHRleHRDZW50ZXJZIC0gNTApLCAxMDAsIDEwMCkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyLmNvbnRhaW5zUG9pbnQoeCwgeSkgXG4gICAgfVxuICAgXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRMZW5ndGgucHJvdG90eXBlLmJvcmRlciA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgcDEgPSB0aGlzLnAxLCBwMiA9IHRoaXMucDJcblx0dmFyIGFuZ2xlID0gTWF0aC5hdGFuMihwMi55IC0gcDEueSwgcDIueCAtIHAxLngpXG5cdHZhciBkaXN0ID0gMjVcblx0dmFyIHAxeCA9IHAxLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAxeSA9IHAxLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeCA9IHAyLnggLSBkaXN0ICogTWF0aC5jb3MoYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHAyeSA9IHAyLnkgLSBkaXN0ICogTWF0aC5zaW4oYW5nbGUgKyBNYXRoLlBJIC8gMilcblx0dmFyIHRleHRDZW50ZXJYID0gKHAxeCArIHAyeCkgLyAyIC0gZGlzdCAvIDIgKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyAyKVxuXHR2YXIgdGV4dENlbnRlclkgPSAocDF5ICsgcDJ5KSAvIDIgLSBkaXN0IC8gMiAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDIpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludCh0ZXh0Q2VudGVyWCAtIDUwLCB0ZXh0Q2VudGVyWSAtIDUwKSwgMTAwLCAxMDApIFxuXHRyZXR1cm4gdGhpcy5fX2JvcmRlclxuICAgIH0gXG5cbiAgICAvLyBPcmllbnRhdGlvbiBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGFuZ2xlIGJldHdlZW4gUDEtPlAyIGFuZCBQMy0+UDQgYXQgVGhldGFcblxuICAgIFNrZXRjaHBhZC5nZW9tLkZpeGVkQW5nbGUgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX0ZpeGVkQW5nbGUocDEsIHAyLCBwMywgcDQsIHRoZXRhKSB7XG5cdHRoaXMucDEgPSBwMVxuXHR0aGlzLnAyID0gcDJcblx0dGhpcy5wMyA9IHAzXG5cdHRoaXMucDQgPSBwNFxuXHR0aGlzLnRoZXRhID0gdGhldGEgPT09IHVuZGVmaW5lZCA/IFNrZXRjaHBhZC5nZW9tLmNhbGN1bGF0ZUFuZ2xlKHAxLCBwMiwgcDMsIHA0KSA6IHRoZXRhXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkZpeGVkQW5nbGUsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZEFuZ2xlLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgcDM6ICdQb2ludCcsIHA0OiAnUG9pbnQnLCB0aGV0YTogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZEFuZ2xlLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdjEyID0gbWludXModGhpcy5wMiwgdGhpcy5wMSlcblx0dmFyIGExMiA9IE1hdGguYXRhbjIodjEyLnksIHYxMi54KVxuXHR2YXIgbTEyID0gbWlkcG9pbnQodGhpcy5wMSwgdGhpcy5wMilcblx0XG5cdHZhciB2MzQgPSBtaW51cyh0aGlzLnA0LCB0aGlzLnAzKVxuXHR2YXIgYTM0ID0gTWF0aC5hdGFuMih2MzQueSwgdjM0LngpXG5cdHZhciBtMzQgPSBtaWRwb2ludCh0aGlzLnAzLCB0aGlzLnA0KVxuXHRcblx0dmFyIGN1cnJUaGV0YSA9IGExMiAtIGEzNFxuXHR2YXIgZFRoZXRhID0gdGhpcy50aGV0YSAtIGN1cnJUaGV0YVxuXHRyZXR1cm4gZFRoZXRhXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkZpeGVkQW5nbGUucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHYxMiA9IG1pbnVzKHRoaXMucDIsIHRoaXMucDEpXG5cdHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueClcblx0dmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpXG5cblx0dmFyIHYzNCA9IG1pbnVzKHRoaXMucDQsIHRoaXMucDMpXG5cdHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueClcblx0dmFyIG0zNCA9IG1pZHBvaW50KHRoaXMucDMsIHRoaXMucDQpXG5cblx0dmFyIGN1cnJUaGV0YSA9IGExMiAtIGEzNFxuXHR2YXIgZFRoZXRhID0gdGhpcy50aGV0YSAtIGN1cnJUaGV0YVxuXG5cdHJldHVybiB7cDE6IHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLFxuXHRcdHAyOiByb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKSxcblx0XHRwMzogcm90YXRlZEFyb3VuZCh0aGlzLnAzLCAtZFRoZXRhLCBtMzQpLFxuXHRcdHA0OiByb3RhdGVkQXJvdW5kKHRoaXMucDQsIC1kVGhldGEsIG0zNCl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRBbmdsZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20uRml4ZWRBbmdsZShQb2ludCBQMSwgUG9pbnQgUDIsIFBvaW50IFAzLCBQb2ludCBQNCwgTnVtYmVyIFRoZXRhKSBtYWludGFpbnMgYW5nbGUgYmV0d2VlbiBQMS0+UDIgYW5kIFAzLT5QNCBhdCBUaGV0YS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZEFuZ2xlLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiYW5nbGUgaXMgbWFpbnRhaW5lZCBiZXR3ZWVuIHAxIChcIiArIHRoaXMucDEuX190b1N0cmluZyArIFwiKSAtPnAyIChcIiArIHRoaXMucDIuX190b1N0cmluZyArIFwiKSBhbmQgcDMgKFwiICsgdGhpcy5wMy5fX3RvU3RyaW5nICsgXCIpIC0+cDQgKFwiICsgdGhpcy5wNC5fX3RvU3RyaW5nICsgXCIpIGF0IFwiICsgdGhpcy50aGV0YSArIFwiIHJhZGlhbnMuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRBbmdsZS5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwxID0gTGluZS5kdW1teSh4LCB5KVxuXHR2YXIgbDIgPSBMaW5lLmR1bW15KHksIHgpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uRml4ZWRBbmdsZShsMS5wMSwgbDEucDIsIGwyLnAxLCBsMi5wMilcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uRml4ZWRBbmdsZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0dmFyIG0xID0gc2NhbGVkQnkocGx1cyh0aGlzLnAxLCB0aGlzLnAyKSwgMC41KVxuXHR2YXIgbTIgPSBzY2FsZWRCeShwbHVzKHRoaXMucDMsIHRoaXMucDQpLCAwLjUpXG5cdHZhciBtID0gc2NhbGVkQnkocGx1cyhtMSwgbTIpLCAwLjUpXG5cdGNhbnZhcy5kcmF3QXJyb3cobTEsIG0yLCBvcmlnaW4pXG5cdGN0eHQuZmlsbFN0eWxlID0gJ3JlZCdcblx0Y3R4dC5maWxsVGV4dCgndGhldGEgPSAnICsgTWF0aC5mbG9vcih0aGlzLnRoZXRhIC8gTWF0aC5QSSAqIDE4MCksIG0ueCArIG9yaWdpbi54LCBtLnkgKyBvcmlnaW4ueSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZEFuZ2xlLnByb3RvdHlwZS5jb250YWluc1BvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIgbTEgPSBzY2FsZWRCeShwbHVzKHRoaXMucDEsIHRoaXMucDIpLCAwLjUpXG5cdHZhciBtMiA9IHNjYWxlZEJ5KHBsdXModGhpcy5wMywgdGhpcy5wNCksIDAuNSlcblx0dmFyIG0gPSBzY2FsZWRCeShwbHVzKG0xLCBtMiksIDAuNSlcblx0dGhpcy5fX2JvcmRlciA9IG5ldyBCb3gobmV3IFBvaW50KG0ueCAtIDUwLCBtLnkgLSA1MCksIDEwMCwgMTAwKSBcblx0cmV0dXJuIHRoaXMuX19ib3JkZXIuY29udGFpbnNQb2ludCh4LCB5KSBcbiAgICB9XG4gICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5GaXhlZEFuZ2xlLnByb3RvdHlwZS5ib3JkZXIgPSBmdW5jdGlvbigpIHtcblx0dmFyIG0xID0gc2NhbGVkQnkocGx1cyh0aGlzLnAxLCB0aGlzLnAyKSwgMC41KVxuXHR2YXIgbTIgPSBzY2FsZWRCeShwbHVzKHRoaXMucDMsIHRoaXMucDQpLCAwLjUpXG5cdHZhciBtID0gc2NhbGVkQnkocGx1cyhtMSwgbTIpLCAwLjUpXG5cdHRoaXMuX19ib3JkZXIgPSBuZXcgQm94KG5ldyBQb2ludChtLnggLSA1MCwgbS55IC0gNTApLCAxMDAsIDEwMCkgXG5cdHJldHVybiB0aGlzLl9fYm9yZGVyXG4gICAgfSBcblxuICAgIC8vIE1vdG9yIGNvbnN0cmFpbnQgLSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlLlxuICAgIC8vIHcgaXMgaW4gdW5pdHMgb2YgSHogLSB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cblxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yTW90aW9uID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tX19Nb3Rvck1vdGlvbihwMSwgcDIsIHcpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLncgPSB3XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLk1vdG9yTW90aW9uLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JNb3Rpb24ucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cDE6ICdQb2ludCcsIHAyOiAnUG9pbnQnLCB3OiAnTnVtYmVyJ31cbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3Rvck1vdGlvbi5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIDFcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3Rvck1vdGlvbi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdCA9IChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC8gMTAwMC4wXG5cdHZhciBkVGhldGEgPSB0ICogdGhpcy53ICogKDIgKiBNYXRoLlBJKVxuXHR2YXIgbTEyID0gbWlkcG9pbnQodGhpcy5wMSwgdGhpcy5wMilcblx0cmV0dXJuIHtwMTogcm90YXRlZEFyb3VuZCh0aGlzLnAxLCBkVGhldGEsIG0xMiksXG5cdFx0cDI6IHJvdGF0ZWRBcm91bmQodGhpcy5wMiwgZFRoZXRhLCBtMTIpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLk1vdG9yTW90aW9uLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbS5Nb3Rvck1vdGlvbihQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBXKSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlIG9mIHcsIGluIHVuaXRzIG9mIEh6OiB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cIiB9IFxuXG4gICAgU2tldGNocGFkLmdlb20uTW90b3JNb3Rpb24ucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJwMSAoXCIgKyB0aGlzLnAxLl9fdG9TdHJpbmcgKyBcIikgYW5kIHAyIChcIiArIHRoaXMucDIuX190b1N0cmluZyArIFwiKSB0byBvcmJpdCB0aGVpciBtaWRwb2ludCBhdCB0aGUgZ2l2ZW4gcmF0ZSBvZiBcIiArIHRoaXMudyArIFwiLCBpbiB1bml0cyBvZiBIejogd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXCIgfSBcbiAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbS5Nb3Rvck1vdGlvbi5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGwgPSBMaW5lLmR1bW15KHgsIHkpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLmdlb20uTW90b3JNb3Rpb24obC5wMSwgbC5wMiwgMSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRQbGFjZW1lbnQgPSBmdW5jdGlvbiAgU2tldGNocGFkX19nZW9tX19DYXJ0ZXNpYW5Qb2ludFBsYWNlbWVudChwb3NpdGlvbiwgdmVjdG9yLCBvcmlnaW4sIHVuaXQpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMudmVjdG9yID0gdmVjdG9yXG5cdHRoaXMub3JpZ2luID0gb3JpZ2luXG5cdHRoaXMudW5pdCA9IHVuaXRcbiAgICB9XG4gICAgXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50UGxhY2VtZW50LCB0cnVlKVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50UGxhY2VtZW50LmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBcIlNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50UGxhY2VtZW50KFBvaW50IFAsIFZlY3RvciBWLCBQb2ludCBPLCBOdW1iZXIgVSkgc3RhdGVzIHRoYXQgUCBzaG91bGQgYmUgcG9zaXRpb25lZCBiYXNlZCBvbiB2ZWN0b3IgVidzIFggYW5kIFkgZGlzY3JldGUgY29vcmRpbmF0ZSB2YWx1ZXMsIGFuZCBvbiBvcmlnaW4gTyBhbmQgZWFjaCB1bml0IG9uIGF4aXMgaGF2aW5nIGEgdmVydGljYWwgYW5kIGhvcml6b250YWwgbGVuZ3RoIG9mIFVcIlxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50UGxhY2VtZW50LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gXCJcIiArIHRoaXMucG9zaXRpb24uX190b1N0cmluZyArIFwiIHNob3VsZCBiZSBwb3NpdGlvbmVkIGJhc2VkIG9uIHZlY3RvciBcIiArIHRoaXMudmVjdG9yLl9fdG9TdHJpbmcgKyBcIidzIFggYW5kIFkgZGlzY3JldGUgY29vcmRpbmF0ZSB2YWx1ZXMsIGFuZCBvbiBvcmlnaW4gXCIgKyB0aGlzLm9yaWdpbi5fX3RvU3RyaW5nICsgXCIgYW5kIGVhY2ggdW5pdCBvbiBheGlzIGhhdmluZyBhIHZlcnRpY2FsIGFuZCBob3Jpem9udGFsIGxlbmd0aCBvZiBcIiArIHRoaXMudW5pdFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tLkNhcnRlc2lhblBvaW50UGxhY2VtZW50LnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgb3JpZ2luID0gdGhpcy5vcmlnaW4sIHZlY3RvciA9IHRoaXMudmVjdG9yLCBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24sIHVuaXQgPSB0aGlzLnVuaXRcblx0dmFyIGRpZmZYID0gTWF0aC5hYnMob3JpZ2luLnggKyB1bml0ICogdmVjdG9yLnggLSBwb3NpdGlvbi54KVxuXHR2YXIgZGlmZlkgPSBNYXRoLmFicyhvcmlnaW4ueSAtIHVuaXQgKiB2ZWN0b3IueSAtIHBvc2l0aW9uLnkpXG5cdHJldHVybiBkaWZmWCArIGRpZmZZXG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20uQ2FydGVzaWFuUG9pbnRQbGFjZW1lbnQucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIG9yaWdpbiA9IHRoaXMub3JpZ2luLCB2ZWN0b3IgPSB0aGlzLnZlY3RvciwgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLCB1bml0ID0gdGhpcy51bml0XG5cdHZhciB4ID0gb3JpZ2luLnggKyB1bml0ICogdmVjdG9yLnhcblx0dmFyIHkgPSBvcmlnaW4ueSAtIHVuaXQgKiB2ZWN0b3IueVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiB7eDogeCwgeTogeX19XG4gICAgfVxuICAgIFxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50c1xuIiwiZnVuY3Rpb24gaW5zdGFsbFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIHNpbXVsYXRpb24gY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAgIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24gPSB7IGc6IDkuOCwgRzogNi43ZS0xMSB9IC8vIEc6IE5tMi9rZzIgXG5cbiAgICB2YXIgbWludXMgPSBTa2V0Y2hwYWQuZ2VvbS5taW51c1xuICAgIHZhciBwbHVzID0gU2tldGNocGFkLmdlb20ucGx1c1xuICAgIHZhciBzY2FsZWRCeSA9IFNrZXRjaHBhZC5nZW9tLnNjYWxlZEJ5XG4gICAgdmFyIG5vcm1hbGl6ZWQgPSBTa2V0Y2hwYWQuZ2VvbS5ub3JtYWxpemVkXG4gICAgdmFyIG1hZ25pdHVkZSA9IFNrZXRjaHBhZC5nZW9tLm1hZ25pdHVkZVxuICAgIHZhciBkaXN0YW5jZSA9IFNrZXRjaHBhZC5nZW9tLmRpc3RhbmNlXG5cbiAgICAvLyBDbGFzc2VzXG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0ZyZWVCb2R5KHBvc2l0aW9uLCBvcHRSYWRpdXMsIG9wdE1hc3MpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMubWFzcyA9IG9wdE1hc3MgfHwgMTBcblx0dGhpcy52ZWxvY2l0eSA9IG5ldyBWZWN0b3IoMCwgMClcblx0dGhpcy5hY2NlbGVyYXRpb24gPSBuZXcgVmVjdG9yKDAsIDApXG5cdHRoaXMucmFkaXVzID0gb3B0UmFkaXVzIHx8IHRoaXMucG9zaXRpb24ucmFkaXVzXG5cdHJjLmFkZChwb3NpdGlvbilcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtwb3NpdGlvbjogJ1BvaW50JywgbWFzczogJ051bWJlcicsIHJhZGl1czogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keShQb2ludC5kdW1teSh4LCB5KSwgMTAsIDEwKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5wcm90b3R5cGUuY29udGFpbnNQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIHRoaXMucG9zaXRpb24uY29udGFpbnNQb2ludCh4LCB5KVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyZWVCb2R5LnByb3RvdHlwZS5jZW50ZXIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMucG9zaXRpb25cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmVlQm9keS5wcm90b3R5cGUuYm9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLnBvc2l0aW9uLmJvcmRlcigpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJlZUJvZHkucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHQvL3RoaXMucG9zaXRpb24uZHJhdyhjYW52YXMsIG9yaWdpbilcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX1NwcmluZyhib2R5MSwgYm9keTIsIGssIGxlbmd0aCwgdGVhclBvaW50QW1vdW50KSB7XG5cdHRoaXMuYm9keTEgPSBib2R5MVxuXHR0aGlzLmJvZHkxID0gYm9keTJcblx0dGhpcy5saW5lID0gbmV3IExpbmUoYm9keTEucG9zaXRpb24sIGJvZHkyLnBvc2l0aW9uKVxuXHR0aGlzLmsgPSBrXG5cdHRoaXMubGVuZ3RoID0gbGVuZ3RoICAgIFxuXHR0aGlzLnRlYXJQb2ludEFtb3VudCA9IHRlYXJQb2ludEFtb3VudFxuXHR0aGlzLnRvcm4gPSBmYWxzZVxuXHR0aGlzLl9ub3JtYWxDb2xvciA9IG5ldyBDb2xvcigxNTAsIDE1MCwgMTUwKVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTE6ICdGcmVlQm9keScsIGJvZHkyOiAnRnJlZUJvZHknLCBrOiAnTnVtYmVyJywgbGVuZ3RoOiAnTnVtYmVyJywgdGVhdFBvaW50QW1vdW50OiAnTnVtYmVyJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZy5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dmFyIGIxID0gRnJlZUJvZHkuZHVtbXkoeCwgeSlcblx0dmFyIGIyID0gRnJlZUJvZHkuZHVtbXkoeCArIDEwMCwgeSArIDEwMClcblx0dmFyIGQgPSBkaXN0YW5jZShiMS5wMSwgYjIucDIpXG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nKGIxLCBiMiwgMTAsIGQsICBkICogNSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5jb250YWluc1BvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gdGhpcy5saW5lLmNvbnRhaW5zUG9pbnQoeCwgeSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLmNlbnRlciA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5saW5lLmNlbnRlcigpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5ib3JkZXIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG5ldyBMaW5lKHRoaXMubGluZS5wMSwgdGhpcy5saW5lLnAyLCB1bmRlZmluZWQsIDgpLmJvcmRlcigpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLnByb3RvdHlwZS5zb2x1dGlvbkpvaW5zID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7dG9ybjogcmMuc2tldGNocGFkLmxhc3RPbmVXaW5zSm9pblNvbHV0aW9uc31cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmcucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIG9yaWdpbikge1xuXHR2YXIgY3R4dCA9IGNhbnZhcy5jdHh0XG5cdHZhciBsaW5lID0gdGhpcy5saW5lXG5cdHZhciBwMSA9IGxpbmUucDEsIHAyID0gbGluZS5wMlxuXHR2YXIgeTEgPSBvcmlnaW4ueSArIHAxLnlcblx0dmFyIHkyID0gb3JpZ2luLnkgKyBwMi55XG5cdHZhciB4MSA9IG9yaWdpbi54ICsgcDEueFxuXHR2YXIgeDIgPSBvcmlnaW4ueCArIHAyLnhcblx0aWYgKCF0aGlzLnRvcm4pIHtcblx0ICAgIHZhciBzdHJldGNoID0gTWF0aC5mbG9vcihNYXRoLnNxcnQoTWF0aC5wb3coeTEgLSB5MiwgMikgKyBNYXRoLnBvdyh4MSAtIHgyLCAyKSkgLSB0aGlzLmxlbmd0aClcblx0ICAgIHZhciBzdHJldGNoUCA9IE1hdGguYWJzKHN0cmV0Y2gpXG5cdCAgICB0aGlzLl9ub3JtYWxDb2xvci5yZWQgPSBNYXRoLm1pbigyNTUsIDE1MCArIHN0cmV0Y2hQKVxuXHQgICAgbGluZS5jb2xvciA9IHRoaXMuX25vcm1hbENvbG9yLmhleFN0cmluZygpXG5cdCAgICBsaW5lLmRyYXcoY2FudmFzLCBvcmlnaW4pXG5cdCAgICBjdHh0LmZpbGxTdHlsZSA9ICdibGFjaydcblx0ICAgIGN0eHQuZmlsbFRleHQoc3RyZXRjaCwgKHgxICsgeDIpIC8gMiwgKHkxICsgeTIpIC8gMilcblx0fVxuICAgIH1cblxuICAgIC8vIFV0aWxpdGllc1xuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uZGV0ZWN0Q29udGFjdCA9IGZ1bmN0aW9uKGhhbGZMZW5ndGgsIHBvc2l0aW9uLCB2ZWxvY2l0eSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpIHtcblx0dmFyIHF1YXJ0ZXJMZW5ndGggPSBoYWxmTGVuZ3RoIC8gMlxuXHR2YXIgcG9zaXRpb25YID0gcG9zaXRpb24ueFxuXHR2YXIgcG9zaXRpb25ZID0gcG9zaXRpb24ueVxuXHR2YXIgc3VyZmFjZVgxID0gc3VyZmFjZVAxLnhcblx0dmFyIHN1cmZhY2VZMSA9IHN1cmZhY2VQMS55XG5cdHZhciBzdXJmYWNlWDIgPSBzdXJmYWNlUDIueFxuXHR2YXIgc3VyZmFjZVkyID0gc3VyZmFjZVAyLnlcblx0dmFyIHNsb3BlID0gKHN1cmZhY2VZMiAtIHN1cmZhY2VZMSkgLyAoc3VyZmFjZVgyIC0gc3VyZmFjZVgxKVxuXHR2YXIgc3VyZmFjZUhpdFBvc1ggPSAoKHBvc2l0aW9uWSAtIHN1cmZhY2VZMSkgLyBzbG9wZSkgKyBzdXJmYWNlWDFcblx0dmFyIHN1cmZhY2VIaXRQb3NZID0gKChwb3NpdGlvblggLSBzdXJmYWNlWDEpICogc2xvcGUpICsgc3VyZmFjZVkxXG5cdHZhciBpc1ZlcnRpY2FsID0gKHBvc2l0aW9uWCA+PSAoc3VyZmFjZVgxIC0gcXVhcnRlckxlbmd0aCkgJiYgcG9zaXRpb25YIDw9IChzdXJmYWNlWDIgKyBxdWFydGVyTGVuZ3RoKSlcblx0dmFyIGlzSG9yaXpvbnRhbCA9IChwb3NpdGlvblkgPj0gKHN1cmZhY2VZMSAtIHF1YXJ0ZXJMZW5ndGgpICYmIHBvc2l0aW9uWSA8PSAoc3VyZmFjZVkyICsgcXVhcnRlckxlbmd0aCkpXG5cdHZhciBpc1VwID0gaXNWZXJ0aWNhbCAmJiBwb3NpdGlvblkgPD0gc3VyZmFjZUhpdFBvc1lcblx0dmFyIGlzRG93biA9IGlzVmVydGljYWwgJiYgcG9zaXRpb25ZID49IHN1cmZhY2VIaXRQb3NZXG5cdHZhciBpc0xlZnQgPSBpc0hvcml6b250YWwgJiYgcG9zaXRpb25YIDw9IHN1cmZhY2VIaXRQb3NYXG5cdHZhciBpc1JpZ2h0ID0gaXNIb3Jpem9udGFsICYmIHBvc2l0aW9uWCA+PSBzdXJmYWNlSGl0UG9zWFxuXHRyZXR1cm4gKCgoaXNVcCAmJiAodmVsb2NpdHkueSA+PSAwKSAmJiAocG9zaXRpb25ZID49IChzdXJmYWNlSGl0UG9zWSAtIGhhbGZMZW5ndGgpKSlcblx0XHQgfHwgKGlzRG93biAmJiAodmVsb2NpdHkueSA8PSAwKSAmJiAocG9zaXRpb25ZIDw9IChzdXJmYWNlSGl0UG9zWSArIGhhbGZMZW5ndGgpKSkpXG5cdFx0fHwgKChpc0xlZnQgJiYgKHZlbG9jaXR5LnggPj0gMCkgJiYgKHBvc2l0aW9uWCA8PSBzdXJmYWNlSGl0UG9zWCkgJiYgKHBvc2l0aW9uWCA+PSAoc3VyZmFjZUhpdFBvc1ggLSBoYWxmTGVuZ3RoKSkpXG5cdFx0ICAgIHx8IChpc1JpZ2h0ICYmICh2ZWxvY2l0eS54IDw9IDApICYmIChwb3NpdGlvblggPj0gc3VyZmFjZUhpdFBvc1gpICYmIChwb3NpdGlvblggPD0gKHN1cmZhY2VIaXRQb3NYICsgaGFsZkxlbmd0aCkpKSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uY29tcHV0ZUNvbnRhY3QgPSBmdW5jdGlvbihoYWxmTGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSB7XG5cdHZhciBxdWFydGVyTGVuZ3RoID0gaGFsZkxlbmd0aCAvIDJcblx0dmFyIHBvc2l0aW9uWCA9IHBvc2l0aW9uLnhcblx0dmFyIHBvc2l0aW9uWSA9IHBvc2l0aW9uLnlcblx0dmFyIHN1cmZhY2VYMSA9IHN1cmZhY2VQMS54XG5cdHZhciBzdXJmYWNlWTEgPSBzdXJmYWNlUDEueVxuXHR2YXIgc3VyZmFjZVgyID0gc3VyZmFjZVAyLnhcblx0dmFyIHN1cmZhY2VZMiA9IHN1cmZhY2VQMi55XG5cdHZhciBzbG9wZSA9IChzdXJmYWNlWTIgLSBzdXJmYWNlWTEpIC8gKHN1cmZhY2VYMiAtIHN1cmZhY2VYMSlcblx0dmFyIHN1cmZhY2VIaXRQb3NYID0gKChwb3NpdGlvblkgLSBzdXJmYWNlWTEpIC8gc2xvcGUpICsgc3VyZmFjZVgxXG5cdHZhciBzdXJmYWNlSGl0UG9zWSA9ICgocG9zaXRpb25YIC0gc3VyZmFjZVgxKSAqIHNsb3BlKSArIHN1cmZhY2VZMVxuXHR2YXIgaXNWZXJ0aWNhbCA9IChwb3NpdGlvblggPj0gKHN1cmZhY2VYMSAtIHF1YXJ0ZXJMZW5ndGgpICYmIHBvc2l0aW9uWCA8PSAoc3VyZmFjZVgyICsgcXVhcnRlckxlbmd0aCkpXG5cdHZhciBpc0hvcml6b250YWwgPSAocG9zaXRpb25ZID49IChzdXJmYWNlWTEgLSBxdWFydGVyTGVuZ3RoKSAmJiBwb3NpdGlvblkgPD0gKHN1cmZhY2VZMiArIHF1YXJ0ZXJMZW5ndGgpKVxuXHR2YXIgaXNVcCA9IGlzVmVydGljYWwgJiYgcG9zaXRpb25ZIDw9IHN1cmZhY2VIaXRQb3NZXG5cdHZhciBpc0Rvd24gPSBpc1ZlcnRpY2FsICYmIHBvc2l0aW9uWSA+PSBzdXJmYWNlSGl0UG9zWVxuXHR2YXIgaXNMZWZ0ID0gaXNIb3Jpem9udGFsICYmIHBvc2l0aW9uWCA8PSBzdXJmYWNlSGl0UG9zWFxuXHR2YXIgaXNSaWdodCA9IGlzSG9yaXpvbnRhbCAmJiBwb3NpdGlvblggPj0gc3VyZmFjZUhpdFBvc1hcblx0dmFyIHZlbG9jaXR5TWFnbml0dWRlID0gbWFnbml0dWRlKHZlbG9jaXR5KVxuXHR2YXIgZGlzdGFuY2UgPSAwXG5cdC8vSEFDSyBGSVhNRVxuXHRpZiAoaXNVcCAmJiAodmVsb2NpdHkueSA+PSAwKSkge1xuXHQgICAgZGlzdGFuY2UgPSBzdXJmYWNlSGl0UG9zWSAtIChwb3NpdGlvblkgKyBoYWxmTGVuZ3RoKVxuXHR9IGVsc2UgaWYgKGlzRG93biAmJiAodmVsb2NpdHkueSA8PSAwKSkge1xuXHQgICAgZGlzdGFuY2UgPSAocG9zaXRpb25ZIC0gaGFsZkxlbmd0aCkgLSBzdXJmYWNlSGl0UG9zWVxuXHR9IGVsc2UgaWYgKGlzTGVmdCAmJiAodmVsb2NpdHkueCA+PSAwKSAmJiAocG9zaXRpb25YIDw9IHN1cmZhY2VIaXRQb3NYKSkge1xuXHQgICAgZGlzdGFuY2UgPSBzdXJmYWNlSGl0UG9zWCAtIChwb3NpdGlvblggKyBoYWxmTGVuZ3RoKVxuXHR9IGVsc2UgaWYgKGlzUmlnaHQgJiYgKHZlbG9jaXR5LnggPD0gMCkgJiYgKHBvc2l0aW9uWCA+PSBzdXJmYWNlSGl0UG9zWCkpIHtcblx0ICAgIGRpc3RhbmNlID0gKHBvc2l0aW9uWCAtIGhhbGZMZW5ndGgpIC0gc3VyZmFjZUhpdFBvc1hcblx0fSBlbHNlIHtcblx0ICAgIHJldHVybiAxMDAwMDAwXG5cdH1cblx0dmFyIHRpbWUgPSBkaXN0YW5jZSAvIHZlbG9jaXR5TWFnbml0dWRlIFxuXHRyZXR1cm4gTWF0aC5tYXgoMCwgdGltZSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZSA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHRyZXR1cm4gKHAxLnkgLSBwMi55KSAvIChwMS54IC0gcDIueClcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5hbmdsZSA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHRyZXR1cm4gTWF0aC5hdGFuMihwMS55IC0gcDIueSwgcDIueCAtIHAxLngpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3JXcm9uZyA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHR2YXIgc2xvcGUgPSB0aGlzLnNsb3BlKHAxLCBwMiksIGF0biA9IE1hdGguYXRhbihzbG9wZSlcblx0dmFyIHNpZ24gPSBwMS54IDwgcDIueCA/IC0xIDogMVxuXHRyZXR1cm4gbm9ybWFsaXplZCh7eDogc2lnbiAqIE1hdGguc2luKGF0biksIHk6IHNpZ24gKiBNYXRoLmNvcyhhdG4pfSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3IgPSBmdW5jdGlvbihwMSwgcDIpIHtcblx0dmFyIHNsb3BlID0gdGhpcy5zbG9wZShwMSwgcDIpLCBhdG4gPSBNYXRoLmF0YW4oc2xvcGUpXG5cdHZhciBzaWduWCA9IHAxLnggPCBwMi54ID8gMSA6IC0xXG5cdHZhciBzaWduWSA9IHAxLnkgPCBwMi55ID8gMSA6IC0xXG5cdHJldHVybiBub3JtYWxpemVkKHt4OiBzaWduWCAqIE1hdGguY29zKGF0biksIHk6IHNpZ25YICogTWF0aC5zaW4oYXRuKX0pXG4gICAgfVxuXG4gICAgLy8gVGltZXIgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVGlja2luZ1RpbWVyID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19UaWNraW5nVGltZXIodGltZXIpIHtcblx0dGhpcy50aW1lciA9IHRpbWVyXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpY2tpbmdUaW1lciwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpY2tpbmdUaW1lci5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaW1lcihUaW1lciBUKSBzdGF0ZXMgdGhlIHN5c3RlbSBhZHZhbmNlcyBpdHMgcHNldWRvLXRpbWUgYnkgVCdzIHN0ZXAgc2l6ZSBhdCBlYWNoIGZyYW1lIGN5Y2xlLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpY2tpbmdUaW1lci5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuIFwidGhlIHN5c3RlbSBhZHZhbmNlcyBpdHMgcHNldWRvLXRpbWUgYnkgXCIgKyB0aGlzLnRpbWVyLnN0ZXBTaXplICsgXCIgYXQgZWFjaCBmcmFtZSBjeWNsZS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaWNraW5nVGltZXIucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7dGltZXI6ICdUaW1lcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaWNraW5nVGltZXIucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiAwXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpY2tpbmdUaW1lci5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge31cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaWNraW5nVGltZXIuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uVGlja2luZ1RpbWVyKFNrZXRjaHBhZC5zaW11bGF0aW9uLlRpbWVyLmR1bW15KHgsIHkpKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5UaWNraW5nVGltZXIucHJvdG90eXBlLnByb3Bvc2VOZXh0UHNldWRvVGltZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHBzZXVkb1RpbWUgKyB0aGlzLnRpbWVyLnN0ZXBTaXplXG4gICAgfSAgICBcblxuICAgIC8vIFZhbHVlU2xpZGVyQmVoYXZpb3IgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJCZWhhdmlvciA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fVmFsdWVTbGlkZXJCZWhhdmlvcihzbGlkZXJQb2ludCwgeE9yWSwgc2xpZGVyWmVyb1ZhbHVlLCBzbGlkZXJSYW5nZUxlbmd0aCwgc2xpZGVkT2JqLCBzbGlkZWRQcm9wKSB7XG5cdHRoaXMuc2xpZGVyUG9pbnQgPSBzbGlkZXJQb2ludFxuXHR0aGlzLnhPclkgPSB4T3JZXG5cdHRoaXMuc2xpZGVyWmVyb1ZhbHVlID0gc2xpZGVyWmVyb1ZhbHVlXG5cdHRoaXMuc2xpZGVyUmFuZ2VMZW5ndGggPSBzbGlkZXJSYW5nZUxlbmd0aFxuXHR0aGlzLnNsaWRlZE9iaiA9IHNsaWRlZE9ialxuXHR0aGlzLnNsaWRlZFByb3AgPSBzbGlkZWRQcm9wXG5cdHRoaXMuc2xpZGVkT2JqUHJvcFplcm9WYWx1ZSA9IHNsaWRlZE9ialtzbGlkZWRQcm9wXVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckJlaGF2aW9yLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJCZWhhdmlvci5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzbGlkZXJQb2ludDogJ1BvaW50JywgeE9yWTogJ1N0cmluZycsIHNsaWRlclplcm9WYWx1ZTogJ051bWJlcicsIHNsaWRlclJhbmdlTGVuZ3RoOiAnTnVtYmVyJywgc2xpZGVkT2JqUHJvcFplcm9WYWx1ZTogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WYWx1ZVNsaWRlckJlaGF2aW9yLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc2xpZGVkUHJvcCA9IHRoaXMuc2xpZGVkUHJvcFxuXHR2YXIgY3VyclNsaWRlckRpZmYgPSAodGhpcy5zbGlkZXJaZXJvVmFsdWUgLSB0aGlzLnNsaWRlclBvaW50W3RoaXMueE9yWV0pIC8gdGhpcy5zbGlkZXJSYW5nZUxlbmd0aFxuXHR2YXIgc2xpZGVkT2JqUHJvcFRhcmdldCA9ICgxICsgY3VyclNsaWRlckRpZmYpICogdGhpcy5zbGlkZWRPYmpQcm9wWmVyb1ZhbHVlXG5cdHJldHVybiBzbGlkZWRPYmpQcm9wVGFyZ2V0IC0gdGhpcy5zbGlkZWRPYmpbc2xpZGVkUHJvcF1cblxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQmVoYXZpb3IucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNvbG4gPSB7fVxuXHR2YXIgc2xpZGVkUHJvcCA9IHRoaXMuc2xpZGVkUHJvcFxuXHR2YXIgY3VyclNsaWRlckRpZmYgPSAodGhpcy5zbGlkZXJaZXJvVmFsdWUgLSB0aGlzLnNsaWRlclBvaW50W3RoaXMueE9yWV0pIC8gdGhpcy5zbGlkZXJSYW5nZUxlbmd0aFxuXHR2YXIgc2xpZGVkT2JqUHJvcFRhcmdldCA9ICgxICsgY3VyclNsaWRlckRpZmYpICogdGhpcy5zbGlkZWRPYmpQcm9wWmVyb1ZhbHVlXG5cdHNvbG5bc2xpZGVkUHJvcF0gPSBzbGlkZWRPYmpQcm9wVGFyZ2V0XG5cdHRoaXMuc2xpZGVyUG9pbnQuc2VsZWN0aW9uSW5kaWNlc1swXSA9IE1hdGguZmxvb3IoMTAwICogY3VyclNsaWRlckRpZmYpXG5cdHJldHVybiB7c2xpZGVkT2JqOiBzb2xufVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZhbHVlU2xpZGVyQmVoYXZpb3IuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uVmFsdWVTbGlkZXJCZWhhdmlvcihQb2ludC5kdW1teSh4LCB5KSwgJ3gnLCAwLCAxMDAsIHtmb286IDB9LCAnZm9vJylcbiAgICB9XG5cbiAgICAvLyBNb3Rpb24gQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlSZWxhdGlvbiA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fVmVsb2NpdHlSZWxhdGlvbihib2R5KSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlSZWxhdGlvbiwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5UmVsYXRpb24ucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5UmVsYXRpb24ucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eVJlbGF0aW9uLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3Bvc2l0aW9uOiBwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5LCBkdCkpfVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eVJlbGF0aW9uLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eVJlbGF0aW9uKEZyZWVCb2R5IEJvZHkpIHN0YXRlcyBmb3IgQm9keTogUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eVJlbGF0aW9uLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiZm9yIEJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiIFBvcyA9IG9sZChQb3MpICsgKFwiICsgdGhpcy52ZWxvY2l0eS54ICsgXCIsXCIgKyAgdGhpcy52ZWxvY2l0eS55ICsgXCIpICogZHQsIHdoZXJlIGR0IGlzIHRoZSBmcmFtZSBzdGVwIHRpbWUgYW1vdW50LlwiIH1cblxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlSZWxhdGlvbi5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eVJlbGF0aW9uKEZyZWVCb2R5LmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5UmVsYXRpb24ucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dGhpcy5sYXN0UG9zaXRpb24gPSBzY2FsZWRCeSh0aGlzLnBvc2l0aW9uLCAxKVxuICAgIH1cbiAgICAgICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlSZWxhdGlvbi5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcywgb3JpZ2luKSB7XG5cdHZhciBjdHh0ID0gY2FudmFzLmN0eHRcblx0dmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKHRoaXMucG9zaXRpb24sIHRoaXMudmVsb2NpdHkpXHRcblx0dmFyIGxlbiA9IDUwXG5cdHZhciBwID0gcGx1cyh0aGlzLnBvc2l0aW9uLCB7eDogc2xvcGVWLnggKiBsZW4sIHk6IHNsb3BlVi55ICogbGVufSlcblx0Y2FudmFzLmRyYXdBcnJvdyh0aGlzLnBvc2l0aW9uLCBwLCBvcmlnaW4sICd2JylcbiAgICB9XG4gICAgXG4gICAgLy8gQm9keSBXaXRoIFZlbG9jaXR5IENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5QXNMaW5lU2VnbWVudFJlbGF0aW9uID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbihib2R5LCB2ZWxvY2l0eSkge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMucG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbiwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5QXNMaW5lU2VnbWVudFJlbGF0aW9uLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIHZlbG9jaXR5OiAnUG9pbnRWZWN0b3InfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlBc0xpbmVTZWdtZW50UmVsYXRpb24ucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHkubWFnbml0dWRlKCksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHtwb3NpdGlvbjogcGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eS5tYWduaXR1ZGUoKSwgZHQpKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbi5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uVmVsb2NpdHlBc0xpbmVTZWdtZW50UmVsYXRpb24oRnJlZUJvZHkgQm9keSwgUG9pbnRWZWN0b3IgVmVsb2NpdHkpIHN0YXRlcyBmb3IgQm9keTogUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbi5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcImZvciBCb2R5IFwiICsgdGhpcy5ib2R5Ll9fdG9TdHJpbmcgKyBcIjogUG9zID0gb2xkKFBvcykgKyAodmVjdG9yIFwiICsgdGhpcy52ZWxvY2l0eS5fX3RvU3RyaW5nICsgXCIpICogZHQsIHdoZXJlIGR0IGlzIHRoZSBmcmFtZSBzdGVwIHRpbWUgYW1vdW50IC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbi5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbihGcmVlQm9keS5kdW1teSh4LCB5KSwgUG9pbnRWZWN0b3IuZHVtbXkoeCwgeSkpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlZlbG9jaXR5QXNMaW5lU2VnbWVudFJlbGF0aW9uLnByb3RvdHlwZS5vbkVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XHRcblx0dGhpcy5sYXN0UG9zaXRpb24gPSBzY2FsZWRCeSh0aGlzLnBvc2l0aW9uLCAxKVxuICAgIH1cbiAgICBcbiAgICAvLyBBY2NlbGVyYXRpb24gQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uUmVsYXRpb24gPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0FjY2VsZXJhdGlvblJlbGF0aW9uKGJvZHksIGFjY2VsZXJhdGlvbikge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvblJlbGF0aW9uLCB0cnVlKVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvblJlbGF0aW9uLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIGFjY2VsZXJhdGlvbjogJ1ZlY3Rvcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25SZWxhdGlvbi5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdHJldHVybiBtYWduaXR1ZGUobWludXMocGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSksIHRoaXMudmVsb2NpdHkpKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkFjY2VsZXJhdGlvblJlbGF0aW9uLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4ge3ZlbG9jaXR5OiBwbHVzKHRoaXMubGFzdFZlbG9jaXR5LCBzY2FsZWRCeSh0aGlzLmFjY2VsZXJhdGlvbiwgZHQpKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25SZWxhdGlvbi5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uUmVsYXRpb24oRnJlZUJvZHkgQm9keSwgVmVjdG9yIEFjY2VsZXJhdGlvbikgc3RhdGVzIGZvciBCb2R5OiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKyBBY2NlbGVyYXRpb24gKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQWNjZWxlcmF0aW9uUmVsYXRpb24ucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJmb3IgQm9keSBcIiArIHRoaXMuYm9keS5fX3RvU3RyaW5nICsgXCI6IFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSArIChcIiArIHRoaXMuYWNjZWxlcmF0aW9uLnggKyBcIixcIiArICB0aGlzLmFjY2VsZXJhdGlvbi55ICsgXCIpICogZHQsIHdoZXJlIGR0IGlzIHRoZSBmcmFtZSBzdGVwIHRpbWUgYW1vdW50IC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25SZWxhdGlvbi5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25SZWxhdGlvbihGcmVlQm9keS5kdW1teSh4LCB5KSwgU2tldGNocGFkLmdlb20uVmVjdG9yLmR1bW15KHggKyA1MCwgeSArIDUwKSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5BY2NlbGVyYXRpb25SZWxhdGlvbi5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1x0XG5cdHRoaXMubGFzdFZlbG9jaXR5ID0gc2NhbGVkQnkodGhpcy52ZWxvY2l0eSwgMSlcbiAgICB9XG5cbiAgICAvLyBBaXIgUmVzaXN0YW5jZSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmljdGlvblJlbGF0aW9uID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19GcmljdGlvblJlbGF0aW9uKGJvZHksIHNjYWxlKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5zY2FsZSA9IC1zY2FsZVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmljdGlvblJlbGF0aW9uLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uRnJpY3Rpb25SZWxhdGlvbi5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzY2FsZTogJ051bWJlcicsIHZlbG9jaXR5OiAnVmVjdG9yJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyaWN0aW9uUmVsYXRpb24ucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMoc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpLCB0aGlzLnZlbG9jaXR5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmljdGlvblJlbGF0aW9uLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7dmVsb2NpdHk6IHNjYWxlZEJ5KHRoaXMubGFzdFZlbG9jaXR5LCB0aGlzLnNjYWxlKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmljdGlvblJlbGF0aW9uLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5GcmljdGlvblJlbGF0aW9uKEZyZWVCb2R5IEJvZHkpIHN0YXRlcyBmb3IgQm9keTogVmVsb2NpdHkgPSBvbGQoVmVsb2NpdHkpICogU2NhbGUgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyaWN0aW9uUmVsYXRpb24ucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJmb3IgQm9keSBcIiArIHRoaXMuYm9keS5fX3RvU3RyaW5nICsgXCI6IFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSAqIFwiICsgdGhpcy5zY2FsZSArXCIgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyaWN0aW9uUmVsYXRpb24uZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uRnJpY3Rpb25SZWxhdGlvbihTa2V0Y2hwYWQuZ2VvbS5WZWN0b3IuZHVtbXkoeCwgeSksIC4xKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkZyaWN0aW9uUmVsYXRpb24ucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RWZWxvY2l0eSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIDEpXG4gICAgfVxuXG4gICAgLy8gIEJvdW5jZSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VCZWhhdmlvciA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fQm91bmNlQmVoYXZpb3IoYm9keSwgc3VyZmFjZVAxLCBzdXJmYWNlUDIpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLmhhbGZMZW5ndGggPSBib2R5LnJhZGl1c1xuXHR0aGlzLnBvc2l0aW9uID0gYm9keS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuXHR0aGlzLnN1cmZhY2VQMSA9IHN1cmZhY2VQMVxuXHR0aGlzLnN1cmZhY2VQMiA9IHN1cmZhY2VQMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VCZWhhdmlvciwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUJlaGF2aW9yLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keScsIHN1cmZhY2VQMTogJ1BvaW50Jywgc3VyZmFjZVAyOiAnUG9pbnQnfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUJlaGF2aW9yLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHQvKlxuXHQgIHZhciB2ZWxvY2l0eSA9IHRoaXMudmVsb2NpdHlcblx0ICB2YXIgc3VyZmFjZVAxID0gdGhpcy5zdXJmYWNlUDFcblx0ICB2YXIgc3VyZmFjZVAyID0gdGhpcy5zdXJmYWNlUDJcblx0ICByZXR1cm4gdGhpcy5jb250YWN0ID8gKFxuXHQgIG1hZ25pdHVkZShtaW51cyh0aGlzLmJvdW5jZVZlbG9jaXR5LCB0aGlzLnZlbG9jaXR5KSkgXG5cdCAgKyBtYWduaXR1ZGUobWludXModGhpcy5ib3VuY2VQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbikpIFxuXHQgICkgOiAwXG5cdCovXG5cdHJldHVybiAwXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQmVoYXZpb3IucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0Lypcblx0ICB2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0ICByZXR1cm4ge3ZlbG9jaXR5OiBcblx0ICBtaW51cyhwbHVzKHRoaXMuYm91bmNlVmVsb2NpdHksIHNjYWxlZEJ5KHt4OiAwLCB5OiAtU2tldGNocGFkLnNpbXVsYXRpb24uZ30sIGR0KSksIHRoaXMudmVsb2NpdHkpLFxuXHQgIHBvc2l0aW9uOiAobWludXModGhpcy5ib3VuY2VQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbikpXG5cdCAgfVxuXHQqL1xuXHRyZXR1cm4ge31cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VCZWhhdmlvci5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQmVoYXZpb3IoRnJlZUJvZHkgQm9keSwgUG9pbnQgRW5kMSwgUG9pbnQgRW5kMikgc3RhdGVzIHRoYXQgdGhlIEJvZHkgd2l0aCBkaWFtZXRlciBMIGFuZCBwb3NpdGlvbiBQb3MgYW5kIHZlbG9jaXR5IHZlY3RvciBWZWwgaXMgZ29pbmcgdG8gYm91bmNlIG9mZiB0aGUgbGluZSB3aXRoIHR3byBlbmQgcG9pbnRzIEVuZDEgJiBFbmQyLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkJvdW5jZUJlaGF2aW9yLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiQm9keSBcIiArIHRoaXMuYm9keS5fX3RvU3RyaW5nICsgXCIgd2l0aCBkaWFtZXRlciBMIGFuZCBwb3NpdGlvbiBQb3MgYW5kIHZlbG9jaXR5IHZlY3RvciBWZWwgaXMgZ29pbmcgdG8gYm91bmNlIG9mZiB0aGUgbGluZSB3aXRoIHR3byBlbmQgcG9pbnRzIFwiICsgdGhpcy5zdXJmYWNlUDEuX190b1N0cmluZyArIFwiICYgXCIgKyB0aGlzLnN1cmZhY2VQMi5fX3RvU3RyaW5nICsgXCIuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQmVoYXZpb3IuZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQmVoYXZpb3IoRnJlZUJvZHkuZHVtbXkoeCwgeSksIFBvaW50LmR1bW15KHgsIHkpLCBQb2ludC5kdW1teSh4LCB5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Cb3VuY2VCZWhhdmlvci5wcm90b3R5cGUucHJvcG9zZU5leHRQc2V1ZG9UaW1lID0gZnVuY3Rpb24ocHNldWRvVGltZSkge1xuXHR2YXIgcmVzID0gcHNldWRvVGltZSArIFNrZXRjaHBhZC5zaW11bGF0aW9uLmNvbXB1dGVDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgdGhpcy5wb3NpdGlvbiwgdGhpcy52ZWxvY2l0eSwgdGhpcy5zdXJmYWNlUDEsIHRoaXMuc3VyZmFjZVAyKVxuXHR0aGlzLnRjb250YWN0ID0gcmVzO1xuXHRyZXR1cm4gcmVzXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQm91bmNlQmVoYXZpb3IucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvblxuXHR2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdHZhciBzdXJmYWNlUDEgPSB0aGlzLnN1cmZhY2VQMVxuXHR2YXIgc3VyZmFjZVAyID0gdGhpcy5zdXJmYWNlUDJcbiAgICAgICAgLy9Ta2V0Y2hwYWQuc2ltdWxhdGlvbi5kZXRlY3RDb250YWN0KHRoaXMuaGFsZkxlbmd0aCwgcG9zaXRpb24sIHZlbG9jaXR5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikpIHtcblx0aWYgKHRoaXMudGNvbnRhY3QgPT0gcHNldWRvVGltZSkgeyBcblx0ICAgIHRoaXMudGNvbnRhY3QgPSB1bmRlZmluZWRcblx0ICAgIHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHQgICAgdmFyIHNsb3BlID0gKHN1cmZhY2VQMi55IC0gc3VyZmFjZVAxLnkpIC8gKHN1cmZhY2VQMi54IC0gc3VyZmFjZVAxLngpXG5cdCAgICB2YXIgc3VyZmFjZUhpdFBvc1ggPSBzdXJmYWNlUDIueSA9PSBzdXJmYWNlUDEueSA/IHBvc2l0aW9uLnggOiAoKHBvc2l0aW9uLnkgLSBzdXJmYWNlUDEueSkgLyBzbG9wZSkgKyBzdXJmYWNlUDEueFxuXHQgICAgdmFyIHN1cmZhY2VIaXRQb3NZID0gc3VyZmFjZVAyLnggPT0gc3VyZmFjZVAxLnggPyBwb3NpdGlvbi55IDogKChwb3NpdGlvbi54IC0gc3VyZmFjZVAxLngpICogc2xvcGUpICsgc3VyZmFjZVAxLnlcblx0ICAgIHZhciBzdXJmYWNlQW5nbGUgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5hbmdsZShzdXJmYWNlUDEsIHN1cmZhY2VQMilcblx0ICAgIHZhciB2ZWxvY2l0eUFuZ2xlID0gU2tldGNocGFkLnNpbXVsYXRpb24uYW5nbGUoe3g6IDAsIHk6IDB9LCB2ZWxvY2l0eSlcblx0ICAgIHZhciByZWZsZWN0aW9uQW5nbGUgPSBzdXJmYWNlQW5nbGUgLSB2ZWxvY2l0eUFuZ2xlIFxuXHQgICAgdmFyIHZlbG9jaXR5TWFnbml0dWRlID0gTWF0aC5zcXJ0KCh2ZWxvY2l0eS54ICogdmVsb2NpdHkueCkgKyAodmVsb2NpdHkueSAqIHZlbG9jaXR5LnkpKVxuXHQgICAgdmFyIGFuZ2xlQyA9IE1hdGguY29zKHJlZmxlY3Rpb25BbmdsZSlcblx0ICAgIHZhciBhbmdsZVMgPSBNYXRoLnNpbihyZWZsZWN0aW9uQW5nbGUpXG5cdCAgICB2YXIgeCA9IGFuZ2xlQyAqIHZlbG9jaXR5TWFnbml0dWRlICogMVxuXHQgICAgdmFyIHkgPSBhbmdsZVMgKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIC0xXG5cdCAgICB0aGlzLmJvdW5jZVZlbG9jaXR5ID0gc2NhbGVkQnkoe3g6IHgsIHk6IHl9LCAxKVxuXHQgICAgdmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yV3Jvbmcoc3VyZmFjZVAxLCBzdXJmYWNlUDIpXG5cdCAgICB2YXIgZGVsdGFQb3NYID0gc2xvcGVWLnggKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIGR0XG5cdCAgICB2YXIgZGVsdGFQb3NZID0gc2xvcGVWLnkgKiAtdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgdGhpcy5ib3VuY2VQb3NpdGlvbiA9IHt4OiBwb3NpdGlvbi54ICsgZGVsdGFQb3NYLCB5OiBwb3NpdGlvbi55ICsgZGVsdGFQb3NZfVxuXG5cdCAgICAvLyBIQUNLIEZJWE1FPyBzZXQgdmVsb2NpdHkgYXRvbWljYWxseSByaWdodCBoZXJlISFcblx0ICAgIC8vdGhpcy5jb250YWN0ID0gdHJ1ZVxuXHQgICAgdmVsb2NpdHkueCA9IHRoaXMuYm91bmNlVmVsb2NpdHkueFxuXHQgICAgdmVsb2NpdHkueSA9IHRoaXMuYm91bmNlVmVsb2NpdHkueVxuXHQgICAgcG9zaXRpb24ueCA9IHRoaXMuYm91bmNlUG9zaXRpb24ueFxuXHQgICAgcG9zaXRpb24ueSA9IHRoaXMuYm91bmNlUG9zaXRpb24ueVxuXG5cdH0gZWxzZVxuXHQgICAgdGhpcy5jb250YWN0ID0gZmFsc2VcbiAgICB9XG5cbiAgICAvLyAgSGl0U3VyZmFjZSBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQmVoYXZpb3IgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX0hpdFN1cmZhY2VCZWhhdmlvcihib2R5LCBzdXJmYWNlUDEsIHN1cmZhY2VQMikge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMuaGFsZkxlbmd0aCA9IGJvZHkucmFkaXVzIC8gMlxuXHR0aGlzLnBvc2l0aW9uID0gYm9keS5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuXHR0aGlzLnN1cmZhY2VQMSA9IHN1cmZhY2VQMVxuXHR0aGlzLnN1cmZhY2VQMiA9IHN1cmZhY2VQMlxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQmVoYXZpb3IsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQmVoYXZpb3IucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5Jywgc3VyZmFjZVAxOiAnUG9pbnQnLCBzdXJmYWNlUDI6ICdQb2ludCd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQmVoYXZpb3IucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB0aGlzLmNvbnRhY3QgPyAoXG5cdCAgICBtYWduaXR1ZGUobWludXModGhpcy5oaXRWZWxvY2l0eSwgdGhpcy52ZWxvY2l0eSkpICsgXG5cdFx0bWFnbml0dWRlKG1pbnVzKHRoaXMuaGl0UG9zaXRpb24sIHRoaXMucG9zaXRpb24pKSBcblx0KSA6IDBcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQmVoYXZpb3IucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogdGhpcy5oaXRWZWxvY2l0eSwgcG9zaXRpb246IHRoaXMuaGl0UG9zaXRpb259XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uSGl0U3VyZmFjZUJlaGF2aW9yLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQmVoYXZpb3IoRnJlZUJvZHkgQm9keSwgUG9pbnQgRW5kMSwgUG9pbnQgRW5kMikgc3RhdGVzIHRoYXQgdGhlIEJvZHkgd2l0aCBkaWFtZXRlciBMIGFuZCBwb3NpdGlvbiBQb3MgYW5kIHZlbG9jaXR5IHZlY3RvciBWZWwgaXMgZ29pbmcgdG8gbGFuZCBhbmQgc3RheSBvbiB0aGUgbGluZSB3aXRoIHR3byBlbmQgcG9pbnRzIEVuZDEgJiBFbmQyLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VCZWhhdmlvci5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIkJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiIHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIHN0YXkgb24gdGhlIGxpbmUgd2l0aCB0d28gZW5kIHBvaW50cyBcIiArIHRoaXMuc3VyZmFjZVAxLl9fdG9TdHJpbmcgKyBcIiAmIFwiICsgdGhpcy5zdXJmYWNlUDIuX190b1N0cmluZyArIFwiLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkhpdFN1cmZhY2VCZWhhdmlvci5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQmVoYXZpb3IoRnJlZUJvZHkuZHVtbXkoeCwgeSksIFBvaW50LmR1bW15KHgsIHkpLCBQb2ludC5kdW1teSh4LCB5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5IaXRTdXJmYWNlQmVoYXZpb3IucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvblxuXHR2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdHZhciBzdXJmYWNlUDEgPSB0aGlzLnN1cmZhY2VQMVxuXHR2YXIgc3VyZmFjZVAyID0gdGhpcy5zdXJmYWNlUDJcblx0aWYgKFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCBwb3NpdGlvbiwgdmVsb2NpdHksIHN1cmZhY2VQMSwgc3VyZmFjZVAyKSkge1xuXHQgICAgdGhpcy5jb250YWN0ID0gdHJ1ZVxuXHQgICAgdmFyIGR0ID0gcHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lXG5cdCAgICB2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3JXcm9uZyhzdXJmYWNlUDEsIHN1cmZhY2VQMilcblx0ICAgIHRoaXMuaGl0VmVsb2NpdHkgPSBzY2FsZWRCeSh7eDogMCwgeTogLVNrZXRjaHBhZC5zaW11bGF0aW9uLmd9LCBkdClcblx0ICAgIHZhciB2ZWxvY2l0eU1hZ25pdHVkZSA9IE1hdGguc3FydCgodmVsb2NpdHkueCAqIHZlbG9jaXR5LngpICsgKHZlbG9jaXR5LnkgKiB2ZWxvY2l0eS55KSlcblx0ICAgIGRlbHRhUG9zWCA9IHNsb3BlVi54ICogdmVsb2NpdHlNYWduaXR1ZGUgKiBkdFxuXHQgICAgZGVsdGFQb3NZID0gc2xvcGVWLnkgKiB2ZWxvY2l0eU1hZ25pdHVkZSAqIGR0XG5cdCAgICB0aGlzLmhpdFBvc2l0aW9uID0ge3g6IHBvc2l0aW9uLnggKyBkZWx0YVBvc1gsIHk6IHBvc2l0aW9uLnkgKyBkZWx0YVBvc1l9XG5cdH0gZWxzZVxuXHQgICAgdGhpcy5jb250YWN0ID0gZmFsc2VcbiAgICB9XG4gICAgXG4gICAgLy8gQ29udmV5b3IgQmVsdCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRCZWhhdmlvciA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fQ29udmV5b3JCZWx0QmVoYXZpb3IoYm9keSwgYmVsdCkge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMuaGFsZkxlbmd0aCA9IGJvZHkucmFkaXVzXG5cdHRoaXMucG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSBib2R5LnZlbG9jaXR5XG5cdHRoaXMuYmVsdCA9IGJlbHRcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0QmVoYXZpb3IsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRCZWhhdmlvci5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknLCBiZWx0OiAnQmVsdCd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRCZWhhdmlvci5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0Ly92YXIgYmVsdCA9IHRoaXMuYmVsdFxuXHQvL3ZhciBiZWx0UDEgPSBiZWx0LnBvc2l0aW9uMVxuXHQvL3ZhciBiZWx0UDIgPSBiZWx0LnBvc2l0aW9uMlxuXHQvL3JldHVybiAoU2tldGNocGFkLnNpbXVsYXRpb24uZGV0ZWN0Q29udGFjdCh0aGlzLmhhbGZMZW5ndGgsIHRoaXMucG9zaXRpb24sIHRoaXMudmVsb2NpdHksIGJlbHRQMSwgYmVsdFAyKSkgPyAxIDogMFx0XG5cdHJldHVybiB0aGlzLmNvbnRhY3QgPyBtYWduaXR1ZGUobWludXModGhpcy50YXJnZXRWZWxvY2l0eSwgdGhpcy52ZWxvY2l0eSkpIDogMFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdEJlaGF2aW9yLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7dmVsb2NpdHk6IHRoaXMudGFyZ2V0VmVsb2NpdHl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0QmVoYXZpb3IuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLkNvbnZleW9yQmVsdEJlaGF2aW9yKE51bWJlciBMLCBGcmVlQm9keSBCb2R5LCBDb252ZXlvckJlbHQgQmVsdCkgc3RhdGVzIHRoYXQgdGhlIGJvZHkgd2l0aCBkaWFtZXRlciBMIGFuZCBwb3NpdGlvbiBQb3MgYW5kIHZlbG9jaXR5IHZlY3RvciBWZWwgaXMgZ29pbmcgdG8gbGFuZCBhbmQgbW92ZSBiYXNlZCBvbiB0aGUgY29udmV5b3IgYmVsdCBCZWx0J3MgdmVsb2NpdHkuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uQ29udmV5b3JCZWx0QmVoYXZpb3IucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJCb2R5XCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiIHdpdGggZGlhbWV0ZXIgTCBhbmQgcG9zaXRpb24gUG9zIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsIGlzIGdvaW5nIHRvIGxhbmQgYW5kIG1vdmUgYmFzZWQgb24gdGhlIGNvbnZleW9yIGJlbHQgQmVsdCBcIiArIHRoaXMuYmVsdC5fX3RvU3RyaW5nICsgXCIncyB2ZWxvY2l0eS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRCZWhhdmlvci5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRCZWhhdmlvcihGcmVlQm9keS5kdW1teSh4LCB5KSwgQmVsdC5kdW1teSh4LCB5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5Db252ZXlvckJlbHRCZWhhdmlvci5wcm90b3R5cGUub25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5XG5cdHZhciBiZWx0ID0gdGhpcy5iZWx0XG5cdHZhciBiZWx0UDEgPSBiZWx0LnBvc2l0aW9uMVxuXHR2YXIgYmVsdFAyID0gYmVsdC5wb3NpdGlvbjJcblx0dmFyIGJlbHRTcGVlZCA9IGJlbHQuc3BlZWRcblx0aWYgKFNrZXRjaHBhZC5zaW11bGF0aW9uLmRldGVjdENvbnRhY3QodGhpcy5oYWxmTGVuZ3RoLCB0aGlzLnBvc2l0aW9uLCB2ZWxvY2l0eSwgYmVsdFAxLCBiZWx0UDIpKSB7XG5cdCAgICB0aGlzLmNvbnRhY3QgPSB0cnVlXG5cdCAgICB2YXIgc2xvcGVWID0gU2tldGNocGFkLnNpbXVsYXRpb24uc2xvcGVWZWN0b3JXcm9uZyhiZWx0UDEsIGJlbHRQMilcblx0ICAgIHRoaXMudGFyZ2V0VmVsb2NpdHkgPSB7eDogdmVsb2NpdHkueCArIChzbG9wZVYueSAqIGJlbHRTcGVlZCksIHk6IHZlbG9jaXR5LnkgKyAoc2xvcGVWLnggKiBiZWx0U3BlZWQpfVxuXHR9IGVsc2Vcblx0ICAgIHRoaXMuY29udGFjdCA9IGZhbHNlXG4gICAgfVxuICAgIFxuICAgIC8vIE5vT3ZlcmxhcCBDb25zdHJhaW50XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5QYWlyT3ZlcmxhcEF2b2lkYW5jZSA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbl9fUGFpck92ZXJsYXBBdm9pZGFuY2UoYm9keTEsIGJvZHkyKSB7XG5cdHRoaXMuYm9keTEgPSBib2R5MVxuXHR0aGlzLmxlbmd0aDEgPSBib2R5MS5yYWRpdXMgLyAyXG5cdHRoaXMucG9zaXRpb24xID0gYm9keTEucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eTEgPSBib2R5MS52ZWxvY2l0eVxuXHR0aGlzLmJvZHkyID0gYm9keTJcblx0dGhpcy5sZW5ndGgyID0gYm9keTIucmFkaXVzIC8gMlxuXHR0aGlzLnBvc2l0aW9uMiA9IGJvZHkyLnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkyID0gYm9keTIudmVsb2NpdHlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uUGFpck92ZXJsYXBBdm9pZGFuY2UsIHRydWUpXG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uUGFpck92ZXJsYXBBdm9pZGFuY2UucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTE6ICdGcmVlQm9keScsIGJvZHkyOiAnRnJlZUJvZHknfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uUGFpck92ZXJsYXBBdm9pZGFuY2UucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsZW5ndGgxID0gdGhpcy5sZW5ndGgxXG5cdHZhciBwb3NpdGlvbjEgPSB0aGlzLnBvc2l0aW9uMVxuXHR2YXIgdmVsb2NpdHkxID0gdGhpcy52ZWxvY2l0eTFcblx0dmFyIGxlbmd0aDIgPSB0aGlzLmxlbmd0aDJcblx0dmFyIHBvc2l0aW9uMiA9IHRoaXMucG9zaXRpb24yXG5cdHZhciBwMXggPSBwb3NpdGlvbjEueCwgcDF5ID0gcG9zaXRpb24xLnlcblx0dmFyIHAyeCA9IHBvc2l0aW9uMi54LCBwMnkgPSBwb3NpdGlvbjIueVxuXHRyZXR1cm4gKChwMXggPiBwMnggLSBsZW5ndGgyIC8gMiAmJiBwMXggPCBwMnggKyBsZW5ndGgyKSAmJlxuXHRcdChwMXkgPiBwMnkgLSBsZW5ndGgyIC8gMiAmJiBwMXkgPCBwMnkgKyBsZW5ndGgyKSkgPyAxIDogMFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlBhaXJPdmVybGFwQXZvaWRhbmNlLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsZW5ndGgxID0gdGhpcy5sZW5ndGgxXG5cdHZhciBwb3NpdGlvbjEgPSB0aGlzLnBvc2l0aW9uMVxuXHR2YXIgdmVsb2NpdHkxID0gdGhpcy52ZWxvY2l0eTFcblx0dmFyIGxlbmd0aDIgPSB0aGlzLmxlbmd0aDJcblx0dmFyIHBvc2l0aW9uMiA9IHRoaXMucG9zaXRpb24yXG5cdHZhciBwMXggPSBwb3NpdGlvbjEueFxuXHR2YXIgcDJ4ID0gcG9zaXRpb24yLnhcblx0dmFyIHNvbG4gPSBwMXggPiBwMnggPyB7cG9zaXRpb24yOiB7eDogcDF4IC0gKGxlbmd0aDIpfX0gOiB7cG9zaXRpb24xOiB7eDogcDJ4IC0gKGxlbmd0aDEpfX1cblx0cmV0dXJuIHNvbG5cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5QYWlyT3ZlcmxhcEF2b2lkYW5jZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24uUGFpck92ZXJsYXBBdm9pZGFuY2UoRnJlZUJvZHkgQm9keTEsIEZyZWVCb2R5IEJvZHkxKSBzdGF0ZXMgdGhhdCB0aGUgQm9keTEgd2l0aCBkaWFtZXRlciBMMSBhbmQgcG9zaXRpb24gUG9zMSBhbmQgdmVsb2NpdHkgdmVjdG9yIFZlbDEgYW5kIHRoZSBCb2R5MiB3aXRoIGRpYW1ldGVyIEwyIGFuZCBwb3NpdGlvbiBQb3MyIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsMiB3aWxsIHB1c2ggZWFjaCBvdGhlciBpZiB0b3VjaGluZy5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5QYWlyT3ZlcmxhcEF2b2lkYW5jZS5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIkJvZHkgXCIgKyB0aGlzLmJvZHkxLl9fdG9TdHJpbmcgKyBcIiB3aXRoIGRpYW1ldGVyIEwxIGFuZCBwb3NpdGlvbiBQb3MxIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsMSBhbmQgdGhlIEJvZHkgXCIgKyB0aGlzLmJvZHkyLl9fdG9TdHJpbmcgKyBcIiB3aXRoIGRpYW1ldGVyIEwyIGFuZCBwb3NpdGlvbiBQb3MyIGFuZCB2ZWxvY2l0eSB2ZWN0b3IgVmVsMiB3aWxsIHB1c2ggZWFjaCBvdGhlciBpZiB0b3VjaGluZy5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5QYWlyT3ZlcmxhcEF2b2lkYW5jZS5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5QYWlyT3ZlcmxhcEF2b2lkYW5jZShGcmVlQm9keS5kdW1teSh4LCB5KSwgRnJlZUJvZHkuZHVtbXkoeCArMTAwLCB5ICsgMTAwKSlcbiAgICB9XG5cbiAgICAvLyAgU3ByaW5nIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ2luZXNzID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uX19TcHJpbmdpbmVzcyhib2R5MSwgYm9keTIsIHNwcmluZykge1xuXHR0aGlzLmJvZHkxID0gYm9keTFcblx0dGhpcy5ib2R5MiA9IGJvZHkyXG5cdHRoaXMucG9zaXRpb24xID0gYm9keTEucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eTEgPSBib2R5MS52ZWxvY2l0eVxuXHR0aGlzLmFjY2VsZXJhdGlvbjEgPSBib2R5MS5hY2NlbGVyYXRpb25cblx0dGhpcy5tYXNzMSA9IGJvZHkxLm1hc3Ncblx0dGhpcy5wb3NpdGlvbjIgPSBib2R5Mi5wb3NpdGlvblxuXHR0aGlzLnZlbG9jaXR5MiA9IGJvZHkyLnZlbG9jaXR5XG5cdHRoaXMuYWNjZWxlcmF0aW9uMiA9IGJvZHkyLmFjY2VsZXJhdGlvblxuXHR0aGlzLm1hc3MyID0gYm9keTIubWFzc1xuXHR0aGlzLnNwcmluZyA9IHNwcmluZ1xuXHR0aGlzLl9sYXN0VmVsb2NpdGllcyA9IFt1bmRlZmluZWQsIHVuZGVmaW5lZF1cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5naW5lc3MsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdpbmVzcy5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5MTogJ0ZyZWVCb2R5JywgYm9keTI6ICdGcmVlQm9keScsIHNwcmluZzogJ1NwcmluZyd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdpbmVzcy5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dmFyIHNwcmluZyA9IHRoaXMuc3ByaW5nXG5cdGlmIChzcHJpbmcudG9ybikge1xuXHQgICAgcmV0dXJuIDBcblx0fVxuXHR2YXIgcG9zaXRpb25zID0gW3RoaXMucG9zaXRpb24xLCB0aGlzLnBvc2l0aW9uMl1cblx0dmFyIG1hc3NlcyA9IFt0aGlzLm1hc3MxLCB0aGlzLm1hc3MyXVxuXHR2YXIgdmVsb2NpdGllcyA9IFt0aGlzLnZlbG9jaXR5MSwgdGhpcy52ZWxvY2l0eTJdXG5cdHZhciBhY2NlbGVyYXRpb25zID0gW3RoaXMuYWNjZWxlcmF0aW9uMSwgdGhpcy5hY2NlbGVyYXRpb24yXVxuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0dmFyIGVyciA9IDBcblx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gMTsgaSsrKSB7XG5cdCAgICB2YXIgaiA9IChpICsgMSkgJSAyXG5cdCAgICB2YXIgbWFzcyA9IG1hc3Nlc1tqXVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFxuXHRcdHZhciBjdXJyQWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3RvcilcdFx0XG5cdFx0dmFyIHN0cmV0Y2hMZW4gPSAgc3ByaW5nQ3VyckxlbiAtIHNwcmluZy5sZW5ndGhcblx0XHR2YXIgbmV3QWNjZWxlcmF0aW9uTWFnID0gc3ByaW5nLmsgKiBzdHJldGNoTGVuIC8gbWFzc1xuXHRcdHZhciBhY2MgPSBzY2FsZWRCeShub3JtYWxpemVkKHZlY3RvciksIC1uZXdBY2NlbGVyYXRpb25NYWcpXG5cdFx0ZXJyICs9IG1hZ25pdHVkZShtaW51cyhhY2MsIGN1cnJBY2NlbGVyYXRpb24pKVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiBlcnJcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdpbmVzcy5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgc29sbiA9IHt9XG5cdHZhciBzcHJpbmcgPSB0aGlzLnNwcmluZ1xuXHR2YXIgcG9zaXRpb25zID0gW3RoaXMucG9zaXRpb24xLCB0aGlzLnBvc2l0aW9uMl1cblx0dmFyIG1hc3NlcyA9IFt0aGlzLm1hc3MxLCB0aGlzLm1hc3MyXVxuXHR2YXIgdmVsb2NpdGllcyA9IFt0aGlzLnZlbG9jaXR5MSwgdGhpcy52ZWxvY2l0eTJdXG5cdHZhciBhY2NlbGVyYXRpb25zID0gW3RoaXMuYWNjZWxlcmF0aW9uMSwgdGhpcy5hY2NlbGVyYXRpb24yXVxuXHRmb3IgKHZhciBpID0gMDsgaSA8PSAxOyBpKyspIHtcblx0ICAgIHZhciBqID0gKGkgKyAxKSAlIDJcblx0ICAgIHZhciBtYXNzID0gbWFzc2VzW2pdXG5cdCAgICB2YXIgYWNjLCB0b3JuID0gZmFsc2Vcblx0ICAgIGlmIChtYXNzID4gMCkgeyAvLyBpZiBub3QgYW5jaG9yZWRcblx0XHR2YXIgcG9zaXRpb24xID0gcG9zaXRpb25zW2ldXG5cdFx0dmFyIHBvc2l0aW9uMiA9IHBvc2l0aW9uc1tqXVxuXHRcdHZhciB2ZWN0b3IgPSBtaW51cyhwb3NpdGlvbjIsIHBvc2l0aW9uMSlcblx0XHR2YXIgc3ByaW5nQ3VyckxlbiA9IG1hZ25pdHVkZSh2ZWN0b3IpXG5cdFx0dmFyIHN0cmV0Y2hMZW4gPSAgc3ByaW5nQ3VyckxlbiAtIHNwcmluZy5sZW5ndGhcblx0XHQvLyBpZiBub3QgdG9ybiBhcGFydC4uLlxuXHRcdHRvcm4gPSBzdHJldGNoTGVuID4gc3ByaW5nLnRlYXJQb2ludEFtb3VudFxuXHRcdGlmICghdG9ybikge1xuXHRcdCAgICB2YXIgbmV3QWNjZWxlcmF0aW9uTWFnID0gc3ByaW5nLmsgKiBzdHJldGNoTGVuIC8gbWFzc1xuXHRcdCAgICBhY2MgPSBzY2FsZWRCeShub3JtYWxpemVkKHZlY3RvciksIC1uZXdBY2NlbGVyYXRpb25NYWcpXG5cdFx0fSBcblx0ICAgIH1cblx0ICAgIGlmICh0b3JuKVxuXHRcdHNvbG5bJ3NwcmluZyddID0ge3Rvcm46IHRydWV9XG5cdCAgICBpZiAoYWNjKVxuXHRcdHNvbG5bJ2FjY2VsZXJhdGlvbicgKyAoaisxKV0gPSBhY2Ncblx0fVx0XG5cdHJldHVybiBzb2xuXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5naW5lc3MuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ2luZXNzKEZyZWVCb2R5IEJvZHkxLCBGcmVlQm9keSBCb2R5MiwgU3ByaW5nIFMpIHN0YXRlcyB0aGF0IHNwcmluZyBTIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHR3byBib2RpZXMgQm9keTEgYW5kIEJvZHkyLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLlNwcmluZ2luZXNzLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwic3ByaW5nIFwiICsgdGhpcy5zcHJpbmcuX190b1N0cmluZyArIFwiIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHR3byBib2RpZXMgXCIgKyB0aGlzLmJvZHkxLl9fdG9TdHJpbmcgKyBcIiBhbmQgXCIgKyB0aGlzLmJvZHkyLl9fdG9TdHJpbmcgKyBcIi5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdpbmVzcy5kdW1teSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIG5ldyBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5TcHJpbmdpbmVzcyhGcmVlQm9keS5kdW1teSh4LCB5KSwgRnJlZUJvZHkuZHVtbXkoeCsxMDAsIHkrMTAwKSwgU2tldGNocGFkLnNpbXVsYXRpb24uU3ByaW5nLmR1bW15KHgsIHkpKVxuICAgIH1cblxuICAgIC8vICBPcmJpdGFsTW90aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb24gPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb25fX09yYml0YWxNb3Rpb24oc3VuLCBtb29uLCBkaXN0YW5jZURvd25zY2FsZSkge1xuXHR0aGlzLnN1biA9IHN1blxuXHR0aGlzLm1vb24gPSBtb29uXG5cdHRoaXMuYWNjZWxlcmF0aW9uID0gbW9vbi5hY2NlbGVyYXRpb25cblx0dGhpcy5kaXN0YW5jZURvd25zY2FsZSA9IChkaXN0YW5jZURvd25zY2FsZSB8fCAoMWU5IC8gMikpXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb24sIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3N1bjogJ0ZyZWVCb2R5JywgbW9vbjogJ0ZyZWVCb2R5J31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb24ucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHRoaXMuX3RhcmdldEFjY2VsZXJhdGlvbiA9IHRoaXMuY3VycmVudEdyYXZpdHlBY2NlbGVyYXRpb24oKVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHRoaXMuX3RhcmdldEFjY2VsZXJhdGlvbiwgdGhpcy5hY2NlbGVyYXRpb24pKVx0XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge2FjY2VsZXJhdGlvbjogdGhpcy5fdGFyZ2V0QWNjZWxlcmF0aW9ufVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb24uZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb24oRnJlZUJvZHkgU3VuLCBGcmVlQm9keSBNb29uKSBzdGF0ZXMgdGhhdCBNb29uIGJvZHkgaXMgb3JiaXRpbmcgYXJvdW5kIFN1biBib2R5IGFjY29yZGluZyB0byBzaW1wbGUgb3JiaXRhbCBtb3Rpb24gZm9ybXVsYS5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5PcmJpdGFsTW90aW9uLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiTW9vbiBib2R5IFwiICsgdGhpcy5tb29uLl9fdG9TdHJpbmcgKyBcIiBpcyBvcmJpdGluZyBhcm91bmQgU3VuIGJvZHkgXCIgKyB0aGlzLnN1bi5fX3RvU3RyaW5nICsgXCIgYWNjb3JkaW5nIHRvIHNpbXBsZSBvcmJpdGFsIG1vdGlvbiBmb3JtdWxhLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb24uZHVtbXkgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBuZXcgU2tldGNocGFkLnNpbXVsYXRpb24uT3JiaXRhbE1vdGlvbihGcmVlQm9keS5kdW1teSh4LCB5KSwgRnJlZUJvZHkuZHVtbXkoeCArIDIwMCwgeSkpXG4gICAgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uLk9yYml0YWxNb3Rpb24ucHJvdG90eXBlLmN1cnJlbnRHcmF2aXR5QWNjZWxlcmF0aW9uID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwMSA9IHRoaXMubW9vbi5wb3NpdGlvbiwgcDIgPSB0aGlzLnN1bi5wb3NpdGlvblxuXHR2YXIgZGlzdDAgPSBkaXN0YW5jZShwMSwgcDIpXG5cdHZhciBkaXN0ID0gZGlzdDAgKiB0aGlzLmRpc3RhbmNlRG93bnNjYWxlXHRcblx0dmFyIGFNYWcwID0gKFNrZXRjaHBhZC5zaW11bGF0aW9uLkcgKiB0aGlzLnN1bi5tYXNzKSAvIChkaXN0ICogZGlzdClcblx0dmFyIGFNYWcgPSBhTWFnMCAvIHRoaXMuZGlzdGFuY2VEb3duc2NhbGVcblx0dmFyIHNsb3BlViA9IFNrZXRjaHBhZC5zaW11bGF0aW9uLnNsb3BlVmVjdG9yKHAxLCBwMilcblx0cmV0dXJuIHt4OiBzbG9wZVYueCAqIGFNYWcsIHk6IHNsb3BlVi55ICogYU1hZ31cbiAgICB9XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsU2ltdWxhdGlvbkNvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsM0RHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpIHtcblxuICAgIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGdlb21ldHJpYyBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gICAgLy8gb2JqZWN0cyB0aGF0IGhhdmUgeCBhbmQgeSBwcm9wZXJ0aWVzLiBPdGhlciBwcm9wZXJ0aWVzIGFyZSBpZ25vcmVkLlxuXG4gICAgU2tldGNocGFkLmdlb20zZCA9IHt9XG5cbiAgICB2YXIgc3F1YXJlID0gU2tldGNocGFkLmdlb20uc3F1YXJlXG5cbiAgICBmdW5jdGlvbiBwbHVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggKyBwMi54LCB5OiBwMS55ICsgcDIueSwgejogcDEueiArIHAyLnp9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIG1pbnVzKHAxLCBwMikge1xuXHRyZXR1cm4ge3g6IHAxLnggLSBwMi54LCB5OiBwMS55IC0gcDIueSwgejogcDEueiAtIHAyLnp9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbGVkQnkocCwgbSkge1xuXHRyZXR1cm4ge3g6IHAueCAqIG0sIHk6IHAueSAqIG0sIHo6IHAueiAqIG19XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29weShwKSB7XG5cdHJldHVybiBzY2FsZWRCeShwLCAxKVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBtaWRwb2ludChwMSwgcDIpIHtcblx0cmV0dXJuIHNjYWxlZEJ5KHBsdXMocDEsIHAyKSwgMC41KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hZ25pdHVkZShwKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAueCkgKyBzcXVhcmUocC55KSArIHNxdWFyZShwLnopKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZWQocCkge1xuXHR2YXIgbSA9IG1hZ25pdHVkZShwKVxuXHRyZXR1cm4gbSA+IDAgPyBzY2FsZWRCeShwLCAxIC8gbSkgOiBwXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzdGFuY2UocDEsIHAyKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAxLnggLSBwMi54KSArIHNxdWFyZShwMS55IC0gcDIueSkgKyBzcXVhcmUocDEueiAtIHAyLnopKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJvdGF0ZWRCeShwLCBkVGhldGEpIHtcblx0dmFyIGMgPSBNYXRoLmNvcyhkVGhldGEpXG5cdHZhciBzID0gTWF0aC5zaW4oZFRoZXRhKVxuXHRyZXR1cm4ge3g6IGMqcC54IC0gcypwLnksIHk6IHMqcC54ICsgYypwLnksIHo6IHAuen1cbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gcm90YXRlZEFyb3VuZChwLCBkVGhldGEsIGF4aXMpIHtcblx0cmV0dXJuIHBsdXMoYXhpcywgcm90YXRlZEJ5KG1pbnVzKHAsIGF4aXMpLCBkVGhldGEpKVxuXHQvKlxuXHQvLyByb3RhdGUgdGhlIHBvaW50ICh4LHkseikgYWJvdXQgdGhlIHZlY3RvciDin6h1LHYsd+KfqSBieSB0aGUgYW5nbGUgzrggKGFyb3VuZCBvcmlnaW4/KVxuXHR2YXIgeCA9IHAueCwgeSA9IHAueSwgeiA9IHAueiwgdSA9IGF4aXMueCwgdiA9IGF4aXMueSwgdyA9IGF4aXMuelxuXHR2YXIgYyA9IE1hdGguY29zKGRUaGV0YSksIHMgPSBNYXRoLnNpbihkVGhldGEpXG5cdHZhciBvbmUgPSAodSAqIHgpICsgKHYgKiB5KSArICh3ICogeiksIHR3byA9ICh1ICogdSkgKyAodiAqIHYpICsgKHcgKiB3KSwgdGhyZWUgPSBNYXRoLnNxcnQodHdvKVxuXHRyZXR1cm4ge3g6ICgodSAqIG9uZSAqICgxIC0gYykpICArICh0d28gKiB4ICogYykgKyAodGhyZWUgKiBzICogKCh2ICogeikgLSAodyAqIHkpKSkpIC8gdHdvLFxuXHR5OiAoKHYgKiBvbmUgKiAoMSAtIGMpKSAgKyAodHdvICogeSAqIGMpICsgKHRocmVlICogcyAqICgodyAqIHgpIC0gKHUgKiB6KSkpKSAvIHR3byxcbiBcdHo6ICgodyAqIG9uZSAqICgxIC0gYykpICArICh0d28gKiB6ICogYykgKyAodGhyZWUgKiBzICogKCh1ICogeSkgLSAodiAqIHgpKSkpIC8gdHdvfVxuXHQqL1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBzZXREZWx0YShkLCBwLCBzY2FsZSkge1xuXHRkLnggPSBwLnggKiBzY2FsZVxuXHRkLnkgPSBwLnkgKiBzY2FsZVxuXHRkLnogPSBwLnogKiBzY2FsZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvdFByb2R1Y3QodjEsIHYyKSB7XG5cdHJldHVybiAodjEueCAqIHYyLngpICsgKHYxLnkgKiB2Mi55KSArICh2MS56ICogdjIueilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcm9zc1Byb2R1Y3QodjEsIHYyKSB7XG5cdHZhciBhID0gbmV3IFRIUkVFLlZlY3RvcjModjEueCwgdjEueSwgdjEueilcblx0dmFyIGIgPSBuZXcgVEhSRUUuVmVjdG9yMyh2Mi54LCB2Mi55LCB2Mi56KVxuXHR2YXIgYyA9IG5ldyBUSFJFRS5WZWN0b3IzKClcblx0Yy5jcm9zc1ZlY3RvcnMoIGEsIGIgKVxuXHRyZXR1cm4gbmV3IFBvaW50M0QoYy54LCBjLnksIGMueilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhbmdsZSh2MSwgdjIsIGF4aXMpIHtcblx0Ly92YXIgbGFuZ2xlID0gTWF0aC5hY29zKE1hdGgubWluKDEsIGRvdFByb2R1Y3Qobm9ybWFsaXplZCh2MSksIG5vcm1hbGl6ZWQodjIpKSkpXG5cdHZhciB2MW0gPSBTa2V0Y2hwYWQuZ2VvbTNkLm1hZ25pdHVkZSh2MSksIHYybSA9IFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlKHYyKVxuXHR2YXIgcHJvZDIgPSAodjFtICogdjJtKVxuXHRpZiAocHJvZDIgPT0gMClcblx0ICAgIGxhbmdsZSA9IDBcblx0ZWxzZSB7XG5cdCAgICB2YXIgcHJvZDEgPSBkb3RQcm9kdWN0KHYxLCB2Milcblx0ICAgIHZhciBkaXYgPSBNYXRoLm1pbigxLCBwcm9kMSAvIHByb2QyKVxuXHQgICAgbGFuZ2xlID0gTWF0aC5hY29zKGRpdilcblx0ICAgIHZhciBjcm9zcyA9IGNyb3NzUHJvZHVjdCh2MSwgdjIpXG5cdCAgICB2YXIgZG90ID0gZG90UHJvZHVjdChheGlzLCBjcm9zcylcblx0ICAgIGlmIChkb3QgPiAwKSAvLyBPciA+IDBcblx0XHRsYW5nbGUgPSAtbGFuZ2xlXG5cdH1cdFxuXHRyZXR1cm4gbGFuZ2xlXG4gICAgfVxuICAgICAgICBcbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLnBsdXMgPSBwbHVzXG4gICAgU2tldGNocGFkLmdlb20zZC5taW51cyA9IG1pbnVzXG4gICAgU2tldGNocGFkLmdlb20zZC5zY2FsZWRCeSA9IHNjYWxlZEJ5XG4gICAgU2tldGNocGFkLmdlb20zZC5jb3B5ID0gY29weVxuICAgIFNrZXRjaHBhZC5nZW9tM2QubWlkcG9pbnQgPSBtaWRwb2ludFxuICAgIFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlID0gbWFnbml0dWRlXG4gICAgU2tldGNocGFkLmdlb20zZC5ub3JtYWxpemVkID0gbm9ybWFsaXplZFxuICAgIFNrZXRjaHBhZC5nZW9tM2QuZGlzdGFuY2UgPSBkaXN0YW5jZVxuICAgIFNrZXRjaHBhZC5nZW9tM2Qucm90YXRlZEJ5ID0gcm90YXRlZEJ5XG4gICAgU2tldGNocGFkLmdlb20zZC5hbmdsZSA9IGFuZ2xlXG4gICAgU2tldGNocGFkLmdlb20zZC5kb3RQcm9kdWN0ID0gZG90UHJvZHVjdFxuICAgIFNrZXRjaHBhZC5nZW9tM2QuY3Jvc3NQcm9kdWN0ID0gY3Jvc3NQcm9kdWN0XG4gICAgU2tldGNocGFkLmdlb20zZC5yb3RhdGVkQXJvdW5kID0gcm90YXRlZEFyb3VuZFxuICAgIFNrZXRjaHBhZC5nZW9tM2Quc2V0RGVsdGEgPSBzZXREZWx0YVxuXG4gICAgLy8gQ29vcmRpbmF0ZSBDb25zdHJhaW50LCBpLmUuLCBcIkkgd2FudCB0aGlzIHBvaW50IHRvIGJlIGhlcmVcIi5cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuRml4ZWRDb29yZGluYXRlID0gZnVuY3Rpb24gU2tldGNocGFkX19nZW9tM19fRml4ZWRDb29yZGluYXRlKHAsIHgsIHksIHopIHtcblx0dGhpcy5wID0gcFxuXHR0aGlzLmMgPSBuZXcgUG9pbnQzRCh4LCB5LCB6KVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuZ2VvbTNkLkZpeGVkQ29vcmRpbmF0ZSwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuRml4ZWRDb29yZGluYXRlLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3A6ICdQb2ludDNEJywgYzogJ1BvaW50M0QnfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5GaXhlZENvb3JkaW5hdGUucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXModGhpcy5jLCB0aGlzLnApKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuRml4ZWRDb29yZGluYXRlLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiB7cDoge3g6IHRoaXMuYy54LCB5OiB0aGlzLmMueSwgejogdGhpcy5jLnp9fVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuRml4ZWRDb29yZGluYXRlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuZ2VvbTNkLkZpeGVkQ29vcmRpbmF0ZShQb2ludCBQLCBOdW1iZXIgWCwgTnVtYmVyIFksIE51bWJlciBaKSBzdGF0ZXMgdGhhdCBwb2ludCBQIHNob3VsZCBzdGF5IGF0IGNvb3JkaW5hdGUgKFgsIFksIFopLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuRml4ZWRDb29yZGluYXRlLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwicG9pbnQgXCIgKyB0aGlzLnAuX190b1N0cmluZyArIFwiIHNob3VsZCBzdGF5IGF0IGNvb3JkaW5hdGUgKFwiICsgdGhpcy5jLnggKyBcIiwgXCIgKyB0aGlzLmMueSArIFwiLCBcIiArIHRoaXMuYy56ICsgXCIpLlwiIH1cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuRml4ZWRDb29yZGluYXRlLnByb3RvdHlwZS5lZmZlY3RzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbe29iajogdGhpcy5wLCBwcm9wczogWyd4JywgJ3knLCAneiddfV1cbiAgICB9XG5cbiAgICAvLyBMZW5ndGggY29uc3RyYWludCAtIG1haW50YWlucyBkaXN0YW5jZSBiZXR3ZWVuIFAxIGFuZCBQMiBhdCBMLlxuXG4gICAgU2tldGNocGFkLmdlb20zZC5GaXhlZExlbmd0aCA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fZ2VvbTNkX19GaXhlZExlbmd0aChwMSwgcDIsIGwpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLmwgPSBsXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tM2QuRml4ZWRMZW5ndGgsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkZpeGVkTGVuZ3RoLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQzRCcsIHAyOiAnUG9pbnQzRCcsIGw6ICdOdW1iZXInfVxuICAgIFxuICAgIFNrZXRjaHBhZC5nZW9tM2QuRml4ZWRMZW5ndGgucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBsMTIgPSBtYWduaXR1ZGUobWludXModGhpcy5wMSwgdGhpcy5wMikpXG5cdHJldHVybiBsMTIgLSB0aGlzLmxcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLkZpeGVkTGVuZ3RoLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBwMSA9IHRoaXMucDEsIHAyID0gdGhpcy5wMlxuXHR2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHAxLCBwMikpXG5cdGlmIChsMTIgPT0gMCkge1xuXHQgICAgcDEgPSBwbHVzKHAxLCB7eDogMC4xLCB5OiAwLCB6OiAwfSlcblx0ICAgIHAyID0gcGx1cyhwMiwge3g6IC0wLjEsIHk6IDAsIHo6IDB9KVxuXHR9XG5cdHZhciBkZWx0YSA9IChsMTIgLSB0aGlzLmwpIC8gMlxuXHR2YXIgZTEyID0gc2NhbGVkQnkoU2tldGNocGFkLmdlb20zZC5ub3JtYWxpemVkKG1pbnVzKHAyLCBwMSkpLCBkZWx0YSlcblx0cmV0dXJuIHtwMTogcGx1cyh0aGlzLnAxLCBlMTIpLCBwMjogcGx1cyh0aGlzLnAyLCBzY2FsZWRCeShlMTIsIC0xKSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5GaXhlZExlbmd0aC5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20zZC5GaXhlZExlbmd0aChQb2ludDNEIFAxLCBQb2ludDNEIFAyLCBOdW1iZXIgTCkgc2F5cyBwb2ludHMgUDEgYW5kIFAyIGFsd2F5cyBtYWludGFpbiBhIGRpc3RhbmNlIG9mIEwuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5GaXhlZExlbmd0aC5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcInBvaW50cyBcIiArIHRoaXMucDEuX190b1N0cmluZyArIFwiIGFuZCBcIiArIHRoaXMucDIuX190b1N0cmluZyArIFwiIGFsd2F5cyBtYWludGFpbiBhIGRpc3RhbmNlIG9mIFwiICsgdGhpcy5sICsgXCIuXCIgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5GaXhlZExlbmd0aC5wcm90b3R5cGUuZWZmZWN0cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW3tvYmo6IHRoaXMucDEsIHByb3BzOiBbJ3gnLCAneScsICd6J119LCB7b2JqOiB0aGlzLnAyLCBwcm9wczogWyd4JywgJ3knLCAneiddfV1cbiAgICB9XG5cblxuICAgIC8vIE1vdG9yIGNvbnN0cmFpbnQgLSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlLlxuICAgIC8vIHcgaXMgaW4gdW5pdHMgb2YgSHogLSB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cblxuICAgIFNrZXRjaHBhZC5nZW9tM2QuTW90b3JNb3Rpb24gPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX2dlb21fX01vdG9yQ29uc3RyYWludChwMSwgcDIsIHcpIHtcblx0dGhpcy5wMSA9IHAxXG5cdHRoaXMucDIgPSBwMlxuXHR0aGlzLncgPSB3XG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5nZW9tM2QuTW90b3JNb3Rpb24sIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yTW90aW9uLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge3AxOiAnUG9pbnQnLCBwMjogJ1BvaW50JywgdzogJ051bWJlcid9XG4gICAgXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3Rvck1vdGlvbi5wcm90b3R5cGUuY29tcHV0ZUVycm9yID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIDFcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuZ2VvbTNkLk1vdG9yTW90aW9uLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciB0ID0gKHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZSkgLyAxMDAwLjBcblx0dmFyIGRUaGV0YSA9IHQgKiB0aGlzLncgKiAoMiAqIE1hdGguUEkpXG5cdHZhciBtMTIgPSBtaWRwb2ludCh0aGlzLnAxLCB0aGlzLnAyKVxuXHRyZXR1cm4ge3AxOiByb3RhdGVkQXJvdW5kKHRoaXMucDEsIGRUaGV0YSwgbTEyKSxcblx0XHRwMjogcm90YXRlZEFyb3VuZCh0aGlzLnAyLCBkVGhldGEsIG0xMil9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3Rvck1vdGlvbi5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLmdlb20zZC5Nb3Rvck1vdGlvbihQb2ludCBQMSwgUG9pbnQgUDIsIE51bWJlciBXKSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlIG9mIHcsIGluIHVuaXRzIG9mIEh6OiB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cIiB9IFxuXG4gICAgU2tldGNocGFkLmdlb20zZC5Nb3Rvck1vdGlvbi5wcm90b3R5cGUuZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlwiICsgdGhpcy5wMS5fX3RvU3RyaW5nICsgXCIgYW5kIFwiICsgdGhpcy5wMi5fX3RvU3RyaW5nICsgXCIgdG8gb3JiaXQgdGhlaXIgbWlkcG9pbnQgYXQgdGhlIGdpdmVuIHJhdGUgb2YgXCIgKyB0aGlzLncgKyBcIiwgaW4gdW5pdHMgb2YgSHo6IHdob2xlIHJvdGF0aW9ucyBwZXIgc2Vjb25kLlwiIH1cbiAgICAgICAgICAgIFxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGwzREdlb21ldHJpY0NvbnN0cmFpbnRzXG4iLCJmdW5jdGlvbiBpbnN0YWxsM0RTaW11bGF0aW9uQ29uc3RyYWludHMoU2tldGNocGFkKSB7XG5cbiAgICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBzaW11bGF0aW9uIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgICAvLyBhcmJpdHJhcnkgcHJvcGVydGllcyBvZiBhcmJpdHJhcnkgb2JqZWN0cy4gXCJSZWZlcmVuY2VzXCIgYXJlIHJlcHJlc2VudGVkXG4gICAgLy8gYXMgKG9iamVjdCwgcHJvcGVydHlOYW1lKSB0dXBsZXMsIGUuZy4sIHtvYmo6IHlvdXJNb20sIHByb3A6ICd3ZWlnaHQnfS5cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QgPSB7IGc6IDkuOCwgRzogNi43ZS0xMSB9IC8vIEc6IE5tMi9rZzIgXG5cbiAgICB2YXIgbWludXMgPSBTa2V0Y2hwYWQuZ2VvbTNkLm1pbnVzXG4gICAgdmFyIHBsdXMgPSBTa2V0Y2hwYWQuZ2VvbTNkLnBsdXNcbiAgICB2YXIgc2NhbGVkQnkgPSBTa2V0Y2hwYWQuZ2VvbTNkLnNjYWxlZEJ5XG4gICAgdmFyIG1hZ25pdHVkZSA9IFNrZXRjaHBhZC5nZW9tM2QubWFnbml0dWRlXG4gICAgdmFyIG5vcm1hbGl6ZWQgPSBTa2V0Y2hwYWQuZ2VvbTNkLm5vcm1hbGl6ZWRcbiAgICB2YXIgZGlzdGFuY2UgPSBTa2V0Y2hwYWQuZ2VvbTNkLmRpc3RhbmNlXG4gICAgdmFyIGFuZ2xlID0gU2tldGNocGFkLmdlb20zZC5hbmdsZVxuXG4gICAgLy8gQ2xhc3Nlc1xuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5GcmVlQm9keSA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19GcmVlQm9keShwb3NpdGlvbiwgb3B0UmFkaXVzLCBvcHREcmF3blJhZGl1cywgb3B0TWFzcywgb3B0Q29sb3IpIHtcblx0dGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uXG5cdHRoaXMubWFzcyA9IG9wdE1hc3MgfHwgMTBcblx0dGhpcy52ZWxvY2l0eSA9IG5ldyBWZWN0b3IzRCgwLCAwLCAwKVxuXHR0aGlzLmFjY2VsZXJhdGlvbiA9IG5ldyBWZWN0b3IzRCgwLCAwLCAwKVxuXHR0aGlzLnJhZGl1cyA9IG9wdFJhZGl1cyB8fCB0aGlzLnBvc2l0aW9uLnJhZGl1c1xuXHR0aGlzLmRyYXduUmFkaXVzID0gb3B0RHJhd25SYWRpdXMgfHwgdGhpcy5yYWRpdXNcblx0cmMuYWRkKG5ldyBTcGhlcmUocG9zaXRpb24sIG9wdENvbG9yLCB0aGlzLmRyYXduUmFkaXVzKSlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5GcmVlQm9keSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuRnJlZUJvZHkucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7cG9zaXRpb246ICdQb2ludDNEJywgbWFzczogJ051bWJlcicsIHJhZGl1czogJ051bWJlcid9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZyA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19TcHJpbmcoYm9keTEsIGJvZHkyLCBrLCBsZW5ndGgsIHRlYXJQb2ludEFtb3VudCwgb3B0Q29sb3IpIHtcblx0dGhpcy5ib2R5MSA9IGJvZHkxXG5cdHRoaXMuYm9keTEgPSBib2R5MlxuXHR0aGlzLmxpbmUgPSByYy5hZGQobmV3IEN5bGluZGVyKGJvZHkxLnBvc2l0aW9uLCBib2R5Mi5wb3NpdGlvbiwgb3B0Q29sb3IpKVxuXHR0aGlzLmsgPSBrXG5cdHRoaXMubGVuZ3RoID0gbGVuZ3RoICAgIFxuXHR0aGlzLnRlYXJQb2ludEFtb3VudCA9IHRlYXJQb2ludEFtb3VudFxuXHR0aGlzLnRvcm4gPSBmYWxzZVxuICAgIH1cbiAgICBcbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcpXG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTE6ICdGcmVlQm9keScsIGJvZHkyOiAnRnJlZUJvZHknLCBrOiAnTnVtYmVyJywgbGVuZ3RoOiAnTnVtYmVyJywgdGVhdFBvaW50QW1vdW50OiAnTnVtYmVyJ31cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZy5wcm90b3R5cGUuc29sdXRpb25Kb2lucyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge3Rvcm46IHJjLnNrZXRjaHBhZC5sYXN0T25lV2luc0pvaW5Tb2x1dGlvbnN9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmcucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0aWYgKHRoaXMubGluZSkge1xuXHQgICAgaWYgKHRoaXMudG9ybikge1xuXHRcdHJjLnJlbW92ZSh0aGlzLmxpbmUpXG5cdFx0dGhpcy5saW5lID0gdW5kZWZpbmVkXG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciBoZWlnaHQgPSB0aGlzLmxpbmUuZ2V0SGVpZ2h0KCksIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG5cdFx0dmFyIHN0cmV0Y2ggPSBNYXRoLmFicyhoZWlnaHQgLSBsZW5ndGgpIC8gbGVuZ3RoXG5cdFx0dmFyIGNvbG9yID0gdGhpcy5saW5lLl9zY2VuZU9iai5tYXRlcmlhbC5jb2xvclxuXHRcdGNvbG9yLnNldCgnZ3JheScpXG5cdFx0Y29sb3IuciArPSBzdHJldGNoXG5cdCAgICB9XG5cdH1cbiAgICB9XG5cdCAgICBcbiAgICAvLyBNb3Rpb24gQ29uc3RyYWludFxuXHRcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5UmVsYXRpb24gPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb24zZF9fVmVsb2NpdHlSZWxhdGlvbihib2R5KSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy5wb3NpdGlvbiA9IGJvZHkucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eVJlbGF0aW9uLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eVJlbGF0aW9uLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHk6ICdGcmVlQm9keSd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5UmVsYXRpb24ucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBkdCA9IHBzZXVkb1RpbWUgLSBwcmV2UHNldWRvVGltZVxuXHRyZXR1cm4gbWFnbml0dWRlKG1pbnVzKHBsdXModGhpcy5sYXN0UG9zaXRpb24sIHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIGR0KSksIHRoaXMucG9zaXRpb24pKVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlSZWxhdGlvbi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHtwb3NpdGlvbjogcGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eSwgZHQpKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5UmVsYXRpb24uZGVzY3JpcHRpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICBcIlNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlSZWxhdGlvbihGcmVlQm9keSBCb2R5KSBzdGF0ZXMgZm9yIEJvZHk6IFBvcyA9IG9sZChQb3MpICsgVmVsb2NpdHkgKiAocHNldWRvVGltZSAtIHByZXZQc2V1ZG9UaW1lKSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eVJlbGF0aW9uLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiZm9yIEJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiIFBvcyA9IG9sZChQb3MpICsgKFwiICsgdGhpcy52ZWxvY2l0eS54ICsgXCIsXCIgKyAgdGhpcy52ZWxvY2l0eS55ICsgXCIsXCIgKyAgdGhpcy52ZWxvY2l0eS56ICsgXCIpICogZHQsIHdoZXJlIGR0IGlzIHRoZSBmcmFtZSBzdGVwIHRpbWUgYW1vdW50IC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5UmVsYXRpb24ucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0dGhpcy5sYXN0UG9zaXRpb24gPSBzY2FsZWRCeSh0aGlzLnBvc2l0aW9uLCAxKVxuICAgIH1cbiAgICBcbiAgICAvLyBCb2R5IFdpdGggVmVsb2NpdHkgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbiA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbihib2R5LCB2ZWxvY2l0eSkge1xuXHR0aGlzLmJvZHkgPSBib2R5XG5cdHRoaXMucG9zaXRpb24gPSBib2R5LnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5QXNMaW5lU2VnbWVudFJlbGF0aW9uLCB0cnVlKVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbi5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtib2R5OiAnRnJlZUJvZHknLCB2ZWxvY2l0eTogJ1BvaW50J31cbiAgICBcbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5QXNMaW5lU2VnbWVudFJlbGF0aW9uLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFBvc2l0aW9uLCBzY2FsZWRCeSh0aGlzLnZlbG9jaXR5Lm1hZ25pdHVkZSgpLCBkdCkpLCB0aGlzLnBvc2l0aW9uKSlcbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5WZWxvY2l0eUFzTGluZVNlZ21lbnRSZWxhdGlvbi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHtwb3NpdGlvbjogcGx1cyh0aGlzLmxhc3RQb3NpdGlvbiwgc2NhbGVkQnkodGhpcy52ZWxvY2l0eS5tYWduaXR1ZGUoKSwgZHQpKX1cbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5QXNMaW5lU2VnbWVudFJlbGF0aW9uLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAgXCJTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5QXNMaW5lU2VnbWVudFJlbGF0aW9uKEZyZWVCb2R5IEJvZHksIFBvaW50VmVjdG9yM0QgVmVsb2NpdHkpIHN0YXRlcyBmb3IgQm9keTogUG9zID0gb2xkKFBvcykgKyBWZWxvY2l0eSAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlZlbG9jaXR5QXNMaW5lU2VnbWVudFJlbGF0aW9uLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiZm9yIEJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiOiBQb3MgPSBvbGQoUG9zKSArIChcIiArIHRoaXMudmVsb2NpdHkueCArIFwiLFwiICsgIHRoaXMudmVsb2NpdHkueSArIFwiLFwiICsgIHRoaXMudmVsb2NpdHkueiArIFwiKSAqIGR0LCB3aGVyZSBkdCBpcyB0aGUgZnJhbWUgc3RlcCB0aW1lIGFtb3VudCAuXCIgfVxuICAgIFxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuVmVsb2NpdHlBc0xpbmVTZWdtZW50UmVsYXRpb24ucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RQb3NpdGlvbiA9IHNjYWxlZEJ5KHRoaXMucG9zaXRpb24sIDEpXG4gICAgfVxuXG4gICAgLy8gQWNjZWxlcmF0aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uUmVsYXRpb24gPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb24zZF9fQWNjZWxlcmF0aW9uUmVsYXRpb24oYm9keSwgYWNjZWxlcmF0aW9uKSB7XG5cdHRoaXMuYm9keSA9IGJvZHlcblx0dGhpcy52ZWxvY2l0eSA9IGJvZHkudmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb25cbiAgICB9XG5cbiAgICBza2V0Y2hwYWQuYWRkQ2xhc3MoU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25SZWxhdGlvbiwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uUmVsYXRpb24ucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7Ym9keTogJ0ZyZWVCb2R5JywgdmVsb2NpdHk6ICdWZWN0b3IzRCd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFjY2VsZXJhdGlvblJlbGF0aW9uLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyhwbHVzKHRoaXMubGFzdFZlbG9jaXR5LCBzY2FsZWRCeSh0aGlzLmFjY2VsZXJhdGlvbiwgZHQpKSwgdGhpcy52ZWxvY2l0eSkpXG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25SZWxhdGlvbi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR2YXIgZHQgPSBwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWVcblx0cmV0dXJuIHt2ZWxvY2l0eTogcGx1cyh0aGlzLmxhc3RWZWxvY2l0eSwgc2NhbGVkQnkodGhpcy5hY2NlbGVyYXRpb24sIGR0KSl9XG4gICAgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25SZWxhdGlvbi5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24zZC5BY2NlbGVyYXRpb25SZWxhdGlvbihGcmVlQm9keSBCb2R5LCBWZWN0b3IgQWNjZWxlcmF0aW9uKSBzdGF0ZXMgZm9yIEJvZHk6IFZlbG9jaXR5ID0gb2xkKFZlbG9jaXR5KSArIEFjY2VsZXJhdGlvbiAqIChwc2V1ZG9UaW1lIC0gcHJldlBzZXVkb1RpbWUpIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkFjY2VsZXJhdGlvblJlbGF0aW9uLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiZm9yIEJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiOiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKyAoXCIgKyB0aGlzLmFjY2VsZXJhdGlvbi54ICsgXCIsXCIgKyAgdGhpcy5hY2NlbGVyYXRpb24ueSArIFwiLFwiICsgIHRoaXMuYWNjZWxlcmF0aW9uLnogKyBcIikgKiBkdCwgd2hlcmUgZHQgaXMgdGhlIGZyYW1lIHN0ZXAgdGltZSBhbW91bnQgLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuQWNjZWxlcmF0aW9uUmVsYXRpb24ucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RWZWxvY2l0eSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIDEpXG4gICAgfVxuXG4gICAgLy8gQWlyIFJlc2lzdGFuY2UgQ29uc3RyYWludFxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5GcmljdGlvblJlbGF0aW9uID0gZnVuY3Rpb24gU2tldGNocGFkX19zaW11bGF0aW9uM2RfX0ZyaWN0aW9uUmVsYXRpb24oYm9keSwgc2NhbGUpIHtcblx0dGhpcy5ib2R5ID0gYm9keVxuXHR0aGlzLnZlbG9jaXR5ID0gYm9keS52ZWxvY2l0eVxuXHR0aGlzLnNjYWxlID0gLXNjYWxlXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuRnJpY3Rpb25SZWxhdGlvbiwgdHJ1ZSlcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuRnJpY3Rpb25SZWxhdGlvbi5wcm90b3R5cGUucHJvcGVydHlUeXBlcyA9IHtzY2FsZTogJ051bWJlcicsIGJvZHk6ICdGcmVlQm9keSd9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkZyaWN0aW9uUmVsYXRpb24ucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHJldHVybiBtYWduaXR1ZGUobWludXMoc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpLCB0aGlzLnZlbG9jaXR5KSlcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkZyaWN0aW9uUmVsYXRpb24ucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcblx0cmV0dXJuIHt2ZWxvY2l0eTogc2NhbGVkQnkodGhpcy5sYXN0VmVsb2NpdHksIHRoaXMuc2NhbGUpfVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuRnJpY3Rpb25SZWxhdGlvbi5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24zZC5GcmljdGlvblJlbGF0aW9uKEZyZWVCb2R5IEJvZHksIE51bWJlciBTY2FsZSkgc3RhdGVzIGZvciBCb2R5OiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKiBTY2FsZSAuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5GcmljdGlvblJlbGF0aW9uLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiZm9yIEJvZHkgXCIgKyB0aGlzLmJvZHkuX190b1N0cmluZyArIFwiOiBWZWxvY2l0eSA9IG9sZChWZWxvY2l0eSkgKiBcIiArIHRoaXMuc2NhbGUgK1wiIC5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLkZyaWN0aW9uUmVsYXRpb24ucHJvdG90eXBlLm9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcdFxuXHR0aGlzLmxhc3RWZWxvY2l0eSA9IHNjYWxlZEJ5KHRoaXMudmVsb2NpdHksIDEpXG4gICAgfVxuXG5cbiAgICAvLyAgU3ByaW5nIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5naW5lc3MgPSBmdW5jdGlvbiBTa2V0Y2hwYWRfX3NpbXVsYXRpb24zZF9fU3ByaW5naW5lc3MoYm9keTEsIGJvZHkyLCBzcHJpbmcpIHtcblx0dGhpcy5ib2R5MSA9IGJvZHkxXG5cdHRoaXMuYm9keTIgPSBib2R5MlxuXHR0aGlzLnBvc2l0aW9uMSA9IGJvZHkxLnBvc2l0aW9uXG5cdHRoaXMudmVsb2NpdHkxID0gYm9keTEudmVsb2NpdHlcblx0dGhpcy5hY2NlbGVyYXRpb24xID0gYm9keTEuYWNjZWxlcmF0aW9uXG5cdHRoaXMubWFzczEgPSBib2R5MS5tYXNzXG5cdHRoaXMucG9zaXRpb24yID0gYm9keTIucG9zaXRpb25cblx0dGhpcy52ZWxvY2l0eTIgPSBib2R5Mi52ZWxvY2l0eVxuXHR0aGlzLmFjY2VsZXJhdGlvbjIgPSBib2R5Mi5hY2NlbGVyYXRpb25cblx0dGhpcy5tYXNzMiA9IGJvZHkyLm1hc3Ncblx0dGhpcy5zcHJpbmcgPSBzcHJpbmdcblx0dGhpcy5fbGFzdFZlbG9jaXRpZXMgPSBbdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gICAgfVxuXG4gICAgc2tldGNocGFkLmFkZENsYXNzKFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5naW5lc3MsIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ2luZXNzLnByb3RvdHlwZS5wcm9wZXJ0eVR5cGVzID0ge2JvZHkxOiAnRnJlZUJvZHknLCBib2R5MjogJ0ZyZWVCb2R5Jywgc3ByaW5nOiAnU3ByaW5nJ31cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuU3ByaW5naW5lc3MucHJvdG90eXBlLmNvbXB1dGVFcnJvciA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzcHJpbmcgPSB0aGlzLnNwcmluZ1xuXHRpZiAoc3ByaW5nLnRvcm4pIHtcblx0ICAgIHJldHVybiAwXG5cdH1cblx0dmFyIHBvc2l0aW9ucyA9IFt0aGlzLnBvc2l0aW9uMSwgdGhpcy5wb3NpdGlvbjJdXG5cdHZhciBtYXNzZXMgPSBbdGhpcy5tYXNzMSwgdGhpcy5tYXNzMl1cblx0dmFyIHZlbG9jaXRpZXMgPSBbdGhpcy52ZWxvY2l0eTEsIHRoaXMudmVsb2NpdHkyXVxuXHR2YXIgYWNjZWxlcmF0aW9ucyA9IFt0aGlzLmFjY2VsZXJhdGlvbjEsIHRoaXMuYWNjZWxlcmF0aW9uMl1cblx0dmFyIGVyciA9IDBcblx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gMTsgaSsrKSB7XG5cdCAgICB2YXIgaiA9IChpICsgMSkgJSAyXG5cdCAgICB2YXIgbWFzcyA9IG1hc3Nlc1tqXVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFxuXHRcdHZhciBjdXJyQWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3RvcilcdFx0XG5cdFx0dmFyIHN0cmV0Y2hMZW4gPSAgc3ByaW5nQ3VyckxlbiAtIHNwcmluZy5sZW5ndGhcblx0XHR2YXIgbmV3QWNjZWxlcmF0aW9uTWFnID0gc3ByaW5nLmsgKiBzdHJldGNoTGVuIC8gbWFzc1xuXHRcdHZhciBhY2MgPSBzY2FsZWRCeShub3JtYWxpemVkKHZlY3RvciksIC1uZXdBY2NlbGVyYXRpb25NYWcpXG5cdFx0ZXJyICs9IG1hZ25pdHVkZShtaW51cyhhY2MsIGN1cnJBY2NlbGVyYXRpb24pKVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiBlcnJcbiAgICB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ2luZXNzLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG5cdHZhciBzb2xuID0ge31cblx0dmFyIHNwcmluZyA9IHRoaXMuc3ByaW5nXG5cdHZhciBwb3NpdGlvbnMgPSBbdGhpcy5wb3NpdGlvbjEsIHRoaXMucG9zaXRpb24yXVxuXHR2YXIgbWFzc2VzID0gW3RoaXMubWFzczEsIHRoaXMubWFzczJdXG5cdHZhciB2ZWxvY2l0aWVzID0gW3RoaXMudmVsb2NpdHkxLCB0aGlzLnZlbG9jaXR5Ml1cblx0dmFyIGFjY2VsZXJhdGlvbnMgPSBbdGhpcy5hY2NlbGVyYXRpb24xLCB0aGlzLmFjY2VsZXJhdGlvbjJdXG5cdGZvciAodmFyIGkgPSAwOyBpIDw9IDE7IGkrKykge1xuXHQgICAgdmFyIGogPSAoaSArIDEpICUgMlxuXHQgICAgdmFyIG1hc3MgPSBtYXNzZXNbal1cblx0ICAgIHZhciBhY2MsIHRvcm4gPSBmYWxzZVxuXHQgICAgaWYgKG1hc3MgPiAwKSB7IC8vIGlmIG5vdCBhbmNob3JlZFx0XHRcblx0XHR2YXIgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uc1tqXVxuXHRcdHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbnNbaV1cblx0XHR2YXIgcG9zaXRpb24yID0gcG9zaXRpb25zW2pdXG5cdFx0dmFyIHZlY3RvciA9IG1pbnVzKHBvc2l0aW9uMiwgcG9zaXRpb24xKVxuXHRcdHZhciBzcHJpbmdDdXJyTGVuID0gbWFnbml0dWRlKHZlY3Rvcilcblx0XHR2YXIgc3RyZXRjaExlbiA9ICBzcHJpbmdDdXJyTGVuIC0gc3ByaW5nLmxlbmd0aFxuXHRcdC8vIGlmIG5vdCB0b3JuIGFwYXJ0Li4uXG5cdFx0dG9ybiA9IHN0cmV0Y2hMZW4gPiBzcHJpbmcudGVhclBvaW50QW1vdW50XG5cdFx0aWYgKCF0b3JuKSB7XG5cdFx0ICAgIHZhciBuZXdBY2NlbGVyYXRpb25NYWcgPSBzcHJpbmcuayAqIHN0cmV0Y2hMZW4gLyBtYXNzXG5cdFx0ICAgIGFjYyA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQodmVjdG9yKSwgLW5ld0FjY2VsZXJhdGlvbk1hZylcblx0XHR9IFxuXHQgICAgfVxuXHQgICAgaWYgKHRvcm4pXG5cdFx0c29sblsnc3ByaW5nJ10gPSB7dG9ybjogdHJ1ZX1cblx0ICAgIGlmIChhY2MpXG5cdFx0c29sblsnYWNjZWxlcmF0aW9uJyArIChqKzEpXSA9IGFjY1xuXHR9XHRcblx0cmV0dXJuIHNvbG5cbiAgICB9XG4gICAgXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdpbmVzcy5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24zZC5TcHJpbmdpbmVzcyhGcmVlQm9keSBCb2R5MSwgRnJlZUJvZHkgQm9keTIsIFNwcmluZyBTKSBzdGF0ZXMgdGhhdCBzcHJpbmcgUyBoYXMgYmVlbiBhdHRhY2hlZCB0byB0d28gYm9kaWVzIEJvZHkxIGFuZCBCb2R5Mi5cIiB9XG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLlNwcmluZ2luZXNzLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwic3ByaW5nIFwiICsgdGhpcy5zcHJpbmcuX190b1N0cmluZyArIFwiIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHR3byBib2RpZXMgXCIgKyB0aGlzLmJvZHkxLl9fdG9TdHJpbmcgKyBcIiBhbmQgXCIgKyB0aGlzLmJvZHkyLl9fdG9TdHJpbmcgKyBcIi5cIiB9XG5cblxuICAgIC8vICBPcmJpdGFsTW90aW9uIENvbnN0cmFpbnRcblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbiA9IGZ1bmN0aW9uIFNrZXRjaHBhZF9fc2ltdWxhdGlvbjNkX19PcmJpdGFsTW90aW9uKHN1biwgbW9vbiwgZGlzdGFuY2VEb3duc2NhbGUpIHtcblx0dGhpcy5zdW4gPSBzdW5cblx0dGhpcy5tb29uID0gbW9vblxuXHR0aGlzLmFjY2VsZXJhdGlvbiA9IG1vb24uYWNjZWxlcmF0aW9uXG5cdHRoaXMuZGlzdGFuY2VEb3duc2NhbGUgPSAoZGlzdGFuY2VEb3duc2NhbGUgfHwgKDFlOSAvIDIpKVxuICAgIH1cblxuICAgIHNrZXRjaHBhZC5hZGRDbGFzcyhTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb24sIHRydWUpXG5cbiAgICBTa2V0Y2hwYWQuc2ltdWxhdGlvbjNkLk9yYml0YWxNb3Rpb24ucHJvdG90eXBlLnByb3BlcnR5VHlwZXMgPSB7c3VuOiAnRnJlZUJvZHknLCBtb29uOiAnRnJlZUJvZHknfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5PcmJpdGFsTW90aW9uLnByb3RvdHlwZS5jb21wdXRlRXJyb3IgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHR0aGlzLl90YXJnZXRBY2NlbGVyYXRpb24gPSB0aGlzLmN1cnJlbnRHcmF2aXR5QWNjZWxlcmF0aW9uKClcblx0cmV0dXJuIG1hZ25pdHVkZShtaW51cyh0aGlzLl90YXJnZXRBY2NlbGVyYXRpb24sIHRoaXMuYWNjZWxlcmF0aW9uKSlcdFxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuXHRyZXR1cm4ge2FjY2VsZXJhdGlvbjogdGhpcy5fdGFyZ2V0QWNjZWxlcmF0aW9ufVxuICAgIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbi5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiU2tldGNocGFkLnNpbXVsYXRpb24zZC5PcmJpdGFsTW90aW9uKEZyZWVCb2R5IFN1biwgRnJlZUJvZHkgTW9vbikgc3RhdGVzIHRoYXQgTW9vbiBib2R5IGlzIG9yYml0aW5nIGFyb3VuZCBTdW4gYm9keSBhY2NvcmRpbmcgdG8gc2ltcGxlIG9yYml0YWwgbW90aW9uIGZvcm11bGEuXCIgfVxuXG4gICAgU2tldGNocGFkLnNpbXVsYXRpb24zZC5PcmJpdGFsTW90aW9uLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gIFwiTW9vbiBib2R5IFwiICsgdGhpcy5tb29uLl9fdG9TdHJpbmcgKyBcIiBpcyBvcmJpdGluZyBhcm91bmQgU3VuIGJvZHkgXCIgKyB0aGlzLnN1bi5fX3RvU3RyaW5nICsgXCIgYWNjb3JkaW5nIHRvIHNpbXBsZSBvcmJpdGFsIG1vdGlvbiBmb3JtdWxhLlwiIH1cblxuICAgIFNrZXRjaHBhZC5zaW11bGF0aW9uM2QuT3JiaXRhbE1vdGlvbi5wcm90b3R5cGUuY3VycmVudEdyYXZpdHlBY2NlbGVyYXRpb24gPSBmdW5jdGlvbigpIHtcblx0dmFyIHAxID0gdGhpcy5tb29uLnBvc2l0aW9uLCBwMiA9IHRoaXMuc3VuLnBvc2l0aW9uXG5cdHZhciBkaXN0MCA9IGRpc3RhbmNlKHAxLCBwMilcblx0dmFyIGRpc3QgPSBkaXN0MCAqIHRoaXMuZGlzdGFuY2VEb3duc2NhbGVcdFxuXHR2YXIgYU1hZzAgPSAoU2tldGNocGFkLnNpbXVsYXRpb24zZC5HICogdGhpcy5zdW4ubWFzcykgLyAoZGlzdCAqIGRpc3QpXG5cdHZhciBhTWFnID0gYU1hZzAgLyB0aGlzLmRpc3RhbmNlRG93bnNjYWxlXG5cdHZhciBzbG9wZVYgPSBTa2V0Y2hwYWQuc2ltdWxhdGlvbi5zbG9wZVZlY3Rvcih7eDogcDEueCwgeTogcDEuen0sIHt4OiBwMi54LCB5OiBwMi56fSkgLy9jaGVhdCB0byB1c2UgMkQgWC1aIHBsYW5lXG5cdHJldHVybiB7eDogc2xvcGVWLnggKiBhTWFnLCB5OiAwLCB6OiBzbG9wZVYueSAqIGFNYWd9XG4gICAgfVxuICAgIFxufVxuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbDNEU2ltdWxhdGlvbkNvbnN0cmFpbnRzXG4iLCIvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSW1wb3J0c1xuLy8gLS0tLS0tLS0tLS0tLSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnZhciBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi8yZC9hcml0aG1ldGljLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxudmFyIGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyA9IHJlcXVpcmUoJy4vMmQvZ2VvbWV0cmljLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbFxudmFyIGluc3RhbGxTaW11bGF0aW9uQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzJkL3NpbXVsYXRpb24tY29uc3RyYWludHMuanMnKS5pbnN0YWxsXG52YXIgaW5zdGFsbDNER2VvbWV0cmljQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzNkL2dlb21ldHJpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGxcbnZhciBpbnN0YWxsM0RTaW11bGF0aW9uQ29uc3RyYWludHMgPSByZXF1aXJlKCcuLzNkL3NpbXVsYXRpb24tY29uc3RyYWludHMuanMnKS5pbnN0YWxsXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBHbG9iYWwgTWVzc3kgU3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnZhciBfX2lkQ3RyID0gMVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdfX2lkJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19faWQnKSlcblx0ICAgIHRoaXMuX19faWQgPSBfX2lkQ3RyKytcblx0cmV0dXJuIHRoaXMuX19faWRcbiAgICB9XG59KVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdfX3R5cGUnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLmhhc093blByb3BlcnR5KCdfX190eXBlJykpXG5cdCAgICB0aGlzLl9fX3R5cGUgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWUucmVwbGFjZSgvX18vZywgJy4nKVxuXHRyZXR1cm4gdGhpcy5fX190eXBlXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19zaG9ydFR5cGUnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcblx0dmFyIHJlcyA9IHRoaXMuX190eXBlXG5cdHJldHVybiByZXMuc3Vic3RyaW5nKHJlcy5sYXN0SW5kZXhPZignLicpICsgMSlcbiAgICB9XG59KVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdfX3RvU3RyaW5nJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLl9fc2hvcnRUeXBlICsgJ0AnICsgdGhpcy5fX2lkXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19jb250YWluZXInLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLmhhc093blByb3BlcnR5KCdfX19jb250YWluZXInKSlcblx0ICAgIHRoaXMuX19fY29udGFpbmVyID0gcmNcblx0cmV0dXJuIHRoaXMuX19fY29udGFpbmVyXG4gICAgfVxufSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnX19zY3JhdGNoJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eSgnX19fc2NyYXRjaCcpKVxuXHQgICAgdGhpcy5fX19zY3JhdGNoID0ge31cblx0cmV0dXJuIHRoaXMuX19fc2NyYXRjaFxuICAgIH1cbn0pXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHVibGljXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBTa2V0Y2hwYWQoKSB7XG4gICAgdGhpcy5yaG8gPSAxXG4gICAgdGhpcy5lcHNpbG9uID0gMC4wMVxuICAgIHRoaXMubnVtYmVyT2ZTYW1lRXJyb3JPY3VyclRvQmVDb25zaWRlcmVkQ29udmVyZ2VuY2UgPSAyMFxuICAgIHRoaXMuZGVidWcgPSBmYWxzZVxuICAgIHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcyA9IGZhbHNlXG4gICAgdGhpcy5jb25zdHJhaW50cyA9IFtdXG4gICAgdGhpcy5jb25zdHJhaW50VHJlZUxpc3QgPSB7fVxuICAgIHRoaXMuZGlzYWJsZWRDb25zdHJhaW50cyA9IHt9XG4gICAgdGhpcy50aGluZ0NvbnN0cnVjdG9ycyA9IHt9XG4gICAgdGhpcy5jb25zdHJhaW50Q29uc3RydWN0b3JzID0ge31cbiAgICB0aGlzLm9iak1hcCA9IHt9XG4gICAgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cyA9IHt9XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzID0gW11cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbCA9IHt9XG4gICAgdGhpcy5ldmVudERlc2NyaXB0aW9ucyA9IHt9XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcEhhbmRsZXJEZXNjcmlwdGlvbnMgPSB7fVxuICAgIHRoaXMuZXZlbnRzID0gW11cbiAgICB0aGlzLnRoaW5nc1dpdGhPbkVhY2hUaW1lU3RlcEZuID0gW11cbiAgICB0aGlzLnRoaW5nc1dpdGhBZnRlckVhY2hUaW1lU3RlcEZuID0gW11cbiAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICB0aGlzLnBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5wcmV2UHNldWRvVGltZSA9IDBcbiAgICB0aGlzLnNjcmF0Y2ggPSB7fVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24oYUNsYXNzLCBpc0NvbnN0cmFpbnQpIHtcbiAgICB2YXIgY2xhc3NOYW1lID0gYUNsYXNzLm5hbWUucmVwbGFjZSgvX18vZywgJy4nKVxuICAgIHZhciBsaXN0ID0gaXNDb25zdHJhaW50ID8gdGhpcy5jb25zdHJhaW50Q29uc3RydWN0b3JzIDogdGhpcy50aGluZ0NvbnN0cnVjdG9ycyAgICBcbiAgICBsaXN0W2NsYXNzTmFtZV0gPSBhQ2xhc3NcbiAgICBhQ2xhc3MucHJvdG90eXBlLl9faXNTa2V0Y2hwYWRUaGluZyA9IHRydWVcbiAgICBhQ2xhc3MucHJvdG90eXBlLl9faXNDb25zdHJhaW50ID0gaXNDb25zdHJhaW50XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUubWFya09iamVjdFdpdGhJZElmTmV3ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGlkID0gb2JqLl9faWRcbiAgICBpZiAodGhpcy5vYmpNYXBbaWRdKVxuXHRyZXR1cm4gdHJ1ZVxuICAgIHRoaXMub2JqTWFwW2lkXSA9IG9ialxuICAgIHJldHVybiBmYWxzZVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmdldE9iamVjdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMub2JqTWFwW2lkXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFkZENvbnN0cmFpbnQgPSBmdW5jdGlvbihjb25zdHJhaW50LCB3YXNEaXNhYmxlZCkge1xuICAgIGlmIChjb25zdHJhaW50Ll9fcHJpb3JpdHkgPT09IHVuZGVmaW5lZClcblx0Y29uc3RyYWludC5fX3ByaW9yaXR5ID0gMVxuICAgIHZhciBwcmlvID0gY29uc3RyYWludC5fX3ByaW9yaXR5XG4gICAgdmFyIGFkZElkeCA9IDBcbiAgICB3aGlsZSAoYWRkSWR4IDwgdGhpcy5jb25zdHJhaW50cy5sZW5ndGggJiYgdGhpcy5jb25zdHJhaW50c1thZGRJZHhdLl9fcHJpb3JpdHkgPCBwcmlvKVxuXHRhZGRJZHgrK1xuICAgIGlmICh0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcykge1xuXHR0aGlzLmFkZFRvUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9yc0ZvckNvbnN0cmFpbnQoY29uc3RyYWludCwgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cylcblx0dGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmVGb3JDb25zdHJhaW50KGNvbnN0cmFpbnQpXG5cdGlmICh0aGlzLmRlYnVnKSBsb2codGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cylcbiAgICB9XG4gICAgdGhpcy5jb25zdHJhaW50cy5zcGxpY2UoYWRkSWR4LCAwLCBjb25zdHJhaW50KVxuICAgIGlmICh3YXNEaXNhYmxlZClcblx0ZGVsZXRlIHRoaXMuZGlzYWJsZWRDb25zdHJhaW50c1tjb25zdHJhaW50Ll9faWRdXG4gICAgZWxzZSB7XG5cdHZhciBjVHAgPSBjb25zdHJhaW50Ll9fdHlwZSAgICBcblx0aWYgKCF0aGlzLmNvbnN0cmFpbnRUcmVlTGlzdFtjVHBdKVxuXHQgICAgdGhpcy5jb25zdHJhaW50VHJlZUxpc3RbY1RwXSA9IFtdXG5cdHRoaXMuY29uc3RyYWludFRyZWVMaXN0W2NUcF0ucHVzaChjb25zdHJhaW50KVxuICAgIH1cbiAgICBmb3IgKHZhciBwIGluIGNvbnN0cmFpbnQpIHtcblx0aWYgKGNvbnN0cmFpbnQuaGFzT3duUHJvcGVydHkocCkpIHtcblx0ICAgIHZhciBvYmogPSBjb25zdHJhaW50W3BdXG5cdCAgICBpZiAob2JqICE9PSB1bmRlZmluZWQgJiYgIXRoaXMub2JqTWFwW29iai5fX2lkXSlcblx0XHR0aGlzLm9iak1hcFtvYmouX19pZF0gPSBvYmpcblx0fVxuICAgIH1cbiAgICB0aGlzLmNvbnZlcmdlZCA9IGZhbHNlICAgIFxuICAgIHJldHVybiBjb25zdHJhaW50XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUucmVtb3ZlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHVud2FudGVkQ29uc3RyYWludCwgbWFya0FzRGlzYWJsZWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB2YXIgcmVtb3ZlZCA9IFt1bndhbnRlZENvbnN0cmFpbnRdXG4gICAgdGhpcy5jb25zdHJhaW50cyA9IHRoaXMuY29uc3RyYWludHMuZmlsdGVyKGZ1bmN0aW9uKGNvbnN0cmFpbnQpIHtcblx0dmFyIGtlZXAgPSB0cnVlXG5cdGlmIChjb25zdHJhaW50ID09PSB1bndhbnRlZENvbnN0cmFpbnQpIHtcblx0ICAgIGtlZXAgPSBmYWxzZVxuXHR9IGVsc2Uge1xuXHQgICAga2VlcCA9ICFpbnZvbHZlcyhjb25zdHJhaW50LCB1bndhbnRlZENvbnN0cmFpbnQpXG5cdCAgICBpZiAoIWtlZXApXG5cdFx0cmVtb3ZlZC5wdXNoKGNvbnN0cmFpbnQpXG5cdH1cblx0cmV0dXJuIGtlZXBcbiAgICB9KVxuICAgIHZhciB0cmVlID0gdGhpcy5jb25zdHJhaW50VHJlZUxpc3RcbiAgICByZW1vdmVkLmZvckVhY2goZnVuY3Rpb24oY29uc3RyYWludCkge1xuXHRpZiAobWFya0FzRGlzYWJsZWQpIHtcblx0ICAgIHNlbGYuZGlzYWJsZWRDb25zdHJhaW50c1tjb25zdHJhaW50Ll9faWRdID0gY29uc3RyYWludFx0XG5cdH0gZWxzZSB7XG5cdCAgICB2YXIgbGlzdCA9IHRyZWVbY29uc3RyYWludC5fX3R5cGVdXG5cdCAgICBsaXN0LnNwbGljZShsaXN0LmluZGV4T2YoY29uc3RyYWludCksIDEpXG5cdH1cbiAgICB9KVxuICAgIGlmICh0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvck9uUHJpb3JpdHlEaWZmZXJlbmNlcylcblx0dGhpcy5jb21wdXRlUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9ycygpXG4gICAgdGhpcy5jb252ZXJnZWQgPSBmYWxzZSAgICBcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmhvID0gMVxuICAgIHRoaXMuZXBzaWxvbiA9IDAuMDFcbiAgICB0aGlzLnNlYXJjaE9uID0gZmFsc2VcbiAgICB0aGlzLnNvbHZlRXZlbldpdGhvdXRFcnJvciA9IGZhbHNlXG4gICAgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3JPblByaW9yaXR5RGlmZmVyZW5jZXMgPSBmYWxzZVxuICAgIHRoaXMuY29uc3RyYWludHMgPSBbXVxuICAgIHRoaXMuY29uc3RyYWludFRyZWVMaXN0ID0ge31cbiAgICB0aGlzLmRpc2FibGVkQ29uc3RyYWludHMgPSB7fVxuICAgIHRoaXMub2JqTWFwID0ge31cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSBbXVxuICAgIHRoaXMuZXZlbnRzID0gW11cbiAgICB0aGlzLnRoaW5nc1dpdGhPbkVhY2hUaW1lU3RlcEZuID0gW11cbiAgICB0aGlzLnRoaW5nc1dpdGhBZnRlckVhY2hUaW1lU3RlcEZuID0gW11cbiAgICB0aGlzLnBlclRoaW5nUGVyUHJvcEVmZmVjdGluZ0NvbnN0cmFpbnRzID0ge31cbiAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICB0aGlzLnBzZXVkb1RpbWUgPSAwXG4gICAgdGhpcy5wcmV2UHNldWRvVGltZSA9IDAgICAgXG4gICAgdGhpcy5zY3JhdGNoID0ge31cbiAgICAvLyByZW1vdmUgZXhpc3RpbmcgZXZlbnQgaGFuZGxlcnNcbiAgICBmb3IgKHZhciBuYW1lIGluIHRoaXMuZXZlbnRIYW5kbGVyc0ludGVybmFsKVxuXHR0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uKGhhbmRsZXIpIHsgZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGhhbmRsZXIpIH0pXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzSW50ZXJuYWwgPSB7fVxuICAgIHRoaXMuZXZlbnREZXNjcmlwdGlvbnMgPSB7fVxuICAgIHRoaXMuY29udmVyZ2VkID0gZmFsc2UgICAgXG4gICAgdGhpcy5lcnJvclVubW92ZWRDb3VudCA9IDBcbiAgICB0aGlzLmxhc3RJdGVyYXRpb25FcnJvciA9IHVuZGVmaW5lZFxuICAgIHRoaXMub25FYWNoVGltZVN0ZXBIYW5kbGVyRGVzY3JpcHRpb25zID0ge31cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb21wdXRlQ3VycmVudEVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBzZXVkb1RpbWUgPSB0aGlzLnBzZXVkb1RpbWVcbiAgICB2YXIgcHJldlBzZXVkb1RpbWUgPSB0aGlzLnByZXZQc2V1ZG9UaW1lIFxuICAgIHZhciB0b3RhbEVycm9yID0gMFxuICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IHRoaXMuY29uc3RyYWludHMubGVuZ3RoOyBpZHgrKykge1xuXHR2YXIgYyA9IHRoaXMuY29uc3RyYWludHNbaWR4XVxuXHR2YXIgZXIgPSBNYXRoLmFicyhjLmNvbXB1dGVFcnJvcihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkpXHRcblx0dG90YWxFcnJvciArPSBlclxuICAgIH1cbiAgICByZXR1cm4gdG90YWxFcnJvclxufVxuICAgIFxuU2tldGNocGFkLnByb3RvdHlwZS5jb2xsZWN0UGVyQ29uc3RyYWludFNvbHV0aW9ucyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMsIGluRml4UG9pbnRQcm9jZXNzKSB7XG4gICAgdmFyIHBzZXVkb1RpbWUgPSB0aGlzLnBzZXVkb1RpbWVcbiAgICB2YXIgcHJldlBzZXVkb1RpbWUgPSB0aGlzLnByZXZQc2V1ZG9UaW1lIFxuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHZhciBhbGxTb2x1dGlvbnMgPSBbXVxuICAgIHZhciBkaWRTb21ldGhpbmcgPSBmYWxzZSwgbG9jYWxEaWRTb21ldGhpbmcgPSBmYWxzZSwgdG90YWxFcnJvciA9IDBcbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCB0aGlzLmNvbnN0cmFpbnRzLmxlbmd0aDsgaWR4KyspIHtcblx0dmFyIGMgPSB0aGlzLmNvbnN0cmFpbnRzW2lkeF1cblx0dmFyIHNlYXJjaGFibGUgPSBjLl9fc2VhcmNoYWJsZVxuXHRpZiAoaW5GaXhQb2ludFByb2Nlc3MgJiYgc2VhcmNoYWJsZSlcblx0ICAgIGNvbnRpbnVlXG5cdHZhciBlciA9IE1hdGguYWJzKGMuY29tcHV0ZUVycm9yKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSlcdFxuXHR0b3RhbEVycm9yICs9IGVyXG5cdGlmIChlciA+IHNlbGYuZXBzaWxvblxuXHQgICAgfHwgdGhpcy5zb2x2ZUV2ZW5XaXRob3V0RXJyb3IgfHwgKHRoaXMuc29sdmVFdmVuV2l0aG91dEVycm9yT25Qcmlvcml0eURpZmZlcmVuY2VzICYmIHRoaXMuY29uc3RyYWludElzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lKGMpKVxuXHQgICApIHtcblx0ICAgIHZhciBzb2x1dGlvbnMgPSBjLnNvbHZlKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuXHQgICAgaWYgKCEoaW5GaXhQb2ludFByb2Nlc3MgfHwgc2VhcmNoYWJsZSkpXG5cdFx0c29sdXRpb25zID0gW3NvbHV0aW9uc11cblx0ICAgIGxvY2FsRGlkU29tZXRoaW5nID0gdHJ1ZVxuXHQgICAgYWxsU29sdXRpb25zLnB1c2goe2NvbnN0cmFpbnQ6IGMsIHNvbHV0aW9uczogc29sdXRpb25zfSlcblx0fVxuICAgIH1cbiAgICBpZiAobG9jYWxEaWRTb21ldGhpbmcpIHtcblx0ZGlkU29tZXRoaW5nID0gdHJ1ZVxuICAgIH0gZWxzZVxuXHR0b3RhbEVycm9yID0gMFxuICAgIHJldHVybiB7ZGlkU29tZXRoaW5nOiBkaWRTb21ldGhpbmcsIGVycm9yOiB0b3RhbEVycm9yLCBzb2x1dGlvbnM6IGFsbFNvbHV0aW9uc31cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb2xsZWN0UGVyUHJvcGVydHlTb2x1dGlvbnMgPSBmdW5jdGlvbihhbGxTb2x1dGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB2YXIgY29sbGVjdGVkU29sdXRpb25zID0ge30sIHNlZW5Qcmlvcml0aWVzID0ge31cbiAgICBhbGxTb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbihkKSB7XG5cdGNvbGxlY3RQZXJQcm9wZXJ0eVNvbHV0aW9uc0FkZFNvbHV0aW9uKHNlbGYsIGQsIGNvbGxlY3RlZFNvbHV0aW9ucywgc2VlblByaW9yaXRpZXMpXG4gICAgfSlcbiAgICByZXR1cm4gY29sbGVjdGVkU29sdXRpb25zXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZG9PbmVJdGVyYXRpb24gPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgaWYgKHRoaXMuYmVmb3JlRWFjaEl0ZXJhdGlvbilcblx0KHRoaXMuYmVmb3JlRWFjaEl0ZXJhdGlvbikoKVxuICAgIHZhciByZXMgPSB0aGlzLmNvbGxlY3RQZXJDb25zdHJhaW50U29sdXRpb25zKHRpbWVNaWxsaXMsIHRydWUpXG4gICAgaWYgKHRoaXMuZGVidWcpIGxvZyhyZXMpXG4gICAgdmFyIGRpZFNvbWV0aGluZyA9IHJlcy5kaWRTb21ldGhpbmdcbiAgICB2YXIgdG90YWxFcnJvciA9IHJlcy5lcnJvclxuICAgIGlmIChkaWRTb21ldGhpbmcpIHtcblx0dmFyIGFsbFNvbHV0aW9ucyA9IHJlcy5zb2x1dGlvbnNcblx0dmFyIGNvbGxlY3RlZFNvbHV0aW9ucyA9IHRoaXMuY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zKGFsbFNvbHV0aW9ucylcblx0aWYgKHRoaXMudW5yb2xsT25Db25mbGljdHMpXG5cdCAgICBhcHBseVNvbHV0aW9uc1dpdGhVbnJvbGxPbkNvbmZsaWN0KHRoaXMsIGNvbGxlY3RlZFNvbHV0aW9ucylcblx0ZWxzZVxuXHQgICAgYXBwbHlTb2x1dGlvbnModGhpcywgY29sbGVjdGVkU29sdXRpb25zKVxuICAgIH1cbiAgICByZXR1cm4gdG90YWxFcnJvclxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVQZXJUaGluZ1BlclByb3BlcnR5RWZmZWN0b3JzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlcyA9IHt9XG4gICAgdGhpcy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtcblx0dGhpcy5hZGRUb1BlclRoaW5nUGVyUHJvcGVydHlFZmZlY3RvcnNGb3JDb25zdHJhaW50KGMsIHJlcylcbiAgICB9LmJpbmQodGhpcykpXG4gICAgdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cyA9IHJlcyAgXG4gICAgdGhpcy5jb21wdXRlQ29uc3RyYWludHNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmUoKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFkZFRvUGVyVGhpbmdQZXJQcm9wZXJ0eUVmZmVjdG9yc0ZvckNvbnN0cmFpbnQgPSBmdW5jdGlvbihjLCByZXMpIHtcbiAgICBpZiAoYy5lZmZlY3RzKSB7XG5cdGMuZWZmZWN0cygpLmZvckVhY2goZnVuY3Rpb24oZSkgeyBcblx0ICAgIHZhciBpZCA9IGUub2JqLl9faWRcblx0ICAgIHZhciBlUHJvcHMgPSBlLnByb3BzXG5cdCAgICB2YXIgcHJvcHMsIGNzXG5cdCAgICBpZiAocmVzW2lkXSlcblx0XHRwcm9wcyA9IHJlc1tpZF1cblx0ICAgIGVsc2Uge1xuXHRcdHByb3BzID0ge31cblx0XHRyZXNbaWRdID0gcHJvcHNcblx0ICAgIH1cblx0ICAgIGVQcm9wcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcblx0XHRpZiAocHJvcHNbcHJvcF0pXG5cdFx0ICAgIGNzID0gcHJvcHNbcHJvcF1cblx0XHRlbHNlIHtcblx0XHQgICAgY3MgPSBbXVxuXHRcdCAgICBwcm9wc1twcm9wXSA9IGNzXG5cdFx0fVxuXHRcdGNzLnB1c2goYylcdFx0XG5cdCAgICB9KVxuXHR9KVx0ICAgIFxuICAgIH1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jb25zdHJhaW50SXNDb21wZXRpbmdXaXRoQUxvd2VyUHJpb3JpdHlPbmUgPSBmdW5jdGlvbihjb25zdHJhaW50KSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lW2NvbnN0cmFpbnQuX19pZF0gIT09IHVuZGVmaW5lZFxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZUZvckNvbnN0cmFpbnQgPSBmdW5jdGlvbihjb25zdHJhaW50KSB7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50cykge1xuXHR2YXIgdGhpbmdFZmZzID0gdGhpcy5wZXJUaGluZ1BlclByb3BFZmZlY3RpbmdDb25zdHJhaW50c1tpZF1cblx0Zm9yICh2YXIgcCBpbiB0aGluZ0VmZnMpIHtcblx0ICAgIHZhciBjcyA9IHRoaW5nRWZmc1twXVxuXHQgICAgaWYgKGNzLmluZGV4T2YoY29uc3RyYWludCkgPj0gMCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY3MubGVuZ3RoOyBpKyspIHtcblx0XHQgICAgdmFyIGMgPSBjc1tpXVxuXHRcdCAgICBpZiAoYyAhPT0gY29uc3RyYWludCAmJiBjLl9fcHJpb3JpdHkgIT09IGNvbnN0cmFpbnQuX19wcmlvcml0eSkge1x0XHRcdFxuXHRcdFx0dmFyIGhDID0gY29uc3RyYWludC5fX3ByaW9yaXR5ID4gYy5fX3ByaW9yaXR5ID8gY29uc3RyYWludCA6IGNcblx0XHRcdHRoaXMuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lW2hDLl9faWRdID0gdHJ1ZVxuXHRcdFx0cmV0dXJuXG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdH1cbiAgICB9XG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29tcHV0ZUNvbnN0cmFpbnRzQ29tcGV0aW5nV2l0aEFMb3dlclByaW9yaXR5T25lID0gZnVuY3Rpb24oKSB7ICAgIFxuICAgIHRoaXMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbihjb25zdHJhaW50KSB7ICAgIFxuXHR0aGlzLmNvbXB1dGVDb25zdHJhaW50c0NvbXBldGluZ1dpdGhBTG93ZXJQcmlvcml0eU9uZUZvckNvbnN0cmFpbnQoY29uc3RyYWludClcbiAgICB9LmJpbmQodGhpcykpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY3VycmVudFRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnRUaW1lXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZG9UYXNrc09uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcbiAgICB0aGlzLmhhbmRsZUV2ZW50cygpXG4gICAgdGhpcy5kb09uRWFjaFRpbWVTdGVwRm5zKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuICAgIGlmICh0aGlzLm9uRWFjaFRpbWVTdGVwKSBcblx0KHRoaXMub25FYWNoVGltZVN0ZXApKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvVGFza3NBZnRlckVhY2hUaW1lU3RlcCA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB7XG4gICAgdGhpcy5kb0FmdGVyRWFjaFRpbWVTdGVwRm5zKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuICAgIGlmICh0aGlzLmFmdGVyRWFjaFRpbWVTdGVwKSBcblx0KHRoaXMuYWZ0ZXJFYWNoVGltZVN0ZXApKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKVxuICAgIHRoaXMubWF5YmVTdGVwUHNldWRvVGltZSgpXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuY29tcHV0ZU5leHRQc2V1ZG9UaW1lRnJvbVByb3Bvc2FscyA9IGZ1bmN0aW9uKHBzZXVkb1RpbWUsIHByb3Bvc2Fscykge1xuICAgIHZhciByZXMgPSBwcm9wb3NhbHNbMF0udGltZVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcHJvcG9zYWxzLmxlbmd0aDsgaSsrKSB7XG5cdHRpbWUgPSBwcm9wb3NhbHNbaV0udGltZVxuXHRpZiAodGltZSA8IHJlcylcblx0ICAgIHJlcyA9IHRpbWVcbiAgICB9XG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLm1heWJlU3RlcFBzZXVkb1RpbWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbyA9IHt9XG4gICAgdmFyIHBzZXVkb1RpbWUgPSB0aGlzLnBzZXVkb1RpbWVcbiAgICB0aGlzLnByZXZQc2V1ZG9UaW1lID0gcHNldWRvVGltZVxuICAgIHZhciBwcm9wb3NhbHMgPSBbXVxuICAgIHRoaXMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmKHQucHJvcG9zZU5leHRQc2V1ZG9UaW1lKVxuICAgICAgICAgICAgcHJvcG9zYWxzLnB1c2goe3Byb3Bvc2VyOiB0LCB0aW1lOiB0LnByb3Bvc2VOZXh0UHNldWRvVGltZShwc2V1ZG9UaW1lKX0pXG4gICAgfSlcbiAgICBpZiAocHJvcG9zYWxzLmxlbmd0aCA+IDApIHtcdFxuXHR0aGlzLnBzZXVkb1RpbWUgPSB0aGlzLmNvbXB1dGVOZXh0UHNldWRvVGltZUZyb21Qcm9wb3NhbHMocHNldWRvVGltZSwgcHJvcG9zYWxzKVxuXHR0aGlzLmNvbnZlcmdlZCA9IGZhbHNlXG4gICAgfVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLml0ZXJhdGVTZWFyY2hDaG9pY2VzRm9yVXBUb01pbGxpcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgZXBzaWxvbiA9IHRoaXMuZXBzaWxvblxuICAgIHZhciBzb2xzID0gdGhpcy5jb2xsZWN0UGVyQ29uc3RyYWludFNvbHV0aW9ucyh0aW1lTWlsbGlzLCBmYWxzZSlcbiAgICB2YXIgZGlkU29tZXRoaW5nID0gc29scy5kaWRTb21ldGhpbmdcbiAgICB2YXIgdG90YWxFcnJvciA9IHNvbHMuZXJyb3JcbiAgICB2YXIgcmVzID0ge2Vycm9yOiB0b3RhbEVycm9yLCBjb3VudDogMH0gLy9GSVhNRVxuICAgIGlmIChkaWRTb21ldGhpbmcpIHtcblx0dmFyIGFsbFNvbHV0aW9uQ2hvaWNlcyA9IHNvbHMuc29sdXRpb25zXG5cdC8vZmluZCBhbGwgc29sdXRpb24gY29tYmluYXRpb25zIGJldHdlZW4gY29uc3RyYWludHNcblx0Ly9pZiAodGhpcy5kZWJ1ZykgbG9nKGFsbFNvbHV0aW9uQ2hvaWNlcylcblx0dmFyIGNob2ljZXNDcyA9IGFsbFNvbHV0aW9uQ2hvaWNlcy5tYXAoZnVuY3Rpb24oYykgeyByZXR1cm4gYy5jb25zdHJhaW50IH0pXG5cdHZhciBjQ291bnQgPSBjaG9pY2VzQ3MubGVuZ3RoXG5cdHZhciBjaG9pY2VzU3MgPSBhbGxTb2x1dGlvbkNob2ljZXMubWFwKGZ1bmN0aW9uKGMpIHsgcmV0dXJuIGMuc29sdXRpb25zIH0pXG5cdHZhciBhbGxTb2x1dGlvbkNvbWJvcyA9IGFsbENvbWJpbmF0aW9uc09mQXJyYXlFbGVtZW50cyhjaG9pY2VzU3MpLm1hcChmdW5jdGlvbihjb21ibykge1x0ICAgIFxuXHQgICAgdmFyIGN1cnIgPSBbXVxuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjQ291bnQ7IGkrKykge1xuXHRcdGN1cnIucHVzaCh7Y29uc3RyYWludDogY2hvaWNlc0NzW2ldLCBzb2x1dGlvbnM6IGNvbWJvW2ldfSlcblx0ICAgIH1cblx0ICAgIHJldHVybiBjdXJyXG5cdH0pXG5cdC8vbG9nKGFsbFNvbHV0aW9uQ29tYm9zKVxuXHQvLyBjb3B5IGN1cnIgc3RhdGUgYW5kIHRyeSBvbmUsIGlmIHdvcmtzIHJldHVybiBlbHNlIHJldmVydCBzdGF0ZSBtb3ZlIHRvIG5leHQgdW50aWwgbm9uZSBsZWZ0XG5cdHZhciBjb3VudCA9IGFsbFNvbHV0aW9uQ29tYm9zLmxlbmd0aFxuXHR2YXIgY2hvaWNlVE8gPSB0aW1lTWlsbGlzIC8gY291bnRcblx0aWYgKHRoaXMuZGVidWcpIGxvZygncG9zc2libGUgY2hvaWNlcycsIGNvdW50LCAncGVyIGNob2ljZSB0aW1lb3V0JywgY2hvaWNlVE8pXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuXHQgICAgdmFyIGNvcGllZCwgbGFzdCA9IGkgPT0gY291bnQgLSAxXG5cdCAgICBpZiAodGhpcy5kZWJ1ZykgbG9nKCd0cnlpbmcgY2hvaWNlOiAnICsgaSlcblx0ICAgIHZhciBhbGxTb2x1dGlvbnMgPSBhbGxTb2x1dGlvbkNvbWJvc1tpXVxuXHQgICAgLy9sb2coYWxsU29sdXRpb25zKVxuXHQgICAgdmFyIGNvbGxlY3RlZFNvbHV0aW9ucyA9IHRoaXMuY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zKGFsbFNvbHV0aW9ucylcblx0ICAgIC8vY29weSBoZXJlLi4uXHQgICAgXG5cdCAgICBpZiAoIWxhc3QpXG5cdFx0Y29waWVkID0gdGhpcy5nZXRDdXJyZW50UHJvcFZhbHVlc0FmZmVjdGFibGVCeVNvbHV0aW9ucyhjb2xsZWN0ZWRTb2x1dGlvbnMpXG5cdCAgICBpZiAodGhpcy51bnJvbGxPbkNvbmZsaWN0cylcblx0ICAgIGFwcGx5U29sdXRpb25zV2l0aFVucm9sbE9uQ29uZmxpY3QodGhpcywgY29sbGVjdGVkU29sdXRpb25zKVxuXHRlbHNlXG5cdCAgICBhcHBseVNvbHV0aW9ucyh0aGlzLCBjb2xsZWN0ZWRTb2x1dGlvbnMpXG5cdCAgICByZXMgPSB0aGlzLml0ZXJhdGVGb3JVcFRvTWlsbGlzKGNob2ljZVRPKVx0ICAgIFxuXHQgICAgdmFyIGNob2ljZUVyciA9IHRoaXMuY29tcHV0ZUN1cnJlbnRFcnJvcigpXG5cdCAgICAvL2lmICh0aGlzLmRlYnVnKSBsb2coJ2Nob2ljZSByZXN1bHRlZCBpbiBlcnJvcjogJywgY2hvaWNlRXJyKVxuXHQgICAgaWYgKGNob2ljZUVyciA8IGVwc2lsb24gfHwgbGFzdClcblx0XHRicmVha1xuXHQgICAgLy9yZXZlcnQgaGVyZVxuXHQgICAgdGhpcy5yZXZlcnRQcm9wVmFsdWVzQmFzZWRPbkFyZyhjb3BpZWQpXG5cdH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmdldEN1cnJlbnRQcm9wVmFsdWVzQWZmZWN0YWJsZUJ5U29sdXRpb25zID0gZnVuY3Rpb24oc29sdXRpb25zKSB7XG4gICAgdmFyIHJlcyA9IHt9XG4gICAgZm9yICh2YXIgb2JqSWQgaW4gc29sdXRpb25zKSB7XG5cdHZhciBjdXJyT2JqID0gc2tldGNocGFkLm9iak1hcFtvYmpJZF1cblx0dmFyIHByb3BzTiA9IHt9XG5cdHJlc1tvYmpJZF0gPSBwcm9wc05cblx0dmFyIHByb3BzID0gc29sdXRpb25zW29iaklkXVxuXHRmb3IgKHZhciBwIGluIHByb3BzKSB7XG5cdCAgICBwcm9wc05bcF0gPSBjdXJyT2JqW3BdXG5cdH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnJldmVydFByb3BWYWx1ZXNCYXNlZE9uQXJnID0gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgZm9yICh2YXIgb2JqSWQgaW4gdmFsdWVzKSB7XG5cdHZhciBjdXJyT2JqID0gc2tldGNocGFkLm9iak1hcFtvYmpJZF1cblx0dmFyIHByb3BzID0gdmFsdWVzW29iaklkXVxuXHRmb3IgKHZhciBwIGluIHByb3BzKSB7XG5cdCAgICBjdXJyT2JqW3BdID0gcHJvcHNbcF1cblx0fVxuICAgIH1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5jaGVja0NvbnZlcmdlbmNlID0gZnVuY3Rpb24gKGN1cnJFcnJvcikge1xuICAgIGlmIChjdXJyRXJyb3IgPD0gdGhpcy5lcHNpbG9uKSB7XG5cdHRoaXMuY29udmVyZ2VkID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG5cdHRoaXMuZXJyb3JVbm1vdmVkQ291bnQgPSAodGhpcy5sYXN0SXRlcmF0aW9uRXJyb3IgPT0gY3VyckVycm9yKSA/ICh0aGlzLmVycm9yVW5tb3ZlZENvdW50ICsgMSkgOiAwXG5cdGlmICh0aGlzLmVycm9yVW5tb3ZlZENvdW50ID09IHRoaXMubnVtYmVyT2ZTYW1lRXJyb3JPY3VyclRvQmVDb25zaWRlcmVkQ29udmVyZ2VuY2UpIHtcblx0ICAgIHRoaXMuY29udmVyZ2VkID0gdHJ1ZVxuXHQgICAgdGhpcy5lcnJvclVubW92ZWRDb3VudCA9IDBcblx0fSBlbHNlIFxuXHQgICAgdGhpcy5jb252ZXJnZWQgPSBmYWxzZVxuICAgIH1cbiAgICB0aGlzLmxhc3RJdGVyYXRpb25FcnJvciA9IGN1cnJFcnJvclxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnNvbHZlRm9yVXBUb01pbGxpcyA9IGZ1bmN0aW9uKHRNaWxsaXMpIHtcbiAgICB0aGlzLmRvVGFza3NPbkVhY2hUaW1lU3RlcCh0aGlzLnBzZXVkb1RpbWUsIHRoaXMucHJldlBzZXVkb1RpbWUpXG4gICAgdmFyIHJlc1xuICAgIGlmICh0aGlzLnNlYXJjaE9uKVx0XG5cdHJlcyA9IHRoaXMuaXRlcmF0ZVNlYXJjaENob2ljZXNGb3JVcFRvTWlsbGlzKHRNaWxsaXMpXG4gICAgZWxzZVxuXHRyZXMgPSB0aGlzLml0ZXJhdGVGb3JVcFRvTWlsbGlzKHRNaWxsaXMpXG4gICAgdGhpcy5jaGVja0NvbnZlcmdlbmNlKHJlcy5lcnJvcilcbiAgICB0aGlzLmRvVGFza3NBZnRlckVhY2hUaW1lU3RlcCh0aGlzLnBzZXVkb1RpbWUsIHRoaXMucHJldlBzZXVkb1RpbWUpXG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvT25lSXRlcmF0aW9uQXNFbnRpcmVQaGFzZSA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgcmVzID0gdGhpcy5kb09uZUl0ZXJhdGlvbih0aW1lTWlsbGlzKVxuICAgIHRoaXMuY2hlY2tDb252ZXJnZW5jZShyZXMpXG4gICAgcmV0dXJuIHJlc1xufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLml0ZXJhdGVGb3JVcFRvTWlsbGlzID0gZnVuY3Rpb24odE1pbGxpcykge1xuICAgIHZhciBjb3VudCA9IDAsIHRvdGFsRXJyb3IgPSAwLCBlcHNpbG9uID0gdGhpcy5lcHNpbG9uXG4gICAgdmFyIGN1cnJFcnJvciwgbGFzdEVycm9yXG4gICAgdmFyIHQwLCB0XG4gICAgdDAgPSB0aGlzLmN1cnJlbnRUaW1lKClcbiAgICBkbyB7XG5cdGxhc3RFcnJvciA9IGN1cnJFcnJvclxuXHRjdXJyRXJyb3IgPSB0aGlzLmRvT25lSXRlcmF0aW9uKHQwKVxuXHR0ID0gIHRoaXMuY3VycmVudFRpbWUoKSAtIHQwXG5cdGlmIChjdXJyRXJyb3IgPiAwKSB7XG5cdCAgICBjb3VudCsrXG5cdCAgICB0b3RhbEVycm9yICs9IGN1cnJFcnJvclxuXHR9XG4gICAgfSB3aGlsZSAoXG5cdGN1cnJFcnJvciA+IGVwc2lsb25cblx0ICAgICYmICEoY3VyckVycm9yID49IGxhc3RFcnJvcilcblx0ICAgICYmIHQgPCB0TWlsbGlzKVxuICAgIHJldHVybiB7ZXJyb3I6IHRvdGFsRXJyb3IsIGNvdW50OiBjb3VudH1cbn1cblxuLy8gdmFyaW91cyB3YXlzIHdlIGNhbiBqb2luIHNvbHV0aW9ucyBmcm9tIGFsbCBzb2x2ZXJzXG4vLyBkYW1wZWQgYXZlcmFnZSBqb2luIGZuOlxuU2tldGNocGFkLnByb3RvdHlwZS5zdW1Kb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgdmFyIHJobyA9IHRoaXMucmhvXG4gICAgdmFyIHN1bSA9IDBcbiAgICBzb2x1dGlvbnMuZm9yRWFjaChmdW5jdGlvbih2KSB7IHN1bSArPSB2IH0pXG4gICAgdmFyIHJlcyA9IGN1cnIgKyAocmhvICogKChzdW0gLyBzb2x1dGlvbnMubGVuZ3RoKSAtIGN1cnIpKVxuICAgIHJldHVybiByZXNcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5sYXN0T25lV2luc0pvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICByZXR1cm4gc29sdXRpb25zW3NvbHV0aW9ucy5sZW5ndGggLSAxXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnJhbmRvbUNob2ljZUpvaW5Tb2x1dGlvbnMgPSBmdW5jdGlvbihjdXJyLCBzb2x1dGlvbnMpIHtcbiAgICByZXR1cm4gc29sdXRpb25zW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNvbHV0aW9ucy5sZW5ndGgpXVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmFycmF5QWRkSm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHNvbHV0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHsgY3Vyci5wdXNoKHYpIH0pXG4gICAgcmV0dXJuIGN1cnJcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kaWN0aW9uYXJ5QWRkSm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHNvbHV0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHsgZm9yICh2YXIgayBpbiB2KSBjdXJyW2tdID0gdltrXSB9KVxuICAgIHJldHVybiBjdXJyXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuZGljdGlvbmFyeUFkZE5vQ29uZmxpY3RKb2luU29sdXRpb25zID0gZnVuY3Rpb24oY3Vyciwgc29sdXRpb25zKSB7XG4gICAgdmFyIHNlZW4gPSB7fVxuICAgIHNvbHV0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcblx0Zm9yICh2YXIgayBpbiB2KSB7XG5cdCAgICB2YXIgcHJldiA9IHNlZW5ba11cblx0ICAgIHZhciBuZXdWID0gdltrXVxuXHQgICAgaWYgKHByZXYgJiYgcHJldiAhPT0gbmV3Vikge1xuXHRcdHRoaXMuZGlzY2FyZEl0ZXJhdGlvbiA9IHRydWVcblx0XHRsb2coJ2NvbmZsaWN0IGluIHRoaXMgc29sdXRpb24gc2V0OicsIHNvbHV0aW9ucykgXG5cdFx0cmV0dXJuIGN1cnJcblx0ICAgIH1cblx0ICAgIHNlZW5ba10gPSBuZXdWXG5cdH1cbiAgICB9KVxuICAgIHJldHVybiB0aGlzLmRpY3Rpb25hcnlBZGRKb2luU29sdXRpb25zKGN1cnIsIHNvbHV0aW9ucylcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kZWZhdWx0Sm9pblNvbHV0aW9ucyA9IGZ1bmN0aW9uKGN1cnIsIHNvbHV0aW9ucykge1xuICAgIHJldHVybiAgdGhpcy5zdW1Kb2luU29sdXRpb25zKGN1cnIsIHNvbHV0aW9ucylcbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5yZWdpc3RlckV2ZW50ID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIG9wdERlc2NyaXB0aW9uKSB7XG4gICAgdmFyIGlkID0gdGhpcy5ldmVudEhhbmRsZXJzLmxlbmd0aFxuICAgIHRoaXMuZXZlbnRIYW5kbGVycy5wdXNoKGNhbGxiYWNrKVxuICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24oZSkgeyBcdHRoaXMuY29udmVyZ2VkID0gZmFsc2U7IHRoaXMuZXZlbnRzLnB1c2goW2lkLCBlXSkgfS5iaW5kKHRoaXMpXG4gICAgaWYgKCF0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXSkge1xuXHR0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXSA9IFtdXG5cdHRoaXMuZXZlbnREZXNjcmlwdGlvbnNbbmFtZV0gPSBbXVxuICAgIH1cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnNJbnRlcm5hbFtuYW1lXS5wdXNoKGhhbmRsZXIpXG4gICAgdGhpcy5ldmVudERlc2NyaXB0aW9uc1tuYW1lXS5wdXNoKG9wdERlc2NyaXB0aW9uKVxuICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmhhbmRsZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vaWYgKHRoaXMuZXZlbnRzLmxlbmd0aCA+IDApXG4gICAgLy9cdHRoaXMuY29udmVyZ2VkID0gZmFsc2VcbiAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWVBbmRFKSB7IFxuXHR2YXIgaWQgPSBuYW1lQW5kRVswXTsgXG5cdHZhciBlID0gbmFtZUFuZEVbMV07IFxuXHR2YXIgaCA9IHRoaXMuZXZlbnRIYW5kbGVyc1tpZF1cblx0aWYgKGggIT09IHVuZGVmaW5lZClcblx0ICAgIGgoZSkgXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHRoaXMuZXZlbnRzID0gW11cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS5kb09uRWFjaFRpbWVTdGVwRm5zID0gZnVuY3Rpb24ocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIHtcbiAgICB0aGlzLnRoaW5nc1dpdGhPbkVhY2hUaW1lU3RlcEZuLmZvckVhY2goZnVuY3Rpb24odCkgeyB0Lm9uRWFjaFRpbWVTdGVwKHBzZXVkb1RpbWUsIHByZXZQc2V1ZG9UaW1lKSB9KVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLmRvQWZ0ZXJFYWNoVGltZVN0ZXBGbnMgPSBmdW5jdGlvbihwc2V1ZG9UaW1lLCBwcmV2UHNldWRvVGltZSkge1xuICAgIHRoaXMudGhpbmdzV2l0aEFmdGVyRWFjaFRpbWVTdGVwRm4uZm9yRWFjaChmdW5jdGlvbih0KSB7IHQuYWZ0ZXJFYWNoVGltZVN0ZXAocHNldWRvVGltZSwgcHJldlBzZXVkb1RpbWUpIH0pXG59XG5cblNrZXRjaHBhZC5wcm90b3R5cGUuc2V0T25FYWNoVGltZVN0ZXAgPSBmdW5jdGlvbihvbkVhY2hUaW1lRm4sIG9wdERlc2NyaXB0aW9uKSB7XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcCA9IG9uRWFjaFRpbWVGblxuICAgIGlmIChvcHREZXNjcmlwdGlvbilcblx0dGhpcy5vbkVhY2hUaW1lU3RlcEhhbmRsZXJEZXNjcmlwdGlvbnNbJ2dlbmVyYWwnXSA9IFtvcHREZXNjcmlwdGlvbl1cbn1cblxuU2tldGNocGFkLnByb3RvdHlwZS51bnNldE9uRWFjaFRpbWVTdGVwID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5vbkVhY2hUaW1lU3RlcCA9IHVuZGVmaW5lZFxuICAgIGRlbGV0ZSh0aGlzLm9uRWFjaFRpbWVTdGVwSGFuZGxlckRlc2NyaXB0aW9uc1snZ2VuZXJhbCddKVxufVxuXG5Ta2V0Y2hwYWQucHJvdG90eXBlLnNldE9wdGlvbiA9IGZ1bmN0aW9uKG9wdCwgdmFsKSB7XG4gICAgdGhpc1tvcHRdID0gdmFsXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZnVuY3Rpb24gY29sbGVjdFBlclByb3BlcnR5U29sdXRpb25zQWRkU29sdXRpb24oc2tldGNocGFkLCBzb2xuLCBzb2Zhciwgc2VlblByaW9yaXRpZXMpIHtcbiAgICB2YXIgYyA9IHNvbG4uY29uc3RyYWludFxuICAgIHZhciBwcmlvcml0eSA9IGMuX19wcmlvcml0eVxuICAgIGZvciAodmFyIG9iaiBpbiBzb2xuLnNvbHV0aW9ucykge1xuXHR2YXIgY3Vyck9iaiA9IGNbb2JqXVxuXHR2YXIgY3Vyck9iaklkID0gY3Vyck9iai5fX2lkXG5cdHZhciBkID0gc29sbi5zb2x1dGlvbnNbb2JqXVxuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKGQpXG5cdGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzW2ldXG5cdCAgICB2YXIgcGVyUHJvcFNvbG4gPSBzb2ZhcltjdXJyT2JqSWRdXG5cdCAgICB2YXIgcGVyUHJvcFByaW8gPSBzZWVuUHJpb3JpdGllc1tjdXJyT2JqSWRdXG5cdCAgICB2YXIgcHJvcFNvbG5zLCBwcmlvXG5cdCAgICBpZiAocGVyUHJvcFNvbG4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHBlclByb3BTb2xuID0ge31cblx0XHRwZXJQcm9wUHJpbyA9IHt9XG5cdFx0c29mYXJbY3Vyck9iaklkXSA9IHBlclByb3BTb2xuXG5cdFx0c2VlblByaW9yaXRpZXNbY3Vyck9iaklkXSA9IHBlclByb3BQcmlvXG5cdFx0cHJvcFNvbG5zID0gW11cblx0XHRwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdHBlclByb3BQcmlvW3Byb3BdID0gcHJpb3JpdHlcblx0ICAgIH0gZWxzZSB7XHRcdCAgICBcblx0XHRwcm9wU29sbnMgPSBwZXJQcm9wU29sbltwcm9wXVxuXHRcdGlmIChwcm9wU29sbnMgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICBwcm9wU29sbnMgPSBbXVxuXHRcdCAgICBwZXJQcm9wU29sbltwcm9wXSA9IHByb3BTb2xuc1xuXHRcdCAgICBwZXJQcm9wUHJpb1twcm9wXSA9IHByaW9yaXR5XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgdmFyIGxhc3RQcmlvID0gcGVyUHJvcFByaW9bcHJvcF1cblx0ICAgIGlmIChwcmlvcml0eSA+IGxhc3RQcmlvKSB7XG5cdFx0cGVyUHJvcFByaW9bcHJvcF0gPSBwcmlvcml0eVxuXHRcdHdoaWxlIChwcm9wU29sbnMubGVuZ3RoID4gMCkgcHJvcFNvbG5zLnBvcCgpXG5cdCAgICB9IGVsc2UgaWYgKHByaW9yaXR5IDwgbGFzdFByaW8pIHtcblx0XHRicmVha1xuXHQgICAgfSBcblx0ICAgIHByb3BTb2xucy5wdXNoKGRbcHJvcF0pXG5cdH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFwcGx5U29sdXRpb25zKHNrZXRjaHBhZCwgc29sdXRpb25zKSB7ICAgIFxuICAgIC8vbG9nMihzb2x1dGlvbnMpXG4gICAgdmFyIGtleXMxID0gT2JqZWN0LmtleXMoc29sdXRpb25zKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5czEubGVuZ3RoOyBpKyspIHtcblx0dmFyIG9iaklkID0ga2V5czFbaV1cblx0dmFyIHBlclByb3AgPSBzb2x1dGlvbnNbb2JqSWRdXG5cdHZhciBjdXJyT2JqID0gc2tldGNocGFkLm9iak1hcFtvYmpJZF1cblx0dmFyIGtleXMyID0gT2JqZWN0LmtleXMocGVyUHJvcClcblx0Zm9yICh2YXIgaiA9IDA7IGogPCBrZXlzMi5sZW5ndGg7IGorKykge1xuXHQgICAgdmFyIHByb3AgPSBrZXlzMltqXVxuXHQgICAgdmFyIHByb3BTb2xucyA9IHBlclByb3BbcHJvcF1cblx0ICAgIHZhciBjdXJyVmFsID0gY3Vyck9ialtwcm9wXVxuXHQgICAgdmFyIGpvaW5GbiA9IChjdXJyT2JqLnNvbHV0aW9uSm9pbnMgIT09IHVuZGVmaW5lZCAmJiAoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdICE9PSB1bmRlZmluZWQpID9cblx0XHQoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdIDogc2tldGNocGFkLnN1bUpvaW5Tb2x1dGlvbnNcblx0ICAgIGN1cnJPYmpbcHJvcF0gPSAoam9pbkZuLmJpbmQoc2tldGNocGFkKSkoY3VyclZhbCwgcHJvcFNvbG5zKVxuXHR9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhcHBseVNvbHV0aW9uc1dpdGhVbnJvbGxPbkNvbmZsaWN0KHNrZXRjaHBhZCwgc29sdXRpb25zKSB7XG4gICAgdGhpcy5kaXNjYXJkSXRlcmF0aW9uID0gZmFsc2UgICBcbiAgICAvL2xvZzIoc29sdXRpb25zKVxuICAgIHZhciBrZXlzMSA9IE9iamVjdC5rZXlzKHNvbHV0aW9ucylcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMxLmxlbmd0aDsgaSsrKSB7XG5cdHZhciBvYmpJZCA9IGtleXMxW2ldXG5cdHZhciBwZXJQcm9wID0gc29sdXRpb25zW29iaklkXVxuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBrZXlzMiA9IE9iamVjdC5rZXlzKHBlclByb3ApXG5cdGZvciAodmFyIGogPSAwOyBqIDwga2V5czIubGVuZ3RoOyBqKyspIHtcblx0ICAgIHZhciBwcm9wID0ga2V5czJbal1cblx0ICAgIHZhciBwcm9wU29sbnMgPSBwZXJQcm9wW3Byb3BdXG5cdCAgICB2YXIgY3VyclZhbCA9IGN1cnJPYmpbcHJvcF1cblx0ICAgIGN1cnJPYmpbcHJvcCArICdfX29sZCddID0gY3VyclZhbFxuXHQgICAgdmFyIGpvaW5GbiA9IChjdXJyT2JqLnNvbHV0aW9uSm9pbnMgIT09IHVuZGVmaW5lZCAmJiAoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdICE9PSB1bmRlZmluZWQpID9cblx0XHQoY3Vyck9iai5zb2x1dGlvbkpvaW5zKCkpW3Byb3BdIDogc2tldGNocGFkLnN1bUpvaW5Tb2x1dGlvbnNcblx0ICAgIGN1cnJPYmpbcHJvcF0gPSAoam9pbkZuLmJpbmQoc2tldGNocGFkKSkoY3VyclZhbCwgcHJvcFNvbG5zKVxuXHR9XG4gICAgfVxuICAgIGlmICghdGhpcy5kaXNjYXJkSXRlcmF0aW9uKVxuXHRyZXR1cm5cbiAgICBsb2coJ2Rpc2NhcmRpbmcgc29sdXRpb25zIHNpbmNlIHRoZXJlIHdhcyBhIGNvbmZsaWN0Li4uJylcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMxLmxlbmd0aDsgaSsrKSB7XG5cdHZhciBvYmpJZCA9IGtleXMxW2ldXG5cdHZhciBwZXJQcm9wID0gc29sdXRpb25zW29iaklkXVxuXHR2YXIgY3Vyck9iaiA9IHNrZXRjaHBhZC5vYmpNYXBbb2JqSWRdXG5cdHZhciBrZXlzMiA9IE9iamVjdC5rZXlzKHBlclByb3ApXG5cdGZvciAodmFyIGogPSAwOyBqIDwga2V5czIubGVuZ3RoOyBqKyspIHtcblx0ICAgIHZhciBwcm9wID0ga2V5czJbal1cblx0ICAgIHZhciBwcm9wU29sbnMgPSBwZXJQcm9wW3Byb3BdXG5cdCAgICB2YXIgY3VyclZhbCA9IGN1cnJPYmpbcHJvcF1cblx0ICAgIGN1cnJPYmpbcHJvcF0gPSBjdXJyT2JqW3Byb3AgKyAnX19vbGQnXVxuXHQgICAgZGVsZXRlIGN1cnJPYmpbcHJvcCArICdfX29sZCddXG5cdH1cbiAgICB9XG59XG5cblxuZnVuY3Rpb24gaW52b2x2ZXMoY29uc3RyYWludCwgb2JqKSB7XG4gICAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG5cdGlmIChjb25zdHJhaW50W3BdID09PSBvYmopIHtcblx0ICAgIHJldHVybiB0cnVlXG5cdH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGFsbENvbWJpbmF0aW9uc09mQXJyYXlFbGVtZW50cyhhcnJheU9mQXJyYXlzKSB7XG4gICAgaWYgKGFycmF5T2ZBcnJheXMubGVuZ3RoID4gMSkge1xuXHR2YXIgZmlyc3QgPSBhcnJheU9mQXJyYXlzWzBdXG5cdHZhciByZXN0ID0gYWxsQ29tYmluYXRpb25zT2ZBcnJheUVsZW1lbnRzKGFycmF5T2ZBcnJheXMuc2xpY2UoMSkpXG5cdHZhciByZXMgPSBbXVxuXHRmb3IgKHZhciBqID0gMDsgaiA8IHJlc3QubGVuZ3RoIDsgaisrKSB7XG5cdCAgICB2YXIgciA9IHJlc3Rbal1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlyc3QubGVuZ3RoOyBpKyspIHtcblx0XHRyZXMucHVzaChbZmlyc3RbaV1dLmNvbmNhdChyKSlcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gcmVzXG4gICAgfSAgZWxzZSBpZiAoYXJyYXlPZkFycmF5cy5sZW5ndGggPT0gMSkge1xuXHRyZXR1cm4gYXJyYXlPZkFycmF5c1swXS5tYXAoZnVuY3Rpb24oZSkgeyByZXR1cm4gW2VdIH0pXG4gICAgfSBlbHNlXG5cdHJldHVybiBbXVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQm9vdHN0cmFwICYgSW5zdGFsbCBjb25zdHJhaW50IGxpYnJhcmllc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNrZXRjaHBhZCA9IG5ldyBTa2V0Y2hwYWQoKVxuaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoU2tldGNocGFkKVxuaW5zdGFsbFNpbXVsYXRpb25Db25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsM0RHZW9tZXRyaWNDb25zdHJhaW50cyhTa2V0Y2hwYWQpXG5pbnN0YWxsM0RTaW11bGF0aW9uQ29uc3RyYWludHMoU2tldGNocGFkKVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXhwb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSBTa2V0Y2hwYWRcblxuIl19
