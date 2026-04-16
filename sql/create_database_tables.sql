-- =====================================================
-- Beviat校园二手交易平台数据库创建脚本
-- 适用于MySQL 5.7+/8.0
-- 创建时间: 2026-04-08
-- =====================================================

-- 1. 创建数据库并设置字符集
CREATE DATABASE IF NOT EXISTS beviat 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE beviat;

-- =====================================================
-- 2. 用户表 (user)
-- =====================================================
CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    nickname VARCHAR(50) NOT NULL DEFAULT '' COMMENT '昵称',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    student_id VARCHAR(20) DEFAULT NULL COMMENT '学号',
    avatar VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    gender TINYINT DEFAULT 0 COMMENT '性别: 0-未知 1-男 2-女',
    school VARCHAR(100) DEFAULT NULL COMMENT '学校名称',
    department VARCHAR(100) DEFAULT NULL COMMENT '学院/系',
    major VARCHAR(100) DEFAULT NULL COMMENT '专业',
    enroll_year INT DEFAULT NULL COMMENT '入学年份',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-正常 1-禁用 2-锁定',
    last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    bio TEXT DEFAULT NULL COMMENT '个人简介',
    credit_score INT DEFAULT 300 COMMENT '信用分(1-500)',
    
    -- 基础字段
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记: 0-未删除 1-已删除',
    
    INDEX idx_username(username),
    INDEX idx_email(email),
    INDEX idx_phone(phone),
    INDEX idx_student_id(student_id),
    INDEX idx_status(status),
    INDEX idx_deleted(deleted),
    INDEX idx_created_at(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 3. 商品分类表 (category)
-- =====================================================
CREATE TABLE IF NOT EXISTS category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    icon VARCHAR(100) DEFAULT NULL COMMENT '分类图标',
    sort_order INT DEFAULT 0 COMMENT '排序序号（越小越靠前）',
    description VARCHAR(500) DEFAULT NULL COMMENT '分类描述',
    parent_id BIGINT DEFAULT NULL COMMENT '父级分类ID（null表示顶级分类）',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-启用 1-禁用',
    
    -- 基础字段
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记: 0-未删除 1-已删除',
    
    INDEX idx_parent_id(parent_id),
    INDEX idx_sort_order(sort_order),
    INDEX idx_status(status),
    INDEX idx_deleted(deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类表';

-- =====================================================
-- 4. 商品表 (product)
-- =====================================================
CREATE TABLE IF NOT EXISTS product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    title VARCHAR(200) NOT NULL COMMENT '商品标题',
    description TEXT NOT NULL COMMENT '商品描述',
    price DECIMAL(10,2) NOT NULL COMMENT '商品价格',
    original_price DECIMAL(10,2) DEFAULT NULL COMMENT '原价',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    seller_id BIGINT NOT NULL COMMENT '卖家用户ID',
    status TINYINT DEFAULT 0 COMMENT '商品状态: 0-在售 1-已售出 2-已下架',
    condition_level TINYINT DEFAULT 99 COMMENT '商品成色: 1-全新 99-几乎全新 95-轻微使用痕迹 90-明显使用痕迹 80-有瑕疵',
    trade_type TINYINT DEFAULT 2 COMMENT '交易方式: 0-自提 1-快递 2-都可以',
    images TEXT DEFAULT NULL COMMENT '商品图片（JSON数组格式，存储图片URL列表）',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    favorite_count INT DEFAULT 0 COMMENT '收藏数量',
    location VARCHAR(200) DEFAULT NULL COMMENT '所在地/取货地址',
    contact_qq VARCHAR(20) DEFAULT NULL COMMENT '联系QQ',
    contact_wechat VARCHAR(50) DEFAULT NULL COMMENT '联系微信',
    is_top BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
    offline_reason VARCHAR(200) DEFAULT NULL COMMENT '下架原因',
    sold_at DATETIME DEFAULT NULL COMMENT '售出时间',
    
    -- 基础字段
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记: 0-未删除 1-已删除',
    
    INDEX idx_category_id(category_id),
    INDEX idx_seller_id(seller_id),
    INDEX idx_status(status),
    INDEX idx_price(price),
    INDEX idx_condition_level(condition_level),
    INDEX idx_is_top(is_top),
    INDEX idx_deleted(deleted),
    INDEX idx_created_at(created_at),
    INDEX idx_updated_at(updated_at),
    FULLTEXT idx_title_description(title, description) COMMENT '全文索引（支持商品搜索）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- =====================================================
-- 5. 聊天消息表 (chat_message)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    sender_id BIGINT NOT NULL COMMENT '发送者用户ID',
    receiver_id BIGINT NOT NULL COMMENT '接收者用户ID',
    product_id BIGINT DEFAULT NULL COMMENT '关联商品ID（可选）',
    message_type TINYINT DEFAULT 1 COMMENT '消息类型: 1-文本 2-图片 3-商品卡片',
    content TEXT DEFAULT NULL COMMENT '消息内容',
    is_read TINYINT DEFAULT 0 COMMENT '是否已读: 0-未读 1-已读',
    read_at DATETIME DEFAULT NULL COMMENT '已读时间',
    is_revoked TINYINT DEFAULT 0 COMMENT '撤回状态: 0-正常 1-已撤回',
    
    -- 基础字段
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记: 0-未删除 1-已删除',
    
    INDEX idx_sender_id(sender_id),
    INDEX idx_receiver_id(receiver_id),
    INDEX idx_product_id(product_id),
    INDEX idx_is_read(is_read),
    INDEX idx_is_revoked(is_revoked),
    INDEX idx_deleted(deleted),
    INDEX idx_created_at(created_at),
    INDEX idx_sender_receiver(sender_id, receiver_id) COMMENT '发送者和接收者联合索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- =====================================================
-- 6. 外键约束（可选，根据需求启用）
-- =====================================================
-- 注意：在高并发场景下，外键可能会影响性能，这里提供但建议评估后使用
/*
ALTER TABLE product
ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT fk_product_seller FOREIGN KEY (seller_id) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE chat_message
ADD CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT fk_message_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE category
ADD CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES category(id) ON DELETE SET NULL ON UPDATE CASCADE;
*/

-- =====================================================
-- 7. 初始化数据
-- =====================================================

-- 插入初始用户（管理员）
INSERT IGNORE INTO user (
    username, password, nickname, email, 
    student_id, gender, school, status
) VALUES (
    'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iK6ly1i5JjU9i5gv7JfJ5P3z9qTW', '系统管理员', 'admin@beviat.com',
    '20240001', 1, 'XX大学', 0
);

-- 插入商品分类数据
INSERT IGNORE INTO category (id, name, icon, description, sort_order, parent_id) VALUES
(1, '书籍资料', '📚', '各类教材、参考书、学习资料', 10, NULL),
(2, '电子产品', '💻', '手机、电脑、平板等电子设备', 20, NULL),
(3, '生活用品', '🏠', '日常生活中的各类用品', 30, NULL),
(4, '运动健身', '🏀', '运动器材、健身装备', 40, NULL),
(5, '服装饰品', '👕', '服装、鞋帽、配饰', 50, NULL),
(6, '教材教辅', '📖', '专业教材、考试辅导书', 1, 1),
(7, '课外读物', '📔', '小说、杂志等休闲读物', 2, 1),
(8, '手机', '📱', '智能手机及相关配件', 1, 2),
(9, '笔记本电脑', '💻', '笔记本电脑及配件', 2, 2);

-- =====================================================
-- 8. 查看表结构
-- =====================================================
SHOW TABLES;

-- 查看表结构
DESC user;
DESC category;
DESC product;
DESC chat_message;