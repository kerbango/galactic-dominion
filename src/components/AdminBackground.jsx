import React from 'react';
import { Image } from '@/components/ui/image';

const ADMIN_BG_URL = 'https://media.base44.com/images/public/6a8dedaa90af486a558f758e/5afc908da_ChatGPTImageAug25202606_13_55PM.png';

// Cybernetic-eye backdrop used on the admin login and admin section.
export default function AdminBackground({ dim = 0.45 }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      <Image
        src={ADMIN_BG_URL}
        alt=""
        fittingType="fill"
        className="absolute inset-0 w-full h-full"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(10,10,10,${dim}) 0%, rgba(10,10,10,${Math.min(dim + 0.2, 0.9)}) 60%, rgba(10,10,10,${Math.min(dim + 0.35, 0.97)}) 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 240px 80px rgba(0,0,0,0.65)' }}
      />
    </div>
  );
}