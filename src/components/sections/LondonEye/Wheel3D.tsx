'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { capsuleAngle, capsuleAt } from './wheelMath'
import { CAPSULE, type WheelProps } from './types'

type Props = WheelProps & { running: boolean }

const LAMP = new THREE.Color('#e8b65a')
const LAMP_DIM = new THREE.Color('#8a6a3a')

/** Rim truss, in radius units: two outer chords (front/back) and one inner chord, braced. */
const RIM = { outer: 1, inner: 0.962, depth: 0.032, bays: 96 } as const
/** Spindle half-length: the spoke cables fan from its ends to the inner chord. */
const SPINDLE = 0.13
/** A slight turn off face-on so the truss, pods and legs read in depth (boarding point moves <1%). */
const TILT = -0.14

const Y_AXIS = new THREE.Vector3(0, 1, 0)
/** Matrix for a unit cylinder stretched from p to q with the given radius. */
function beam(p: THREE.Vector3, q: THREE.Vector3, r: number): THREE.Matrix4 {
  const d = q.clone().sub(p)
  const quat = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, d.clone().normalize())
  return new THREE.Matrix4().compose(
    p.clone().add(q).multiplyScalar(0.5),
    quat,
    new THREE.Vector3(r, d.length(), r),
  )
}
const onRing = (a: number, r: number, z: number) =>
  new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z)

/**
 * Procedural London Eye in React Three Fiber, modelled on the real one: a braced triangular rim
 * truss lined with a faint LED strip, 64 spoke cables fanning from the spindle ends, a raking
 * A-frame, and 32 glass ovoid capsules, each held in a steel mounting ring outside the rim, lit
 * from inside and kept level as the wheel turns. White steel catches cool sky light from above
 * and warm city light from below. Geometry is in "radius units" and scaled to the pixel layout.
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
      <ambientLight intensity={0.25} color="#3e5c7a" />
      {/* Cool key from the sky, warm fill from the floodlit embankment below. */}
      <directionalLight position={[6, 7, 5]} intensity={1.1} color="#a9c2e0" />
      <directionalLight position={[-6, -3, 4]} intensity={0.55} color="#e8b65a" />
      <hemisphereLight args={['#1c3550', '#6e5134', 0.45]} />
      <Eye {...props} />
    </Canvas>
  )
}

