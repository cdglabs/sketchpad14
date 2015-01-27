Examples.button = { }

// --- Constraint Defs -------------------------------------------------------

examples['button'] = function() {

    // --- Data ----------------------------------------------------------------
    button = rc.add(new TextBox(new Point(600, 300), 0, false, 20, 40, 40, '#f6ceec'))

    // --- Constraints ---------------------------------------------------------
    rc.addConstraint(Sketchpad.arith.InequalityConstraint, undefined, {obj: button, prop: 'text'}, {obj: button, prop: 'text'}, false, 2, 1, 10)

    // --- Time / Event Handling ---------------------------------------------
    sketchpad.registerEvent('pointerdown', function(e) {
	if (rc.selection == button) {
	    button.text += 1
	    rc.redraw()
	}})
    
}

