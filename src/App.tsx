import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Text, PointerLockControls, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import cobblestoneImage from '../textures/coblestone.png'
import wallImage from '../textures/wall.png'
import phoneImage from '../textures/phone.jpg'
import gopnikModelUrl from '../3D_models/gopnik/source/e386317d-3f1f-45d5-9c63-8753ffd148f7.glb'
import lada2107ModelUrl from '../3D_models/2107/low_poly_lada_2107.glb'
import ae86ModelUrl from '../3D_models/ae86/free_pack_-_car.glb'
import corvetteModelUrl from '../3D_models/corvet/source/Corvette Stingray.glb'
import fordFocusModelUrl from '../3D_models/ford_focus/ford_focus_low_poly.glb'
import zaporojecModelUrl from '../3D_models/zaporojec/low-poly_retro_car.glb'
import grandpaModelUrl from '../3D_models/ded/animated_old_man_character.glb'
import grandpaCarModelUrl from '../3D_models/ded_car/lada-2101.glb'
import streetLampModelUrl from '../3D_models/street_lamp/98041e31c4ad4cecbd70eb7c1fd6ffb5.glb'
import policemanModelUrl from '../3D_models/policeman/police_officer_redford_-_proto_series_-_free.glb'
import girlModelUrl from '../3D_models/girl/psx_alt_girl.glb'
import dogPeeModelUrl from '../3D_models/dog_pee/chunky_the_urinating_english_bulldog.glb'
import dogPoopingModelUrl from '../3D_models/dog_pooping/dog_pooping.glb'
import HardwareCatchGame from './HardwareCatchGame'

const STREET_LENGTH = 180
const GOPNIK_Z = -42
const GRANDPA_Z = -100
const DIALOGUE_INTERACTIONS_ENABLED = true
const POLICEMAN_INTERACTION_ENABLED = true
const POLICEMAN_X = 4.25
const POLICEMAN_Z = GRANDPA_Z - 13
const DOG_X = -4
const DOG_Z = -68
const DOG_DIALOGUE_RADIUS = 3
const CAR_COLLISION_RADIUS = 0.4
const CAR_COLLISION_SCALE = 1.1
const CAR_COLLIDERS = [
  { x: 4.7, z: -15, rotationY: Math.PI, halfWidth: 1.2, halfLength: 2.3 },
  { x: 4.7, z: -32, rotationY: 0, halfWidth: 1.2, halfLength: 2.3 },
  { x: 4.7, z: -49, rotationY: Math.PI, halfWidth: 1.2, halfLength: 2.3 },
  { x: 4.7, z: -66, rotationY: 0, halfWidth: 1.2, halfLength: 2.3 },
  { x: 4.7, z: -80, rotationY: Math.PI, halfWidth: 1.2, halfLength: 2.3 },
  { x: 4.3, z: -100, rotationY: 0, halfWidth: 1.2, halfLength: 2.3 },
]
const BAR_DOOR_X = 0
const BAR_DOOR_Z = -143.44
const BAR_DOOR_INTERACTION_RADIUS = 3
const GIRL_X = 3.7
const GIRL_Z = -141.9
const GIRL_DIALOGUE_RADIUS = 3

const POLICE_QUESTIONS = [
  {
    prompt: 'Незаконное культивирование конопли в крупном размере квалифицируется по статье:',
    answers: ['Ст. 231 УК РФ', 'Ст. 217 УК РФ', 'Ст. 138 ч. 1 УК РФ'],
    correct: 0,
  },
  {
    prompt: 'В УК РФ за кражу отвечает статья:',
    answers: ['Ст. 158 УК РФ', 'Ст. 481 УК РФ', 'Ст. 214 УК РФ'],
    correct: 0,
  },
  {
    prompt: 'Разбой, совершённый с применением оружия, квалифицируется по статье:',
    answers: ['Ст. 162 УК РФ', 'Ст. 161 УК РФ', 'Ст. 163 УК РФ'],
    correct: 0,
  },
  {
    prompt: 'В России за мошенничество отвечает статья:',
    answers: ['Ст. 159 УК РФ', 'Ст. 125 УК РФ', 'Ст. 42 УК РФ'],
    correct: 0,
  },
  {
    prompt: 'Умышленное причинение тяжкого вреда здоровью предусмотрено статьёй:',
    answers: ['Ст. 111 УК РФ', 'Ст. 112 УК РФ', 'Ст. 115 УК РФ'],
    correct: 0,
  },
]

function intersectsCar(x: number, z: number) {
  return CAR_COLLIDERS.some(car => {
    const dx = x - car.x
    const dz = z - car.z
    const cos = Math.cos(car.rotationY)
    const sin = Math.sin(car.rotationY)
    const localX = cos * dx - sin * dz
    const localZ = sin * dx + cos * dz

    return Math.abs(localX) <= (car.halfWidth + CAR_COLLISION_RADIUS) * CAR_COLLISION_SCALE
      && Math.abs(localZ) <= (car.halfLength + CAR_COLLISION_RADIUS) * CAR_COLLISION_SCALE
  })
}

function Building({ side, z, height, color, index }: {
  side: number
  z: number
  height: number
  color: string
  index: number
}) {
  const width = 7
  const length = 11
  const x = side * 10
  const facadeX = side * 6.45

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>

      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[width + 0.15, 0.9, length + 0.2]} />
        <meshStandardMaterial color="#625b55" />
      </mesh>

      <mesh position={[0, height + 0.15, 0]}>
        <boxGeometry args={[width + 0.4, 0.35, length + 0.4]} />
        <meshStandardMaterial color="#b9a995" />
      </mesh>

      {Array.from({ length: 3 }, (_, floor) =>
        Array.from({ length: 4 }, (_, column) => (
          <group
            key={`${floor}-${column}`}
            position={[facadeX - x, 2.2 + floor * 2.5, -8 + column * 5.3]}
          >
            <mesh>
              <boxGeometry args={[0.13, 1.65, 1.35]} />
              <meshStandardMaterial color="#e2c9a0" />
            </mesh>

            <mesh position={[side * 0.08, 0, 0]}>
              <boxGeometry args={[0.06, 1.35, 1.05]} />
              <meshStandardMaterial
                color={index % 3 === 0 ? '#b28d61' : '#53616a'}
                emissive={index % 4 === 0 ? '#d69c51' : '#000000'}
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        )),
      )}

      <mesh position={[side * -3.35, height / 2, -10]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, height, 6]} />
        <meshStandardMaterial color="#77716a" />
      </mesh>
    </group>
  )
}

function Car({
  position,
  modelUrl,
  scale,
  rotationY,
  offset,
  hideLabel = false,
}: {
  position: [number, number, number]
  modelUrl: string
  scale: number
  rotationY: number
  offset: [number, number, number]
  hideLabel?: boolean
}) {
  const { scene } = useGLTF(modelUrl)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse(object => {
      if (hideLabel && object.name === 'Text') {
        object.visible = false
      }
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return clone
  }, [scene, hideLabel])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group scale={scale}>
        <primitive object={model} position={offset} />
      </group>
    </group>
  )
}

