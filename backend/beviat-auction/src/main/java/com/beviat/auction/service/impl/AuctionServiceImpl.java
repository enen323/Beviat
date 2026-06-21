package com.beviat.auction.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beviat.auction.domain.Auction;
import com.beviat.auction.domain.AuctionBid;
import com.beviat.auction.mapper.AuctionBidMapper;
import com.beviat.auction.mapper.AuctionMapper;
import com.beviat.auction.service.AuctionService;
import com.beviat.auction.vo.AuctionDetailVO;
import com.beviat.auction.vo.AuctionVO;
import com.beviat.common.domain.Product;
import com.beviat.common.exception.BizException;
import com.beviat.product.mapper.ProductMapper;
import com.beviat.product.vo.ProductVO;
import com.beviat.system.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionServiceImpl implements AuctionService {

    private final AuctionMapper auctionMapper;
    private final AuctionBidMapper bidMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final ProductMapper productMapper;
    private final UserService userService;

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
        auction.setStatus(0);
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

        auction.setCurrentPrice(bidAmount);
        auctionMapper.updateById(auction);

        AuctionBid bid = new AuctionBid();
        bid.setAuctionId(auctionId);
        bid.setBidderId(bidderId);
        bid.setBidPrice(bidAmount);
        bid.setIsAutoBid(false);
        bidMapper.insert(bid);

        log.info("出价成功: auctionId={}, bidder={}, amount={}", auctionId, bidderId, bidAmount);
        messagingTemplate.convertAndSend("/topic/auction/" + auctionId + "/bid", bid);
        return bid;
    }

    @Override
    public AuctionDetailVO getDetail(Long id) {
        Auction auction = auctionMapper.selectById(id);
        if (auction == null) throw new BizException("拍卖不存在");

        List<AuctionBid> bids = bidMapper.selectList(
                new LambdaQueryWrapper<AuctionBid>()
                        .eq(AuctionBid::getAuctionId, id)
                        .eq(AuctionBid::getDeleted, 0)
                        .orderByDesc(AuctionBid::getCreatedAt)
        );

        ProductVO productVO = fetchProductVO(auction.getProductId());

        AuctionDetailVO vo = toAuctionDetailVO(auction, productVO, bids);
        vo.setRemainingSeconds(Math.max(0,
                Duration.between(LocalDateTime.now(), auction.getEndTime()).getSeconds()));
        return vo;
    }

    @Override
    public List<AuctionVO> getActiveAuctions(int page, int size) {
        List<Auction> auctions = auctionMapper.selectPage(
                new Page<>(page, size),
                new LambdaQueryWrapper<Auction>()
                        .eq(Auction::getStatus, 0).eq(Auction::getDeleted, 0)
                        .ge(Auction::getEndTime, LocalDateTime.now())
                        .orderByDesc(Auction::getCreatedAt)
        ).getRecords();
        return toAuctionVOList(auctions);
    }

    @Override
    public IPage<AuctionVO> listByStatus(Integer status, int page, int size) {
        LambdaQueryWrapper<Auction> wrapper = new LambdaQueryWrapper<Auction>()
                .eq(Auction::getDeleted, 0)
                .orderByDesc(Auction::getCreatedAt);
        if (status != null) {
            wrapper.eq(Auction::getStatus, status);
        }
        Page<Auction> pageResult = auctionMapper.selectPage(new Page<>(page, size), wrapper);
        return convertPage(pageResult);
    }

    @Override
    public IPage<AuctionVO> listBySeller(Long sellerId, Integer status, int page, int size) {
        LambdaQueryWrapper<Auction> wrapper = new LambdaQueryWrapper<Auction>()
                .eq(Auction::getSellerId, sellerId)
                .eq(Auction::getDeleted, 0)
                .orderByDesc(Auction::getCreatedAt);
        if (status != null) {
            wrapper.eq(Auction::getStatus, status);
        }
        Page<Auction> pageResult = auctionMapper.selectPage(new Page<>(page, size), wrapper);
        return convertPage(pageResult);
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
            Long highestBidder = getHighestBidder(auction.getId());
            if (highestBidder != null && (auction.getReservePrice() == null ||
                    auction.getCurrentPrice().compareTo(auction.getReservePrice()) >= 0)) {
                auction.setStatus(1);
                auction.setWinnerUserId(highestBidder);
            } else {
                auction.setStatus(2);
            }
            auctionMapper.updateById(auction);
            log.info("拍卖已自动结: id={}, status={}", auction.getId(), auction.getStatus());
        }
    }

    // ============ 私有辅助方法 ============

    private IPage<AuctionVO> convertPage(Page<Auction> pageResult) {
        List<AuctionVO> voList = toAuctionVOList(pageResult.getRecords());
        Page<AuctionVO> voPage = new Page<>(pageResult.getCurrent(), pageResult.getSize(), pageResult.getTotal());
        voPage.setRecords(voList);
        return voPage;
    }

    private List<AuctionVO> toAuctionVOList(List<Auction> auctions) {
        if (auctions == null || auctions.isEmpty()) return Collections.emptyList();

        // 批量加载商品信息
        Set<Long> productIds = auctions.stream()
                .map(Auction::getProductId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<Long, ProductVO> productMap = productIds.isEmpty() ? Collections.emptyMap()
                : productMapper.selectBatchIds(productIds).stream()
                        .map(this::toProductVO)
                        .filter(vo -> vo != null && vo.getId() != null)
                        .collect(Collectors.toMap(ProductVO::getId, Function.identity(), (a, b) -> a));

        return auctions.stream()
                .map(a -> toAuctionVO(a, productMap.get(a.getProductId())))
                .collect(Collectors.toList());
    }

    private AuctionVO toAuctionVO(Auction auction, ProductVO productVO) {
        AuctionVO vo = new AuctionVO();
        fillBaseVO(vo, auction, productVO);
        return vo;
    }

    private AuctionDetailVO toAuctionDetailVO(Auction auction, ProductVO productVO, List<AuctionBid> bids) {
        AuctionDetailVO vo = new AuctionDetailVO();
        fillBaseVO(vo, auction, productVO);

        vo.setBidCount(bids != null ? bids.size() : 0);
        vo.setBids(bids);

        // 最高出价者和出价次数
        if (bids != null && !bids.isEmpty()) {
            AuctionBid topBid = bids.get(0);
            vo.setHighestBidderId(topBid.getBidderId());
            var user = userService.getById(topBid.getBidderId());
            if (user != null) {
                vo.setHighestBidderName(user.getNickname());
            }
        }

        return vo;
    }

    private void fillBaseVO(AuctionVO vo, Auction auction, ProductVO productVO) {
        vo.setId(auction.getId());
        vo.setProductId(auction.getProductId());
        vo.setProduct(productVO);
        vo.setStartPrice(auction.getStartingPrice());
        vo.setCurrentPrice(auction.getCurrentPrice());
        vo.setMinIncrement(auction.getPriceIncrement());
        vo.setStartTime(auction.getCreatedAt());
        vo.setEndTime(auction.getEndTime());

        // Integer status → string status
        String statusStr;
        switch (auction.getStatus()) {
            case 0:  statusStr = "ongoing";   break;
            case 1:  statusStr = "ended";     break;
            case 2:  statusStr = "ended";     break;
            case 3:  statusStr = "cancelled"; break;
            default: statusStr = "ended";
        }
        vo.setStatus(statusStr);
        vo.setBidCount(0); // list 不查 bid 数，detail 会覆盖
    }

    private ProductVO fetchProductVO(Long productId) {
        if (productId == null) return null;
        Product product = productMapper.selectById(productId);
        return toProductVO(product);
    }

    private ProductVO toProductVO(Product product) {
        if (product == null) return null;
        ProductVO vo = new ProductVO();
        vo.setId(product.getId());
        vo.setTitle(product.getTitle());
        vo.setDescription(product.getDescription());
        vo.setPrice(product.getPrice());
        vo.setOriginalPrice(product.getOriginalPrice());
        vo.setCategoryId(product.getCategoryId());
        vo.setConditionLevel(product.getConditionLevel());
        vo.setTradeType(product.getTradeType());
        vo.setImages(product.getImages());
        vo.setCoverImage(product.getImages() != null && !product.getImages().isEmpty()
                ? product.getImages().get(0) : null);
        vo.setLocation(product.getLocation());
        vo.setViewCount(product.getViewCount());
        vo.setFavoriteCount(product.getFavoriteCount());
        vo.setIsTop(product.getIsTop());
        vo.setStatus(product.getStatus());
        vo.setCreatedAt(product.getCreatedAt());
        return vo;
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
