# Jamify

A music app where a group listens together — same song, same second.

## What's inside

- Email sign-up and sign-in (Supabase Auth)
- A starter library of free demo tracks
- Upload your own MP3s from your phone
- Start a jam, share a 5-letter code, and everyone who joins follows the host's playback
- A live list of who's listening, and a badge that tells you when you're in sync

## Setup

**1. Install**

```bash
npm install
```

**2. Make a Supabase project** at supabase.com (free). Then:

- Open **SQL Editor**, paste everything from `supabase/schema.sql`, and run it.
- Open **Project Settings → API** and copy the Project URL and the `anon` public key.

**3. Paste your keys** into `app.json`:

```json
"extra": {
  "supabaseUrl": "https://xxxx.supabase.co",
  "supabaseAnonKey": "eyJhbGci..."
}
```

**4. Turn off email confirmation while you test** (Authentication → Sign In / Providers → Email → uncheck "Confirm email"). Otherwise every test account needs a click in its inbox first.

**5. Run it**

```bash
npx expo start
```

Install **Expo Go** on your phone and scan the QR code.

## Trying the jam feature

You need two devices, or one phone plus an emulator.

1. Sign up on both.
2. On device A: **Jam → Start a jam**. A 5-letter code appears.
3. On device B: **Jam**, type the code, tap **Join**.
4. On device A: go to **Library** and tap a song.

Device B starts the same song at the same position within a second or two. Pause on A and B pauses too.

## How the sync actually works

There's no clever clock protocol here — just a heartbeat:

- The host broadcasts `{ track, position, isPlaying }` on a Supabase realtime channel every 1.5 seconds.
- Listeners compare that position to their own. More than 1.2 seconds off, they seek to the host's position.
- A new joiner sends a "hello", and the host immediately replies with its position so nobody waits for the next heartbeat.

Both numbers live at the top of `lib/PlayerContext.js`. Tighten `DRIFT_LIMIT` for closer sync at the cost of more seeking; loosen it if playback feels jumpy on slow networks.

Fair warning: phones on different networks drift a little, so expect sync within roughly half a second rather than perfect sample alignment. That's fine for listening together; it isn't good enough for, say, a synchronised light show.

## About the music

The five starter tracks are free demo recordings from SoundHelix, included so the app does something the moment you open it. **Real catalog music is a licensing question, not a technical one** — Spotify's own API won't stream full songs into a third-party player, and uploading commercial MP3s to a public app isn't legal. For a portfolio piece or a demo video this is fine. If you ever want a real catalog, you'd need a licensed provider.

## Where to go next

- Queue of upcoming songs instead of one track at a time
- Chat inside the jam
- Let the host hand control to someone else
- Skip / previous buttons wired into the same broadcast
