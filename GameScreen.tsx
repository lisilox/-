import { AnimatePresence, motion } from "framer-motion";
import PixelGame from "./PixelGame";

interface Props {
  index: 1 | 2;
  onFinish: () => void;
  paused: boolean;
}

const TITLES: Record<1 | 2, string> = {
  1: "Утренняя деревня",
  2: "Лисья тропа",
};

const SUBTITLES: Record<1 | 2, string> = {
  1: "Поймай всех бабушек, что разбежались по лужайкам 🌷",
  2: "Лови детей в лесу, остерегаясь волков-стражей 🌲",
};

export default function GameScreen({ index, onFinish, paused }: Props) {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5 text-center"
      >
        <p className="font-hand text-xl text-soft">Испытание {index} из 2</p>
        <h2 className="heading shimmer-text text-4xl sm:text-5xl">{TITLES[index]}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-soft">
          {SUBTITLES[index]}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`game-${index}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
        >
          {index === 1 ? (
            <PixelGame kind="duck" onFinish={onFinish} paused={paused} />
          ) : (
            <PixelGame kind="fox" onFinish={onFinish} paused={paused} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
