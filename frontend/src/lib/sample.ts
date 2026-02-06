export const translationNovels = [
  {
    id: 1,
    slug: "ashen-crown",
    title: "Ashen Crown",
    altTitle: "Hai no Okam",
    origin: "JP",
    author: "Rino Aki",
    team: "Moonlit Scans",
    language: "EN",
    status: "Ongoing",
    rating: 4.6,
    follows: "82k",
    chapters: 64,
    latestChapter: 64,
    updatedAt: "2h ago",
    coverStyle: "from-amber-200/30 via-transparent to-amber-500/10",
    tags: ["Fantasy", "Politics", "Slow burn"],
    synopsis:
      "A disgraced prince negotiates with the empire that burned his family, only to become the crown's shadow translator.",
    age: "15+",
  },
  {
    id: 2,
    slug: "neon-embassy",
    title: "Neon Embassy",
    altTitle: "Niyon Gaikoukan",
    origin: "JP",
    author: "Sora Min",
    team: "Ion Lantern",
    language: "EN",
    status: "Ongoing",
    rating: 4.4,
    follows: "57k",
    chapters: 43,
    latestChapter: 43,
    updatedAt: "6h ago",
    coverStyle: "from-cyan-200/20 via-transparent to-blue-500/20",
    tags: ["Sci-fi", "Urban", "Mystery"],
    synopsis:
      "An underground interpreter decodes alien contracts and discovers the city is a fabricated treaty.",
    age: "13+",
  },
  {
    id: 3,
    slug: "winter-script",
    title: "Winter Script",
    altTitle: "Dong Chao",
    origin: "CN",
    author: "Han Yue",
    team: "Paperveil",
    language: "EN",
    status: "Completed",
    rating: 4.8,
    follows: "121k",
    chapters: 96,
    latestChapter: 96,
    updatedAt: "4d ago",
    coverStyle: "from-rose-200/30 via-transparent to-purple-500/10",
    tags: ["Romance", "Drama", "Court"],
    synopsis:
      "A palace scribe falls into a diplomatic gambit where every translation risks a war.",
    age: "16+",
  },
  {
    id: 4,
    slug: "caravan-of-mirrors",
    title: "Caravan of Mirrors",
    altTitle: "Cermin di Padang",
    origin: "ID",
    author: "R. Kadri",
    team: "Sable Route",
    language: "EN",
    status: "Ongoing",
    rating: 4.3,
    follows: "39k",
    chapters: 27,
    latestChapter: 27,
    updatedAt: "1d ago",
    coverStyle: "from-orange-200/20 via-transparent to-yellow-500/20",
    tags: ["Adventure", "Desert", "Found family"],
    synopsis:
      "A desert courier and a mirror maker chase stolen relics across a living map.",
    age: "13+",
  },
  {
    id: 5,
    slug: "monsoon-atelier",
    title: "Monsoon Atelier",
    altTitle: "Atelier Hujan",
    origin: "KR",
    author: "Yun Seo",
    team: "Harbor Notes",
    language: "EN",
    status: "Hiatus",
    rating: 4.2,
    follows: "22k",
    chapters: 18,
    latestChapter: 18,
    updatedAt: "2w ago",
    coverStyle: "from-emerald-200/20 via-transparent to-teal-500/10",
    tags: ["Slice of life", "Studio", "Art"],
    synopsis:
      "An illustrator rebuilds her studio in the monsoon season while translating lost letters.",
    age: "All ages",
  },
];

type Chapter = {
  id: number;
  number: number;
  volume: number;
  title: string;
  words: number;
  time: string;
  releasedAt: string;
  content: string[];
};

type BaseChapter = Omit<Chapter, "volume">;

const makeLongContent = (seed: string[], targetWords: number) => {
  const result: string[] = [];
  let count = 0;
  let index = 0;

  while (count < targetWords && seed.length > 0) {
    const paragraph = seed[index % seed.length];
    result.push(paragraph);
    count += paragraph.split(/\s+/).length;
    index += 1;
  }

  return result;
};

