	

// Variables to store current rotation angles about X and Y Axes
var modelRotX = 5.0;
var modelRoty = 0.0;

// Variable to store canvas aspect ratio
var aspect = 0.0;

// Variables to handle mouse interaction
var dragging = false;
var mouseDown = 0;
var lastMouseX;
var lastMouseY;

// Variables to store shader objects
var chestShader, squareShader, blurShader, edgeShader, thresholdShader, doNothingShader; 

// Variables to store model objects
var chestModel, squareModel;

// Canvas element
var canvas;

// WebGL Context
var gl;

// Variables used to control when first frame is requested
var imagesLoaded = 0;
const imagesNeeded = 3; 

// Variables to store slider elements
var xSlider, ySlider, zSlider;

// Image URLs
var chestImage = "http://i.imgur.com/7thU1gD.jpg";
var specImage = "http://i.imgur.com/K8YFBpf.png";
var normalImage = "http://i.imgur.com/xsoz6Rt.png";

// This is the constructor method for a shader object
function Shader(vertexShaderId, fragmentShaderId)
{
	// A Webgl program object is created and activated as a member of the shader
	this.program = createProgram(gl, document.getElementById(  vertexShaderId).text,
									 document.getElementById(fragmentShaderId).text); 
    gl.useProgram(this.program);

    // The remainder of this function gets the uniform and attribute locations and enables
    // the attribute arrays if they exist in the shader program

    this.vertexPositionLocation = gl.getAttribLocation(this.program, 'vertexPosition');
	gl.enableVertexAttribArray(this.vertexPositionLocation);

    this.vertexNormalLocation = gl.getAttribLocation(this.program, 'vertexNormal');

    this.tangentLocation = gl.getAttribLocation(this.program, 'tangent');

	if(this.vertexNormalLocation != -1)
	{
		 gl.enableVertexAttribArray(this.vertexNormalLocation);
	}

	if(this.tangentLocation != -1)
	{
		gl.enableVertexAttribArray(this.tangentlLocation);
	}

	this.texturePositionLocation = gl.getAttribLocation(this.program, 'vertexTexCoord');
	gl.enableVertexAttribArray(this.texturePositionLocation);

    this.projectionMatrixLocation = gl.getUniformLocation(this.program, "projectionMatrix");
	this.modelMatrixLocation      = gl.getUniformLocation(this.program,      "modelMatrix");
	this.viewMatrixLocation       = gl.getUniformLocation(this.program,       "viewMatrix");
	this.lightPosLocation         = gl.getUniformLocation(this.program,    "lightPosition");
	this.lightColorLocation       = gl.getUniformLocation(this.program,       "lightColor");
	this.modelColorLocation       = gl.getUniformLocation(this.program,       "modelColor");
	this.uSamplerLocation         = gl.getUniformLocation(this.program,         "uSampler");
}

// This shader member function passes all the uniform data to the shader
// In some cases the existence of the uniform location is tested
Shader.prototype.setup = function(projectionMatrix, viewMatrix, modelMatrix, textures)
{
    gl.uniformMatrix4fv(       this.viewMatrixLocation, false,       viewMatrix.elements);
    gl.uniformMatrix4fv(      this.modelMatrixLocation, false,      modelMatrix.elements);
    gl.uniformMatrix4fv( this.projectionMatrixLocation, false, projectionMatrix.elements);

    if(this.lightPosLocation)
    {
    	gl.uniform4f(   this.lightPosLocation, xSlider.value, ySlider.value, zSlider.value, 1.0);
    	gl.uniform3f( this.lightColorLocation, 0.9, 0.9, 1.0);
    }

    for(i = 0; i < textures.length; i++)
    {
    	gl.activeTexture(gl.TEXTURE0+i);
    	gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    }
}

