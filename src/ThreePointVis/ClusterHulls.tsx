import * as React from 'react';
import * as THREE from 'three';
import useAxios from 'axios-hooks';
import { useMemo } from 'react';
import {
  BoxBufferGeometry, Group, Mesh, MeshBasicMaterial, Object3D,
} from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { clusterColors, MAX_DATA_CACHE_AGE_SECONDS } from '../constants';
import { Cluster } from '../App';

export interface ClusterHullsProps {
  dataSet: string;
  pointCount: number;
  clusterCount: number;
}

const getMesh = (group: Group | Object3D): Mesh => {
  for (let i = 0; i < group.children.length; i++) {
    const child = group.children[i];
    if (child instanceof Mesh) {
      return child;
    }
    if (child.children.length) {
      return getMesh(child);
    }
  }
  // return error mesh
  const geometry = new BoxBufferGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({ color: 0xffff00 });
  return new Mesh(geometry, material);
};

const loader = new OBJLoader();

export function ClusterHulls(props: ClusterHullsProps) {
  const { dataSet, pointCount, clusterCount } = props;

  const [{ data, loading }] = useAxios({
    url: `https://redditexplorer.com/GetClusterMeshes/dataset:${dataSet},n_points:${pointCount},n_clusters:${clusterCount}`,
    headers: { 'Cache-Control': `max-age=${MAX_DATA_CACHE_AGE_SECONDS}`, pragma: '' },
  });

  const clusters: Cluster[] = useMemo(() => (data
    ? data.map(
      (cluster: any): Cluster => ({
        id: cluster.id,
        obj: getMesh(loader.parse(cluster.obj)),
      }),
    )
    : []), [data]);

  return (
    !loading ? (
      <group>
        {clusters.map((cluster) => (
          <mesh
            name={`hull-${cluster.id}`}
            key={`hull-${cluster.id}`}
            visible
          >
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <bufferGeometry attach="geometry" {...cluster.obj.geometry} />
            <meshBasicMaterial
              attach="material"
              opacity={0.05}
              transparent
              // emissive={emissive}
              // emissiveIntensity={1}
              side={THREE.DoubleSide}
              color={clusterColors[cluster.id]}
            />
          </mesh>
        ))}
      </group>
    )
      : null
  );
}