function RoadsideModel({
  modelUrl,
  position,
  targetHeight,
  alignLengthToStreet = false,
  rotationY = 0,
}: {
  modelUrl: string
  position: [number, number, number]
  targetHeight: number
  alignLengthToStreet?: boolean
  rotationY?: number
}) {
  const { scene } = useGLTF(modelUrl)
  const { model, offset, scale, modelRotation } = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)
    clone.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    clone.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const fitScale = targetHeight / Math.max(size.y, 0.001)

    return {
      model: clone,
      offset: new THREE.Vector3(-center.x * fitScale, -bounds.min.y * fitScale, -center.z * fitScale),
      scale: fitScale,
      modelRotation: alignLengthToStreet && size.x > size.z ? Math.PI / 2 : rotationY,
    }
  }, [scene, targetHeight, alignLengthToStreet, rotationY])

  return (
    <group position={position}>
      <group rotation={[0, modelRotation, 0]} scale={scale}>
        <primitive object={model} position={offset} />
      </group>
    </group>
  )
}

useGLTF.preload(lada2107ModelUrl)
useGLTF.preload(ae86ModelUrl)
useGLTF.preload(corvetteModelUrl)
useGLTF.preload(fordFocusModelUrl)
useGLTF.preload(zaporojecModelUrl)

function StreetLamp({ position, rotationY }: {
  position: [number, number, number]
  rotationY: number
}) {
  const { scene } = useGLTF(streetLampModelUrl)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group scale={1.4}>
        <primitive object={model} position={[0, 0.014, 0]} />
        <pointLight
          position={[0.5, 3.8, 0]}
          color="#ffd09a"
          intensity={40}
          distance={18}
          decay={2}
        />
      </group>
    </group>
  )
}

useGLTF.preload(streetLampModelUrl)
useGLTF.preload(policemanModelUrl)
useGLTF.preload(girlModelUrl)
useGLTF.preload(dogPeeModelUrl)
useGLTF.preload(dogPoopingModelUrl)

function Gopnik({ defeated }: { defeated: boolean }) {
  const modelGroup = useRef<THREE.Group>(null)
  const particleGroup = useRef<THREE.Group>(null)
  const deathTime = useRef(0)
  const { scene } = useGLTF(gopnikModelUrl)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return clone
  }, [scene])
  const particles = useMemo(() => Array.from({ length: 28 }, (_, index) => {
    const sample = (seed: number) => {
      const value = Math.sin((index + 1) * (seed * 17.13 + 3.71)) * 43758.5453
      return value - Math.floor(value)
    }
    const shade = Math.round(105 + sample(8) * 90)

    return {
      position: [
        (sample(1) - 0.5) * 0.9,
        0.2 + sample(2) * 1.8,
        (sample(3) - 0.5) * 0.5,
      ] as [number, number, number],
      velocity: [
        (sample(4) - 0.5) * 2.8,
        1 + sample(5) * 2.8,
        (sample(6) - 0.5) * 2.8,
      ] as [number, number, number],
      size: 0.06 + sample(7) * 0.09,
      color: `#${shade.toString(16).padStart(2, '0').repeat(3)}`,
    }
  }), [])

  useFrame((_, delta) => {
    if (!defeated) {
      deathTime.current = 0
      modelGroup.current?.scale.setScalar(1)
      particleGroup.current?.children.forEach(particle => {
        particle.visible = false
      })
      return
    }

    deathTime.current += delta
    const elapsed = deathTime.current
    if (modelGroup.current) {
      const nextScale = THREE.MathUtils.damp(
        modelGroup.current.scale.x,
        0.001,
        12,
        delta,
      )
      modelGroup.current.scale.setScalar(nextScale)
    }

    particleGroup.current?.children.forEach((particle, index) => {
      const data = particles[index]
      const t = Math.min(elapsed, 1.35)
      particle.visible = elapsed < 1.35
      particle.position.set(
        data.position[0] + data.velocity[0] * t,
        data.position[1] + data.velocity[1] * t - 2.2 * t * t,
        data.position[2] + data.velocity[2] * t,
      )
      particle.scale.setScalar(Math.max(0, 1 - t / 1.35))
    })
  })

  return (
    <group position={[-4.5, 0, GOPNIK_Z]}>
      <group ref={modelGroup}>
        <primitive
          object={model}
          position={[0, 1.0625, 0]}
          rotation={[0, Math.PI - THREE.MathUtils.degToRad(230), 0]}
          scale={2.125}
        />
      </group>

      <group ref={particleGroup}>
        {particles.map((particle, index) => (
          <mesh key={index} position={particle.position} visible={false}>
            <boxGeometry args={[particle.size, particle.size, particle.size]} />
            <meshStandardMaterial color={particle.color} roughness={1} />
          </mesh>
        ))}
      </group>

      {!defeated && (
        <Text
          position={[0, 3.15, 0]}
          fontSize={0.32}
          color="white"
          outlineWidth={0.025}
          outlineColor="#222222"
          anchorX="center"
        >
          ЭЙ, ИДИ СЮДА!
        </Text>
      )}
    </group>
  )
}

useGLTF.preload(gopnikModelUrl)

