import * as React from 'react';
import { WebGLRenderer } from 'three';

interface DebugStatsProps {
  gl: WebGLRenderer
}

// Based on: https://github.com/jeromeetienne/threex.rendererstats
export const DebugStats = (props: DebugStatsProps) => {
  const { gl } = props;

  const geometries = gl?.info.memory.geometries;
  const textures = gl?.info.memory.textures;
  const calls = gl?.info.render.calls;
  const triangles = gl?.info.render.triangles;

  return (
    <>
      <div>
        {' '}
        Geometries:
        {geometries}
      </div>
      <div>
        {' '}
        Textures:
        {textures}
      </div>
      <div>
        {' '}
        Calls:
        {calls}
      </div>
      <div>
        {' '}
        Triangles:
        {triangles}
      </div>
    </>
  );
};

DebugStats.displayName = 'DebugStats';