const expandChapters = (source: Record<string, BaseChapter[]>) => {
  const entries = Object.entries(source).map(([slug, chapters]) => {
    const expanded = chapters.map((chapter) => ({
      ...chapter,
      volume: Math.max(1, Math.ceil(chapter.number / 10)),
      content: makeLongContent(chapter.content, 5000),
      words: 5000,
      time: "20 min read",
    }));
    return [slug, expanded] as const;
  });

  return Object.fromEntries(entries) as Record<string, Chapter[]>;
};

const baseChaptersBySlug: Record<string, BaseChapter[]> = {
  "ashen-crown": [
    {
      id: 6398,
      number: 60,
      title: "Quiet Ash",
      words: 2480,
      time: "8 min read",
      releasedAt: "4d ago",
      content: [
        "He read the dispatch aloud and changed one verb, a shift so small only a translator would notice.",
        "The council nodded anyway, hearing what they expected to hear.",
        "By nightfall, the scribes rehearsed his words as if they were scripture.",
        "Outside, the ash settled on the banners like a second seal.",
      ],
    },
    {
      id: 6399,
      number: 61,
      title: "Lantern Tax",
      words: 2720,
      time: "9 min read",
      releasedAt: "3d ago",
      content: [
        "A new levy on lantern oil was announced at dawn. The prince translated the outrage into policy language.",
        "Every sentence carried the smell of smoke.",
        "Merchants waited in the corridor, counting the pauses between his lines.",
        "He translated their silence too.",
      ],
    },
    {
      id: 6400,
      number: 62,
      title: "The Red Margin",
      words: 2640,
      time: "9 min read",
      releasedAt: "2d ago",
      content: [
        "He found a note scribbled in the treaty margin, the old red ink of his mother's tutor.",
        "He translated it twice, to be sure the warning was real.",
        "The margin bled into the page, turning the script into a map.",
        "He folded the paper until the warning fit inside his sleeve.",
      ],
    },
    {
      id: 6401,
      number: 63,
      title: "The Crown's Interpreter",
      words: 2860,
      time: "9 min read",
      releasedAt: "Yesterday",
      content: [
        "Ash carried across the palace like slow snow. The prince listened to the envoy and chose a softer verb, one that sounded like peace but meant delay.",
        "He was not translating for the emperor. He was translating for the city that still remembered his name.",
        "The envoy blinked, unsure if he had been flattered or postponed.",
        "The prince smiled and kept the war asleep for another hour.",
      ],
    },
    {
      id: 6402,
      number: 64,
      title: "Ink on the Treaty",
      words: 3120,
      time: "11 min read",
      releasedAt: "2h ago",
      content: [
        "The treaty arrived without wax or seal. He recognized the handwriting anyway: a script that always curved into the margins.",
        "He folded the paper once, twice, then finally spoke the translation that would keep the war asleep for one more season.",
        "The chamber held its breath and let the words settle.",
        "Outside, the streets learned to be quiet again.",
      ],
    },
  ],
  "neon-embassy": [
    {
      id: 4298,
      number: 40,
      title: "Signal Drift",
      words: 2320,
      time: "7 min read",
      releasedAt: "5d ago",
      content: [
        "The city flickered at noon. He translated the flicker into a warning from the embassy's core.",
        "His partner kept the radios quiet to listen for the second message.",
        "The warning came as a shimmer in the glass, a sentence without vowels.",
        "He spoke it anyway.",
      ],
    },
    {
      id: 4299,
      number: 41,
      title: "Glass Protocol",
      words: 2580,
      time: "9 min read",
      releasedAt: "4d ago",
      content: [
        "The embassy doors stayed closed. He translated the silence into a list of conditions.",
        "Every clause glowed like a neon scar.",
        "He read the final clause twice, tasting the static on each word.",
        "Some contracts arrive like storms.",
      ],
    },
    {
      id: 4301,
      number: 42,
      title: "Static Treaty",
      words: 2440,
      time: "8 min read",
      releasedAt: "3d ago",
      content: [
        "Every neon sign was a warning in a language he could finally read. The embassy tower hummed as if it had its own breathing pattern.",
        "He took the contract and translated the clause nobody wanted to see.",
        "When the clause was spoken, the lights in the alley dimmed.",
        "He wrote the translation on his wrist to keep it close.",
      ],
    },
    {
      id: 4302,
      number: 43,
      title: "Borrowed Thunder",
      words: 2980,
      time: "10 min read",
      releasedAt: "6h ago",
      content: [
        "The alien delegate smiled without teeth. He translated the silence between them and understood that the city was already collateral.",
        "He chose words that bought a single night of delay.",
        "The neon outside kept blinking anyway.",
      ],
    },
  ],
  "winter-script": [
    {
      id: 9598,
      number: 93,
      title: "Sealed Verse",
      words: 2540,
      time: "9 min read",
      releasedAt: "9d ago",
      content: [
        "She translated the ambassador's poem into a decree. The seal cracked in her hands.",
        "Snow covered the ink before it could dry.",
        "The court pretended not to notice the meter.",
        "She kept the original tucked beneath her sleeve.",
      ],
    },
    {
      id: 9599,
      number: 94,
      title: "Ink on Snow",
      words: 2760,
      time: "10 min read",
      releasedAt: "7d ago",
      content: [
        "The scribes debated a single honorific for an entire night.",
        "She chose the gentlest one and watched the room exhale.",
        "Outside, lanterns reflected on the snow like scattered coins.",
        "Inside, the title settled into place.",
      ],
    },
    {
      id: 9601,
      number: 95,
      title: "Snow Ledger",
      words: 2640,
      time: "9 min read",
      releasedAt: "1w ago",
      content: [
        "The courtier's seal cracked in the cold. She revised the poem into a decree, and no one noticed the change until spring.",
        "The empress read the decree in silence, then nodded once.",
        "The court scribes hurried to copy the new line.",
      ],
    },
    {
      id: 9602,
      number: 96,
      title: "Final Footnote",
      words: 3230,
      time: "12 min read",
      releasedAt: "4d ago",
      content: [
        "She left the translation unsigned. It was the only way to make the truth live longer than she did.",
        "The last page smelled of ink and winter flowers.",
        "She folded it into her sleeve and walked into the snow.",
      ],
    },
  ],
  "caravan-of-mirrors": [
    {
      id: 2698,
      number: 24,
      title: "Salt Tracks",
      words: 2140,
      time: "7 min read",
      releasedAt: "6d ago",
      content: [
        "They followed the salt trail toward a mirage that refused to fade.",
        "The translator counted the dunes like a prayer.",
        "Each dune hid a different echo of the map.",
        "The caravan moved anyway.",
      ],
    },
    {
      id: 2699,
      number: 25,
      title: "Mirror Stall",
      words: 2260,
      time: "8 min read",
      releasedAt: "5d ago",
      content: [
        "A trader sold mirrors that reflected the future by a single hour.",
        "She translated the warning etched on the frame and bought them anyway.",
        "The warning scratched her palm, a promise with no signature.",
        "She kept the mirror facing down.",
      ],
    },
    {
      id: 2701,
      number: 26,
      title: "Glass Compass",
      words: 2310,
      time: "8 min read",
      releasedAt: "3d ago",
      content: [
        "The caravan turned north, following a reflection that did not belong to the desert. He translated the map's shimmer into a route.",
        "A wind rose as if to erase their footprints.",
        "They walked faster.",
      ],
    },
    {
      id: 2702,
      number: 27,
      title: "River Under Sand",
      words: 2750,
      time: "9 min read",
      releasedAt: "1d ago",
      content: [
        "They dug beneath the dunes and found running water. She translated the ripples into a promise.",
        "The water carried a message without words.",
        "She listened until the sun fell.",
      ],
    },
  ],
  "monsoon-atelier": [
    {
      id: 1798,
      number: 15,
      title: "Wet Ink",
      words: 1960,
      time: "7 min read",
      releasedAt: "4w ago",
      content: [
        "The rain blurred the lines of her storyboard. She translated the letters by touch.",
        "Each page smelled like the sea.",
        "She pinned the notes across the studio wall like a constellation.",
        "The storm approved with thunder.",
      ],
    },
    {
      id: 1799,
      number: 16,
      title: "Studio Bells",
      words: 2050,
      time: "7 min read",
      releasedAt: "3w ago",
      content: [
        "Wind chimes rang from the ceiling as she copied the last paragraph.",
        "The studio felt full again.",
        "She taped the translation beside the window to dry.",
        "The rain eased its grip.",
      ],
    },
    {
      id: 1801,
      number: 17,
      title: "Paper Windows",
      words: 2100,
      time: "7 min read",
      releasedAt: "3w ago",
      content: [
        "Rain knocked on the studio's roof. She translated the letters into sketches and pinned them in rows.",
        "Her hands smelled of ink and tea.",
        "The sketches began to answer her back.",
      ],
    },
    {
      id: 1802,
      number: 18,
      title: "Quiet Afterstorm",
      words: 2400,
      time: "8 min read",
      releasedAt: "2w ago",
      content: [
        "The ink bled, but the meaning held. She translated the last line into a portrait and finally closed the window.",
        "The storm left behind a hush that felt like morning.",
        "She leaned back and let the page dry.",
      ],
    },
  ],
};

