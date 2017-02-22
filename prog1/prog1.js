	// declare global variables
	var canvas;
	var gl;
	var positions = [[-0.5, -0.25, 0.0],
			[-0.25, 0.25, 0.0],
			[0.0, -0.25, 0.0],
			[0.0, 0.75, 0.0],
			[0.25, 0.25, 0.0],
			[0.5, -0.25, 0.0]];

	var triangles = [[0, 1, 2],
			[1, 3, 4],
			[2, 4, 5]];
	
	//define flatten function for array management
	function flatten(a){
		return a.reduce(function(b,v) { b.push.apply(b,v); return b}, [])
		} 
		
	function init(){
		
		//initialize GL context
		canvas = document.getElementById('webgl');
		gl = getWebGLContext(canvas,false);
		
		//configure renderer, vertex & fragment shaders
		var vertexSource = document.getElementById('vertexShader').text;
		var fragmentSource = document.getElementById('fragmentShader').text;
		program = createProgram(gl, vertexSource, fragmentSource);
		
		//make the program current
		gl.useProgram(program);
		
		//create Buffers to store Array data
		positionBuffer = gl.createBuffer();
		triangleBuffer = gl.createBuffer();
		
		//flatten the position array to be one line of information
		positionArray = new Float32Array(flatten(positions));
		
		//bind the buffer, copy the data from positionArray
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
		
		//flatten the triangle array
		triangleArray = new Uint16Array(flatten(triangles));
		
		//bind the triangle buffer, copy the data from triangleArray
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);

		//bind the data to the vertex shader's vertexPosition attribute, enable for rendering
		var vertexPositionLocation = gl.getAttribLocation(program, 'vertexPosition');	
		gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexPositionLocation);
		
		//request animation frame with draw function as callback
		requestAnimationFrame(draw);

		}

	function draw(){
		
		//clear the color buffer, set the background to green/opaque
		gl.clearColor(0.0, 0.8, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		//draws the elements
		gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);

		}
