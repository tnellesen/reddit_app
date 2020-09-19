import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { extend, useThree, useFrame } from "react-three-fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass });

export function Effects() {
  const composer = useRef<EffectComposer>();
  const { scene, gl, size, camera } = useThree();
  const aspect = useMemo(() => new THREE.Vector2(size.width, size.height), [
    size
  ]);
  useEffect(() => void composer.current!.setSize(size.width, size.height), [
    size
  ]);
  useFrame(() => composer.current ? composer.current.render() : null, 1);

  const bloom = {
    resolution: aspect,
    strength: 0.5,
    radius: 0.01,
    threshold: 0.4
  };

  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />

      <unrealBloomPass
        attachArray="passes"
        args={[bloom.resolution, bloom.strength, bloom.radius, bloom.threshold]}
      />
      <shaderPass
        attachArray="passes"
        args={[FXAAShader]}
        material-uniforms-resolution-value={[1 / size.width, 1 / size.height]}
        renderToScreen
      />
    </effectComposer>
  );
}
