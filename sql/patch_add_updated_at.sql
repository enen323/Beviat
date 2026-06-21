-- 补 auction 表 updated_at 列（可能部分环境缺失）
ALTER TABLE auction
    ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
    AFTER created_at;

-- 补 auction_bid 表 updated_at 列
ALTER TABLE auction_bid
    ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
    AFTER created_at;
