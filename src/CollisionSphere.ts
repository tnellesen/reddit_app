import {
  Intersection, Matrix4, Object3D, Ray, Raycaster, Sphere, Vector3,
} from 'three';

const inverseMatrix = new Matrix4();
const ray = new Ray();
const testSphere = new Sphere();
const intersectionPoint = new Vector3();
const intersectionPointWorld = new Vector3();

export interface CollisionSphere extends Object3D {
  sphere: Sphere;
  index: number;
}

// eslint-disable-next-line no-redeclare
export class CollisionSphere implements Object3D {
  constructor(sphere: Sphere, index: number) {
    Object3D.call(this);

    this.type = 'CollisionSphere';

    this.sphere = sphere;
    this.index = index;
  }

  copy(source: CollisionSphere) {
    Object3D.prototype.copy.call(this, source);

    return this;
  }

  // eslint-disable-next-line consistent-return
  raycast(raycaster: Raycaster, intersects: Intersection[]) {
    const { matrixWorld } = this;
    inverseMatrix.getInverse(matrixWorld);
    ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);
    const threshold = raycaster.params.Points?.threshold;

    testSphere.copy(this.sphere);
    testSphere.radius += threshold || 0;
    const intersectPoint = ray.intersectSphere(testSphere, intersectionPoint);

    if (intersectPoint === null) {
      return null;
    }

    // Checking boundingSphere distance to ray
    intersectionPointWorld.copy(intersectionPoint);
    intersectionPointWorld.applyMatrix4(matrixWorld);

    const distance = raycaster.ray.origin.distanceTo(intersectionPointWorld);

    if (distance < raycaster.near || distance > raycaster.far) {
      return null;
    }

    intersects.push({
      distance,
      point: intersectionPointWorld.clone(),
      index: this.index,
      face: null,
      object: this,
    });
  }
}
