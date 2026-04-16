-- =====================================================
-- Beviat 增量数据库迁移脚本 V4.0
-- 新增订单表和支付记录表，支持模拟支付流程
-- 执行时间: 2026-04-13
-- =====================================================

USE beviat;

-- =====================================================
-- 1. 订单表 (product_order)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_no VARCHAR(64) NOT NULL UNIQUE COMMENT '订单编号（业务唯一）',
    buyer_id BIGINT NOT NULL COMMENT '买家用户ID',
    seller_id BIGINT NOT NULL COMMENT '卖家用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_title VARCHAR(200) NOT NULL COMMENT '商品标题快照',
    product_image VARCHAR(500) DEFAULT NULL COMMENT '商品封面图快照',
    product_price DECIMAL(10,2) NOT NULL COMMENT '商品价格快照',
    order_amount DECIMAL(10,2) NOT NULL COMMENT '订单金额（=商品价格）',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '订单状态: 0-待支付 1-已支付 2-已取消 3-已退款 4-已完成',
    trade_type TINYINT DEFAULT NULL COMMENT '交易方式: 0-自提 1-快递 2-都可以',
    receiver_name VARCHAR(50) DEFAULT NULL COMMENT '收货人姓名',
    receiver_phone VARCHAR(20) DEFAULT NULL COMMENT '收货人手机号',
    receiver_address VARCHAR(500) DEFAULT NULL COMMENT '收货地址',
    remark VARCHAR(500) DEFAULT NULL COMMENT '买家备注',
    paid_at DATETIME DEFAULT NULL COMMENT '支付时间',
    completed_at DATETIME DEFAULT NULL COMMENT '完成时间',
    cancelled_at DATETIME DEFAULT NULL COMMENT '取消时间',
    cancel_reason VARCHAR(200) DEFAULT NULL COMMENT '取消原因',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记: 0-未删除 1-已删除',

    INDEX idx_buyer_id(buyer_id),
    INDEX idx_seller_id(seller_id),
    INDEX idx_product_id(product_id),
    INDEX idx_status(status),
    INDEX idx_order_no(order_no),
    INDEX idx_created_at(created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品订单表';

-- =====================================================
-- 2. 支付记录表 (payment_record)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    payment_no VARCHAR(64) NOT NULL UNIQUE COMMENT '支付流水号',
    order_id BIGINT NOT NULL COMMENT '关联订单ID',
    order_no VARCHAR(64) NOT NULL COMMENT '关联订单编号',
    payer_id BIGINT NOT NULL COMMENT '支付人用户ID',
    payee_id BIGINT NOT NULL COMMENT '收款人用户ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    payment_method TINYINT NOT NULL DEFAULT 0 COMMENT '支付方式: 0-模拟支付 1-微信 2-支付宝 3-银行卡',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态: 0-待支付 1-支付成功 2-支付失败 3-已退款',
    transaction_id VARCHAR(128) DEFAULT NULL COMMENT '第三方交易号（模拟支付时生成）',
    paid_at DATETIME DEFAULT NULL COMMENT '支付成功时间',
    fail_reason VARCHAR(200) DEFAULT NULL COMMENT '失败原因',
    refund_no VARCHAR(64) DEFAULT NULL COMMENT '退款流水号',
    refund_amount DECIMAL(10,2) DEFAULT NULL COMMENT '退款金额',
    refunded_at DATETIME DEFAULT NULL COMMENT '退款时间',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除标记: 0-未删除 1-已删除',

    INDEX idx_order_id(order_id),
    INDEX idx_payer_id(payer_id),
    INDEX idx_payee_id(payee_id),
    INDEX idx_status(status),
    INDEX idx_payment_no(payment_no),
    INDEX idx_created_at(created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- =====================================================
-- 3. 验证
-- =====================================================
SELECT 'V4.0 订单与支付表迁移完成！' as Message;
SHOW TABLES;
