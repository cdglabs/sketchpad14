Examples.sudoku = {
    allPuzzles: [
	       	"987654321246173985351928746128537694634892157795461832519286473472319568863745219",
       	"839465712146782953752391486391824675564173829287659341628537194913248567475916238",
       	"123456789457189236869273154271548693346921578985637412512394867698712345734865921",
       	"562987413471235689398146275236819754714653928859472361187324596923568147645791832",
       	"126395784359847162874621953985416237631972845247538691763184529418259376592763418",
       	"174385962293467158586192734451923876928674315367851249719548623635219487842736591",
       	"751846239892371465643259871238197546974562318165438927319684752527913684486725193",
       	"125374896479618325683952714714269583532781649968435172891546237257893461346127958",
       	"123456789457189236896372514249518367538647921671293845364925178715834692982761453",
       	"123456789456789123789123456214975638375862914968314275591637842637248591842591367",
       	"239187465675394128814562937123879546456213879798456312367945281541728693982631754",
       	"743892156518647932962351748624589371879134265351276489496715823287963514135428697",
       	"468931527751624839392578461134756298289413675675289314846192753513867942927345186",
       	"728946315934251678516738249147593826369482157852167493293615784481379562675824931",
       	"317849265245736891869512473456398712732164958981257634174925386693481527528673149",
       	"621943758783615492594728361142879635357461289869532174238197546916354827475286913",
       	"693784512487512936125963874932651487568247391741398625319475268856129743274836159",
       	"673894512912735486845612973798261354526473891134589267469128735287356149351947628",
       	"174835962293476158586192734957324816428961375361758249812547693635219487749683521",
       	"869571324327849516145623987952368741681497235473215869514982673798136452236754198"
	]
}

var plus = Sketchpad.geom.plus
var minus = Sketchpad.geom.minus
var magnitude = Sketchpad.geom.magnitude
var scaledBy = Sketchpad.geom.scaledBy

// --- Classes -------------------------------------------------------------

Examples.sudoku.Shape = function Examples__sudoku__Shape(position, kind, optRotation, optBoard, optSize, optColor) {
    this.position = position
    this.kind = kind
    this.image = //new Image1(position, this.getUrl(this.kind), optRotation /*|| randomRotation()*/, optSize || 0.6)
    new TextBox(position, kind, false, (optSize || 1) * 40, optBoard ? optBoard.squareLength : 50, optBoard ? optBoard.squareLength : 50, undefined,  undefined , optColor, true)
    if (optBoard) {
	this.board = optBoard
	this.boardPos = optBoard.getCoord(position)
    }
}

sketchpad.addClass(Examples.sudoku.Shape)

Examples.sudoku.Shape.prototype.propertyTypes = {position: 'Point', kind: 'Number'}

Examples.sudoku.Shape.prototype.draw = function(canvas, origin) { this.image.draw(canvas, origin) }
Examples.sudoku.Shape.prototype.grabPoint = function() { return this.position }
Examples.sudoku.Shape.prototype.border = function() { return this.image.border() }
Examples.sudoku.Shape.prototype.center = function() { return this.image.center() }
Examples.sudoku.Shape.prototype.containsPoint = function(x, y) { return this.image.containsPoint(x, y) }

Examples.sudoku.Board = function Examples__sudoku__Board(position, width, height, regionSize, squareLength, cells, visible) {
    this.position = position
    this.width = width
    this.height = height
    this.regionSize = regionSize
    this.squareLength = squareLength
    this.cells = cells
    this.visible = visible
    this.squares = []
    var x = position.x, y = position.y
    for (var i = 0; i < height; i++) {
	for (var j = 0; j < width; j++) {
	    this.squares.push(rc.add(new Box(new Point(x + (j *  squareLength), y + (i *  squareLength)), squareLength, squareLength, undefined, undefined, undefined, 'white', undefined, undefined, 0.5), undefined, undefined, false, {unselectable: true, unmovable: true}))
	}
    }

}

