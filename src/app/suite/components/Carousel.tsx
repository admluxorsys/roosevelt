'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, PanInfo, useAnimationFrame } from 'framer-motion';
import { OrbNode } from './OrbNode';
import { SUITE_NODES } from '../constants';
import { CentralVideo } from './CentralVideo';

const RADIUS_X = 1100;
const RADIUS_Z = 700;
const PERSPECTIVE = 1200;
const CENTER_Z_INDEX = 700;

const AUTO_ROTATION_SPEED = -0.05;
const DRAG_SENSITIVITY = 0.15;
const MOMENTUM_FRICTION = 0.95;

export const Carousel = () => {
    const [rotation, setRotation] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [radius, setRadius] = useState({ x: RADIUS_X, z: RADIUS_Z });

    React.useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            const width = window.innerWidth;
            // Dynamic scaling of radius based on screen width
            const newRadiusX = Math.min(1100, width * 0.45);
            const newRadiusZ = Math.min(700, width * 0.3);
            setRadius({ x: newRadiusX, z: newRadiusZ });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const rotationRef = useRef(0);
    const velocityRef = useRef(0);
    const isDragging = useRef(false);

    useAnimationFrame(() => {
        if (isDragging.current) return;

        if (Math.abs(velocityRef.current) > 0.01) {
            rotationRef.current += velocityRef.current;
            velocityRef.current *= MOMENTUM_FRICTION;
        } else {
            rotationRef.current += AUTO_ROTATION_SPEED;
        }

        setRotation(rotationRef.current);
    });

    const nodesWithPosition = SUITE_NODES.map((node, index) => {
        const angleDeg = (360 / SUITE_NODES.length) * index + rotation;
        const angleRad = (angleDeg * Math.PI) / 180;

        const xRaw = Math.sin(angleRad) * radius.x;
        const zRaw = Math.cos(angleRad) * radius.z;

        const scaleFactor = (zRaw + PERSPECTIVE) / PERSPECTIVE;
        const zIndex = Math.round(zRaw + CENTER_Z_INDEX);
        const opacity = Math.max(0.4, (zRaw + radius.z) / (2 * radius.z) + 0.3);

        // Tilt effect: front items (positive z) move lower
        const tiltOffset = zRaw * 0.2;
        
        return {
            ...node,
            x: xRaw,
            y: 120 + tiltOffset, // Reduced vertical spread to fit on screen
            z: zRaw,
            scale: scaleFactor,
            zIndex,
            opacity: Math.min(1, opacity)
        };
    });

    const handlePan = useCallback((_: any, info: PanInfo) => {
        const delta = info.delta.x * DRAG_SENSITIVITY;
        rotationRef.current += delta;
        velocityRef.current = delta;
        setRotation(rotationRef.current);
    }, []);

    const handlePanStart = () => {
        isDragging.current = true;
        setIsPaused(true);
        velocityRef.current = 0;
    };

    const handlePanEnd = (_: any, info: PanInfo) => {
        isDragging.current = false;
        setIsPaused(false);
        velocityRef.current = info.velocity.x * 0.01;
    };

    if (!mounted) return null;

    return (
        <div className="relative w-full h-full flex items-center justify-center perspective-[1200px]">
            {/* 1. INTERACTION LAYER: Move to background (z-0) so it doesn't block clicks */}
            <motion.div
                className="fixed inset-0 z-0 cursor-grab active:cursor-grabbing bg-transparent select-none"
                style={{ touchAction: 'none' }}
                onPan={handlePan}
                onPanStart={handlePanStart}
                onPanEnd={handlePanEnd}
            />

            {/* 2. CENTER VIDEO: Perfectly centered vertically */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
                style={{ zIndex: CENTER_Z_INDEX }}
            >
                <CentralVideo />
            </div>

            {/* 3. ORBITING NODES: Positioned lower in the orbit */}
            {nodesWithPosition.map((node) => (
                <motion.div
                    key={node.title}
                    className="absolute top-1/2 left-1/2 pointer-events-none"
                    style={{
                        zIndex: node.zIndex,
                    }}
                    initial={false}
                    animate={{
                        x: node.x,
                        y: node.y,
                        scale: node.scale,
                        opacity: node.opacity,
                    }}
                    transition={{ type: "tween", duration: 0 }}
                >
                    <div className="pointer-events-auto relative z-[1000] -translate-x-1/2 -translate-y-1/2">
                        <OrbNode
                            href={node.href}
                            icon={node.icon}
                            title={node.title}
                            subtitle={node.subtitle}
                            color={node.color}
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
