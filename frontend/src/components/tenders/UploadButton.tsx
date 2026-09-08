import React from 'react';
import { Button } from '../ui/Button';

export const UploadButton: React.FC<{ disabled?: boolean; loading?: boolean; onClick: () => void }> = ({ disabled, loading, onClick }) => <Button type="button" disabled={disabled} isLoading={loading} onClick={onClick}>{loading ? 'Uploading...' : 'Upload PDF'}</Button>;
