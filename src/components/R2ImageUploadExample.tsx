"use client";

import { useMemo, useState } from 'react';
import { uploadToR2 } from '@/lib/r2Upload';

export default function R2ImageUploadExample() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');

  const localPreview = useMemo(() => {
    if (!file) return '';
    return URL.createObjectURL(file);
  }, [file]);

  const onPickFile = (f: File | null) => {
    setError('');
    setUploadedUrl('');
    setProgress(0);
    setFile(f);
    setPreviewUrl('');
  };

  const onUpload = async () => {
    setError('');
    setUploadedUrl('');
    setProgress(0);

    if (!file) {
      setError('Pick a file first');
      return;
    }

    setLoading(true);
    try {
      const url = await uploadToR2(file, {
        folder: 'uploads',
        maxBytes: 10 * 1024 * 1024,
        onProgress: (pct) => setProgress(pct),
      });
      setUploadedUrl(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <input
          type="file"
          accept="image/*"
          disabled={loading}
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {localPreview && !uploadedUrl && (
        <img src={localPreview} alt="Local preview" className="w-64 rounded border" />
      )}

      <button
        type="button"
        onClick={onUpload}
        disabled={loading || !file}
        className="btn-primary"
      >
        {loading ? 'Uploading…' : 'Upload'}
      </button>

      {loading && (
        <div className="text-sm">
          <div>Progress: {progress}%</div>
          <div className="h-2 w-64 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {uploadedUrl && (
        <div className="space-y-2">
          <div className="text-sm break-all">{uploadedUrl}</div>
          <img src={uploadedUrl} alt="Uploaded" className="w-64 rounded border" />
        </div>
      )}

      {error && <div className="text-sm text-destructive">{error}</div>}

      {previewUrl && <img src={previewUrl} alt="Preview" className="w-64 rounded border" />}
    </div>
  );
}