sketchpad.addClass(Examples.sudoku.Board)

Examples.sudoku.Board.prototype.propertyTypes = {position: 'Point', width: 'Number', height: 'Number'}

Examples.sudoku.Board.prototype.solutionJoins = function() {
    return {cells: sketchpad.dictionaryAddJoinSolutions}
}

Examples.sudoku.Board.prototype.draw = function(canvas, origin) {
    if (this.visible) {
	var position = this.position, regionSize = this.regionSize, squareLength = this.squareLength, width = this.width, height = this.height
	var x = position.x, y = position.y
	var w = width * squareLength, h = height * squareLength
	for (var i = 0; i <= height; i+=regionSize) {
	    new Line(new Point(x, y, 'white'), new Point(x + w, y, 'white'), 'black').draw(canvas, origin)
	    y += squareLength * regionSize
	}
	y = position.y
	for (var i = 0; i <= width; i+=regionSize) {	
	    new Line(new Point(x, y, 'white'), new Point(x, y + h, 'white'), 'black').draw(canvas, origin)
	    x += squareLength * regionSize	
	}
    }    
}

Examples.sudoku.Board.prototype.border = function() {  return new Box(this.position, this.width * this.squareLength, this.height * this.squareLength) }
Examples.sudoku.Board.prototype.center = function() { return this.position }
Examples.sudoku.Board.prototype.containsPoint = function(x, y) {
    return this.border().containsPoint(x, y)
}

Examples.sudoku.Board.prototype.positionIsInside = function(pos) {
    var hl = this.squareLength / 2
    var res = this.containsPoint(pos.x + hl, pos.y + hl)
    return res
}


Examples.sudoku.Board.prototype.fits = function(shape, pos) {
    var there = this.getCell(pos.i, pos.j)
    return there == 0 || there === shape
}

Examples.sudoku.Board.prototype.getRegionIndex = function(i, j) {
    var regionSize = this.regionSize, rWidth = this.width / regionSize
    var ri = Math.floor(i / regionSize)
    var rj = Math.floor(j / regionSize)
    var r = (rWidth * rj) + ri
    return r
}

Examples.sudoku.Board.prototype.getConflicts = function() {
    var regionSize = this.regionSize, width = this.width, height = this.height, cells = this.cells, rWidth = width / regionSize
    var conflicts = {rows: {}, cols: {}, regions: {}}
    // row conflicts
    for (var i = 0; i < height; i++) {
	var es = {}
	for (var j = 0; j < width; j++) {
	    var e = this.getCell(i, j)
	    if (e !== 0) {
		e = e.kind
		var old = es[e]
		if (old === undefined) {
		    es[e] = true
		} else if (old !== e) {
		    conflicts.rows[i] = true
		    break
		}
	    }
	}
    }
    // column conflicts
    for (var j = 0; j < width; j++) {
	var es = {}
	for (var i = 0; i < height; i++) {
	    var e = this.getCell(i, j)
	    if (e !== 0) {
		e = e.kind
		var old = es[e]
		if (old === undefined) {
		    es[e] = true
		} else if (old !== e) {
		    conflicts.cols[j] = true
		    break
		}
	    }
	}
    }
    // region conflicts
    var es1 = {}
    for (var i = 0; i < height; i++) {
	for (var j = 0; j < width; j++) {
	    var r = this.getRegionIndex(i, j)
	    if (!es1[r])
		es1[r] = {}
	    var dict1 = es1[r]
	    var e = this.getCell(i, j)
	    if (e !== 0) {
		e = e.kind
		var old = dict1[e]
		if (old === undefined) {
		    dict1[e] = true
		} else if (old !== e) {
		    conflicts.regions[r] = true
		    //break
		}
	    }
	}
    }
    return conflicts
}

