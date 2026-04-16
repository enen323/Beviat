package com.beviat.auction.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 拍卖实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("auction")
public class Auction extends BaseEntity {
    private Long productId;        // 关联商品ID(唯一)
    private Long sellerId;         // 卖家ID
    private BigDecimal startingPrice;  // 起拍价
    private BigDecimal currentPrice;   // 当前最高价
    private BigDecimal reservePrice;  // 保留价
    private BigDecimal priceIncrement; // 最低加价幅度
    private LocalDateTime endTime;     // 拍卖截止时间
    private Long winnerUserId;         // 中标者ID
    private Integer status;            // 0-进行中 1-已成交 2-已流拍 3-已取消
}
