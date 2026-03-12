'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, PanInfo, useAnimationFrame } from 'framer-motion';
// Reusing OrbNode from the suite components
import { OrbNode } from '../../components/OrbNode';
import { INITIAL_LIFE_NODES, ICON_MAP } from '../constants';
import { AddElementModal } from './AddElementModal';
import { CentralVideo } from '../../components/CentralVideo';

const RADIUS_X = 1100;
const RADIUS_Z = 700;
const PERSPECTIVE = 1200;
const CENTER_Z_INDEX = 700;

// Rotating to the right to match the main suite page format (original was right, changed then reverted)
const AUTO_ROTATION_SPEED = -0.05;
const DRAG_SENSITIVITY = 0.15;
const MOMENTUM_FRICTION = 0.95;

export const LifeCarousel = () => {
    const [rotation, setRotation] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [radius, setRadius] = useState({ x: RADIUS_X, z: RADIUS_Z });
    const [customNodes, setCustomNodes] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const allNodes = [
        ...INITIAL_LIFE_NODES,
        ...customNodes,
        {
            id: 'add-element',
            iconName: 'Plus',
            title: 'Add Element',
            subtitle: 'New Node',
            color: 'slate',
            isAction: true
        }
    ];

    React.useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            const width = window.innerWidth;
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

    const nodesWithPosition = allNodes.map((node, index) => {
        const angleDeg = (360 / allNodes.length) * index + rotation;
        const angleRad = (angleDeg * Math.PI) / 180;

        const xRaw = Math.sin(angleRad) * radius.x;
        const zRaw = Math.cos(angleRad) * radius.z;

        const scaleFactor = (zRaw + PERSPECTIVE) / PERSPECTIVE;
        const zIndex = Math.round(zRaw + CENTER_Z_INDEX);
        const opacity = Math.max(0.4, (zRaw + radius.z) / (2 * radius.z) + 0.3);

        const tiltOffset = zRaw * 0.4;

        return {
            ...node,
            x: xRaw,
            y: 240 + tiltOffset,
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
            <motion.div
                className="fixed inset-0 z-0 cursor-grab active:cursor-grabbing bg-transparent select-none"
                style={{ touchAction: 'none' }}
                onPan={handlePan}
                onPanStart={handlePanStart}
                onPanEnd={handlePanEnd}
            />

            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
                style={{ zIndex: CENTER_Z_INDEX }}
            >
                {/* Reusing CentralVideo for the moment. We could make a specialized user profile center here. */}
                <CentralVideo />
            </div>

            {nodesWithPosition.map((node) => {
                const IconComponent = ICON_MAP[node.iconName] || ICON_MAP['Activity'];
                
                return (
                    <motion.div
                        key={node.id}
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
                                href={node.isAction ? undefined : node.href}
                                onClick={node.isAction ? () => setIsModalOpen(true) : undefined}
                                icon={IconComponent}
                                title={node.title}
                                subtitle={node.subtitle}
                                color={node.color}
                            />
                        </div>
                    </motion.div>
                );
            })}

            <AddElementModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={(newElement) => setCustomNodes(prev => [...prev, newElement])}
            />
        </div>
    );
};
