import * as React from 'react';
import * as THREE from 'three';
import {
  useThree, useFrame,
} from '@react-three/fiber';
import {
  Frustum, Matrix4, Vector3, InstancedBufferAttribute, Camera,
} from 'three';
import { MutableRefObject, useEffect, useState } from 'react';
import { Point } from '../App';
import { clusterColors, POINT_RADIUS } from '../constants';

interface InstancedPointsProps {
  data: Point[];
  enableCulling?: boolean;
  pointSegments: number;
}

// re-use for instance computations
const scratchColor = new THREE.Color();
const scratchObject3D = new THREE.Object3D();
const scratchSphere = new THREE.Sphere();
const scratchPos = new Vector3(0, 0, 0);
const frustum = new Frustum();
const projScreenMatrix = new Matrix4();

const updateColors = (
  data: Point[],
  pointIndexToId: number[],
  maxCount: number,
  colorArray: Float32Array,
  colorAttrib: MutableRefObject<InstancedBufferAttribute | undefined>,
) => {
  for (let i = 0; i < maxCount; ++i) {
    const point = data[pointIndexToId[i]];
    scratchColor.set(
      clusterColors[point.cluster],
    );
    scratchColor.toArray(colorArray, i * 3);

    if (colorAttrib.current) {
      // eslint-disable-next-line no-param-reassign
      colorAttrib.current.needsUpdate = true;
    }
  }
};

function updateInstancedMeshMatrices(
  mesh: THREE.InstancedMesh,
  data: Point[],
  maxPoints: number,
  enableCulling: boolean,
  camera: Camera,
  pointIndexToId: number[],
  colorArray: Float32Array,
  colorAttrib: MutableRefObject<InstancedBufferAttribute | undefined>,
): number {
  let visibleInstanceCount = 0;
  if (mesh) {
    for (let i = 0; i < maxPoints; ++i) {
      const { x } = data[i];
      const { y } = data[i];
      const { z } = data[i];

      projScreenMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      );
      frustum.setFromProjectionMatrix(projScreenMatrix);

      scratchPos.set(x, y, z);

      scratchSphere.set(scratchPos, POINT_RADIUS);

      if (
        (!frustum.intersectsSphere(scratchSphere) && enableCulling)
        || !data[i].include
      ) {
        // eslint-disable-next-line no-continue
        continue;
      }

      scratchObject3D.position.set(x, y, z);
      scratchObject3D.updateMatrix();
      mesh.setMatrixAt(visibleInstanceCount, scratchObject3D.matrix);
      // eslint-disable-next-line no-param-reassign
      pointIndexToId[visibleInstanceCount] = data[i].id;
      visibleInstanceCount++;
    }

    // eslint-disable-next-line no-param-reassign
    mesh.count = visibleInstanceCount;
    // eslint-disable-next-line no-param-reassign
    mesh.instanceMatrix.needsUpdate = true;

    updateColors(
      data,
      pointIndexToId,
      visibleInstanceCount,
      colorArray,
      colorAttrib,
    );
  }
  return visibleInstanceCount;
}

export const InstancedPoints = (props: InstancedPointsProps) => {
  const {
    data, enableCulling, pointSegments,
  } = props;
  const pointIndexToId = data.map((point) => point.id);

  const meshRef = React.useRef<THREE.InstancedMesh>();
  const [mesh, setMesh] = useState<THREE.InstancedMesh>();
  useEffect(() => setMesh(meshRef.current), [data]);

  const { camera } = useThree();

  const numPoints = data.length;

  const colorAttrib = React.useRef<THREE.InstancedBufferAttribute>();
  const colorArray = React.useMemo(() => new Float32Array(numPoints * 3), [
    numPoints,
  ]);

  useFrame(() => {
    if (mesh) {
      updateInstancedMeshMatrices(
        mesh,
        data,
        numPoints,
        enableCulling || false,
        camera,
        pointIndexToId,
        colorArray,
        colorAttrib,
      );
    }
  });

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[
            // TODO sort out the bugged typing here.
            // Ref: https://spectrum.chat/react-three-fiber/general/instancedmesh-gone-on-rerender-in-typescript~35e4d145-517f-4b81-b0c7-ab89e02bd72f
            (null as unknown) as THREE.BufferGeometry,
            (null as unknown) as THREE.Material,
            numPoints,
        ]}
      >
        <sphereBufferGeometry
          attach="geometry"
          args={[POINT_RADIUS, pointSegments, pointSegments]}
          key={pointSegments}
        >
          <instancedBufferAttribute
            ref={colorAttrib}
            // @ts-ignore
            attachObject={['attributes', 'color']}
            args={[colorArray, 3]}
          />
        </sphereBufferGeometry>
        <meshLambertMaterial attach="material" vertexColors />
      </instancedMesh>
    </>
  );
};

InstancedPoints.displayName = 'InstancedPoints';
