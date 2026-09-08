import React from 'react';

export const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <span
    className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
    style={{ width: size, height: size }}
  />
);

export default Spinner;
