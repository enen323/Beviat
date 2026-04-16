package com.beviat.auction.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.beviat.auction.domain.Auction;
import com.beviat.auction.domain.AuctionBid;
import com.beviat.auction.mapper.AuctionBidMapper;
import com.beviat.auction.mapper.AuctionMapper;
import com.beviat.auction.service.AuctionService;
import com.beviat.common.exception.BizException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionServiceImpl implements AuctionService {

    private final AuctionMapper auctionMapper;
    private final AuctionBidMapper bidMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public Auction create(Long productId, Long sellerId, BigDecimal startingPrice,
                          BigDecimal priceIncrement, LocalDateTime endTime, BigDecimal reservePrice) {
        Auction auction = new Auction();
        auction.setProductId(productId);
        auction.setSellerId(sellerId);
        auction.setStartingPrice(startingPrice);
        auction.setCurrentPrice(startingPrice);
        auction.setPriceIncrement(priceIncrement != null ? priceIncrement : BigDecimal.ONE);
        auction.setEndTime(endTime);
        auction.setReservePrice(reservePrice);
        auction.setStatus(0); // 进行中
        auctionMapper.insert(auction);
        log.info("拍卖创建成功: productId={}, startingPrice={}", productId, startingPrice);
        return auction;
    }

    @Override
    @Transactional
    public AuctionBid placeBid(Long auctionId, Long bidderId, BigDecimal bidAmount) {
        Auction auction = auctionMapper.selectById(auctionId);
        if (auction == null || auction.getDeleted() == 1)
            throw new BizException("拍卖不存在");
        if (auction.getStatus() != 0)
            throw new BizException("拍卖已结束");
        if (auction.getSellerId().equals(bidderId))
            throw new BizException("卖家不能参与自己的拍卖");
        if (bidAmount.compareTo(auction.getCurrentPrice().add(auction.getPriceIncrement())) < 0)
            throw new BizException("出价必须高于当前价 + 最低加价幅度");
        if (LocalDateTime.now().isAfter(auction.getEndTime()))
            throw new BizException("拍卖已截止");

        // 更新当前最高价
        auction.setCurrentPrice(bidAmount);
        auctionMapper.updateById(auction);

        // 记录出价
        AuctionBid bid = new AuctionBid();
        bid.setAuctionId(auctionId);
        bid.setBidderId(bidderId);
        bid.setBidPrice(bidAmount);
        bid.setIsAutoBid(false);
        bidMapper.insert(bid);

        log.info("出价成功: auctionId={}, bidder={}, amount={}", auctionId, bidderId, bidAmount);

        // WebSocket实时推送新出价通知
        messagingTemplate.convertAndSend("/topic/auction/" + auctionId + "/bid", bid);

        return bid;
    }

    @Override
    public Object getDetail(Long id) {
        Auction auction = auctionMapper.selectById(id);
        if (auction == null) throw new BizException("拍卖不存在");

        // 获取出价记录（倒序）
        List<AuctionBid> bids = bidMapper.selectList(
                new LambdaQueryWrapper<AuctionBid>()
                        .eq(AuctionBid::getAuctionId, id)
                        .eq(AuctionBid::getDeleted, 0)
                        .orderByDesc(AuctionBid::getCreatedAt)
        );

        return java.util.Map.of(
                "auction", auction,
                "bids", bids,
                "remainingSeconds", Math.max(0,
                        java.time.Duration.between(LocalDateTime.now(), auction.getEndTime()).getSeconds())
        );
    }

    @Override
    public List<Auction> getActiveAuctions(int page, int size) {
        return auctionMapper.selectPage(
                new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(page, size),
                new LambdaQueryWrapper<Auction>()
                        .eq(Auction::getStatus, 0).eq(Auction::getDeleted, 0)
                        .ge(Auction::getEndTime, LocalDateTime.now())
                        .orderByDesc(Auction::getCreatedAt)
        ).getRecords();
    }

    /** 定时任务：检查并自动结束到期拍卖 */
    @Override
    @Transactional
    public void checkAndFinalizeExpiredAuctions() {
        List<Auction> expired = auctionMapper.selectList(
                new LambdaQueryWrapper<Auction>()
                        .eq(Auction::getStatus, 0).eq(Auction::getDeleted, 0)
                        .le(Auction::getEndTime, LocalDateTime.now())
        );

        for (Auction auction : expired) {
            // 有出价 -> 成交，无出价 -> 流拍
            Long highestBidder = getHighestBidder(auction.getId());
            if (highestBidder != null && (auction.getReservePrice() == null ||
                    auction.getCurrentPrice().compareTo(auction.getReservePrice()) >= 0)) {
                auction.setStatus(1); // 已成交
                auction.setWinnerUserId(highestBidder);
            } else {
                auction.setStatus(2); // 已流拍
            }
            auctionMapper.updateById(auction);
            log.info("拍卖已自动结: id={}, status={}", auction.getId(), auction.getStatus());
        }
    }

    private Long getHighestBidder(Long auctionId) {
        AuctionBid topBid = bidMapper.selectOne(
                new LambdaQueryWrapper<AuctionBid>()
                        .eq(AuctionBid::getAuctionId, auctionId).eq(AuctionBid::getDeleted, 0)
                        .orderByDesc(AuctionBid::getBidPrice).last("LIMIT 1")
        );
        return topBid != null ? topBid.getBidderId() : null;
    }
}
