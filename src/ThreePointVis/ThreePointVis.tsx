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

export type SelectedPoints = Point[];
export type SelectedIds = number[];
export type SelectHandler = (
  point: SelectedPoints | ((prevVar: SelectedPoints) => SelectedPoints)
) => void;

interface ThreePointVisProps {
  data: Point[];
  clusters: Cluster[];
  selectedPoints: SelectedPoints;
  onSelect: SelectHandler;
  pointResolution: number;
  voxelResolution: number;
  debugVoxels?: boolean;
  usePerPointLighting?: boolean;
}

export const ThreePointVis = memo((props: ThreePointVisProps) => {
  const { data, selectedPoints, clusters, onSelect, pointResolution,
    voxelResolution, debugVoxels, usePerPointLighting } = props;

  const selectedPointVectors = selectedPoints.map(point => new Vector3(point.x, point.y, point.z));
  const selectedBoundingSphere = new THREE.Sphere().setFromPoints(selectedPointVectors);
  selectedBoundingSphere.radius = Math.max(selectedBoundingSphere.radius, 1);

    const cameraTarget =
      selectedPoints.length > 0
      ? selectedBoundingSphere.center
      : null;

  const cameraPosition =
    selectedPoints.length > 0
      ? selectedBoundingSphere.center
      : null;

  const { width } = useWindowSize();

  const selectedPointRes = useMemo(() => Math.min(pointResolution*4, MAX_POINT_RES), [pointResolution]);

  const renderSelectedPoints = selectedPoints.map(
      function(point) {
          return(
            <group
              key={point.id}
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
            {usePerPointLighting &&
              <pointLight
                  distance={10 * SCALE_FACTOR}
                  position={[0, 0, 0]}
                  intensity={1.9}
                  decay={1}
                  color={SELECTED_COLOR}
              />
            }
          </group>)
      }

  )


  return (
      <>
        <Controls target={cameraTarget} position={cameraPosition} distance={selectedBoundingSphere.radius}/>
        <ambientLight color="#ffffff" intensity={0.1}/>
        <hemisphereLight
            color="#ffffff"
            skyColor={new THREE.Color("#ffffff")}
            groundColor={new THREE.Color("#080808")}
            intensity={1.0}
        />
        {clusters && <ClusterHulls clusters={clusters}/>}
        {voxelResolution <= 1
          ? <InstancedPoints
            selectedPoints={selectedPoints}
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

        {selectedPoints.length > 0 && (
          <>
            {renderSelectedPoints}
            {!usePerPointLighting &&
            <pointLight
                distance={10 + selectedBoundingSphere.radius}
                position={selectedBoundingSphere.center}
                intensity={1.9}
                decay={1}
                color={SELECTED_COLOR}
            />
            }
          </>
        )}
      </>)
});
