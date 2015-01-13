Examples.slider = {}

// --- Classes -------------------------------------------------------------

Examples.slider.Slider = function Examples__slider__Slider(framePosition) {
    this.frame = rc.add(new Box(framePosition, 400, 40, undefined, undefined, 'black', 'gray'), undefined, undefined, undefined, {selectable: true, unmovable: true})
    this.button = rc.add(new Box(new Point(this.frame.position.x, this.frame.position.y), this.frame.width / 10, this.frame.height, undefined, undefined, undefined, 'black'), undefined, undefined,  true)
    this.position = this.button.position

}

sketchpad.addClass(Examples.slider.Slider)

Examples.slider.Slider.prototype.propertyTypes = {framePosition: 'Point'}

Examples.slider.Slider.prototype.valueFromPosition = function() {
    return Math.round(100 * ((this.position.x - this.frame.position.x) / (this.frame.width - this.button.width)))
}

Examples.slider.Slider.prototype.positionFromValue = function(val) {
    return this.frame.position.x + Math.ceil(val / 100 * (this.frame.width - this.button.width))
}

// draw

Examples.slider.Slider.prototype.draw = function(canvas, origin, options) {
    var ctxt = canvas.ctxt
}

// --- Constraint Defs -------------------------------------------------------

Examples.slider.SliderValueConstraint = function Examples__slider__SliderValueConstraint(slider, sliderValueView) {
    this.slider = slider
    this.sliderValueView = sliderValueView
    this.valueToSliderPositionMode = true
    this.sliderPos = slider.button.position    
}

sketchpad.addClass(Examples.slider.SliderValueConstraint, true)

Examples.slider.SliderValueConstraint.prototype.description = function() { return "Examples.slider.SliderValueConstraint(Box slider, TextBox sliderValueView) states that slider position corresponds with value shown by sliderValueView" }

Examples.slider.SliderValueConstraint.prototype.propertyTypes = {slider: 'Examples.slider.Slider', sliderValueView: 'TextBox'}

Examples.slider.SliderValueConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var slider = this.slider
    var sliderValueView = this.sliderValueView
    return sliderValueView.text - slider.valueFromPosition()
}

Examples.slider.SliderValueConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var slider = this.slider
    var sliderValueView = this.sliderValueView
    var sol
    if (this.valueToSliderPositionMode) {
	sol = {sliderPos: {x: slider.positionFromValue(sliderValueView.text || 0)}}
    } else
	sol = {sliderValueView: {text: slider.valueFromPosition()}}
    return sol
}

examples.slider = function() {
    rc.setOption('renderMode', 1)

    // --- Data ----------------------------------------------------------------
    var center = {x: 700, y: 350}
    rc.add(new TextBox(new Point(center.x - 300, center.y - 100), "Edit the value by clicking and typing in or moving the slider.", false, 20, 540, 40, '#81f781'))
    var sliderValueView = rc.add(new TextBox(new Point(center.x - 100, center.y), '0', false, 40, 80, 50))
    var slider = rc.add(new Examples.slider.Slider(new Point(center.x - 250, center.y + 100)))
    				
    // --- Constraints ---------------------------------------------------------

    rc.addConstraint(Sketchpad.arith.EqualityConstraint, {obj: slider.frame.position, prop: 'y'}, {obj: slider.position, prop: 'y'}, [2])
    rc.addConstraint(Sketchpad.arith.InequalityConstraint, {obj: slider.position, prop: 'x'}, {obj: slider.frame.position, prop: 'x'}, true)
    rc.addConstraint(Sketchpad.arith.SumInequalityConstraint, {obj: slider.position, prop: 'x'}, {obj: slider.frame.position, prop: 'x'}, {obj: slider.frame, prop: 'width'}, false, 1, 1, 1, -slider.button.width)
    var sliderConstraint = rc.addConstraint(Examples.slider.SliderValueConstraint, slider, sliderValueView)

    // --- Time / Event Handling ---------------------------------------------

    // toggling slider constraint's flow direction
    sketchpad.registerEvent('pointerdown',
			    function(e) {
				sliderConstraint.valueToSliderPositionMode = rc.selection != slider.button
			    })

    // adding a digit to value view
    sketchpad.registerEvent('keypress',
			    function(e) {
				if (rc.selection == sliderValueView) {
				    var k = e.keyCode
				    if (k >= 48 && k <= 57) {
					sliderValueView.text = '' + sliderValueView.text
					if (sliderValueView.text.length < 3) {
					    sliderValueView.text += String.fromCharCode(k)
					    sliderValueView.text = parseInt(sliderValueView.text)
					}
				    }
				}
			    })

    // deleting a digit from value view
    rc.sketchpad.registerEvent('keydown', function(e) { 
	if (rc.selection == sliderValueView) {
	    var k = e.keyCode
	    if (k == 8) {
		sliderValueView.text = '' + sliderValueView.text
		var l = sliderValueView.text.length
		if (l > 1) {
		    sliderValueView.text = sliderValueView.text.substr(0, l - 1)
		    sliderValueView.text = parseInt(sliderValueView.text)
		} else
		    sliderValueView.text = 0
	    }
	}
    })

};

