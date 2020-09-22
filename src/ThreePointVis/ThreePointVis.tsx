import * as React from "react";
import * as THREE from "three";
import { Controls } from "./Controls";
import { Canvas } from "react-three-fiber";
import { InstancedPoints } from "./InstancedPoints";
import { Stats } from "./Stats";
import { Effects } from "./Effects";
import { Text, Position } from "./Text";
//import { ClusterHulls } from "./ClusterHulls";
import { Cluster, Point } from "../App";
import { useViewport } from "../ViewportHooks";
import { CLIP_SCALE_FACTOR } from "../constants";
import {VoxelInstancedPoints} from "./VoxelInstancedPoints";

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

  const { width, height } = useViewport();

  return (
      <Canvas camera={{position: [0, 0, 40], far: width * height * CLIP_SCALE_FACTOR}}>
        <Stats/>
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
            data={data}
            selectedId={selectedId}
            onSelect={onSelect}
            enableCulling
            pointSegments={pointResolution}
          />
          : <VoxelInstancedPoints
            data={data}
            selectedId={selectedId}
            onSelect={onSelect}
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
        <Effects/>
      </Canvas>)
};
