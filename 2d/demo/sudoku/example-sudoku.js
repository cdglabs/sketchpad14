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
    this.image = new TextBox(position, kind, false, (optSize || 1) * 40, optBoard ? optBoard.squareLength : 50, optBoard ? optBoard.squareLength : 50, undefined,  undefined , optColor, true)
    this.boardPos = {i: -1, j: -1}
    if (optBoard) {
	this.board = optBoard
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
    this.pieces = []
    this.squares = []
    var x = position.x, y = position.y
    for (var i = 0; i < height; i++) {
	for (var j = 0; j < width; j++) {
	    this.squares.push(rc.add(new Box(new Point(x + (j *  squareLength), y + (i *  squareLength)), squareLength, squareLength, undefined, undefined, undefined, 'white', undefined, undefined, 0.5), undefined, undefined, true, {unselectable: true, unmovable: true}))
	}
    }

}

sketchpad.addClass(Examples.sudoku.Board)

Examples.sudoku.Board.prototype.propertyTypes = {position: 'Point', width: 'Number', height: 'Number'}

Examples.sudoku.Board.prototype.solutionJoins = function() {
    return {cells: sketchpad.dictionaryAddJoinSolutions, hint: sketchpad.lastOneWinsJoinSolutions}
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
    return there === 0 || there === shape
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
    var conflicts = {has: false, rows: {}, cols: {}, regions: {}}
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
		    conflicts.has = true
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
		    conflicts.has = true
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
		    conflicts.has = true
		}
	    }
	}
    }
    return conflicts
}

Examples.sudoku.Board.prototype.getCell = function(i, j) { return this.cells[i * this.width + j] }
Examples.sudoku.Board.prototype.setCell = function(i, j, p) { this.cells[i * this.width + j] = p }
Examples.sudoku.Board.prototype.getCoordFromIndex = function(k) { var i = Math.floor(k / this.width), j = k % this.width; return {i: i, j: j} }
Examples.sudoku.Board.prototype.getPosFromIndex = function(k) { return this.getPos(this.getCoordFromIndex(k)) }

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
    return this.position.plus({x: (coord.j * unit) - 2 , y:  (coord.i * unit) + 5})
}

Examples.sudoku.Board.prototype.getUnusedPieces = function(optSpecificKind, oneOnly) {
    var pieces = this.pieces, unuseds = []
    for (var i = 0; i < pieces.length; i++) {
	var p = pieces[i]
	if (p.boardPos.i == -1 && (!optSpecificKind || p.kind == optSpecificKind)) {
	    unuseds.push(p)
	    if (oneOnly)
		break
	}	
    }
    return unuseds
}

Examples.sudoku.Board.prototype.getEmptyCells = function() {
    var cells = this.cells
    var empties = []
    for (var i = 0; i < cells.length; i++) {
	if (cells[i] === 0)
	    empties.push(i)
    }
    return empties
}

Examples.sudoku.Board.prototype.giveHint = function() {
    var pieces = this.pieces, cells = this.cells
    var empties = this.getEmptyCells()
    var pickIdx = empties[Math.floor(Math.random() * empties.length)]
    var solDigit = this.solution[pickIdx]
    var pickCoord = this.getCoordFromIndex(pickIdx)
    var pickPos = this.getPos(pickCoord)
    var unuseds = this.getUnusedPieces(solDigit, true)
    if (unuseds.length > 0) {
	var p = unuseds[0]
	p.position.set(pickPos)
	p.boardPos = pickCoord
	scratch.dragPlacementConstraint = rc.addConstraint(Examples.sudoku.ShapeSnapsToBoard, undefined, p)
    }
    this.hint = pickIdx
}

// --- Constraint Defs -------------------------------------------------------

//  ShapeSnapsToBoard

Examples.sudoku.ShapeSnapsToBoard = function Examples__sudoku__ShapeSnapsToBoard(shape) {
    this.shape = shape
    this.board = shape.board
    this.shapePos = shape.position
    this.shapeBoardPos = shape.boardPos
    this.boardCells = this.board.cells
}

sketchpad.addClass(Examples.sudoku.ShapeSnapsToBoard, true)

