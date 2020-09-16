import * as React from "react";
import { extend, useThree, useFrame } from "react-three-fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import useEventListener from "@use-it/event-listener";
import * as THREE from "three";
import { useState } from "react";
import { SCALE_FACTOR } from "../constants";

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

export const Controls = (props: ControlsProps) => {
  const { target, position } = props;

  const [internalTarget, setInternalTarget] = useState(origin);
  const [internalPosition, setInternalPosition] = useState(origin);

  const controls = React.useRef<OrbitControls>();

  const { camera, gl } = useThree();

  const keyPressed: { [key: string]: number } = {};

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
    controls.current!.update();

    // interpolate target
    const currentTarget = controls.current?.target || origin;
    if (target && internalTarget.distanceTo(target) > TARGET_THRESHOLD) {
      setInternalTarget(
        currentTarget.clone().lerp(target, ANIMATION_SPEED * delta)
      );
    }

    if (
      position &&
      target &&
      internalTarget.distanceTo(target) <
        TARGET_THRESHOLD * TARGET_THRESHOLD_MULTIPLIER &&
      internalPosition.distanceTo(position) > POSITION_THRESHOLD
    ) {
      const newPosition = camera.position
        .clone()
        .lerp(position, ANIMATION_SPEED * delta);
      setInternalPosition(newPosition);
      camera.position.set(newPosition.x, newPosition.y, newPosition.z);
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
  });

  // If we receive a new position prop, interpolate position
  React.useEffect(() => {
    setInternalPosition(camera.position);
  }, [position, camera.position]);

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
      target={internalTarget}
    />
  );
};
