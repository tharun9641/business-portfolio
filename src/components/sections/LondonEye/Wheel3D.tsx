'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { capsuleAngle } from './wheelMath'
import { CAPSULE, type WheelProps } from './types'

type Props = WheelProps & { running: boolean }

const LAMP = new THREE.Color('#e8b65a')
const LAMP_DIM = new THREE.Color('#8a6a3a')

/**
 * Procedural London Eye in React Three Fiber: twin rim tubes with radial struts, 64 spoke cables,
 * hub and spindle, a raking A-frame, and 32 egg-shaped glass capsules mounted outside the rim that
 * stay level as the wheel turns. Geometry is in "radius units" and scaled to the pixel layout.
 */
export default function Wheel3D(props: Props) {
  return (
    <Canvas
      aria-hidden
      className="!absolute inset-0"
      frameloop={props.running ? 'always' : 'never'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 20, near: 10, far: 20000, position: [0, 0, 4000] }}
    >
      <Environment resolution={128} frames={1}>
        {/* Matches the plate: ink sky dome, warm low light from the west, Thames-blue fill. */}
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#1c3550"
          scale={[40, 10]}
          position={[0, 12, -6]}
        />
        <Lightformer
          form="rect"
          intensity={4}
          color="#e8b65a"
          scale={[6, 3]}
          position={[-14, -2, 4]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#3e5c7a"
          scale={[10, 10]}
          position={[10, 2, 8]}
        />
      </Environment>
      <ambientLight intensity={0.35} color="#3e5c7a" />
      <directionalLight position={[-6, 2, 5]} intensity={1.2} color="#e8b65a" />
      <Eye {...props} />
    </Canvas>
  )
}

