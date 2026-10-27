CREATE TABLE IF NOT EXISTS analytics_daily_rollups (
  event_date TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'click', 'section_view')),
  category TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_label TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  PRIMARY KEY (event_date, event_type, category, item_id)
);

CREATE TABLE IF NOT EXISTS analytics_daily_summary (
  event_date TEXT PRIMARY KEY,
  page_views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  section_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics_daily_visitors (
  event_date TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  PRIMARY KEY (event_date, visitor_id)
);

CREATE TABLE IF NOT EXISTS analytics_visitors (
  visitor_id TEXT PRIMARY KEY,
  last_seen_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS analytics_visitors_last_seen_idx
  ON analytics_visitors (last_seen_date);

CREATE TABLE IF NOT EXISTS analytics_daily_quota (
  event_date TEXT PRIMARY KEY,
  event_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS analytics_rollups_type_date_idx
  ON analytics_daily_rollups (event_type, event_date);
