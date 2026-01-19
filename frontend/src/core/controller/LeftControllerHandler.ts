import * as THREE from 'three';

// main handler function
export function setupLeftController(controller: THREE.XRTargetRaySpace): THREE.XRTargetRaySpace {
    if (!controller.getObjectByName('controllerPointer')) {
        const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
        const pointerMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const pointerLine = new THREE.Line(pointerGeometry, pointerMaterial);
        pointerLine.name = 'controllerPointer';
        pointerLine.scale.z = 4;
        controller.add(pointerLine);
    }

    return controller;
}