Examples.sudoku.ShapeSnapsToBoard.description = function() {
    return "Examples.sudoku.ShapeSnapsToBoard(Shape P) states that if P is moved inside the board and it fits in the current square it should be placed nicely on the P's board B and B should add it in its list of placed shapes."
}

Examples.sudoku.ShapeSnapsToBoard.prototype.description = function() {
    return "if shape " + this.shape.__toString + " is moved inside the board " + this.board.__toString + "and it fits in the current square it should be placed nicely on the shapes's board and board should add it in its list of placed shapes."
}

Examples.sudoku.ShapeSnapsToBoard.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var shapePos = this.shapePos, shape = this.shape
    var board = this.board
    var boardPoint = board.position
    var diff1 = 0, diff2 = 0, diff3 = 0
    var unit = board.squareLength
    var posCoord = board.getCoord(shapePos)
    if (posCoord) {
	var offY = posCoord.i
	var offX = posCoord.j 
	if (board.fits(shape, {i: offY, j: offX})) {
	    this._offX = offX
	    this._offY = offY
	    this._placing = true
	    this._moving = true
	    this._target = plus(boardPoint, {x: offX * unit - 2, y: offY * unit + 5})
	    var idx = (this._offY * board.width) + this._offX
	    diff2 = board.cells[idx] === shape ? 0 : 1
	    diff3 = shape.boardPos.i == this._offY &&  shape.boardPos.j == this._offX ? 0 : 1
	} else {
	    this._placing = false
	    this._moving = false
	    this._target = shape._origPos
	}
	this._outing = false
    } else {
	this._placing = false
	this._moving = true
	this._outing = true
	this._target = shape._initPos
    }
    diff1 = magnitude(minus(this._target, shapePos)) 
    return diff1 + diff2 + diff3
}

Examples.sudoku.ShapeSnapsToBoard.prototype.solve = function(pseudoTime, prevPseudoTime) {
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
	    if (this._outing) {
		sol.shapeBoardPos = {i: -1, j: -1}
	    }
	}
	sol.board = {cells: dict}
    }
    return sol
}

//  ShapePositionBasedOnBoardPlacement

Examples.sudoku.ShapePositionBasedOnBoardPlacement = function Examples__sudoku__ShapePositionBasedOnBoardPlacement(shape) {
    this.shape = shape
    this.board = shape.board
    this.shapePos = shape.position
    this.shapeBoardPos = shape.boardPos
    this.boardCells = this.board.cells
}

sketchpad.addClass(Examples.sudoku.ShapePositionBasedOnBoardPlacement, true)

Examples.sudoku.ShapePositionBasedOnBoardPlacement.description = function() {
    return "Examples.sudoku.ShapePositionBasedOnBoardPlacement(Shape P) states that when puzzle is solved and board placements are determined, P should position itself in the right place on the board."
}

Examples.sudoku.ShapePositionBasedOnBoardPlacement.prototype.description = function() {
    return " when puzzle is solved and board placements are determined, " + this.shape.__toString + "  should position itself in the right place on the board."
}

Examples.sudoku.ShapePositionBasedOnBoardPlacement.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var shapePos = this.shapePos, shape = this.shape
    var board = this.board
    var boardPoint = board.position
    var diff = 0
    var unit = board.squareLength
    var posCoord = shape.boardPos
    if (posCoord.i != -1) {
	var offY = posCoord.i
	var offX = posCoord.j 
	this._target = plus(boardPoint, {x: offX * unit - 2, y: offY * unit + 5})
	diff = magnitude(minus(this._target, shapePos)) 
    }
    return diff
}

Examples.sudoku.ShapePositionBasedOnBoardPlacement.prototype.solve = function(pseudoTime, prevPseudoTime) {
    return {shapePos: {x: this._target.x, y: this._target.y}}    
}

// HightlightConflictOrHint

Examples.sudoku.HightlightConflictOrHint = function Examples__sudoku__HightlightConflictOrHint(board, conflictColor, hintColor) {
    this.board = board
    this.conflictColor = conflictColor
    this.hintColor = hintColor
    this.squares = board.squares
    for (i in this.squares)
	this['square' + i] = this.squares[i]
}

