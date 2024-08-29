

/**
 * GraphicsEngine Class
 * 
 * This class manages the rendering of 3D objects using WebGL.
 * It handles initialization of WebGL, buffer management, camera controls,
 * and rendering of objects.
 * 
 * Usage:
 * 1. Create an instance with a WebGL context and shader files
 * 2. Call init() to set up the WebGL program
 * 3. Add render objects using add()
 * 4. Use camera control methods to position the view
 * 5. Call render() in your animation loop to draw the scene
 * 6. Call refresh() after any modification to a RenderObject.
 */
class GraphicsEngine {
    /**
     * Constructor for the GraphicsEngine class.
     * @param {WebGLRenderingContext} gl - The WebGL rendering context.
     * @param {string} vertexShaderFile - URL of the vertex shader file.
     * @param {string} fragmentShaderFile - URL of the fragment shader file.
     */
    constructor(gl, vertexShaderFile, fragmentShaderFile) {
        this.gl = gl;
        this.vertexShaderFile = vertexShaderFile;
        this.fragmentShaderFile = fragmentShaderFile;
        this.program = null;
        this.renderer = null;
        this.renderObjects = [];
        this.cameraPosition = new Vector3D(0, 2, 10);
        this.lookAtPosition = new Vector3D(0, 0, 0);
        this.backgroundColor = [0, 0, 0, 1];
        this.objectsColor = [1, 1, 1];

        // View Matrices
        const fieldOfView = 45 * Math.PI / 180; // In radiants
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 500.0;
        this.projectionMatrix = TransformationMatrix.createPerspective(fieldOfView, aspect, zNear, zFar);
        this.modelMatrix = TransformationMatrix.identity();

        // Light
        this.light = {
            position: [1.0, 1.0, 2.0],
            color: [1.0, 1.0, 1.0],
            ambient: {
                color: [1.0, 1.0, 1.0],
                strength: 0.1
            },
            materialReflectivity: {
                Ka: [0.1, 0.1, 0.1],
            }
        };
    }


    /**
     * Initializes the WebGL program.
     * @returns {Promise<boolean>} True if initialization is successful, false otherwise.
     */
    async init() {
        this.program = await initWebGL(this.gl, this.vertexShaderFile, this.fragmentShaderFile);
        if (!this.program) {
            console.error('Failed to initialize WebGL program.');
            return false;
        }

        // Initialize the renderer with the WebGL program
        this.renderer = new WebGLRenderer(this.gl, this.program);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        return true;
    }



    /** Adds a render object to the engine.
     * @param {Object} renderObject - The object to add.
    */
    add(renderObject) {
        this.renderObjects.push(renderObject);
        this.renderer.initBuffers(renderObject); // Delegate buffer initialization to WebGLRenderer
    }

    /**
     * Removes a render object from the engine.
     * @param {Object} renderObject - The object to remove.
     */
    remove(renderObject) {
        this.renderObjects = this.renderObjects.filter(obj => obj !== renderObject);
        this.renderer.removeBuffer(renderObject);
    }


    /**
     * Renders all objects in the engine.
    */
    render() {
        const upVector = new Vector3D(0, 1, 0);
        const viewMatrix = TransformationMatrix.createLookAt(this.cameraPosition, this.lookAtPosition, upVector);
        const modelViewMatrix = viewMatrix.multiply(this.modelMatrix);
        const normalMatrix = modelViewMatrix.inverse().transpose();

        const renderParams = {
            projectionMatrix: this.projectionMatrix,
            modelViewMatrix,
            normalMatrix,
            cameraPosition: this.cameraPosition,
            light: this.light,
            backgroundColor: this.backgroundColor,
            objectsColor: this.objectsColor,
        };

        this.renderer.renderAll(renderParams);
    }

    /**
     * Refreshes the buffers for a render object.
     * To use every time a renderobject state or position is modified.
     * @param {Object} renderObject - The object to refresh.
     */
    refresh(renderObject) {
        this.renderer.refreshBuffers(renderObject);
    }

    /**
     * Moves the camera in a given direction.
     * @param {Vector3D} direction - The direction to move the camera.
    */
    moveCamera(direction) {
        direction = direction.normalize();
        this.cameraPosition = this.cameraPosition.add(direction);
    }

    /**
     * @returns {Vector3D} The camera position.
    */
    getCameraPosition(){
        return this.cameraPosition;
    }

    /** Sets the new camera center.
     * @param {Vector3D} the new camera center to set.
     */
    setCameraCenter(cameraCenter){
        this.lookAtPosition = cameraCenter;
    }
    
    
    /**
     * Calculates rotation around the camera.
     * @param {Vector3D} direction - The direction of rotation in 2D screen coordinates.
     * @param {number} angle - The angle of rotation in radians.
     * @returns {TransformationMatrix} The rotation matrix.
     */
    getRotationAroundCamera(direction, angle = Math.PI / 180){
        // Calcolare la matrice di visualizzazione
        const upVector = new Vector3D(0, 1, 0);
        const viewMatrix = TransformationMatrix.createLookAt(this.cameraPosition, this.lookAtPosition, upVector);
        // Invertire la matrice di visualizzazione
        const transformationMatrix = viewMatrix.inverse();

        // Trasformare il vettore direction
        const transformedDirection = transformationMatrix.transform(direction);

        const centerDirection = this.lookAtPosition.subtract(this.cameraPosition);
        const axis = transformedDirection.cross(centerDirection).normalize();

        const rotationMatrix = TransformationMatrix.createRotationAroundPoint(angle, axis, this.lookAtPosition);
        return rotationMatrix;
    }

