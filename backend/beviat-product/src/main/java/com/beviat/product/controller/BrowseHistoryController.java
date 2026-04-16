package com.beviat.product.controller;

import com.beviat.common.exception.BizException;
import com.beviat.common.result.R;
import com.beviat.common.util.RequestContextHolder;
import com.beviat.product.service.BrowseHistoryService;
import com.beviat.product.vo.ProductVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 浏览记录控制器
 */
@Tag(name = "浏览记录", description = "用户浏览商品的历史记录管理")
@RestController
@RequestMapping("/browse-history")
@RequiredArgsConstructor
public class BrowseHistoryController {

    private final BrowseHistoryService browseHistoryService;

    @Operation(summary = "获取当前用户浏览记录")
    @GetMapping
    public R<List<ProductVO>> getBrowseHistory(
            @RequestParam(defaultValue = "20") int limit) {
        Long userId = getCurrentUserId();
        return R.ok(browseHistoryService.getBrowseHistory(userId, limit));
    }

    @Operation(summary = "删除指定商品的浏览记录")
    @DeleteMapping("/{productId}")
    public R<Void> removeBrowseHistory(@PathVariable Long productId) {
        Long userId = getCurrentUserId();
        browseHistoryService.removeBrowseHistory(userId, productId);
        return R.ok("删除成功", null);
    }

    @Operation(summary = "清空浏览记录")
    @DeleteMapping
    public R<Void> clearBrowseHistory() {
        Long userId = getCurrentUserId();
        browseHistoryService.clearBrowseHistory(userId);
        return R.ok("清空成功", null);
    }

    private Long getCurrentUserId() {
        Long userId = RequestContextHolder.getCurrentUserId();
        if (userId == null) {
            throw new BizException(401, "未登录或登录已过期");
        }
        return userId;
    }
}
