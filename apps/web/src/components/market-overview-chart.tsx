"use client";

import { useMemo, useState } from "react";
import type { MarketCandidate } from "@phanfora/domain";
import { formatDecimal } from "./cockpit-data";

export const palette = [
  "#ff921f",
  "#ffd357",
  "#67bdff",
  "#a77ce8",
  "#36e6b4",
  "#e8a0ff",
  "#f26e70",
];

function normalizedSeries(item: MarketCandidate) {
  const first = Number(item.series[0]?.close);
  if (!Number.isFinite(first) || first <= 0) return [];
  return item.series
    .map((point) => ({
      time: point.time,
      value: (Number(point.close) / first) * 100,
    }))
    .filter((point) => Number.isFinite(point.value));
}

export function MarketOverviewChart({ items }: { items: MarketCandidate[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const lines = useMemo(
    () =>
      items
        .map((item, index) => ({
          item,
          color: palette[index % palette.length],
          values: normalizedSeries(item),
        }))
        .filter((line) => line.values.length > 1),
    [items],
  );
  if (!lines.length)
    return (
      <div className="ph-chart-empty">
        Karşılaştırma için en az iki fiyat gözlemi gerekiyor.
      </div>
    );
  const all = lines.flatMap((line) => line.values.map((point) => point.value));
  const low = Math.floor((Math.min(...all) - 1) / 5) * 5;
  const high = Math.ceil((Math.max(...all) + 1) / 5) * 5;
  const span = Math.max(1, high - low);
  const toY = (value: number) => 235 - ((value - low) / span) * 215;
  const toX = (index: number, count: number) =>
    8 + (index / Math.max(1, count - 1)) * 800;
  const maxCount = Math.max(...lines.map((line) => line.values.length));
  const activeIndex =
    hover === null ? null : Math.round(hover * (maxCount - 1));
  const activeLine = lines[0]!;
  const activePoint =
    activeIndex === null
      ? null
      : activeLine?.values[
          Math.round(
            (activeIndex / Math.max(1, maxCount - 1)) *
              (activeLine.values.length - 1),
          )
        ];
  const dateFormat = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Istanbul",
  });
  return (
    <div
      className="ph-chart"
      role="img"
      aria-label={`${lines.map((line) => line.item.asset.name).join(", ")} karşılaştırma grafiği`}
    >
      <svg
        viewBox="0 0 850 270"
        preserveAspectRatio="none"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setHover(
            Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
          );
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {lines.map((line, index) => (
            <linearGradient
              key={line.item.asset.id}
              id={`ph-fill-${index}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop stopColor={line.color} stopOpacity=".14" />
              <stop offset="1" stopColor={line.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0, 1, 2, 3, 4].map((step) => {
          const y = 20 + step * 53.75;
          return (
            <g key={step}>
              <line x1="8" x2="808" y1={y} y2={y} className="ph-chart-grid" />
              <text x="823" y={y + 4} className="ph-chart-axis">
                {formatDecimal(high - (step * span) / 4, 0)}
              </text>
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((step) => (
          <line
            key={step}
            x1={8 + step * 800}
            x2={8 + step * 800}
            y1="20"
            y2="235"
            className="ph-chart-grid ph-chart-grid-vertical"
          />
        ))}
        <line
          x1="8"
          x2="808"
          y1={toY(100)}
          y2={toY(100)}
          className="ph-chart-base"
        />
        {lines.map((line, index) => {
          const points = line.values
            .map(
              (point, pointIndex) =>
                `${toX(pointIndex, line.values.length)},${toY(point.value)}`,
            )
            .join(" ");
          const firstX = toX(0, line.values.length);
          const lastX = toX(line.values.length - 1, line.values.length);
          const last = line.values.at(-1)!;
          return (
            <g key={line.item.asset.id}>
              <polygon
                points={`${firstX},235 ${points} ${lastX},235`}
                fill={`url(#ph-fill-${index})`}
              />
              <polyline
                points={points}
                fill="none"
                stroke={line.color}
                strokeWidth="1.65"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
              <circle cx={lastX} cy={toY(last.value)} r="4" fill={line.color} />
            </g>
          );
        })}
        {activeIndex !== null && (
          <line
            x1={8 + (activeIndex / Math.max(1, maxCount - 1)) * 800}
            x2={8 + (activeIndex / Math.max(1, maxCount - 1)) * 800}
            y1="20"
            y2="235"
            className="ph-chart-crosshair"
          />
        )}
      </svg>
      {activePoint && (
        <div
          className="ph-chart-tooltip"
          style={{ left: `${Math.min(75, Math.max(4, (hover ?? 0) * 80))}%` }}
        >
          <span>{dateFormat.format(new Date(activePoint.time))}</span>
          {lines.map((line) => {
            const point =
              line.values[
                Math.round(
                  ((activeIndex ?? 0) / Math.max(1, maxCount - 1)) *
                    (line.values.length - 1),
                )
              ];
            return (
              <div key={line.item.asset.id}>
                <i style={{ background: line.color }} />
                {line.item.asset.symbol}
                <strong>{point ? formatDecimal(point.value, 1) : "—"}</strong>
              </div>
            );
          })}
        </div>
      )}
      <div className="ph-chart-dates">
        <span>{dateFormat.format(new Date(activeLine.values[0]!.time))}</span>
        <span>
          {dateFormat.format(
            new Date(
              activeLine.values[Math.round((activeLine.values.length - 1) / 2)]!
                .time,
            ),
          )}
        </span>
        <span>
          {dateFormat.format(new Date(activeLine.values.at(-1)!.time))}
        </span>
      </div>
    </div>
  );
}
