import { useEffect } from 'react';
import { useVideoPlayer } from 'expo-video';

/**
 * useManagedPlayer
 *
 * Dedicated hook for managing expo-video player lifecycle across FunFlick:
 * - Safely initializes player with source, loop, and mute settings.
 * - Declaratively synchronizes playback with shouldPlay state.
 * - Synchronizes global mute toggles.
 * - Synchronizes native playingChange event listeners.
 * - Guarantees safe cleanup and pausing on unmount to prevent audio leaks.
 */
export function useManagedPlayer({
  source,
  shouldPlay,
  isMuted = false,
  loop = true,
  onPlayingChange,
}) {
  const safeSource = source && typeof source === 'string' && source.trim().length > 0 ? source : null;

  const player = useVideoPlayer(safeSource, p => {
    if (!p) return;
    p.loop = Boolean(loop);
    p.muted = Boolean(isMuted);
    if (shouldPlay) {
      try {
        p.play();
      } catch (e) {}
    }
  });

  // Keep playback state synchronized with shouldPlay
  useEffect(() => {
    if (!player || !safeSource) return;
    try {
      if (shouldPlay) {
        player.play();
      } else {
        player.pause();
      }
    } catch (e) {
      console.warn('[useManagedPlayer] play/pause toggle error:', e?.message);
    }
  }, [player, safeSource, shouldPlay]);

  // Keep mute state synchronized
  useEffect(() => {
    if (!player || !safeSource) return;
    try {
      player.muted = Boolean(isMuted);
    } catch (e) {}
  }, [player, safeSource, isMuted]);

  // Sync native player status event listeners
  useEffect(() => {
    if (!player || !safeSource || !onPlayingChange) return;
    const sub = player.addListener?.('playingChange', event => {
      onPlayingChange(event.isPlaying);
    });
    return () => {
      sub?.remove?.();
    };
  }, [player, safeSource, onPlayingChange]);

  // Safety pause on unmount
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [player]);

  return player;
}
