//reference: https://codesandbox.io/s/react-three-fiber-hud-water-fxaa-42ocf?file=/src/index.js:279-1471
import * as React from "react";
import { useMemo } from "react";
import { SCALE_FACTOR } from "../constants";
import {Vector2} from "three";

export enum Position {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  TOP = "TOP",
  BOTTOM = "BOTTOM"
}

export interface TextProps {
  message: string;
  x: number;
  y: number;
  z: number;
  position?: Position;
}

export function Text(props: TextProps) {
  const { message, x, y, z, position = Position.LEFT } = props;

  let width = (30 + 6.5 * message.length) * SCALE_FACTOR;
  let height = 25 * SCALE_FACTOR;
  const resolutionScaleFactor = 20;

  const textCanvas = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = width * resolutionScaleFactor;
    canvas.height = height * resolutionScaleFactor;
    context?.scale(resolutionScaleFactor, resolutionScaleFactor);

    context!.fillStyle = "#bada55";
    context?.fillRect(0, 0, width, height);

    const fontSize = 12;
    context!.font = `bold ${fontSize}px Arial, sans-serif`;
    context!.fillStyle = "black";
    context!.textAlign = "center";
    context!.textBaseline = "middle";
    context?.fillText(message, width/2, height/2);
    return canvas;
  }, [message, width, height, position]);

  const offset = 0.11;
  let center = new Vector2(0.5, 0.5);
  let offCenter = new Vector2(0.5, 0.5);

  switch (position) {
    case Position.LEFT:
      center.x = 1 + 1.01/message.length;
      offCenter.x = center.x + offset;
      break;
    case Position.RIGHT:
      center.x = -1.01/message.length;
      offCenter.x = center.x - offset;
      break;
    case Position.TOP:
      center.y = -0.5;
      offCenter.y = center.y - offset;
      break;
    case Position.BOTTOM:
      center.y = 1.6
      offCenter.y = center.x + offset;
      break;
  }

  const offSetVector = center.clone().sub(offCenter);

  return (
    <>
      {<sprite
        scale={[width / resolutionScaleFactor, height / resolutionScaleFactor, 1]}
        position={[x, y, z]}
        renderOrder={1}
        center={offCenter}
      >
        <spriteMaterial attach="material" transparent={true} depthTest={false} opacity={0.19}>
          <canvasTexture attach="map" key={message} image={textCanvas} offset={offSetVector}  />
        </spriteMaterial>
      </sprite>}
      <sprite
        scale={[width / resolutionScaleFactor, height / resolutionScaleFactor, 1]}
        position={[x, y, z]}
        center={center}
      >
        <spriteMaterial attach="material" transparent={false}>
          <canvasTexture attach="map" key={message} image={textCanvas}  />
        </spriteMaterial>
      </sprite>
    </>
  );
}
