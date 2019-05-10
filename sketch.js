function setup() {
	  createCanvas(640, 360);
	  background(255); 
}


function draw() { 
	  strokeWeight(6);
	  stroke(0);
	 if (mouseIsPressed === true) {
		 line(mouseX, mouseY, pmouseX, pmouseY);
	 }
}

