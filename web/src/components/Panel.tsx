import type { JSX } from 'solid-js';

interface PanelProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: JSX.Element;
  children: JSX.Element;
  class?: string;
}

export function Panel(props: PanelProps) {
  return (
    <section
      class={`rounded-[28px] border border-stone-200/80 bg-white/92 p-5 shadow-[0_24px_80px_-36px_rgba(41,37,36,0.38)] backdrop-blur ${props.class ?? ''}`.trim()}
    >
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
            {props.eyebrow ?? 'Monitor'}
          </p>
          <h2 class="mt-2 font-display text-2xl text-stone-900">{props.title}</h2>
          {props.subtitle ? (
            <p class="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{props.subtitle}</p>
          ) : null}
        </div>
        {props.actions ? <div>{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
  );
}