sketchpad.addClass(Examples.sudoku.HightlightConflictOrHint, true)

Examples.sudoku.HightlightConflictOrHint.description = function() {
    return "Examples.sudoku.HightlightConflictOrHint(Board B) states that rows, columns, and regions with conflicts should be highlighted red and a hint green."
}

Examples.sudoku.HightlightConflictOrHint.prototype.description = function() {
    return this.board.__toString + "'s rows, columns, and regions with conflicts should be highlighted red and a hint green."
}

Examples.sudoku.HightlightConflictOrHint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var board = this.board, regionSize = board.regionSize, width = board.width, height = board.height, rWidth = width / regionSize, conflictColor = this.conflictColor, hintColor = this.hintColor
    var conflicts = board.getConflicts()
    var change = false
    this._changes = {}
    for (var i = 0; i < height; i++) {
	for (var j = 0; j < width; j++) {
	    var idx = (i * width + j)
	    var r = board.getRegionIndex(i, j)
	    var target = board.hint == idx ? hintColor : (conflicts.rows[i] || conflicts.cols[j] || conflicts.regions[r]) ? conflictColor : 'white'
	    if (this['square' + idx].bgColor !== target) {
		change = true
		this._changes['square' + idx] = target
	    }
	}
    }
    return change
}

Examples.sudoku.HightlightConflictOrHint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var board = this.board
    var sol = {}
    for (var s in this._changes)
	sol[s] = {bgColor: this._changes[s]}
    return sol
}

//SudokuSolved

Examples.sudoku.SudokuSolved = function Examples__sudoku__SudokuSolved(board) {
    this.board = board
    for (i in board.pieces) {
	var p = board.pieces[i]
	//this['piece' + p.__id] = p
	this['piece' + p.__id + 'boardPos'] = p.boardPos
    }

}

sketchpad.addClass(Examples.sudoku.SudokuSolved, true)

Examples.sudoku.SudokuSolved.description = function() {
    return "Examples.sudoku.SudokuSolved(Board B) states that puzzle B should be solved."
}

Examples.sudoku.SudokuSolved.prototype.description = function() {
    return this.board.__toString + "'s should be solved."
}

Examples.sudoku.SudokuSolved.prototype.__searchable = true

Examples.sudoku.SudokuSolved.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var board = this.board, regionSize = board.regionSize, width = board.width, height = board.height, cells = board.cells
    var solved = true
    for (var i = 0; i < cells.length; i++) {
	var e = cells[i]
	if (e === 0) {
	    solved = false
	    break
	}
    }
    if (solved) {
	var conflicts = board.getConflicts()
	solved = !conflicts.has
    }
    return solved ? 0 : 1
}

Examples.sudoku.SudokuSolved.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var board = this.board
    var emptyIdxsOne = board.getEmptyCells()
    var emptyIdxsChoices = permuteArray(emptyIdxsOne)
    var unuseds = board.getUnusedPieces()
    //log(emptyIdxs, unuseds)
    var sols = []
    for (var j = 0; j < emptyIdxsChoices.length; j++) {
	var all = [], sol = {}, dict = {}
	var emptyIdxs = emptyIdxsChoices[j]
	for (var i = 0; i < unuseds.length; i++) {
	    var idx = emptyIdxs[i]
	    var p = unuseds[i]
	    dict[idx] = p
	    var pos = board.getPosFromIndex(idx)
	    var coord = board.getCoordFromIndex(idx)
	    //sol['piece' + p.__id] = {position: {x: pos.x, y: pos.y}}
	    sol['piece' + p.__id + 'boardPos'] = coord
	    p.position.set(pos)
	}
	sol.board = {cells: dict}
	sols.push(sol)
    }
    //log(sols)
    //this._foo = true
    return sols
}


function permuteArray(input) {
    return permuteArrayH(input, [], [])
}

