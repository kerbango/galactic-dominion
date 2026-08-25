import React from 'react';

const PLANET_IMAGE = "https://media.base44.com/images/public/6a8dedaa90af486a558f758e/7164f3278_generated_image.png";

export default function SpaceBackground({ dim = 0.35 }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050810]">
      {/* Planet image, covers full screen */}
      <img
        src={PLANET_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Translucent dark overlay so UI stands out while planet stays visible */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(5,8,16,${dim}) 0%, rgba(5,8,16,${Math.min(dim + 0.15, 0.85)}) 60%, rgba(5,8,16,${Math.min(dim + 0.3, 0.95)}) 100%)`,
        }}
      />
      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 240px 80px rgba(0,0,0,0.6)' }}
      />
    </div>
  );
}