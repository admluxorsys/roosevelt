
// src/components/CustomEdge.tsx
import React from 'react';
import { getBezierPath, EdgeProps } from 'reactflow';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Esta es la línea invisible que facilita la selección */}
      <path
        id={`${id}_interaction`}
        style={{ ...style, stroke: 'transparent', strokeWidth: 20 }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      {/* Esta es la línea visible que el usuario ve */}
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : 1.5,
          stroke: selected ? '#6d28d9' : '#4b5563',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
    </>
  );
}

