# PokemonSite

A Pokémon-themed Angular SPA with a Gen I Pokédex browser and a real-time 1v1 multiplayer battle system. All game data is served from local static JSON; battles are resolved server-side via a companion Socket.IO server ([PokemonSiteServer](https://github.com/Correu/PokemonSiteServer)).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Angular 20 |
| UI Components | Angular Material 20 |
| Real-time | Socket.IO client 4.x |
| Language | TypeScript 5.8 |
| Reactive layer | RxJS 7.8 |
| Build | Angular CLI 20 / `@angular/build` |
| Deployment | AWS Amplify |

---

## Features

### Pokédex

- Browse all 151 Gen I Pokémon loaded from local JSON — no runtime PokeAPI calls.
- Search by name or ID; filter by type and generation.
- Detail panel shows sprite, types, base stats, abilities, and learnset grouped by method (Level Up, TM/HM, Egg, Tutor).

### 1v1 Battle

Turn-based PvP battles using Socket.IO for real-time communication. One player hosts the battle server; both players connect to it through the app. All damage, status, and item resolution runs server-side — the client only displays state.

See [Battle Flow](#battle-flow) below for the full step-by-step process.

---

## Battle Flow

The battle workspace walks both players through six sequential steps.

### 1. Connect to Battle Server

The battle workspace opens with a **Socket.IO URL** field (default: `http://localhost:3000`). Enter the address of the player-hosted server and click **Apply and reconnect**. The URL is saved in `localStorage` and embedded in invite links so guests connect automatically.

> For remote play, one player must run [PokemonSiteServer](https://github.com/Correu/PokemonSiteServer) and expose it over the internet. See the server README for setup options (ngrok, LAN IP, port forwarding).

### 2. Create or Join a Room

**Host:**
- Configure the match rules: level cap (1–100), team size (1–6), and item settings (on/off, slot count, stack limit, total use pool).
- A 6-character room code is generated. Share it or use the copy-invite-link button.

**Guest:**
- Enter the room code, or use the invite link your opponent shared.
- Invite links embed both the room code and the server URL:
  ```
  https://your-app.com/battle?join=<code>&socketUrl=<server-url>
  ```

Both players click **Ready**. A 3-second countdown begins, then the match starts.

### 3. Pick Your Team

Select up to `teamSize` Pokémon from the Gen I roster. Only the first 151 Pokémon are available.

### 4. Assign Moves

For each Pokémon, choose up to 4 moves from their learnable set at the configured level. The eligible move list is derived from each Pokémon's learnset filtered to the match level.

### 5. Set Up Items (optional)

If the host enabled items, build a bag subject to the host's rules:
- **Slot limit** — maximum number of distinct item types allowed.
- **Stack limit** — maximum quantity per item slot.
- **Total use pool** — maximum total item uses across the whole bag.
- You can also assign a **held item** to individual Pokémon (item must be in your bag).

Then **lock in your team** to signal you are ready to battle.

### 6. Fight

Once both players lock in, combat begins.

Each turn you choose one action:

| Action | Description |
| --- | --- |
| **Fight** | Use one of your active Pokémon's moves |
| **Bag** | Use an item from your bag on your active Pokémon |
| **Pokémon** | Switch your active Pokémon for another on your bench |
| **End Fight** | Forfeit the match |

Turns resolve simultaneously. The server determines turn order by move priority, then Speed (paralysis halves Speed), then a coin flip. State is broadcast to both players after each turn.

The match ends when all of one player's Pokémon faint, or on a forfeit.

---

## Self-Hosting the Battle Server

The battle server is a separate open-source project. **One player must run it for a match to happen.** The app itself is stateless — it only needs a working Socket.IO URL.

Server repo: [https://github.com/Correu/PokemonSiteServer](https://github.com/Correu/PokemonSiteServer)

**Quick start for the hosting player:**

1. Clone and start the server:
   ```bash
   git clone https://github.com/Correu/PokemonSiteServer
   cd PokemonSiteServer
   npm install
   npm start
   # Server is now running on http://localhost:3000
   ```

2. Expose the server so your opponent can reach it. The easiest option is [ngrok](https://ngrok.com/):
   ```bash
   ngrok http 3000
   # Copy the https://xxxx.ngrok-free.app URL
   ```

3. In the battle workspace, enter that URL in the **Socket.IO URL** field and click **Apply and reconnect**.

4. Create a room and share the invite link. The invite link includes the server URL so your opponent connects to the right place automatically.

> **HTTPS note:** This app is served over HTTPS (Amplify). Your browser will block a plain `http://` Socket.IO connection from an HTTPS page. Use an HTTPS tunnel (ngrok provides one by default) rather than a bare `http://` IP or port-forward.

---

## Running Locally (Development)

You need both the frontend and the server running.

**Terminal 1 — Frontend:**
```bash
cd PokemonSite
npm install
npm start
# Navigate to http://localhost:4200
```

**Terminal 2 — Server:**
```bash
cd PokemonSiteServer
npm install
npm start
# Socket.IO server on http://localhost:3000
```

The battle workspace defaults to `http://localhost:3000`, so no URL change is needed in dev.

---

## Build & Deployment

```bash
ng build
# Output: dist/pokemon-site/browser/
```

Deployed to **AWS Amplify** via `amplify.yml` (`npm ci` → `npm run build`). A `_redirects` file in `src/` is included in the build output to handle SPA client-side routing:
```
/* /index.html 200
```

---

## Links

- [Angular Docs](https://angular.dev/)
- [Angular Material Docs](https://material.angular.io/)
- [Socket.IO Docs](https://socket.io/)
- [PokeAPI](https://pokeapi.co/docs/v2) — source used to generate the local data files
- [PokemonSiteServer](https://github.com/Correu/PokemonSiteServer) — battle server (self-hosted by players)
