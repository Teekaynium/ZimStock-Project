import { createMemo, createSignal, For, Show } from 'solid-js';
import * as d3 from 'd3';
import type { ChartPoint } from '../types';

interface NormalizedChartPoint extends ChartPoint {
  parsedDate: Date;
}

interface TimeSeriesChartProps {
  data: ChartPoint[];
  color: string;
  label: string;
  height?: number;
  variant?: 'line' | 'bar';
  compact?: boolean;
  formatValue?: (value: number) => string;
}

const defaultFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

export function TimeSeriesChart(props: TimeSeriesChartProps) {
  let svgRef: SVGSVGElement | undefined;
  const [hoverIndex, setHoverIndex] = createSignal<number | null>(null);
  const width = 920;
  const height = props.height ?? 320;
  const margin = props.compact
    ? { top: 18, right: 12, bottom: 24, left: 12 }
    : { top: 20, right: 18, bottom: 42, left: 58 };

  const points = createMemo<NormalizedChartPoint[]>(() =>
    props.data
      .map((point) => ({ ...point, parsedDate: new Date(point.date) }))
      .filter((point) => Number.isFinite(point.value) && !Number.isNaN(point.parsedDate.getTime())),
  );

  const xScale = createMemo(() => {
    const domain = d3.extent(points(), (point) => point.parsedDate);
    const start = domain[0] ?? new Date();
    const end = domain[1] ?? new Date();
    return d3
      .scaleTime()
      .domain(start.getTime() === end.getTime() ? [start, new Date(end.getTime() + 86_400_000)] : [start, end])
      .range([margin.left, width - margin.right]);
  });

  const yScale = createMemo(() => {
    const values = points().map((point) => point.value);
    const minValue = d3.min(values) ?? 0;
    const maxValue = d3.max(values) ?? 1;
    const floor = props.variant === 'bar' ? 0 : minValue - (maxValue - minValue || maxValue || 1) * 0.12;
    const ceiling = maxValue + (maxValue - minValue || maxValue || 1) * 0.12;
    return d3
      .scaleLinear()
      .domain([floor, ceiling === floor ? ceiling + 1 : ceiling])
      .range([height - margin.bottom, margin.top]);
  });

  const linePath = createMemo(() => {
    const line = d3
      .line<NormalizedChartPoint>()
      .x((point) => xScale()(point.parsedDate))
      .y((point) => yScale()(point.value))
      .curve(d3.curveMonotoneX);

    return line(points()) ?? '';
  });

  const barWidth = createMemo(() => {
    const totalPoints = points().length;
    if (totalPoints <= 1) {
      return 18;
    }

    return Math.max(4, (width - margin.left - margin.right) / totalPoints - 2);
  });

  const hoverPoint = createMemo(() => {
    const index = hoverIndex();
    if (index === null) {
      return null;
    }

    return points()[index] ?? null;
  });
  const xTicks = createMemo(() => (props.compact ? [] : xScale().ticks(4)));
  const yTicks = createMemo(() => (props.compact ? [] : yScale().ticks(4)));

  const formatter = (value: number) =>
    props.formatValue ? props.formatValue(value) : defaultFormatter.format(value);

  const handlePointerMove = (event: PointerEvent) => {
    const target = svgRef;

    if (!target || points().length === 0) {
      return;
    }

    const bounds = target.getBoundingClientRect();
    const scaledX = ((event.clientX - bounds.left) / bounds.width) * width;
    const hoveredDate = xScale().invert(scaledX);
    const bisectDate = d3.bisector<NormalizedChartPoint, Date>((point) => point.parsedDate).center;
    const nearestIndex = bisectDate(points(), hoveredDate);
    const nearest = points()[nearestIndex];

    if (!nearest) {
      return;
    }

    setHoverIndex(nearestIndex);
  };

  return (
    <div class="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        class="h-auto w-full"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <rect x="0" y="0" width={width} height={height} rx="22" fill="transparent" />
        <For each={yTicks()}>
          {(tick) => (
            <g>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={yScale()(tick)}
                y2={yScale()(tick)}
                stroke="rgba(120, 113, 108, 0.18)"
                stroke-dasharray="3 6"
              />
              <text
                x={margin.left - 12}
                y={yScale()(tick) + 4}
                text-anchor="end"
                class="fill-stone-500 text-[11px]"
              >
                {formatter(tick)}
              </text>
            </g>
          )}
        </For>

        <For each={xTicks()}>
          {(tick) => (
            <text
              x={xScale()(tick)}
              y={height - 12}
              text-anchor="middle"
              class="fill-stone-500 text-[11px]"
            >
              {d3.timeFormat('%b %d')(tick)}
            </text>
          )}
        </For>

        {props.variant === 'bar' ? (
          <For each={points()}>
            {(point) => {
              const x = xScale()(point.parsedDate) - barWidth() / 2;
              const y = yScale()(point.value);
              const barHeight = height - margin.bottom - y;

              return (
                <rect
                  x={x}
                  y={y}
                  width={barWidth()}
                  height={Math.max(barHeight, 1)}
                  rx="3"
                  fill={props.color}
                  opacity="0.78"
                />
              );
            }}
          </For>
        ) : (
          <>
            <path d={linePath()} fill="none" stroke={props.color} stroke-width="3" stroke-linecap="round" />
            <For each={points()}>
              {(point, index) => (
                <circle
                  cx={xScale()(point.parsedDate)}
                  cy={yScale()(point.value)}
                  r={hoverIndex() === index() ? '5' : '0'}
                  fill={props.color}
                />
              )}
            </For>
          </>
        )}

        <Show when={hoverPoint()} keyed>
          {(point) => (
            <g>
              <line
                x1={xScale()(point.parsedDate)}
                x2={xScale()(point.parsedDate)}
                y1={margin.top}
                y2={height - margin.bottom}
                stroke="rgba(28, 25, 23, 0.24)"
                stroke-dasharray="4 6"
              />
            </g>
          )}
        </Show>
      </svg>

      <Show when={hoverPoint()} keyed>
        {(point) => (
          <div class="pointer-events-none absolute left-4 top-4 rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 text-sm shadow-lg">
            <p class="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
              {props.label}
            </p>
            <p class="mt-1 font-display text-lg text-stone-900">{formatter(point.value)}</p>
            <p class="mt-1 text-xs text-stone-600">{d3.timeFormat('%b %d, %Y')(point.parsedDate)}</p>
          </div>
        )}
      </Show>
    </div>
  );
}
