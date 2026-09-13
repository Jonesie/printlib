import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, OrbitControls } from "@react-three/drei";
import { STLLoader } from "three-stdlib";
import type { BufferGeometry } from "three";
import { api } from "../api/client";

function StlMesh({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    new STLLoader().load(url, (geo) => {
      if (!cancelled) setGeometry(geo);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#38bdf8" />
    </mesh>
  );
}

export default function Viewer3D({
  stlUrl,
  modelId,
  onPreviewSaved,
  editable = true,
}: {
  stlUrl: string;
  modelId: number;
  onPreviewSaved?: () => void;
  editable?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function savePreview() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    setSaved(false);
    try {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Could not capture preview");
      await api.savePreview(modelId, blob);
      setSaved(true);
      onPreviewSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="h-80 w-full rounded-lg border border-slate-800 bg-slate-900">
        <Canvas
          camera={{ position: [80, 80, 80], fov: 45 }}
          gl={{ preserveDrawingBuffer: true }}
          onCreated={(state) => {
            canvasRef.current = state.gl.domElement;
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[100, 150, 100]} intensity={1} />
          <directionalLight position={[-100, -50, -100]} intensity={0.4} />
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.4}>
              <Center>
                <StlMesh url={stlUrl} />
              </Center>
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
      </div>
      {editable && (
        <div className="flex items-center gap-2">
          <button
            onClick={savePreview}
            disabled={saving}
            className="self-start rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save this angle as preview"}
          </button>
          {saved && <span className="text-sm text-emerald-400">Saved</span>}
        </div>
      )}
    </div>
  );
}
