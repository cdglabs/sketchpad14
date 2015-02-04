Examples.slider = {}

// --- Classes -------------------------------------------------------------

Examples.slider.Slider = function Examples__slider__Slider(valueView, isHoriz, framePosition, width, height, range, valueToSliderPositionMode) {
    this.valueView = valueView
    this.horiz = isHoriz
    this._prop1 = isHoriz ? 'x' : 'y'
    this._prop2 = isHoriz ? 'y' : 'x'
    this._prop3 = isHoriz ? 'width' : 'height'
    this.range = range || {start: 0, end: 100}
    this.frame = new Box(framePosition, width, height, undefined, undefined, 'black', 'gray')    
    var m = Math.max(2, (this.range.end - this.range.start) / 10)
    var w = this.frame.width / (isHoriz ? m : 1)
    var h = this.frame.height / (isHoriz ? 1 : m)
    this.button = new Box(new Point(this.frame.position.x, this.frame.position.y), w, h, undefined, undefined, undefined, '#bdbdbd')
    this.position = this.button.position
    this.valueToSliderPositionMode = valueToSliderPositionMode
    var p = this.button.position   
    this._buttonLine = new Line(p.plus({x: w/2, y: 5}), p.plus({x: w/2, y: h - 5}))
}

sketchpad.addClass(Examples.slider.Slider)

Examples.slider.Slider.prototype.propertyTypes = {framePosition: 'Point'}

Examples.slider.Slider.prototype.init = function() {
    // higher priority than drag coordinate constraint to ensure never goes out of frame
    rc.addConstraint(Sketchpad.arith.EqualityConstraint, 2, {obj: this.frame.position, prop: this._prop2}, {obj: this.position, prop: this._prop2}, [2]) 
    rc.addConstraint(Sketchpad.arith.InequalityConstraint, 0, {obj: this.position, prop: this._prop1}, {obj: this.frame.position, prop: this._prop1}, true)
    rc.addConstraint(Sketchpad.arith.SumInequalityConstraint, 0, {obj: this.position, prop: this._prop1}, {obj: this.frame.position, prop: this._prop1}, {obj: this.frame, prop: this._prop3}, false, 1, 1, 1, -this.button[this._prop3])
    if (this.valueView)
	this.valueConstraint = rc.addConstraint(Examples.slider.SliderValueConstraint, undefined, this, this.valueView)
}

Examples.slider.Slider.prototype.valueFromPosition = function() {
    var p1 = this._prop1
    var p3 = this._prop3
    var range = this.range
    var rangeLength = range.end - range.start
    return range.start + Math.round(rangeLength * ((this.position[p1] - this.frame.position[p1]) / (this.frame[p3] - this.button[p3])))
}

Examples.slider.Slider.prototype.positionFromValue = function(val) {
    var p1 = this._prop1
    var p3 = this._prop3
    var range = this.range
    var rangeLength = range.end - range.start
    return this.frame.position[p1] + Math.ceil((val - range.start) / rangeLength * (this.frame[p3] - this.button[p3]))
}

Examples.slider.Slider.prototype.draw = function(canvas, origin, options) {
    var ctxt = canvas.ctxt
    this.frame.draw(canvas, origin)
    this.button.draw(canvas, origin)
    var p = this.button.position, w = this.button.width
    this._buttonLine.p1 = p.plus({x: w/2, y: 5})
    this._buttonLine.p2 = p.plus({x: w/2, y: this.button.height - 5})
    this._buttonLine.draw(canvas, origin)
}

Examples.slider.Slider.prototype.grabPoint = function() {
    return this.position
}

Examples.slider.Slider.prototype.containsPoint = function(x, y) {
    return this.button.containsPoint(x, y)
}

Examples.slider.Slider.prototype.center = function() {
    return this.button.center()
}

Examples.slider.Slider.prototype.border = function() {
    return this.button
}

// --- Constraint Defs -------------------------------------------------------

Examples.slider.SliderValueConstraint = function Examples__slider__SliderValueConstraint(slider, sliderValueView) {
    this.slider = slider
    this.sliderValueViewObj = sliderValueView.obj
    this.sliderValueViewProp = sliderValueView.prop
    this.sliderPos = slider.button.position    
}

sketchpad.addClass(Examples.slider.SliderValueConstraint, true)

Examples.slider.SliderValueConstraint.description = function() { return "Examples.slider.SliderValueConstraint(Box slider, {obj: viewObj, prop: viewProp}) states that slider position corresponds with value of property viewProp of object viewObj" }

Examples.slider.SliderValueConstraint.prototype.description = function() { return "slider " + this.slider.__toString + " position corresponds with the value of " + this.sliderValueViewObj.__toString + "." + this.sliderValueViewProp + " ." }

Examples.slider.SliderValueConstraint.prototype.propertyTypes = {slider: 'Examples.slider.Slider'}

Examples.slider.SliderValueConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var slider = this.slider
    var sliderValueViewObj = this.sliderValueViewObj
    var sliderValueViewProp = this.sliderValueViewProp
    return sliderValueViewObj[sliderValueViewProp] - slider.valueFromPosition()
}

Examples.slider.SliderValueConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var slider = this.slider
    var p1 = slider._prop1
    var sliderValueViewObj = this.sliderValueViewObj
    var sliderValueViewProp = this.sliderValueViewProp
    var sol, val = {}
    if (slider.valueToSliderPositionMode) {
	val[p1] = slider.positionFromValue(sliderValueViewObj[sliderValueViewProp] || 0)
	sol = {sliderPos: val}
    } else {
	val[sliderValueViewProp] = slider.valueFromPosition()
	sol = {sliderValueViewObj: val}
    }
    return sol
}

examples.slider = function() {
    //sketchpad.setOption('debug', true)
    sketchpad.setOption('solveEvenWithoutErrorOnPriorityDifferences', true)
    rc.setOption('dragConstraintPriority', 0)
    // --- Data ----------------------------------------------------------------
    // --- Constraints ---------------------------------------------------------

    var center = {x: 700, y: 350}
    rc.add(new TextBox(new Point(center.x - 350, center.y - 100), "Edit the value by clicking and typing in or moving the slider.", false, 20, undefined, 40, '#81f781'))
    var sliderValueView = rc.add(new TextBox(new Point(center.x - 85, center.y), '0', false, 36, 80, 50))
    var slider = rc.add(new Examples.slider.Slider({obj: sliderValueView, prop: 'text'}, true, new Point(center.x - 250, center.y + 100), 400, 40, {start: 0, end: 100}))
    slider.init()
    
    // --- Time / Event Handling ---------------------------------------------

    // toggling slider constraint's flow direction
    sketchpad.registerEvent('pointerdown',
			    function(e) {
				slider.valueToSliderPositionMode = rc.selection != slider
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
		    if (sliderValueView.text === '-')
			sliderValueView.text = '0'
		    sliderValueView.text = parseInt(sliderValueView.text)
		} else
		    sliderValueView.text = 0
	    }
	}
    })

};

