package com.beviat.evaluation.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beviat.evaluation.domain.Evaluation;
import com.beviat.evaluation.dto.EvaluationDTO;
import com.beviat.evaluation.service.EvaluationService;
import com.beviat.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "评价管理")
@RestController
@RequestMapping("/evaluations")
@RequiredArgsConstructor
public class EvaluationController {
    private final EvaluationService evaluationService;

    @Operation(summary = "提交评价")
    @PostMapping("/submit")
    public R<Void> submit(@RequestParam Long evaluatedUserId, @Valid @RequestBody EvaluationDTO dto) {
        Long userId = com.beviat.common.util.RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        evaluationService.submit(userId, evaluatedUserId, dto);
        return R.ok("评价成功", null);
    }
    @Operation(summary = "获取商品评价列表")
    @GetMapping("/product/{productId}")
    public R<Page<Evaluation>> getByProduct(@PathVariable Long productId,
                                            @RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        return R.ok(evaluationService.getByProduct(productId, page, size));
    }

    @Operation(summary = "获取用户收到的评价")
    @GetMapping("/user/{userId}")
    public R<Page<Evaluation>> getByUser(@PathVariable Long userId,
                                         @RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "10") int size) {
        return R.ok(evaluationService.getByUser(userId, page, size));
    }

    @Operation(summary = "查询用户信用分")
    @GetMapping("/credit-score/{userId}")
    public R<Integer> getCreditScore(@PathVariable Long userId) {
        return R.ok(evaluationService.calculateCreditScore(userId));
    }
}
