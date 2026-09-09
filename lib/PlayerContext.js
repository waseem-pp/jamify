import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { supabase } from './supabase';

/**
 * Holds one audio player for the whole app and, when the user is in a jam,
 * keeps that player lined up with whatever the host is hearing.
 *
 * How the sync works:
 *  - The host broadcasts its position every 1.5s on a Supabase realtime channel.
 *  - Everyone else compares that to their own position. More than DRIFT_LIMIT
 *    seconds apart and they seek to the host's position.
 */

const DRIFT_LIMIT = 1.2;      // seconds of slack before we correct
const BROADCAST_EVERY = 1500; // ms between host updates

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const playerRef = useRef(null);
  const channelRef = useRef(null);

  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const [room, setRoom] = useState(null);     // { code, name, hostId }
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState([]);
  const [inSync, setInSync] = useState(true);

  // keep the latest values available inside intervals without re-subscribing
  const state = useRef({ track: null, isPlaying: false, isHost: false });
  state.current = { track, isPlaying, isHost };

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
    return () => {
      playerRef.current?.remove?.();
      channelRef.current?.unsubscribe?.();
    };
  }, []);

  // poll the player for position/duration
  useEffect(() => {
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      setPosition(p.currentTime ?? 0);
      setDuration(p.duration ?? 0);
    }, 400);
    return () => clearInterval(id);
  }, []);

  const ensurePlayer = useCallback((source) => {
    if (playerRef.current) {
      playerRef.current.remove?.();
    }
    const p = createAudioPlayer({ uri: source });
    playerRef.current = p;
    return p;
  }, []);

  const loadTrack = useCallback(
    async (t, { startAt = 0, autoplay = true, broadcast = true } = {}) => {
      if (!t) return;
      const p = ensurePlayer(t.url);
      setTrack(t);
      setDuration(0);
      try {
        if (startAt > 0) await p.seekTo(startAt);
        if (autoplay) {
          p.play();
          setIsPlaying(true);
        }
      } catch (e) {
        console.warn('Could not start track', e);
      }
      if (broadcast && state.current.isHost) sendTick(t, startAt, autoplay);
    },
    [ensurePlayer]
  );

  const togglePlay = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) {
      p.pause();
      setIsPlaying(false);
      if (isHost) sendTick(track, p.currentTime ?? 0, false);
    } else {
      p.play();
      setIsPlaying(true);
      if (isHost) sendTick(track, p.currentTime ?? 0, true);
    }
  }, [isPlaying, isHost, track]);

  const seek = useCallback(
    async (seconds) => {
      const p = playerRef.current;
      if (!p) return;
      await p.seekTo(seconds);
      setPosition(seconds);
      if (isHost) sendTick(track, seconds, isPlaying);
    },
    [isHost, isPlaying, track]
  );

  function sendTick(t, pos, playing) {
    const ch = channelRef.current;
    if (!ch || !t) return;
    ch.send({
      type: 'broadcast',
      event: 'tick',
      payload: { track: t, position: pos, isPlaying: playing, at: Date.now() },
    });
  }

  // host heartbeat
  useEffect(() => {
    if (!room || !isHost) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p || !state.current.track) return;
      sendTick(state.current.track, p.currentTime ?? 0, state.current.isPlaying);
    }, BROADCAST_EVERY);
    return () => clearInterval(id);
  }, [room, isHost]);

  const joinRoom = useCallback(
    async ({ code, name, hostId, asHost, displayName }) => {
      channelRef.current?.unsubscribe?.();

      const channel = supabase.channel(`jam:${code}`, {
        config: { presence: { key: displayName } },
      });

      channel
        .on('broadcast', { event: 'tick' }, ({ payload }) => {
          if (state.current.isHost) return;
          applyHostTick(payload);
        })
        .on('broadcast', { event: 'hello' }, () => {
          // a newcomer arrived; the host answers straight away with its position
          if (!state.current.isHost) return;
          const p = playerRef.current;
          if (p && state.current.track) {
            sendTick(state.current.track, p.currentTime ?? 0, state.current.isPlaying);
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const s = channel.presenceState();
          setMembers(Object.keys(s));
        });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name: displayName, joinedAt: Date.now() });
          if (!asHost) channel.send({ type: 'broadcast', event: 'hello', payload: {} });
        }
      });

      channelRef.current = channel;
      setRoom({ code, name, hostId });
      setIsHost(!!asHost);
    },
    []
  );

  async function applyHostTick(payload) {
    if (!payload?.track) return;
    const p = playerRef.current;
    const sameTrack = state.current.track?.id === payload.track.id;

    if (!sameTrack) {
      await loadTrack(payload.track, {
        startAt: payload.position,
        autoplay: payload.isPlaying,
        broadcast: false,
      });
      setInSync(true);
      return;
    }
    if (!p) return;

    const drift = (p.currentTime ?? 0) - payload.position;
    if (Math.abs(drift) > DRIFT_LIMIT) {
      await p.seekTo(payload.position);
      setInSync(false);
      setTimeout(() => setInSync(true), 900);
    } else {
      setInSync(true);
    }

    if (payload.isPlaying && !state.current.isPlaying) {
      p.play();
      setIsPlaying(true);
    } else if (!payload.isPlaying && state.current.isPlaying) {
      p.pause();
      setIsPlaying(false);
    }
  }

  const leaveRoom = useCallback(() => {
    channelRef.current?.unsubscribe?.();
    channelRef.current = null;
    setRoom(null);
    setIsHost(false);
    setMembers([]);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        track, isPlaying, position, duration,
        room, isHost, members, inSync,
        loadTrack, togglePlay, seek, joinRoom, leaveRoom,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
