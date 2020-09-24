import * as React from "react";
import {WebGLRenderer} from "three";

interface DebugStatsProps {
  gl: WebGLRenderer
}


// Based on: https://github.com/jeromeetienne/threex.rendererstats
export const DebugStats = (props: DebugStatsProps) => {
  const {gl} = props;
  
  let geometries = gl?.info.memory.geometries
  let textures = gl?.info.memory.textures
  let calls = gl?.info.render.calls
  let triangles = gl?.info.render.triangles

  return (
    <>
      <div> Geometries: {geometries} </div>
      <div> Textures: {textures} </div>
      <div> Calls: {calls} </div>
      <div> Triangles: {triangles} </div>
    </>
  );
};
