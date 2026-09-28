"use client";

import { useMemo, useState } from "react";

import type { PricePoint } from "@phanfora/domain";

import { formatDecimal } from "./cockpit-data";

interface ChartProps {
  symbol: string;
  series: readonly PricePoint[];
  showSma: boolean;
  drawing: boolean;
  clearKey: number;
}

type Mark = { x: number; y: number };

function average(values: readonly number[], period: number, index: number) {
  if (index < period - 1) return null;
  return (
    values
      .slice(index - period + 1, index + 1)
      .reduce((sum, value) => sum + value, 0) / period
  );
}

export function CockpitChart({
  symbol,
  series,
  showSma,
  drawing,
  clearKey,
}: ChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [pending, setPending] = useState<Mark | null>(null);
  const [lines, setLines] = useState<{ a: Mark; b: Mark }[]>([]);
  const [lastClearKey, setLastClearKey] = useState(clearKey);
  if (clearKey !== lastClearKey) {
    setLastClearKey(clearKey);
    setLines([]);
    setPending(null);
  }

  const data = useMemo(() => {
    const closes = series.map((point) => Number(point.close));
    const lows = series.map((point) => Number(point.low ?? point.close));
    const highs = series.map((point) => Number(point.high ?? point.close));
    const minimum = Math.min(...lows) - 8;
    const maximum = Math.max(...highs) + 8;
    const span = maximum - minimum || 1;
    const toY = (value: number) => 263 - ((value - minimum) / span) * 244;
    const toX = (index: number) =>
      18 + index * (925 / Math.max(1, series.length - 1));
    const maxVolume = Math.max(
      1,
      ...series.map((point) => Number(point.volume)),
    );
    const sma = closes
      .map((_, index) => {
        const value = average(closes, 20, index);
        return value === null ? null : `${toX(index)},${toY(value)}`;
      })
      .filter(Boolean)
      .join(" ");
    return { closes, minimum, maximum, toY, toX, maxVolume, sma };
  }, [series]);

  if (series.length === 0)
    return (
      <div className="chart-empty">Bu aralık için fiyat serisi bulunamadı.</div>
    );

  const active = series[hover ?? series.length - 1];
  const activeIndex = hover ?? series.length - 1;
  const first = Number(series[0]?.close ?? 0);
  const last = Number(series.at(-1)?.close ?? 0);
  const candleWidth = Math.max(2.2, Math.min(6.5, 675 / series.length));

  function chartPoint(event: React.MouseEvent<SVGSVGElement>) {
    const rectangle = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        18,
        Math.min(
          943,
          ((event.clientX - rectangle.left) / rectangle.width) * 1000,
        ),
      ),
      y: Math.max(
        18,
        Math.min(
          262,
          ((event.clientY - rectangle.top) / rectangle.height) * 340,
        ),
      ),
    };
  }

  return (
    <div className="cockpit-chart" aria-label={`${symbol} fiyat grafiği`}>
      <svg
        viewBox="0 0 1000 340"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${symbol} mum ve hacim grafiği`}
        onMouseMove={(event) => {
          const point = chartPoint(event);
          setHover(
            Math.max(
              0,
              Math.min(
                series.length - 1,
                Math.round(((point.x - 18) / 925) * (series.length - 1)),
              ),
            ),
          );
        }}
        onMouseLeave={() => setHover(null)}
        onClick={(event) => {
          if (!drawing) return;
          const point = chartPoint(event);
          if (pending) {
            setLines([...lines, { a: pending, b: point }]);
            setPending(null);
          } else setPending(point);
        }}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0bf7c2" stopOpacity=".13" />
            <stop offset="100%" stopColor="#0bf7c2" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1000" height="340" fill="transparent" />
        {[38, 93, 148, 203, 258, 316].map((y) => (
          <line
            key={y}
            x1="0"
            x2="954"
            y1={y}
            y2={y}
            className="cockpit-gridline"
          />
        ))}
        {[105, 196, 287, 378, 469, 560, 651, 742, 833, 924].map((x) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1="0"
            y2="315"
            className="cockpit-gridline"
          />
        ))}
        <line x1="0" x2="954" y1="263" y2="263" className="chart-volume-line" />
        {series.map((point, index) => {
          const x = data.toX(index);
          const open = Number(
            point.open ?? series[index - 1]?.close ?? point.close,
          );
          const close = Number(point.close);
          const high = Number(point.high ?? Math.max(open, close));
          const low = Number(point.low ?? Math.min(open, close));
          const rising = close >= open;
          const color = rising ? "#20ddae" : "#f16170";
          const top = Math.min(data.toY(open), data.toY(close));
          const body = Math.max(
            1.5,
            Math.abs(data.toY(open) - data.toY(close)),
          );
          const volumeHeight = Math.max(
            2,
            (Number(point.volume) / data.maxVolume) * 50,
          );
          return (
            <g key={`${point.time}-${index}`}>
              <line
                x1={x}
                x2={x}
                y1={data.toY(high)}
                y2={data.toY(low)}
                stroke={color}
                strokeWidth="1"
              />
              <rect
                x={x - candleWidth / 2}
                y={top}
                width={candleWidth}
                height={body}
                fill={color}
              />
              <rect
                x={x - candleWidth / 2}
                y={315 - volumeHeight}
                width={candleWidth}
                height={volumeHeight}
                fill={rising ? "#168e81" : "#ad5464"}
                opacity=".87"
              />
            </g>
          );
        })}
        {showSma && data.sma ? (
          <polyline
            points={data.sma}
            fill="none"
            stroke="#e3c77b"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {lines.map((line, index) => (
          <line
            key={index}
            x1={line.a.x}
            y1={line.a.y}
            x2={line.b.x}
            y2={line.b.y}
            stroke="#aadfff"
            strokeWidth="1.7"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {pending ? (
          <circle cx={pending.x} cy={pending.y} r="4" fill="#aadfff" />
        ) : null}
        {active && hover !== null ? (
          <>
            <line
              x1={data.toX(activeIndex)}
              x2={data.toX(activeIndex)}
              y1="0"
              y2="315"
              stroke="#bed5e8"
              strokeWidth="1"
              strokeDasharray="5 4"
              opacity=".8"
            />
            <line
              x1="0"
              x2="954"
              y1={data.toY(Number(active.close))}
              y2={data.toY(Number(active.close))}
              stroke="#20ddae"
              strokeWidth="1"
              strokeDasharray="5 4"
              opacity=".6"
            />
          </>
        ) : null}
        <line
          x1="0"
          x2="954"
          y1={data.toY(last)}
          y2={data.toY(last)}
          stroke="#18e0aa"
          strokeWidth="1"
          strokeDasharray="5 3"
          opacity=".75"
        />
        {[0, 1, 2, 3, 4].map((step) => (
          <text
            key={step}
            x="965"
            y={
              data.toY(
                data.minimum + ((data.maximum - data.minimum) / 4) * step,
              ) + 4
            }
            className="chart-axis-text"
          >
            {Math.round(
              data.minimum + ((data.maximum - data.minimum) / 4) * step,
            )}
          </text>
        ))}
        <text x="965" y="279" className="chart-axis-text">
          60M
        </text>
        <text x="965" y="315" className="chart-axis-text">
          30M
        </text>
      </svg>
      <div
        className="chart-current"
        style={{
          top: `${Math.max(5, Math.min(72, (data.toY(last) / 340) * 100))}%`,
        }}
      >
        {formatDecimal(last)}
      </div>
      {active && hover !== null ? (
        <div
          className="chart-tooltip"
          style={{
            left: `${Math.min(76, Math.max(7, (data.toX(activeIndex) / 1000) * 100 - 12))}%`,
          }}
        >
          <span>
            {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
              new Date(active.time),
            )}
          </span>
          <dl>
            <div>
              <dt>Açılış</dt>
              <dd>{formatDecimal(Number(active.open ?? active.close))}</dd>
            </div>
            <div>
              <dt>Yüksek</dt>
              <dd>{formatDecimal(Number(active.high ?? active.close))}</dd>
            </div>
            <div>
              <dt>Düşük</dt>
              <dd>{formatDecimal(Number(active.low ?? active.close))}</dd>
            </div>
            <div>
              <dt>Kapanış</dt>
              <dd>{formatDecimal(Number(active.close))}</dd>
            </div>
            <div>
              <dt>Hacim</dt>
              <dd>{formatDecimal(Number(active.volume) / 1_000_000, 1)}M</dd>
            </div>
          </dl>
        </div>
      ) : null}
      <div className="chart-bottom-labels" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => {
          const point = series[Math.round((index / 9) * (series.length - 1))];
          return (
            <span key={index}>
              {point
                ? new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  }).format(new Date(point.time))
                : ""}
            </span>
          );
        })}
      </div>
      <div className="chart-a11y">
        {symbol} fiyat serisi {formatDecimal(first)} seviyesinden{" "}
        {formatDecimal(last)} seviyesine hareket etti. En düşük{" "}
        {formatDecimal(data.minimum)}, en yüksek {formatDecimal(data.maximum)}.
      </div>
    </div>
  );
}
