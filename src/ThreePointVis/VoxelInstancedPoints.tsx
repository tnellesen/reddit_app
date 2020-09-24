import * as React from "react";
import * as THREE from "three";
import { Point } from "../App";
import {POINT_RADIUS} from "../constants";
import {Object3D, Vector3} from "three";
import {useMemo} from "react";

interface VoxelInstancedPointsProps {
  data: Point[];
  pointSegments: number;
  voxelResolution: number;
}

const gridScale = 1001;

// re-use for instance computations
//const scratchColor = new THREE.Color();


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

export const VoxelInstancedPoints = (props: VoxelInstancedPointsProps) => {
  const { data, pointSegments, voxelResolution } = props;

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

  // re-use for instance computations
  const scratchObject3D = useMemo(() => new Object3D(), []);

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
          mesh.geometry.boundingSphere.radius = Math.max(mesh.geometry.boundingSphere.radius, POINT_RADIUS);
          //console.log(points);
          //console.log(mesh.geometry.boundingSphere);
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
  }, [voxels, scratchObject3D]);

  return (
    <>
        {voxels.map((voxel, index) =>
          voxel.length > 0
            ? <instancedMesh
                key={index}
                userData={{voxelId: index}}
                ref={(mesh : THREE.InstancedMesh) => meshRefs.current[index] = mesh}
                args={[
                  // TODO sort out the bugged typing here.
                  // Ref: https://spectrum.chat/react-three-fiber/general/instancedmesh-gone-on-rerender-in-typescript~35e4d145-517f-4b81-b0c7-ab89e02bd72f
                  (null as unknown) as THREE.BufferGeometry,
                  (null as unknown) as THREE.Material,
                  voxel.length
                ]}
            >
                <sphereBufferGeometry
                    attach="geometry"
                    args={[POINT_RADIUS, pointSegments, pointSegments]}
                    key={pointSegments}
                >
                  {/*<instancedBufferAttribute
                        ref={colorAttrib}
                        attachObject={["attributes", "color"]}
                        args={[colorArray, 3]}
                    /> */}
                </sphereBufferGeometry>
              <meshStandardMaterial attach="material"/>
            </instancedMesh>
            : null
        )}
      )}
    </>
  );
};
