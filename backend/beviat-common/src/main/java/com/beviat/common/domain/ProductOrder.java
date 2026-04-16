package com.beviat.common.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品订单实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("product_order")
public class ProductOrder extends BaseEntity {
    private String orderNo;          // 订单编号
    private Long buyerId;            // 买家ID
    private Long sellerId;           // 卖家ID
    private Long productId;          // 商品ID
    private String productTitle;     // 商品标题快照
    private String productImage;     // 商品封面图快照
    private BigDecimal productPrice; // 商品价格快照
    private BigDecimal orderAmount;  // 订单金额
    private Integer status;          // 0-待支付 1-待卖家确认(已支付) 2-卖家已确认/待发货 3-已发货 4-已完成 5-已取消 6-已退款
    private Integer tradeType;       // 0-自提 1-快递 2-都可以
    private String receiverName;     // 收货人姓名
    private String receiverPhone;    // 收货人手机号
    private String receiverAddress;  // 收货地址
    private String remark;           // 买家备注
    private LocalDateTime paidAt;    // 支付时间
    private LocalDateTime confirmedAt; // 卖家确认时间
    private LocalDateTime completedAt; // 完成时间
    private LocalDateTime shippedAt;   // 发货时间
    private LocalDateTime cancelledAt; // 取消时间
    private String cancelReason;     // 取消原因
    private BigDecimal buyerLatitude;  // 买家纬度
    private BigDecimal buyerLongitude; // 买家经度
    private String buyerAddress;       // 买家定位地址
    private BigDecimal sellerLatitude; // 卖家纬度
    private BigDecimal sellerLongitude;// 卖家经度
    private String sellerAddress;      // 卖家定位地址
}
