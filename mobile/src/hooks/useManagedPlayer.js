import { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { useVideoPlayer } from 'expo-video';

/**
 * useManagedPlayer
 *
 * Dedicated hook for managing expo-video player lifecycle:
 * - Creates player only when safeSource is valid.
 * - Tracks AppState (foreground/background) to automatically pause background playback.
 * - Exactly ONE effect drives player.play() and player.pause() based on:
 *     effectiveShouldPlay = shouldPlay && appInForeground
 * - Listens to statusChange/playingChange exclusively to drive `isBuffering`.
 *   NEVER writes to paused / userPaused state.
 * - Synchronizes global mute.
 * - Safe pause & cleanup on unmount.
 */
export function useManagedPlayer({
  source,
  shouldPlay = false,
  isMuted = false,
  loop = true,
}) {
  const [appInForeground, setAppInForeground] = useState(AppState.currentState === 'active');
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      setAppInForeground(nextState === 'active');
    });
    return () => sub.remove();
  }, []);

  const safeSource = source && typeof source === 'string' && source.trim().length > 0 ? source : null;

  const player = useVideoPlayer(safeSource, p => {
    if (!p) return;
    p.loop = Boolean(loop);
    p.muted = Boolean(isMuted);
    if (shouldPlay && AppState.currentState === 'active') {
      try {
        p.play();
      } catch (e) {}
    }
  });

  const effectiveShouldPlay = Boolean(safeSource && shouldPlay && appInForeground);

  // Exactly ONE effect calling play() / pause()
  useEffect(() => {
    if (!player || !safeSource) return;
    try {
      if (effectiveShouldPlay) {
        player.play();
      } else {
        player.pause();
      }
    } catch (e) {
      console.warn('[useManagedPlayer] play/pause error:', e?.message);
    }
  }, [player, safeSource, effectiveShouldPlay]);

  // Sync mute state
  useEffect(() => {
    if (!player || !safeSource) return;
    try {
      player.muted = Boolean(isMuted);
    } catch (e) {}
  }, [player, safeSource, isMuted]);

  // Sync buffering status from native player events (does NOT touch paused state)
  useEffect(() => {
    if (!player || !safeSource) return;
    const subStatus = player.addListener?.('statusChange', event => {
      setIsBuffering(event.status === 'loading');
    });
    const subPlaying = player.addListener?.('playingChange', event => {
      if (effectiveShouldPlay && !event.isPlaying) {
        setIsBuffering(true);
      } else if (event.isPlaying) {
        setIsBuffering(false);
      }
    });
    return () => {
      subStatus?.remove?.();
      subPlaying?.remove?.();
    };
  }, [player, safeSource, effectiveShouldPlay]);

  // Safety cleanup on unmount
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [player]);

  return { player, isBuffering };
}
