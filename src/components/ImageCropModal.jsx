import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const CROP_SIZE = 288; // px, matches the w-72/h-72 preview window
const OUTPUT_SIZE = 512; // px, final exported square
const MAX_ZOOM = 3;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampPos(p, w, h) {
  return {
    x: clamp(p.x, CROP_SIZE - w, 0),
    y: clamp(p.y, CROP_SIZE - h, 0),
  };
}

// `src` is an object URL for the freshly picked file. `onConfirm(blob)`
// is called with the cropped square image as a JPEG blob; `onCancel()`
// closes without saving anything.
export default function ImageCropModal({ src, onConfirm, onCancel }) {
  const imgRef = useRef(null);
  const draggingRef = useRef(false);
  const startRef = useRef({ pointerX: 0, pointerY: 0, posX: 0, posY: 0 });

  const [natural, setNatural] = useState(null); // { w, h }
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // top-left of the image, in crop-window px

  // Kept in sync with state via effects (not during render — writing
  // to a ref's .current while rendering is disallowed) so the
  // window-level drag listener always reads current values instead of
  // a stale closure.
  const naturalRef = useRef(natural);
  useEffect(() => {
    naturalRef.current = natural;
  }, [natural]);

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const baseScale = natural ? Math.max(CROP_SIZE / natural.w, CROP_SIZE / natural.h) : 1;
  const scale = baseScale * zoom;
  const dispW = natural ? natural.w * scale : 0;
  const dispH = natural ? natural.h * scale : 0;

  const handleImageLoad = (e) => {
    const w = e.target.naturalWidth;
    const h = e.target.naturalHeight;
    setNatural({ w, h });
    const base = Math.max(CROP_SIZE / w, CROP_SIZE / h);
    const initW = w * base;
    const initH = h * base;
    setPos({ x: (CROP_SIZE - initW) / 2, y: (CROP_SIZE - initH) / 2 });
  };

  // Drag tracking lives on `window`, not just the crop circle, so
  // movement keeps registering even if the cursor briefly leaves the
  // small crop area mid-drag — relying only on the element's own
  // pointer-capture was silently dropping movement in some setups.
  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current || !naturalRef.current) return;
      const dx = e.clientX - startRef.current.pointerX;
      const dy = e.clientY - startRef.current.pointerY;
      const nat = naturalRef.current;
      const base = Math.max(CROP_SIZE / nat.w, CROP_SIZE / nat.h);
      const sc = base * zoomRef.current;
      const w = nat.w * sc;
      const h = nat.h * sc;
      const next = { x: startRef.current.posX + dx, y: startRef.current.posY + dy };
      setPos(clampPos(next, w, h));
    };
    const handleUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  const handlePointerDown = (e) => {
    draggingRef.current = true;
    startRef.current = { pointerX: e.clientX, pointerY: e.clientY, posX: pos.x, posY: pos.y };
  };

  const handleZoomChange = (e) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    if (!natural) return;
    const newScale = baseScale * newZoom;
    const newDispW = natural.w * newScale;
    const newDispH = natural.h * newScale;
    // Clamp right here, in response to the user's action, instead of
    // reacting to the zoom-state change in a separate effect.
    setPos((p) => clampPos(p, newDispW, newDispH));
  };

  const handleConfirm = () => {
    if (!natural || !imgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

    const sx = -pos.x / scale;
    const sy = -pos.y / scale;
    const sSize = CROP_SIZE / scale;

    ctx.drawImage(imgRef.current, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob((blob) => blob && onConfirm(blob), 'image/jpeg', 0.92);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">Adjust photo</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Drag to reposition, use the slider to zoom.</p>

        <div
          className="relative mx-auto rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 touch-none cursor-grab active:cursor-grabbing select-none"
          style={{ width: CROP_SIZE, height: CROP_SIZE }}
          onPointerDown={handlePointerDown}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={handleImageLoad}
            draggable={false}
            className="absolute pointer-events-none"
            style={{ left: pos.x, top: pos.y, width: dispW, height: dispH, maxWidth: 'none' }}
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-slate-400 dark:text-slate-500">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={handleZoomChange}
            className="flex-1 accent-[#2D5A27] dark:accent-[#4CAF50]"
          />
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!natural}
            className="flex-1 py-2.5 bg-[#2D5A27] hover:bg-[#23471e] dark:bg-[#4CAF50] dark:hover:bg-[#3d9142] disabled:opacity-50 text-white font-medium text-sm rounded-xl transition cursor-pointer"
          >
            Save photo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}