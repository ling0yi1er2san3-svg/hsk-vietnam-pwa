interface Props {
  title: string;
  phase: string;
  description: string;
  emoji: string;
}

export function PlaceholderPage({ title, phase, description, emoji }: Props) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="text-6xl">{emoji}</div>
      <div className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-red-700">{phase}</div>
      <h1 className="mt-2 text-3xl font-black">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">{description}</p>
    </section>
  );
}
