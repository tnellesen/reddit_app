import React from 'react';

import './LoadingOverlay.scss';

export interface LoadingOverlayProps {
  message: string;
  className?: string;
}

export function LoadingOverlay(props: LoadingOverlayProps) {
  const { message } = props;

  return (
    <div className="loading-overlay">
      <div className="loader-backdrop" />
      <div className="loader" />
      <h1 className="loading-overlay-message">{message}</h1>
    </div>
  );
}
