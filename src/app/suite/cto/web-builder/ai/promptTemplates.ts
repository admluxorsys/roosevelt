import { detectIndustry, generateDesignSpec } from './designPatterns';
export { detectIndustry, generateDesignSpec };

/**
 * AI Prompt Templates for Multi-Stage Generation
 */

export interface PromptContext {
  userRequest: string;
  industry?: string;
  pageType?: string;
  designSpec?: any;
}

/**
 * Stage 1: Research & Analysis Prompt
 */
export function generateResearchPrompt(context: PromptContext): string {
  return `You are an expert web designer analyzing a project request.

USER REQUEST: "${context.userRequest}"

Your task is to analyze this request and provide a structured response in JSON format:

{
  "industry": "tech|ecommerce|portfolio|landing|dashboard|other",
  "pageType": "landing|homepage|about|contact|dashboard|etc",
  "targetAudience": "description of target users",
  "keyFeatures": ["feature1", "feature2", ...],
  "designGoals": ["goal1", "goal2", ...],
  "suggestedSections": ["hero", "features", "cta", ...]
}

Be specific and professional. Think about modern web design trends for this industry.`;
}

/**
 * Stage 2: Design Specification Prompt
 */
export function generateDesignPrompt(context: PromptContext): string {
  const industry = detectIndustry(context.userRequest);
  const designSpec = generateDesignSpec(industry, context.pageType || 'landing');

  return `You are an expert UI/UX designer creating a comprehensive design system.

PROJECT CONTEXT:
- Industry: ${industry.name}
- Page Type: ${context.pageType || 'landing page'}
- User Request: "${context.userRequest}"

DESIGN GUIDELINES:
- Use modern, professional aesthetics
- Implement gradients and smooth transitions
- Ensure mobile-first responsive design
- Use lucide-react icons: ${industry.iconSuggestions.join(', ')}
- Color palette: ${JSON.stringify(designSpec.colorPalette, null, 2)}

Create a complete design specification that includes:
1. Exact Tailwind CSS classes for all components
2. Specific lucide-react icons to use
3. Animation and hover effects
4. Responsive breakpoints
5. Typography scale

Respond with a detailed design spec in JSON format.`;
}

/**
 * Stage 3: Code Generation Prompt (Enhanced)
 */
export function generateCodePrompt(context: PromptContext): string {
  const industry = detectIndustry(context.userRequest);
  const designSpec = generateDesignSpec(industry, context.pageType || 'landing');

  return `You are an expert React developer creating a modern, professional web application.

PROJECT REQUIREMENTS:
${context.userRequest}

DESIGN SYSTEM:
Industry: ${industry.name}
Color Palette: ${JSON.stringify(designSpec.colorPalette, null, 2)}
Icons to use: ${industry.iconSuggestions.join(', ')}
Sections needed: ${industry.commonSections.map(s => s.name).join(', ')}

TECHNICAL REQUIREMENTS:
1. Use React with TypeScript (.tsx files)
2. Use Tailwind CSS for ALL styling (no inline styles except for dynamic values)
3. Use lucide-react for icons
4. Create reusable components in src/components/
5. Implement smooth animations and hover effects
6. Ensure mobile-first responsive design
7. Use modern gradients and shadows
8. Add proper TypeScript types

DESIGN REQUIREMENTS:
1. Modern, professional aesthetic
2. Vibrant color palette with gradients
3. Smooth transitions and hover effects
4. Proper spacing and typography hierarchy
5. Visual interest through shadows and depth
6. Icons for every major feature/section
7. Responsive design (mobile, tablet, desktop)

COMPONENT STRUCTURE:
- Create separate files for each major component
- Use composition pattern
- Keep components focused and reusable
- Add proper props and TypeScript interfaces

STYLING GUIDELINES:
- Use Tailwind's gradient utilities (bg-gradient-to-r, from-blue-600, to-purple-600)
- Add hover effects (hover:scale-105, hover:shadow-xl, transition-all)
- Use proper spacing (py-20, px-6, gap-8)
- Implement responsive classes (md:py-32, lg:grid-cols-3)
- Add shadows for depth (shadow-lg, shadow-2xl)
- Use backdrop-blur for modern effects

EXAMPLE BUTTON COMPONENT:
\`\`\`tsx
<button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2">
  <Rocket className="w-5 h-5" />
  Get Started
</button>
\`\`\`

EXAMPLE CARD COMPONENT:
\`\`\`tsx
<div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 transform hover:-translate-y-2">
  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
    <Zap className="w-6 h-6 text-white" />
  </div>
  <h3 className="text-2xl font-bold text-gray-900 mb-2">Feature Title</h3>
  <p className="text-gray-600">Feature description with proper spacing and typography.</p>
</div>
\`\`\`

CRITICAL: Generate COMPLETE, PRODUCTION-READY code. Every component should be:
- Visually stunning with gradients and effects
- Fully responsive
- Include proper icons
- Have smooth animations
- Use the specified color palette

🚨 CRITICAL RULES (ZERO ERRORS ALLOWED) 🚨
1. ATOMIC PERFECTION: Provide ZERO "stubs" or "placeholders". All functions, interfaces, and UI code must be 100% complete and fully implemented.
2. NO HALLUCINATIONS: Do NOT use imaginary components or libraries. If you need a UI element (like a Dialog or Dropdown), build it inline using raw Tailwind CSS and standard React state. Do NOT import from "@/components/ui/xyz" unless you write that exact file.
3. ABSOLUTE RESILIENCE (ANTI-UNDEFINED):
   - ALWAYS use optional chaining (?.) for all data access (e.g., \`user?.profile?.name\`).
   - ALWAYS use fallback arrays (|| []) when mapping or filtering (e.g., \`(items || []).map(...)\`).
   - ALWAYS initialize state with valid defaults (e.g., \`useState([])\` instead of \`useState()\`).
   - For Zustand stores, always define nested defaults to prevent null reference errors on boot.
4. ROUTING INTEGRITY & LINKAGE:
   - Ensure EXACT path matching between \`<Route path="...">\` in App.tsx and all \`<Link to="...">\` usages in navigation menus or buttons.
   - App.tsx MUST import every single page/component it references. No missing imports.
5. LUCIDE ICONS: Use only standard lucide-react icons.

Generate ALL necessary files in a logical sequence (Structure -> Pages -> Logic):
1. src/App.tsx - Main app component with routing
2. src/components/sections/Hero.tsx - Hero section with gradient background
3. src/components/sections/Features.tsx - Features grid with icons
4. src/components/sections/Footer.tsx - Footer component
5. src/components/ui/Button.tsx - Reusable button component
6. src/components/ui/Card.tsx - Reusable card component
7. src/index.css - Global styles with custom CSS if needed
8. src/main.tsx - Entry point

Respond ONLY with a JSON array of file objects:
[
  {
    "path": "src/App.tsx",
    "content": "// complete file content here"
  },
  ...
]

Make it BEAUTIFUL, MODERN, and PROFESSIONAL. This should look like a premium website.`;
}

