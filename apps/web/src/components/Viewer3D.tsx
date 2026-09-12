import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, OrbitControls } from "@react-three/drei";
import { STLLoader } from "three-stdlib";
import type { BufferGeometry } from "three";

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

export default function Viewer3D({ stlUrl }: { stlUrl: string }) {
  return (
    <div className="h-80 w-full rounded-lg border border-slate-800 bg-slate-900">
      <Canvas camera={{ position: [80, 80, 80], fov: 45 }}>
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
  );
}
