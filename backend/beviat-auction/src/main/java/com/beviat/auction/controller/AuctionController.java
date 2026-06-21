package com.beviat.auction.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beviat.auction.domain.Auction;
import com.beviat.auction.domain.AuctionBid;
import com.beviat.auction.service.AuctionService;
import com.beviat.auction.vo.AuctionDetailVO;
import com.beviat.auction.vo.AuctionVO;
import com.beviat.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Tag(name = "拍卖管理")
@RestController
@RequestMapping("/auctions")
@RequiredArgsConstructor
public class AuctionController {
    private final AuctionService auctionService;

    @Operation(summary = "创建拍卖")
    @PostMapping
    public R<Auction> create(@RequestParam Long productId,
                             @RequestParam BigDecimal startingPrice,
                             @RequestParam(defaultValue = "1.00") BigDecimal priceIncrement,
                             @RequestParam String endTime, // ISO格式
                             @RequestParam(required = false) BigDecimal reservePrice) {
        Long sellerId = com.beviat.common.util.RequestContextHolder.getCurrentUserId();
        if (sellerId == null) sellerId = 1L;
        log.info("创建拍卖请求: productId={}, sellerId={}, startingPrice={}, endTime={}", productId, sellerId, startingPrice, endTime);
        try {
            java.time.LocalDateTime parsedEndTime = java.time.LocalDateTime.parse(endTime);
            return R.ok(auctionService.create(productId, sellerId, startingPrice,
                    priceIncrement, parsedEndTime, reservePrice));
        } catch (Exception e) {
            log.error("创建拍卖失败", e);
            return R.fail(e.getMessage());
        }
    }

    @Operation(summary = "拍卖列表（分页，可选按状态筛选）")
    @GetMapping
    public R<IPage<AuctionVO>> list(@RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "10") int size,
                                    @RequestParam(required = false) Integer status) {
        return R.ok(auctionService.listByStatus(status, page, size));
    }

    @Operation(summary = "出价")
    @PostMapping("/{id}/bids")
    public R<AuctionBid> bid(@PathVariable Long id, @RequestParam BigDecimal amount) {
        Long bidderId = com.beviat.common.util.RequestContextHolder.getCurrentUserId();
        if (bidderId == null) bidderId = 1L;
        return R.ok(auctionService.placeBid(id, bidderId, amount));
    }

    @Operation(summary = "获取出价列表")
    @GetMapping("/{id}/bids")
    public R<List<AuctionBid>> getBids(@PathVariable Long id) {
        AuctionDetailVO detail = auctionService.getDetail(id);
        return R.ok(detail.getBids() != null ? detail.getBids() : List.of());
    }

    @Operation(summary = "拍卖详情（含出价列表、商品信息）")
    @GetMapping("/{id}")
    public R<AuctionDetailVO> getDetail(@PathVariable Long id) {
        return R.ok(auctionService.getDetail(id));
    }

    @Operation(summary = "进行中的拍卖列表")
    @GetMapping("/active")
    public R<List<AuctionVO>> getActive(@RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "10") int size) {
        return R.ok(auctionService.getActiveAuctions(page, size));
    }

    @Operation(summary = "我发起的拍卖列表")
    @GetMapping("/my")
    public R<IPage<AuctionVO>> getMy(@RequestParam(defaultValue = "1") int page,
                                     @RequestParam(defaultValue = "10") int size,
                                     @RequestParam(required = false) Integer status) {
        Long sellerId = com.beviat.common.util.RequestContextHolder.getCurrentUserId();
        if (sellerId == null) sellerId = 1L;
        return R.ok(auctionService.listBySeller(sellerId, status, page, size));
    }
}
