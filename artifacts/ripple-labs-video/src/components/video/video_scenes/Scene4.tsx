import { motion } from 'framer-motion';
import { SafeFrame } from '@/lib/video';

export function Scene4() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)' }}
      animate={{ opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
      exit={{ opacity: 0, clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)' }}
      transition={{ duration: .9, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: 'linear-gradient(150deg, #0f2a36 0%, #102f3a 48%, #1f615f 140%)' }}
    >
      <div className="film-noise" />
      <motion.div
        className="absolute left-1/2 top-[40%] h-[76vmin] w-[76vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{ scale: [1, 1.12, 1], opacity: [.18, .35, .18] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, rgba(95,168,165,.35), rgba(95,168,165,0) 65%)' }}
      />
      <motion.div
        className="absolute left-1/2 top-[40%] h-[52vmin] w-[52vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{ borderColor: 'rgba(200,169,106,.3)', borderWidth: '1px', borderStyle: 'dashed' }}
      />
      <SafeFrame>
        <div className="relative flex h-full flex-col items-center text-center">
          <motion.p
            className="self-start tracking-caps text-[2.3vmin]"
            style={{ color: '#9fd0cd' }}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: .3, duration: .6 }}
          >
            Reflection, with boundaries
          </motion.p>
          <motion.h2
            className="mt-[7vmin] max-w-[80vmin] font-display text-[11.3vmin] leading-[.92] tracking-[-.06em]"
            style={{ color: '#eee9db' }}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .45, duration: .85, ease: [0.16, 1, 0.3, 1] }}
          >
            A guide that
            <br />
            <span style={{ color: '#c8a96a' }}>keeps you safe.</span>
          </motion.h2>
          <motion.div
            className="relative mt-[17vmin] flex h-[46vmin] w-[46vmin] items-center justify-center rounded-full border"
            style={{ borderColor: 'rgba(200,169,106,.76)', background: 'rgba(15,42,54,.35)' }}
            initial={{ opacity: 0, scale: .45, rotate: -24 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: .65, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="absolute inset-[5vmin] rounded-full border"
              animate={{ scale: [1, .92, 1], opacity: [.32, .6, .32] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ borderColor: '#5fa8a5' }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <svg width="42" height="48" viewBox="0 0 42 48" fill="none" aria-hidden="true">
                <path d="M10 21v-6C10 8.9 14.9 4 21 4s11 4.9 11 11v6" stroke="#C8A96A" strokeWidth="2.2" strokeLinecap="round" />
                <rect x="4" y="20" width="34" height="24" rx="8" stroke="#EEE9DB" strokeWidth="2.2" />
                <circle cx="21" cy="31" r="3" fill="#5FA8A5" />
                <path d="M21 34v5" stroke="#5FA8A5" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <span className="mt-[2vmin] font-display text-[4.2vmin]" style={{ color: '#eee9db' }}>protected</span>
            </div>
          </motion.div>
          <motion.div
            className="mt-[12vmin] max-w-[78vmin] text-left"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.45, duration: .8 }}
          >
            <div className="flex gap-[3vmin]">
              <span className="mt-[1.5vmin] h-px w-[8vmin] shrink-0" style={{ background: '#c8a96a' }} />
              <p className="text-[4vmin] leading-[1.34]" style={{ color: '#d7e6e0' }}>
                Your words stay yours. The AI guide reflects, asks, and helps you notice — never performs your life for you.
              </p>
            </div>
          </motion.div>
        </div>
      </SafeFrame>
    </motion.section>
  );
}