package com.beviat.product.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.beviat.common.domain.Product;
import com.beviat.product.domain.UserBehavior;
import com.beviat.product.mapper.ProductMapper;
import com.beviat.product.mapper.UserBehaviorMapper;
import com.beviat.product.service.RecommendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 推荐服务实现
 * - 基于内容推荐：根据用户浏览/收藏过的商品分类推荐同类商品
 * - 热门推荐：基于浏览量+收藏量的加权排序
 * - 新品推荐：按发布时间排序
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendServiceImpl implements RecommendService {

    private final ProductMapper productMapper;
    private final UserBehaviorMapper behaviorMapper;
    private final StringRedisTemplate redisTemplate;

    @Override
    public List<Product> getRecommendations(Long userId, int limit) {
        // 1. 查询用户最近浏览/收藏的商品分类ID列表
        List<Long> categoryIds = getPreferredCategories(userId);

        if (categoryIds.isEmpty()) {
            // 无行为数据时返回热门商品
            return getHotProducts(limit);
        }

        // 2. 从这些分类中随机选取未浏览过的在售商品
        return productMapper.selectList(
                new LambdaQueryWrapper<Product>()
                        .eq(Product::getDeleted, 0)
                        .eq(Product::getStatus, 0)
                        .in(Product::getCategoryId, categoryIds)
                        .orderByDesc(Product::getViewCount)
                        .last("LIMIT " + limit)
        );
    }

    @Override
    public List<Product> getHotProducts(int limit) {
        // 加权排序：浏览量*1 + 收藏数*5（收藏权重更高）
        return productMapper.selectList(
                new LambdaQueryWrapper<Product>()
                        .eq(Product::getDeleted, 0).eq(Product::getStatus, 0)
                        .eq(Product::getIsTop, false)
                        .orderByDesc(Product::getFavoriteCount)
                        .orderByDesc(Product::getViewCount)
                        .last("LIMIT " + limit)
        );
    }

    @Override
    public List<Product> getNewProducts(int limit) {
        return productMapper.selectList(
                new LambdaQueryWrapper<Product>()
                        .eq(Product::getDeleted, 0).eq(Product::getStatus, 0)
                        .orderByDesc(Product::getCreatedAt)
                        .last("LIMIT " + limit)
        );
    }

    @Override
    public void recordBehavior(Long userId, String behaviorType, String targetType, Long targetId) {
        try {
            UserBehavior behavior = new UserBehavior();
            behavior.setUserId(userId);
            behavior.setBehaviorType(behaviorType);
            behavior.setTargetType(targetType);
            behavior.setTargetId(targetId);
            behavior.setIpAddress(""); // 可从Request中获取
            behavior.setCreatedAt(java.time.LocalDateTime.now());
            behaviorMapper.insert(behavior);

            // 同时写入 Redis 用于实时推荐更新
            String redisKey = "beviat:behavior:" + userId + ":" + targetType + ":" + targetId;
            redisTemplate.opsForValue().set(redisKey, behaviorType,
                    java.time.Duration.ofDays(7));
        } catch (Exception e) {
            log.warn("记录用户行为失败: {}", e.getMessage());
        }
    }

    /** 获取用户偏好的分类ID列表（基于最近30天的行为） */
    private List<Long> getPreferredCategories(Long userId) {
        // 查询最近30天该用户浏览/收藏的商品分类
        var behaviors = behaviorMapper.selectList(
                new LambdaQueryWrapper<UserBehavior>()
                        .eq(UserBehavior::getUserId, userId)
                        .in(UserBehavior::getBehaviorType, List.of("view", "favorite"))
                        .ge(UserBehavior::getCreatedAt,
                                java.time.LocalDateTime.now().minusDays(30))
                        .last("GROUP BY target_id ORDER BY created_at DESC LIMIT 20")
        );

        if (behaviors.isEmpty()) return List.of();

        // 提取目标商品的分类ID
        List<Long> productIds = behaviors.stream()
                .filter(b -> "product".equals(b.getTargetType()))
                .map(UserBehavior::getTargetId).distinct().toList();

        if (productIds.isEmpty()) return List.of();

        return productMapper.selectList(
                new LambdaQueryWrapper<Product>().in(Product::getId, productIds)
        ).stream().map(Product::getCategoryId).distinct().toList();
    }
}
