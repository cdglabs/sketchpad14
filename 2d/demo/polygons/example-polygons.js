Examples.polygons = { }

var plus = Sketchpad.geom.plus
var minus = Sketchpad.geom.minus
var magnitude = Sketchpad.geom.magnitude
var scaledBy = Sketchpad.geom.scaledBy
var urls = {meh_triangle: './polygons/img/meh_triangle.png', meh_square: './polygons/img/meh_square.png', sad_triangle: './polygons/img/sad_triangle.png', sad_square: './polygons/img/sad_square.png', yay_triangle: './polygons/img/yay_triangle.png', yay_square: './polygons/img/yay_square.png', banner: './polygons/img/intro_banner.png', dragging: './polygons/img/dragging.png'}
 
// --- Classes -------------------------------------------------------

Examples.polygons.Shape = function Examples__polygons__Shape(position, kind, optMood, optRotation, optBoard, optSize) {
    this.position = position
    this.kind = kind
    this.mood = optMood || 0
    this.image = new Image1(position, this.getUrl(this.mood), optRotation || randomRotation(), optSize || 0.6)
    if (optBoard) {
	this.board = optBoard
	this.boardPos = optBoard.getCoord(position)
    }
}

sketchpad.addClass(Examples.polygons.Shape)

Examples.polygons.Shape.prototype.propertyTypes = {position: 'Point', kind: 'Number'}

Examples.polygons.Shape.prototype.draw = function(canvas, origin) { this.image.draw(canvas, origin) }
Examples.polygons.Shape.prototype.grabPoint = function() { return this.position }
Examples.polygons.Shape.prototype.border = function() { return this.image.border() }
Examples.polygons.Shape.prototype.center = function() { return this.image.center() }
Examples.polygons.Shape.prototype.containsPoint = function(x, y) { return this.image.containsPoint(x, y) }
Examples.polygons.Shape.prototype.getUrl = function(mood) {    
    var kindMood = (mood == 0 ? 'meh' :  (mood == 1 ? 'yay' : 'sad')) + '_' + (this.kind == 1 ? 'square' : 'triangle')
    return urls[kindMood]
}
Examples.polygons.Shape.prototype.getMood = function() { return this.board.getMood(this) }

Examples.polygons.Board = function Examples__polygons__Board(position, width, height, squareLength, cells, visible) {
    this.position = position
    this.width = width
    this.height = height
    this.squareLength = squareLength
    this.cells = cells
    this.visible = visible
    this.kindPercentage = 33
}

sketchpad.addClass(Examples.polygons.Board)

Examples.polygons.Board.prototype.propertyTypes = {position: 'Point', width: 'Number', height: 'Number'}

Examples.polygons.Board.prototype.solutionJoins = function() {
    return {cells: sketchpad.dictionaryAddJoinSolutions}
}

Examples.polygons.Board.prototype.draw = function(canvas, origin) {
    if (this.visible) {
	var position = this.position, squareLength = this.squareLength, width = this.width, height = this.height
	var x = position.x, y = position.y
	var w = width * squareLength, h = height * squareLength
	for (var i = 0; i <= height; i++) {	
	    new Line(new Point(x, y, 'white'), new Point(x + w, y, 'white')).draw(canvas, origin)
	    y += squareLength
	}
	y = position.y
	for (var i = 0; i <= width; i++) {	
	    new Line(new Point(x, y, 'white'), new Point(x, y + h, 'white')).draw(canvas, origin)
	    x += squareLength	
	}
    }
}

Examples.polygons.Board.prototype.border = function() {  return new Box(this.position, this.width * this.squareLength, this.height * this.squareLength) }
Examples.polygons.Board.prototype.center = function() { return this.position }
Examples.polygons.Board.prototype.containsPoint = function(x, y) {
    return this.border().containsPoint(x, y)
}

Examples.polygons.Board.prototype.fits = function(shape, pos) {
    var there = this.getCell(pos.i, pos.j)
    return there == 0 || there === shape
}

