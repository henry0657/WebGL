//Henry Toups
//9-19-2016
//CSC 4356
//Project 2
//This javascript file creates a rotatable cube based on the cube.js file
//
	// declare global variables
	var canvas;
	var gl;
	
	var modelRotationX = 0;
	var modelRotationY = 0;
	var dragging = false;
	var lastClientX = 0;
	var lastClientY = 0;
	var dX = 0, dY = 0;
	var event = new MouseEvent("click");
	

	//define function tracking mouse movement when mouse is clicked
	function onMouseDown(event){
		dragging = true;
		lastClientX = event.clientX;
		lastClientY = event.clientY;
		}
	//define function to stop tracking when released
	function onMouseUp(event){
		dragging = false;
		}	
	//define function for mouse movement
	function onMouseMove(event){
		if (dragging){
			dX = event.clientX - lastClientX;
			dY = event.clientY - lastClientY;

			modelRotationX += dY;
			modelRotationY += dX;

			if (modelRotationX > 90.0)
				modelRotationX = 90.0;
			if (modelRotationX < -90.0)
			        modelRotationX = -90.0;	
			
			requestAnimationFrame(draw);
		}

		lastClientX = event.clientX;
		lastClientY = event.clientY;
	}
		

	//define flatten function for array management
	function flatten(a){
		return a.reduce(function(b,v) { b.push.apply(b,v); return b}, [])
		} 
		

	function init(){

		// define instances of matrices to use later
		modelMatrix = new Matrix4();
		viewMatrix = new Matrix4();
		projectionMatrix = new Matrix4();
		xRotMatrix = new Matrix4();
		yRotMatrix = new Matrix4();
		scaleMatrix = new Matrix4();

		//initialize GL context
		canvas = document.getElementById('webgl');
		gl = getWebGLContext(canvas,false);

		aspect = canvas.width / canvas.height;
		
		//initialize program object
		//configure renderer, vertex & fragment shaders
		var vertexSource = document.getElementById('vertexShader').text;
		var fragmentSource = document.getElementById('fragmentShader').text;
		program = createProgram(gl, vertexSource, fragmentSource);

		//make the program current
		gl.useProgram(program);

		
		//initialize uniform objects
		 projectionMatrixLocation = gl.getUniformLocation(program,'projectionMatrix');
		 viewMatrixLocation = gl.getUniformLocation(program,'viewMatrix');
		 modelMatrixLocation = gl.getUniformLocation(program,'modelMatrix');


		//create Buffers to store Array data
		positionBuffer = gl.createBuffer();
		triangleBuffer = gl.createBuffer();
		colorBuffer = gl.createBuffer();
		
		//flatten the arrays
		positionArray = new Float32Array(flatten(cube.positions));
		colorArray = new Float32Array(flatten(cube.colors));
		triangleArray = new Uint16Array(flatten(cube.triangles));


		//set up the color data 
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
   		gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
		vertexColorLocation = gl.getAttribLocation(program, 'vertexColor');
    		gl.vertexAttribPointer(vertexColorLocation, 3, gl.FLOAT, false, 0, 0);
    		gl.enableVertexAttribArray(vertexColorLocation);
		
		
		//set up the position data
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
		vertexPositionLocation = gl.getAttribLocation(program, 'vertexPosition');	
		gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexPositionLocation);


		//bind the triangle buffer, copy the data from triangleArray
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);
		 

		//define mouse click functions
		canvas.onmousedown = onMouseDown;
		canvas.onmouseup = onMouseUp;
		canvas.onmousemove = onMouseMove;
	
		//request animation frame with draw function as callback
		requestAnimationFrame(draw);

		}

	function draw(){
		//commented out clear to purple background
		//gl.clearColor(.55,.33,.65,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
				
		// Set the camera location and orientation
		viewMatrix.setLookAt(0,0,5,0,0,-1,0,1,0);
	
		// Set the projection matrix with perspective information
		projectionMatrix.setPerspective(10, aspect, 1, 10);
		
		// Set the X and Y rotation matrices
		xRotMatrix.setRotate(modelRotationX,1,0,0);
		yRotMatrix.setRotate(modelRotationY,0,1,0);

		// Scale Matrices
		scaleMatrix.setScale(.2,.2,.2);

		//Make the model
		modelMatrix.set( xRotMatrix.multiply( yRotMatrix.multiply( scaleMatrix )));
	
		//deliver to vertex shader
		gl.uniformMatrix4fv(projectionMatrixLocation,false,projectionMatrix.elements);
		gl.uniformMatrix4fv(viewMatrixLocation,false,viewMatrix.elements);
		gl.uniformMatrix4fv(modelMatrixLocation,false,modelMatrix.elements);

    
		//draws the elements
		gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);

		}
