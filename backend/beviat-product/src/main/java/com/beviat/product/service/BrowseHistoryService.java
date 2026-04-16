package com.beviat.product.service;

import com.beviat.product.vo.ProductVO;

import java.util.List;

/**
 * 浏览记录服务（基于Redis）
 */
public interface BrowseHistoryService {

    /** 记录浏览历史（存入Redis List，自动去重，最多保留50条） */
    void recordBrowse(Long userId, Long productId);

    /** 获取当前用户的浏览记录（按时间倒序） */
    List<ProductVO> getBrowseHistory(Long userId, int limit);

    /** 删除指定商品的浏览记录 */
    void removeBrowseHistory(Long userId, Long productId);

    /** 清空浏览记录 */
    void clearBrowseHistory(Long userId);
}
