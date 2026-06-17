import { motion } from "framer-motion";

export type LetterIndex = 1 | 2;

interface Props {
  index: LetterIndex;
  onContinue: () => void;
  onBack: () => void;
}

const LETTERS: Record<LetterIndex, { title: string; subtitle: string; body: string }> = {
  1: {
    title: "Вот первое, что я хотел сказать…",
    subtitle: "После утренней деревни",
    body: "С первого дня, как мы встретились, в моём мире стало на одну радость больше, потому что в нём появилась ты. Спасибо, что позволяешь мне быть рядом. Ты делаешь обычные дни светлыми, а каждое утро превращаешь в праздник.",
  },
  2: {
    title: "Второе, перед самым важным…",
    subtitle: "После тропы лисы",
    body: "Ты мой свет, даже когда вокруг ничего не видно. Твой смех, твои глаза, твоя доброта, ради этого я просыпаюсь с мыслью «как же мне повезло». Я не умею обещать звёзды, но обещаю быть рядом в тишине и в шуме, в свете и во тьме.",
  },
};

export default function LetterScreen({ index, onContinue, onBack }: Props) {
  const letter = LETTERS[index];
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass max-w-md rounded-[2rem] p-7 shadow-2xl sm:p-9"
      >
        <p className="text-center font-hand text-xl text-soft">Письмо {index} из 2</p>
        <p className="text-center text-xs uppercase tracking-widest text-soft">{letter.subtitle}</p>
        <p className="heading mt-1 text-center text-2xl text-accent">{letter.title}</p>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--c-text)]">
          <p>{letter.body}</p>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onBack}
            className="rounded-full border border-[rgba(var(--c-accent-rgb),0.25)] px-6 py-3 font-semibold text-[var(--c-text)] transition hover:bg-white/50"
          >
            ← Назад
          </button>
          <button
            onClick={onContinue}
            className="btn-accent rounded-full px-7 py-3 font-extrabold"
          >
            {index === 2 ? "В лабиринт →" : "Дальше →"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
