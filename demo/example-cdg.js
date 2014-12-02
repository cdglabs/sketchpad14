examples.cdg = function() {
    var fonts = ['Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold', 'Avant Garde', 'Calibri', 'Candara', 'Century Gothic', 'Franklin Gothic Medium', 'Futura', 'Geneva', 'Gill Sans', 'Helvetica', 'Impact', 'Lucida Grande', 'Optima', 'Segoe UI', 'Tahoma', 'Trebuchet MS', 'Verdana', 'Big Caslon', 'Bodoni MT', 'Book Antiqua', 'Calisto MT', 'Cambria', 'Didot', 'Garamond', 'Georgia', 'Goudy Old Style', 'Hoefler Text', 'Lucida Bright', 'Palatino', 'Perpetua', 'Rockwell', 'Rockwell Extra Bold', 'Baskerville', 'Times New Roman', 'Consolas', 'Courier New', 'Lucida Console', 'Lucida Sans Typewriter', 'Monaco', 'Andale Mono', 'Copperplate', 'Papyrus', 'cursive', 'monospace', 'serif', 'sans-serif', 'fantasy', 'Avenir', 'Bookman Old Style', 'Bradley Hand ITC', 'Century', 'Century Gothic', 'Comic Sans MS', 'Courier', 'Courier New', 'Georgia', 'Gentium', 'Impact', 'King', 'Lucida Console', 'Lalit', 'Modena', 'Monotype Corsiva', 'Papyrus', 'Tahoma', 'TeX', 'Times', 'Trebuchet MS',  'Verona']
    var colors = ['blue', '#cc3d3d', 'black', 'gray', '#4380e1', 'green', 'purple'] 
    var radius = 45, thickness = 15, width = 110, fontColor = 'white', opacity = 0.75, fontSize = 60, colorIdx = -1
    fonts.forEach(function(font) {	
	colorIdx = (colorIdx + 1) % colors.length
	var position = rc.getRandomPoint(), centerX = position.x, centerY = position.y,  color = colors[colorIdx]
	var p1 = rc.add(new Point(centerX, centerY, color, radius, undefined, opacity, fontColor, fontSize, font))
	var p2 = rc.add(new Point(centerX + width, centerY, color, radius, undefined, opacity, fontColor, fontSize, font))
	//var p3 = rc.add(new Point(centerX + width, centerY + width, color, radius, undefined, opacity, fontColor, fontSize, font))
	var p3 = rc.add(new Point(centerX + width, centerY + width, color, radius, undefined, opacity, fontColor, fontSize / 4, font))
	p1._selectionIndices.push('C')
	p2._selectionIndices.push('D')
	p3._selectionIndices.push(font)//'G')
	rc.add(new Line(p1, p2, color, thickness, undefined, opacity))
	rc.add(new Line(p2, p3, color, thickness, undefined, opacity))
	
	rc.addConstraint(Sketchpad.geom.LengthConstraint, p1, p2, width)
	rc.addConstraint(Sketchpad.geom.LengthConstraint, p2, p3, width)
	rc.addConstraint(Sketchpad.geom.OrientationConstraint, p2, p1, p2, p3, Math.PI / 2)
    })
    //rc.setOption('renderMode', 1)
};