function GopnikDuelGame({ onFinish }: { onFinish: (won: boolean) => void }) {
  const [position, setPosition] = useState(50)
  const [playerHold, setPlayerHold] = useState(0)
  const [gopnikHold, setGopnikHold] = useState(0)
  const [countdown, setCountdown] = useState<number | 'GO' | null>(3)
  const finished = useRef(false)
  const positionRef = useRef(50)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  useEffect(() => {
    if (countdown === null) return

    const timeout = window.setTimeout(() => {
      setCountdown(current => {
        if (current === 'GO') return null
        if (current === 1) return 'GO'
        return current === null ? null : current - 1
      })
    }, countdown === 'GO' ? 600 : 1000)

    return () => window.clearTimeout(timeout)
  }, [countdown])

  useEffect(() => {
    if (countdown !== null) return

    let previous = performance.now()
    let frame = 0
    let value = 50
    let playerTime = 0
    let gopnikTime = 0

    const update = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      value = Math.max(0, Math.min(100, positionRef.current - delta * 60))
      positionRef.current = value

      if (value > 50) playerTime += delta
      else playerTime = 0
      if (value < 50) gopnikTime += delta
      else gopnikTime = 0

      setPosition(value)
      setPlayerHold(playerTime)
      setGopnikHold(gopnikTime)

      if (!finished.current && playerTime >= 5) {
        finished.current = true
        onFinishRef.current(true)
        return
      }
      if (!finished.current && gopnikTime >= 5) {
        finished.current = true
        onFinishRef.current(false)
        return
      }
      frame = requestAnimationFrame(update)
    }

    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [countdown])

  const push = () => {
    if (!finished.current) {
      positionRef.current = Math.min(100, positionRef.current + 11)
      setPosition(positionRef.current)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.72)', fontFamily: 'Arial,sans-serif', color: 'white' }}>
      <div style={{ width: 'min(620px, 100%)', padding: 26, borderRadius: 14, background: 'rgba(20,20,23,.98)', border: '2px solid #a88b65', boxShadow: '0 12px 40px #0009', textAlign: 'center' }}>
        <div style={{ color: '#e4b77c', fontSize: 13, letterSpacing: 2, marginBottom: 10 }}>ОТБЕРИ СВОЮ МОБИЛКУ У ГОПНИКА</div>
        <div style={{ fontSize: 21, fontWeight: 'bold', marginBottom: 28 }}>Нажимай на кнопку, чтобы толкать телефон на свою сторону!</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}><span>СТОРОНА ГОПНИКА</span><span>ТВОЯ СТОРОНА</span></div>
        <div style={{ position: 'relative', height: 30, borderRadius: 20, background: 'linear-gradient(90deg,#a88b65 0%,#a88b65 49.5%,#5376a0 50.5%,#5376a0 100%)', border: '2px solid #ded4c3', margin: '0 4px 18px' }}>
          <img src={phoneImage} alt="Телефон" style={{ position: 'absolute', top: -19, left: `${position}%`, width: 38, height: 58, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px #000b)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '50%', top: -5, bottom: -5, width: 3, background: '#fff', transform: 'translateX(-50%)' }} />
        </div>
        <div style={{ minHeight: 24, color: '#d4c7b5', marginBottom: 14, fontSize: 14 }}>Твоя сторона: {Math.max(0, 5 - playerHold).toFixed(1)} сек. · Гопник: {Math.max(0, 5 - gopnikHold).toFixed(1)} сек.</div>
        <button onClick={push} style={{ width: '100%', padding: '18px 16px', borderRadius: 9, border: '1px solid #d9b681', background: '#8a5938', color: 'white', fontSize: 20, fontWeight: 'bold', cursor: 'pointer', touchAction: 'manipulation' }}>ОТБИРАЙ МОБИЛКУ!</button>
      </div>
      {countdown !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.82)', fontSize: 'clamp(96px, 24vw, 190px)', fontWeight: 900, color: '#ffdf8c', textShadow: '0 8px 28px #000' }}>
          {countdown === 'GO' ? 'GO!' : countdown}
        </div>
      )}
    </div>
  )
}

useGLTF.preload(grandpaModelUrl)
useGLTF.preload(grandpaCarModelUrl)

function Grandpa({ defeated }: { defeated: boolean }) {
  const characterGroup = useRef<THREE.Group>(null)
  const { scene } = useGLTF(grandpaModelUrl)
  const model = useMemo(() => {
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return scene
  }, [scene])

  return (
    <group position={[3.5, 0, GRANDPA_Z]}>
      <group
        ref={characterGroup}
        position={[-0.5, -4.25, -0.5]}
        rotation={[0, Math.PI + Math.PI / 2, 0]}
      >
        <group scale={0.0132}>
          <primitive object={model} position={[-4.825, 106.42, 86.765]} />
        </group>
      </group>

      <Car
        position={[0.8, 0, 0]}
        modelUrl={grandpaCarModelUrl}
        scale={1.26}
        rotationY={0}
        offset={[-0.075, 0.02, 0.29]}
      />

      {!defeated && (
        <Text
          position={[-0.5, 2.7, 0.5]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          outlineWidth={0.02}
          outlineColor="#222222"
        >
          Помоги, сынок!
        </Text>
      )}
    </group>
  )
}

function CobblestoneRoad() {
  const texture = useLoader(THREE.TextureLoader, cobblestoneImage)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.repeat.set(4.5, 67.5)
  texture.needsUpdate = true

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.075, -85]}
      receiveShadow
    >
      <planeGeometry args={[11, STREET_LENGTH]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  )
}

