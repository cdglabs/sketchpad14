Examples.flightbooker = { }

function getDate(date) {
    var dateObj = undefined
    if (date) {
	date = date.match(/\//) ? date.split('/') : date.split('.')
	if (date.length == 3) {
	    var y = Number(date[2])
	    var m = Number(date[1])
	    var d = Number(date[0])
	    if (y && m && d) {
		m = m - 1
		dateObj = new Date(y, m, d)
	    }
	}
    }
    return dateObj
}

// --- Constraint Defs -------------------------------------------------------

Examples.flightbooker.BookButtonEnabled = function Examples__flightbooker__BookButtonEnabled(date1, date2, flightTypeMenu, bookButton, now) {
    this.date1 = date1
    this.date2 = date2
    this.flightTypeMenu = flightTypeMenu
    this.bookButton = bookButton
    this.now = now
}

sketchpad.addClass(Examples.flightbooker.BookButtonEnabled, true)

Examples.flightbooker.BookButtonEnabled.description = function() { return "..." }

Examples.flightbooker.BookButtonEnabled.prototype.description = function() { return "... ." }

Examples.flightbooker.BookButtonEnabled.prototype.propertyTypes = {date1: 'String', date2: 'String'}

Examples.flightbooker.BookButtonEnabled.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var date1 = this.date1, date2 = this.date2, now = this.now, flightType = this.flightTypeMenu.choice
    var date1P = getDate(date1.text), date2P = getDate(date2.text)
    var date2ok = date1P && (flightType == 0 || (date2P && date2P.getTime() >  date1P.getTime()))
    this.targetColor = (date1P && date1P.getTime() > now && date2ok) ? 'black' : 'gray'
    return this.bookButton.fontColor === this.targetColor ? 0 : 1
}

Examples.flightbooker.BookButtonEnabled.prototype.solve = function(pseudoTime, prevPseudoTime) {
    return {bookButton: {fontColor: this.targetColor}}
}

Examples.flightbooker.dateParseHighlight = function Examples__flightbooker__dateParseHighlight(dateField) {
    this.dateField = dateField
    this.dateFieldBox = dateField.box
}

sketchpad.addClass(Examples.flightbooker.dateParseHighlight, true)

Examples.flightbooker.dateParseHighlight.description = function() { return "..." }

Examples.flightbooker.dateParseHighlight.prototype.description = function() { return "... ." }

Examples.flightbooker.dateParseHighlight.prototype.propertyTypes = {dateField: 'String'}

Examples.flightbooker.dateParseHighlight.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var dateField = this.dateField
    this.targetColor = dateField.text === '' || getDate(dateField.text) ? 'white' : '#ffb2b2'
    return this.dateFieldBox.bgColor === this.targetColor ? 0 : 1
}

Examples.flightbooker.dateParseHighlight.prototype.solve = function(pseudoTime, prevPseudoTime) {
    return {dateFieldBox: {bgColor: this.targetColor}}
}

// --- Classes -------------------------------------------------------------

examples['flight booker'] = function() {

    rc.setOption('renderMode', 1)

    // --- Constraints ---------------------------------------------------------
    // --- Data ----------------------------------------------------------------    
    var flightTypes = ['one', 'two']
    var flightTypeIdx = 0
    var now = new Date().getTime()
    
    var o = {x: 500, y: 300}
    flightTypeButton = rc.add(new TextBox(new Point(o.x, o.y), ('one-way flight'), false, 26, 250, 40, '#f6ceec'))
    flightTypeButton.choice = 0
    bookButton = rc.add(new TextBox(new Point(o.x, o.y + 210), ('book'), false, 26, 250, 40, '#cccccc', undefined, 'gray'))
    var dateViews = []
    for (var i = 0; i < 2; i++) {
	var offset = i * 70
	var dateView = rc.add(new TextBox(new Point(o.x, o.y + 70 + offset), '', false, 26, 250, 45))
	rc.addConstraint(Examples.flightbooker.dateParseHighlight, undefined, dateView)

	dateViews.push(dateView)
    }
    rc.add(new Box(new Point(o.x - 20, o.y - 20), 290, 290, false, false, '#DDDDDD', '#DDDDDD', true, undefined, undefined), undefined, undefined, false, {unselectable: true, unmovable: true})

    // --- Constraints -------------------------------------------------------------
    rc.addConstraint(Examples.flightbooker.BookButtonEnabled, undefined, dateViews[0], dateViews[1], flightTypeButton, bookButton, now)
    
    // --- Time / Event Handling ---------------------------------------------
    sketchpad.registerEvent('pointerup', function(e) {
	if (rc.selection == flightTypeButton) {
	    flightTypeButton.choice  = (flightTypeButton.choice + 1) % 2
	    flightTypeButton.text = flightTypes[flightTypeButton.choice] + '-way flight'
	}})

        // adding a digit to value view
    sketchpad.registerEvent('keypress',
			    function(e) {
				for (var i = 0; i < 2; i++) {
				    var dateView = dateViews[i]
				    if (rc.selection == dateView) {
					var k = e.keyCode
					if (k >= 46 && k <= 57) {
					    dateView.text = '' + dateView.text
					    dateView.text += String.fromCharCode(k)
					}
				    }
				}
			    })

    // deleting a digit from value view
    rc.sketchpad.registerEvent('keydown', function(e) {
	for (var i = 0; i < 2; i++) {
	    var dateView = dateViews[i]
	    if (rc.selection == dateView) {
		var k = e.keyCode
		if (k == 8) {
		    dateView.text = '' + dateView.text
		    var l = dateView.text.length
		    if (l > 1) {
			dateView.text = dateView.text.substr(0, l - 1)
		    } else
			dateView.text = ''
		}
	    }
	}
    })

}

