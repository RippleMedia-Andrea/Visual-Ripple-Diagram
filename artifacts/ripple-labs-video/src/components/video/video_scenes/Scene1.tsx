import { motion } from 'framer-motion';
import rippleLabsLogo from '@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png';
import {
  SafeFrame,
  VideoText,
} from '@/lib/video';

export function Scene1() {
  const words = ['Your', 'purpose', 'isn’t', 'found.'];

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 55%)' }}
      animate={{ opacity: 1, clipPath: 'circle(100% at 50% 55%)' }}
      exit={{ opacity: 0, clipPath: 'circle(0% at 50% 55%)' }}
      transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: 'linear-gradient(145deg, #eee9db 0%, #e5dfcf 60%, #d5e4df 100%)' }}
    >
      <div className="film-noise" />
      <motion.div
        className="absolute -right-[18vmin] top-[10vmin] h-[70vmin] w-[70vmin] rounded-full border"
        animate={{ rotate: [0, 9, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderColor: 'rgba(200,169,106,.38)', borderWidth: '1px' }}
      />
      <motion.div
        className="absolute left-[-13vmin] bottom-[14vmin] h-[43vmin] w-[43vmin] rounded-full"
        animate={{ y: [0, -14, 0], x: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, rgba(95,168,165,.22), rgba(95,168,165,0) 68%)' }}
      />
      <SafeFrame>
        <div className="relative flex h-full flex-col">
          <motion.img
            src={rippleLabsLogo}
            alt="Ripple Labs"
            className="h-[8vmin] w-[8vmin] rounded-full object-cover"
            initial={{ opacity: 0, scale: .7, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: .35, duration: .8, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="mt-auto mb-[15vmin]">
            <div className="mb-[5vmin] flex items-center gap-3">
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '15vmin', opacity: 1 }}
                transition={{ delay: .8, duration: .7 }}
                className="h-px"
                style={{ background: '#c8a96a' }}
              />
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: .5 }}
                className="tracking-caps text-[2.2vmin]"
                style={{ color: '#2f7f7b' }}
              >
                Ripple Labs / Purpose Lab
              </motion.span>
            </div>
            <div className="max-w-[88vmin]">
              {words.map((word, index) => (
                <motion.span
                  key={word}
                  className="mr-[2.2vmin] inline-block font-display text-[12.5vmin] leading-[.9] tracking-[-.055em]"
                  style={{ color: '#0f2a36' }}
                  initial={{ opacity: 0, y: 26, rotateX: -35 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: .55 + index * .11, duration: .75, ease: [0.16, 1, 0.3, 1] }}
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                className="inline-block font-display text-[12.5vmin] leading-[.9] tracking-[-.055em]"
                style={{ color: '#2f7f7b' }}
                initial={{ opacity: 0, y: 26, rotateX: -35 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: .99, duration: .75, ease: [0.16, 1, 0.3, 1] }}
              >
                It’s heard.
              </motion.span>
            </div>
            <motion.p
              className="mt-[6vmin] max-w-[72vmin] text-[4vmin] leading-[1.35]"
              style={{ color: '#456469' }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.55, duration: .8, ease: [0.16, 1, 0.3, 1] }}
            >
              A guided space to listen for the thread already running through your life.
            </motion.p>
          </div>
          <motion.div
            className="flex items-center justify-between border-t pt-[3vmin]"
            style={{ borderColor: 'rgba(15,42,54,.18)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: .8 }}
          >
            <VideoText scale="caption" className="tracking-caps" style={{ color: '#0f2a36' }}>
              A six-stage purpose journey
            </VideoText>
            <span className="font-display text-[4vmin]" style={{ color: '#c8a96a' }}>01</span>
          </motion.div>
        </div>
      </SafeFrame>
    </motion.section>
  );
}