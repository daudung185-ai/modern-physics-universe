# Planet textures

Optional 1K–2K assets belong in this directory with these filenames:

`sun.jpg`, `mercury.jpg`, `venus.jpg`, `earth_day.jpg`, `earth_clouds.png`, `mars.jpg`, `jupiter.jpg`, `saturn.jpg`, `saturn_ring.png`, `uranus.jpg`, `neptune.jpg`.

After adding assets, create a `.env` file with `VITE_USE_PLANET_TEXTURES=true` and restart Vite. Until then, the app uses procedural texture fallbacks and makes no requests for missing files.
