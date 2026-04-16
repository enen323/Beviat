package com.beviat.auction.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.math.BigDecimal;

/**
 * 出价记录实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("auction_bid")
public class AuctionBid extends BaseEntity {
    private Long auctionId;       // 拍卖ID
    private Long bidderId;        // 出价者ID
    private BigDecimal bidPrice;  // 出价金额
    private Boolean isAutoBid;    // 是否自动出价
}
