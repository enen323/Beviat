package com.beviat.auction.vo;

import com.beviat.product.vo.ProductVO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 拍卖VO — 列表用，含商品基本信息，字段名匹配前端
 */
@Data
public class AuctionVO {
    private Long id;
    private Long productId;
    private ProductVO product;
    private BigDecimal startPrice;
    private BigDecimal currentPrice;
    private BigDecimal minIncrement;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;          // 'ongoing' | 'ended' | 'cancelled'
    private Integer bidCount;
    private Long highestBidderId;
    private String highestBidderName;
}
