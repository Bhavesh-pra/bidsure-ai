import React from 'react';
export const DocumentSourceButton: React.FC<{ page?: number; onClick?: () => void }> = ({ page, onClick }) => <button className="text-indigo-600 hover:underline" onClick={onClick}>View Source{page ? ` · Page ${page}` : ''}</button>;
export default DocumentSourceButton;
