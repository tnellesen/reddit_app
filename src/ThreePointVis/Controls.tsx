import * as React from "react";
import { extend, useThree, useFrame } from "react-three-fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import useEventListener from "@use-it/event-listener";
import * as THREE from "three";
//import { useState } from "react";
import { SCALE_FACTOR } from "../constants";
import {memo} from "react";

interface ControlsProps {
  target: THREE.Vector3 | null;
  position: THREE.Vector3 | null;
}

extend({ OrbitControls });

const TARGET_THRESHOLD = 0.1 * SCALE_FACTOR;
const TARGET_THRESHOLD_MULTIPLIER = 200;
const POSITION_THRESHOLD = 12 * SCALE_FACTOR;
const ANIMATION_SPEED = 5;

const origin = new THREE.Vector3(0, 0, 0);

export const Controls = memo((props: ControlsProps) => {
  const { target, position } = props;

  const controls = React.useRef<OrbitControls>();

  const { camera, gl } = useThree();

  const keyPressed: { [key: string]: number } = {};

  let targetAnimationComplete = false;
  let positionAnimationComplete = false;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!keyPressed[event.key]) {
      keyPressed[event.key] = new Date().getTime();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    delete keyPressed[event.key];
  };

  // Reference: httpwdwdawds://maxrohde.com/2019/10/25/camera-movement-with-three-js/
  useFrame((_, delta) => {
    const internalTarget = controls.current?.target || origin;
    const internalPosition = camera.position;

    // interpolate target
    if ( !targetAnimationComplete
      && target
      && internalTarget.distanceTo(target) > TARGET_THRESHOLD) {
      internalTarget.lerp(target, ANIMATION_SPEED * delta);
    }
    else {
      targetAnimationComplete = true;
    }

    if (
      !positionAnimationComplete
      && position
      && target
      && internalTarget.distanceTo(target) <
        TARGET_THRESHOLD * TARGET_THRESHOLD_MULTIPLIER
      && internalPosition.distanceTo(position) > POSITION_THRESHOLD

    ) {
      internalPosition.lerp(position, ANIMATION_SPEED * delta);
    }
    else if (!positionAnimationComplete && position && internalPosition.distanceTo(position) < POSITION_THRESHOLD) {
      internalPosition.sub(position).setLength(POSITION_THRESHOLD).add(position);
      positionAnimationComplete = true;
    }

    // move camera according to key pressed
    Object.entries(keyPressed).forEach((e) => {
      const [key, start] = e;
      const duration = new Date().getTime() - start;

      var xAxis = new THREE.Vector3(1, 0, 0);
      var zAxis = new THREE.Vector3(0, 0, 1);

      // increase momentum if key pressed longer
      let momentum = Math.sqrt(duration + 200) * 0.01 + 0.05;

      // adjust for actual time passed
      momentum = (momentum * delta) / 0.008;

      switch (key) {
        case "w":
          camera.translateOnAxis(zAxis, -momentum);
          break;
        case "s":
          camera.translateOnAxis(zAxis, momentum);
          break;
        case "d":
          camera.translateOnAxis(xAxis, momentum);
          break;
        case "a":
          camera.translateOnAxis(xAxis, -momentum);
          break;
        default:
      }
    });

    controls.current!.update();
  });

  useEventListener("keydown", handleKeyDown);
  useEventListener("keyup", handleKeyUp);

  /*
  const testFactor = viewport.factor / 20;
  console.log("Factor: " + viewport.factor);
  console.log("Width: " + viewport.width);
  console.log("scale: " + testFactor);
  */

  return (
    <orbitControls
      ref={controls}
      args={[camera, gl.domElement]}
      dampingFactor={0.1}
      enableDamping
    />
  );
});
