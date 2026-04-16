-- =====================================================
-- Beviat 增量数据库迁移脚本 V2.0
-- 在原有4张表(user/category/product/chat_message)基础上新增
-- 执行时间: 2026-04-08
-- =====================================================

USE beviat;

-- =====================================================
-- 1. 收藏表 (favorite)
-- =====================================================
CREATE TABLE IF NOT EXISTS favorite (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    folder_name VARCHAR(50) DEFAULT '默认收藏' COMMENT '收藏夹名称',
    note VARCHAR(200) DEFAULT NULL COMMENT '备注',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    
    UNIQUE KEY uk_user_product (user_id, product_id),
    INDEX idx_user_id(user_id),
    INDEX idx_product_id(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- =====================================================
-- 2. 拍卖表 (auction)
-- =====================================================
CREATE TABLE IF NOT EXISTS auction (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    product_id BIGINT UNIQUE NOT NULL COMMENT '关联商品ID（每个商品只能有一个拍卖）',
    seller_id BIGINT NOT NULL COMMENT '卖家用户ID',
    starting_price DECIMAL(10,2) NOT NULL COMMENT '起拍价',
    current_price DECIMAL(10,2) NOT NULL COMMENT '当前最高价',
    reserve_price DECIMAL(10,2) DEFAULT NULL COMMENT '保留价（低于此价不成交）',
    price_increment DECIMAL(10,2) NOT NULL DEFAULT 1.00 COMMENT '最低加价幅度',
    end_time DATETIME NOT NULL COMMENT '拍卖截止时间',
    winner_user_id BIGINT DEFAULT NULL COMMENT '中标者用户ID',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-进行中 1-已成交 2-已流拍 3-已取消',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记',
    
    INDEX idx_seller_id(seller_id),
    INDEX idx_status(status),
    INDEX idx_end_time(end_time),
    INDEX idx_winner(winner_user_id),
    INDEX idx_deleted(deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='拍卖表';

-- =====================================================
-- 3. 出价记录表 (auction_bid)
-- =====================================================
CREATE TABLE IF NOT EXISTS auction_bid (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    auction_id BIGINT NOT NULL COMMENT '拍卖ID',
    bidder_id BIGINT NOT NULL COMMENT '出价者用户ID',
    bid_price DECIMAL(10,2) NOT NULL COMMENT '出价金额',
    is_auto_bid BOOLEAN DEFAULT FALSE COMMENT '是否自动出价',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '出价时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记',
    
    INDEX idx_auction_id(auction_id),
    INDEX idx_bidder_id(bidder_id),
    INDEX idx_bid_price(bid_price),
    INDEX idx_created_at(created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出价记录表';

-- =====================================================
-- 4. 评价表 (evaluation)
-- =====================================================
CREATE TABLE IF NOT EXISTS evaluation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_type TINYINT NOT NULL COMMENT '订单类型: 1-普通交易 2-拍卖交易',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    evaluator_id BIGINT NOT NULL COMMENT '评价人ID',
    evaluated_user_id BIGINT NOT NULL COMMENT '被评价人ID',
    score TINYINT NOT NULL CHECK (score BETWEEN 1 AND 5) COMMENT '评分: 1-5星',
    content TEXT DEFAULT NULL COMMENT '评价内容（文字）',
    images TEXT DEFAULT NULL COMMENT '评价图片（JSON数组）',
    tags JSON DEFAULT NULL COMMENT '评价标签（JSON数组）如["发货快","描述准确"]',
    is_anonymous BOOLEAN DEFAULT FALSE COMMENT '是否匿名评价',
    reply_content TEXT DEFAULT NULL COMMENT '卖家回复内容',
    replied_at DATETIME DEFAULT NULL COMMENT '回复时间',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记',
    
    UNIQUE KEY uk_order_evaluator (product_id, evaluator_id),
    INDEX idx_evaluated_user(evaluated_user_id),
    INDEX idx_score(score),
    INDEX idx_created_at(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价表';

-- =====================================================
-- 5. 社区帖子表 (community_post)
-- =====================================================
CREATE TABLE IF NOT EXISTS community_post (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    author_id BIGINT NOT NULL COMMENT '作者用户ID',
    title VARCHAR(200) NOT NULL COMMENT '帖子标题',
    content TEXT NOT NULL COMMENT '帖子内容（支持富文本/Markdown）',
    cover_image VARCHAR(500) DEFAULT NULL COMMENT '封面图URL',
    category VARCHAR(50) DEFAULT 'default' COMMENT '板块分类',
    tags JSON DEFAULT NULL COMMENT '标签列表（JSON数组）',
    view_count INT DEFAULT 0 COMMENT '浏览量',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    comment_count INT DEFAULT 0 COMMENT '评论数',
    is_top BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
    is_essence BOOLEAN DEFAULT FALSE COMMENT '是否精华帖',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-正常 1-待审核 2-已隐藏 3-已删除',
    images JSON DEFAULT NULL COMMENT '图片URL列表(JSON数组)',
    last_comment_time DATETIME DEFAULT NULL COMMENT '最后评论时间',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记',
    
    FULLTEXT idx_title_content(title, content),
    INDEX idx_author_id(author_id),
    INDEX idx_category(category),
    INDEX idx_status(status),
    INDEX idx_is_top(is_top),
    INDEX idx_is_essence(is_essence),
    INDEX idx_created_at(created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社区帖子表';

-- =====================================================
-- 6. 帖子评论表 (community_comment)
-- =====================================================
CREATE TABLE IF NOT EXISTS community_comment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    post_id BIGINT NOT NULL COMMENT '帖子ID',
    user_id BIGINT NOT NULL COMMENT '评论者ID',
    parent_id BIGINT DEFAULT NULL COMMENT '父评论ID（null表示一级评论）',
    reply_to_user_id BIGINT DEFAULT NULL COMMENT '被回复人ID（楼中楼）',
    content VARCHAR(1000) NOT NULL COMMENT '评论内容',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-正常 1-已删除',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记',
    
    INDEX idx_post_id(post_id),
    INDEX idx_user_id(user_id),
    INDEX idx_parent_id(parent_id),
    INDEX idx_created_at(created_at ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子评论表';

-- =====================================================
-- 7. 点赞表 (community_like)
-- =====================================================
CREATE TABLE IF NOT EXISTS community_like (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    target_type TINYINT NOT NULL COMMENT '目标类型: 1-帖子 2-评论',
    target_id BIGINT NOT NULL COMMENT '目标ID（post_id 或 comment_id）',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记（取消点赞时软删）',
    
    UNIQUE KEY uk_like_target (user_id, target_type, target_id),
    INDEX idx_target(target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- =====================================================
-- 8. 用户行为记录表 (user_behavior)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_behavior (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    behavior_type VARCHAR(20) NOT NULL COMMENT '行为类型: view/click/favorite/search/purchase/chat/share',
    target_type VARCHAR(20) NOT NULL COMMENT '目标类型: product/post/user/category',
    target_id BIGINT NOT NULL COMMENT '目标ID',
    extra_data JSON DEFAULT NULL COMMENT '扩展数据（如搜索关键词、停留时长等）',
    ip_address VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    user_agent VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发生时间',
    
    INDEX idx_user_id(user_id),
    INDEX idx_behavior_type(behavior_type),
    INDEX idx_target(target_type, target_id),
    INDEX idx_created_at(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户行为记录表';

-- =====================================================
-- 9. 系统通知表 (notification)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '接收用户ID',
    type VARCHAR(30) NOT NULL COMMENT '通知类型: system/order/auction/comment/like/follow/bid/warning',
    title VARCHAR(100) NOT NULL COMMENT '通知标题',
    content VARCHAR(500) DEFAULT NULL COMMENT '通知内容摘要',
    link_url VARCHAR(300) DEFAULT NULL COMMENT '跳转链接',
    related_id BIGINT DEFAULT NULL COMMENT '关联业务ID',
    related_type VARCHAR(20) DEFAULT NULL COMMENT '关联业务类型',
    is_read TINYINT DEFAULT 0 COMMENT '是否已读: 0-未读 1-已读',
    read_at DATETIME DEFAULT NULL COMMENT '阅读时间',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记',
    
    INDEX idx_user_id(user_id),
    INDEX idx_is_read(is_read),
    INDEX idx_type(type),
    INDEX idx_created_at(created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知/站内信表';

-- =====================================================
-- 10. 举报表 (report)
-- =====================================================
CREATE TABLE IF NOT EXISTS report (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    reporter_id BIGINT NOT NULL COMMENT '举报人ID',
    target_type TINYINT NOT NULL COMMENT '举报目标类型: 1-商品 2-用户 3-帖子 4-评论',
    target_id BIGINT NOT NULL COMMENT '举报目标ID',
    reason_type TINYINT NOT NULL COMMENT '举报原因类型: 1-虚假信息 2-违禁品 3-骚扰 4-欺诈 5-侵权 6-其他',
    reason_detail VARCHAR(500) DEFAULT NULL COMMENT '详细说明',
    evidence_images TEXT DEFAULT NULL COMMENT '证据图片（JSON数组）',
    status TINYINT DEFAULT 0 COMMENT '处理状态: 0-待处理 1-处理中 2-已处理(成立) 3-已处理(不成立)',
    handler_id BIGINT DEFAULT NULL COMMENT '处理人管理员ID',
    handle_result VARCHAR(500) DEFAULT NULL COMMENT '处理结果说明',
    handled_at DATETIME DEFAULT NULL COMMENT '处理时间',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记',
    
    INDEX idx_reporter(reporter_id),
    INDEX idx_target(target_type, target_id),
    INDEX idx_status(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='举报表';

-- =====================================================
-- 11. 文件元数据表 (file_info)
-- =====================================================
CREATE TABLE IF NOT EXISTS file_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '存储路径/URL',
    file_size BIGINT NOT NULL COMMENT '文件大小(字节)',
    file_ext VARCHAR(20) DEFAULT NULL COMMENT '文件扩展名',
    mime_type VARCHAR(100) DEFAULT NULL COMMENT 'MIME类型',
    storage_mode TINYINT DEFAULT 0 COMMENT '存储方式: 0-本地 1-MinIO 2-OSS',
    bucket_name VARCHAR(100) DEFAULT NULL COMMENT '存储桶名（OSS/MinIO用）',
    uploader_id BIGINT DEFAULT NULL COMMENT '上传者用户ID',
    biz_type VARCHAR(20) DEFAULT 'general' COMMENT '业务类型: avatar/product/community/chat',
    thumbnail_path VARCHAR(500) DEFAULT NULL COMMENT '缩略图路径',
    width INT DEFAULT NULL COMMENT '图片宽度',
    height INT DEFAULT NULL COMMENT '图片高度',
    duration_sec INT DEFAULT NULL COMMENT '视频时长(秒，视频文件用）',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记',
    
    INDEX idx_uploader(uploader_id),
    INDEX idx_biz_type(biz_type),
    INDEX idx_storage(storage_mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件元数据表';

-- =====================================================
-- 12. 验证
-- =====================================================
SELECT 'V2.0 数据库迁移完成！' as Message;
SHOW TABLES;
