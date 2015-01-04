examples.slider = function() {
    rc.setOption('renderMode', 1)
    var sliderValueView = rc.add(new TextBox(new Point(650, 200), '0', false, 40, 80, 50))
    sliderValueView.text = '0'
    var slider = rc.add(new Box(new Point(500, 400), 40, 40, undefined, undefined, undefined, 'black'))
    var sliderFrame = rc.add(new Box(new Point(500, 400), 400, 40, undefined, undefined, 'black', 'gray'), undefined, undefined, {selectable: true, unmovable: true})
    slider.frame = sliderFrame    
    slider.value = function() { return Math.round(100 * ((this.position.x - this.frame.position.x) / (this.frame.width - this.width))) }
    rc.addConstraint(Sketchpad.arith.EqualityConstraint, {obj: sliderFrame.position, prop: 'y'}, {obj: slider.position, prop: 'y'}, [2])
    rc.addConstraint(Sketchpad.arith.InequalityConstraint, {obj: slider.position, prop: 'x'}, 0, {obj: sliderFrame.position, prop: 'x'}, true)
    rc.addConstraint(Sketchpad.arith.SumInequalityConstraint, {obj: slider.position, prop: 'x'}, slider.width, {obj: sliderFrame.position, prop: 'x'}, {obj: sliderFrame, prop: 'width'}, false)
    rc.addConstraint(Sketchpad.arith.OneWayEqualityConstraint, {obj: sliderValueView, prop: 'text'}, {obj: slider, prop: 'value'}, true)
};

