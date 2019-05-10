
function setup() {
	let canvas = createCanvas(windowWidth, windowHeight);
	canvas.parent('draw-window');
}

function mouseDragged() {
	let stroke_color = 0;
	let stroke_weight = 6;
	strokeWeight(stroke_weight);
	stroke(stroke_color);
	line(mouseX, mouseY, pmouseX, pmouseY);
	let line_data = {
		"x1": mouseX,
		"y1": mouseY,
		"x2": pmouseX,
		"y2": pmouseY,
		"weight": stroke_weight,
		"color": stroke_color
	}
	socket.emit('draw_event', line_data);
}

