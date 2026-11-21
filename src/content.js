// Everything personal lives here. Edit this file and the site updates.
// Years are left out on purpose; add a `when` string to any timeline item if you change your mind.

export const CONTENT = {
  name: 'Hasan Abbasi',
  email: 'hasan.x.abbasi@gmail.com',
  phone: '0300 0340566',
  // WhatsApp wants the number in international format with no + or spaces (Pakistan = 92, drop the leading 0).
  whatsapp: '923000340566',
  whatsappText: "Hi Hasan, I found your portfolio and I'd like to talk.",
  github: 'https://github.com/HasanAbbac',
  linkedin: 'https://www.linkedin.com/in/hasan-abbac/',

  // `group` decides which mix node a skill plugs into (no scores are shown on the site).
  skills: [
    { name: 'Blender', group: '3D' },
    { name: 'Unity', group: 'Engines' },
    { name: 'Unreal Engine', group: 'Engines' },
    { name: 'VR Development', group: 'Engines' },
    { name: 'C++', group: 'Code' },
    { name: 'C#', group: 'Code' },
    { name: 'Python', group: 'Code' },
    { name: 'JavaScript', group: 'Code' },
    { name: 'HTML', group: 'Code' },
    { name: 'Three.js', group: 'Code' },
    { name: 'MySQL', group: 'Code' },
    { name: 'Git and GitHub', group: 'Code' },
  ],

  // PROJECTS. Leave empty and the Projects section shows the render queue.
  // Each project needs a `type`: 'model' (Blender), 'web' (HTML game), 'unity' (Unity game) or 'unreal' (Unreal Engine game).
  // Everything else is optional, add only what you have:
  //   image  : '/projects/island.jpg'            thumbnail, put the file in public/projects/
  //   model  : '/models/island.glb'              Blender export (glTF binary) -> interactive 3D viewer in the popup
  //   play   : '/games/space-run/index.html'     playable build inside the popup (folder in public/games/), or any https:// embed link
  //   cover  : '/projects/name-cover.jpg'        title card shown before a local .mp4 video starts (falls back to `image`)
  //   video  : 'https://youtu.be/xxxxxxxxxxx'    trailer / turntable, shown in the popup
  //   href   : 'https://...'                     if set, clicking the card opens this link in a new tab instead of the popup
  //   links  : [{ label: 'ArtStation', href: 'https://...' }]
  // Example:
  // { type: 'model', title: 'Low-poly island', text: 'Modelled and lit in Blender.', tags: ['Blender', 'Low poly'], image: '/projects/island.jpg', model: '/models/island.glb' },
  // Options for the "Technique" dropdown in the Projects section. A short fixed list on purpose, so ten or so
  // projects never turn into dozens of filters. Tool names (Blender, Unity...) are not listed here because the
  // category tabs already cover them. Every technique must also appear in a project's `tags`.
  techniques: ['Game', 'Racing', 'VR', 'Product', 'Hard surface', 'Rigging', 'Character', 'Texturing', 'Glass', 'Geometry Nodes'],

  // The "All" tab shows these first, in this order. The rest follow in a random order that changes on every page load.
  featured: ['Helper Bot', 'Chess Set', 'Eau de Parfum', 'MacBook Air', 'Neon Collector', '3D Target Clicker'],

  projects: [
    { type: 'model', title: 'Helper Bot', text: 'Friendly rigged robot companion with a glowing screen face.', tags: ['Blender', 'Hard surface', 'Rigging'], image: '/projects/helper-bot.jpg', model: '/models/helper-bot.glb' },
    { type: 'model', title: 'Chess Set', text: 'Chess board and pieces built with procedural geometry nodes.', tags: ['Blender', 'Geometry Nodes', 'Cycles'], image: '/projects/chess.jpg', model: '/models/chess.glb', view: { zoom: 0.62 } },
    { type: 'model', title: 'Eau de Parfum', text: 'Glass perfume bottle with a gold cap, built for refraction and studio lighting.', tags: ['Blender', 'Glass', 'Cycles'], image: '/projects/eau-da-parfum.jpg', model: '/models/eau-da-parfum.glb', view: { zoom: 0.7 } },
    { type: 'model', title: 'MacBook Air', text: 'Laptop model built from 50 separate parts with metal and normal-map materials.', tags: ['Blender', 'Hard surface', 'Product'], image: '/projects/macbook-air.jpg', model: '/models/macbook-air.glb', view: { decals: ['Lid_Part_06'] } },
    { type: 'web', title: 'Neon Collector', text: 'Arcade game: steer a robot, collect 35 coins in 90 seconds, dodge drones and chain combos. All models are built procedurally in Three.js.', tags: ['Three.js', 'JavaScript', 'Game'], image: '/projects/neon-collector.jpg', play: '/games/neon-collector/index.html' },
    { type: 'web', title: '3D Target Clicker', text: 'Aim game: click 3D shapes before they vanish. Rarer shapes score more, with live score, timer and accuracy.', tags: ['Three.js', 'Raycasting', 'Game'], image: '/projects/3d-target-clicker.jpg', play: '/games/3d-target-clicker/index.html', fit: [1280, 720] },
    { type: 'model', title: 'Raw Obsidian', text: 'Perfume bottle on a marble plinth with a custom label.', tags: ['Blender', 'Product', 'Marble'], image: '/projects/raw-obsidian.jpg', model: '/models/raw-obsidian.glb' },
    { type: 'unity', title: 'Rage Station', text: 'A rage room in space, built in Unity for VR. Pick up weapons in a sci-fi space station, smash barrels and use the in-game music player.', tags: ['Unity', 'VR', 'Game'], image: '/projects/rage-station.jpg', cover: '/projects/rage-station-cover.jpg', video: '/projects/rage-station.mp4', shots: ['/projects/rage-station-1.jpg', '/projects/rage-station-2.jpg', '/projects/rage-station-3.jpg', '/projects/rage-station-4.jpg', '/projects/rage-station-5.jpg', '/projects/rage-station-6.jpg'] },
    { type: 'model', title: 'Basketball', text: 'Textured basketball with a displaced leather surface.', tags: ['Blender', 'Texturing', 'Low poly'], image: '/projects/basketball.jpg', model: '/models/basketball.glb' },
    { type: 'model', title: 'FYP Character', text: 'Rigged stylised toon girl character with hand-painted textures.', tags: ['Blender', 'Character', 'Rigging'], image: '/projects/fyp-character.jpg', model: '/models/fyp-character.glb', view: { zoom: 0.5, focusY: 0.72 } },
    { type: 'unreal', title: 'Ultimate Car Racing', text: 'Racing game built in Unreal Engine. A 7-car, 3-lap race with live position, lap counter, speedometer with gear display and a track minimap.', tags: ['Unreal Engine', 'Racing', 'Game'], image: '/projects/ultimate-car-racing.jpg', cover: '/projects/ultimate-car-racing-cover.jpg', video: '/projects/ultimate-car-racing.mp4', shots: ['/projects/ultimate-car-racing-1.jpg', '/projects/ultimate-car-racing-2.jpg', '/projects/ultimate-car-racing-3.jpg', '/projects/ultimate-car-racing-4.jpg', '/projects/ultimate-car-racing-5.jpg'] },
    { type: 'model', title: 'AirPods Case', text: 'Product model of a charging case with a hinged lid.', tags: ['Blender', 'Product', 'Subdivision'], image: '/projects/airpods.jpg', model: '/models/airpods.glb' },
  ],

  // pos is where the keyframe sits on the timeline (0 to 1). pose is the avatar pose used there.
  timeline: [
    {
      id: 'olevels', short: 'O Levels', channel: 'Education', pos: 0.07, pose: 'idle',
      title: 'O Levels',
      place: 'DHACSS Creek Campus, DHA Phase 8, Karachi',
      text: 'Where the foundations were built before moving on to Intermediate.',
    },
    {
      id: 'inter', short: 'Intermediate', channel: 'Education', pos: 0.25, pose: 'think',
      title: 'Intermediate',
      place: 'DHACSS Degree College, DHA Phase 6, Karachi',
      text: 'Pre-university studies, and the point where computers and 3D became the plan.',
    },
    {
      id: 'ned', short: 'BS Computer Science', channel: 'Education', pos: 0.47, pose: 'idea',
      title: 'BS Computer Science',
      place: 'NED University of Engineering and Technology, Karachi',
      text: 'Specializing in Gaming and Animation: modelling, animation and game development alongside the core computer science degree.',
    },
    {
      id: 'blender', short: 'Blender', channel: 'Experience', pos: 0.57, pose: 'idea',
      title: '3D modelling and animation',
      place: 'Blender',
      text: 'Modelling and animating characters and environments in Blender, my main tool, and taking them through to game-ready assets.',
    },
    {
      id: 'games', short: 'Game development', channel: 'Experience', pos: 0.68, pose: 'wave',
      title: 'Game development',
      place: 'Unity and Unreal Engine',
      text: 'Worked in both engines and made games in each, from importing Blender assets to getting them running in a build.',
    },
    {
      id: 'cega', short: 'CEGA courses', channel: 'Experience', pos: 0.81, pose: 'idea',
      title: 'CEGA game development courses',
      place: 'Pre-production, Unreal and Post-production',
      text: 'Completed three CEGA courses covering the game development pipeline: Pre-production, Unreal and Post-production.',
    },
    {
      id: 'cert', short: 'Google AI cert', channel: 'Experience', pos: 0.92, pose: 'celebrate',
      title: 'Google AI Professional Certificate',
      place: 'Coursera, June 2026',
      text: 'Seven courses on using AI for research, writing, content, data analysis and building apps.',
      verify: 'https://coursera.org/verify/professional-cert/NGCA6KESKRBH',
      certs: [
        { label: 'Full certificate', file: 'google-ai-professional-certificate.pdf' },
        { label: 'AI Fundamentals', file: 'ai-fundamentals.pdf' },
        { label: 'AI for Brainstorming and Planning', file: 'ai-for-brainstorming-and-planning.pdf' },
        { label: 'AI for Research and Insights', file: 'ai-for-research-and-insights.pdf' },
        { label: 'AI for Writing and Communicating', file: 'ai-for-writing-and-communicating.pdf' },
        { label: 'AI for Content Creation', file: 'ai-for-content-creation.pdf' },
        { label: 'AI for Data Analysis', file: 'ai-for-data-analysis.pdf' },
        { label: 'AI for App Building', file: 'ai-for-app-building.pdf' },
      ],
    },
  ],
};
