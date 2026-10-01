"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { AssetClass, CanonicalAsset, Horizon, MarketCandidate } from "@phanfora/domain";
import { fetchAssets } from "../lib/api";
import { useMarket } from "../lib/use-market";
import {
  addWatch,
  addOverviewAsset,
  loadWorkspace,
  parseWorkspace,
  removeOverviewAsset,
  saveWorkspace,
  subscribeWorkspace,
  workspaceSnapshot,
} from "../lib/workspace";
import { formatDecimal } from "./cockpit-data";
import { AssetLogo, assetLogoUrl } from "./asset-logo";
import { Icon } from "./cockpit-icons";
import { MarketOverviewChart, palette } from "./market-overview-chart";
import { NewsPanel } from "./news-panel";

const periods: { label: string; value: Horizon }[] = [
  { label: "1G", value: "daily" },
  { label: "1H", value: "weekly" },
  { label: "1A", value: "monthly" },
];
const classes: { value: AssetClass | "all"; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "crypto", label: "Kripto" },
  { value: "stock", label: "Hisse" },
  { value: "commodity", label: "Emtia" },
  { value: "forex", label: "Döviz" },
  { value: "index", label: "Endeks" },
];
const classNames: Record<AssetClass, string> = {
  crypto: "Kripto",
  stock: "Hisse",
  commodity: "Emtia",
  forex: "Döviz",
  index: "Endeks",
};
const suggestedSymbols = ["DOGE", "AVAX", "LINK", "DOT", "LTC", "BCH", "UNI", "AAVE", "ARB", "OP", "PEPE", "SHIB"];
function price(item: MarketCandidate) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: item.price.currency,
    maximumFractionDigits: Number(item.price.amount) < 2 ? 4 : 2,
  }).format(Number(item.price.amount));
}
function percent(value: number, digits = 2) {
  return `${value >= 0 ? "+" : ""}${formatDecimal(value, digits)}%`;
}
function periodReturn(item: MarketCandidate) {
  const first = Number(item.series[0]?.close);
  const last = Number(item.series.at(-1)?.close);
  return first > 0 && Number.isFinite(last)
    ? (last / first - 1) * 100
    : Number(item.changePercent);
}
function maxDrawdown(item: MarketCandidate) {
  let peak = 0;
  let drop = 0;
  for (const point of item.series) {
    const value = Number(point.close);
    if (value > peak) peak = value;
    if (peak > 0) drop = Math.min(drop, (value / peak - 1) * 100);
  }
  return drop;
}
function shortDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}
function AssetBadge({
  item,
  small = false,
}: {
  item: MarketCandidate;
  small?: boolean;
}) {
  return (
    <span
      className={`ph-asset-badge ph-badge-${item.asset.assetClass} ${small ? "is-small" : ""} ${assetLogoUrl(item.asset.symbol, item.asset.assetClass) ? "has-logo" : ""}`}
      aria-hidden="true"
    >
      <AssetLogo symbol={item.asset.symbol} size={small ? 24 : 42} assetClass={item.asset.assetClass} />
    </span>
  );
}
function Sparkline({ item, color }: { item: MarketCandidate; color: string }) {
  const values = item.series
    .slice(-32)
    .map((point) => Number(point.close))
    .filter(Number.isFinite);
  if (values.length < 2) return <span className="ph-no-spark">—</span>;
  const min = Math.min(...values);
  const span = Math.max(0.00001, Math.max(...values) - min);
  return (
    <svg
      className="ph-spark"
      viewBox="0 0 110 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={values
          .map(
            (value, index) =>
              `${(index / (values.length - 1)) * 110},${26 - ((value - min) / span) * 23}`,
          )
          .join(" ")}
        stroke={color}
        fill="none"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function MarketCockpit() {
  const raw = useSyncExternalStore(
    subscribeWorkspace,
    workspaceSnapshot,
    () => "",
  );
  const workspace = useMemo(() => parseWorkspace(raw), [raw]);
  const [horizon, setHorizon] = useState<Horizon>("monthly");
  const market = useMarket(horizon, workspace.settings.refreshSeconds * 1000, workspace.overviewAssetIds ?? []);
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [category, setCategory] = useState<AssetClass | "all">("all");
  const [insightCategory, setInsightCategory] = useState<AssetClass | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetQuery, setAssetQuery] = useState("");
  const [assetCatalog, setAssetCatalog] = useState<CanonicalAsset[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const assetPickerRef = useRef<HTMLDivElement>(null);
  const assetPickerButtonRef = useRef<HTMLButtonElement>(null);
  const assetSearchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!assetPickerOpen) return;
    assetSearchRef.current?.focus();
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!assetPickerRef.current?.contains(target) && !assetPickerButtonRef.current?.contains(target)) {
        setAssetPickerOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAssetPickerOpen(false);
        assetPickerButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [assetPickerOpen]);
  useEffect(() => {
    const listener = (event: Event) => {
      setSearch((event as CustomEvent<string>).detail);
      document
        .getElementById("assets-to-watch")
        ?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("phanfora:search", listener);
    const query = new URLSearchParams(window.location.search).get("q");
    if (query)
      window.setTimeout(
        () => listener(new CustomEvent("phanfora:search", { detail: query })),
        0,
      );
    return () => window.removeEventListener("phanfora:search", listener);
  }, []);
  const items = market.items;
  const defaultAssetIds = items.map((item) => item.asset.id);
  const overviewAssetIds = workspace.overviewAssetIds ?? defaultAssetIds;
  const overviewItems = overviewAssetIds
    .map((id) => items.find((item) => item.asset.id === id))
    .filter((item): item is MarketCandidate => Boolean(item));
  const selected =
    selectedIds === null
      ? items.slice(0, 4)
      : items.filter((item) => selectedIds.includes(item.asset.id));
  const visible = overviewItems.filter(
    (item) =>
      (category === "all" || item.asset.assetClass === category) &&
      `${item.asset.symbol} ${item.asset.name}`
        .toLocaleLowerCase("tr-TR")
        .includes(search.toLocaleLowerCase("tr-TR")),
  );
  const missingAssets = overviewAssetIds.filter((id) =>
    !items.some((item) => item.asset.id === id) &&
    (category === "all" || id.startsWith(`${category}:`)) &&
    id.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")),
  );
  const catalogMatches = assetCatalog.filter((asset) =>
    !overviewAssetIds.includes(asset.id) &&
    `${asset.symbol} ${asset.name}`.toLocaleLowerCase("tr-TR")
      .includes(assetQuery.trim().toLocaleLowerCase("tr-TR")),
  );
  if (!assetQuery.trim()) {
    catalogMatches.sort((a, b) => {
      const aRank = suggestedSymbols.indexOf(a.symbol);
      const bRank = suggestedSymbols.indexOf(b.symbol);
      return (aRank < 0 ? suggestedSymbols.length : aRank) - (bRank < 0 ? suggestedSymbols.length : bRank);
    });
  }
  const shownCatalogMatches = catalogMatches.slice(0, 12);
  const insightItems = items.filter(
    (item) =>
      insightCategory === "all" || item.asset.assetClass === insightCategory,
  );
  const strongest = [...insightItems].sort(
    (a, b) => periodReturn(b) - periodReturn(a),
  )[0];
  const volatile = [...insightItems].sort(
    (a, b) => b.volatility - a.volatility,
  )[0];
  const weakest = [...insightItems].sort(
    (a, b) => periodReturn(a) - periodReturn(b),
  )[0];
  const insights = [
    strongest && {
      item: strongest,
      heading: `${strongest.asset.name} dönem lideri`,
      body: `${periods.find((period) => period.value === horizon)?.label} aralığında ${percent(periodReturn(strongest))} değişim gösterdi.`,
      metric: "Dönem getirisi",
    },
    volatile && {
      item: volatile,
      heading: `${volatile.asset.name} oynaklıkta önde`,
      body: `Sağlayıcının hesapladığı yıllık oynaklık %${formatDecimal(volatile.volatility, 1)}.`,
      metric: "Oynaklık",
    },
    weakest && {
      item: weakest,
      heading: `${weakest.asset.name} yakından izleniyor`,
      body: `Aynı aralıktaki değişim ${percent(periodReturn(weakest))}.`,
      metric: "Dönem getirisi",
    },
  ].filter(
    (
      value,
    ): value is {
      item: MarketCandidate;
      heading: string;
      body: string;
      metric: string;
    } => Boolean(value),
  );
  function toggleCompare(id: string) {
    const current =
      selectedIds ?? items.slice(0, 4).map((item) => item.asset.id);
    setSelectedIds(
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id].slice(-5),
    );
  }
  function toggleAssetPicker() {
    const next = !assetPickerOpen;
    setAssetPickerOpen(next);
    if (next && !assetCatalog.length && !catalogLoading) {
      setCatalogLoading(true);
      setCatalogError("");
      void fetchAssets()
        .then(setAssetCatalog)
        .catch(() => setCatalogError("Varlık listesi alınamadı. Yeniden deneyin."))
        .finally(() => setCatalogLoading(false));
    }
  }
  return (
    <div className="ph-dashboard">
      <div className="ph-page-heading">
        <div>
          <h1>Piyasa görünümü</h1>
          <p>Farklı piyasalar. Daha bilinçli kararlar.</p>
        </div>
        <div className="ph-page-actions">
          <Link href="/settings" className="ph-secondary-action">
            <Icon name="settings" size={17} />
            Görünümü düzenle
          </Link>
          <button
            type="button"
            className="ph-primary-action"
            onClick={() => {
              setSelectedIds([]);
              setPickerOpen(true);
              document
                .getElementById("compare")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Icon name="plus" size={19} />
            Yeni karşılaştırma
          </button>
        </div>
      </div>
      {market.error && (
        <div className="cockpit-data-alert" role="alert">
          <strong>Piyasa verisi alınamadı.</strong> {market.error}{" "}
          <button type="button" onClick={() => void market.refresh()}>
            Yeniden dene
          </button>
        </div>
      )}
      <section className="ph-ticker-strip" aria-label="Piyasa özeti">
        {items.slice(0, 5).map((item, index) => (
          <button
            type="button"
            key={item.asset.id}
            className="ph-ticker"
            onClick={() => {
              toggleCompare(item.asset.id);
              document
                .getElementById("compare")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <AssetBadge item={item} />
            <span className="ph-ticker-info">
              <small>{classNames[item.asset.assetClass]}</small>
              <strong>{item.asset.name}</strong>
              <b>{price(item)}</b>
            </span>
            <span className="ph-ticker-trend">
              <Sparkline
                item={item}
                color={Number(item.changePercent) >= 0 ? "#3ae7b0" : "#f2606b"}
              />
              <em
                className={
                  Number(item.changePercent) >= 0 ? "positive" : "negative"
                }
              >
                {percent(Number(item.changePercent))}
              </em>
            </span>
          </button>
        ))}
        {!items.length && (
          <div className="ph-ticker-empty">
            {market.loading
              ? "Canlı piyasa verisi yükleniyor…"
              : "Gösterilecek piyasa verisi yok."}
          </div>
        )}
      </section>
      <div className="ph-content-grid">
        <div className="ph-left-column">
          <section className="ph-panel ph-compare-panel" id="compare">
            <div className="ph-panel-header ph-compare-header">
              <div>
                <h2>Piyasaları karşılaştır</h2>
                <p>
                  Başlangıç değeri: 100 <span>·</span> Her varlık kendi para
                  biriminde
                </p>
              </div>
              <div className="ph-periods" aria-label="Grafik zaman aralığı">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    aria-pressed={horizon === period.value}
                    className={horizon === period.value ? "is-active" : ""}
                    onClick={() => setHorizon(period.value)}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="ph-chart-selection">
              {selected.map((item, index) => (
                <button
                  type="button"
                  key={item.asset.id}
                  className="ph-chart-chip"
                  onClick={() => toggleCompare(item.asset.id)}
                  aria-label={`${item.asset.name} karşılaştırmadan çıkar`}
                >
                  <i style={{ background: palette[index % palette.length] }} />
                  {item.asset.symbol}
                  <span>×</span>
                </button>
              ))}
              <div className="ph-picker-wrap">
                <button
                  type="button"
                  className="ph-add-asset"
                  onClick={() => setPickerOpen(!pickerOpen)}
                  aria-expanded={pickerOpen}
                >
                  <Icon name="plus" size={16} />
                  Varlık ekle
                </button>
                {pickerOpen && (
                  <div className="ph-asset-picker">
                    {items
                      .filter(
                        (item) =>
                          !selected.some(
                            (entry) => entry.asset.id === item.asset.id,
                          ),
                      )
                      .map((item) => (
                        <button
                          type="button"
                          key={item.asset.id}
                          onClick={() => {
                            toggleCompare(item.asset.id);
                            setPickerOpen(false);
                          }}
                        >
                          {item.asset.symbol}
                          <small>{item.asset.name}</small>
                        </button>
                      ))}
                    {items.length === selected.length && (
                      <span>Tüm varlıklar seçili.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <MarketOverviewChart items={selected} />
            <div className="ph-compare-table">
              <div className="ph-compare-table-head">
                <span>Varlık</span>
                <span>Dönem getirisi</span>
                <span>Oynaklık (yıllık)</span>
                <span>En büyük düşüş</span>
              </div>
              {selected.map((item, index) => (
                <div className="ph-compare-row" key={item.asset.id}>
                  <span className="ph-compare-name">
                    <i
                      style={{ background: palette[index % palette.length] }}
                    />
                    <AssetBadge item={item} small />
                    {item.asset.name}
                  </span>
                  <strong
                    className={
                      periodReturn(item) >= 0 ? "positive" : "negative"
                    }
                  >
                    <span className="ph-mobile-label">Dönem getirisi</span>
                    {percent(periodReturn(item), 1)}
                  </strong>
                  <span className="ph-compare-metric">
                    <span className="ph-mobile-label">Oynaklık (yıllık)</span>
                    <span className="ph-compare-metric-value">
                      {formatDecimal(item.volatility, 1)}%
                      <i className="ph-meter">
                        <i
                          style={{ width: `${Math.min(100, item.volatility)}%` }}
                        />
                      </i>
                    </span>
                  </span>
                  <span className="ph-compare-metric negative">
                    <span className="ph-mobile-label">En büyük düşüş</span>
                    <span className="ph-compare-metric-value">
                      {formatDecimal(maxDrawdown(item), 1)}%
                      <i className="ph-meter ph-meter-red">
                        <i
                          style={{
                            width: `${Math.min(100, Math.abs(maxDrawdown(item)) * 5)}%`,
                          }}
                        />
                      </i>
                    </span>
                  </span>
                </div>
              ))}
              {!selected.length && (
                <p className="ph-panel-empty">
                  Karşılaştırmak için varlık ekle.
                </p>
              )}
            </div>
          </section>
          <section className="ph-panel ph-assets-panel" id="assets-to-watch">
            <div className="ph-panel-header">
              <h2>İncelenecek varlıklar</h2>
              <div className="ph-assets-tools">
                <span>{overviewAssetIds.length} varlık</span>
                <button
                  type="button"
                  ref={assetPickerButtonRef}
                  className="ph-assets-add"
                  aria-label="İnceleme alanına varlık ekle"
                  aria-expanded={assetPickerOpen}
                  aria-controls="ph-assets-picker"
                  disabled={market.loading || !items.length}
                  onClick={toggleAssetPicker}
                >
                  <Icon name="plus" size={15} /> Varlık ekle
                </button>
              </div>
            </div>
            {assetPickerOpen && (
              <div className="ph-assets-picker" id="ph-assets-picker" ref={assetPickerRef}>
                <label className="ph-assets-search">
                  <Icon name="search" size={16} />
                  <input
                    ref={assetSearchRef}
                    aria-label="Eklenecek varlık ara"
                    placeholder="Sembol veya varlık adı ara"
                    value={assetQuery}
                    onChange={(event) => setAssetQuery(event.target.value)}
                  />
                </label>
                {catalogLoading && <p role="status">Varlıklar yükleniyor…</p>}
                {catalogError && <p role="alert">{catalogError}</p>}
                {!catalogLoading && !catalogError && (
                  <div className="ph-assets-options">
                    {shownCatalogMatches.map((asset) => (
                      <button
                        type="button"
                        key={asset.id}
                        aria-label={`${asset.name} ekle`}
                        onClick={() => {
                          saveWorkspace(addOverviewAsset(loadWorkspace(), asset.id, defaultAssetIds));
                          setAssetQuery("");
                          setSearch("");
                          setCategory("all");
                          assetSearchRef.current?.focus();
                        }}
                      >
                        <span className="ph-assets-option-icon" aria-hidden="true">
                          <AssetLogo symbol={asset.symbol} size={24} assetClass={asset.assetClass} />
                        </span>
                        <span className="ph-assets-option-copy"><strong>{asset.symbol}</strong>{asset.name !== asset.symbol && <small>{asset.name}</small>}</span>
                        <Icon name="plus" size={15} />
                      </button>
                    ))}
                    {!shownCatalogMatches.length && (
                      <p>{assetQuery ? "Eklenecek başka eşleşen varlık yok." : "Eklenebilecek varlık bulunamadı."}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="ph-filter-tabs" aria-label="Varlık türü">
              {classes.map((entry) => (
                <button
                  type="button"
                  key={entry.value}
                  className={category === entry.value ? "is-active" : ""}
                  aria-pressed={category === entry.value}
                  onClick={() => setCategory(entry.value)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div className="ph-assets-scroll">
              <div className="ph-assets-head">
                <span>Varlık</span>
                <span>Fiyat</span>
                <span>
                  {periods.find((period) => period.value === horizon)?.label}{" "}
                  getirisi
                </span>
                <span>Fiyat seyri</span>
                <span>Oynaklık</span>
                <span>Kaynak</span>
                <span aria-hidden="true" />
              </div>
              {visible.map((item) => (
                <div className="ph-asset-row" key={item.asset.id}>
                  <span className="ph-asset-identity">
                    <button
                      type="button"
                      className={`ph-watch ${workspace.watchlist.includes(item.asset.id) ? "is-watched" : ""}`}
                      aria-label={`${item.asset.name} ${workspace.watchlist.includes(item.asset.id) ? "takip listesinden çıkar" : "takip listesine ekle"}`}
                      aria-pressed={workspace.watchlist.includes(item.asset.id)}
                      onClick={() => {
                        const current = loadWorkspace();
                        saveWorkspace(
                          current.watchlist.includes(item.asset.id)
                            ? {
                                ...current,
                                watchlist: current.watchlist.filter(
                                  (id) => id !== item.asset.id,
                                ),
                              }
                            : addWatch(current, item.asset.id),
                        );
                      }}
                    >
                      <Icon name="star" size={18} />
                    </button>
                    <AssetBadge item={item} small />
                    <span className="ph-asset-name">
                      <strong>{item.asset.name}</strong>
                      <small>{classNames[item.asset.assetClass]}</small>
                    </span>
                  </span>
                  <strong><span className="ph-mobile-label">Fiyat</span>{price(item)}</strong>
                  <strong
                    className={
                      periodReturn(item) >= 0 ? "positive" : "negative"
                    }
                  >
                    <span className="ph-mobile-label">{periods.find((period) => period.value === horizon)?.label} getirisi</span>
                    {percent(periodReturn(item), 1)}
                  </strong>
                  <Sparkline
                    item={item}
                    color={
                      Number(item.changePercent) >= 0 ? "#36e6b4" : "#f2606b"
                    }
                  />
                  <span className="ph-asset-volatility"><span className="ph-mobile-label">Oynaklık</span>{formatDecimal(item.volatility, 1)}%</span>
                  <small className="ph-asset-source"><span className="ph-mobile-label">Kaynak</span>{item.source}</small>
                  <button
                    type="button"
                    className="ph-remove-asset"
                    aria-label={`${item.asset.name} inceleme alanından çıkar`}
                    onClick={() => saveWorkspace(removeOverviewAsset(loadWorkspace(), item.asset.id, defaultAssetIds))}
                  >
                    <Icon name="close" size={13} />
                  </button>
                </div>
              ))}
              {!market.loading && missingAssets.map((id) => (
                <div className="ph-asset-row ph-asset-unavailable" key={id}>
                  <span className="ph-asset-identity">
                    <span className="ph-asset-missing-symbol">{id.split(":")[1]?.replace(/-usd$/, "").toUpperCase() ?? id}</span>
                    <span className="ph-asset-name"><strong>{id.split(":")[1]?.replace(/-usd$/, "").toUpperCase() ?? id}</strong></span>
                  </span>
                  <span className="ph-asset-unavailable-note">Fiyat şu anda alınamadı</span>
                  <button
                    type="button"
                    className="ph-remove-asset"
                    aria-label={`${id} inceleme alanından çıkar`}
                    onClick={() => saveWorkspace(removeOverviewAsset(loadWorkspace(), id, defaultAssetIds))}
                  >
                    <Icon name="close" size={13} />
                  </button>
                </div>
              ))}
              {!visible.length && !missingAssets.length && (
                <p className="ph-panel-empty">
                  {market.loading
                    ? "Veriler yükleniyor…"
                    : !overviewAssetIds.length
                      ? "Henüz varlık eklenmedi. Varlık ekle düğmesini kullanın."
                    : search
                      ? "Aramaya uygun varlık bulunamadı."
                      : "Bu kategoride sağlayıcı verisi bulunmuyor."}
                </p>
              )}
            </div>
          </section>
        </div>
        <aside className="ph-right-column">
          <section className="ph-panel ph-insights-panel" id="insights">
            <div className="ph-panel-header">
              <h2>Bu hareket ne anlatıyor?</h2>
              <small>
                {market.updatedAt ? shortDate(market.updatedAt) : "—"}
              </small>
            </div>
            <div
              className="ph-filter-tabs ph-insight-tabs"
              aria-label="İçgörü türü"
            >
              {classes
                .filter((entry) =>
                  ["all", "commodity", "stock", "crypto", "forex"].includes(
                    entry.value,
                  ),
                )
                .map((entry) => (
                  <button
                    type="button"
                    key={entry.value}
                    className={
                      insightCategory === entry.value ? "is-active" : ""
                    }
                    aria-pressed={insightCategory === entry.value}
                    onClick={() => setInsightCategory(entry.value)}
                  >
                    {entry.value === "all" ? "Tümü" : entry.label}
                  </button>
                ))}
            </div>
            <div className="ph-insights-list">
              {insights.map((insight, index) => (
                <article
                  key={`${insight.item.asset.id}-${index}`}
                  className="ph-insight"
                >
                  <AssetBadge item={insight.item} />
                  <div>
                    <h3>{insight.heading}</h3>
                    <p>{insight.body}</p>
                    <span className="ph-insight-tag">
                      İzlenecek: {insight.metric.toLocaleLowerCase("tr-TR")}
                    </span>
                    <div className="ph-insight-sources">
                      <span>Fiyat</span>
                      <span>Hacim</span>
                      <span>{insight.item.source}</span>
                      <Link href="/explore">Varlığı gör ↗</Link>
                    </div>
                  </div>
                </article>
              ))}
              {!insights.length && (
                <p className="ph-panel-empty">
                  Bu kategoride doğrulanmış piyasa verisi bulunmuyor.
                </p>
              )}
            </div>
          </section>
          <NewsPanel />
        </aside>
      </div>
      <footer className="ph-dashboard-footer">
        <span>
          {items[0]
            ? `Veri kaynağı: ${items
                .map((item) => item.source)
                .filter((value, index, all) => all.indexOf(value) === index)
                .join(", ")} · Son gözlem: ${shortDate(items[0].observedAt)}`
            : "Piyasa verisi bekleniyor."}
        </span>
        <strong>PHANFORA</strong>
      </footer>
    </div>
  );
}
