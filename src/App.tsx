import { useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { fetchNewApiRates } from "./newapi";
import { Locale, getCopy } from "./i18n";
import type { Copy } from "./i18n";
import { EMPTY_PROXY_INPUT, useProxyStore } from "./store";
import { fetchSub2ApiRates } from "./sub2api";
import { ProxyAuthMode, ProxyPlatform, ProxyStatus } from "./types";
import type { ModelRate, ProxyConfig } from "./types";
import "./App.css";

type ProxyDraft = Omit<ProxyConfig, "id" | "createdAt">;
type Snapshot = {
  proxy: ProxyConfig;
  status: ProxyStatus;
  models: ModelRate[];
  error?: string;
  updatedAt: number;
};
const RateSortDirection = {
  Ascending: "ascending",
  Descending: "descending",
} as const;
type RateSortDirection =
  (typeof RateSortDirection)[keyof typeof RateSortDirection];
const AllFilterValue = "all";
const OtherPlatformValue = "other";
const fetchProxyRates = (proxy: ProxyConfig) =>
  proxy.platform === ProxyPlatform.NewApi
    ? fetchNewApiRates(proxy)
    : fetchSub2ApiRates(proxy);
const rateLabel = (rate?: number) =>
  rate === undefined ? "—" : `${rate.toLocaleString()}×`;

function App({ tableOnly = false }: { tableOnly?: boolean }) {
  const proxies = useProxyStore((state) => state.proxies);
  const addProxy = useProxyStore((state) => state.addProxy);
  const updateProxy = useProxyStore((state) => state.updateProxy);
  const deleteProxy = useProxyStore((state) => state.deleteProxy);
  const queryClient = useQueryClient();
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem("proxy-rate-locale") === Locale.Chinese
      ? Locale.Chinese
      : Locale.English,
  );
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<ProxyConfig | null>(null);
  const [draft, setDraft] = useState<ProxyDraft>(EMPTY_PROXY_INPUT);
  const [activeProxyId, setActiveProxyId] = useState<string | null>(null);
  const [rateSortDirection, setRateSortDirection] = useState<RateSortDirection>(
    RateSortDirection.Ascending,
  );
  const [platformFilter, setPlatformFilter] = useState(AllFilterValue);
  const [stationFilter, setStationFilter] = useState(AllFilterValue);
  const [keyword, setKeyword] = useState("");
  const t = getCopy(locale);
  const checks = useQueries({
    queries: proxies.map((proxy) => ({
      queryKey: [
        "proxy-rates",
        proxy.id,
        proxy.baseUrl,
        proxy.userId,
        proxy.authToken,
      ],
      queryFn: () => fetchProxyRates(proxy),
      enabled: false,
      retry: false,
    })),
  });
  const snapshots = useMemo<Snapshot[]>(
    () =>
      proxies.map((proxy, index) => {
        const check = checks[index];
        const status = check.isFetching
          ? ProxyStatus.Checking
          : check.isError
            ? ProxyStatus.Error
            : check.data
              ? ProxyStatus.Ready
              : ProxyStatus.Idle;
        return {
          proxy,
          status,
          models: check.data ?? [],
          error: check.error instanceof Error ? check.error.message : undefined,
          updatedAt: check.dataUpdatedAt,
        };
      }),
    [proxies, checks],
  );
  const allModels = useMemo(
    () =>
      snapshots.flatMap((snapshot) =>
        snapshot.models.map((model) => ({
          ...model,
          proxy: snapshot.proxy.name,
        })),
      ),
    [snapshots],
  );
  const reportedPlatforms = useMemo(
    () =>
      [...new Set(allModels.map((model) => model.group?.trim().toLowerCase() || OtherPlatformValue))].sort(),
    [allModels],
  );
  const sortedModels = useMemo(
    () =>
      allModels.filter((model) => {
        const modelPlatform = model.group?.trim().toLowerCase() || OtherPlatformValue;
        const platformMatches =
          platformFilter === AllFilterValue || modelPlatform === platformFilter;
        const stationMatches =
          stationFilter === AllFilterValue || model.proxy === stationFilter;
        const searchText = `${model.model} ${model.description ?? ""} ${model.group ?? ""} ${model.proxy}`.toLowerCase();
        return (
          platformMatches &&
          stationMatches &&
          searchText.includes(keyword.trim().toLowerCase())
        );
      }).sort((left, right) => {
        const leftRate = left.ratio ?? Number.POSITIVE_INFINITY;
        const rightRate = right.ratio ?? Number.POSITIVE_INFINITY;
        return rateSortDirection === RateSortDirection.Ascending
          ? leftRate - rightRate
          : rightRate - leftRate;
      }),
    [allModels, keyword, platformFilter, rateSortDirection, stationFilter],
  );
  const openCreate = () => {
    setEditingProxy(null);
    setDraft(EMPTY_PROXY_INPUT);
    setDialogOpen(true);
  };
  const openEdit = (proxy: ProxyConfig) => {
    setEditingProxy(proxy);
    setDraft({
      name: proxy.name,
      platform: proxy.platform,
      baseUrl: proxy.baseUrl,
      userId: proxy.userId,
      authToken: proxy.authToken,
      authMode: proxy.authMode,
    });
    setDialogOpen(true);
  };
  const saveProxy = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.baseUrl.trim()) return;
    if (editingProxy) updateProxy(editingProxy.id, draft);
    else addProxy(draft);
    setDialogOpen(false);
  };
  const refresh = (proxy?: ProxyConfig) => {
    if (!proxy) {
      proxies.forEach((item) => refresh(item));
      return;
    }
    const queryKey = [
      "proxy-rates",
      proxy.id,
      proxy.baseUrl,
      proxy.userId,
      proxy.authToken,
    ];
    void queryClient
      .invalidateQueries({ queryKey: ["proxy-rates", proxy.id] })
      .then(() =>
        queryClient.fetchQuery({
          queryKey,
          queryFn: () => fetchProxyRates(proxy),
        }),
      );
  };
  const switchLocale = () =>
    setLocale((current) => {
      const next = current === Locale.English ? Locale.Chinese : Locale.English;
      localStorage.setItem("proxy-rate-locale", next);
      return next;
    });
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          Proxy<span>Rate</span>
        </Link>
        <nav>
          <Link className={tableOnly ? "" : "active"} to="/">
            {t.proxies}
          </Link>
          <Link className={tableOnly ? "active" : ""} to="/table">
            {t.table}
          </Link>
        </nav>
        <div className="topbar-actions">
          <button className="language-switch" onClick={switchLocale}>
            {locale === Locale.English ? "中文" : "EN"}
          </button>
          <button
            className="button button-quiet"
            disabled={!proxies.length}
            onClick={() => refresh()}
          >
            {t.refreshAll}
          </button>
          <button className="button button-primary" onClick={openCreate}>
            {t.addProxy}
          </button>
        </div>
      </header>
      {!tableOnly && (
      <section className="content-section" id="proxies">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.yourStations}</p>
            <h2>{t.health}</h2>
          </div>
          <button className="text-button" onClick={openCreate}>
            {t.addStation}
          </button>
        </div>
        {proxies.length === 0 ? (
          <EmptyState t={t} onAdd={openCreate} />
        ) : (
          <div className="proxy-grid">
            {snapshots.map((snapshot) => (
              <ProxyCard
                key={snapshot.proxy.id}
                snapshot={snapshot}
                locale={locale}
                t={t}
                active={activeProxyId === snapshot.proxy.id}
                onToggle={() =>
                  setActiveProxyId(
                    activeProxyId === snapshot.proxy.id
                      ? null
                      : snapshot.proxy.id,
                  )
                }
                onRefresh={() => refresh(snapshot.proxy)}
                onEdit={() => openEdit(snapshot.proxy)}
                onDelete={() => {
                  if (confirm(`${t.deleteStation}: ${snapshot.proxy.name}?`))
                    deleteProxy(snapshot.proxy.id);
                }}
              />
            ))}
          </div>
        )}
      </section>
      )}
      {allModels.length > 0 && (
        <section className={`content-section rates-section ${tableOnly ? "table-page" : ""}`}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t.liveResults}</p>
              <h2>{t.allRates}</h2>
            </div>
            <span className="model-count">
              {sortedModels.length} / {allModels.length} {t.groups}
            </span>
          </div>
          <div className="table-filters" aria-label={t.filters}>
            <input type="search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={t.search} />
            <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
              <option value={AllFilterValue}>{t.allPlatforms}</option>
              {reportedPlatforms.map((platform) => <option key={platform} value={platform}>{platform === OtherPlatformValue ? t.other : platform}</option>)}
            </select>
            <select value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
              <option value={AllFilterValue}>{t.allStations}</option>
              {proxies.map((proxy) => <option key={proxy.id} value={proxy.name}>{proxy.name}</option>)}
            </select>
          </div>
          <div className="rate-table">
            <div className="rate-row rate-head">
              <span>{t.group}</span>
              <span>{t.station}</span>
              <span>{t.platform}</span>
              <button
                className="sort-header"
                onClick={() =>
                  setRateSortDirection((direction) =>
                    direction === RateSortDirection.Ascending
                      ? RateSortDirection.Descending
                      : RateSortDirection.Ascending,
                  )
                }
              >
                {t.rateRatio}{" "}
                <b>
                  {rateSortDirection === RateSortDirection.Ascending
                    ? "↑"
                    : "↓"}
                </b>
              </button>
            </div>
            {sortedModels.map((model) => (
              <RateRow key={`${model.proxy}-${model.id}`} model={model} />
            ))}
          </div>
        </section>
      )}
      {isDialogOpen && (
        <ProxyDialog
          draft={draft}
          editing={Boolean(editingProxy)}
          t={t}
          onChange={setDraft}
          onClose={() => setDialogOpen(false)}
          onSave={saveProxy}
        />
      )}
    </main>
  );
}