export const chaptersBySlug = expandChapters(baseChaptersBySlug);

export const commentsBySlug: Record<
  string,
  { id: number; name: string; note: string; time: string }[]
> = {
  "ashen-crown": [
    {
      id: 1,
      name: "Nara",
      note: "That treaty line was chilling. Perfect tension.",
      time: "1h ago",
    },
    {
      id: 2,
      name: "Jun",
      note: "Translator notes were great, thank you!",
      time: "5h ago",
    },
  ],
  "neon-embassy": [
    {
      id: 3,
      name: "Lio",
      note: "Love the cyberpunk tone. More please.",
      time: "9h ago",
    },
  ],
  "winter-script": [
    {
      id: 4,
      name: "Hana",
      note: "The ending felt earned. Bravo.",
      time: "2d ago",
    },
  ],
};

export const latestUpdates = [
  {
    slug: "ashen-crown",
    title: "Ashen Crown",
    chapter: 64,
    time: "2h ago",
    team: "Moonlit Scans",
  },
  {
    slug: "neon-embassy",
    title: "Neon Embassy",
    chapter: 43,
    time: "6h ago",
    team: "Ion Lantern",
  },
  {
    slug: "caravan-of-mirrors",
    title: "Caravan of Mirrors",
    chapter: 27,
    time: "1d ago",
    team: "Sable Route",
  },
];

export const teamSpotlight = [
  {
    name: "Moonlit Scans",
    focus: "Fantasy + political",
    active: 8,
    language: "JP -> EN",
  },
  {
    name: "Paperveil",
    focus: "Court drama",
    active: 5,
    language: "CN -> EN",
  },
  {
    name: "Harbor Notes",
    focus: "Slice of life",
    active: 3,
    language: "KR -> EN",
  },
];

export const genreTags = [
  "Fantasy",
  "Romance",
  "Adventure",
  "Drama",
  "Mystery",
  "Sci-fi",
  "Slice of life",
];

export const languageTags = ["JP", "KR", "CN", "ID", "TH"];

export const statusTags = ["Ongoing", "Completed", "Hiatus"];
