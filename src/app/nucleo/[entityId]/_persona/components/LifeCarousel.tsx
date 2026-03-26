import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, PanInfo, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
import { OrbNode } from '../../components/OrbNode';
import { getInitialPersonaNodes, ICON_MAP } from '../constants';
import { AddElementModal } from './AddElementModal';
import { CentralVideo } from '../../components/CentralVideo';
import { useAuth } from '@/contexts/AuthContext';

const RADIUS_X = 1100;
const RADIUS_Z = 700;
const PERSPECTIVE = 1200;
const CENTER_Z_INDEX = 700;

const AUTO_ROTATION_SPEED = -0.05;
const DRAG_SENSITIVITY = 0.15;
const MOMENTUM_FRICTION = 0.95;

export const LifeCarousel = () => {
    const { activeEntity } = useAuth();
    const rotation = useMotionValue(0);
    const [mounted, setMounted] = useState(false);
    const [radius, setRadius] = useState({ x: RADIUS_X, z: RADIUS_Z });
    const [customNodes, setCustomNodes] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const initialNodes = activeEntity ? getInitialPersonaNodes(activeEntity) : [];

    const allNodes = [
        ...initialNodes,
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

    useEffect(() => {
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

    const velocityRef = useRef(0);
    const isDragging = useRef(false);

    useAnimationFrame(() => {
        if (isDragging.current) return;

        if (Math.abs(velocityRef.current) > 0.01) {
            rotation.set(rotation.get() + velocityRef.current);
            velocityRef.current *= MOMENTUM_FRICTION;
        } else {
            rotation.set(rotation.get() + AUTO_ROTATION_SPEED);
        }
    });

    const handlePan = useCallback((_: any, info: PanInfo) => {
        const delta = info.delta.x * DRAG_SENSITIVITY;
        rotation.set(rotation.get() + delta);
        velocityRef.current = delta;
    }, [rotation]);

    const handlePanStart = () => {
        isDragging.current = true;
        velocityRef.current = 0;
    };

    const handlePanEnd = (_: any, info: PanInfo) => {
        isDragging.current = false;
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
                <CentralVideo />
            </div>

            {allNodes.map((node, index) => (
                <LifeCarouselItem 
                    key={node.id}
                    node={node}
                    index={index}
                    total={allNodes.length}
                    rotation={rotation}
                    radius={radius}
                    setIsModalOpen={setIsModalOpen}
                />
            ))}

            <AddElementModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={(newElement) => setCustomNodes(prev => [...prev, newElement])}
            />
        </div>
    );
};

function LifeCarouselItem({ node, index, total, rotation, radius, setIsModalOpen }: {
    node: any,
    index: number,
    total: number,
    rotation: any,
    radius: { x: number, z: number },
    setIsModalOpen: (val: boolean) => void
}) {
    const angleOffset = (360 / total) * index;
    const IconComponent = ICON_MAP[node.iconName] || ICON_MAP['Activity'];
    
    const x = useTransform(rotation, (r: number) => {
        const rad = ((r + angleOffset) * Math.PI) / 180;
        return Math.sin(rad) * radius.x;
    });
    
    const z = useTransform(rotation, (r: number) => {
        const rad = ((r + angleOffset) * Math.PI) / 180;
        return Math.cos(rad) * radius.z;
    });

    const scale = useTransform(z, (zv: number) => (zv + PERSPECTIVE) / PERSPECTIVE);
    const opacity = useTransform(z, (zv: number) => Math.min(1, Math.max(0.4, (zv + radius.z) / (2 * radius.z) + 0.3)));
    const y = useTransform(z, (zv: number) => 120 + (zv * 0.2));
    const zIndex = useTransform(z, (zv: number) => Math.round(zv + CENTER_Z_INDEX));

    return (
        <motion.div
            className="absolute top-1/2 left-1/2 pointer-events-none"
            style={{ x, y, scale, opacity, zIndex }}
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
}
