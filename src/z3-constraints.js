function installZ3Constraints(Sketchpad) {

    // This is a collection of z3 constraints that can be applied to
    // arbitrary properties of arbitrary objects. "References" are represented
    // as (object, propertyName) tuples, e.g., {obj: yourMom, prop: 'weight'}.

    Sketchpad.z3 = {
	waiting: false,
	output: undefined,
	skipStep: 0,
	solveAfterNSkipping: 0,
	cache: undefined,
	solve: function (problem) {
	    if ("WebSocket" in window) {
		var ws = new WebSocket("ws://localhost:8080")
		ws.onopen = function() {
		    ws.send(problem)
		}
		ws.onmessage = function (evt) {
		    var received_msg = evt.data
		    this.waiting = false
		    this.output = eval('(' + received_msg + ')')	    
		}.bind(this)
		ws.onclose = function() {
		    alert("No connection to Z3 server...") 
		}
	    } else {
		alert("WebSocket NOT supported by your Browser!")
	    }
	}
    }

}

module.exports.install = installZ3Constraints
