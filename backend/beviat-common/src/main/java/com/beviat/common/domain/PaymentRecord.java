package com.beviat.common.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付记录实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("payment_record")
public class PaymentRecord extends BaseEntity {
    private String paymentNo;        // 支付流水号
    private Long orderId;            // 关联订单ID
    private String orderNo;          // 关联订单编号
    private Long payerId;            // 支付人ID
    private Long payeeId;            // 收款人ID
    private BigDecimal amount;       // 支付金额
    private Integer paymentMethod;   // 0-模拟支付 1-微信 2-支付宝 3-银行卡
    private Integer status;          // 0-待支付 1-支付成功 2-支付失败 3-已退款
    private String transactionId;    // 第三方交易号
    private LocalDateTime paidAt;    // 支付成功时间
    private String failReason;       // 失败原因
    private String refundNo;         // 退款流水号
    private BigDecimal refundAmount; // 退款金额
    private LocalDateTime refundedAt;// 退款时间
}
