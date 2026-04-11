"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

export default function Background() {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none">
      <div className="w-full h-full">
        <ShaderGradientCanvas>
          <ShaderGradient
            animate="on"
            axesHelper="on"
            bgColor1="#000000"
            bgColor2="#000000"
            brightness={1.2}
            cAzimuthAngle={180}
            cDistance={2.41}
            cPolarAngle={95}
            cameraZoom={1}
            color1="#19332c"
            color2="#121417"
            color3="#12251F"
            destination="onCanvas"
            embedMode="off"
            envPreset="city"
            format="gif"
            fov={45}
            frameRate={10}
            gizmoHelper="hide"
            grain="off"
            lightType="3d"
            pixelDensity={1}
            positionX={0}
            positionY={0.1}
            positionZ={0}
            range="disabled"
            rangeEnd={40}
            rangeStart={0}
            reflection={0.1}
            rotationX={0}
            rotationY={0}
            rotationZ={-100}
            shader="defaults"
            type="plane"
            uAmplitude={0}
            uDensity={0.7}
            uFrequency={5.5}
            uSpeed={0.2}
            uStrength={3}
            uTime={0.2}
            wireframe={false}
          />
        </ShaderGradientCanvas>
      </div>
    </div>
  );
}
