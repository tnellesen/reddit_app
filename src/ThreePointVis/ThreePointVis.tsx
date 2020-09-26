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
import {Color, Vector3} from "three";

export type SelectedIds = number[];
export type SelectHandler = (
  index: SelectedIds | ((prevVar: SelectedIds) => SelectedIds)
) => void;

interface ThreePointVisProps {
  data: Point[];
  clusters: Cluster[];
  selectedIds: SelectedIds;
  onSelect: SelectHandler;
  pointResolution: number;
  voxelResolution: number;
  debugVoxels?: boolean;
}

export const ThreePointVis = memo((props: ThreePointVisProps) => {
  const { data, selectedIds, clusters, onSelect, pointResolution, voxelResolution, debugVoxels } = props;


  const selected =
    selectedIds.length > 0 &&
    data.filter(point => selectedIds.includes(point.id)).filter(point => point.include).length > 0
        ? data.filter(point => selectedIds.includes(point.id))
        : [];

  const selectedPoints = selectedIds.map(id => new Vector3(data[id].x, data[id].y, data[id].z));
  const selectedBoundingSphere = new THREE.Sphere().setFromPoints(selectedPoints);
  selectedBoundingSphere.radius = Math.max(selectedBoundingSphere.radius, 1);

    const cameraTarget =
    selected.length > 0
      ? selectedBoundingSphere.center
      : null;

  const cameraPosition =
    selected.length > 0
      ? selectedBoundingSphere.center
      : null;

  const { width } = useWindowSize();

  const selectedPointRes = useMemo(() => Math.min(pointResolution*4, MAX_POINT_RES), [pointResolution]);

  console.log(selected);

  const renderSelectedPoints = selected.map(
      function(point) {
          return(<group
              position={[
                  point.x,
                  point.y,
                  point.z
              ]}
          >
              <Text
                  message={point.subreddit}
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
          </group>)
      }

  )


  return (
      <>
        <Controls target={cameraTarget} position={cameraPosition} distance={selectedBoundingSphere.radius}/>
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
            selectedIds={selectedIds}
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

        {selected.length > 0 && (
            renderSelectedPoints
        )}
      </>)
});
