import * as React from "react";
import * as THREE from "three";
import { SelectedId, SelectHandler } from "./ThreePointVis";
import { MouseEvent, } from "react-three-fiber";
import { Point } from "../App";
import { SCALE_FACTOR } from "../constants";
import {Vector3} from "three";

interface VoxelInstancedPointsProps {
  data: Point[];
  selectedId: SelectedId;
  onSelect: SelectHandler;
  pointSegments: number;
  voxelResolution: number;
}

const pointRadius = 1 * SCALE_FACTOR;
const gridScale = 1001;

// re-use for instance computations
//const scratchColor = new THREE.Color();

const SELECTED_COLOR = "#6f6";


/*
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
*/

const useMousePointInteraction = (
  selectedId: SelectedId,
  onSelect: SelectHandler,
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

    if (instanceId === selectedId) {
      onSelect(null);
    } else if (instanceId || instanceId === 0) {
      onSelect(instanceId);
    }
  };

  return { handlePointerDown, handleClick };
};

export const VoxelInstancedPoints = (props: VoxelInstancedPointsProps) => {
  const { data, selectedId, onSelect, pointSegments, voxelResolution } = props;

  const [voxels, setVoxels] = React.useState<Point[][]>([]);

  const meshRefs = React.useRef<THREE.InstancedMesh[]>([]);

  // Sort points into voxel grid when data or grid resolution changes
  React.useEffect(() => {
    const gridStep = gridScale*2 / voxelResolution; // double grid scale to account for negative ranges
    const numVoxels = Math.pow(voxelResolution, 3);
    let newVoxels: Point[][] = [];
    for (let i = 0; i < numVoxels; i++) {
      newVoxels.push([]);
    }

    //const newVoxels: Point[][] = new Array(Math.pow(voxelResolution, 3)).fill(new Array);
    data.forEach(point => {
      // Shift into positive ranges
      const x = point.x + gridScale;
      const y = point.y + gridScale;
      const z = point.z + gridScale;

      const voxelIndex = Math.floor(x/gridStep)
        + Math.floor(y/gridStep) * voxelResolution
        + Math.floor(z/gridStep) * voxelResolution*voxelResolution;
      if( newVoxels[voxelIndex] === undefined) {
        console.log(voxelIndex);
      }
      newVoxels[voxelIndex].push(point);
      //meshRefs.current = meshRefs.current.slice(0, newVoxels.length);
    })
    setVoxels(newVoxels);
  }, [data, voxelResolution]);

  /*
  let colorAttrib = React.useRef<THREE.InstancedBufferAttribute>();
  let colorArray = React.useMemo(() => new Float32Array(numPoints * 3), [
    numPoints
  ]);
  */

  const { handleClick, handlePointerDown } = useMousePointInteraction(
    selectedId,
    onSelect,
  );

  // re-use for instance computations
  const scratchObject3D = new THREE.Object3D();

  React.useEffect(() => {
    let numEmptyVoxels = 0;
    for (let i = 0; i < voxels.length; ++i) {
      if (voxels[i].length > 0) {
        const mesh = meshRefs.current[i];
        const points = voxels[i].map(p => new Vector3(p.x, p.y, p.z));

        if(mesh) {
          mesh.matrixAutoUpdate = false; // TODO try for clusters
          mesh.updateMatrix();

          // set the transform matrix for each instance
          for (let j = 0; j < points.length; ++j) {
            const x = points[j].x;
            const y = points[j].y;
            const z = points[j].z;

            scratchObject3D.position.set(x, y, z);
            scratchObject3D.updateMatrix();
            mesh.setMatrixAt(j, scratchObject3D.matrix);
          }

          const boundingBox = new THREE.Box3().setFromPoints(points);
          const center = boundingBox.getCenter(new THREE.Vector3());
          mesh.geometry.boundingSphere = new THREE.Sphere().setFromPoints(points, center);
          mesh.instanceMatrix.needsUpdate = true;
          mesh.frustumCulled = true;
        }
      }
      else {
        numEmptyVoxels++;
      }
    }
    console.log("Total Voxels: ", voxels.length);
    console.log("Empty Voxels: ", numEmptyVoxels);
    console.log("Percent Empty Voxels ", (numEmptyVoxels/voxels.length) * 100);
  }, [voxels]);
  
  const sharedMaterial = new THREE.MeshStandardMaterial()

  return (
    <>
      {voxels.map((voxel, index) =>
        voxel.length > 0
          ? <instancedMesh
              key={index}
              ref={(mesh : THREE.InstancedMesh) => meshRefs.current[index] = mesh}
              args={[
                // TODO sort out the bugged typing here.
                // Ref: https://spectrum.chat/react-three-fiber/general/instancedmesh-gone-on-rerender-in-typescript~35e4d145-517f-4b81-b0c7-ab89e02bd72f
                (null as unknown) as THREE.BufferGeometry,
                (null as unknown) as THREE.Material,
                voxel.length
              ]}
              geometry={new THREE.SphereBufferGeometry(pointRadius, pointSegments, pointSegments)}
              material={sharedMaterial}
              onPointerUp={handleClick}
              onPointerDown={handlePointerDown}

          >
            {/*
              <sphereBufferGeometry
                  attach="geometry"
                  args={[pointRadius, pointSegments, pointSegments]}
                  key={pointSegments}
              >
                *<instancedBufferAttribute
                      ref={colorAttrib}
                      attachObject={["attributes", "color"]}
                      args={[colorArray, 3]}
                  />
              </sphereBufferGeometry>
              <meshStandardMaterial attach="material"/>
              */}
          </instancedMesh>
          : null
      )}
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
