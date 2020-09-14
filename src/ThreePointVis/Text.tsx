//reference: https://codesandbox.io/s/react-three-fiber-hud-water-fxaa-42ocf?file=/src/index.js:279-1471
import * as React from "react";
import { useMemo } from "react";
import { SCALE_FACTOR } from "../constants";

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

  let width = 80 + 12 * message.length * SCALE_FACTOR;
  let height = 69 * SCALE_FACTOR;
  const resolutionScaleFactor = 20;

  const textCanvas = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = width * resolutionScaleFactor;
    canvas.height = height * resolutionScaleFactor;
    context?.scale(resolutionScaleFactor, resolutionScaleFactor);

    let xStart = 0;
    let yStart = 0;
    let yEnd = 0;
    let textBaseline: CanvasTextBaseline = "middle";

    switch (position) {
      case Position.LEFT:
        yStart = height / 2;
        break;
      case Position.RIGHT:
        xStart = width / 2;
        yStart = height / 2;
        break;
      case Position.TOP:
        xStart = width / 2;
        yStart = 0;
        textBaseline = "top";
        break;
      case Position.BOTTOM:
        xStart = width / 2;
        yStart = height / 1.5;
        yEnd = height;
        textBaseline = "bottom";
        break;
    }

    context!.fillStyle = "#bada55";
    if (position === Position.LEFT || position === Position.RIGHT) {
      context?.fillRect(xStart, yStart / 2, width / 2, height / 2);
    } else {
      context?.fillRect(xStart / 2, yStart, width / 2, height / 2.5);
    }

    const fontSize = 12;
    context!.font = `bold ${fontSize}px Arial, sans-serif`;
    context!.fillStyle = "black";
    context!.textAlign = "center";
    context!.textBaseline = textBaseline;
    if (position === Position.LEFT || position === Position.RIGHT) {
      const offset = position === Position.LEFT ? width / 4.5 - 2 : width / 3.5;
      context?.fillText(message, xStart + offset, yStart);
    } else {
      context?.fillText(message, xStart, yEnd);
    }
    return canvas;
  }, [message, width, height, position]);

  return (
    <sprite
      scale={[width / resolutionScaleFactor, height / resolutionScaleFactor, 1]}
      position={[x, y, z]}
    >
      <spriteMaterial attach="material">
        <canvasTexture attach="map" key={message} image={textCanvas} />
      </spriteMaterial>
    </sprite>
  );
}
