import * as React from 'react';
import * as THREE from 'three';
import { memo, useMemo } from 'react';
import { Color, Vector3 } from 'three';
import { Controls } from './Controls';
import { InstancedPoints } from './InstancedPoints';
import { Text, Position } from './Text';
import { Point } from '../App';
import { useWindowSize } from '../ViewportHooks';
import { VoxelInstancedPoints } from './VoxelInstancedPoints';
import { ClusterHullsProps } from './ClusterHulls';
import {
  MAX_POINT_RES, MOBILE_THRESHOLD_WIDTH, POINT_RADIUS, SCALE_FACTOR, SELECTED_COLOR,
} from '../constants';

export type SelectedPoints = Point[];
export type SelectedIds = number[];
export type SelectHandler = (
  point: number, isMultiSelect: boolean) => void;

interface ThreePointVisProps {
  data: Point[];
  clusters: React.ReactElement<ClusterHullsProps> | null;
  selectedPoints: SelectedPoints;
  pointResolution: number;
  voxelResolution: number;
  debugVoxels?: boolean;
  usePerPointLighting?: boolean;
  isAutoCamera?: boolean;
}

export const ThreePointVis = memo((props: ThreePointVisProps) => {
  const {
    data, selectedPoints, clusters, pointResolution,
    voxelResolution, debugVoxels, usePerPointLighting, isAutoCamera,
  } = props;

  const selectedPointVectors = useMemo(() =>
    selectedPoints.map((point) => new Vector3(point.x, point.y, point.z)), [selectedPoints]);
  const selectedBoundingSphere = useMemo(() =>
    new THREE.Sphere().setFromPoints(selectedPointVectors), [selectedPointVectors]);
  selectedBoundingSphere.radius = Math.max(selectedBoundingSphere.radius, 1);

  const cameraTarget = selectedPoints.length > 0
    ? selectedBoundingSphere.center
    : null;

  const cameraPosition = selectedPoints.length > 0
    ? selectedBoundingSphere.center
    : null;

  const { width } = useWindowSize();

  const selectedPointRes = useMemo(() => Math.min(pointResolution * 4, MAX_POINT_RES), [pointResolution]);

  const renderSelectedPoints = useMemo(() => selectedPoints.map(
    (point) => (
      <group
        key={point.id}
        position={[
          point.x,
          point.y,
          point.z,
        ]}
      >
        <Text
          message={point.subreddit}
          x={0}
          y={0}
          z={0}
          position={width < MOBILE_THRESHOLD_WIDTH ? Position.BOTTOM : Position.RIGHT}
        />
        <mesh renderOrder={2}>
          <sphereBufferGeometry
            attach="geometry"
            args={[POINT_RADIUS * 1.02, selectedPointRes, selectedPointRes]}
          />
          <meshLambertMaterial
            attach="material"
            transparent
            emissive={new Color(SELECTED_COLOR)}
            emissiveIntensity={1}
            depthTest={false}
            opacity={0.19}
            color={SELECTED_COLOR}
          />
        </mesh>
        <mesh renderOrder={5}>
          <sphereBufferGeometry
            attach="geometry"
            args={[POINT_RADIUS * 1.02, selectedPointRes, selectedPointRes]}
          />
          <meshLambertMaterial
            attach="material"
            transparent
            color={SELECTED_COLOR}
          />
        </mesh>
        {usePerPointLighting
              && (
              <pointLight
                distance={10 * SCALE_FACTOR}
                position={[0, 0, 0]}
                intensity={1.9}
                decay={1}
                color={SELECTED_COLOR}
              />
              )}
      </group>
    ),
  ), [selectedPointRes, selectedPoints, usePerPointLighting, width]);

  return (
    <>
      <Controls
        target={cameraTarget}
        position={cameraPosition}
        distance={selectedBoundingSphere.radius}
        autoTarget={isAutoCamera}
      />
      <ambientLight color="#ffffff" intensity={0.1} />
      <hemisphereLight
        color="#ffffff"
        groundColor={new THREE.Color('#080808')}
        intensity={1.0}
      />
      {clusters}
      {voxelResolution <= 1
        ? (
          <InstancedPoints
            data={data}
            enableCulling
            pointSegments={pointResolution}
          />
        )
        : (
          <VoxelInstancedPoints
            data={data}
            pointSegments={pointResolution}
            voxelResolution={voxelResolution}
            debugVoxels={debugVoxels}
          />
        )}

      {selectedPoints.length > 0 && (
      <>
        {renderSelectedPoints}
        {!usePerPointLighting
            && (
            <pointLight
              distance={10 + selectedBoundingSphere.radius}
              position={selectedBoundingSphere.center}
              intensity={1.9}
              decay={1}
              color={SELECTED_COLOR}
            />
            )}
      </>
      )}
    </>
  );
});
