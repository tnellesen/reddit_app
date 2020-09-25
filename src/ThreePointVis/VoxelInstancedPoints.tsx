import * as React from "react";
import * as THREE from "three";
import { Point } from "../App";
import {clusterColors, POINT_RADIUS} from "../constants";
import {InstancedBufferAttribute, MeshStandardMaterial, Object3D, Vector3} from "three";
import {memo, useMemo} from "react";

interface VoxelInstancedPointsProps {
  data: Point[];
  pointSegments: number;
  voxelResolution: number;
}

const gridScale = 1001;
const scratchColor = new THREE.Color( 0xff0000);

const updateColors = (
  points: Point[],
  colorArray: Float32Array,
  colorAttrib: InstancedBufferAttribute
) => {
  for (let i = 0; i < points.length; ++i) {
    const point = points[i];
    scratchColor.set(
      clusterColors[point.cluster]
    );
    scratchColor.toArray(colorArray, i * 3);
  }
  if (colorAttrib) {
    colorAttrib.needsUpdate = true;
  }
};



export const VoxelInstancedPoints = memo((props: VoxelInstancedPointsProps) => {
  const { data, pointSegments, voxelResolution } = props;

  const [voxels, setVoxels] = React.useState<Point[][]>([]);

  // re-use for instance computations
  const meshRefs = React.useRef<THREE.InstancedMesh[]>([]);
  let colorAttribs = React.useRef<THREE.InstancedBufferAttribute[]>([]);
  let colorArrays: Float32Array[] = [];
  for (let i = 0; i < voxels.length; i++) {
    colorArrays[i] = new Float32Array(voxels[i].length * 3);
  }

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
      if(point.include) {
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
      }
    })
    setVoxels(newVoxels);
  }, [data, voxelResolution]);

  // re-use for instance computations
  const scratchObject3D = useMemo(() => new Object3D(), []);
  const sharedMaterial = useMemo(() => new MeshStandardMaterial({vertexColors: true}), []);

  React.useEffect(() => {
    let numEmptyVoxels = 0;
    for (let i = 0; i < voxels.length; ++i) {
      const voxel = voxels[i];
      if (voxel.length > 0) {
        const mesh = meshRefs.current[i];
        const points = voxel.map(p => new Vector3(p.x, p.y, p.z));

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
          mesh.instanceMatrix.needsUpdate = true;
          mesh.frustumCulled = true;
          updateColors(
            voxel,
            colorArrays[i],
            colorAttribs.current[i]
          )
        }
      }
      else {
       numEmptyVoxels++;
     }
    }
    console.log("Total Voxels: ", voxels.length);
    console.log("Empty Voxels: ", numEmptyVoxels);
    console.log("Percent Empty Voxels ", (numEmptyVoxels/voxels.length) * 100);
  }, [voxels, scratchObject3D, colorArrays]);

  return (
    <>
        {voxels.map((voxel, index) =>
          voxel.length > 0
            ? <instancedMesh
                key={`${index} ${voxel.length}`}
                ref={(mesh: THREE.InstancedMesh) => meshRefs.current[index] = mesh}
                args={[
                  // TODO sort out the bugged typing here.
                  // Ref: https://spectrum.chat/react-three-fiber/general/instancedmesh-gone-on-rerender-in-typescript~35e4d145-517f-4b81-b0c7-ab89e02bd72f
                  (null as unknown) as THREE.BufferGeometry,
                  (null as unknown) as THREE.Material,
                  voxel.length
                ]}
                material={sharedMaterial}
            >
                <sphereBufferGeometry
                    attach="geometry"
                    args={[POINT_RADIUS, pointSegments, pointSegments]}
                    key={pointSegments}
                >
                  {<instancedBufferAttribute
                        name={`color - voxel ${index}`}
                        ref={(colorAttrib: THREE.InstancedBufferAttribute) => colorAttribs.current[index] = colorAttrib}
                        attachObject={["attributes", "color"]}
                        args={[colorArrays[index], 3]}
                    />}
                </sphereBufferGeometry>
            </instancedMesh>
            : null
        )}
      )}
    </>
  );
});
