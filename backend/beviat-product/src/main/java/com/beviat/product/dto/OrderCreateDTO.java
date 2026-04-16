package com.beviat.product.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 创建订单DTO
 */
@Data
public class OrderCreateDTO {
    @NotNull(message = "商品ID不能为空")
    private Long productId;

    /** 收货人姓名 */
    private String receiverName;

    /** 收货人手机号 */
    private String receiverPhone;

    /** 收货地址 */
    private String receiverAddress;

    /** 买家备注 */
    private String remark;

    /** 买家纬度 */
    private BigDecimal buyerLatitude;

    /** 买家经度 */
    private BigDecimal buyerLongitude;

    /** 买家定位地址 */
    private String buyerAddress;
}