/**
 * Stage 4: Enhancement Prompt
 */
export function generateEnhancementPrompt(files: Record<string, string>): string {
  return `You are a senior web developer reviewing code for quality and aesthetics.

REVIEW THE FOLLOWING CODE:
${JSON.stringify(files, null, 2)}

Check for:
1. Visual hierarchy - Are headings, text sizes appropriate?
2. Color contrast - Is text readable on backgrounds?
3. Spacing consistency - Is spacing uniform and professional?
4. Responsive design - Does it work on mobile, tablet, desktop?
5. Animations - Are transitions smooth and not jarring?
6. Icons - Are icons used effectively?
7. Modern aesthetics - Does it look current and professional?

Provide specific improvements in JSON format:
{
  "improvements": [
    {
      "file": "src/components/Hero.tsx",
      "issue": "Text contrast too low on gradient background",
      "fix": "Add text-shadow or darker gradient overlay"
    },
    ...
  ],
  "updatedFiles": [
    {
      "path": "src/App.tsx",
      "content": "// enhanced code"
    },
    ...
  ]
}

Only include files that need changes. Make the design MORE visually appealing.`;
}

/**
 * Main orchestration function for multi-stage generation
 */
export async function generateProjectWithAI(
  userRequest: string,
  aiFunction: (prompt: string) => Promise<string>
): Promise<Record<string, string>> {

  // Stage 1: Research & Analysis
  const researchPrompt = generateResearchPrompt({ userRequest });
  const researchResponse = await aiFunction(researchPrompt);
  const analysis = JSON.parse(researchResponse);

  // Stage 2: Design Specification
  const designPrompt = generateDesignPrompt({
    userRequest,
    industry: analysis.industry,
    pageType: analysis.pageType,
  });
  const designResponse = await aiFunction(designPrompt);
  const designSpec = JSON.parse(designResponse);

  // Stage 3: Code Generation
  const codePrompt = generateCodePrompt({
    userRequest,
    industry: analysis.industry,
    pageType: analysis.pageType,
    designSpec,
  });
  const codeResponse = await aiFunction(codePrompt);
  const filesArray = JSON.parse(codeResponse);

  // Convert array to object
  const files: Record<string, string> = {};
  filesArray.forEach((file: any) => {
    files[file.path] = file.content;
  });

  // Stage 4: Enhancement (optional, can be skipped for speed)
  // const enhancementPrompt = generateEnhancementPrompt(files);
  // const enhancementResponse = await aiFunction(enhancementPrompt);
  // const enhancements = JSON.parse(enhancementResponse);
  // Apply enhancements...

  return files;
}
