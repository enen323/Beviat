-- Beviat校园二手交易平台MySQL数据库表创建脚本（简化版）
-- 执行此脚本前请确保：
-- 1. MySQL服务正在运行
-- 2. 拥有root或具有CREATE DATABASE权限的用户

-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS beviat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beviat;

-- 2. 用户表
CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) DEFAULT '',
    email VARCHAR(100),
    phone VARCHAR(20),
    student_id VARCHAR(20),
    avatar VARCHAR(500),
    gender TINYINT DEFAULT 0,
    school VARCHAR(100),
    department VARCHAR(100),
    major VARCHAR(100),
    enroll_year INT,
    status TINYINT DEFAULT 0,
    last_login_time DATETIME,
    last_login_ip VARCHAR(50),
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    
    INDEX idx_username(username),
    INDEX idx_email(email),
    INDEX idx_phone(phone),
    INDEX idx_status(status)
);

-- 3. 商品分类表
CREATE TABLE IF NOT EXISTS category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    description VARCHAR(500),
    parent_id BIGINT,
    status TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    
    INDEX idx_parent_id(parent_id),
    INDEX idx_sort_order(sort_order)
);

-- 4. 商品表
CREATE TABLE IF NOT EXISTS product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    status TINYINT DEFAULT 0,
    condition_level TINYINT DEFAULT 99,
    trade_type TINYINT DEFAULT 2,
    images TEXT,
    view_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    location VARCHAR(200),
    contact_qq VARCHAR(20),
    contact_wechat VARCHAR(50),
    is_top BOOLEAN DEFAULT FALSE,
    offline_reason VARCHAR(200),
    sold_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    
    INDEX idx_category_id(category_id),
    INDEX idx_seller_id(seller_id),
    INDEX idx_status(status),
    INDEX idx_price(price)
);

-- 5. 聊天消息表
CREATE TABLE IF NOT EXISTS chat_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    product_id BIGINT,
    message_type TINYINT DEFAULT 1,
    content TEXT,
    is_read TINYINT DEFAULT 0,
    read_at DATETIME,
    is_revoked TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    
    INDEX idx_sender_id(sender_id),
    INDEX idx_receiver_id(receiver_id),
    INDEX idx_is_read(is_read)
);

-- 6. 初始化数据（可选）
-- 插入一个管理员用户（密码: admin123）
INSERT IGNORE INTO user (username, password, nickname, email, student_id, gender, school, status) 
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iK6ly1i5JjU9i5gv7JfJ5P3z9qTW', '管理员', 'admin@beviat.com', '20240001', 1, 'XX大学', 0);

-- 插入基本分类
INSERT IGNORE INTO category (name, icon, description, sort_order) VALUES
('书籍资料', '📚', '各类教材、参考书、学习资料', 10),
('电子产品', '💻', '手机、电脑、平板等电子设备', 20),
('生活用品', '🏠', '日常生活中的各类用品', 30),
('运动健身', '🏀', '运动器材、健身装备', 40),
('服装饰品', '👕', '服装、鞋帽、配饰', 50);

-- 7. 显示表信息
SHOW TABLES;

SELECT '数据库表创建完成！' as Message;