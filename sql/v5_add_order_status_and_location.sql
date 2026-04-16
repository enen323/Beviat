-- =====================================================
-- Beviat 增量数据库迁移脚本 V5.0
-- 1. 订单状态扩展：增加"卖家确认"、"已发货"状态
-- 2. 增加买卖双方位置信息字段
-- 3. 新增用户实时位置表
-- 执行时间: 2026-04-15
-- =====================================================

USE beviat;

-- =====================================================
-- 1. 修改订单表：扩展状态和新增字段
-- =====================================================
-- 新增订单状态说明:
-- 0-待支付 1-待卖家确认(已支付) 2-卖家已确认/待发货 3-已发货 4-已完成 5-已取消 6-已退款
-- 旧: 0-待支付 1-已支付 2-已取消 3-已退款 4-已完成

-- 添加发货时间
ALTER TABLE product_order ADD COLUMN shipped_at DATETIME DEFAULT NULL COMMENT '发货时间' AFTER cancelled_at;

-- 添加卖家确认时间
ALTER TABLE product_order ADD COLUMN confirmed_at DATETIME DEFAULT NULL COMMENT '卖家确认时间' AFTER paid_at;

-- 添加买家位置（经纬度）
ALTER TABLE product_order ADD COLUMN buyer_latitude DECIMAL(10,7) DEFAULT NULL COMMENT '买家纬度' AFTER remark;
ALTER TABLE product_order ADD COLUMN buyer_longitude DECIMAL(10,7) DEFAULT NULL COMMENT '买家经度' AFTER buyer_latitude;
ALTER TABLE product_order ADD COLUMN buyer_address VARCHAR(500) DEFAULT NULL COMMENT '买家定位地址' AFTER buyer_longitude;

-- 添加卖家位置（经纬度）
ALTER TABLE product_order ADD COLUMN seller_latitude DECIMAL(10,7) DEFAULT NULL COMMENT '卖家纬度' AFTER buyer_address;
ALTER TABLE product_order ADD COLUMN seller_longitude DECIMAL(10,7) DEFAULT NULL COMMENT '卖家经度' AFTER seller_latitude;
ALTER TABLE product_order ADD COLUMN seller_address VARCHAR(500) DEFAULT NULL COMMENT '卖家定位地址' AFTER seller_longitude;

-- 迁移旧数据：将旧的status=1(已支付)改为status=1(待卖家确认)，status=4(已完成)不变
-- 旧的status=2(已取消)改为status=5，旧的status=3(已退款)改为status=6
UPDATE product_order SET status = 5 WHERE status = 2;
UPDATE product_order SET status = 6 WHERE status = 3;

-- =====================================================
-- 2. 用户实时位置表 (user_location)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_location (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    latitude DECIMAL(10,7) NOT NULL COMMENT '纬度',
    longitude DECIMAL(10,7) NOT NULL COMMENT '经度',
    address VARCHAR(500) DEFAULT NULL COMMENT '地址描述',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_user_id(user_id),
    INDEX idx_updated_at(updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户实时位置表';

-- =====================================================
-- 3. 验证
-- =====================================================
SELECT 'V5.0 订单状态扩展与位置功能迁移完成！' as Message;
SHOW TABLES;