Examples.sudoku.Board.prototype.getCell = function(i, j) { return this.cells[i * this.width + j] }
Examples.sudoku.Board.prototype.setCell = function(i, j, p) { this.cells[i * this.width + j] = p }
Examples.sudoku.Board.prototype.getCoordFromIndex = function(k) { var i = Math.floor(k / this.width), j = k % this.width; return {i: i, j: j} }

Examples.sudoku.Board.prototype.getCoord = function(pos) {
    var res = undefined
    if (this.positionIsInside(pos)) {
	var unit = this.squareLength
	pos  = pos.plus({x: unit / 2, y: unit / 2})
	var offset = minus(pos, this.position)
	var offX = Math.floor(offset.x / unit)
	var offY = Math.floor(offset.y / unit)
	res = {i: offY, j: offX}
    }
    return res
}

Examples.sudoku.Board.prototype.getPos = function(coord) {
    var unit = this.squareLength
    return this.position.plus({x: (coord.j * unit) , y:  (coord.i * unit) })
}

Examples.sudoku.Board.prototype.getEmptyCoord = function(shape) {
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

/*
Examples.sudoku.Board.prototype.remove = function(shape) {
    for (var j = 0; j < this.width; j++) {
	for (var i = 0; i < this.height; i++) {
	    if (this.getCell(i, j) === shape) {
		this.setCell(i, j, 0)
		return
	    }
	}
    }
}
*/

// --- Constraint Defs -------------------------------------------------------

//  ShapePlacementConstraint

Examples.sudoku.ShapePlacementConstraint = function Examples__sudoku__ShapePlacementConstraint(shape) {
    this.shape = shape
    this.board = shape.board
    this.shapePos = shape.position
    this.shapeBoardPos = shape.boardPos
    this.boardCells = this.board.cells
}

sketchpad.addClass(Examples.sudoku.ShapePlacementConstraint, true)

Examples.sudoku.ShapePlacementConstraint.description = function() {
    return "Examples.sudoku.ShapePlacementConstraint(Shape P) states that if P is moved inside the board and it fits in the current square it should be placed nicely on the P's board B and B should add it in its list of placed shapes."
}

Examples.sudoku.ShapePlacementConstraint.prototype.description = function() {
    return "if shape " + this.shape.__toString + " is moved inside the board " + this.board.__toString + "and it fits in the current square it should be placed nicely on the shapes's board and board should add it in its list of placed shapes."
}

Examples.sudoku.ShapePlacementConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var shapePos = this.shapePos
    var board = this.board
    var boardPoint = board.position
    var diff = 0
    var unit = board.squareLength
    var posCoord = board.getCoord(shapePos)
    if (posCoord) {
	var offY = posCoord.i
	var offX = posCoord.j 
	if (board.fits(this.shape, {i: offY, j: offX})) {
	    this._offX = offX
	    this._offY = offY
	    this._placing = true
	    this._moving = true
	    this._target = plus(boardPoint, {x: offX * unit - 2, y: offY * unit + 5})
	} else {
	    this._placing = false
	    this._moving = false
	    this._target = this.shape._origPos
	}
    } else {
	this._placing = false
	this._moving = true
	this._target = this.shape._initPos
    }
    diff = magnitude(minus(this._target, shapePos))
    return diff
}

Examples.sudoku.ShapePlacementConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var board = this.board, shape = this.shape
    var dict = {}
    var sol = {shapePos: {x: this._target.x, y: this._target.y}}    
    if (this._placing || this._moving) {
	var dict = {}
	if (this._placing) {
	    dict[((this._offY * board.width) + this._offX)] = shape
	    sol.shapeBoardPos = {i: this._offY, j: this._offX}
	}
	if (this._moving) {
	    if (shape._origPos) {
		var posCoord = board.getCoord(shape._origPos)
		if (posCoord) {
		    var offY = posCoord.i
		    var offX = posCoord.j
		    if (!(this._placing && offX == this._offX && offY == this._offY))
			dict[((offY * board.width) + offX)] = 0
		}
	    }
	}
	sol.board = {cells: dict}
    }
    return sol
}

