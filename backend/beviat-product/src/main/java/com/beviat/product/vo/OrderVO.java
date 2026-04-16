package com.beviat.product.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单VO
 */
@Data
public class OrderVO {
    private Long id;
    private String orderNo;
    private Long buyerId;
    private String buyerName;
    private String buyerAvatar;
    private Long sellerId;
    private String sellerName;
    private String sellerAvatar;
    private Long productId;
    private String productTitle;
    private String productImage;
    private BigDecimal productPrice;
    private BigDecimal orderAmount;
    private Integer status;
    private String statusText;
    private Integer tradeType;
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String remark;
    private LocalDateTime paidAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime shippedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancelReason;
    /** 支付流水号（已支付时返回） */
    private String paymentNo;
    /** 买家位置 */
    private BigDecimal buyerLatitude;
    private BigDecimal buyerLongitude;
    private String buyerAddress;
    /** 卖家位置 */
    private BigDecimal sellerLatitude;
    private BigDecimal sellerLongitude;
    private String sellerAddress;
    private LocalDateTime createdAt;
}
