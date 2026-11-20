# Gameforces

Play the game theory problems from Codeforces against a perfect bot or a friend, with Elo ratings.

- **60 games** from the Codeforces `games` tag, each linked to its problem (`src/games/`).
- **Perfect bot:** every position is small enough to solve exactly (memoised minimax, or retrograde analysis for games with cycles). Against the bot you always get the winning side, so any mistake loses.
- **Friends:** "Challenge a friend" creates a match and a `#/match/<id>` link. Moves sync live through Firestore, and each client replays and checks every move.
- **Rating:** Elo with K = 64 for the first 10 games and 32 after that, capped at ±64 per game. The bot's rating is the problem's Codeforces rating −300 / +0 / +300 for the Easy / Medium / Hard size tier. Friend games use both players' ratings.

Without Firebase config the app still works: bot games are rated locally in the browser, and friend matches and the leaderboard are hidden.

## Development

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # every game: positions solve quickly and bot-vs-bot reaches the solved value
npm run lint
npm run build
npm run test:rules   # Firestore rules tests in the emulator (needs Java 21+)
```

To use Firebase, copy `.env.example` to `.env.local` and fill in a web app config. Set `VITE_USE_EMULATORS=true` to use local emulators (`npx firebase emulators:start --only auth,firestore`).

## Firebase setup

1. Create a Firebase project and a web app, enable **Google** sign-in under Authentication, and create a Firestore database.
2. Add the GitHub Pages domain (`<user>.github.io`) to Authentication → Settings → Authorized domains.
3. Deploy the rules: `npx firebase deploy --only firestore --project <project-id>`.
4. Add the six `VITE_FIREBASE_*` values as repository secrets. The Pages workflow builds with them.

## Adding a game

Add an object to one of `src/games/batch*.js` with `id`, `cf` (contest, index, name, rating), `roles`, `kind` (`win` or `score`), `rules`, `generate(rng, tier)`, `turn`, `moves`, `apply`, `label` and `board`. Optional: `terminal`/`outcome`, `key` (memo key for equivalent states), `cyclic`, `solverMoves`, `validate`. Add a view for the board in `src/components/views.js`, or leave it out to get a generic view. `npm test` checks the new game automatically.

## Limits

Ratings are computed in the browser, since the free Firebase plan has no server code. The Firestore rules cap each change at ±64, need a new history entry per rated game, and only let the player to move append a move. A determined user could still fake bot results.