function permuteArrayH(input, permArr, usedChars) {
    var i, ch;
    for (i = 0; i < input.length; i++) {
	ch = input.splice(i, 1)[0];
	usedChars.push(ch);
	if (input.length == 0) {
	    permArr.push(usedChars.slice());
	}
	permuteArrayH(input, permArr, usedChars);
	input.splice(i, 0, ch);
	usedChars.pop();
    }
    return permArr
}


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
    var tokenArray = puzzleStr.split('')
    var solution = tokenArray.map(function(i) { return Number.parseInt(i) })
    var unuseds = {}
    for (var i = 1; i <= dimension; i++)
	unuseds[i.toString()] = 0
    if (numBlanks > 0) {
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
    return {grid: grid, unuseds: unuseds, solution: solution}
}

function newBoard(options, frame, puzzle, shapeSize, currBoard) {
    var grid = puzzle.grid, unuseds = puzzle.unuseds, solution = puzzle.solution
    if (currBoard) {
	currBoard.slider._constraints.forEach(function(c) { rc.removeConstraint(c) })
	rc.remove(currBoard.slider) 
	currBoard.pieces.forEach(function (s) { rc.remove(s)  })
	currBoard.squares.forEach(function (s) { rc.remove(s) })
	rc.remove(currBoard)
    }
    var boardShapes = []
    var board = rc.add(new Examples.sudoku.Board(new Point(frame.x, frame.y), frame.cols, frame.rows, frame.regionSize, frame.squareLength, grid, true), undefined, undefined, true, {unselectable: true, unmovable: true})
    board.solution = solution
    for (var i = 0; i < frame.rows; i++) {
	for (var j = 0; j < frame.cols; j++) {
	    var cell = board.getCell(i, j)
	    if (cell === 0) continue
	    var x = frame.x + j * frame.squareLength - 2
	    var y = frame.y + i * frame.squareLength + 5
	    var shape = rc.add(new Examples.sudoku.Shape(new Point(x, y), cell, undefined, board, shapeSize, 'gray'), undefined, undefined, true, {unselectable: true, unmovable: true})
	    shape.boardPos = {i: i, j: j}
	    board.pieces.push(shape)
	    board.setCell(i, j, shape)
	    boardShapes.push(shape)
	}
    }
    for (var i = 0; i < board.height; i++)  {
	var pos = new Point(frame.x + (frame.squareLength * frame.cols) + 25 , frame.y + 5 + (i * frame.squareLength))
	var dig = i + 1
	for (var j = 0; j < unuseds[dig]; j++)  {
    	    var shape = rc.add(new Examples.sudoku.Shape(pos.copy(), dig,  undefined, board, 1, 'blue'), undefined, undefined, true)
	    board.pieces.push(shape)
	    shape._origPos = shape.position.copy()
	    shape._initPos = shape.position.copy()
	}
    }

    board.slider = rc.add(new Examples.slider.Slider({obj: options, prop: 'numBlanks'}, true, new Point(frame.x - 340, frame.y + 350), 300, 30, {start: 0 , end: 81}, false), undefined, undefined, true)
   board.slider.init()

    rc.addConstraint(Examples.sudoku.HightlightConflictOrHint, undefined, board, '#ffb2b2', '#81f781')
    return board
}

var tmpConstraints = []

function resetBoard(options, frame, currBoard) {
    tmpConstraints.forEach(function(n) {
	rc.removeConstraint(n)
    })
    tmpConstraints = []
    return newBoard(options, frame, newPuzzle(options, frame), 1, currBoard)
}

function newPuzzle(options, frame) {
    var puzzles = Examples.sudoku.allPuzzles
    var num = puzzles.length
    var puzzleStr = puzzles[Math.floor(Math.random() * num)]
    var mapping = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
    var newPuzzle = "";
    var dimension = frame.cols
    for (var i = 0; i < dimension * dimension; i++)
	if (puzzleStr.charAt(i) == '.')
	    newPuzzle += '.';
    else
	newPuzzle += mapping[puzzleStr.charCodeAt(i) - 49];
    return loadConfiguration(newPuzzle, 9, options.numBlanks);
}