// SudokuConflictConstraint

Examples.sudoku.SudokuConflictConstraint = function Examples__sudoku__SudokuConflictConstraint(board, highlightColor) {
    this.board = board
    this.highlightColor = highlightColor
    this.squares = board.squares
    for (i in this.squares)
	this['square' + i] = this.squares[i]
}

sketchpad.addClass(Examples.sudoku.SudokuConflictConstraint, true)

Examples.sudoku.SudokuConflictConstraint.description = function() {
    return "Examples.sudoku.SudokuConflictConstraint(Board B) states that rows, columns, and regions with conflicts should be highlighted red."
}

Examples.sudoku.SudokuConflictConstraint.prototype.description = function() {
    return this.board.__toString + "'s rows, columns, and regions with conflicts should be highlighted red."
}

Examples.sudoku.SudokuConflictConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var board = this.board, regionSize = board.regionSize, width = board.width, height = board.height, cells = board.cells, rWidth = width / regionSize, highlightColor = this.highlightColor
    var conflicts = board.getConflicts()
    var change = false
    this._changes = {}
    for (var i = 0; i < height; i++) {
	for (var j = 0; j < width; j++) {
	    var idx = (i * width + j)
	    var r = board.getRegionIndex(i, j)
	    var target = (conflicts.rows[i] || conflicts.cols[j] || conflicts.regions[r]) ? highlightColor : 'white'
	    if (this['square' + idx].bgColor !== target) {
		change = true
		this._changes['square' + idx] = target
	    }
	}
    }
    return change
}

Examples.sudoku.SudokuConflictConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var board = this.board
    var sol = {}
    for (var s in this._changes)
	sol[s] = {bgColor: this._changes[s]}
    return sol
}

