/* eslint-disable */

import { ReactThreeFiber } from "react-three-fiber";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      trackballControls: ReactThreeFiber.Object3DNode<
        TrackballControls,
        typeof TrackballControls
      >;
      orbitControls: ReactThreeFiber.Object3DNode<
        OrbitControls,
        typeof OrbitControls
      >;
      effectComposer: ReactThreeFiber.Object3DNode<
        EffectComposer,
        typeof EffectComposer
      >;
      unrealBloomPass: ReactThreeFiber.Object3DNode<
        UnrealBloomPass,
        typeof UnrealBloomPass
      >;
      shaderPass: ReactThreeFiber.Object3DNode<ShaderPass, typeof ShaderPass>;
      renderPass: ReactThreeFiber.Object3DNode<RenderPass, typeof RenderPass>;
    }
  }
}
