import React, { useState } from 'react';

export const FileUpload: React.FC<{
  label?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: FileList | null) => void;
}> = ({ label, accept, multiple = false, onChange }) => {
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setFileNames(files ? Array.from(files).map((f) => f.name) : []);
    onChange?.(files);
  };

  return (
    <div className="flex flex-col">
      {label ? <label className="text-sm text-slate-700 mb-1">{label}</label> : null}
      <input type="file" accept={accept} multiple={multiple} onChange={handleChange} />
      {fileNames.length ? (
        <ul className="mt-2 text-sm text-slate-600 space-y-1">
          {fileNames.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default FileUpload;
