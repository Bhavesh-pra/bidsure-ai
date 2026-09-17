import React from 'react';

export const ExpectedValueDisplay: React.FC<{ value?: string | number | boolean; unit?: unknown }> = ({ value, unit }) => <span>{value == null ? '—' : `${value}${unit ? ` ${String(unit)}` : ''}`}</span>;
