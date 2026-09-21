import { motion } from 'framer-motion';
import purposeLabAsset from '@assets/31DC4C16-212D-406B-AC0B-609119CF0477_1777042604510.png';
import rippleLabsLogo from '@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png';
import { SafeFrame } from '@/lib/video';

export function Scene5() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: .82, clipPath: 'circle(0% at 50% 62%)' }}
      animate={{ opacity: 1, scale: 1, clipPath: 'circle(100% at 50% 62%)' }}
      exit={{ opacity: 0, scale: 1.16, clipPath: 'circle(0% at 50% 62%)' }}
      transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: 'linear-gradient(150deg, #eee9db 0%, #eee9db 54%, #c9dfd8 100%)' }}
    >
      <div className="film-noise" />
      <motion.div
        className="absolute left-1/2 top-[60%] h-[125vmin] w-[125vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        animate={{ scale: [1, 1.05, 1], rotate: [0, 3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderColor: 'rgba(47,127,123,.24)', borderWidth: '1px' }}
      />
      <motion.div
        className="absolute left-1/2 top-[60%] h-[86vmin] w-[86vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        animate={{ scale: [1, .95, 1], rotate: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderColor: 'rgba(200,169,106,.42)', borderWidth: '1px' }}
      />
      <SafeFrame>
        <div className="relative flex h-full flex-col">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .35, duration: .6 }}
          >
            <img src={rippleLabsLogo} alt="Ripple Labs" className="h-[7vmin] w-[7vmin] rounded-full object-cover" />
            <span className="tracking-caps text-[2.2vmin]" style={{ color: '#2f7f7b' }}>05 / 05</span>
          </motion.div>
          <motion.div
            className="mt-[7vmin]"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .5, duration: .85, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="tracking-caps text-[2.3vmin]" style={{ color: '#2f7f7b' }}>The thing you came for</p>
            <h2 className="mt-[3vmin] font-display text-[11vmin] leading-[.9] tracking-[-.06em]" style={{ color: '#0f2a36' }}>
              A purpose
              <br />
              <span style={{ color: '#2f7f7b' }}>you can live.</span>
            </h2>
          </motion.div>
          <motion.div
            className="relative mx-auto mt-[8vmin] w-[62vmin] rotate-[-2deg] overflow-hidden rounded-[4vmin] shadow-[0_20px_65px_rgba(15,42,54,.16)]"
            initial={{ opacity: 0, y: 45, scale: .86, rotate: 5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: -2 }}
            transition={{ delay: .85, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={purposeLabAsset} alt="Purpose Lab" className="block h-auto w-full" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(15,42,54,.12))' }} />
          </motion.div>
          <motion.div
            className="mt-auto mb-[3vmin] border-t pt-[4vmin]"
            style={{ borderColor: 'rgba(15,42,54,.18)' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.45, duration: .8 }}
          >
            <p className="max-w-[82vmin] font-display text-[5.7vmin] leading-[1.04]" style={{ color: '#0f2a36' }}>
              “I am someone who makes space for what matters, so others can hear themselves too.”
            </p>
            <div className="mt-[5vmin] flex items-center justify-between">
              <span className="tracking-caps text-[2.1vmin]" style={{ color: '#5f7c7c' }}>Uncover who you are. Live your purpose.</span>
              <motion.span
                className="font-display text-[5vmin]"
                animate={{ x: [0, 7, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ color: '#c8a96a' }}
              >
                →
              </motion.span>
            </div>
          </motion.div>
        </div>
      </SafeFrame>
    </motion.section>
  );
}