function Eye({
  layout,
  capsules,
  featured,
  active,
  initialRotation,
  handleRef,
  onSelect,
  onReady,
}: Props) {
  const { viewport, size } = useThree()
  const wheel = useRef<THREE.Group>(null)
  const pods = useRef<(THREE.Group | null)[]>([])
  const cores = useRef<(THREE.Mesh | null)[]>([])
  const rotation = useRef(initialRotation)
  const ready = useRef(false)

  useImperativeHandle(handleRef, () => ({ setRotation: (r) => void (rotation.current = r) }), [])

  // Pixel layout → world units at the z = 0 plane.
  const k = viewport.height / size.height
  const hub: [number, number, number] = [
    (layout.hubX - size.width / 2) * k,
    (size.height / 2 - layout.hubY) * k,
    0,
  ]
  const scale = layout.radius * k

  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // Painted white steel catching the dusk: low metalness so it reads light against the sky.
        color: '#e2e8ee',
        metalness: 0.35,
        roughness: 0.4,
        envMapIntensity: 1.6,
      }),
    [],
  )
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#9fb6cc',
        metalness: 0.05,
        roughness: 0.06,
        clearcoat: 1,
        transparent: true,
        opacity: 0.42,
        envMapIntensity: 1.4,
      }),
    [],
  )
  const glassActive = useMemo(() => {
    const m = glass.clone()
    m.emissive = new THREE.Color('#e8b65a')
    m.emissiveIntensity = 0.55
    m.opacity = 0.6
    return m
  }, [glass])
  // Warm halo fixed at the boarding point: the active capsule always arrives there.
  const haloTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      g.addColorStop(0, 'rgba(255, 226, 160, 0.9)')
      g.addColorStop(0.35, 'rgba(232, 182, 90, 0.35)')
      g.addColorStop(1, 'rgba(232, 182, 90, 0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 128, 128)
    }
    return new THREE.CanvasTexture(canvas)
  }, [])
  const halo = useRef<THREE.MeshBasicMaterial>(null)
  const shells = useRef<(THREE.Mesh | null)[]>([])
  const cables = useMemo(() => {
    const pts: number[] = []
    const n = 64
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const side = i % 2 ? 0.06 : -0.06
      pts.push(0, 0, side * 1.6, Math.cos(a), Math.sin(a), side * 0.5)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
  const struts = useMemo(() => {
    const m = new THREE.Matrix4()
    const list: THREE.Matrix4[] = []
    for (let i = 0; i < capsules * 2; i++) {
      const a = (i / (capsules * 2)) * Math.PI * 2
      m.makeRotationZ(a).setPosition(Math.cos(a) * 0.985, Math.sin(a) * 0.985, 0)
      list.push(m.clone())
    }
    return list
  }, [capsules])

  // One geometry each for every shell and core: 2 GPU uploads instead of 64.
  const shellGeometry = useMemo(() => new THREE.SphereGeometry(1, 24, 16), [])
  const coreGeometry = useMemo(() => new THREE.SphereGeometry(1, 12, 8), [])

  const strutMesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    struts.forEach((m, i) => strutMesh.current?.setMatrixAt(i, m))
    if (strutMesh.current) strutMesh.current.instanceMatrix.needsUpdate = true
  }, [struts])

  useFrame(({ clock }, dt) => {
    const rot = rotation.current
    if (wheel.current) wheel.current.rotation.z = rot
    const t = clock.elapsedTime
    for (let c = 0; c < capsules; c++) {
      const pod = pods.current[c]
      if (!pod) continue
      pod.rotation.z = -rot // keep the capsule level
      const f = featured.indexOf(c)
      const isActive = f !== -1 && f === active
      const target = isActive ? 1.08 : 1
      pod.scale.setScalar(THREE.MathUtils.damp(pod.scale.x, target, 6, dt))
      const shell = shells.current[c]
      if (shell) shell.material = isActive ? glassActive : glass
      const core = cores.current[c]
      if (core) {
        // Soft twinkle; the active capsule glows at full --lamp.
        const twinkle = 0.75 + 0.25 * Math.sin(t * 1.3 + c * 2.17) * Math.sin(t * 0.7 + c)
        const col = isActive ? LAMP : LAMP_DIM
        const mat = core.material as THREE.MeshBasicMaterial
        mat.color.copy(col).multiplyScalar(isActive ? 1.8 : 0.32 * twinkle + 0.12)
      }
    }
    if (halo.current) halo.current.opacity = 0.8 + 0.12 * Math.sin(t * 1.7)
    if (!ready.current) {
      ready.current = true
      onReady?.()
    }
  })

  const podR = 1 + CAPSULE.offset
  const boarding = layout.mobile ? -Math.PI / 2 : 0

  return (
    <group position={hub} scale={scale}>
      {/* A-frame legs raking back from the hub (static). */}
      {[-0.34, 0.34].map((dx) => {
        const end = new THREE.Vector3(dx * 1.1, -1.38, -0.55)
        const len = end.length()
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          end.clone().normalize(),
        )
        return (
          <mesh key={dx} material={steel} position={end.clone().multiplyScalar(0.5)} quaternion={q}>
            <cylinderGeometry args={[0.012, 0.018, len, 12]} />
          </mesh>
        )
      })}
      <mesh material={steel} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.34, 20]} />
      </mesh>

      <mesh position={[Math.cos(boarding) * podR, Math.sin(boarding) * podR, 0.06]} renderOrder={2}>
        <planeGeometry args={[0.34, 0.34]} />
        <meshBasicMaterial
          ref={halo}
          map={haloTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <group ref={wheel} rotation={[0, 0, initialRotation]}>
        {[-0.03, 0.03].map((z) => (
          <mesh key={z} material={steel} position={[0, 0, z]}>
            <torusGeometry args={[1, 0.009, 8, 160]} />
          </mesh>
        ))}
        <instancedMesh ref={strutMesh} args={[undefined, steel, struts.length]}>
          <boxGeometry args={[0.03, 0.006, 0.062]} />
        </instancedMesh>
        <mesh material={steel}>
          <cylinderGeometry args={[0.055, 0.055, 0.16, 24]} />
        </mesh>
        <lineSegments geometry={cables}>
          <lineBasicMaterial color="#c9d2dc" transparent opacity={0.45} />
        </lineSegments>

        {Array.from({ length: capsules }, (_, c) => {
          const a = capsuleAngle(c, capsules)
          const f = featured.indexOf(c)
          return (
            <group key={c} position={[Math.cos(a) * podR, Math.sin(a) * podR, 0]}>
              <group
                ref={(el) => void (pods.current[c] = el)}
                rotation={[0, 0, -initialRotation]}
                onClick={f === -1 ? undefined : (e) => (e.stopPropagation(), onSelect(f))}
                onPointerOver={
                  f === -1 ? undefined : () => (document.body.style.cursor = 'pointer')
                }
                onPointerOut={f === -1 ? undefined : () => (document.body.style.cursor = '')}
              >
                <mesh
                  ref={(el) => void (shells.current[c] = el)}
                  material={glass}
                  geometry={shellGeometry}
                  scale={[CAPSULE.halfLength, CAPSULE.halfHeight, CAPSULE.halfHeight]}
                />
                <mesh
                  ref={(el) => void (cores.current[c] = el)}
                  geometry={coreGeometry}
                  scale={[
                    CAPSULE.halfLength * 0.6,
                    CAPSULE.halfHeight * 0.5,
                    CAPSULE.halfHeight * 0.5,
                  ]}
                >
                  <meshBasicMaterial color={LAMP_DIM} toneMapped={false} />
                </mesh>
              </group>
            </group>
          )
        })}
      </group>
    </group>
  )
}
