import { IndustryPattern, ColorPalette, SectionLayout, Typography } from './types';

/**
 * Pre-defined design patterns for various industries and page types
 */

// Modern Tech/SaaS Color Palettes
const techColorPalette: ColorPalette = {
    primary: ['#3b82f6', '#2563eb', '#1d4ed8'], // Blue
    secondary: ['#8b5cf6', '#7c3aed', '#6d28d9'], // Purple
    accent: ['#06b6d4', '#0891b2', '#0e7490'], // Cyan
    background: ['#0f172a', '#1e293b', '#334155'], // Dark slate
    text: ['#f8fafc', '#e2e8f0', '#cbd5e1'],
};

const ecommerceColorPalette: ColorPalette = {
    primary: ['#ef4444', '#dc2626', '#b91c1c'], // Red
    secondary: ['#f59e0b', '#d97706', '#b45309'], // Amber
    accent: ['#10b981', '#059669', '#047857'], // Green
    background: ['#ffffff', '#f9fafb', '#f3f4f6'], // Light
    text: ['#111827', '#374151', '#6b7280'],
};

const portfolioColorPalette: ColorPalette = {
    primary: ['#000000', '#1f2937', '#374151'], // Black/Gray
    secondary: ['#fbbf24', '#f59e0b', '#d97706'], // Gold
    accent: ['#ec4899', '#db2777', '#be185d'], // Pink
    background: ['#ffffff', '#fafafa', '#f5f5f5'], // White
    text: ['#0f172a', '#334155', '#64748b'],
};

const modernTypography: Typography = {
    headingFont: 'Inter, system-ui, sans-serif',
    bodyFont: 'Inter, system-ui, sans-serif',
    sizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
    },
    weights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
};

// Common Section Layouts
const heroSection: SectionLayout = {
    name: 'Hero',
    type: 'hero',
    spacing: 'py-20 md:py-32',
    background: 'gradient-to-br from-primary-600 to-secondary-600',
};

const featuresSection: SectionLayout = {
    name: 'Features',
    type: 'features',
    columns: 3,
    spacing: 'py-16 md:py-24',
};

const ctaSection: SectionLayout = {
    name: 'Call to Action',
    type: 'cta',
    spacing: 'py-16',
    background: 'gradient-to-r from-primary-500 to-secondary-500',
};

const footerSection: SectionLayout = {
    name: 'Footer',
    type: 'footer',
    spacing: 'py-12',
    background: 'bg-gray-900',
};

