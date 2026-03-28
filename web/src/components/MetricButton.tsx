import type { JSX } from 'solid-js';

interface MetricButtonProps {
  label: string;
  value?: string;
  tone?: 'neutral' | 'danger' | 'warning' | 'success';
  onClick?: () => void;
  active?: boolean;
  children?: JSX.Element;
}

const toneClasses = {
  neutral: 'border-stone-200 bg-white text-stone-900 hover:bg-stone-50',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
};

export function MetricButton(props: MetricButtonProps) {
  const tone = () => props.tone ?? 'neutral';

  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`rounded-[24px] border p-5 text-left transition ${props.active ? 'ring-2 ring-stone-950/10' : ''} ${toneClasses[tone()]}`}
    >
      <p class="text-[0.65rem] uppercase tracking-[0.22em] text-current/70">{props.label}</p>
      {props.value ? <p class="mt-3 font-display text-4xl text-current">{props.value}</p> : null}
      {props.children ? <div class="mt-2 text-sm text-current/80">{props.children}</div> : null}
    </button>
  );
}
