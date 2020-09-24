import * as React from "react";
import * as THREE from "three";
import { Controls } from "./Controls";
import { InstancedPoints } from "./InstancedPoints";
import { Text, Position } from "./Text";
//import { ClusterHulls } from "./ClusterHulls"
import { Cluster, Point } from "../App";
import { useWindowSize} from "../ViewportHooks";
import {VoxelInstancedPoints} from "./VoxelInstancedPoints";
import {SCALE_FACTOR} from "../constants";

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
}

export const ThreePointVis = (props: ThreePointVisProps) => {
  const { data, selectedId, onSelect, pointResolution, voxelResolution } = props;

  const SELECTED_COLOR = "#6f6";

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
        {/*clusters && <ClusterHulls clusters={clusters}/> */}
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
          />}
        {selected !== null && (
          <Text
            message={selected.subreddit}
            x={selected.x}
            y={selected.y}
            z={selected.z}
            position={width < 500 ? Position.BOTTOM : Position.LEFT}
          />
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
          </group>)}
      </>)
};
