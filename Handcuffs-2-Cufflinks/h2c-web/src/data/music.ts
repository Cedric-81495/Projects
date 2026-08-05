import type { MusicRelease, VideoItem } from '@/types';

export const music: MusicRelease[] = [
  {
    "id": "rel-1",
    "type": "Album",
    "t": "Provisional title 01",
    "yr": "2026",
    "media": {
      "kind": "image",
      "src": "/assets/look8.jpg",
      "alt": "Provisional title 01",
      "ratio": "1x1",
      "file": "KMM_Album01_Cover_3000.jpg"
    }
  },
  {
    "id": "rel-2",
    "type": "Single",
    "t": "Provisional title 02",
    "yr": "2026",
    "media": {
      "kind": "image",
      "src": "/assets/look1.jpg",
      "alt": "Provisional title 02",
      "ratio": "1x1",
      "file": "KMM_Single02_Cover_3000.jpg"
    }
  },
  {
    "id": "rel-3",
    "type": "Mixtape",
    "t": "Provisional title 03",
    "yr": "2025",
    "media": {
      "kind": "image",
      "src": "/assets/look5.jpg",
      "alt": "Provisional title 03",
      "ratio": "1x1",
      "file": "KMM_Mixtape03_Cover_3000.jpg"
    }
  },
  {
    "id": "rel-4",
    "type": "Single",
    "t": "Provisional title 04",
    "yr": "2025",
    "media": {
      "kind": "image",
      "src": "/assets/look3.jpg",
      "alt": "Provisional title 04",
      "ratio": "1x1",
      "file": "KMM_Single04_Cover_3000.jpg"
    }
  },
  {
    "id": "rel-5",
    "type": "Album",
    "t": "Provisional title 05",
    "yr": "2025",
    "media": {
      "kind": "image",
      "src": "/assets/look7.jpg",
      "alt": "Provisional title 05",
      "ratio": "1x1",
      "file": "KMM_Album05_Cover_3000.jpg"
    }
  },
  {
    "id": "rel-6",
    "type": "Single",
    "t": "Provisional title 06",
    "yr": "2024",
    "media": {
      "kind": "image",
      "src": "/assets/look2.jpg",
      "alt": "Provisional title 06",
      "ratio": "1x1",
      "file": "KMM_Single06_Cover_3000.jpg"
    }
  },
  {
    "id": "rel-7",
    "type": "Mixtape",
    "t": "Provisional title 07",
    "yr": "2024",
    "media": {
      "kind": "image",
      "src": "/assets/look6.jpg",
      "alt": "Provisional title 07",
      "ratio": "1x1",
      "file": "KMM_Mixtape07_Cover_3000.jpg"
    }
  },
  {
    "id": "rel-8",
    "type": "Single",
    "t": "Provisional title 08",
    "yr": "2024",
    "media": {
      "kind": "image",
      "src": "/assets/look4.jpg",
      "alt": "Provisional title 08",
      "ratio": "1x1",
      "file": "KMM_Single08_Cover_3000.jpg"
    }
  }
];

export const videos: VideoItem[] = [
  {
    "id": "vid-1",
    "t": "Music video 01",
    "dur": "3:42",
    "media": {
      "kind": "video",
      "poster": "",
      "alt": "Music video 01",
      "provider": "youtube",
      "duration": "3:42",
      "ratio": "16x9",
      "src": ""
    }
  },
  {
    "id": "vid-2",
    "t": "Music video 02",
    "dur": "4:07",
    "media": {
      "kind": "video",
      "poster": "",
      "alt": "Music video 02",
      "provider": "youtube",
      "duration": "4:07",
      "ratio": "16x9",
      "src": ""
    }
  },
  {
    "id": "vid-3",
    "t": "Behind the record",
    "dur": "8:15",
    "media": {
      "kind": "video",
      "poster": "",
      "alt": "Behind the record",
      "provider": "youtube",
      "duration": "8:15",
      "ratio": "16x9",
      "src": ""
    }
  }
];
