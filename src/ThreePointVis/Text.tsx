// reference: https://codesandbox.io/s/react-three-fiber-hud-water-fxaa-42ocf?file=/src/index.js:279-1471
import * as React from 'react';
import { useMemo } from 'react';
import { Vector2 } from 'three';
import { SCALE_FACTOR, SELECTED_COLOR } from '../constants';

export enum Position {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM'
}

export interface TextProps {
  message: string;
  x: number;
  y: number;
  z: number;
  position?: Position;
}

export function Text(props: TextProps) {
  const {
    message, x, y, z, position = Position.LEFT,
  } = props;

  const width = (21 + 7 * message.length) * SCALE_FACTOR;
  const height = 25 * SCALE_FACTOR;
  const resolutionScaleFactor = 20;

  const textCanvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = width * resolutionScaleFactor;
    canvas.height = height * resolutionScaleFactor;
    context?.scale(resolutionScaleFactor, resolutionScaleFactor);

    context!.fillStyle = SELECTED_COLOR;
    context?.fillRect(0, 0, width, height);

    const fontSize = 12;
    context!.font = `bold ${fontSize}px monaco, monospace, sans-serif`;
    context!.fillStyle = 'black';
    context!.textAlign = 'center';
    context!.textBaseline = 'middle';
    context?.fillText(message, width / 2, height / 2);
    return canvas;
  }, [message, width, height]);

  const center = new Vector2(0.5, 0.5);

  switch (position) {
    case Position.LEFT:
      center.x = 1 + 1.01 / message.length;
      break;
    case Position.RIGHT:
      center.x = -1.01 / message.length;
      break;
    case Position.TOP:
      center.y = -0.5;
      break;
    case Position.BOTTOM:
    default:
      center.y = 1.6;
      break;
  }

  return (
    <>
      <sprite
        scale={[width / resolutionScaleFactor, height / resolutionScaleFactor, 1]}
        position={[x, y, z]}
        renderOrder={1}
        center={center}
      >
        <spriteMaterial attach="material" transparent depthTest={false} opacity={0.19}>
          <canvasTexture attach="map" key={message} image={textCanvas} />
        </spriteMaterial>
      </sprite>
      <sprite
        scale={[width / resolutionScaleFactor, height / resolutionScaleFactor, 1]}
        position={[x, y, z]}
        center={center}
      >
        <spriteMaterial attach="material" transparent={false}>
          <canvasTexture attach="map" key={message} image={textCanvas} />
        </spriteMaterial>
      </sprite>
    </>
  );
}
