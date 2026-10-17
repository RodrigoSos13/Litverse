import { useEffect, useRef, useState } from "react";

const clamp = value => Math.max(0, Math.min(1, value));

export default function AvatarCropper({ image, onApply, onCancel }) {
  const canvas = useRef(null);
  const drag = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const side = Math.min(image.width, image.height) / zoom;
  const x = (image.width - side) * position.x;
  const y = (image.height - side) * position.y;

  useEffect(() => {
    const context = canvas.current.getContext("2d");
    context.clearRect(0, 0, 320, 320);
    context.drawImage(image, x, y, side, side, 0, 0, 320, 320);
  }, [image, x, y, side]);

  function move(event) {
    if (!drag.current) return;
    const width = event.currentTarget.getBoundingClientRect().width;
    const scale = side / width;
    const dx = (event.clientX - drag.current.x) * scale;
    const dy = (event.clientY - drag.current.y) * scale;
    setPosition(current => ({
      x: image.width > side ? clamp(current.x - dx / (image.width - side)) : current.x,
      y: image.height > side ? clamp(current.y - dy / (image.height - side)) : current.y,
    }));
    drag.current = { x: event.clientX, y: event.clientY };
  }
  return (
    <section aria-label="Enquadramento da foto" className="rounded-2xl border border-line bg-midnight/40 p-4">
      <h3 className="text-sm font-semibold text-white">Enquadre sua foto</h3>
      <p className="mt-1 text-xs text-mist">Arraste a imagem e ajuste o zoom.</p>
      <canvas ref={canvas} width="320" height="320" role="img" aria-label="Prévia circular do enquadramento" className="mx-auto my-5 block aspect-square w-full max-w-56 touch-none cursor-grab rounded-full bg-midnight ring-2 ring-copper/40 active:cursor-grabbing" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY }; }} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} />
      <div className="space-y-3">
        <label className="flex items-center gap-3 text-xs text-mist"><span className="w-16 shrink-0">Zoom</span><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="min-w-0 flex-1 accent-copper" /><span className="w-9 text-right tabular-nums">{zoom.toFixed(1)}×</span></label>
        {[{ axis: "x", label: "Horizontal", disabled: image.width <= side }, { axis: "y", label: "Vertical", disabled: image.height <= side }].map(({ axis, label, disabled }) => <label key={axis} className="flex items-center gap-3 text-xs text-mist"><span className="w-16 shrink-0">{label}</span><input type="range" min="0" max="1" step="0.005" disabled={disabled} value={position[axis]} onChange={event => setPosition(current => ({ ...current, [axis]: Number(event.target.value) }))} className="min-w-0 flex-1 accent-copper disabled:opacity-30" /></label>)}
      </div>
      <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-xs text-mist hover:text-white">Cancelar foto</button><button type="button" onClick={() => onApply(canvas.current.toDataURL("image/webp", 0.85))} className="rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-white hover:bg-berry">Usar foto</button></div>
    </section>
  );
}
