import * as THREE from 'three';
import { InteractionProcessor, AvatarConfig } from '../types';

export class LookAtProcessor implements InteractionProcessor {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isPointerDown = false;
  
  private lookAtTarget = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3(0, 1.5, 5);
  private lookAtWeight = 0;
  private targetWeight = 0;
  private holdTimer: number | null = null;
  private activePlane = new THREE.Plane();
  private lookAtProxy = new THREE.Object3D();

  constructor(
    private container: HTMLElement,
    private camera: THREE.Camera,
    private getHeadBone: () => THREE.Object3D | null,
    private getConfig: () => AvatarConfig | null,
    private getModels: () => THREE.Object3D[]
  ) {
    this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.container.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  public update(timeMs: number, _delta: number) {
    const headBone = this.getHeadBone();
    const config = this.getConfig();
    if (!headBone || config?.lookAt?.enabled === false) return;

    const lookAtConfig = config?.lookAt;
    const lerpFactor = lookAtConfig?.lerpFactor ?? 0.1;
    const holdTime = lookAtConfig?.holdDuration ?? 2000;

    // 1. Timer Logic
    if (!this.isPointerDown && this.holdTimer && timeMs - this.holdTimer > holdTime) {
      this.targetWeight = 0;
      this.holdTimer = null;
    }

    // 2. Easing
    this.lookAtWeight = THREE.MathUtils.lerp(this.lookAtWeight, this.targetWeight, 0.05);

    // 3. Update Tracking
    if (this.targetWeight > 0) {
      this.calculateLookAtTarget(headBone);
      this.currentLookAt.lerp(this.lookAtTarget, lerpFactor);
    }

    // 4. Apply to Bone
    if (this.lookAtWeight > 0.001) {
      const headWorldPos = new THREE.Vector3();
      headBone.getWorldPosition(headWorldPos);
      this.lookAtProxy.position.copy(headWorldPos);
      this.lookAtProxy.lookAt(this.currentLookAt);
      
      const offsetQuat = new THREE.Quaternion();
      if (lookAtConfig?.rotationOffset) {
        offsetQuat.setFromEuler(new THREE.Euler(...lookAtConfig.rotationOffset));
      } else {
        offsetQuat.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
      }
      
      const targetQuat = this.lookAtProxy.quaternion.clone().multiply(offsetQuat);
      headBone.quaternion.slerp(targetQuat, this.lookAtWeight);
    }
  }

  /**
   * Called by engine to visualize debug state
   */
  public getDebugInfo() {
    return {
      weight: this.lookAtWeight,
      currentLookAt: this.currentLookAt,
      activePlane: this.activePlane,
      isEngaged: this.lookAtWeight > 0.001
    };
  }

  public interrupt() {
    this.targetWeight = 0;
    this.isPointerDown = false;
    this.holdTimer = null;
  }

  public dispose() {
    this.container.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    // ... remove others
  }

  private updateMousePosition(event: PointerEvent) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown(event: PointerEvent) {
    this.isPointerDown = true;
    this.targetWeight = 1.0;
    this.holdTimer = null;
    this.updateMousePosition(event);
    
    const headBone = this.getHeadBone();
    if (!headBone) return;

    this.camera.updateMatrixWorld();
    const headPos = new THREE.Vector3();
    headBone.getWorldPosition(headPos);
    const camPos = this.camera.position.clone();
    
    const midPoint = new THREE.Vector3().lerpVectors(headPos, camPos, 0.5);
    const normal = new THREE.Vector3().subVectors(camPos, headPos).normalize();
    this.activePlane.setFromNormalAndCoplanarPoint(normal, midPoint);
  }

  private onPointerMove(event: PointerEvent) {
    if (this.isPointerDown) this.updateMousePosition(event);
  }

  private onPointerUp() {
    if (this.isPointerDown) {
      this.isPointerDown = false;
      this.holdTimer = performance.now(); // Note: we still need a global time source or wait for update
    }
  }

  private calculateLookAtTarget(headBone: THREE.Object3D) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.getModels(), true);

    if (intersects.length > 0) {
      this.lookAtTarget.copy(intersects[0].point);
    } else {
      const intersectionPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.activePlane, intersectionPoint)) {
        this.lookAtTarget.copy(intersectionPoint);
      } else {
        this.lookAtTarget.copy(this.raycaster.ray.direction).multiplyScalar(3).add(this.camera.position);
      }
    }
  }
}
