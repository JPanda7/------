import { useState, useRef, useCallback } from 'react';

const CHUNK_SIZE = 1024 * 1024; // 1MB
const MAX_RETRIES = 3;

export function useChunkedUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const fileRef = useRef<File | null>(null);
  const currentChunkIndexRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const startUpload = useCallback(async (file: File) => {
    fileRef.current = file;
    currentChunkIndexRef.current = 0;
    retryCountRef.current = 0;
    setProgress(0);
    setIsUploading(true);
    setIsPaused(false);
    setError(null);
    setUploadedUrl(null);
    await uploadNextChunk();
  }, []);

  const uploadNextChunk = async () => {
    if (!fileRef.current) return;
    
    const file = fileRef.current;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    abortControllerRef.current = new AbortController();

    try {
      while (currentChunkIndexRef.current < totalChunks) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const start = currentChunkIndexRef.current * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Simulate network delay and occasional failure (15% chance)
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (Math.random() < 0.15) {
              reject(new Error('Network Error'));
            } else {
              resolve(true);
            }
          }, 500);
          
          abortControllerRef.current?.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Aborted'));
          });
        });

        retryCountRef.current = 0; // Reset retries on success
        currentChunkIndexRef.current++;
        setProgress(Math.round((currentChunkIndexRef.current / totalChunks) * 100));
      }

      if (currentChunkIndexRef.current === totalChunks) {
        setIsUploading(false);
        setUploadedUrl(URL.createObjectURL(file)); // Mock URL
      }
    } catch (err) {
      if ((err as Error).message === 'Aborted') {
        console.log('Upload paused');
      } else {
        console.error('Upload failed', err);
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.log(`Retrying... Attempt ${retryCountRef.current}`);
          setTimeout(() => {
            uploadNextChunk();
          }, 1000);
        } else {
          setError('文件上传失败，已达到最大重试次数。');
          setIsUploading(false);
        }
      }
    }
  };

  const pauseUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsPaused(true);
      setIsUploading(false);
    }
  }, []);

  const resumeUpload = useCallback(() => {
    setIsPaused(false);
    setIsUploading(true);
    setError(null);
    retryCountRef.current = 0;
    uploadNextChunk();
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    fileRef.current = null;
    currentChunkIndexRef.current = 0;
    retryCountRef.current = 0;
    setProgress(0);
    setIsUploading(false);
    setIsPaused(false);
    setError(null);
    setUploadedUrl(null);
  }, []);

  const retryUpload = useCallback(() => {
    setIsPaused(false);
    setIsUploading(true);
    setError(null);
    retryCountRef.current = 0;
    uploadNextChunk();
  }, []);

  return {
    progress,
    isUploading,
    isPaused,
    error,
    uploadedUrl,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    file: fileRef.current
  };
}
