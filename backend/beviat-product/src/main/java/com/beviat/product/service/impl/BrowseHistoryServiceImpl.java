package com.beviat.product.service.impl;

import com.beviat.common.constant.Constants;
import com.beviat.common.domain.Product;
import com.beviat.product.mapper.ProductMapper;
import com.beviat.product.service.BrowseHistoryService;
import com.beviat.product.vo.ProductVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * 浏览记录服务实现（基于Redis List）
 * <p>
 * Redis Key: beviat:browse:{userId}
 * Value: productId列表（按浏览时间倒序，最新浏览的在前）
 * TTL: 30天自动过期
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BrowseHistoryServiceImpl implements BrowseHistoryService {

    private final StringRedisTemplate redisTemplate;
    private final ProductMapper productMapper;

    /** 最大保留浏览记录条数 */
    private static final int MAX_HISTORY_SIZE = 50;
    /** 浏览记录过期时间（30天） */
    private static final Duration HISTORY_TTL = Duration.ofDays(30);

    @Override
    public void recordBrowse(Long userId, Long productId) {
        if (userId == null || productId == null) return;
        try {
            String key = Constants.REDIS_BROWSE_HISTORY_PREFIX + userId;
            String productIdStr = String.valueOf(productId);

            // 1. 先移除已存在的相同productId（去重）
            redisTemplate.opsForList().remove(key, 0, productIdStr);
            // 2. 将productId推入列表头部（最新浏览在前）
            redisTemplate.opsForList().leftPush(key, productIdStr);
            // 3. 裁剪列表，保留前MAX_HISTORY_SIZE条
            redisTemplate.opsForList().trim(key, 0, MAX_HISTORY_SIZE - 1);
            // 4. 刷新过期时间
            redisTemplate.expire(key, HISTORY_TTL);

            log.debug("记录浏览历史: userId={}, productId={}", userId, productId);
        } catch (Exception e) {
            log.warn("记录浏览历史失败: {}", e.getMessage());
        }
    }

    @Override
    public List<ProductVO> getBrowseHistory(Long userId, int limit) {
        if (userId == null) return List.of();
        try {
            String key = Constants.REDIS_BROWSE_HISTORY_PREFIX + userId;
            // 从列表头部取limit条
            List<String> productIdStrs = redisTemplate.opsForList().range(key, 0, limit - 1);
            if (productIdStrs == null || productIdStrs.isEmpty()) return List.of();

            // 根据productId批量查询商品信息
            List<ProductVO> result = new ArrayList<>();
            for (String idStr : productIdStrs) {
                try {
                    Long productId = Long.valueOf(idStr);
                    Product product = productMapper.selectById(productId);
                    if (product != null && (product.getDeleted() == null || product.getDeleted() == 0)) {
                        result.add(toSimpleVO(product));
                    }
                } catch (NumberFormatException e) {
                    log.warn("无效的productId: {}", idStr);
                }
            }
            return result;
        } catch (Exception e) {
            log.warn("获取浏览记录失败: {}", e.getMessage());
            return List.of();
        }
    }

    @Override
    public void removeBrowseHistory(Long userId, Long productId) {
        if (userId == null || productId == null) return;
        try {
            String key = Constants.REDIS_BROWSE_HISTORY_PREFIX + userId;
            redisTemplate.opsForList().remove(key, 0, String.valueOf(productId));
        } catch (Exception e) {
            log.warn("删除浏览记录失败: {}", e.getMessage());
        }
    }

    @Override
    public void clearBrowseHistory(Long userId) {
        if (userId == null) return;
        try {
            String key = Constants.REDIS_BROWSE_HISTORY_PREFIX + userId;
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("清空浏览记录失败: {}", e.getMessage());
        }
    }

    /** 转换为简化版ProductVO（用于浏览记录列表展示） */
    private ProductVO toSimpleVO(Product product) {
        ProductVO vo = new ProductVO();
        vo.setId(product.getId());
        vo.setTitle(product.getTitle());
        vo.setPrice(product.getPrice());
        vo.setOriginalPrice(product.getOriginalPrice());
        vo.setCategoryId(product.getCategoryId());
        vo.setStatus(product.getStatus());
        vo.setConditionLevel(product.getConditionLevel());
        vo.setViewCount(product.getViewCount());
        vo.setFavoriteCount(product.getFavoriteCount());
        vo.setLocation(product.getLocation());
        vo.setCreatedAt(product.getCreatedAt());

        // 图片
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            String cover = product.getImages().get(0);
            vo.setCoverImage(cover.startsWith("/") ? cover : cover);
            vo.setImages(product.getImages());
        }

        return vo;
    }
}
