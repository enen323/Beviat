package com.beviat.auction.controller;

import com.beviat.auction.domain.Auction;
import com.beviat.auction.domain.AuctionBid;
import com.beviat.auction.service.AuctionService;
import com.beviat.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

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
        return R.ok(auctionService.create(productId, sellerId, startingPrice,
                priceIncrement, java.time.LocalDateTime.parse(endTime), reservePrice));
    }

    @Operation(summary = "拍卖列表")
    @GetMapping
    public R<List<Auction>> list(@RequestParam(defaultValue = "1") int page,
                                  @RequestParam(defaultValue = "10") int size) {
        return R.ok(auctionService.getActiveAuctions(page, size));
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
        Object detail = auctionService.getDetail(id);
        // getDetail 返回的详情中包含出价列表
        if (detail instanceof java.util.Map<?, ?> map) {
            Object bids = map.get("bids");
            return R.ok(bids != null ? (List<AuctionBid>) bids : List.of());
        }
        return R.ok(List.of());
    }

    @Operation(summary = "拍卖详情（含出价列表）")
    @GetMapping("/{id}")
    public R<Object> getDetail(@PathVariable Long id) {
        return R.ok(auctionService.getDetail(id));
    }

    @Operation(summary = "进行中的拍卖列表")
    @GetMapping("/active")
    public R<List<Auction>> getActive(@RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "10") int size) {
        return R.ok(auctionService.getActiveAuctions(page, size));
    }
}