// Industry Patterns
export const industryPatterns: Record<string, IndustryPattern> = {
    tech: {
        name: 'Technology/SaaS',
        keywords: ['tech', 'saas', 'software', 'startup', 'ai', 'cloud', 'platform'],
        colorSchemes: [techColorPalette],
        commonSections: [heroSection, featuresSection, ctaSection, footerSection],
        iconSuggestions: ['Rocket', 'Zap', 'Shield', 'Code', 'Cloud', 'Cpu', 'Database', 'Lock'],
        typography: modernTypography,
        behaviors: [
            'Implement linear-gradient backgrounds that animate on scroll',
            'Add "active" states to navigation links using Framer Motion',
            'Connect the CTA button to a lead-capture modal with validation',
            'Use skeleton loaders for feature cards during initial mount'
        ]
    },

    ecommerce: {
        name: 'E-Commerce',
        keywords: ['shop', 'store', 'ecommerce', 'retail', 'products', 'marketplace'],
        colorSchemes: [ecommerceColorPalette],
        commonSections: [
            heroSection,
            { name: 'Products', type: 'gallery', columns: 4, spacing: 'py-16' },
            { name: 'CartPreview', type: 'features', spacing: 'py-12' },
            { name: 'Testimonials', type: 'testimonials', spacing: 'py-16' },
            footerSection,
        ],
        iconSuggestions: ['ShoppingCart', 'Package', 'Truck', 'CreditCard', 'Star', 'Heart', 'Tag'],
        typography: modernTypography,
        behaviors: [
            'Maintain a local "cart" state using React context or Zustand',
            'Add "Add to Cart" functionality with success toasts',
            'Implement product filtering using URL search params',
            'Use heavy shadows and hover scales for product cards'
        ]
    },

    portfolio: {
        name: 'Portfolio/Creative',
        keywords: ['portfolio', 'creative', 'designer', 'artist', 'photographer', 'agency'],
        colorSchemes: [portfolioColorPalette],
        commonSections: [
            { name: 'Hero', type: 'hero', spacing: 'py-24 md:py-40' },
            { name: 'Work', type: 'gallery', columns: 3, spacing: 'py-20' },
            { name: 'About', type: 'features', spacing: 'py-16' },
            { name: 'ContactForm', type: 'cta', spacing: 'py-20' },
            footerSection,
        ],
        iconSuggestions: ['Palette', 'Camera', 'Pen', 'Layers', 'Grid', 'Image', 'Award'],
        typography: modernTypography,
        behaviors: [
            'Use custom cursor effects with Framer Motion',
            'Implement a robust contact form with email validation and success message',
            'Add smooth-scroll behavior for section navigation',
            'Create a lightbox effect for gallery images'
        ]
    },

    landing: {
        name: 'Landing Page',
        keywords: ['landing', 'marketing', 'promo', 'launch', 'campaign'],
        colorSchemes: [techColorPalette, ecommerceColorPalette],
        commonSections: [
            heroSection,
            featuresSection,
            { name: 'PricingTable', type: 'pricing', columns: 3, spacing: 'py-16' },
            { name: 'Testimonials', type: 'testimonials', spacing: 'py-16' },
            ctaSection,
            footerSection,
        ],
        iconSuggestions: ['TrendingUp', 'Users', 'CheckCircle', 'Star', 'Award', 'Target'],
        typography: modernTypography,
        behaviors: [
            'Implement a sticky header that changes background on scroll',
            'Add a discount countdown timer with local state',
            'Ensure all CTAs trigger a consistent action (scroll or modal)',
            'Use staggered entrance animations for feature lists'
        ]
    },

    dashboard: {
        name: 'Dashboard/Admin',
        keywords: ['dashboard', 'admin', 'panel', 'analytics', 'management'],
        colorSchemes: [techColorPalette],
        commonSections: [
            { name: 'StatsGrid', type: 'features', columns: 4, spacing: 'py-8' },
            { name: 'AnalyticsCharts', type: 'features', columns: 2, spacing: 'py-8' },
            { name: 'DataTable', type: 'features', columns: 1, spacing: 'py-4' },
        ],
        iconSuggestions: ['BarChart', 'PieChart', 'Activity', 'Users', 'Settings', 'Bell', 'Search'],
        typography: modernTypography,
        behaviors: [
            'Implement sorting and pagination for the data table',
            'Use real-time chart animations with framer-motion',
            'Add search functionality that filters items in memory',
            'Implement a collapsable sidebar with persistent state'
        ]
    },
};

/**
 * Detect industry from user prompt
 */
export function detectIndustry(prompt: string): IndustryPattern {
    const lowerPrompt = prompt.toLowerCase();

    for (const [key, pattern] of Object.entries(industryPatterns)) {
        if (pattern.keywords.some(keyword => lowerPrompt.includes(keyword))) {
            return pattern;
        }
    }

    // Default to landing page
    return industryPatterns.landing;
}

/**
 * Generate complete design spec from industry pattern
 */
export function generateDesignSpec(industry: IndustryPattern, pageType: string): any {
    return {
        industry: industry.name,
        pageType,
        colorPalette: industry.colorSchemes[0],
        typography: industry.typography,
        components: {
            buttons: [
                {
                    variant: 'primary',
                    size: 'md',
                    className: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200',
                    hoverEffect: 'scale-105',
                },
                {
                    variant: 'secondary',
                    size: 'md',
                    className: 'bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all duration-200',
                    hoverEffect: 'translate-y-[-2px]',
                },
            ],
            cards: [
                {
                    variant: 'elevated',
                    className: 'bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6',
                    hoverEffect: 'translate-y-[-4px]',
                },
            ],
            navigation: {
                type: 'horizontal',
                position: 'fixed',
                className: 'bg-white/80 backdrop-blur-lg border-b border-gray-200',
            },
        },
        layout: {
            sections: industry.commonSections,
            spacing: {
                section: 'py-16 md:py-24',
                component: 'mb-8',
                element: 'mb-4',
            },
        },
        icons: industry.iconSuggestions,
        animations: [
            { type: 'fade', duration: '300ms', easing: 'ease-in-out', trigger: 'load' },
            { type: 'slide', duration: '200ms', easing: 'ease-out', trigger: 'hover' },
        ],
        responsive: {
            breakpoints: {
                sm: '640px',
                md: '768px',
                lg: '1024px',
                xl: '1280px',
            },
            mobileFirst: true,
        },
        behaviors: industry.behaviors,
    };
}

