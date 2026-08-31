import React, { useState, useEffect } from 'react';
import FleetMarker from './FleetMarker';

// Renders all active fleets. A local requestAnimationFrame clock drives smooth
// contact movement (the parent's `now` only ticks once per second for the
// countdown panels); the rAF loop runs only while at least one fleet is
// actually in transit, so idle/battle-only maps incur no animation cost.
export default function FleetMarkers({ fleets, now, zoom, myUserId, myEmpireId, selectedFleetId, onSelectFleetId }) {
  const [localNow, setLocalNow] = useState(now);
  const hasMoving = fleets?.some((f) => f.status === 'in_transit');

  useEffect(() => {
    if (!hasMoving) return;
    let raf;
    const loop = () => { setLocalNow(Date.now()); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hasMoving]);

  if (!fleets?.length) return null;
  const anySelected = !!selectedFleetId;

  return (
    <g>
      {fleets.map((f) => (
        <FleetMarker
          key={f.id}
          fleet={f}
          now={localNow}
          zoom={zoom}
          myUserId={myUserId}
          myEmpireId={myEmpireId}
          selected={selectedFleetId === f.id}
          anySelected={anySelected}
          onSelect={onSelectFleetId}
        />
      ))}
    </g>
  );
}