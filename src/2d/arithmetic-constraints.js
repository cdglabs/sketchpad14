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

    // Inequality Constraint, i.e., o1.p1 + K >= o2.p2 or o1.p1 + K <= o2.p2

    Sketchpad.arith.InequalityConstraint = function Sketchpad__arith__InequalityConstraint(ref1, constantK, ref2, isGeq) {
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	this.constantK = constantK
	this.isGeq = isGeq
    }

    sketchpad.addClass(Sketchpad.arith.InequalityConstraint, true)

    Sketchpad.arith.InequalityConstraint.prototype.description = function() { return  "Sketchpad.arith.InequalityConstraint({obj: O1, prop: p1}, Number K, {obj: O2, prop: p2}, isGeq) states that O1.p1 + K >= O2.p2 (when isGeq=true) or O1.p1 + K <= O2.p2 (when isGeq=false)." }

    Sketchpad.arith.InequalityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.InequalityConstraint({obj: new Point(1,1), prop: 'x'}, 0, {obj: new Point(1,1), prop: 'x'}, true) 
    }

    Sketchpad.arith.InequalityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v1 = ref(this, 'v1') + this.constantK, v2 = ref(this, 'v2'), cond = this.isGeq ? v1 >= v2 : v2 <= v1, e = cond ? 0 : v2 - v1
	return e
    }

    Sketchpad.arith.InequalityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v2 = ref(this, 'v2')
	res = patch(this, 'v1', v2 - this.constantK)
	return res
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

    // SumInequality Constraint, i.e., o1.p1 + K >= o2.p2 + o3.p3 or o1.p1 + K <= o2.p2 + o3.p3 

    Sketchpad.arith.SumInequalityConstraint = function Sketchpad__arith__SumInequalityConstraint(ref1, constantK, ref2, ref3, isGeq) {
	installRef(this, ref1, 'v1')
	installRef(this, ref2, 'v2')
	installRef(this, ref3, 'v3')
	this.constantK = constantK
	this.isGeq = isGeq
    }

    sketchpad.addClass(Sketchpad.arith.SumInequalityConstraint, true)

    Sketchpad.arith.SumInequalityConstraint.prototype.description = function() { return  "Sketchpad.arith.SumInequalityConstraint({obj: O1, prop: p1}, Number K, {obj: O2, prop: p2}, {obj: O3, prop: p3}, isGeq) states that O1.p1 + K >=  O2.p2  + O3.p3 or O1.p1 + K <=  O2.p2 + O3.p3 (>= when isGeq=true)" } 

    Sketchpad.arith.SumInequalityConstraint.dummy = function(x, y) {
	return new Sketchpad.arith.SumInequalityConstraint({obj: new Point(1,1), prop: 'x'}, 0, {obj: new Point(1,1), prop: 'x'}, {obj: new Point(1,1), prop: 'x'}, true) 
    }

    Sketchpad.arith.SumInequalityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v1 = ref(this, 'v1') + this.constantK, v2 = ref(this, 'v2'), v3 = ref(this, 'v3'), sum = v2 + v3, cond = this.isGeq ? v1 >= sum : v1 <= sum, e = cond ? 0 : sum - v1
	return e
    }

    Sketchpad.arith.SumInequalityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	v2 = ref(this, 'v2'), v3 = ref(this, 'v3'), sum = v2 + v3
	res = patch(this, 'v1', sum - this.constantK)
	return res
    }

}

module.exports.install = installArithmeticConstraints
