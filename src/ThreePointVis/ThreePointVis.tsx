import * as React from "react";
import * as THREE from "three";
import { Controls } from "./Controls";
import { InstancedPoints } from "./InstancedPoints";
import { Text, Position } from "./Text";
import { Cluster, Point } from "../App";
import { useWindowSize} from "../ViewportHooks"
import {VoxelInstancedPoints} from "./VoxelInstancedPoints";
import {ClusterHulls} from "./ClusterHulls";
import {MAX_POINT_RES, POINT_RADIUS, SCALE_FACTOR, SELECTED_COLOR} from "../constants";
import {memo, useMemo} from "react";
import {Color} from "three";

export type SelectedId = number | null;
export type SelectHandler = (
  index: SelectedId | ((prevVar: SelectedId) => SelectedId)
) => void;

interface ThreePointVisProps {
  data: Point[];
  clusters: Cluster[];
  selectedId: SelectedId;
  onSelect: SelectHandler;
  pointResolution: number;
  voxelResolution: number;
  debugVoxels?: boolean;
}

export const ThreePointVis = memo((props: ThreePointVisProps) => {
  const { data, selectedId, clusters, onSelect, pointResolution, voxelResolution, debugVoxels } = props;



  const selected =
    selectedId !== null && data[selectedId].include ? data[selectedId] : null;

  const cameraTarget =
    selected !== null
      ? new THREE.Vector3(selected.x, selected.y, selected.z)
      : null;

  const cameraPosition =
    selected !== null
      ? new THREE.Vector3(selected.x, selected.y, selected.z)
      : null;

  const { width } = useWindowSize();

  const selectedPointRes = useMemo(() => Math.min(pointResolution*4, MAX_POINT_RES), [pointResolution]);
    
  return (
      <>
        <Controls target={cameraTarget} position={cameraPosition}/>
        <ambientLight color="#ffffff" intensity={0.1}/>
        <hemisphereLight
            color="#ffffff"
            skyColor={new THREE.Color("#ffffbb")}
            groundColor={new THREE.Color("#080820")}
            intensity={1.0}
        />
        {clusters && <ClusterHulls clusters={clusters}/>}
        {voxelResolution <= 1
          ? <InstancedPoints
            selectedId={selectedId}
            onSelect={onSelect}
            data={data}
            enableCulling
            pointSegments={pointResolution}
          />
          : <VoxelInstancedPoints
            data={data}
            pointSegments={pointResolution}
            voxelResolution={voxelResolution}
            debugVoxels={debugVoxels}
          />}

        {selected !== null && (
          <group
            position={[
              selected.x,
              selected.y,
              selected.z
            ]}
          >
            <Text
              message={selected.subreddit}
              x={0}
              y={0}
              z={0}
              position={width < 500 ? Position.BOTTOM : Position.RIGHT}
            />
            <mesh renderOrder={2}>
              <sphereBufferGeometry
                attach="geometry"
                args={[POINT_RADIUS*1.02, selectedPointRes, selectedPointRes]}
              />
              <meshLambertMaterial attach="material"
                                    transparent={true}
                                    emissive={new Color(SELECTED_COLOR)}
                                    emissiveIntensity={1} depthTest={false} opacity={0.19} color={SELECTED_COLOR}/>
            </mesh>
            <mesh renderOrder={5}>
              <sphereBufferGeometry
                attach="geometry"
                args={[POINT_RADIUS*1.02, selectedPointRes, selectedPointRes]}
              />
              <meshLambertMaterial attach="material"
                                   transparent={true}
                                   color={SELECTED_COLOR}/>
            </mesh>


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
          </group>)}
      </>)
});
