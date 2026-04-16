package com.beviat.evaluation.service;

import com.beviat.evaluation.dto.EvaluationDTO;
import com.beviat.evaluation.domain.Evaluation;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

public interface EvaluationService {
    /** 提交评价 */
    void submit(Long evaluatorId, Long evaluatedUserId, EvaluationDTO dto);

    /** 获取某商品的评价列表 */
    Page<Evaluation> getByProduct(Long productId, int page, int size);

    /** 获取某用户的收到的评价列表 */
    Page<Evaluation> getByUser(Long userId, int page, int size);

    /** 计算用户信用分 */
    int calculateCreditScore(Long userId);
}