Examples.polygons.Board.prototype.getCell = function(i, j) { return this.cells[i * this.width + j] }
Examples.polygons.Board.prototype.setCell = function(i, j, p) { this.cells[i * this.width + j] = p }
Examples.polygons.Board.prototype.getCoordFromIndex = function(k) { var i = Math.floor(k / this.width), j = k % this.width; return {i: i, j: j} }

Examples.polygons.Board.prototype.getCoord = function(pos) {
    var unit = this.squareLength
    var offset = minus(pos.plus({x: unit / 2, y: unit / 2}), this.position)
    var offX = Math.floor(offset.x / unit)
    var offY = Math.floor(offset.y / unit)
    return {i: offY, j: offX}
}

Examples.polygons.Board.prototype.getPos = function(coord) {
    var unit = this.squareLength
    return this.position.plus({x: (coord.j * unit) , y:  (coord.i * unit) })
}
Examples.polygons.Board.prototype.getEmptyCoord = function(shape) {
    var pos = shape.boardPos
    var i = pos.i, j = pos.j
    var cells = this.cells
    var count = cells.length
    var k = -1
    var empties = []
    for (var k = 0; k < count; k++)
	if (cells[k] == 0)
	    empties.push(k)
    var res = undefined
    if (empties.length > 0) {
	k = Math.floor(Math.random() * empties.length)
	var ij = this.getCoordFromIndex(empties[k])
	res = {i: ij.i, j: ij.j}
    }
    return res
}

Examples.polygons.Board.prototype.getMood = function(shape) {
    var kind = shape.kind
    var pos = shape.boardPos
    var count = 1, kindCount = 1
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
	if (i < 0 || i >= this.height) continue
	for (var j = pos.j - 1; j <= pos.j + 1; j++) {
	    if (j < 0 || j >= this.width || (i == pos.i && j == pos.j)) continue
	    var there = this.getCell(i, j)
	    if (there == 0) continue
	    count++
	    if (there.kind == kind) kindCount++
	}
    }
    var percentage = kindCount / count
    return percentage == 1 ? 0 : (percentage >= (this.kindPercentage / 100) ? 1 : -1)
}

Examples.polygons.Board.prototype.firstSadShape = function() {
    var cells = this.cells
    var count = cells.length
    var res = undefined
    for (var k = 0; k < count; k++) {
	var e = cells[k]
	if (e !== 0 && this.getMood(e) == -1) {
	    res = e
	    break
	}
    }
    return res
}

// --- Constraint Defs -------------------------------------------------------

Examples.polygons.ImageSwingConstraint = function Sketchpad__geom__ImageSwingConstraint(shape, optSwingOnlyWhenUnhappy, onlyOnDangle) {
    this.shape = shape
    this.swingOnlyWhenUnhappy = optSwingOnlyWhenUnhappy
    this.onlyOnDangle = onlyOnDangle
    this.image = shape.image
    this.image._origRotation = this.image.rotation
    this.image._swingSpeed = onlyOnDangle ? .5 : 2
    this._lastPos = shape.position
}

sketchpad.addClass(Examples.polygons.ImageSwingConstraint, true)

Examples.polygons.ImageSwingConstraint.prototype.description = function() { return  "Examples.polygons.ImageSwingConstraint(Shape S) causes image of S to swing." } 

Examples.polygons.ImageSwingConstraint.prototype.propertyTypes = {image: 'Shape'}

Examples.polygons.ImageSwingConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var shape = this.shape, pos = shape.position
    if (this.swingOnlyWhenUnhappy && shape.getMood() >= 0)
	return 0
    var image = this.image
    var t = image._swingSpeed * (pseudoTime / 10)
    return (image._origRotation + (Math.sin(t) * Math.PI / 10)) - image.rotation
}

Examples.polygons.ImageSwingConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var image = this.image
    var t = image._swingSpeed * (pseudoTime / 10)
    return {image: {rotation: image._origRotation + (Math.sin(t) * Math.PI / 10)}}
}

