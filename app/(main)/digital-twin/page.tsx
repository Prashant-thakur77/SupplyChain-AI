"use client";
// src/pages/DigitalTwinPage.tsx
import { Suspense } from 'react';
import DigitalTwinClientPage from './digital-twin-client-page';

export default function DigitalTwinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DigitalTwinClientPage />
    </Suspense>
  );
}