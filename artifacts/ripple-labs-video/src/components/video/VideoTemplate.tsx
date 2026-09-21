import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useVideoPlayer, useVideoAudio, VideoCanvas } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  intro: 4200,
  method: 4300,
  memory: 3900,
  guide: 4200,
  statement: 5600,
};

const VIDEO_ASPECT_RATIO = '9:16' as const;

function PersistentAtmosphere({ currentScene }: { currentScene: number }) {
  const palettes = [
    ['#eee9db', '#d5e4df'],
    ['#0f2a36', '#2f7f7b'],
    ['#d8e6e0', '#eee9db'],
    ['#0f2a36', '#1f615f'],
    ['#eee9db', '#c9dfd8'],
  ];
  const [from, to] = palettes[currentScene] ?? palettes[0];

  return (
    <>
      <motion.div
        className="absolute inset-0"
        animate={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[42vmin] w-[42vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{
          x: currentScene % 2 === 0 ? '-24vmin' : '24vmin',
          y: currentScene === 3 ? '-18vmin' : '20vmin',
          scale: currentScene === 1 ? 1.65 : currentScene === 3 ? 1.35 : .82,
          opacity: currentScene === 1 || currentScene === 3 ? .24 : .13,
          background: currentScene === 1 || currentScene === 3
            ? 'radial-gradient(circle, rgba(200,169,106,.34), rgba(200,169,106,0) 68%)'
            : 'radial-gradient(circle, rgba(95,168,165,.34), rgba(95,168,165,0) 68%)',
        }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="pointer-events-none absolute left-[7vmin] top-[6vmin] h-px w-[24vmin]"
        animate={{
          width: currentScene === 0 ? '24vmin' : currentScene === 4 ? '12vmin' : '18vmin',
          opacity: currentScene === 0 || currentScene === 4 ? .8 : .3,
        }}
        transition={{ duration: 1 }}
        style={{ background: '#c8a96a' }}
      />
    </>
  );
}

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS, loop: true });
  const { muted, paused } = useVideoAudio();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (paused) {
      audio.pause();
      return;
    }

    let targetTime = 0;
    for (let i = 0; i < currentScene; i++) {
      targetTime += Object.values(SCENE_DURATIONS)[i] / 1000;
    }

    if (Math.abs(audio.currentTime - targetTime) > 0.5) {
      audio.currentTime = targetTime;
    }

    audio.play().catch(() => {});
  }, [currentScene, paused]);

  const scene = [
    <Scene1 key="scene-1" />,
    <Scene2 key="scene-2" />,
    <Scene3 key="scene-3" />,
    <Scene4 key="scene-4" />,
    <Scene5 key="scene-5" />,
  ][currentScene] ?? <Scene1 key="scene-fallback" />;

  return (
    <VideoCanvas
      aspectRatio={VIDEO_ASPECT_RATIO}
      aria-label="Ripple Labs Purpose Lab launch film"
      style={{ backgroundColor: 'var(--color-bg-dark)' }}
    >
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music_2.mp3`}
        muted={muted}
        preload="auto"
      />
      <PersistentAtmosphere currentScene={currentScene} />
      <AnimatePresence mode="sync" initial={false}>
        {scene}
      </AnimatePresence>
    </VideoCanvas>
  );
}