examples['sudoku'] = function() {
    //sketchpad.setOption('debug', true)
    //rc.preventBrowserDefaultKeyEvents()
    sketchpad.setOption('solveEvenWithoutErrorOnPriorityDifferences', true)
    rc.setOption('dragConstraintPriority', 0)


    function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
	}
	return array;
    }

    function loadConfiguration(puzzleStr, dimension, numBlanks) {
	var num = dimension * dimension
	numBlanks = numBlanks || 0
	var unuseds = {}
	for (var i = 1; i <= dimension; i++)
	    unuseds[i.toString()] = 0
	if (numBlanks > 0) {
	    var tokenArray = puzzleStr.split('');	   
	    while (numBlanks > 0) {
		var idx = Math.floor(Math.random() * num)
		var e = tokenArray[idx]
		if (e !== '.') {
		    unuseds[e]++
		    tokenArray[idx] = '.'
		    numBlanks--
		}
	    }
	    puzzleStr = tokenArray.join('')
	}
	var first = dimension.toString().charAt(0)
	var grid = []
	for (var i = 0; i < dimension; i++) {
	    for (var j = 0; j < dimension; j++) {
		var a = puzzleStr.charAt(i*dimension + j) >= '1' && puzzleStr.charAt(i*dimension + j) <= first
		    ? puzzleStr.charCodeAt(i*dimension + j) - 48 : 0;
		grid.push(a)
	    }
	}
	return {grid: grid, unuseds: unuseds}
    }

    function newBoard(frame, puzzle, shapeSize, currBoard) {
	var grid = puzzle.grid
	var unuseds = puzzle.unuseds
	if (currBoard) {
	    currBoard.cells.forEach(function (s) { if (s !== 0) { rc.remove(s) } })
	    currBoard.squares.forEach(function (s) { rc.remove(s) })
	    rc.remove(currBoard)
	}
	var boardShapes = []
	var board = rc.add(new Examples.sudoku.Board(new Point(frame.x, frame.y), frame.cols, frame.rows, frame.regionSize, frame.squareLength, grid, true), undefined, undefined, false, {unselectable: true, unmovable: true})
	for (var i = 0; i < frame.rows; i++) {
	    for (var j = 0; j < frame.cols; j++) {
		var cell = board.getCell(i, j)
		if (cell == 0) continue
		var x = frame.x + j * frame.squareLength - 2
		var y = frame.y + i * frame.squareLength + 5
		var shape = rc.add(new Examples.sudoku.Shape(new Point(x, y), cell, undefined, board, shapeSize, 'gray'), undefined, undefined, true, {unselectable: true, unmovable: true})
		board.setCell(i, j, shape)
		boardShapes.push(shape)
	    }
	}
	for (var i = 0; i < board.height; i++)  {
	    var pos = new Point(frame.x + (frame.squareLength * frame.cols) + 25 , frame.y + 5 + (i * frame.squareLength))
	    var dig = i + 1
	    for (var j = 0; j < unuseds[dig]; j++)  {
    		var shape = rc.add(new Examples.sudoku.Shape(pos.copy(), dig,  undefined, board, 1, 'blue'))
		shape._origPos = shape.position.copy()
		shape._initPos = shape.position.copy()
	    }
	}
	rc.addConstraint(Examples.sudoku.SudokuConflictConstraint, undefined, board, '#ffb2b2')
	return board
    }

    function resetBoard(numBlanks, frame, currBoard) {
	return newBoard(frame, newPuzzle(numBlanks), 1, currBoard)
    }

    function newPuzzle(numBlanks) {
	var puzzles = Examples.sudoku.allPuzzles
	var num = puzzles.length
	var puzzleStr = puzzles[Math.floor(Math.random() * num)]
	var mapping = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
	//shuffleArray(mapping)	
	var newPuzzle = "";
	var dimension = frame.cols
	for (var i = 0; i < dimension * dimension; i++)
	    if (puzzleStr.charAt(i) == '.')
		newPuzzle += '.';
	else
	    newPuzzle += mapping[puzzleStr.charCodeAt(i) - 49];
	return loadConfiguration(newPuzzle, 9, numBlanks);
    }
    
    // --- Data ----------------------------------------------------------------    
    scratch = sketchpad.scratch

    var numBlanks = 60
    
    var frame = {x: 500, y: 120, width: 1150, height: 500, cols: 9, rows: 9, regionSize: 3, squareLength: 50}
    frame.midx = frame.x + (frame.width / 2)
    frame.endx = frame.x + frame.width
    frame.endx = frame.x + (frame.width)
    frame.endy = frame.y + (frame.height)

    var puzzle = newPuzzle(numBlanks)
    var board = newBoard(frame, puzzle, 1)
    var resetButton = rc.add(new TextBox(new Point(frame.x - 300, frame.y), ('   NEW BOARD'), false, 30, 220, 50, 'white', 'sans-serif', 'black', false, 'lighter', true, 16), undefined, undefined, true)

    // --- Time / Event Handling ---------------------------------------------
    var distance = Sketchpad.geom.distance
   
    sketchpad.registerEvent('pointerup',
			    function(e) {
				var thing = rc.selection
				if (thing instanceof Examples.sudoku.Shape && thing.board) {
				    var pos = thing.position
				    thing.boardPos = thing.board.getCoord(pos)
				    scratch.dragPlacementConstraint = rc.addConstraint(Examples.sudoku.ShapePlacementConstraint, undefined, thing)
				}
			    }, 'add shape placement constraint when shape is dropped')
    
    sketchpad.registerEvent('pointerdown',
			    function(e) {
				if (scratch.dragPlacementConstraint !== undefined) {
				    rc.removeConstraint(scratch.dragPlacementConstraint)
				    scratch.dragPlacementConstraint = undefined
				}
				var thing = rc.selection
				if (thing instanceof Examples.sudoku.Shape) {
				    var pos = thing.position.copy()
				    thing._origPos = pos.copy()					
				} else if (thing === resetButton) {
				    board = resetBoard(numBlanks, frame, board)
				} 
			    }, '')

}