function Street({ defeated, grandpaHelped, onBarDoorClick }: {
  defeated: boolean
  grandpaHelped: boolean
  onBarDoorClick: () => void
}) {
  const { camera } = useThree()
  const [barDoorHintVisible, setBarDoorHintVisible] = useState(true)
  const wallTexture = useLoader(THREE.TextureLoader, wallImage)
  wallTexture.wrapS = THREE.RepeatWrapping
  wallTexture.wrapT = THREE.RepeatWrapping
  wallTexture.magFilter = THREE.NearestFilter
  wallTexture.minFilter = THREE.NearestFilter
  wallTexture.colorSpace = THREE.SRGBColorSpace
  wallTexture.repeat.set(6, 2)
  wallTexture.needsUpdate = true

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBarDoorHintVisible(visible => !visible)
    }, 450)
    return () => window.clearInterval(timer)
  }, [])

  const buildingColors = [
    '#a99079',
    '#b28c79',
    '#9d7770',
    '#c0a68b',
    '#947e70',
    '#b49a80',
  ]

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.2, -85]}
        receiveShadow
      >
        <planeGeometry args={[100, 500]} />
        <meshStandardMaterial color="#77776e" />
      </mesh>

      {/* Вместо обычного асфальта теперь брусчатка */}
      <CobblestoneRoad />

      {[-7.5, 7.5].map(x => (
        <mesh
          key={x}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, -0.02, -85]}
          receiveShadow
        >
          <planeGeometry args={[4, STREET_LENGTH]} />
          <meshStandardMaterial color="#898176" />
        </mesh>
      ))}

      {[-1, 1].map(side =>
        Array.from({ length: 15 }, (_, i) => (
          <Building
            key={`${side}-${i}`}
            side={side}
            z={-i * 11 - 10}
            height={12 + ((i * 7) % 9)}
            color={buildingColors[(i + (side === 1 ? 2 : 0)) % buildingColors.length]}
            index={i}
          />
        )),
      )}

      <Car
        position={[4.7, 0, -15]}
        modelUrl={lada2107ModelUrl}
        scale={1.44}
        rotationY={Math.PI}
        offset={[0, 0, 0]}
      />
      <Car
        position={[4.7, 0, -32]}
        modelUrl={ae86ModelUrl}
        scale={1.44}
        rotationY={0}
        offset={[0, 0.03, 0.07]}
        hideLabel
      />
      <Car
        position={[4.7, 0, -49]}
        modelUrl={corvetteModelUrl}
        scale={1.296}
        rotationY={Math.PI}
        offset={[0, 0, 0.01]}
      />
      <Car
        position={[4.7, 0, -66]}
        modelUrl={fordFocusModelUrl}
        scale={1.368}
        rotationY={Math.PI / 2}
        offset={[-0.185, 1.2, -0.155]}
      />
      <RoadsideModel
        modelUrl={dogPoopingModelUrl}
        position={[DOG_X, -0.38, DOG_Z]}
        targetHeight={1.15}
        rotationY={-Math.PI / 9}
      />
      <Car
        position={[4.7, 0, -80]}
        modelUrl={zaporojecModelUrl}
        scale={1.512}
        rotationY={Math.PI}
        offset={[0.02, 0.81, -0.03]}
      />

      {Array.from({ length: 12 }, (_, i) => (
        <StreetLamp
          key={i}
          position={[i % 2 === 0 ? -5.5 : 5.5, 0, -12 - i * 14.5]}
          rotationY={i % 2 === 0 ? 0 : Math.PI}
        />
      ))}

      <mesh position={[0, 3, -5]}>
        <boxGeometry args={[30, 8, 1]} />
        <meshStandardMaterial map={wallTexture} roughness={1} />
      </mesh>

      <Gopnik defeated={defeated} />
      <Grandpa defeated={grandpaHelped} />
      <RoadsideModel
        modelUrl={policemanModelUrl}
        position={[POLICEMAN_X, 0, POLICEMAN_Z]}
        targetHeight={2.91005}
        rotationY={0}
      />
      <RoadsideModel
        modelUrl={girlModelUrl}
        position={[GIRL_X, 0, GIRL_Z]}
        targetHeight={2.618}
        rotationY={0}
      />
      <RoadsideModel
        modelUrl={dogPeeModelUrl}
        position={[-4.6, 0, -127.45]}
        targetHeight={1.1025}
        rotationY={Math.PI / 2}
      />

      <group position={[0, 0, -146]}>
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
          <boxGeometry args={[14, 10, 5]} />
          <meshStandardMaterial map={wallTexture} color="#bb8569" roughness={1} />
        </mesh>

        {/* Framed, dark recessed entrance with a rounded top */}
        <mesh position={[0, 3.3, 2.57]} castShadow>
          <boxGeometry args={[3.25, 5.1, 0.16]} />
          <meshStandardMaterial color="#191918" roughness={0.85} />
        </mesh>
        <mesh position={[-1.72, 3.35, 2.7]} castShadow>
          <boxGeometry args={[0.24, 5.25, 0.28]} />
          <meshStandardMaterial color="#4a3328" roughness={0.8} />
        </mesh>
        <mesh position={[1.72, 3.35, 2.7]} castShadow>
          <boxGeometry args={[0.24, 5.25, 0.28]} />
          <meshStandardMaterial color="#4a3328" roughness={0.8} />
        </mesh>
        <mesh position={[0, 5.98, 2.7]}>
          <torusGeometry args={[1.72, 0.16, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#4a3328" roughness={0.8} />
        </mesh>
        <mesh position={[-0.82, 3.2, 2.68]}>
          <boxGeometry args={[1.55, 4.7, 0.04]} />
          <meshStandardMaterial color="#263039" metalness={0.2} roughness={0.35} />
        </mesh>
        <mesh position={[0.82, 3.2, 2.68]}>
          <boxGeometry args={[1.55, 4.7, 0.04]} />
          <meshStandardMaterial color="#263039" metalness={0.2} roughness={0.35} />
        </mesh>
        <mesh position={[0, 3.2, 2.72]}>
          <boxGeometry args={[0.08, 4.65, 0.06]} />
          <meshStandardMaterial color="#735641" metalness={0.35} />
        </mesh>
        <mesh position={[-0.15, 2.9, 2.79]}>
          <boxGeometry args={[0.08, 0.72, 0.08]} />
          <meshStandardMaterial color="#ba9769" metalness={0.65} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.2, 3.05]} castShadow receiveShadow>
          <boxGeometry args={[4.25, 0.35, 1.25]} />
          <meshStandardMaterial color="#55463b" roughness={1} />
        </mesh>
        <mesh position={[0, 0.48, 2.82]} castShadow>
          <boxGeometry args={[3.6, 0.22, 0.72]} />
          <meshStandardMaterial color="#76604d" roughness={1} />
        </mesh>
        <mesh
          position={[0, 3.25, 3.12]}
          onClick={event => {
            event.stopPropagation()
            const distance = Math.hypot(
              camera.position.x - BAR_DOOR_X,
              camera.position.z - BAR_DOOR_Z,
            )
            if (distance <= BAR_DOOR_INTERACTION_RADIUS) onBarDoorClick()
          }}
        >
          <boxGeometry args={[4.8, 6.5, 0.12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 5.7, 3.35]} fontSize={0.38} color="#ffdb57" anchorX="center" outlineWidth={0.03} outlineColor="#211915" visible={barDoorHintVisible}>
          ТЫК ПО ДВЕРИ БАРА
        </Text>

        {/* Barred street-facing windows */}
        {[-1, 1].map(side => (
          <group key={`bar-window-${side}`} position={[side * 4.55, 4.75, 2.58]}>
            <mesh castShadow>
              <boxGeometry args={[2.55, 3.35, 0.22]} />
              <meshStandardMaterial color="#594438" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.13]}>
              <boxGeometry args={[2.25, 3.05, 0.05]} />
              <meshStandardMaterial color="#243039" metalness={0.15} roughness={0.4} />
            </mesh>
            {[-0.7, 0, 0.7].map(x => (
              <mesh key={`v-${x}`} position={[x, 0, 0.2]}>
                <boxGeometry args={[0.075, 3.15, 0.08]} />
                <meshStandardMaterial color="#aaa08d" metalness={0.55} roughness={0.45} />
              </mesh>
            ))}
            {[-0.65, 0, 0.65].map(y => (
              <mesh key={`h-${y}`} position={[0, y, 0.2]}>
                <boxGeometry args={[2.35, 0.075, 0.08]} />
                <meshStandardMaterial color="#aaa08d" metalness={0.55} roughness={0.45} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Striped canopy over the arched doorway */}
        <mesh position={[0, 7.72, 3.36]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[6.8, 0.2, 1.65]} />
          <meshStandardMaterial color="#302d2a" roughness={0.8} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={`awning-stripe-${i}`} position={[-3.06 + i * 0.68, 7.38, 4.12]}>
            <boxGeometry args={[0.64, 0.5, 0.12]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#642f2a' : '#c2aa8b'} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[-3.1, 7.42, 3.48]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.12, 1.15, 0.12]} />
          <meshStandardMaterial color="#342d29" metalness={0.4} />
        </mesh>
        <mesh position={[3.1, 7.42, 3.48]} rotation={[0, 0, 0.55]}>
          <boxGeometry args={[0.12, 1.15, 0.12]} />
          <meshStandardMaterial color="#342d29" metalness={0.4} />
        </mesh>

        {/* Old signboard and overhead utility cables */}
        <mesh position={[0, 9.02, 2.66]} castShadow>
          <boxGeometry args={[8.4, 1.12, 0.25]} />
          <meshStandardMaterial color="#34251f" roughness={0.85} />
        </mesh>
        <Text
          position={[0, 9.04, 2.82]}
          fontSize={0.62}
          color="#ffe0a2"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.018}
          outlineColor="#211915"
        >
          УСЫ НА ПЕНЕ
        </Text>
        <Text position={[0, 8.63, 2.82]} fontSize={0.18} color="#c8b29a" anchorX="center">
          БАР · КАФЕ
        </Text>
        {[9.65, 9.88, 10.1].map((y, i) => (
          <mesh key={`bar-wire-${i}`} position={[0, y, 2.67]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 14.2, 5]} />
            <meshStandardMaterial color="#211f1d" metalness={0.35} roughness={0.75} />
          </mesh>
        ))}
        <mesh position={[0, 8.15, 3.05]}>
          <sphereGeometry args={[0.15, 8, 6]} />
          <meshStandardMaterial color="#ffd09a" emissive="#ff9a4d" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, 8.1, 3.5]} color="#ffb16c" intensity={12} distance={12} decay={2} />
      </group>
    </>
  )
}

