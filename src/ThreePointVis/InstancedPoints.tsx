import * as React from "react";
import * as THREE from "three";
import { SelectedId, SelectHandler } from "./ThreePointVis";
import { MouseEvent, useThree, useFrame, Camera } from "react-three-fiber";
import { Point } from "../App";
import { Frustum, Matrix4, Vector3, InstancedBufferAttribute } from "three";
import {SCALE_FACTOR, clusterColors, POINT_RADIUS} from "../constants";
import {MutableRefObject, useEffect, useState} from "react";

interface InstancedPointsProps {
  data: Point[];
  selectedId: SelectedId;
  onSelect: SelectHandler;
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

function updateInstancedMeshMatrices(
  mesh: THREE.InstancedMesh,
  data: Point[],
  maxPoints: number,
  enableCulling: boolean,
  camera: Camera,
  pointIndexToId: number[],
  colorArray: Float32Array,
  colorAttrib: MutableRefObject<InstancedBufferAttribute | undefined>,
  selectedId: SelectedId
): number {
  let visibleInstanceCount = 0;
  if (mesh) {
    for (let i = 0; i < maxPoints; ++i) {
      const x = data[i].x;
      const y = data[i].y;
      const z = data[i].z;

      projScreenMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      frustum.setFromProjectionMatrix(projScreenMatrix);

      scratchPos.set(x, y, z);

      scratchSphere.set(scratchPos, POINT_RADIUS);

      if (
        (!frustum.intersectsSphere(scratchSphere) && enableCulling) ||
        !data[i].include
      ) {
        continue;
      }

      scratchObject3D.position.set(x, y, z);
      scratchObject3D.updateMatrix();
      mesh.setMatrixAt(visibleInstanceCount, scratchObject3D.matrix);
      pointIndexToId[visibleInstanceCount] = data[i].id;
      visibleInstanceCount++;
    }

    mesh.count = visibleInstanceCount;
    mesh.instanceMatrix.needsUpdate = true;

    updateColors(
      data,
      selectedId,
      pointIndexToId,
      visibleInstanceCount,
      colorArray,
      colorAttrib
    );
  }
  return visibleInstanceCount;
}

const SELECTED_COLOR = "#6f6";

const updateColors = (
  data: Point[],
  selectedId: SelectedId,
  pointIndexToId: number[],
  maxCount: number,
  colorArray: Float32Array,
  colorAttrib: MutableRefObject<InstancedBufferAttribute | undefined>
) => {
  for (let i = 0; i < maxCount; ++i) {
    const point = data[pointIndexToId[i]];
    scratchColor.set(
      point.id === selectedId ? SELECTED_COLOR : clusterColors[point.cluster]
    );
    scratchColor.toArray(colorArray, i * 3);

    if (colorAttrib.current) {
      colorAttrib.current.needsUpdate = true;
    }
  }
};

const useMousePointInteraction = (
  selectedId: SelectedId,
  onSelect: SelectHandler,
  pointIndexToId: number[]
) => {
  // track mousedown position to skip click handlers on drags
  const mouseDownRef = React.useRef([0, 0]);
  const handlePointerDown = (event: MouseEvent) => {
    mouseDownRef.current[0] = event.clientX;
    mouseDownRef.current[1] = event.clientY;
  };

  const handleClick = (event: MouseEvent) => {
    const { instanceId, clientX, clientY } = event;
    const downDistance = Math.sqrt(
      Math.pow(mouseDownRef.current[0] - clientX, 2) +
        Math.pow(mouseDownRef.current[1] - clientY, 2)
    );

    // skip click if we dragged more than 5px distance
    if (downDistance > 5) {
      event.stopPropagation();
      return;
    }

    const id = instanceId !== undefined ? pointIndexToId[instanceId] : -1;

    if (id === selectedId) {
      onSelect(null);
    } else if (id || id === 0) {
      onSelect(id);
    }
  };

  return { handlePointerDown, handleClick };
};

export const InstancedPoints = (props: InstancedPointsProps) => {
  const { data, selectedId, onSelect, enableCulling, pointSegments } = props;
  const pointIndexToId = data.map((point) => point.id);

  const meshRef = React.useRef<THREE.InstancedMesh>();
  const [mesh, setMesh] = useState();
  useEffect(() => void setMesh(meshRef.current), [data])

  const { camera } = useThree();

  const numPoints = data.length;

  let colorAttrib = React.useRef<THREE.InstancedBufferAttribute>();
  let colorArray = React.useMemo(() => new Float32Array(numPoints * 3), [
    numPoints
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
        selectedId
      );
    }
  });

  const { handleClick, handlePointerDown } = useMousePointInteraction(
    selectedId,
    onSelect,
    pointIndexToId
  );

  return (
    <>
      <instancedMesh
          ref={meshRef}
          args={[
            // TODO sort out the bugged typing here.
            // Ref: https://spectrum.chat/react-three-fiber/general/instancedmesh-gone-on-rerender-in-typescript~35e4d145-517f-4b81-b0c7-ab89e02bd72f
            (null as unknown) as THREE.BufferGeometry,
            (null as unknown) as THREE.Material,
            numPoints
          ]}
          onPointerUp={handleClick}
          onPointerDown={handlePointerDown}
      >
          <sphereBufferGeometry
              attach="geometry"
              args={[POINT_RADIUS, pointSegments, pointSegments]}
              key={pointSegments}
          >
              <instancedBufferAttribute
                  ref={colorAttrib}
                  attachObject={["attributes", "color"]}
                  args={[colorArray, 3]}
              />
          </sphereBufferGeometry>
          <meshStandardMaterial attach="material" vertexColors/>
      </instancedMesh>
      {selectedId !== null && (
        <group
          position={[
            data[selectedId].x,
            data[selectedId].y,
            data[selectedId].z
          ]}
        >
          <pointLight
            distance={19 * SCALE_FACTOR}
            position={[0, 0, 0]}
            intensity={2.5}
            decay={30}
            color={SELECTED_COLOR}
          />
          <pointLight
            distance={10 * SCALE_FACTOR}
            position={[0, 0, 0]}
            intensity={1.5}
            decay={1}
            color={SELECTED_COLOR}
          />
        </group>
      )}
    </>
  );
};
