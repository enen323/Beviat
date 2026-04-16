package com.beviat.evaluation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beviat.evaluation.dto.EvaluationDTO;
import com.beviat.evaluation.domain.Evaluation;
import com.beviat.evaluation.mapper.EvaluationMapper;
import com.beviat.evaluation.service.EvaluationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationServiceImpl implements EvaluationService {

    private final EvaluationMapper evaluationMapper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void submit(Long evaluatorId, Long evaluatedUserId, EvaluationDTO dto) {
        // 检查是否已评价
        Long existing = evaluationMapper.selectCount(
                new LambdaQueryWrapper<Evaluation>()
                        .eq(Evaluation::getProductId, dto.getProductId())
                        .eq(Evaluation::getEvaluatorId, evaluatorId)
                        .eq(Evaluation::getDeleted, 0)
        );
        if (existing > 0) throw new com.beviat.common.exception.BizException("该商品已评价过");

        Evaluation eval = new Evaluation();
        eval.setOrderType(dto.getOrderType());
        eval.setProductId(dto.getProductId());
        eval.setEvaluatorId(evaluatorId);
        eval.setEvaluatedUserId(evaluatedUserId);
        eval.setScore(dto.getScore());
        eval.setContent(dto.getContent());
        eval.setIsAnonymous(dto.getAnonymous() != null ? dto.getAnonymous() : false);

        try {
            if (dto.getImages() != null && !dto.getImages().isEmpty())
                eval.setImages(objectMapper.writeValueAsString(dto.getImages()));
            if (dto.getTags() != null && !dto.getTags().isEmpty())
                eval.setTags(objectMapper.writeValueAsString(dto.getTags()));
        } catch (Exception e) {
            log.warn("序列化失败", e);
        }

        evaluationMapper.insert(eval);
        log.info("评价提交: productId={}, score={}, toUser={}", dto.getProductId(), dto.getScore(), evaluatedUserId);

        // 异步更新被评人信用分（简化：直接更新）
        updateCreditScore(evaluatedUserId);
    }

    @Override
    public Page<Evaluation> getByProduct(Long productId, int page, int size) {
        return evaluationMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Evaluation>()
                        .eq(Evaluation::getProductId, productId)
                        .eq(Evaluation::getDeleted, 0)
                        .orderByDesc(Evaluation::getCreatedAt));
    }

    @Override
    public Page<Evaluation> getByUser(Long userId, int page, int size) {
        return evaluationMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Evaluation>()
                        .eq(Evaluation::getEvaluatedUserId, userId)
                        .eq(Evaluation::getDeleted, 0)
                        .orderByDesc(Evaluation::getCreatedAt));
    }

    @Override
    public int calculateCreditScore(Long userId) {
        // 简化信用分算法：
        // 基础分300 + 平均评分 * 40 + 评价数量加成
        var evaluations = evaluationMapper.selectList(
                new LambdaQueryWrapper<Evaluation>()
                        .eq(Evaluation::getEvaluatedUserId, userId)
                        .eq(Evaluation::getDeleted, 0)
        );

        int baseScore = 300;
        double avgScore = evaluations.isEmpty() ? 3.5 :
                evaluations.stream().mapToInt(Evaluation::getScore).average().orElse(3.5);
        int countBonus = Math.min(100, evaluations.size());

        return baseScore + (int)(avgScore * 40) + countBonus; // 范围: 300 ~ 600
    }

    private void updateCreditScore(Long userId) {
        int score = calculateCreditScore(userId);
        // 更新用户表中的信用分
        log.info("更新信用分: userId={}, score={}", userId, score);
        // TODO: 通过 UserMapper 更新 credit_score 字段
    }
}
