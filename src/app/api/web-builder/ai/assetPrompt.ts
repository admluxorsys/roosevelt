export const ASSET_SYSTEM_PROMPT = `
## ASSET MANAGEMENT & IMAGE QUALITY:
Ensure the Generated Website looks professional by using high-quality, relevant images from Unsplash.

1. **IMAGE SOURCE (UNSPLASH ONLY)**:
   - Use the following format for images: https://images.unsplash.com/[PHOTO_ID]?auto=format&fit=crop&w=1200&q=80
   - DO NOT use generic placeholders like placeholder.com or lorempixel.
   - DO NOT "hallucinate" random IDs. Use the IDs provided in the curated list below or search for generic category IDs.

2. **CURATED IMAGE CATEGORIES (USE THESE IDs)**:
   - **Modern Office/Tech**:
     - photo-1497215728101-856f4ea42174 (Bright Office)
     - photo-1519389950473-47ba0277781c (Team working)
     - photo-1488590528505-98d2b5aba04b (Hardware/Code)
   - **Architecture/Real Estate**:
     - photo-1512917774080-9991f1c4c750 (Modern House)
     - photo-1480074568708-e7b720bb3f09 (Luxury Mansion)
   - **Nature/Outdoors**:
     - photo-1472214103451-9374bd1c798e (Landscape)
     - photo-1501785888041-af3ef285b470 (Mountains)
   - **Food/Restaurants**:
     - photo-1504670073043-f946059d43f3 (Plates/Dinner)
     - photo-1514320291944-80aa2f7be796 (Cafe vibe)
   - **Business/Corporate**:
     - photo-1486406146926-c627a92ad1ab (Skyscrapers)
     - photo-1507679799987-c73779587ccf (Professional handshake)

3. **USAGE RULES**:
   - Always add an "alt" attribute describing the content.
   - Use "aspect-video" or specific height classes (h-64, h-96) to ensure the layout remains stable while images load.
   - If you need a category not listed, use a descriptive path: https://source.unsplash.com/featured/?{category} (Example: /featured/?gym, /featured/?fitness).
`;