function PlayerControls({
  paused,
  resetSignal,
  onGopnikEncounter,
  onGrandpaEncounter,
  onPolicemanEncounter,
  onGirlEncounter,
  onDogEncounter,
  gopnikDefeated,
  gopnikResolved,
  grandpaHelped,
  policemanResolved,
  girlResolved,
  dogResolved,
}: {
  paused: boolean
  resetSignal: number
  onGopnikEncounter: () => void
  onGrandpaEncounter: () => void
  onPolicemanEncounter: () => void
  onGirlEncounter: () => void
  onDogEncounter: () => void
  gopnikDefeated: boolean
  gopnikResolved: boolean
  grandpaHelped: boolean
  policemanResolved: boolean
  girlResolved: boolean
  dogResolved: boolean
}) {
  const { camera } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const gopnikTriggered = useRef(false)
  const grandpaTriggered = useRef(false)
  const policemanTriggered = useRef(false)
  const girlTriggered = useRef(false)
  const dogTriggered = useRef(false)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.code] = true
    }

    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false
    }

    const resetKeys = () => {
      keys.current = {}
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', resetKeys)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', resetKeys)
    }
  }, [])

  useEffect(() => {
    if (resetSignal === 0) return

    camera.position.set(0, 2, 12)
    camera.lookAt(0, 2, -100)
    keys.current = {}

    gopnikTriggered.current = false
    grandpaTriggered.current = false
    policemanTriggered.current = false
    girlTriggered.current = false
    dogTriggered.current = false
  }, [resetSignal, camera])

  useFrame((_, delta) => {
    if (paused) return

    if (
      DIALOGUE_INTERACTIONS_ENABLED &&
      !gopnikDefeated &&
      !gopnikTriggered.current &&
      camera.position.z <= GOPNIK_Z + 5
    ) {
      gopnikTriggered.current = true
      keys.current = {}

      camera.position.y = 2
      camera.lookAt(-4.5, 1.8, GOPNIK_Z)

      onGopnikEncounter()
      return
    }

    const distanceToPoliceman = Math.hypot(
      camera.position.x - POLICEMAN_X,
      camera.position.z - POLICEMAN_Z,
    )
    if (
      POLICEMAN_INTERACTION_ENABLED &&
      !policemanResolved &&
      !policemanTriggered.current &&
      distanceToPoliceman <= 5
    ) {
      policemanTriggered.current = true
      keys.current = {}
      camera.lookAt(POLICEMAN_X, 1.5, POLICEMAN_Z)
      onPolicemanEncounter()
      return
    }

    const distanceToDog = Math.hypot(
      camera.position.x - DOG_X,
      camera.position.z - DOG_Z,
    )
    if (!dogResolved && !dogTriggered.current && distanceToDog <= DOG_DIALOGUE_RADIUS) {
      dogTriggered.current = true
      keys.current = {}
      camera.lookAt(DOG_X, 0.8, DOG_Z)
      onDogEncounter()
      return
    }

    const distanceToGirl = Math.hypot(
      camera.position.x - GIRL_X,
      camera.position.z - GIRL_Z,
    )
    if (!girlResolved && !girlTriggered.current && distanceToGirl <= GIRL_DIALOGUE_RADIUS) {
      girlTriggered.current = true
      keys.current = {}
      camera.lookAt(GIRL_X, 1.5, GIRL_Z)
      onGirlEncounter()
      return
    }

    if (
      DIALOGUE_INTERACTIONS_ENABLED &&
      gopnikResolved &&
      !grandpaHelped &&
      !grandpaTriggered.current &&
      camera.position.z <= GRANDPA_Z + 5
    ) {
      grandpaTriggered.current = true
      keys.current = {}
      camera.lookAt(3.5, -3.1, GRANDPA_Z - 0.5)
      onGrandpaEncounter()
      return
    }

    const speed = 12
    const direction = new THREE.Vector3()

    camera.getWorldDirection(direction)
    direction.y = 0
    direction.normalize()

    const right = new THREE.Vector3()
      .crossVectors(direction, camera.up)
      .normalize()

    const move = new THREE.Vector3()
    if (keys.current['KeyW'] || keys.current['ArrowUp']) move.add(direction)
    if (keys.current['KeyS'] || keys.current['ArrowDown']) move.sub(direction)
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) move.addScaledVector(right, -1)
    if (keys.current['KeyD'] || keys.current['ArrowRight']) move.add(right)

    const nextX = THREE.MathUtils.clamp(camera.position.x + move.x * speed * delta, -4.5, 4.5)
    const nextZ = THREE.MathUtils.clamp(camera.position.z + move.z * speed * delta, -142, -6)
    if (!intersectsCar(nextX, nextZ)) {
      camera.position.x = nextX
      camera.position.z = nextZ
    } else {
      // Let the player slide along the body instead of getting stuck against it.
      const slideX = THREE.MathUtils.clamp(camera.position.x + move.x * speed * delta, -4.5, 4.5)
      if (!intersectsCar(slideX, camera.position.z)) camera.position.x = slideX

      const slideZ = THREE.MathUtils.clamp(camera.position.z + move.z * speed * delta, -142, -6)
      if (!intersectsCar(camera.position.x, slideZ)) camera.position.z = slideZ
    }

    camera.position.y = 2
  })

  // Drei's PointerLockControls keeps a document-level click handler mounted
  // even when `enabled` is false. A dialogue button can therefore relock the
  // pointer on click; unmount the controls while gameplay is paused instead.
  return paused ? null : <PointerLockControls />
}

