/**
 * AddObjectHandlers Class
 * 
 * This class manages the process of uploading, handling, and integrating 3D objects into the engine. 
 * It facilitates the addition of objects to the rendering engine, and the creation of associated UI elements 
 * for managing textures, movement, and removal of the objects. It now supports uploading multiple image files for textures.
 */
class AddObjectHandlers {
    /**
     * Constructor for the AddObjectHandlers class.
     * @param {GraphicsEngine} engine - The rendering engine where objects will be added and managed.
     * @param {TextureUploadHandlers} textureUploadHandlers - Manages texture uploads for objects.
     * @param {MoveObjectHandlers} moveObjectHandlers - Manages the movement of objects in the scene.
     * @param {RemoveObjectHandlers} removeObjectHandlers - Manages the removal of objects from the scene.
     * @param {ObjectsMovers} objectsMovers - Tracks whether an object is currently being moved.
     */
    constructor(engine, textureUploadHandlers, moveObjectHandlers, removeObjectHandlers, objectsMovers) {
        this.objFileInput = null;
        this.mtlFileInput = null;
        this.imageFileInput = null;
        this.objContent = null;
        this.mtlContent = null;
        this.textures = {};

        this.uploadObjectFile = this.#uploadObjectFile.bind(this);
        this.uploadMaterialFile = this.#uploadMaterialFile.bind(this);
        this.uploadImageFiles = this.#uploadImageFiles.bind(this);
        this.click = this.#click.bind(this);

        this.engine = engine;
        this.textureUploadHandlers = textureUploadHandlers;
        this.moveObjectHandlers = moveObjectHandlers;
        this.removeObjectHandlers = removeObjectHandlers;
        this.objectsMovers = objectsMovers;
    }

    /**
     * Handles the reading and uploading of the object, material, and image files.
     * Once the files are read, it creates the necessary UI elements and registers handlers.
     * @private
     */
    async #handleFileUpload() {
        const reader = new ObjectReader(this.objContent, this.mtlContent,this.textures);
        const renderObject = await reader.getObject();

        // Creating UI elements for managing the object
        const menuList = document.querySelector('#menu ul');
        const menuItem = document.createElement('li');
        menuItem.textContent = `Object ${menuList.children.length + 1}`;

        // Create and register buttons for textures, removal, and movement
        const diffuseBtn = document.createElement('button');
        diffuseBtn.textContent = 'Diffuse Texture';

        const specularBtn = document.createElement('button');
        specularBtn.textContent = 'Specular Texture';

        const normalBtn = document.createElement('button');
        normalBtn.textContent = 'Normal Texture';

        this.textureUploadHandlers.register(diffuseBtn, normalBtn, specularBtn, renderObject);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        this.removeObjectHandlers.register(removeBtn, renderObject, menuItem, menuList);

        const moveBtn = document.createElement('button');
        moveBtn.textContent = 'Move';
        moveBtn.classList.add('move-btn');
        if (this.objectsMovers.isPresent()) {
            moveBtn.disabled = true;
        }
        this.moveObjectHandlers.register(moveBtn, renderObject);

        // Append buttons to the menu item and add the object to the engine
        menuItem.appendChild(diffuseBtn);
        menuItem.appendChild(specularBtn);
        menuItem.appendChild(normalBtn);
        menuItem.appendChild(removeBtn);
        menuItem.appendChild(moveBtn);
        menuList.appendChild(menuItem);

        this.engine.add(renderObject);
        this.engine.render();

        // Clear the content after processing
        this.objContent = null;
        this.mtlContent = null;
        this.imageFiles = [];
    }

    /**
     * Reads the content of a file and returns it as a string.
     * @param {File} file - The file to read.
     * @returns {Promise<string>} - The content of the file.
     * @private
     */
    #readFileContent(file,text=true) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            
            if(text){
                return reader.readAsText(file);
            } else {
                return reader.readAsDataURL(file);
            }
        });
    }


    

    /**
     * Triggers the click event for the object file input element.
     * @private
     */
    async #click() {
        if(this.objContent!==null && this.mtlContent !==null){
            await this.#handleFileUpload();

            // Clear the file inputs after processing
            this.objFileInput.value = '';
            this.mtlFileInput.value = '';
            this.imageFileInput.value = '';
        } else{
            alert("You need to insert both the .obj and the .mtl file.");
        } 
    }

    /**
     * Handles the object file upload process.
     * @param {Event} event - The event triggered by selecting the object file.
     * @private
     */
    async #uploadObjectFile(event) {
        const objFile = event.target.files[0];
        if (!objFile) return;

        this.objContent = await this.#readFileContent(objFile);
    }

    /**
     * Handles the material file upload process.
     * @param {Event} event - The event triggered by selecting the material file.
     * @private
     */
    async #uploadMaterialFile(event) {
        const mtlFile = event.target.files[0];
        if (!mtlFile) return;
        this.mtlContent = await this.#readFileContent(mtlFile);

    }

    /**
     * Handles the image files upload process.
     * @param {Event} event - The event triggered by selecting the image files.
     * @private
     */
    async #uploadImageFiles(event) {
        const files = event.target.files;
        if (files.length === 0) return;
        this.textures = {}
        for(let i = 0; i<files.length; i++){
            const file = files.item(i);
            const textureByteCode = await this.#readFileContent(file,false);
            const textureImg = new Image();
            textureImg.src = textureByteCode;
            this.textures[file.name] = textureImg;
        }
        this.imageFiles = Array.from(files);

    }

    /**
     * Registers the event listeners for adding objects.
     * @param {HTMLElement} addButton - The button to trigger the addition of a new object.
     * @param {HTMLInputElement} objFileInput - The file input for the object file.
     * @param {HTMLInputElement} mtlFileInput - The file input for the material file.
     * @param {HTMLInputElement} imageFileInput - The file input for the image files.
     */
    register(addButton, objFileInput, mtlFileInput, imageFileInput) {
        addButton.addEventListener('click',this.click);
        objFileInput.addEventListener('change', this.uploadObjectFile);
        mtlFileInput.addEventListener('change', this.uploadMaterialFile);
        imageFileInput.addEventListener('change', this.uploadImageFiles);
            
        this.objFileInput = objFileInput;
        this.mtlFileInput = mtlFileInput;
        this.imageFileInput = imageFileInput;
    }
}