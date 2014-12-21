<html>
  <head>
    <meta name="viewport" content="user-scalable=no"></meta>
    <title>DON'T PANIC - Sketchpad14</title>
    <link href="demo.css" rel="stylesheet"></link>
    <link rel="stylesheet" href="../../3rdparty/codemirror/codemirror.css">
  </head>
  <body>
    <script src="../../3rdparty/pointerevents.js"></script>
    <script src="../../3rdparty/canvasinput.js"></script>
    <script src="../../3rdparty/codemirror/codemirror.js"></script>
    <script src="../../3rdparty/three/three.min.js"></script>
    <script src="../../3rdparty/three/orbit-controls.js"></script>
    <script src="../../dist/sketchpad14.js"></script>
    <script src="../../2d/demo/user-classes.js"></script>
    <script src="user-classes.js"></script>
    <script src="sketchpad-scene.js"></script>
    <canvas id="canvas" touch-action="none" tabindex="0"></canvas>
    <div id="code-inspector-div" hidden><table><tr><td><textarea id="code-inspector" name="code-inspector"></textarea></td></tr></table></div><div id="code-inspector-bottom-div"></div>
    <lists id="lists">
      <shortcuts id="shortcuts"></shortcuts>
      <demos id="demos"></demos>
      <constraints id="constraints"></constraints>
      <classes id="classes"></classes>
      <tiles id="tiles"></tiles>
    </lists>
    <bins id="bins">
      <bin id='KeBin' key='KeCBin' kind='shortcut'>Shortcuts</bin>
      <!--<bin id='TiBin' key='TiBin' kind='tile'>Tile Bin</bin>-->
      <bin id='ClBin' key='ClBin' kind='class'>Class Bin</bin>
      <bin id='CoBin' key='CoBin' kind='constraint'>Constraint Bin</bin>
      <bin id='DeBin' key='DeBin' kind='demo'>Example Bin</bin>
    </bins>    
    <buttons id="buttons">
    </buttons>
    <actions id="actions">
      <action key='clear'>Clear</action>
      <action key='pause'>Pause</action>
    </actions>
    <iterationsPerFrame id="ipf"></iterationsPerFrame>
    <demoText id="dt"></demoText>
    <showEachIterationButton id="sii"></showEachIterationButton>
    <script>

var demos = document.getElementById('demos')
var constraints = document.getElementById('constraints')
var classes = document.getElementById('classes')
var tiles = document.getElementById('tiles')
var shortcuts = document.getElementById('shortcuts')
var lists = [demos, constraints, classes, tiles, shortcuts]

var User = {classes: {}, constraints: {}}
var Examples = {}
var examples = {}

var canvas = document.getElementById('canvas')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

var rc = new SketchpadScene(sketchpad, canvas)

var showFns = {
  demo: 
    function(name) { 
      rc.clear(); rc.pause(); examples[name](); rc.redraw(); rc.unpause();
    },
  constraint: 
    function(name) { 
      rc.newInstantiationTile(name, true)
    },
  class: 
    function(name) {
      rc.newInstantiationTile(name, false)
    },
  tile: 
    function(name) {
      rc.newPrimitiveTile(name)
    },
  shortcut: 
    function(name) {
    }
  }

var actions = document.getElementsByTagName('action')
for (var idx = 0; idx < actions.length; idx++) {
  var action = actions[idx]
  var actName = action.getAttribute('key')
  var actFn
  if (actName === 'clear') {
    actFn = function() { rc.clear(); rc.redraw(); }
  } else if (actName === 'pause') {
    actFn = function() { rc.togglePause() }
  } 
  action.onclick = actFn			
}
var bins = document.getElementsByTagName('bin')
for (var idx = 0; idx < bins.length; idx++) {
  var bin = bins[idx]
  bin.setAttribute('touch-action', 'none')
  var binName = bin.getAttribute('key')
  var binKind = bin.getAttribute('kind')
  var itemDOMNodes, itemNames
  if (binName === 'DeBin') {
     itemDOMNodes = demos
     itemNames = examples
  } else if (binName === 'CoBin') {
     itemDOMNodes = constraints
     itemNames = sketchpad.constraintConstructors
  } else if (binName === 'ClBin') {
     itemDOMNodes = classes
     itemNames = sketchpad.thingConstructors
  } /*else if (binName === 'TiBin') {
     itemDOMNodes = tiles
     itemNames = rc.tileConstructors
  }*/ else {
     itemDOMNodes = shortcuts
     itemNames = rc.keyShortcuts
  }
  (function(itemDOMNodesArg, itemNamesArg, binKindArg) {  
    bin.onclick = function() {
      lists.forEach(function(i) {
         while (i.firstChild) {
           i.removeChild(i.firstChild)
         }
      })  
      Object.keys(itemNamesArg).forEach(function(e) {
        var thing = document.createElement(binKindArg)
        thing.appendChild(document.createTextNode(e))
        thing.onclick = function() {
          showFns[binKindArg](e)
        }
        itemDOMNodesArg.appendChild(thing)
      })
    }})(itemDOMNodes, itemNames, binKind)
}
    </script>
    <script src="example-bridge.js"></script>
    <script src="example-pendulum.js"></script>
    <script src="example-chain.js"></script>
    <script>
var ipf = document.getElementById('ipf')
setInterval(function() { ipf.innerHTML = rc.iterationsPerFrame }, 100)
rc.updateSIILabel()
    </script>
    <?php if ($_GET['example']) echo "<script>showFns.demo('" . $_GET['example'] . "')</script>\n"; ?>
  </body>
</html>

