import { motion } from 'framer-motion';
import { SafeFrame } from '@/lib/video';

const savedItems = [
  { label: 'stories', value: 'held with care', color: '#c8a96a' },
  { label: 'progress', value: 'ready when you are', color: '#5fa8a5' },
  { label: 'messages', value: 'waiting across sessions', color: '#2f7f7b' },
];

export function Scene3() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: .92, borderRadius: '34%' }}
      animate={{ opacity: 1, scale: 1, borderRadius: '0%' }}
      exit={{ opacity: 0, scale: 1.08, borderRadius: '28%' }}
      transition={{ duration: .9, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: 'linear-gradient(140deg, #d8e6e0 0%, #eee9db 46%, #e3d7bb 100%)' }}
    >
      <div className="film-noise" />
      <motion.div
        className="absolute left-1/2 top-[48%] h-[112vmin] w-[112vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        animate={{ rotate: [0, 4, 0], scale: [1, 1.015, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderColor: 'rgba(47,127,123,.18)', borderWidth: '1px' }}
      />
      <motion.div
        className="absolute left-1/2 top-[48%] h-[84vmin] w-[84vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        animate={{ rotate: [0, -7, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderColor: 'rgba(200,169,106,.32)', borderWidth: '1px' }}
      />
      <SafeFrame>
        <div className="relative flex h-full flex-col">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .35, duration: .6 }}
          >
            <p className="tracking-caps text-[2.3vmin]" style={{ color: '#2f7f7b' }}>A place to return to</p>
            <span className="font-display text-[4vmin]" style={{ color: '#c8a96a' }}>03</span>
          </motion.div>
          <motion.h2
            className="mt-[6vmin] max-w-[80vmin] font-display text-[11.5vmin] leading-[.92] tracking-[-.06em]"
            style={{ color: '#0f2a36' }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .45, duration: .85, ease: [0.16, 1, 0.3, 1] }}
          >
            Your journey
            <br />
            <span style={{ color: '#2f7f7b' }}>remembers.</span>
          </motion.h2>
          <motion.div
            className="relative mt-auto mb-auto pt-[10vmin]"
            initial={{ opacity: 0, scale: .86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: .75, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="relative rounded-[7vmin] border p-[5vmin] shadow-[0_18px_55px_rgba(15,42,54,.12)]"
              style={{ borderColor: 'rgba(15,42,54,.14)', background: 'rgba(238,233,219,.78)', backdropFilter: 'blur(12px)' }}
            >
              <div className="mb-[5vmin] flex items-center gap-3">
                <div className="flex h-[10vmin] w-[10vmin] items-center justify-center rounded-full" style={{ background: '#0f2a36' }}>
                  <span className="font-display text-[5vmin]" style={{ color: '#c8a96a' }}>R</span>
                </div>
                <div>
                  <p className="font-display text-[4.6vmin]" style={{ color: '#0f2a36' }}>Purpose Lab</p>
                  <p className="tracking-caps text-[1.8vmin]" style={{ color: '#6f8788' }}>your private account</p>
                </div>
              </div>
              <div className="space-y-[3vmin]">
                {savedItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    className="flex items-center justify-between border-b pb-[3vmin]"
                    style={{ borderColor: 'rgba(15,42,54,.11)' }}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.05 + index * .18, duration: .55 }}
                  >
                    <div className="flex items-center gap-[3vmin]">
                      <span className="h-[2.2vmin] w-[2.2vmin] rounded-full" style={{ background: item.color }} />
                      <span className="tracking-caps text-[2vmin]" style={{ color: '#0f2a36' }}>{item.label}</span>
                    </div>
                    <span className="text-right text-[2.4vmin]" style={{ color: '#5e777a' }}>{item.value}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div
                className="mt-[5vmin] flex items-center gap-[2vmin]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7, duration: .6 }}
              >
                <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(47,127,123,.15)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '47%' }}
                    transition={{ delay: 1.7, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ background: '#2f7f7b' }}
                  />
                </div>
                <span className="text-[2.2vmin]" style={{ color: '#2f7f7b' }}>in motion</span>
              </motion.div>
            </div>
          </motion.div>
          <motion.p
            className="max-w-[76vmin] text-[3.8vmin] leading-[1.3]"
            style={{ color: '#3f5d61' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: .7 }}
          >
            Sign in once. Pick up the thread whenever life gives you room.
          </motion.p>
        </div>
      </SafeFrame>
    </motion.section>
  );
}