'use client';

import type { DragEvent, ChangeEvent } from 'react';
import { useRef, useState, useCallback } from 'react';

import { decodeToString } from '../../lib/csv/encoding';
import { detectFormat } from '../../lib/csv/detect-format';
import type { DetectedFormat } from '../../lib/csv/detect-format';
import { Button } from '../ui/button';

export interface FileUploadProps {
  onFileLoad: (content: string) => void;
  onFormatDetected?: (format: DetectedFormat) => void;
  isLoading?: boolean;
  accept?: string;
}

export function FileUpload({
  onFileLoad,
  onFormatDetected,
  isLoading = false,
  accept = '.csv',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (result instanceof ArrayBuffer) {
          const content = decodeToString(result);
          const format = detectFormat(content);
          onFormatDetected?.(format);
          onFileLoad(content);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileLoad, onFormatDetected]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.csv')) {
          readFile(file);
        }
      }
    },
    [readFile]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        readFile(files[0]);
      }
    },
    [readFile]
  );

  const handleButtonClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const borderColor = isDragging
    ? 'border-primary'
    : 'border-muted-foreground/25';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors',
        borderColor,
        isDragging ? 'bg-accent/50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-sm text-muted-foreground">
        CSVファイル（.csv）をドラッグ&ドロップまたは選択
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={isLoading}
      >
        {isLoading ? '読み込み中...' : 'ファイルを選択'}
      </Button>
      <p className="text-xs text-muted-foreground">対応フォーマット: 汎用CSV、SBI証券</p>
    </div>
  );
}