function Eye({ layout, capsules, featured, initialRotation, handleRef, onSelect, onReady }: Props) {
  const { viewport, size } = useThree()
  const boarding = layout.mobile ? -Math.PI / 2 : 0
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
        color: '#dfe5ea',
        metalness: 0.45,
        roughness: 0.38,
        envMapIntensity: 1.2,
      }),
    [],
  )
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#b9cde0',
        metalness: 0.05,
        roughness: 0.05,
        clearcoat: 1,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        envMapIntensity: 1.8,
      }),
    [],
  )
  // Capsule mounting rings and end frames: darker, more metallic than the painted rim.
  const frame = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c4ccd5',
        metalness: 0.6,
        roughness: 0.3,
        envMapIntensity: 1.4,
      }),
    [],
  )
  const glassActive = useMemo(() => {
    const m = glass.clone()
    m.emissive = new THREE.Color('#e8b65a')
    m.emissiveIntensity = 0.5
    m.opacity = 0.55
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
      const z = i % 2 ? SPINDLE : -SPINDLE
      pts.push(0, 0, z, ...onRing(a, RIM.inner, 0).toArray())
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
  // Every straight steel member of the rim, as one instanced mesh: per bay, the two sides of the
  // triangular section, its front-back tie, an alternating diagonal, and two brackets per capsule.
  const beams = useMemo(() => {
    const list: THREE.Matrix4[] = []
    const B = RIM.bays
    for (let i = 0; i < B; i++) {
      const a = (i / B) * Math.PI * 2
      const b = ((i + 1) / B) * Math.PI * 2
      const inner = onRing(a, RIM.inner, 0)
      const front = onRing(a, RIM.outer, RIM.depth)
      const back = onRing(a, RIM.outer, -RIM.depth)
      list.push(beam(inner, front, 0.0032), beam(inner, back, 0.0032), beam(front, back, 0.0026))
      list.push(beam(inner, onRing(b, RIM.outer, i % 2 ? RIM.depth : -RIM.depth), 0.0024))
    }
    const podR = 1 + CAPSULE.offset
    const ringR = CAPSULE.halfLength * 1.05
    for (let c = 0; c < capsules; c++) {
      const a = capsuleAngle(c, capsules)
      const ringFoot = onRing(a, podR - ringR, 0)
      list.push(
        beam(onRing(a, RIM.outer, RIM.depth), ringFoot, 0.0034),
        beam(onRing(a, RIM.outer, -RIM.depth), ringFoot, 0.0034),
      )
    }
    return list
  }, [capsules])

  // One shell geometry shared by every capsule: 1 GPU upload instead of 32.
  const shellGeometry = useMemo(() => new THREE.SphereGeometry(1, 24, 16), [])

  const beamMesh = useRef<THREE.InstancedMesh>(null)
  const ringMesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    beams.forEach((m, i) => beamMesh.current?.setMatrixAt(i, m))
    if (beamMesh.current) beamMesh.current.instanceMatrix.needsUpdate = true
    // Mounting rings: circles in the wheel plane around each capsule, fixed to the rim.
    const podR = 1 + CAPSULE.offset
    const m = new THREE.Matrix4()
    for (let c = 0; c < capsules; c++) {
      const a = capsuleAngle(c, capsules)
      ringMesh.current?.setMatrixAt(c, m.makeTranslation(Math.cos(a) * podR, Math.sin(a) * podR, 0))
    }
    if (ringMesh.current) ringMesh.current.instanceMatrix.needsUpdate = true
  }, [beams, capsules])

  useFrame(({ clock }, dt) => {
    const rot = rotation.current
    if (wheel.current) wheel.current.rotation.z = rot
    const t = clock.elapsedTime
    const lit = capsuleAt(rot, boarding, capsules)
    for (let c = 0; c < capsules; c++) {
      const pod = pods.current[c]
      if (!pod) continue
      pod.rotation.z = -rot // keep the capsule level
      // The light lives at the boarding point: whichever pod is there now is lit.
      const isActive = c === lit
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
        mat.color.copy(col).multiplyScalar(isActive ? 1.6 : 0.7 * twinkle + 0.45)
      }
    }
    if (halo.current) halo.current.opacity = 0.8 + 0.12 * Math.sin(t * 1.7)
    if (!ready.current) {
      ready.current = true
      onReady?.()
    }
  })

  const podR = 1 + CAPSULE.offset

  return (
    <group position={hub} scale={scale} rotation={[0, TILT, 0]}>
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
            <cylinderGeometry args={[0.014, 0.026, len, 16]} />
          </mesh>
        )
      })}
      {/* Spindle: the static axle the hub turns on. */}
      <mesh material={steel} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, SPINDLE * 2.4, 20]} />
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
        {/* Rim chords: front and back outer tubes, one inner tube. */}
        {[
          [RIM.outer, RIM.depth],
          [RIM.outer, -RIM.depth],
          [RIM.inner, 0],
        ].map(([r, z]) => (
          <mesh key={`${r}:${z}`} material={steel} position={[0, 0, z]}>
            <torusGeometry args={[r, 0.0075, 8, 192]} />
          </mesh>
        ))}
        {/* The rim's LED strip: a faint cool line along the outer front chord. */}
        <mesh position={[0, 0, RIM.depth + 0.006]}>
          <torusGeometry args={[RIM.outer, 0.0028, 6, 192]} />
          <meshBasicMaterial color="#cfdcff" transparent opacity={0.4} toneMapped={false} />
        </mesh>
        <instancedMesh ref={beamMesh} args={[undefined, steel, beams.length]}>
          <cylinderGeometry args={[1, 1, 1, 6]} />
        </instancedMesh>
        <instancedMesh ref={ringMesh} args={[undefined, frame, capsules]}>
          <torusGeometry args={[CAPSULE.halfLength * 1.05, 0.0022, 6, 48]} />
        </instancedMesh>
        {/* Hub: turning drum with a flange at each spindle end where the cables meet. */}
        <mesh material={steel} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, SPINDLE * 1.6, 24]} />
        </mesh>
        {[-SPINDLE, SPINDLE].map((z) => (
          <mesh key={z} material={steel} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.058, 0.058, 0.01, 32]} />
          </mesh>
        ))}
        <lineSegments geometry={cables}>
          <lineBasicMaterial color="#b7c3d0" transparent opacity={0.3} />
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
                {/* End frames where the glass meets the steel nose and tail. */}
                {[-1, 1].map((side) => (
                  <mesh
                    key={side}
                    material={frame}
                    position={[side * CAPSULE.halfLength * 0.62, 0, 0]}
                    rotation={[0, Math.PI / 2, 0]}
                  >
                    <torusGeometry args={[CAPSULE.halfHeight * 0.8, 0.0028, 6, 24]} />
                  </mesh>
                ))}
                {/* Lit floor and the warm glow of the cabin interior seen through the glass. */}
                <mesh material={frame} position={[0, -CAPSULE.halfHeight * 0.5, 0]}>
                  <boxGeometry args={[CAPSULE.halfLength * 1.5, 0.004, CAPSULE.halfHeight * 1.3]} />
                </mesh>
                <mesh ref={(el) => void (cores.current[c] = el)} position={[0, 0, 0.002]}>
                  <planeGeometry args={[CAPSULE.halfLength * 2.2, CAPSULE.halfHeight * 2.2]} />
                  <meshBasicMaterial
                    map={haloTexture}
                    color={LAMP_DIM}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                  />
                </mesh>
              </group>
            </group>
          )
        })}
      </group>
    </group>
  )
}
