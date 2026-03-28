interface StatusPillProps {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

const toneClasses = {
  neutral: 'bg-stone-900 text-stone-50',
  success: 'bg-emerald-600 text-emerald-50',
  warning: 'bg-amber-500 text-amber-950',
  danger: 'bg-rose-600 text-rose-50',
};

export function StatusPill(props: StatusPillProps) {
  return (
    <span
      class={`inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${toneClasses[props.tone ?? 'neutral']}`}
    >
      {props.label}
    </span>
  );
}