export default function App() {
  const [challengeActive, setChallengeActive] = useState(false)
  const [gopnikDuelActive, setGopnikDuelActive] = useState(false)
  const [gopnikRulesActive, setGopnikRulesActive] = useState(false)
  const [gopnikNotice, setGopnikNotice] = useState('')
  const [policeDialogueActive, setPoliceDialogueActive] = useState(false)
  const [policeQuizActive, setPoliceQuizActive] = useState(false)
  const [policeQuizComplete, setPoliceQuizComplete] = useState(false)
  const [policeQuestionIndex, setPoliceQuestionIndex] = useState(0)
  const [policeBalance, setPoliceBalance] = useState(10000)
  const [policeEndingStep, setPoliceEndingStep] = useState<0 | 1 | 2 | 3 | null>(null)
  const [policeHighBalance, setPoliceHighBalance] = useState(false)
  const [policemanResolved, setPolicemanResolved] = useState(false)
  const [girlDialogueStep, setGirlDialogueStep] = useState<0 | 1 | 2 | null>(null)
  const [girlResolved, setGirlResolved] = useState(false)
  const [dogDialogueActive, setDogDialogueActive] = useState(false)
  const [dogResolved, setDogResolved] = useState(false)
  const [barDoorDialogActive, setBarDoorDialogActive] = useState(false)
  const [grandpaActive, setGrandpaActive] = useState(false)
  const [miniGameActive, setMiniGameActive] = useState(false)
  const [exchangeStep, setExchangeStep] = useState<0 | 1 | null>(null)
  const [defeated, setDefeated] = useState(false)
  const [gopnikResolved, setGopnikResolved] = useState(false)
  const [grandpaHelped, setGrandpaHelped] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [message, setMessage] = useState('')

  const paused = challengeActive || gopnikDuelActive || gopnikRulesActive || gopnikNotice !== '' || policeDialogueActive || policeQuizActive || policeEndingStep !== null || barDoorDialogActive || girlDialogueStep !== null || dogDialogueActive || grandpaActive || miniGameActive || exchangeStep !== null

  useEffect(() => {
    document.exitPointerLock()
  }, [paused])

  const startGopnikChallenge = () => {
    setMessage('')
    setChallengeActive(true)
  }

  const startGrandpaChallenge = () => {
    setMessage('')
    setGrandpaActive(true)
  }

  const startPoliceEncounter = () => {
    setMessage('')
    setPoliceDialogueActive(true)
  }

  const startGirlEncounter = () => {
    setMessage('')
    setGirlDialogueStep(0)
  }

  const closeGirlDialogue = () => {
    setGirlDialogueStep(null)
    setGirlResolved(true)
  }

  const startDogEncounter = () => {
    setMessage('')
    setDogDialogueActive(true)
  }

  const closeDogDialogue = () => {
    setDogDialogueActive(false)
    setDogResolved(true)
  }

  const showPoliceDocuments = () => {
    setPoliceDialogueActive(false)
    setPoliceBalance(10000)
    setPoliceQuestionIndex(0)
    setPoliceQuizComplete(false)
    setPoliceQuizActive(true)
  }

  const answerPoliceQuestion = (answerIndex: number) => {
    if (answerIndex !== POLICE_QUESTIONS[policeQuestionIndex].correct) {
      setPoliceBalance(balance => Math.max(0, balance - 2000))
    }

    if (policeQuestionIndex === POLICE_QUESTIONS.length - 1) {
      setPoliceQuizComplete(true)
    } else {
      setPoliceQuestionIndex(index => index + 1)
    }
  }

  const finishPoliceQuiz = () => {
    setPoliceQuizActive(false)
    setPoliceQuizComplete(false)
    setPolicemanResolved(true)
    setPoliceHighBalance(policeBalance >= 8000)
    setPoliceEndingStep(0)
  }

  const closeBarDoorDialog = () => {
    setBarDoorDialogActive(false)
  }

  const advancePoliceEnding = () => {
    if (policeEndingStep === 0) {
      setPoliceEndingStep(1)
      return
    }
    if (policeEndingStep === 1) {
      if (!policeHighBalance) setPoliceBalance(0)
      setPoliceEndingStep(2)
      return
    }
    if (policeEndingStep === 2) {
      if (policeHighBalance) {
        setPoliceEndingStep(null)
        return
      }
      setPoliceEndingStep(3)
      return
    }

    setPoliceEndingStep(null)
  }

  const chooseGopnikAnswer = (answer: number) => {
    setChallengeActive(false)
    setGopnikResolved(true)
    if (answer === 0) {
      setGopnikNotice('Ну ты и лох, только вышел на улицу, а уже остался без мобилы.')
      window.setTimeout(() => {
        setGopnikNotice('')
        setDefeated(false)
        setGopnikResolved(false)
        setGrandpaHelped(false)
        setGrandpaActive(false)
        setMiniGameActive(false)
        setExchangeStep(null)
        setMessage('')
        setResetSignal(value => value + 1)
      }, 3000)
    } else {
      setGopnikNotice('У ВАС ОТОБРАЛИ ТЕЛЕФОН!!!')
      window.setTimeout(() => {
        setGopnikNotice('')
        setGopnikRulesActive(true)
      }, 2000)
    }
  }

  const startGopnikDuel = () => {
    setGopnikRulesActive(false)
    setGopnikDuelActive(true)
  }

  const finishGopnikDuel = (won: boolean) => {
    setGopnikDuelActive(false)
    setGopnikResolved(true)
    if (won) setDefeated(true)
    setGopnikNotice(won
      ? 'Ты отобрал свою мобилку!'
      : 'Ты не отобрал свою мобилку.')
    window.setTimeout(() => {
      setGopnikNotice('')
      if (!won) {
        setDefeated(false)
        setGopnikResolved(false)
        setGrandpaHelped(false)
        setGrandpaActive(false)
        setMiniGameActive(false)
        setExchangeStep(null)
        setMessage('')
        setResetSignal(value => value + 1)
      }
    }, 3000)
  }

  const startPartsGame = () => {
    document.exitPointerLock()
    setGrandpaActive(false)
    setMiniGameActive(true)
  }

  const finishMiniGame = (success: boolean) => {
    if (!success) return

    document.exitPointerLock()
    setGrandpaHelped(true)
    setMiniGameActive(false)
    setExchangeStep(0)
  }

  const continueGrandpaExchange = () => {
    if (exchangeStep === 0) {
      document.exitPointerLock()
      setExchangeStep(1)
      return
    }

    document.exitPointerLock()
    setExchangeStep(null)
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#777985',
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 2, 12], fov: 65, near: 0.1, far: 500 }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      >
        <color attach="background" args={['#454b62']} />
        <fog attach="fog" args={['#454b62', 55, 280]} />

        <ambientLight color="#b5bfdc" intensity={0.55} />

        <directionalLight
          position={[-30, 40, 20]}
          color="#aab7dc"
          intensity={0.7}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Street
          defeated={defeated}
          grandpaHelped={grandpaHelped}
          onBarDoorClick={() => {
            setBarDoorDialogActive(true)
          }}
        />

        <PlayerControls
          paused={paused}
          resetSignal={resetSignal}
          onGopnikEncounter={startGopnikChallenge}
          onGrandpaEncounter={startGrandpaChallenge}
          onPolicemanEncounter={startPoliceEncounter}
          onGirlEncounter={startGirlEncounter}
          onDogEncounter={startDogEncounter}
          gopnikDefeated={defeated}
          gopnikResolved={gopnikResolved}
          grandpaHelped={grandpaHelped}
          policemanResolved={policemanResolved}
          girlResolved={girlResolved}
          dogResolved={dogResolved}
        />
      </Canvas>

      {challengeActive && (
        <div
          style={{
            position: 'fixed',
            zIndex: 99999,
            bottom: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: 600,
            padding: 24,
            background: 'rgba(20,20,23,.98)',
            border: '2px solid #a88b65',
            borderRadius: 12,
            color: 'white',
            fontFamily: 'Arial,sans-serif',
            boxShadow: '0 8px 30px rgba(0,0,0,.5)',
          }}
        >
          <div
            style={{
              color: '#e4b77c',
              fontSize: 13,
              letterSpacing: 2,
              marginBottom: 10,
            }}
          >
            НЕЗНАКОМЕЦ
          </div>

          <div style={{ fontSize: 23, fontWeight: 'bold', marginBottom: 20 }}>
            Слышь, дай позвонить.
          </div>

          {message ? (
            <div style={{ fontSize: 19, color: '#f2c58e', padding: '12px 0' }}>
              {message}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Держи, только быстро, я тороплюсь к другу на день рождения',
                'Нет, я тебе ничего не дам',
              ].map((answer, index) => (
                <button
                  key={answer}
                  onClick={() => chooseGopnikAnswer(index)}
                  style={{
                    padding: 14,
                    borderRadius: 7,
                    border: '1px solid #88745e',
                    background: '#393532',
                    color: 'white',
                    fontSize: 16,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {index + 1}. {answer}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {gopnikDuelActive && (
        <GopnikDuelGame onFinish={finishGopnikDuel} />
      )}

      {gopnikRulesActive && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.76)', fontFamily: 'Arial,sans-serif', color: 'white' }}>
          <div style={{ width: 'min(620px, 100%)', padding: 28, borderRadius: 14, background: 'rgba(20,20,23,.98)', border: '2px solid #a88b65', boxShadow: '0 12px 40px #0009' }}>
            <div style={{ color: '#e4b77c', fontSize: 13, letterSpacing: 2, marginBottom: 10 }}>ПРАВИЛА МИНИ-ИГРЫ</div>
            <h2 style={{ margin: '0 0 18px', fontSize: 26 }}>Отбери свою мобилку у гопника</h2>
            <div style={{ fontSize: 18, lineHeight: 1.55, marginBottom: 24 }}>
              <p style={{ margin: '0 0 10px' }}>Быстро нажимай на кнопку, чтобы толкать телефон на свою сторону.</p>
              <p style={{ margin: '0 0 10px' }}>Если телефон пробудет на твоей стороне 5 секунд — ты отобрал свой телефон.</p>
              <p style={{ margin: 0 }}>Если телефон пробудет на стороне гопника 5 секунд — то мобила больше не твоя((.</p>
            </div>
            <button onClick={startGopnikDuel} style={{ width: '100%', padding: 15, borderRadius: 8, border: '1px solid #d9b681', background: '#8a5938', color: 'white', fontSize: 19, fontWeight: 'bold', cursor: 'pointer' }}>СТАРТ</button>
          </div>
        </div>
      )}

      {gopnikNotice && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.72)', fontFamily: 'Arial,sans-serif' }}>
          <div style={{ width: 'min(620px, 100%)', padding: 28, borderRadius: 14, background: 'rgba(20,20,23,.98)', border: '2px solid #a88b65', color: '#f2c58e', boxShadow: '0 12px 40px #0009', textAlign: 'center', fontSize: 23, lineHeight: 1.5 }}>
            {gopnikNotice}
          </div>
        </div>
      )}

      {policeDialogueActive && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.72)', fontFamily: 'Arial,sans-serif' }}>
          <div style={{ width: 'min(680px, 100%)', padding: 26, borderRadius: 14, background: 'rgba(20,20,23,.98)', border: '2px solid #a88b65', color: 'white', boxShadow: '0 12px 40px #0009' }}>
            <div style={{ color: '#e4b77c', fontSize: 13, letterSpacing: 2, marginBottom: 12 }}>ПОЛИЦЕЙСКИЙ</div>
            <div style={{ fontSize: 22, lineHeight: 1.55, marginBottom: 20 }}>
              Здравия желаю, товарищ гражданин. Куда торопимся? Документики в развёрнутом виде показываем.
            </div>
            <button onClick={showPoliceDocuments} style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer' }}>
              Протянуть документы
            </button>
          </div>
        </div>
      )}

      {policeQuizActive && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.78)', fontFamily: 'Arial,sans-serif', color: 'white' }}>
          <div style={{ width: 'min(760px, 100%)', padding: 26, borderRadius: 14, background: 'rgba(20,20,23,.98)', border: '2px solid #a88b65', boxShadow: '0 12px 40px #0009' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22, color: '#e4b77c', fontSize: 17, fontWeight: 'bold' }}>
              <span>ПРОВЕРКА ЗНАНИЯ ЗАКОНОВ</span>
              <span>БАЛАНС: {policeBalance.toLocaleString('ru-RU')} ₽</span>
            </div>
            {policeQuizComplete ? (
              <>
                <div style={{ fontSize: 23, lineHeight: 1.5, marginBottom: 22 }}>
                  Проверка окончена. Остаток: {policeBalance.toLocaleString('ru-RU')} ₽.
                </div>
                <button onClick={finishPoliceQuiz} style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer' }}>
                  Уйти дальше
                </button>
              </>
            ) : (
              <>
                <div style={{ color: '#c9b8a2', fontSize: 14, marginBottom: 10 }}>
                  ВОПРОС {policeQuestionIndex + 1} ИЗ {POLICE_QUESTIONS.length} · ЗА ОШИБКУ −2 000 ₽
                </div>
                <div style={{ fontSize: 21, lineHeight: 1.5, marginBottom: 20 }}>
                  {POLICE_QUESTIONS[policeQuestionIndex].prompt}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {POLICE_QUESTIONS[policeQuestionIndex].answers.map((answer, index) => (
                    <button key={answer} onClick={() => answerPoliceQuestion(index)} style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>
                      {index + 1}. {answer}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {policeEndingStep !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.72)', fontFamily: 'Arial,sans-serif' }}>
          <div style={{ width: 'min(680px, 100%)', padding: 26, borderRadius: 14, background: 'rgba(20,20,23,.98)', border: '2px solid #a88b65', color: 'white', boxShadow: '0 12px 40px #0009' }}>
            <div style={{ color: '#e4b77c', fontSize: 13, letterSpacing: 2, marginBottom: 12 }}>
              {policeEndingStep === 1 || policeEndingStep === 3 || (policeEndingStep === 2 && policeHighBalance) ? 'ТЫ' : 'ПОЛИЦЕЙСКИЙ'}
            </div>
            <div style={{ fontSize: 22, lineHeight: 1.55, marginBottom: 20 }}>
              {policeEndingStep === 0 && (policeHighBalance
                ? 'Эх, блин, информированный гражданин попался.'
                : 'Оп, пойду жинку порадую.')}
              {policeEndingStep === 1 && (policeHighBalance
                ? 'А в нынешнее время иначе никак.'
                : 'Давай-давай, оборотень в погонах.')}
              {policeEndingStep === 2 && (policeHighBalance
                ? 'Всё, давай, гуляй, гражданин начальник.'
                : 'Ещё одно слово — и поедешь на кичу.')}
              {policeEndingStep === 3 && !policeHighBalance && 'Да, да...'}
            </div>
            {policeEndingStep === 2 && !policeHighBalance && (
              <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 8, background: 'rgba(157,54,45,.28)', border: '1px solid #d36b5e', color: '#ffb1a6', fontWeight: 'bold', fontSize: 16 }}>
                БАЛАНС ОБНУЛЁН — полицейский забрал все деньги
              </div>
            )}
            <div style={{ color: '#e4b77c', fontSize: 15, marginBottom: 18 }}>
              Остаток денег: {policeBalance.toLocaleString('ru-RU')} ₽
            </div>
            <button onClick={advancePoliceEnding} style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer' }}>
              {policeEndingStep === 3 || (policeEndingStep === 2 && policeHighBalance) ? 'Уйти' : 'Дальше'}
            </button>
          </div>
        </div>
      )}

      {barDoorDialogActive && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100001, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.72)', fontFamily: 'Arial,sans-serif' }}>
          <div style={{ width: 'min(560px, 100%)', padding: 26, borderRadius: 14, background: 'rgba(20,20,23,.98)', border: '2px solid #a88b65', color: 'white', boxShadow: '0 12px 40px #0009' }}>
            <div style={{ color: '#e4b77c', fontSize: 13, letterSpacing: 2, marginBottom: 12 }}>ПРИГЛАШЕНИЕ В БАР</div>
            <div style={{ fontSize: 21, lineHeight: 1.6, marginBottom: 22 }}>
              <div>Вы приглашены на день рождения Дениса</div>
              <div>Оно пройдет 5 декабря (субботу) в пивном баре «Усы на Пене».</div>
              <div>Сбор в ... (будет сказано позже)</div>
            </div>
            <button onClick={closeBarDoorDialog} style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer' }}>Закрыть</button>
          </div>
        </div>
      )}

      {girlDialogueStep !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100002, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.72)', fontFamily: 'Arial,sans-serif' }}>
          <div style={{ width: 'min(640px, 100%)', padding: 26, borderRadius: 14, background: 'rgba(20,20,23,.98)', border: '2px solid #a88b65', color: 'white', boxShadow: '0 12px 40px #0009' }}>
            <div style={{ color: '#e4b77c', fontSize: 13, letterSpacing: 2, marginBottom: 12 }}>ДЕВУШКА У БАРА</div>
            {girlDialogueStep === 0 ? (
              <>
                <div style={{ fontSize: 22, lineHeight: 1.5, marginBottom: 20 }}>О, привет, а ты тут Данирку не видел(-а)?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => setGirlDialogueStep(1)} style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>Видел, а что?</button>
                  <button onClick={() => setGirlDialogueStep(2)} style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>Неа, не видел</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 21, lineHeight: 1.55, marginBottom: 20 }}>
                  {girlDialogueStep === 1
                    ? 'ООООО, передай тогда ему что я его искала, а то он чета шифруется.'
                    : 'Блин, ну тогда скажи что я его искала, и вообще я обижена него.'}
                </div>
                <button onClick={closeGirlDialogue} style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer' }}>Завершить диалог</button>
              </>
            )}
          </div>
        </div>
      )}

      {dogDialogueActive && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100003, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.72)', fontFamily: 'Arial,sans-serif' }}>
          <div style={{ width: 'min(560px, 100%)', padding: 26, borderRadius: 14, background: 'rgba(20,20,23,.98)', border: '2px solid #a88b65', color: 'white', boxShadow: '0 12px 40px #0009' }}>
            <div style={{ color: '#e4b77c', fontSize: 13, letterSpacing: 2, marginBottom: 12 }}>СОБАКА</div>
            <div style={{ fontSize: 22, lineHeight: 1.5, marginBottom: 20 }}>Гав — Гав</div>
            <button onClick={closeDogDialogue} style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>Погавкать в ответ</button>
          </div>
        </div>
      )}

      {grandpaActive && (
        <div
          style={{
            position: 'fixed',
            zIndex: 99999,
            bottom: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: 600,
            padding: 24,
            background: 'rgba(20,20,23,.96)',
            border: '2px solid #a88b65',
            borderRadius: 12,
            color: 'white',
            fontFamily: 'Arial,sans-serif',
            boxShadow: '0 8px 30px rgba(0,0,0,.5)',
          }}
        >
          <div style={{ color: '#e4b77c', fontSize: 13, letterSpacing: 2, marginBottom: 10 }}>
            ДЕД У «ЧЕРТОВКИ»
          </div>

          <div style={{ fontSize: 19, lineHeight: 1.55, marginBottom: 20 }}>
            Я случайно закинул болты с гайками в общую кучу, и теперь мне надо достать их оттуда. Помоги мне, и я тебя отпущу.
          </div>

          <button
            onClick={startPartsGame}
            style={{
              padding: 14,
              borderRadius: 7,
              border: '1px solid #88745e',
              background: '#393532',
              color: 'white',
              fontSize: 16,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Помочь деду
          </button>
        </div>
      )}

      {exchangeStep !== null && (
        <div
          style={{
            position: 'fixed',
            zIndex: 99999,
            bottom: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: 680,
            padding: 24,
            background: 'rgba(20,20,23,.97)',
            border: '2px solid #a88b65',
            borderRadius: 12,
            color: 'white',
            fontFamily: 'Arial,sans-serif',
            boxShadow: '0 8px 30px rgba(0,0,0,.5)',
          }}
        >
          <div style={{ color: '#e4b77c', fontSize: 13, letterSpacing: 2, marginBottom: 10 }}>
            {exchangeStep === 0 ? 'ТЫ' : 'ДЕД'}
          </div>
          <div style={{ fontSize: 20, lineHeight: 1.55, marginBottom: 20 }}>
            {exchangeStep === 0
              ? 'Вот, держи старый, больше не буду помогать тебе.'
              : 'Да, я видел, что ты просыпал несколько моих винтиков. Так что это не ты мне не поможешь, а я тебя больше ни о чём не попрошу. Ступай с Богом.'}
          </div>
          <button
            onClick={continueGrandpaExchange}
            style={{ padding: 14, borderRadius: 7, border: '1px solid #88745e', background: '#393532', color: 'white', fontSize: 16, cursor: 'pointer' }}
          >
            {exchangeStep === 0 ? 'Ответить деду' : 'Пойти дальше'}
          </button>
        </div>
      )}

      {miniGameActive && (
        <HardwareCatchGame onComplete={finishMiniGame} />
      )}

      {message && !challengeActive && !grandpaActive && !miniGameActive && (
        <div
          style={{
            position: 'absolute',
            zIndex: 6,
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(20,20,23,.9)',
            color: '#f2c58e',
            padding: 18,
            borderRadius: 10,
            fontFamily: 'Arial,sans-serif',
            fontSize: 19,
          }}
        >
          {message}
        </div>
      )}

      {!paused && !defeated && (
        <div
          style={{
            position: 'absolute',
            top: 15,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            background: 'rgba(0,0,0,.45)',
            padding: '9px 16px',
            borderRadius: 6,
            fontFamily: 'Arial,sans-serif',
            fontSize: 14,
            zIndex: 2,
          }}
        >
          WASD — движение · Мышь — обзор
        </div>
      )}
    </div>
  )
}
