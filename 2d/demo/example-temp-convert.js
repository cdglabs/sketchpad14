Examples.tempconv = {}

examples['temp conv'] = function() {

    var tempconv = [], sliderValueViews = []
    var center = {x: 800, y: 350}

    // --- Data ----------------------------------------------------------------
    rc.add(new TextBox(new Point(center.x - 50, center.y + 5), ('='), false, 25, 45, 40, '#FF8080'))

    rc.add(new TextBox(new Point(center.x - 230, center.y - 200), "Edit the value by clicking and typing.", false, 20, undefined, 40, '#81f781'))
    for (var i = 0; i < 2; i++) {
	var offset = i * 300
	rc.add(new TextBox(new Point(center.x - 150 + offset, center.y), (i == 1 ? 'C' : 'F'), false, 25, 40, 45, '#f6ceec'))
	var sliderValueView = rc.add(new TextBox(new Point(center.x - 250 + offset , center.y), '0', false, 30, 80, 45))
	sliderValueViews.push(sliderValueView)
    }
    rc.add(new Box(new Point(center.x - 300,center.y - 50), 530, 150, false, false, '#CCCCCC', '#CCCCCC', true, undefined, undefined), undefined, undefined, false, {unselectable: true, unmovable: true})

    // --- Constraints ---------------------------------------------------------
    var celciusFarenheitC = rc.addConstraint(Sketchpad.arith.SumRelation, undefined,  {obj: sliderValueViews[0], prop: 'text'}, {obj: sliderValueViews[1], prop: 'text'}, {obj: {x: 1}, prop: 'x'}, [1, 2], 5, -9, 0, 160)
    
    // --- Time / Event Handling ---------------------------------------------
    sketchpad.afterEachTimeStep = function() {
	for (var i = 0; i < 2; i++) {
	    var sliderValueView = sliderValueViews[i]
	    sliderValueView.text = Math.round(sliderValueView.text)
	}
    }

    // adding a digit to value view
    sketchpad.registerEvent('keypress',
			    function(e) {
				for (var i = 0; i < 2; i++) {
				    var sliderValueView = sliderValueViews[i]
				    if (rc.selection == sliderValueView) {
					celciusFarenheitC.onlyWriteTo = [((i + 1) % 2) + 1]
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
		    celciusFarenheitC.onlyWriteTo = [((i + 1) % 2) + 1]
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

