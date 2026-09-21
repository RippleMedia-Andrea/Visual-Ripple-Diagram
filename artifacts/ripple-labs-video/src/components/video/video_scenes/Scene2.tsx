import { motion } from 'framer-motion';
import { SafeFrame } from '@/lib/video';

const stages = [
  ['01', 'Reveal', 'your story'],
  ['02', 'Identify', 'your patterns'],
  ['03', 'Pinpoint', 'your purpose'],
  ['04', 'Personalize', 'your season'],
  ['05', 'Live', 'your ripple'],
  ['06', 'Expand', 'your growth'],
];

export function Scene2() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
      animate={{ opacity: 1, clipPath: 'inset(0% 0 0 0)' }}
      exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: .85, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: 'linear-gradient(170deg, #0f2a36 0%, #153f49 54%, #2f7f7b 140%)' }}
    >
      <div className="film-noise" />
      <motion.div
        className="absolute -left-[27vmin] top-[22vmin] h-[70vmin] w-[70vmin] rounded-full border"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{ borderColor: 'rgba(200,169,106,.26)', borderWidth: '1px' }}
      />
      <motion.div
        className="absolute right-[-17vmin] bottom-[-4vmin] h-[48vmin] w-[48vmin] rounded-full"
        animate={{ scale: [1, 1.08, 1], opacity: [.22, .42, .22] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, rgba(95,168,165,.36), transparent 68%)' }}
      />
      <SafeFrame>
        <div className="relative flex h-full flex-col">
          <motion.p
            className="tracking-caps text-[2.3vmin]"
            style={{ color: '#9fd0cd' }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: .25, duration: .6 }}
          >
            The Ripple Method™
          </motion.p>
          <motion.h2
            className="mt-[6vmin] max-w-[72vmin] font-display text-[11vmin] leading-[.94] tracking-[-.055em]"
            style={{ color: '#eee9db' }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .4, duration: .9, ease: [0.16, 1, 0.3, 1] }}
          >
            Six stages.
            <br />
            <span style={{ color: '#c8a96a' }}>One guided arc.</span>
          </motion.h2>
          <div className="relative mt-[8vmin] flex-1">
            <motion.div
              className="absolute left-[5vmin] top-[3vmin] h-[92%] w-px"
              initial={{ scaleY: 0, transformOrigin: 'top' }}
              animate={{ scaleY: 1 }}
              transition={{ delay: .85, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: 'linear-gradient(#c8a96a, rgba(200,169,106,.12))' }}
            />
            <div className="flex h-full flex-col justify-between py-[2vmin]">
              {stages.map(([number, title, subtitle], index) => (
                <motion.div
                  key={number}
                  className="relative flex items-center gap-[5vmin]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: .95 + index * .15, duration: .55, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    className="z-10 flex h-[10vmin] w-[10vmin] shrink-0 items-center justify-center rounded-full border"
                    style={{ background: '#173b45', borderColor: '#c8a96a', color: '#c8a96a' }}
                    animate={{ boxShadow: ['0 0 0 rgba(200,169,106,0)', '0 0 0 8px rgba(200,169,106,.05)', '0 0 0 rgba(200,169,106,0)'] }}
                    transition={{ delay: 1.3 + index * .15, duration: 2.7, repeat: Infinity }}
                  >
                    <span className="font-display text-[3.2vmin]">{number}</span>
                  </motion.div>
                  <div>
                    <p className="font-display text-[5.4vmin] leading-none" style={{ color: '#eee9db' }}>{title}</p>
                    <p className="mt-[1vmin] tracking-caps text-[2vmin]" style={{ color: '#9fd0cd' }}>{subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.p
            className="border-t pt-[3vmin] text-[3.5vmin] leading-[1.3]"
            style={{ borderColor: 'rgba(238,233,219,.2)', color: '#d4e1dc' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: .7 }}
          >
            Not a test to pass. A conversation to keep having.
          </motion.p>
        </div>
      </SafeFrame>
    </motion.section>
  );
}