// The FrameBuffer object encapsulates a gl_frame
function FrameBuffer(colorTexture, depthTexture, width, height)
{
	this.frameBufferWidth = width;
	this.frameBufferHeight = height;

	gl.bindTexture(gl.TEXTURE_2D, colorTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	gl.bindTexture(gl.TEXTURE_2D, depthTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	this.frameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT , gl.TEXTURE_2D, depthTexture, 0);

	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}

FrameBuffer.prototype.get = function()
{
	return this.frameBuffer;
}

function Texture(imgSrc)
{
	var texture = this.texture = gl.createTexture();

	if(imgSrc)
    {
    	var image = new Image();

    	// Calls the function that handles the image processing and texture setup
		image.onload = function()
		{
			loadTexture(image, texture);
			
			imagesLoaded++;

			if(imagesLoaded == imagesNeeded)
			{
				requestAnimationFrame(draw);
			}	
				
		};

    	// Enable CORS and source the image object to the actual image resource
		image.crossOrigin = 'anonymous';
		image.src = imgSrc;
	}	   
}

// This is the constructor method for a model object
// The buffer data for the model is created and the buffers themselves become member
// variables of the model object
function Model(meshData, translation, rotation, scale, textures)
{
	this.rotation = rotation;
	this.translation = translation;
	this.scale = scale;

	this.textures = textures;

	this.v_flattened = [].concat.apply([], meshData.positions);
	this.n_flattened = [].concat.apply([], meshData.normals);
	this.t_flattened = [].concat.apply([], meshData.triangles);
	this.t_coords_flattened = [].concat.apply([], meshData.texCoords);
	this.tangent_flattened = [].concat.apply([], meshData.tangents);

	this.positionArray = new Float32Array(this.v_flattened);
	this.normalArray   = new Float32Array(this.n_flattened);
    this.triangleArray = new  Uint16Array(this.t_flattened);
    this.texturePositionArray = new Float32Array(this.t_coords_flattened);
    this.tangentArray = new Float32Array(this.tangent_flattened)

	this.positionBuffer = gl.createBuffer();
    this.triangleBuffer = gl.createBuffer();
    this.normalBuffer   = gl.createBuffer();
    this.tangentBuffer  = gl.createBuffer();

	this.texturePositionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positionArray, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.tangentArray, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normalArray, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleArray, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texturePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.texturePositionArray, gl.STATIC_DRAW); 
}

// This is the model member method that handles rendering
Model.prototype.draw = function(shader)
{	
	var modelMatrix      = new Matrix4();
	var viewMatrix       = new Matrix4();
	var projectionMatrix = new Matrix4();

	// Set the camera location and orientation
	viewMatrix.setLookAt(0,0,5,0,0,-1,0,1,0);
	
	// Set the projection matrix with perspective information
	projectionMatrix.setPerspective(45, aspect, 1, 15);

    // Set the model matrix
   	modelMatrix.rotate(modelRotX,1,0,0);
	modelMatrix.rotate(modelRoty, 0, 1, 0);

	modelMatrix.translate(this.translation[0], this.translation[1], this.translation[2]);	

	modelMatrix.rotate(this.rotation[0], 1,0,0);
	modelMatrix.rotate(this.rotation[1], 0,1,0);
	modelMatrix.rotate(this.rotation[2], 0,0,1);

	modelMatrix.scale(this.scale[0], this.scale[1], this.scale[2]);

	// Activate the proper program and pass the uniform data
	gl.useProgram(shader.program);

	// Call the function that passes uniforms to shader
	shader.setup(projectionMatrix, viewMatrix, modelMatrix, this.textures);

    // Enable attrib arrays for existing attributes
	gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
	gl.vertexAttribPointer(shader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);

	if(shader.vertexNormalLocation != -1)
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(shader.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
	}

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texturePositionBuffer);
    gl.vertexAttribPointer(shader.texturePositionLocation, 2, gl.FLOAT, false, 0, 0);

    if(shader.tangentLocation != -1)
    {
   		gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
    	gl.vertexAttribPointer(shader.tangentLocation, 3, gl.FLOAT,false, 0,0);
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
	
	// Draw the model
    gl.drawElements(gl.TRIANGLES, this.triangleArray.length, gl.UNSIGNED_SHORT, 0);
}

// This function initializes the program
function init()
{
	// The canvas element is retreived from prog2.html.
	canvas = document.getElementById("webgl", false);

	// The initial width and height of the canvas are set
	//canvas.width  = 0.8 * window.innerWidth;
	//canvas.height = 0.8 * window.innerHeight;

	modelRoty = 180.0;

	// The aspect ratio of the canvas is stored
	aspect = canvas.width / canvas.height;

	// The WebGL context of the canvas is retreived
	gl = getWebGLContext(canvas);

	// Depth Test is enabled for proper rendering of 3D Cube
	gl.enable(gl.DEPTH_TEST);
	gl.getExtension("webgl_depth_texture");

	// Anonymous functions for user input are initiliazed in this function
	initMouseEvents();
	
	//Get the slider elements
	xSlider = document.getElementById("x_slider");
	ySlider = document.getElementById("y_slider");
	zSlider = document.getElementById("z_slider");

    // The sahder objects are initialized
    chestShader   = new Shader("chest_v_shader", "chest_f_shader");
    thresholdShader  = new Shader("square_v_shader", "threshold_f_shader");
    blurShader = new Shader("square_v_shader", "blur_f_shader");
    edgeShader = new Shader("square_v_shader", "edge_f_shader");
    doNothingShader = new Shader("square_v_shader", "square_f_shader");

    changeShader();

    colorTexture = new Texture(null);
	depthTexture = new Texture(null);

	chestTexture = new Texture(chestImage);
	chestNormalTexture = new Texture(normalImage);
	chestSpecularTexture = new Texture(specImage);

	chestTextures = [];
	chestTextures.push(chestNormalTexture.texture);
	chestTextures.push(chestTexture.texture);
	chestTextures.push(chestSpecularTexture.texture);

	gl.useProgram(chestShader.program);

	gl.uniform1i(gl.getUniformLocation(chestShader.program, "textureSampler0"),0);
	gl.uniform1i(gl.getUniformLocation(chestShader.program, "textureSampler1"),1);
	gl.uniform1i(gl.getUniformLocation(chestShader.program, "textureSampler2"),2);

	squareTextures = [];
	squareTextures.push(colorTexture.texture);

    // The model objects are initialized
	chestModel  = new Model(chest,  [0.0, 0.0, 0.0], [0, 180, 0], [1,1,1],  chestTextures);
	squareModel = new Model(square, [0.0, 0.0, 0.0], [0,   0, 0], [1,1,1], squareTextures);

	buffer1 = new FrameBuffer(colorTexture.texture, depthTexture.texture, canvas.width, canvas.height);
}

