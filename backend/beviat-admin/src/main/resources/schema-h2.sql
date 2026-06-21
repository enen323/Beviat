-- H2 兼容建表脚本（CloudStudio 部署用）
-- 基础表

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
    last_login_time TIMESTAMP,
    last_login_ip VARCHAR(50),
    bio TEXT,
    credit_score INT DEFAULT 300,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    description VARCHAR(500),
    parent_id BIGINT,
    status TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

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
    sold_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chat_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    product_id BIGINT,
    message_type TINYINT DEFAULT 1,
    content TEXT,
    is_read TINYINT DEFAULT 0,
    read_at TIMESTAMP,
    is_revoked TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

-- 插入管理员用户 (密码: admin123)
INSERT INTO user (username, password, nickname, email, student_id, gender, school, status)
SELECT 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iK6ly1i5JjU9i5gv7JfJ5P3z9qTW', '管理员', 'admin@beviat.com', '20240001', 1, 'XX大学', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE username = 'admin');

-- 插入分类
INSERT INTO category (id, name, icon, description, sort_order) SELECT 1, '书籍资料', '📚', '各类教材、参考书、学习资料', 10 WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 1);
INSERT INTO category (id, name, icon, description, sort_order) SELECT 2, '电子产品', '💻', '手机、电脑、平板等电子设备', 20 WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 2);
INSERT INTO category (id, name, icon, description, sort_order) SELECT 3, '生活用品', '🏠', '日常生活中的各类用品', 30 WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 3);
INSERT INTO category (id, name, icon, description, sort_order) SELECT 4, '运动健身', '🏀', '运动器材、健身装备', 40 WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 4);
INSERT INTO category (id, name, icon, description, sort_order) SELECT 5, '服装饰品', '👕', '服装、鞋帽、配饰', 50 WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 5);
