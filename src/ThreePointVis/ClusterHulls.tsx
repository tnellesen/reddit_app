import * as React from "react";
import * as THREE from "three";
import { Cluster } from "../App";
import { clusterColors } from "../constants";

interface ClusterHullsProps {
  clusters: Cluster[];
}

export function ClusterHulls(props: ClusterHullsProps) {
  const { clusters } = props;

  return (
    <group>
      {clusters.map((cluster) => (
        <mesh
          name={`hull-${cluster.id}`}
          key={`hull-${cluster.id}`}
          visible
          //geometry={cluster.obj.geometry}
        >
          <bufferGeometry attach="geometry" {...cluster.obj.geometry} />
          <meshBasicMaterial
            attach="material"
            opacity={0.05}
            transparent
            //emissive={emissive}
            //emissiveIntensity={1}
            side={THREE.DoubleSide}
            color={clusterColors[cluster.id]}
          />
        </mesh>
      ))}
    </group>
  );
}
