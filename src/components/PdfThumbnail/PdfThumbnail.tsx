import { FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/cx.ts';
import styles from './PdfThumbnail.module.scss';

let pdfjs: Promise<typeof import('pdfjs-dist')> | undefined;

/** pdf.js is large, so it is loaded the first time a thumbnail is drawn. */
function loadPdfjs() {
  pdfjs ??= import('pdfjs-dist').then(async (lib) => {
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  return pdfjs;
}

/** Draws the first page of a PDF, once it scrolls into view. */
export function PdfThumbnail({ url, className }: { url: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'waiting' | 'ready' | 'failed'>('waiting');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let cleanup = () => {};

    const draw = async () => {
      try {
        const lib = await loadPdfjs();
        const task = lib.getDocument({ url });
        cleanup = () => void task.destroy();
        const doc = await task.promise;
        const page = await doc.getPage(1);
        const box = canvas.parentElement?.getBoundingClientRect();
        const base = page.getViewport({ scale: 1 });
        const fit = Math.min((box?.width ?? 300) / base.width, (box?.height ?? 300) / base.height);
        const viewport = page.getViewport({ scale: fit * Math.min(window.devicePixelRatio, 2) });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        if (!cancelled) setState('ready');
      } catch {
        if (!cancelled) setState('failed');
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        void draw();
      },
      { rootMargin: '200px' },
    );
    observer.observe(canvas);
    return () => {
      cancelled = true;
      observer.disconnect();
      cleanup();
    };
  }, [url]);

  return (
    <div className={cx(styles.frame, className)} data-state={state}>
      <canvas ref={canvasRef} aria-hidden />
      {state !== 'ready' && (
        <span className={styles.placeholder}>
          <FileText size={28} />
          {state === 'failed' && <small>No preview</small>}
        </span>
      )}
    </div>
  );
}