function EmptyState({ t, onAdd }: { t: Copy; onAdd: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">✦</div>
      <h3>{t.firstTitle}</h3>
      <p>{t.firstBody}</p>
      <button className="button button-primary" onClick={onAdd}>
        {t.addStation}
      </button>
    </div>
  );
}
function formatTime(value: number, locale: Locale) {
  return new Intl.DateTimeFormat(
    locale === Locale.Chinese ? "zh-CN" : undefined,
    { hour: "numeric", minute: "2-digit" },
  ).format(new Date(value));
}
function ProxyCard({
  snapshot,
  locale,
  t,
  active,
  onToggle,
  onRefresh,
  onEdit,
  onDelete,
}: {
  snapshot: Snapshot;
  locale: Locale;
  t: Copy;
  active: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { proxy, status, models, error, updatedAt } = snapshot;
  const isChecking = status === ProxyStatus.Checking;
  const isNewApi = proxy.platform === ProxyPlatform.NewApi;
  const label = isChecking
    ? t.checking
    : status === ProxyStatus.Ready
      ? t.live
      : status === ProxyStatus.Error
        ? t.attention
        : t.ready;
  return (
    <article className={`proxy-card ${active ? "is-active" : ""}`}>
      <div className="card-top">
        <div className={`platform-mark ${proxy.platform}`}>
          {isNewApi ? "N" : "S"}
        </div>
        <div className="card-title">
          <h3>{proxy.name}</h3>
          <span>{isNewApi ? "NewAPI" : "Sub2API"}</span>
        </div>
        <button
          className="icon-button"
          aria-label={`Edit ${proxy.name}`}
          onClick={onEdit}
        >
          ···
        </button>
      </div>
      <div className="status-row">
        <span className={`status ${status}`}>{label}</span>
        <span>
          {updatedAt
            ? `${t.updated} ${formatTime(updatedAt, locale)}`
            : t.noRecent}
        </span>
      </div>
      <div className="model-preview">
        <strong>{models.length || "—"}</strong>
        <span>{models.length === 1 ? t.reportedGroup : t.reportedGroups}</span>
        {error && <p className="error-text">{error}</p>}
      </div>
      <div className="card-actions">
        <button
          className="button button-small"
          onClick={onRefresh}
          disabled={isChecking}
        >
          {isChecking ? t.checking : t.checkRates}
        </button>
        <button className="link-button" onClick={onToggle}>
          {active ? t.hideDetails : t.viewDetails} <span>→</span>
        </button>
      </div>
      {active && (
        <div className="proxy-details">
          <p>
            <b>{t.baseUrl}</b>
            {proxy.baseUrl}
          </p>
          {isNewApi && (
            <p>
              <b>{t.newApiUser}</b>
              {proxy.userId || "—"}
            </p>
          )}
          <p>
            <b>{t.authentication}</b>
            {proxy.authMode === ProxyAuthMode.BearerToken
              ? t.bearerToken
              : t.sessionCookie}
          </p>
          <button className="delete-button" onClick={onDelete}>
            {t.deleteStation}
          </button>
        </div>
      )}
    </article>
  );
}
function RateRow({ model }: { model: ModelRate & { proxy: string } }) {
  return (
    <div className="rate-row">
      <span>
        <b>{model.model}</b>
        {(model.description ?? model.group) && (
          <small>{model.description ?? model.group}</small>
        )}
      </span>
      <span>{model.proxy}</span>
      <span>{model.group ?? "—"}</span>
      <span>{rateLabel(model.ratio)}</span>
    </div>
  );
}
function ProxyDialog({
  draft,
  editing,
  t,
  onChange,
  onClose,
  onSave,
}: {
  draft: ProxyDraft;
  editing: boolean;
  t: Copy;
  onChange: (value: ProxyDraft) => void;
  onClose: () => void;
  onSave: (event: React.FormEvent) => void;
}) {
  const update = <K extends keyof ProxyDraft>(key: K, value: ProxyDraft[K]) =>
    onChange({ ...draft, [key]: value });
  const isNewApi = draft.platform === ProxyPlatform.NewApi;
  const changePlatform = (platform: ProxyPlatform) =>
    onChange({
      ...draft,
      platform,
      userId: platform === ProxyPlatform.NewApi ? draft.userId : "",
      authMode:
        platform === ProxyPlatform.NewApi
          ? ProxyAuthMode.SessionCookie
          : ProxyAuthMode.BearerToken,
    });
  return (
    <div className="dialog-backdrop" role="presentation">
      <form className="dialog" onSubmit={onSave}>
        <div className="dialog-head">
          <div>
            <p className="eyebrow">
              {isNewApi ? t.newApiStation : t.sub2ApiStation}
            </p>
            <h2>{editing ? t.editStation : t.addStationTitle}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <label>
          {t.stationName}
          <input
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="e.g. Dragon gateway"
            required
            autoFocus
          />
        </label>
        <label>
          {t.platform}
          <select
            value={draft.platform}
            onChange={(event) =>
              changePlatform(event.target.value as ProxyPlatform)
            }
          >
            <option value={ProxyPlatform.NewApi}>NewAPI</option>
            <option value={ProxyPlatform.Sub2Api}>Sub2API</option>
          </select>
        </label>
        <label>
          {t.stationBaseUrl}
          <input
            type="url"
            value={draft.baseUrl}
            onChange={(event) => update("baseUrl", event.target.value)}
            placeholder="https://station.example"
            required
          />
        </label>
        <p className="form-note">
          {isNewApi ? t.checksNewApi : t.checksSub2Api}
        </p>
        <div className="form-grid">
          {isNewApi && (
            <label>
              {t.userId}
              <input
                value={draft.userId}
                onChange={(event) => update("userId", event.target.value)}
                placeholder="e.g. 305"
              />
            </label>
          )}
          <label>
            {isNewApi ? t.sessionCookie : t.accessToken}{" "}
            <small>{t.optional}</small>
            <input
              type="password"
              value={draft.authToken}
              onChange={(event) => update("authToken", event.target.value)}
              placeholder={isNewApi ? t.cookiePlaceholder : t.tokenPlaceholder}
            />
          </label>
        </div>
        <p className="form-note">{isNewApi ? t.sessionNote : t.tokenNote}</p>
        <div className="dialog-actions">
          <button
            type="button"
            className="button button-quiet"
            onClick={onClose}
          >
            {t.cancel}
          </button>
          <button className="button button-primary" type="submit">
            {editing ? t.saveChanges : t.addStationTitle}
          </button>
        </div>
      </form>
    </div>
  );
}
export default App;
export function TablePage() {
  return <App tableOnly />;
}