examples['sudoku'] = function() {
    //sketchpad.setOption('debug', true)
    //rc.setOption('renderMode', 1)

    // --- Data ----------------------------------------------------------------    
    scratch = sketchpad.scratch
    scratch.millisecondsPerFrame = rc.millisecondsPerFrame

    var options = {numBlanks: 6}
    scratch.options = options
    
    var frame = {x: 500, y: 120, width: 1150, height: 500, cols: 9, rows: 9, regionSize: 3, squareLength: 50}
    frame.midx = frame.x + (frame.width / 2)
    frame.endx = frame.x + frame.width
    frame.endx = frame.x + (frame.width)
    frame.endy = frame.y + (frame.height)

    var bg = rc.add(new Image1(new Point(frame.x, frame.y), './sudoku/img/1.png', undefined, 1.06), undefined, undefined, false, {unselectable: true, unmovable: true})

    var puzzle = newPuzzle(options, frame)
    var board = newBoard(options, frame, puzzle, 1)
    var resetButton = rc.add(new TextBox(new Point(frame.x - 300, frame.y), ('   NEW BOARD'), false, 30, 220, 50, 'white', 'sans-serif', 'black', false, 'lighter', true, 16), undefined, undefined, true)
    var hintButton = rc.add(new TextBox(new Point(frame.x - 300, frame.y + 60), ('   HINT'), false, 30, 220, 50, 'white', 'sans-serif', 'black', false, 'lighter', true, 16), undefined, undefined, true)
    var solveButton = rc.add(new TextBox(new Point(frame.x - 300, frame.y + 120), ('   SOLVE'), false, 30, 220, 50, 'white', 'sans-serif', 'black', false, 'lighter', true, 16), undefined, undefined, true, {unselectable: false, unmovable: true})

    var text9a = rc.add(new TextBox(new Point(frame.x - 250, frame.y + 300), 'restart board with       empty places', false, 16, 100, 30, 'white', 'sans-serif', 'black', false, 'lighter', false), undefined, undefined, true)
    var text9b = rc.add(new TextBox(new Point(frame.x - 190, frame.y + 300), board.kindPercentage, false, 16, 20, 30, 'white', 'sans-serif', '#ff0000', false, 'lighter', false), undefined, undefined, true)
    rc.addConstraint(Sketchpad.arith.EqualProperties, undefined,  {obj: options, prop: 'numBlanks'}, {obj: text9b, prop: 'text'}, [2], 1, 1)

    // --- Time / Event Handling ---------------------------------------------
    var distance = Sketchpad.geom.distance
    
    sketchpad.registerEvent('pointerup',
			    function(e) {
				var thing = rc.selection
				if (thing instanceof Examples.sudoku.Shape && thing.board) {
				    var pos = thing.position
				    //thing.boardPos = thing.board.getCoord(pos)
				    scratch.dragPlacementConstraint = rc.addConstraint(Examples.sudoku.ShapeSnapsToBoard, undefined, thing)
				}
			    }, 'add shape placement constraint when shape is dropped')

    var discreteConstraints = ['dragPlacementConstraint', 'solveConstraint']
    
    sketchpad.registerEvent('pointerdown',
			    function(e) {
				discreteConstraints.forEach(function(n) {
				    if (scratch[n] !== undefined) {
					rc.removeConstraint(scratch[n])
					scratch[n] = undefined
				    }})
				var thing = rc.selection
				if (thing instanceof Examples.sudoku.Shape) {
				    var pos = thing.position.copy()
				    thing._origPos = pos.copy()					
				} else if (thing === resetButton) {
				    rc.setOption('millisecondsPerFrame', scratch.millisecondsPerFrame)
				    sketchpad.searchOn = false
				    board = resetBoard(options, frame, board)
				} else if (thing === hintButton) {
				    board.giveHint()
				} else if (thing === solveButton && !scratch.solveConstraint) {
				    if (options.numBlanks > 8 && !confirm('This will do brute-force search and take too long and make your brower unresponsive. You sure?')) {
					return
				    }	    
				    rc.setOption('millisecondsPerFrame', 10000)
				    sketchpad.searchOn = true
				    board.getUnusedPieces().forEach(function(p) {
					tmpConstraints.push(rc.addConstraint(Examples.sudoku.ShapePositionBasedOnBoardPlacement, undefined, p))
				    })
				    scratch.solveConstraint = rc.addConstraint(Examples.sudoku.SudokuSolved, undefined, board)
				} 
			    }, '')

}
