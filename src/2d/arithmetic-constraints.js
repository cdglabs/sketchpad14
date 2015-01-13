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

    Sketchpad.arith.InequalityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.InequalityConstraint({obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, true) 
    }

    Sketchpad.arith.InequalityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v1 = this.k1 * ref(this, 'v1') , v2 = (this.k2 * ref(this, 'v2')) + this.k3, cond = this.isGeq ? v1 >= v2 : v2 <= v1, e = cond ? 0 : v2 - v1
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
