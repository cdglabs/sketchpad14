Examples.timer = { }

// --- Constraint Defs -------------------------------------------------------


// --- Classes -------------------------------------------------------------

examples['timer'] = function() {

    rc.setOption('renderMode', 1)

    // --- Constraints ---------------------------------------------------------
    // --- Data ----------------------------------------------------------------    
    var timer = rc.add(new Timer(1))
    var o = {x: 500, y: 300}
    var box = rc.add(new Box(new Point(o.x, o.y), 0, 40, false, false, 'red', 'red'))
    var frame = rc.add(new Box(new Point(o.x, o.y), 250, 40, false, false, '#f6ceec', '#f6ceec'))
    var button = rc.add(new TextBox(new Point(o.x, o.y + 210), ('reset'), false, 26, 250, 40, '#cccccc', undefined, 'black'))
    var options = {duration: 10}
    var slider = rc.add(new Examples.slider.Slider({obj: options, prop: 'duration'}, true, new Point(o.x, o.y + 110), 250, 40, {start: 0 , end: 100}, false), undefined, undefined, true)
    slider.init()
    var text9a = rc.add(new TextBox(new Point(o.x + 50, o.y + 60), 'timer duration is        seconds.', false, 16, 100, 30, '#DDDDDD', 'sans-serif', 'black', false, 'lighter', false), undefined, undefined, true)
    var text9b = rc.add(new TextBox(new Point(o.x + 110, o.y + 60), options.duration, false, 16, 20, 30, '#DDDDDD', 'sans-serif', '#ff0000', false, 'lighter', false), undefined, undefined, true)

    rc.add(new Box(new Point(o.x - 20, o.y - 20), 290, 290, false, false, '#DDDDDD', '#DDDDDD', true, undefined, undefined), undefined, undefined, false, {unselectable: true, unmovable: true})

    // --- Constraints -------------------------------------------------------------
    rc.addConstraint(Sketchpad.simulation.TickingTimer, undefined, timer)
    rc.addConstraint(Sketchpad.arith.EqualProperties, undefined,  {obj: options, prop: 'duration'}, {obj: text9b, prop: 'text'}, [2], 1, 1)
    
    // --- Time / Event Handling ---------------------------------------------
    sketchpad.registerEvent('pointerup', function(e) {
	if (rc.selection == button) {
	    box.width = 0
	}})

    sketchpad.setOnEachTimeStep(function(pseudoTime, prevPseudoTime) {
	box.width += 1 / options.duration
    }, "...")


}

