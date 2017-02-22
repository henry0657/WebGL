//Henry Toups
//10-18-2016
//CSC 4356-36
//Project 4
//this program creates Model and Shader objects, to display in one scene
//the draw method is a member method of the Model object, and is called in 
//the external draw function
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
	
	var teapotModel,cowModel, planeModel;
	var teapotShader, cowShader, planeShader;
	
	var event = new MouseEvent("click");
	

	//define function for dot product of 3 dimensional array
	function dot(a, b) {
		return [a[0]*b[0] + a[1]*b[1] + a[2]*b[2]];
	}

	//define function for cross product of 3 dimensional array
	function cross(a, b) {
		return [a[1]*b[2] - a[2]*b[1] , a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
	}
	
	//define function for the addition of 3 dimensional array
	function add(a, b) {	
		return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
	}
	
	//define function for the subtraction of 3 dimensional array
	function sub(a, b) {
		return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
	}

	//define function for normalizing a vector
	function normalize(a) {
		var len = Math.sqrt(dot(a,a));
		return [ a[0]/len, a[1]/len, a[2]/len ];
	}

	
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
		
	//define an object Shader
	function Shader(vertexName, fragmentName){
		
		//initialize program object
		//configure renderer, vertex & fragment shaders
		this.vertexSource = document.getElementById(vertexName).text;
		this.fragmentSource = document.getElementById(fragmentName).text;
		this.program = createProgram(gl, this.vertexSource, this.fragmentSource);

		//make the program current
		gl.useProgram(this.program)

	

		//initialize vertex shader uniform objects
		this.projectionMatrixLocation = gl.getUniformLocation(this.program,'projectionMatrix');
		this.viewMatrixLocation = gl.getUniformLocation(this.program,'viewMatrix');
		this.modelMatrixLocation = gl.getUniformLocation(this.program,'modelMatrix');
		this.lightPositionLocation = gl.getUniformLocation(this.program,'lightPosition');

		//initialize fragment shader uniform objects
		this.modelColorLocation = gl.getUniformLocation(this.program,'modelColor');
		this.lightColorLocation = gl.getUniformLocation(this.program,'lightColor');
		this.alphaLocation = gl.getUniformLocation(this.program,'alpha');

		//set up vertex attributes vertex
		this.vertexPositionLocation = gl.getAttribLocation(this.program, 'vertexPosition');	
		gl.vertexAttribPointer(this.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.vertexPositionLocation);

		//set up normal data attribute
		this.vertexNormalLocation = gl.getAttribLocation(this.program, 'vertexNormal');
		if(this.vertexNormalLocation > -1){
		gl.vertexAttribPointer(this.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.vertexNormalLocation);
		}


		}

			

	//define an object Model
	function Model(obj, translation){
		
		// define instances of matrices to use later
		
		this.xRotMatrix = new Matrix4();
		this.yRotMatrix = new Matrix4();
		this.scaleMatrix = new Matrix4();		
		this.modelMatrix = new Matrix4();
		this.viewMatrix = new Matrix4();
		this.projectionMatrix = new Matrix4();
		this.modelViewMatrix = new Matrix4();

		
		// define vectors corresponding to uniform counterparts in html file
		this.lightPosition = new Float32Array();
		this.lightColor = new Float32Array();
		this.modelColor = new Float32Array();
		this.alpha = new Float32Array();


		//set the translation
		this.translation = translation;


		//create Buffers to store Array data
		this.positionBuffer = gl.createBuffer();
		this.triangleBuffer = gl.createBuffer();
		this.normalBuffer =   gl.createBuffer();

		//flatten the arrays
		this.positionArray = new Float32Array(flatten(obj.positions));
		this.triangleArray = new Uint16Array(flatten(obj.triangles));
		this.normalArray =   new Float32Array(flatten(obj.normals));

		//bind/set the buffer data
		//
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.normalArray,gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.positionArray, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleArray, gl.STATIC_DRAW);
	}		
Model.prototype.draw = function (shader){

			

			// Set the camera location and orientation
			this.viewMatrix.setLookAt(0,0,5,0,0,-1,0,1,0);
		
			//set alpha value to change how it is smoothed
			this.alpha = [50.0];

			// Set the projection matrix with perspective information
			this.projectionMatrix.setPerspective(10, aspect, 1, 10);
	
			//set the light position
			this.lightPosition = [1,1,1,1];	

			//set the light color (white, so it shows the color of the model)
			this.lightColor = [1,1,1];

			//set the model color
			this.modelColor = [201/255,192/255,192/255];
		

			// Set the X and Y rotation matrices
			this.xRotMatrix.setRotate(modelRotationX,1,0,0);
			this.yRotMatrix.setRotate(modelRotationY,0,1,0);


			// Scale Matrices
			this.scaleMatrix.setScale(.2,.2,.2);
			
			
			//Make the model(scaled)
			this.modelMatrix.set( this.xRotMatrix.multiply( this.yRotMatrix.multiply( this.scaleMatrix )));
			
			//translate the model
			this.modelMatrix.translate(this.translation[0],this.translation[1],this.translation[2]);	       
			gl.useProgram(shader.program);

			//deliver to vertex shader
			gl.uniformMatrix4fv(shader.projectionMatrixLocation,false,this.projectionMatrix.elements);
			gl.uniformMatrix4fv(shader.viewMatrixLocation,false,this.viewMatrix.elements);
			gl.uniformMatrix4fv(shader.modelMatrixLocation,false,this.modelMatrix.elements);
			
			
			if(this.lightPosition){
			gl.uniform4fv(shader.lightPositionLocation,this.lightPosition);
	

			//deliver to fragment shader
			gl.uniform3fv(shader.modelColorLocation, this.modelColor);
			gl.uniform3fv(shader.lightColorLocation, this.lightColor);
			gl.uniform1fv(shader.alphaLocation,this.alpha);
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
			gl.vertexAttribPointer(shader.vertexPositionLocation,3,gl.FLOAT,false,0,0);
			if(shader.vertexNormalLocation > -1)
			{
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.vertexAttribPointer(shader.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
			}
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
			//draws the elements
			gl.drawElements(gl.TRIANGLES, this.triangleArray.length, gl.UNSIGNED_SHORT, 0);
		
		
		};
		
	



	function init(){
		//initialize GL context
		canvas = document.getElementById('webgl');
		gl = getWebGLContext(canvas,false);

		aspect = canvas.width / canvas.height;
		
		//define mouse click functions
		canvas.onmousedown = onMouseDown;
		canvas.onmouseup = onMouseUp;
		canvas.onmousemove = onMouseMove;
	
		//create instance of objects
		teapotModel = new Model(teapot,[0.0,0.0,0.0]);
		teapotShader = new Shader("vertexShader","fragmentShader");
		
		cowModel = new Model(cow,[-2.0,0.0,0.0]);
		cowShader = new Shader("rainbowVertexShader","rainbowFragmentShader");

		planeModel = new Model(plane, [2.0,0.25,0.0]);
		planeShader = new Shader("goochVertexShader","goochFragmentShader");


		requestAnimationFrame(draw);




		}

	function draw(){
		
		//clear color (set the background purple for easy viewing)
		gl.clearColor(.55,.33,.65,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		
		teapotModel.draw(teapotShader);
		cowModel.draw(cowShader);
		planeModel.draw(planeShader);
				

		
		}
		
