package com.beviat.auction.vo;

import com.beviat.auction.domain.AuctionBid;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 拍卖详情VO — 继承 AuctionVO，增加出价列表和倒计时
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AuctionDetailVO extends AuctionVO {
    private List<AuctionBid> bids;
    private Long remainingSeconds;
}
