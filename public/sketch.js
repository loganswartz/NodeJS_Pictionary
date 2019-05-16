let canvas;
let stroke_color;
let stroke_weight;
let colorInput = document.querySelector('#color');
let weight = document.querySelector('#weight');


function setup() {
	canvas = createCanvas(windowWidth, windowHeight);
	socket.on('draw_data', drawReceivedData);
	canvas.parent('draw-window');
}

function drawReceivedData(data) {
	strokeWeight(data.weight);
	stroke(data.color);
	line(data.x1, data.y1, data.x2, data.y2)
}

