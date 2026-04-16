package com.beviat.product.service;

import com.beviat.common.domain.Product;
import java.util.List;

/**
 * 推荐服务接口
 * 基于内容推荐 + 协同过滤的混合策略
 */
public interface RecommendService {
    /** 获取"猜你喜欢"推荐列表 */
    List<Product> getRecommendations(Long userId, int limit);

    /** 获取热门商品（基于浏览量+收藏量） */
    List<Product> getHotProducts(int limit);

    /** 获取新品推荐 */
    List<Product> getNewProducts(int limit);

    /** 记录用户行为（供推荐算法使用） */
    void recordBehavior(Long userId, String behaviorType, String targetType, Long targetId);
}
