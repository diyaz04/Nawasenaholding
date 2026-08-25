-- Migration: 0001_initial_schema.sql

-- a. admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- b. subsidiaries
CREATE TABLE IF NOT EXISTS subsidiaries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    description TEXT,
    website_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- c. products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    subsidiary_id TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    description TEXT,
    price REAL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE CASCADE
);

-- d. page_sections
CREATE TABLE IF NOT EXISTS page_sections (
    id TEXT PRIMARY KEY,
    section_key TEXT UNIQUE NOT NULL,
    content TEXT, -- JSON or text
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- e. product_inquiries
CREATE TABLE IF NOT EXISTS product_inquiries (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- f. pos (nested structure)
CREATE TABLE IF NOT EXISTS pos (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'biaya' | 'profit'
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES pos(id) ON DELETE SET NULL
);

-- g. distribution_patterns
CREATE TABLE IF NOT EXISTS distribution_patterns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- h. pattern_allocations
CREATE TABLE IF NOT EXISTS pattern_allocations (
    id TEXT PRIMARY KEY,
    pattern_id TEXT NOT NULL,
    pos_id TEXT NOT NULL,
    percentage REAL NOT NULL CHECK(percentage >= 0 AND percentage <= 100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pattern_id) REFERENCES distribution_patterns(id) ON DELETE CASCADE,
    FOREIGN KEY (pos_id) REFERENCES pos(id) ON DELETE CASCADE
);

-- i. shopee_accounts
CREATE TABLE IF NOT EXISTS shopee_accounts (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at DATETIME,
    is_active BOOLEAN DEFAULT 1,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- j. daily_closings
CREATE TABLE IF NOT EXISTS daily_closings (
    id TEXT PRIMARY KEY,
    closing_date DATE UNIQUE NOT NULL,
    pattern_id_used TEXT NOT NULL,
    total_revenue REAL NOT NULL,
    total_ads_cost REAL NOT NULL,
    ads_cost_source TEXT NOT NULL, -- 'api' | 'manual'
    status TEXT NOT NULL, -- 'pending' | 'completed' | 'failed'
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pattern_id_used) REFERENCES distribution_patterns(id)
);

-- k. daily_closing_allocations
CREATE TABLE IF NOT EXISTS daily_closing_allocations (
    id TEXT PRIMARY KEY,
    daily_closing_id TEXT NOT NULL,
    pos_id TEXT NOT NULL,
    allocated_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (daily_closing_id) REFERENCES daily_closings(id) ON DELETE CASCADE,
    FOREIGN KEY (pos_id) REFERENCES pos(id)
);

-- l. pos_balances
CREATE TABLE IF NOT EXISTS pos_balances (
    id TEXT PRIMARY KEY,
    pos_id TEXT UNIQUE NOT NULL,
    current_balance REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pos_id) REFERENCES pos(id) ON DELETE CASCADE
);

-- m. expenses
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    pos_id TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pos_id) REFERENCES pos(id) ON DELETE CASCADE
);

-- n. closing_config
CREATE TABLE IF NOT EXISTS closing_config (
    id TEXT PRIMARY KEY,
    closing_time TEXT NOT NULL, -- 'HH:mm'
    active_pattern_id TEXT NOT NULL,
    timezone TEXT DEFAULT 'Asia/Jakarta',
    is_enabled BOOLEAN DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_pattern_id) REFERENCES distribution_patterns(id)
);
