import {Intersection, Matrix4, Object3D, Ray, Raycaster, Sphere, Vector3} from "three";

const _inverseMatrix = new Matrix4();
const _ray = new Ray();
const _testSphere = new Sphere();
const _intersectionPoint = new Vector3();
const _intersectionPointWorld = new Vector3();

export interface CollisionSphere extends Object3D {
  sphere: Sphere;
  index: number;
};

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

  raycast(raycaster: Raycaster, intersects: Intersection[]) {

    const matrixWorld = this.matrixWorld;
    _inverseMatrix.getInverse( matrixWorld );
    _ray.copy( raycaster.ray ).applyMatrix4( _inverseMatrix );
    const threshold = raycaster.params.Points?.threshold;

    _testSphere.copy(this.sphere);
    _testSphere.radius += threshold || 0;
    const intersectPoint = _ray.intersectSphere(_testSphere, _intersectionPoint)

    if (intersectPoint === null) {
      return null;
    }

    // Checking boundingSphere distance to ray
    _intersectionPointWorld.copy(_intersectionPoint);
    _intersectionPointWorld.applyMatrix4(matrixWorld);

    const distance = raycaster.ray.origin.distanceTo(_intersectionPointWorld);

    if (distance < raycaster.near || distance > raycaster.far) {
      return null;
    }

    intersects.push({
      distance: distance,
      point: _intersectionPointWorld.clone(),
      index: this.index,
      face: null,
      object: this
    });
  }
}