Examples.polygons.ImageSwingConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
    if (this.onlyOnDangle) {
	var movement = this.shape.position.x - this._lastPos.x
	var movementA = Math.abs(movement)
	if (movementA > 0)
	    this.image._swingSpeed += (movement / 200)
	else {
	    this.image._swingSpeed /= 1.05
	    if (this.image._swingSpeed < 0.001)
		this.image._swingSpeed = 0
	}
	this._lastPos = this.shape.position.copy()
    }
}

//  ShapePlacementConstraint

Examples.polygons.ShapePlacementConstraint = function Examples__polygons__ShapePlacementConstraint(shape) {
    this.shape = shape
    this.board = shape.board
    this.shapePos = shape.position
    this.shapeBoardPos = shape.boardPos
    this.boardCells = this.board.cells
}

sketchpad.addClass(Examples.polygons.ShapePlacementConstraint, true)

Examples.polygons.ShapePlacementConstraint.prototype.description = function() {
    return "Examples.polygons.ShapePlacementConstraint(Shape P) states that if P is moved inside the board and it fits in the current square it should be placed nicely on the P's board B and B should add it in its list of placed shapes."
}

Examples.polygons.ShapePlacementConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var shapePos = this.shapePos
    var board = this.board
    var boardPoint = board.position
    var inside = board.containsPoint(shapePos.x, shapePos.y)
    var diff = 0
    var unit = board.squareLength
    var posCoord = board.getCoord(shapePos)
    var offY = posCoord.i
    var offX = posCoord.j 
    if (inside && board.fits(this.shape, {i: offY, j: offX})) {
	this._offX = offX
	this._offY = offY
	this._placing = true
	this._target = plus(boardPoint, {x: offX * unit, y: offY * unit})
    } else {
	this._placing = false
	this._target = this.shape._origPos
    }
    diff = magnitude(minus(this._target, shapePos))
    return diff
}

Examples.polygons.ShapePlacementConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var board = this.board, shape = this.shape
    var dict = {}
    var sol = {shapePos: {x: this._target.x, y: this._target.y}}
    if (this._placing) {
	var posCoord = shape.boardPos
	var offY = posCoord.i
	var offX = posCoord.j 
	var dict = {}
	dict[((this._offY * board.width) + this._offX)] = shape
	dict[((offY * board.width) + offX)] = 0
	sol.board = {cells: dict}
	sol.shapeBoardPos = {i: this._offY, j: this._offX}
    }
    return sol
}

Examples.polygons.ShapeMoodConstraint = function Examples__polygons__ShapeMoodConstraint(shape) {
    this.shape = shape
    this.shapeImage = shape.image
}

sketchpad.addClass(Examples.polygons.ShapeMoodConstraint, true)

Examples.polygons.ShapeMoodConstraint.prototype.description = function() {
    return "Examples.polygons.ShapeMoodConstraint(Shape P) states that shapes image should reflect its sadness or happiness."
}

Examples.polygons.ShapeMoodConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var shape = this.shape
    this._targetMood = shape.getMood()
    return (shape.mood ==  this._targetMood && this.shapeImage.url === this.shape.getUrl(this._targetMood)) ? 0 : 1
}

Examples.polygons.ShapeMoodConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var sol = {shape: {mood: this._targetMood},  shapeImage: {url: this.shape.getUrl(this._targetMood)}}
    return sol
}

Examples.polygons.ShapeMoveWhenSadConstraint = function Examples__polygons__ShapeMoveWhenSadConstraint(shape) {
    this.shape = shape
    this.board = shape.board
    this.shapePos = shape.position
    this.shapeBoardPos = shape.boardPos
}

sketchpad.addClass(Examples.polygons.ShapeMoveWhenSadConstraint, true)

Examples.polygons.ShapeMoveWhenSadConstraint.prototype.description = function() {
    return "Examples.polygons.ShapeMoveWhenSadConstraint(Shape P) states that shapes moves when its sad."
}

Examples.polygons.ShapeMoveWhenSadConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var shape = this.shape
    return (shape.mood ==  -1 && shape === shape.board.firstSadShape()) ? 1 : 0
}

Examples.polygons.ShapeMoveWhenSadConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var shape = this.shape
    var oldCell = shape.boardPos
    var board = shape.board
    var empty = board.getEmptyCoord(shape)
    var sol = {}
    if (empty) {
	var pos = board.getPos(empty)
	sol.shapePos = {x: pos.x, y: pos.y}
	var dict = {}
	dict[((empty.i * board.width) + empty.j)] = shape
	dict[((oldCell.i * board.width) + oldCell.j)] = 0
	sol.board = {cells: dict}
	sol.shapeBoardPos = {i: empty.i, j: empty.j}
    }
    return sol
}

function randomRotation() {
    return Math.random()*(Math.PI / 10)
}

examples['polygons'] = function() {
    //sketchpad.setOption('debug', true)
    //sketchpad.setOption('unrollOnConflicts', true)
    sketchpad.setOption('solveEvenWithoutErrorOnPriorityDifferences', true)
    rc.setOption('dragConstraintPriority', 0)

    rc.setOption('renderMode', 1)
    rc.canvas.height = window.innerHeight * 5

    // ==================== Intro =================

    // --- Data ----------------------------------------------------------------    
    scratch = sketchpad.scratch
    
    var frame1 = {x: 200, y: 0, width: 1150, height: 500}
    frame1.midx = frame1.x + (frame1.width / 2)
    frame1.endx = frame1.x + (frame1.width)
    frame1.endy = frame1.y + (frame1.height)

    var swingingShapes = []
    rc.add(new Box(new Point(frame1.x, frame1.y), frame1.width, frame1.height, false, false, 'black', 'black', true, undefined, undefined), undefined, undefined, true, {unselectable: true, unmovable: true})
    rc.add(new TextBox(new Point(frame1.x + (frame1.width / 2) - 590, frame1.y + 100), 'PARABLE OF (CONSTRAINABLE) POLYGONS', false, 45, 800, 80, 'black', 'fantasy', 'white', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    rc.add(new TextBox(new Point(frame1.x + (frame1.width / 2) - 570, frame1.y + 200), 'A PLAYABLE (CONSTRAINT-BASED) POST ON THE SHAPE OF SOCIETY', false, 25, 800, 80, 'black', 'fantasy', 'gray', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    rc.add(new TextBox(new Point(frame1.x + (frame1.width / 2) - 60, frame1.y + 300), 'based on "Parable of the Polygons":', false, 16, 100, 80, 'black', 'fantasy', 'gray', false), undefined, undefined, true, {unselectable: true, unmovable: true})
    var link = rc.add(new TextBox(new Point(frame1.x + (frame1.width / 2) - 120, frame1.y + 330), 'http://ncase.me/polygons/', false, 16, 220, 30, 'black', 'fantasy', 'white', false), undefined, undefined, true, {unselectable: false, unmovable: true})

    for(var i=frame1.x;i<frame1.x + frame1.width;i+=50){
	var tt = (i-frame1.midx)/frame1.midx;
	var num;
	if(i>frame1.midx){
	    num = Math.ceil(tt*tt*4);
	}else{
	    num = Math.ceil(tt*tt*7);
	}
	for(var j=0;j<num+1;j++){
	    var x = i + Math.random()*20-10;
	    var y = frame1.endy - 110 - 170*Math.pow(t,2);
	    if(i>frame1.midx){
		y += j*50 + Math.random()*20-10;
	    }else{
		y += j*30 + Math.random()*20-10;
	    }
	    if(x>600&&x<frame1.endx-400) continue;
	    var t = (x-frame1.midx)/frame1.midx;
	    var kind = x < frame1.midx ? 2 : 1
	    if(!isNaN(y))
		swingingShapes.push(rc.add(new Examples.polygons.Shape(new Point(x, frame1.y + y), kind, 0, randomRotation()), undefined, undefined, true))
	}	
    }
    swingingShapes.push(rc.add(new Examples.polygons.Shape(new Point(frame1.midx - 20 - 30 , frame1.endy - 70), 2, 0,  randomRotation()), undefined, undefined, true))
    swingingShapes.push(rc.add(new Examples.polygons.Shape(new Point(frame1.midx - 20 + 30 , frame1.endy - 70), 1, 0, randomRotation()), undefined, undefined, true))

    // --- Constraints ---------------------------------------------------------
      swingingShapes.forEach(function(shape) {
	  rc.addConstraint(Examples.polygons.ImageSwingConstraint, undefined, shape)
      })
    
    // ==================== Chapter1 =================
    
    // --- Data ----------------------------------------------------------------    
    var frame2 = {x: 270, y: frame1.endy + 50, width: frame1.width, height: 130, margin: 100}
    frame2.endy = frame2.y + frame2.height

    var text1 = rc.add(new TextBox(new Point(frame2.x + frame2.margin,   frame2.y), 'This is a story of how harmless choices can make a harmful world.', false, 22, 800, 80, 'black', 'sans-serif', 'black', true, 'bold', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    var text2 = rc.add(new TextBox(new Point(frame2.x + frame2.margin, frame2.y + 50), 'These little cuties are 50% Triangles, 50% Squares, and 100% slightly shapist.', true, 22, 800, 80, 'black', 'sans-serif', 'black', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    text2.add('But only slightly! In fact, every polygon *prefers* being in a diverse crowd:')

    // ==================== Mini =================

    function addBoard(frame, grid, shapeSize, currBoard, addSlider) {
	if (currBoard) {
	    currBoard.cells.forEach(function (s) { if (s !== 0) { rc.remove(s) } })
	    if (currBoard.slider)
		rc.removeAll([currBoard.slider, currBoard.sliderText1, currBoard.sliderText2])
	    rc.remove(currBoard)
	}
	var boardShapes = []
	var board = rc.add(new Examples.polygons.Board(new Point(frame.x, frame.y), frame.cols, frame.rows, frame.squareLength, grid, false), undefined, undefined, false, {unselectable: true, unmovable: true})
	for (var i = 0; i < frame.rows; i++) {
	    for (var j = 0; j < frame.cols; j++) {
		var cell = board.getCell(i, j)
		if (cell == 0) continue
		var x = frame.x + j * frame.squareLength
		var y = frame.y + i * frame.squareLength
		var shape = rc.add(new Examples.polygons.Shape(new Point(x, y), cell, undefined, undefined, board, shapeSize), undefined, undefined, true)
		board.setCell(i, j, shape)
		boardShapes.push(shape)
	    }
	}
	boardShapes.forEach(function(shape) {
	    rc.addConstraint(Examples.polygons.ShapeMoodConstraint, undefined, shape)
	    rc.addConstraint(Examples.polygons.ImageSwingConstraint, undefined, shape, true)
	})
	if (addSlider) {
	    slider = rc.add(new Examples.slider.Slider({obj: board, prop: 'kindPercentage'}, true, new Point(frame.x + (frame.width / 2) + 335, frame.endy - 160), 430, 40, {start: 0 , end:100}, true),  undefined, undefined, true, {unselectable: false, unmovable: false})
	    slider.init()
	    board.slider = slider
	    var text9a = rc.add(new TextBox(new Point(frame.x + (frame.width / 2) + 145, frame.endy - 200), 'i\'ll move if less than       %  of my neighbors are like me.', false, 16, 800, 80, 'black', 'sans-serif', 'white', true, 'lighter', false), undefined, undefined, true, {unselectable: true, unmovable: true})
	    var text9b = rc.add(new TextBox(new Point(frame.x + (frame.width / 2) + 480, frame.endy - 200), board.kindPercentage, false, 16, 50, 80, 'black', 'sans-serif', '#ff0000', true, 'lighter', false), undefined, undefined, true, {unselectable: true, unmovable: true})
	    board.sliderText1 = text9a
	    board.sliderText2 = text9b
	    rc.addConstraint(Sketchpad.arith.EqualityConstraint, undefined,  {obj: board, prop: 'kindPercentage'}, {obj: text9b, prop: 'text'}, [2], 1, 1)
	}
	return board
    }

    function getGrid(cols, rows) {
	var res = new Array()
	var ctr = 0
	for (var i = 0 ; i < rows; i++)
	    for (var j = 0; j < cols; j++)
		res[ctr++] = (Math.random() < 0.80 ? (Math.random() < 0.5 ? 2 : 1) : 0)
	return res
    }

    function resetBoard(frame, shapeSize, currBoard, addSlider) {
        var grid = getGrid(frame.cols, frame.rows)
	return addBoard(frame, grid, shapeSize, currBoard, addSlider)
    }

    // --- Data ----------------------------------------------------------------    
    var frame3 = {x: 370, y: frame2.endy + 50, cols: 12, rows: 5, width: 12 * 65, height: 5 * 65, squareLength: 65}
    frame3.endy = frame3.y + frame3.height
    rc.add(new Image1(new Point(frame3.x + (frame3.width / 2) - 390, frame3.y), urls.dragging, undefined, 1, 1), undefined, undefined, undefined, {unselectable: true, unmovable: true})
    var grid1 = [
	1,1,1,0,0,0,0,0,0,2,1,2,
	1,1,1,0,0,0,0,0,0,1,2,1,
	1,1,2,0,0,0,0,0,0,0,1,2,
	1,1,1,0,0,0,0,0,0,1,2,1,
	1,1,1,0,0,0,0,0,0,2,1,2
    ];
    var board1 = addBoard(frame3, grid1, .6)
    
        // ==================== Chapter2 =================
    
    // --- Data ----------------------------------------------------------------    
    var frame4 = {x: 270, y: frame3.endy + 80, width: frame1.width, height: 130, margin: 100}
    frame4.endy = frame4.y + frame4.height

    var text1 = rc.add(new TextBox(new Point(frame4.x + frame4.margin, frame4.y), '', true, 22, 800, 80, 'black', 'sans-serif', 'black', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    text1.add('You can only move them if they\'re unhappy with their immediate neighborhood.')
    text1.add('Once they\'re OK where they are, you can\'t move them until they\'re unhappy with')
    text1.add('their neighbors again. Theyve got one, simple rule:')
    var text2 = rc.add(new TextBox(new Point(frame4.x + frame4.margin - 75,   frame4.y + 120), '"I wanna move if less than 1/3 of my neighbors are like me."', false, 22, 800, 80, 'black', 'sans-serif', 'black', true, 'bold', false), undefined, undefined, true, {unselectable: true, unmovable: true})

    // --- Data ----------------------------------------------------------------
    var slider
    var frame5 = {x: 370, y: frame4.endy + 50, cols: 3, rows: 3, width: 3 * 80, height: 3 * 80, squareLength: 80, margin: 30}
    frame5.endy = frame5.y + frame5.height
    var grid2 = [
	1,1,1,
	1,2,1,
	1,0,2
    ];    
    var board2 = addBoard(frame5, grid2, .7)
    var text3a = rc.add(new TextBox(new Point(frame5.x + frame5.margin - 30, frame5.endy + 20), 'unhappy', true, 15, 800, 80, 'black', 'sans-serif', 'red', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    var text3b = rc.add(new TextBox(new Point(frame5.x + frame5.margin + 30, frame5.endy + 20), ': only 1 out of 6 neighbors', true, 15, 800, 80, 'black', 'sans-serif', 'black', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    text3b.add('are like me. less than 1/3.')

    frame5.x += frame5.width + 30
    rc.add(new Box(new Point(frame5.x - 15, frame5.y), 5, frame5.height + 50, false, false, '#bdbdbd', '#bdbdbd', true, undefined, undefined), undefined, undefined, true, {unselectable: true, unmovable: true})
    var grid3 = [
	1,0,1,
	1,2,1,
	2,0,2
    ];
    var board3 = addBoard(frame5, grid3, .7)
    frame5.x += frame5.width + 30
    var text4a = rc.add(new TextBox(new Point(frame5.x + frame5.margin - 300, frame5.endy + 20), 'happy', true, 15, 800, 80, 'black', 'sans-serif', 'red', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    var text4b = rc.add(new TextBox(new Point(frame5.x + frame5.margin - 250, frame5.endy + 20), ': 2 out of 6 neighbors are like ', true, 15, 800, 80, 'black', 'sans-serif', 'black', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    text4b.add('me. exactly 1/3.')
    rc.add(new Box(new Point(frame5.x - 15, frame5.y), 5, frame5.height + 50, false, false, '#bdbdbd', '#bdbdbd', true, undefined, undefined), undefined, undefined, true, {unselectable: true, unmovable: true})
    var grid4 = [
	2,0,2,
	2,2,2,
	2,0,2
    ];
    var board4 = addBoard(frame5, grid4, .7)
    frame5.x += frame5.width + 30
    var text4a = rc.add(new TextBox(new Point(frame5.x + frame5.margin - 290, frame5.endy + 20), 'meh', true, 15, 800, 80, 'black', 'sans-serif', 'red', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    var text4b = rc.add(new TextBox(new Point(frame5.x + frame5.margin - 250, frame5.endy + 20), ': all neighbors are like me. (also ', true, 15, 800, 80, 'black', 'sans-serif', 'black', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    text4b.add('meh if i\'ve got no neighbors')

    var frame6 = {x: frame4.x, y: frame5.endy + 120, width: frame5.width, height: 100, margin: frame4.margin}
    frame6.endy = frame5.y + frame6.height
    var text5 = rc.add(new TextBox(new Point(frame6.x + frame6.margin, frame6.y), 'Harmless, right? Every polygon would be happy with a mixed neighborhood.', true, 22, 800, 80, 'black', 'sans-serif', 'black', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    text5.add('Surely their small bias can\'t affect the larger shape society that much? Well...')
    var text6 = rc.add(new TextBox(new Point(frame6.x + frame6.margin - 75,   frame6.y + 90), 'drag & drop unhappy polygons until nobody is unhappy:', true, 22, 800, 80, 'black', 'sans-serif', 'black', true, 'bold', false), undefined, undefined, true, {unselectable: true, unmovable: true})
    var text7 = rc.add(new TextBox(new Point(frame6.x + frame6.margin - 75,   frame6.y + 120), '(just move them to random empty spots. don\'t think too much about it.)', true, 18, 800, 80, 'black', 'sans-serif', 'black', true, 'bold', false), undefined, undefined, true, {unselectable: true, unmovable: true})

    var frame7 = {x: frame6.x + 210, y: frame6.endy + 470, cols: 10, rows: 10, width: 10 * 55, height: 10 * 55, squareLength: 55}
    frame7.endy = frame7.y + frame7.height + 50
    rc.add(new Box(new Point(frame1.x, frame7.y - 20), frame1.width, frame7.height + 140, false, false, '#151515', '#151515', true, undefined, undefined), undefined, undefined, true, {unselectable: true, unmovable: true})
    var board5 = resetBoard(frame7, .5) 
    var resetButton1 = rc.add(new TextBox(new Point(frame1.x + (frame1.width / 2) - 140, frame7.endy - 20), ('   NEW BOARD'), false, 30, 225, 40, '#b40404', 'sans-serif', 'white', false, 'lighter', true, 16), undefined, undefined, true, {unselectable: false, unmovable: true})

    var frame8 = {x: frame6.x, y: frame7.endy + 200, cols: 20, rows: 20, width: 20 * 30, height: 600, squareLength: 30}
    frame8.endy = frame8.y + frame8.height
    var text8 = rc.add(new TextBox(new Point(frame8.x + 60,   frame8.y - 80 ), 'finally, a big ol\' sandbox to play around in.', true, 22, 800, 80, 'black', 'sans-serif', 'black', true, 'bold', false), undefined, undefined, true, {unselectable: true, unmovable: true})

    rc.add(new Box(new Point(frame1.x, frame8.y - 20), frame1.width, frame8.height + 100, false, false, '#151515', '#151515', true, undefined, undefined), undefined, undefined, true, {unselectable: true, unmovable: true})
    var board6 = resetBoard(frame8, .3, undefined, true) 
    var startButton1 = rc.add(new TextBox(new Point(frame1.x + (frame1.width / 2) + 130, frame8.endy - 60), ('START MOVING'), false, 30, 220, 40, '#b40404', 'sans-serif', 'white', false, 'lighter', true, 16), undefined, undefined, true, {unselectable: false, unmovable: true})
    var resetButton2 = rc.add(new TextBox(new Point(frame1.x + (frame1.width / 2) + 360, frame8.endy - 60), (' NEW BOARD'), false, 30, 200, 40, 'gray', 'sans-serif', 'white', false, 'lighter', true, 16), undefined, undefined, true, {unselectable: false, unmovable: true})

    var frame9 = {x: frame6.x, y: frame8.endy + 30, cols: 10, rows: 10, width: 10 * 55, height: 10 * 55, squareLength: 55, margin: frame6.margin}
    frame9.endy = frame9.y + frame9.height + 50
    var text10 = rc.add(new TextBox(new Point(frame9.x + frame9.margin + 260,   frame9.y + 90), 'WRAPPING UP:', true, 48, 100, 80, 'black', 'sans-serif', 'black', true, 'bold', false), undefined, undefined, true, {unselectable: true, unmovable: true})
    var text11 = rc.add(new TextBox(new Point(frame9.x + frame9.margin, frame9.y + 170), 'Defining the behavior of a program using continuous and discrete constraints', true, 22, 800, 80, 'black', 'sans-serif', 'black', true, 'lighter', true), undefined, undefined, true, {unselectable: true, unmovable: true})
    text11.add('seems to help a alot in thinking about its design, understandability, and.')
    text11.add('extensiblity. It makes the process quite "linear."')

    // --- Constraints ---------------------------------------------------------

    rc.addConstraint(Sketchpad.simulation.TimerConstraint, undefined, rc.add(new Timer(.3), undefined, undefined, undefined, {invisible: true}))

    // --- Time / Event Handling ---------------------------------------------
    var distance = Sketchpad.geom.distance
    sketchpad.registerEvent('pointermove',
			    function(e) {
				var mouse = {x: e.clientX + window.scrollX, y: e.clientY + window.scrollY}
				if (mouse.y < frame1.height) {
				    swingingShapes.forEach(function(shape) {
					var pos = shape.position
					var dist = distance(mouse, pos)
					shape.image._swingSpeed = 2 + (dist < 200 ?  ((200-dist)/200*5) : 0)
				    })
				}
			    }, 'when mouse pointer nears shapes swing faster')
    
    sketchpad.registerEvent('pointerup',
			    function(e) {
				var thing = rc.selection
				if (thing instanceof Examples.polygons.Shape && thing.board)
				    scratch.dragPlacementConstraint = rc.addConstraint(Examples.polygons.ShapePlacementConstraint, undefined, thing)
				if (scratch.dragDangleConstraint !== undefined) {
				    rc.removeConstraint(scratch.dragDangleConstraint)
				    thing.image._swingSpeed = 0
				    scratch.dragDangleConstraint = undefined
				}
			    }, 'add shape placement constraint when shape is dropped')
    
    sketchpad.registerEvent('pointerdown',
			    function(e) {
				if (scratch.dragPlacementConstraint !== undefined) {
				    rc.removeConstraint(scratch.dragPlacementConstraint)
				    scratch.dragPlacementConstraint = undefined
				}
				var thing = rc.selection
				slider.valueToSliderPositionMode = thing != slider
				if (thing instanceof Examples.polygons.Shape) {
				    thing._origPos = thing.position.copy()
				    scratch.dragDangleConstraint = rc.addConstraint(Examples.polygons.ImageSwingConstraint, undefined, thing, false, true)
				} else if (thing === resetButton1) {
				    board5 = resetBoard(frame7, .5, board5)
				} else if (thing === resetButton2) {
				    board6 = resetBoard(frame8, .3, board6, true)
				} else if (thing === startButton1) {
				    // give each shape constraint to move when unhappy
				    board6.cells.forEach(function(s) {
					if (s !== 0)
					    rc.addConstraint(Examples.polygons.ShapeMoveWhenSadConstraint, undefined, s)
				    })
				} else if (thing === link) {
				    location.href = 'http://ncase.me/polygons/'
				}
			    }, '')
}

