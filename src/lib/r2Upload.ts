export type UploadToR2Options = {
  folder?: string;
  maxBytes?: number;
  onProgress?: (percent: number) => void;
};

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

export async function uploadToR2(file: File, options: UploadToR2Options = {}): Promise<string> {
  const { folder = 'uploads', maxBytes = DEFAULT_MAX_BYTES, onProgress } = options;

  if (!file) throw new Error('No file provided');
  if (!file.type?.startsWith('image/')) throw new Error('Only image uploads are allowed');
  if (typeof file.size === 'number' && file.size > maxBytes) throw new Error('File too large');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    
    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      if (!event.lengthComputable) return;
      const pct = Math.round((event.loaded / event.total) * 100);
      onProgress(pct);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.fileUrl) {
            onProgress?.(100);
            resolve(res.fileUrl);
          } else {
            reject(new Error(res.error || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error('Invalid response'));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(formData);
  });
}
