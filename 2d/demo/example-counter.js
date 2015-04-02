Examples.counter = { }

// --- Constraint Defs -------------------------------------------------------

examples['counter'] = function() {

    // --- Data ----------------------------------------------------------------
    counter = rc.add(new TextBox(new Point(600, 300), 0, false, 20, 60, 40, '#f6ceec'))
    counter.count = 0
    button = rc.add(new TextBox(new Point(680, 300), "Click", false, 20, 60, 40, '#81f781'))
    rc.add(new Box(new Point(580,280), 180, 80, false, false, '#CCCCCC', '#CCCCCC', true, undefined, undefined), undefined, undefined, false, {unselectable: true, unmovable: true})

    // --- Constraints ---------------------------------------------------------
    rc.addConstraint(Sketchpad.arith.EqualProperties, undefined,  {obj: counter, prop: 'count'}, {obj: counter, prop: 'text'}, [2], 1, 1)

    // --- Time / Event Handling ---------------------------------------------
    sketchpad.registerEvent('pointerdown', function(e) {
	if (rc.selection == button) {
	    counter.count += 1
	    rc.redraw()
	}})
    
}