    /**
     * Transforms the 2D direction in screen coordinates in the 3D coordinates of the space.
     * @param {Vector3D} direction - The direction of rotation in 2D screen coordinates.
     * @returns {Vector3d} The transformed direction.
     */
    getDirectionInSpace(direction){
        const upVector = new Vector3D(0, 1, 0);
        const viewMatrix = TransformationMatrix.createLookAt(this.cameraPosition, this.lookAtPosition, upVector);
        const transformationMatrix = viewMatrix.inverse();
        return transformationMatrix.transform(direction);
    }

    /**
     * Rotates the camera.
     * @param {TransformationMatrix} rotationMatrix - The rotation matrix to apply.
    */
    rotateCamera(rotationMatrix) {
        this.cameraPosition = rotationMatrix.transform(this.cameraPosition);
    }
    
    /**
     * Traslates the camera.
     * @param {Vector3D} direction - The direction to traslate.
     * @param {boolean} invert - Whether to invert the direction.
     */
    traslateCamera(direction, invert = true) {
        const scale = invert ? -0.2 : 0.2;
        const finalDirection =  direction.normalize().scale(scale);
        this.cameraPosition = this.cameraPosition.add(finalDirection);
        this.lookAtPosition = this.lookAtPosition.add(finalDirection);
    }

    /**
     * Sets the background color.
     * @param {Array<number>} color - The color as an RGBA array.
     */
    setBackgroundColor(color){
        this.backgroundColor = color;
    }

    /**
     * Sets the color for all objects without a texture.
     * @param {Array<number>} color - The color as an RGB array.
     */
    setObjectsColor(color){
        this.objectsColor = color.slice(0,3);
    }

    /**
     * Resets the camera view to its initial position.
    */
    resetView(){
        this.cameraPosition = new Vector3D(0, 2, 10);
        this.lookAtPosition = new Vector3D(0, 0, 0);
    }

    /**
    * Sets the light position in the scene.
    * @param {Vector3D} position - The new light position as a Vector3D object.
    */
    setLightPosition(position) {
       if (!(position instanceof Vector3D)) {
           console.error('Invalid position. Expected a Vector3D object.');
           return;
       }
       this.light.position = [position.x, position.y, position.z];
    }

    /**
     * Sets the light color in the scene.
     * @param {Vector3D} color - The new light color as a Vector3D object, with each component (x, y, z) representing r, g, b values between 0 and 1.
     */
    setLightColor(color) {
        if (!(color instanceof Vector3D)) {
            console.error('Invalid color. Expected a Vector3D object.');
            return;
        }
        this.light.color = [color.x, color.y, color.z];
    }

    /**
     * Sets the ambient light color.
     * @param {Vector3D} color - The ambient light color as a Vector3D object, with each component (x, y, z) representing r, g, b values between 0 and 1.
     */
    setAmbientLightColor(color) {
        if (!(color instanceof Vector3D)) {
            console.error('Invalid color. Expected a Vector3D object.');
            return;
        }
        this.light.ambient.color = [color.x, color.y, color.z];
    }

    /**
     * Sets the ambient light strength.
     * @param {number} strength - The ambient light strength, with a value between 0 and 1.
     */
    setAmbientLightStrength(strength) {
        if (typeof strength !== 'number' || strength < 0 || strength > 1) {
            console.error('Invalid strength. Must be a number between 0 and 1.');
            return;
        }
        this.light.ambient.strength = strength;
    }
    
    /**
     * Sets the material reflectivity coefficients for ambient lighting.
     * @param {Vector3D} Ka - The ambient reflectivity coefficient as a Vector3D object, with each component (x, y, z) representing r, g, b values between 0 and 1.
     */
    setMaterialAmbientReflectivity(Ka) {
        if (!(Ka instanceof Vector3D)) {
            console.error('Invalid ambient reflectivity. Expected a Vector3D object.');
            return;
        }
        this.light.materialReflectivity.Ka = [Ka.x, Ka.y, Ka.z];
    }

   /**
     * Gets the light position in the scene.
     * @returns {Vector3D} The light position as a Vector3D object.
     */
    getLightPosition() {
        return new Vector3D(...this.light.position);
    }

    /**
     * Gets the light color in the scene.
     * @returns {Vector3D} The light color as a Vector3D object.
     */
    getLightColor() {
        return new Vector3D(...this.light.color);
    }

    /**
     * Gets the ambient light color in the scene.
     * @returns {Vector3D} The ambient light color as a Vector3D object.
     */
    getAmbientLightColor() {
        return new Vector3D(...this.light.ambient.color);
    }

    /**
     * Gets the ambient light strength in the scene.
     * @returns {number} The ambient light strength, with a value between 0 and 1.
     */
    getAmbientLightStrength() {
        return this.light.ambient.strength;
    }

    /**
     * Gets the material reflectivity coefficients for ambient lighting.
     * @returns {Vector3D} The ambient reflectivity coefficients as a Vector3D object.
     */
    getMaterialAmbientReflectivity() {
        return new Vector3D(...this.light.materialReflectivity.Ka);
    }

}
