import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { extend, useThree, useFrame } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

extend({
  EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, BloomPass,
});

interface EffectsProps {
  useAA?: boolean;
  useStandardBloom?: boolean;
  useUnrealBloom?: boolean;
}

export function Effects(props: EffectsProps) {
  const composer = useRef<EffectComposer>();
  const {
    scene, gl, size, camera,
  } = useThree();
  const aspectScalar = 8;
  const aspect = useMemo(() => new THREE.Vector2(size.width / aspectScalar, size.height / aspectScalar), [
    size,
  ]);
  const { useAA, useStandardBloom, useUnrealBloom } = props;

  useEffect(() => composer.current!.setSize(size.width, size.height), [
    size,
  ]);
  useFrame(() => (composer.current ? composer.current.render() : null), 1);

  const unrealBloom = {
    resolution: aspect,
    strength: 0.3,
    radius: 0.02,
    threshold: 0.19,
  };

  const bloom = {
    strength: 1,
    kernelSize: 25,
    sigma: 4,
    targetResolution: 256,
  };

  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />
      { useUnrealBloom && (
      <unrealBloomPass
        attachArray="passes"
        args={[unrealBloom.resolution, unrealBloom.strength, unrealBloom.radius, unrealBloom.threshold]}
      />
      ) }
      { useStandardBloom && (
      <bloomPass
        attachArray="passes"
        args={[bloom.strength, bloom.kernelSize, bloom.sigma, bloom.targetResolution]}
      />
      ) }
      { useAA && (
      <shaderPass
        attachArray="passes"
        args={[FXAAShader]}
        material-uniforms-resolution-value={[1 / size.width, 1 / size.height]}
        renderToScreen
      />
      ) }
    </effectComposer>
  );
}
