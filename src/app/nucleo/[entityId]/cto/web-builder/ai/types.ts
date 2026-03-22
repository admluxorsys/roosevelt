/**
 * Type definitions for AI-generated design systems
 */

export interface ColorPalette {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string[];
    text: string[];
}

export interface Typography {
    headingFont: string;
    bodyFont: string;
    sizes: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
        '5xl': string;
    };
    weights: {
        normal: string;
        medium: string;
        semibold: string;
        bold: string;
    };
}

export interface ButtonStyle {
    variant: 'primary' | 'secondary' | 'outline' | 'ghost';
    size: 'sm' | 'md' | 'lg';
    className: string;
    hoverEffect: string;
}

export interface CardStyle {
    variant: 'default' | 'elevated' | 'outlined' | 'glass';
    className: string;
    hoverEffect?: string;
}

export interface NavigationStyle {
    type: 'horizontal' | 'vertical' | 'sidebar';
    position: 'fixed' | 'sticky' | 'relative';
    className: string;
}

export interface SectionLayout {
    name: string;
    type: 'hero' | 'features' | 'cta' | 'footer' | 'testimonials' | 'pricing' | 'gallery';
    columns?: number;
    spacing: string;
    background?: string;
}

export interface SpacingSystem {
    section: string;
    component: string;
    element: string;
}

export interface AnimationSpec {
    type: 'fade' | 'slide' | 'scale' | 'bounce';
    duration: string;
    easing: string;
    trigger: 'hover' | 'scroll' | 'load';
}

export interface DesignSpec {
    industry: string;
    pageType: string;
    colorPalette: ColorPalette;
    typography: Typography;
    components: {
        buttons: ButtonStyle[];
        cards: CardStyle[];
        navigation: NavigationStyle;
    };
    layout: {
        sections: SectionLayout[];
        spacing: SpacingSystem;
    };
    icons: string[]; // lucide-react icon names
    animations: AnimationSpec[];
    responsive: {
        breakpoints: Record<string, string>;
        mobileFirst: boolean;
    };
}

export interface ProjectStructure {
    components: {
        ui: string[];
        sections: string[];
        layout: string[];
    };
    pages: string[];
    styles: string[];
    utils: string[];
}

export interface IndustryPattern {
    name: string;
    keywords: string[];
    colorSchemes: ColorPalette[];
    commonSections: SectionLayout[];
    iconSuggestions: string[];
    typography: Typography;
    behaviors?: string[];
}

