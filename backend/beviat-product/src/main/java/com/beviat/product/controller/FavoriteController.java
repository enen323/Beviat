package com.beviat.product.controller;

import com.beviat.common.result.R;
import com.beviat.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 收藏控制器
 */
@Tag(name = "收藏管理")
@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final ProductService productService;

    @Operation(summary = "收藏/取消收藏")
    @PostMapping("/toggle")
    public R<Boolean> toggleFavorite(@RequestParam Long productId) {
        Long userId = com.beviat.common.util.RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L; // TODO: 临时
        boolean favorited = productService.toggleFavorite(userId, productId);
        return R.ok(favorited);
    }

    @Operation(summary = "检查是否已收藏")
    @GetMapping("/check/{productId}")
    public R<Boolean> isFavorited(@PathVariable Long productId) {
        Long userId = com.beviat.common.util.RequestContextHolder.getCurrentUserId();
        if (userId == null) return R.ok(false);
        return R.ok(productService.isFavorited(userId, productId));
    }
}
