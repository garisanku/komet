# KOMET — Ride the Comet, Reach the Sun

A best-game-01 entry for make.fun. A bright, fast arcade game: steer a comet
through the night sky, collect star shards, dodge asteroids, escape black
holes, slingshot around planets, and reach the distant Sun.

## How to play

- **Steer** with the mouse or the arrow keys / WASD. The comet follows your pointer.
- **Collect ✦ shards** to grow your tail and raise your score.
- **Dodge rocks** — each hit costs 1 hull (3 hulls). A hit shatters the rock.
- **Escape black holes** — they pull you in; their event horizon is fatal.
- **Slingshot around planets** — skim one for a speed boost and +200 points.
- **Reach the Sun** at the end of the road (12,000 units) to win.
- **P** pauses, **M** mutes, **Enter** starts and restarts.

## Run it

Serve `game/` on any static server and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

Or hand it in with the kit's entrypoint (Node 22, standard library only):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes
`dossier.json`. It clears the output directory's *contents* without removing
the directory itself, so it is safe when the output path is a volume mount.

## Screenshots

Four real renders of the game's own code (`screenshots/`, 1280×720 JPEG):

1. `1-title.jpg` — title screen
2. `2-play.jpg` — mid-flight
3. `3-victory.jpg` — reaching the Sun
4. `4-over.jpg` — game over

Retake them with `node shots.mjs` (needs `serve.ts` running on port 8081),
and verify the game with `node playtest.mjs` (25 automated checks).

## Tech

Plain Canvas 2D and ES modules, no libraries, no network requests, no build
step. WebAudio synth for sound (pickup chime, hit thud, slingshot whoosh,
victory arpeggio). Seeded RNG for reproducible screenshot scenes
(`game/?shot=<scene>&seed=20261117`, captured once `window.__shotReady` is set).

## License

MIT — see `LICENSE`.
