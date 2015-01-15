Examples.sliders = {}

examples.sliders = function() {
    rc.setOption('dragConstraintPriority', 0)

    var sliders = [], sliderValueViews = []
    var center = {x: 800, y: 350}

    // --- Data ----------------------------------------------------------------

    rc.add(new TextBox(new Point(center.x - 400, center.y - 200), "Edit the value by clicking and typing in or moving the slider.", false, 20, undefined, 40, '#81f781'))
    for (var i = 0; i < 2; i++) {
	var offset = i * 200
	rc.add(new TextBox(new Point(center.x - 100, center.y + offset - 100), (i == 1 ? '~feet' : '~meter'), false, 25, 120, 50, '#f6ceec'))
	var sliderValueView = rc.add(new TextBox(new Point(center.x - 200, center.y + offset - 100), '0', false, 40, 80, 50))
	sliderValueViews.push(sliderValueView)
	var slider = rc.add(new Examples.slider.Slider({obj: sliderValueView, prop: 'text'}, true, new Point(center.x - (250 + (i * 300)), center.y + offset), 300 * (i > 0 ? 3 : 1), 40, {start: -(100 + offset) , end: 100 + offset}, true))
	slider.init()
	sliders.push(slider)
    }
    var meterFeetC = rc.addConstraint(Sketchpad.arith.EqualityConstraint,  {obj: sliderValueViews[0], prop: 'text'}, {obj: sliderValueViews[1], prop: 'text'}, [1, 2], 3.28084, 1)
    
    // --- Time / Event Handling ---------------------------------------------

    sketchpad.afterEachTimeStep = function() {
	for (var i = 0; i < 2; i++) {
	    var sliderValueView = sliderValueViews[i]
	    sliderValueView.text = Math.round(sliderValueView.text)
	}
    }
    
    // toggling slider constraint's flow direction
    sketchpad.registerEvent('pointerdown',
			    function(e) {
				var anyButtonClick = false
				for (var i = 0; i < 2; i++) {
				    var  buttonClick = rc.selection == sliders[i]
				    sliders[i].valueToSliderPositionMode = !buttonClick
				    if (buttonClick)
					anyButtonClick = true
				}
				if (anyButtonClick)
				    meterFeetC.onlyWriteTo = [1, 2]
			    })

    // adding a digit to value view
    sketchpad.registerEvent('keypress',
			    function(e) {
				for (var i = 0; i < 2; i++) {
				    var sliderValueView = sliderValueViews[i]
				    if (rc.selection == sliderValueView) {
					meterFeetC.onlyWriteTo = [((i + 1) % 2) + 1]
					var k = e.keyCode
					if (k >= 48 && k <= 57) {
					    sliderValueView.text = '' + sliderValueView.text
					    if (sliderValueView.text.length < 3) {
						sliderValueView.text += String.fromCharCode(k)
						sliderValueView.text = parseInt(sliderValueView.text)
					    }
					}
				    }
				}
			    })

    // deleting a digit from value view
    rc.sketchpad.registerEvent('keydown', function(e) {
	for (var i = 0; i < 2; i++) {
	    var sliderValueView = sliderValueViews[i]
	    if (rc.selection == sliderValueView) {
		var k = e.keyCode
		if (k == 8) {
		    meterFeetC.onlyWriteTo = [((i + 1) % 2) + 1]
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
	}
    })

};

