import * as THREE from 'three';
import { setupRightController } from '../controller/RightControllerHandler';
import { setupLeftController } from '../controller/LeftControllerHandler';

/**
 * Manages user interactions via VR controllers and mouse input.
 * Handles raycasting and triggers callbacks when interactive objects are selected.
 */
export class InteractionManager {
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private tempMatrix = new THREE.Matrix4();
    private rightController: THREE.Group | null = null;
    private leftController: THREE.Group | null = null;
    private onSelectCallback: ((object: THREE.Object3D, point: THREE.Vector3) => void) | null = null;
    private interactiveObjects: THREE.Object3D[] = [];
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.Camera;
    private scene: THREE.Scene;

    constructor(
        renderer: THREE.WebGLRenderer,
        camera: THREE.Camera,
        scene: THREE.Scene
    ) {
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;
        this.raycaster.far = 10;
        this.initializeControllers();
        this.setupMouseInteraction();
    }

    /**
     * Registers a callback to be invoked when an interactive object is selected.
     * @param callback Function that receives the selected object and the 3D intersection point
     */
    public onObjectSelected(callback: (object: THREE.Object3D, point: THREE.Vector3) => void): void {
        this.onSelectCallback = callback;
    }

    /**
     * Sets the list of objects that can be interacted with.
     * @param objects Array of THREE.Object3D instances that should respond to selection
     */
    public setInteractiveObjects(objects: THREE.Object3D[]): void {
        this.interactiveObjects = objects;
    }

    /**
     * Initializes VR controllers (left and right) and attaches event listeners.
     */
    private initializeControllers(): void {
        // Right Controller setup
        const rawRight = this.renderer.xr.getController(0);
        this.rightController = setupRightController(rawRight);
        (this.rightController as THREE.XRTargetRaySpace).addEventListener('selectstart', this.onSelectStart);
        this.scene.add(this.rightController);

        // Left Controller setup
        const rawLeft = this.renderer.xr.getController(1);
        this.leftController = setupLeftController(rawLeft);
        (this.leftController as THREE.XRTargetRaySpace).addEventListener('selectstart', this.onSelectStart);
        this.scene.add(this.leftController);
    }

    /**
     * Sets up mouse click interaction for desktop testing.
     * Converts mouse coordinates to normalized device coordinates and performs raycasting.
     */
    private setupMouseInteraction(): void {
        window.addEventListener('click', (event) => {
            // Normalize mouse coordinates to range [-1, 1]
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Configure raycaster from camera perspective
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // For mouse input, check children recursively since we might click on meshes inside groups
            this.checkIntersection(this.interactiveObjects, true);
        });
    }

    /**
     * Handles VR controller select events.
     * Extracts controller position and direction to perform raycasting.
     */
    private onSelectStart = (event: THREE.Event): void => {
        const controller = event.target as THREE.Object3D;

        // Extract rotation matrix from controller's world transform
        this.tempMatrix.identity().extractRotation(controller.matrixWorld);

        // Set ray origin to controller position
        this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);

        // Set ray direction (pointing forward from controller)
        this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

        // For VR controllers, don't check recursively for better performance
        this.checkIntersection(this.interactiveObjects, false);
    };

    /**
     * Checks for ray intersections with interactive objects and triggers the callback.
     * @param objects Array of objects to test against
     * @param recursive Whether to check children of objects
     */
    private checkIntersection(objects: THREE.Object3D[], recursive: boolean): void {
        if (objects.length === 0) return;

        const intersects = this.raycaster.intersectObjects(objects, recursive);

        if (intersects.length > 0 && this.onSelectCallback) {
            const intersection = intersects[0];

            // Pass both the intersected object and the 3D point where the intersection occurred
            // This allows components like QuizUIManager to calculate which option was clicked
            this.onSelectCallback(intersection.object, intersection.point);
        }
    }

    /**
     * Cleans up event listeners and resources.
     * Should be called when the manager is no longer needed.
     */
    public dispose(): void {
        if (this.rightController) {
            (this.rightController as THREE.XRTargetRaySpace).removeEventListener('selectstart', this.onSelectStart);
        }
        if (this.leftController) {
            (this.leftController as THREE.XRTargetRaySpace).removeEventListener('selectstart', this.onSelectStart);
        }
    }
}