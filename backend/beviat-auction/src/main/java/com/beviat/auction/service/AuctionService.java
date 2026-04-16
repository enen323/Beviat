package com.beviat.auction.service;

import com.beviat.auction.domain.Auction;
import com.beviat.auction.domain.AuctionBid;

import java.math.BigDecimal;
import java.util.List;

public interface AuctionService {
    /** 创建拍卖 */
    Auction create(Long productId, Long sellerId, BigDecimal startingPrice,
                   BigDecimal priceIncrement, java.time.LocalDateTime endTime, BigDecimal reservePrice);

    /** 参与出价 */
    AuctionBid placeBid(Long auctionId, Long bidderId, BigDecimal bidAmount);

    /** 获取拍卖详情（含出价列表） */
    Object getDetail(Long id);

    /** 获取进行中的拍卖列表 */
    List<Auction> getActiveAuctions(int page, int size);

    /** 自动检查并结束到期拍卖 */
    void checkAndFinalizeExpiredAuctions();
}
