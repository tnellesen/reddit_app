import * as React from 'react';
import { extend, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import useEventListener from '@use-it/event-listener';
import * as THREE from 'three';
import { memo } from 'react';

interface ControlsProps {
  target: THREE.Vector3 | null;
  position: THREE.Vector3 | null;
  distance: number;
  autoTarget?: boolean;
}

extend({ OrbitControls });

const TARGET_THRESHOLD = 0.1;
const TARGET_THRESHOLD_MULTIPLIER = 200;
const POSITION_THRESHOLD_OFFSET = 11;
const POSITION_THRESHOLD_SCALER = 1.04;
const ANIMATION_SPEED = 5;

const origin = new THREE.Vector3(0, 0, 0);

const hasCameraChanged = (prevProps: ControlsProps, nextProps: ControlsProps):
  boolean => (prevProps.distance === nextProps.distance
    && prevProps.position && nextProps.position
    && prevProps.target && nextProps.target
    && prevProps.position.equals(nextProps.position)
    && prevProps.target.equals(nextProps.target)) || false;

export const Controls = memo((props: ControlsProps) => {
  const {
    target, position, distance, autoTarget,
  } = props;

  const cameraDistance = POSITION_THRESHOLD_OFFSET + POSITION_THRESHOLD_SCALER * distance;

  const controls = React.useRef<OrbitControls>();

  const { camera, gl } = useThree();

  const keyPressed: { [key: string]: number } = {};

  let targetAnimationComplete = !autoTarget;
  let positionAnimationComplete = !autoTarget;

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
    if (!targetAnimationComplete
      && target
      && internalTarget.distanceTo(target) > TARGET_THRESHOLD) {
      internalTarget.lerp(target, ANIMATION_SPEED * delta);
    } else {
      targetAnimationComplete = true;
    }

    if (
      !positionAnimationComplete
      && position
      && target
      && internalTarget.distanceTo(target)
        < TARGET_THRESHOLD * TARGET_THRESHOLD_MULTIPLIER
      && internalPosition.distanceTo(position) > cameraDistance

    ) {
      internalPosition.lerp(position, ANIMATION_SPEED * delta);
    } else if (!positionAnimationComplete && position && internalPosition.distanceTo(position) < cameraDistance) {
      internalPosition.sub(position).setLength(cameraDistance).add(position);
      positionAnimationComplete = true;
    }

    // move camera according to key pressed
    Object.entries(keyPressed).forEach((e) => {
      const [key, start] = e;
      const duration = new Date().getTime() - start;

      const xAxis = new THREE.Vector3(1, 0, 0);
      const zAxis = new THREE.Vector3(0, 0, 1);

      // increase momentum if key pressed longer
      let momentum = Math.sqrt(duration + 200) * 0.01 + 0.05;

      // adjust for actual time passed
      momentum = (momentum * delta) / 0.008;

      switch (key) {
        case 'w':
          camera.translateOnAxis(zAxis, -momentum);
          break;
        case 's':
          camera.translateOnAxis(zAxis, momentum);
          break;
        case 'd':
          camera.translateOnAxis(xAxis, momentum);
          break;
        case 'a':
          camera.translateOnAxis(xAxis, -momentum);
          break;
        default:
      }
    });

    controls.current!.update();
  });

  useEventListener('keydown', handleKeyDown);
  useEventListener('keyup', handleKeyUp);

  return (
    <orbitControls
      ref={controls}
      args={[camera, gl.domElement]}
      dampingFactor={0.1}
      enableDamping
    />
  );
}, hasCameraChanged);

Controls.displayName = 'Controls';