// This function handles rendering order of our models
function draw()
{
	// The offscreen buffer is bound
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer1.get());
    gl.viewport(0, 0, buffer1.frameBufferWidth, buffer1.frameBufferHeight);

    // The canvas is cleared to the background color
	// And the depth information is cleared
    gl.clearColor(0.333,0.412,0.184,1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw all the models
    chestModel.draw(chestShader);

    // The on screen buffer is bound
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // The canvas is cleared to the background color
	// And the depth information is cleared
    gl.clearColor(0.333,0.412,0.184,1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0,0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    squareModel.draw(squareShader);
}

// This function is called once in init() and sets up 
// event handlers for mouse interaction.
function initMouseEvents()
{
	// Record if mouse went down inside body
	document.body.onmousedown = function(event)
	{
		mouseDown = 1;
	};
    
    // Record if mouse went up inside body
    // Deactivate interaction
	document.body.onmouseup = function(event)
	{
		mouseDown = 0;
		dragging = false;
	};

	// Fires when mouse moves around inside the body area
	// and handles the user interaction of rotating with mouse
	document.body.onmousemove = function(event)
	{
		// If interaction should be active, the rotation angles are changed
		// within this block
		if(mouseDown && dragging)
		{
			var deltaX, deltaY;
			var speed = .5;

			if(dragging)
			{
				deltaX = event.clientY - lastMouseY;
				deltaY = event.clientX - lastMouseX;

				modelRotX = modelRotX + deltaX * speed;
				modelRoty = modelRoty + deltaY * speed;

				if(modelRotX > 90)
				{
					modelRotX = 90;
				}

				if(modelRotX < -90)
				{
					modelRotX = -90;
				}

			    // A frame is requested to display with new angles
				requestAnimationFrame(draw);

				// Current mouse position is recorded
				lastMouseX = event.clientX;
				lastMouseY = event.clientY;
			}
		}	
	};

	// If the mouse moves out of the canvas and not into another area of the body
	// or the mouse transitions from one element of the body area besides the canvas and not into the canvas
	// we went to deactivate user interaction
	document.body.onmouseout = function(event)
	{
		if((event.target == document.body && event.relatedTarget != canvas) 
			   || (event.target == canvas && event.relatedTarget != document.body))
		{
			dragging = false;
			mouseDown = 0;
		}
	};

    // If the user clicks within the canvas we want to activate user interaction
	canvas.onmousedown = function(event)
	{
		dragging = true;
		lastMouseX = event.x;
		lastMouseY = event.y;
	};
}

// This function handles texture setup and requests the first frame once all images
// are loaded
function loadTexture(image, texture)
{
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	gl.activeTexture(gl.TEXTURE0 );
	gl.bindTexture(gl.TEXTURE_2D, texture);


	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);		

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
}

// Requests a new frame when the user moves a slider
function sliderEvent()
{
	requestAnimationFrame(draw);
}

// Executes when a radio button is clicked
function changeShader()
{
	if(document.getElementById("radio1").checked)
	{
		squareShader = thresholdShader;
	}

	else if(document.getElementById("radio2").checked)
	{
		squareShader = blurShader;
	}

	else if(document.getElementById("radio3").checked)
	{
		squareShader = edgeShader;
	}

	else if(document.getElementById("radio4").checked)
	{
		squareShader = doNothingShader;
	}

	if(imagesLoaded == imagesNeeded)
	{
		requestAnimationFrame(draw);
	}
}



