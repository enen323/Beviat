package com.beviat.product.service;

import com.beviat.product.dto.ProductCreateDTO;
import com.beviat.product.dto.ProductQueryDTO;
import com.beviat.product.vo.ProductVO;


/**
 * 商品服务
 */
public interface ProductService {

    /** 发布商品 */
    ProductVO create(ProductCreateDTO dto, Long sellerId);

    /** 获取商品详情（增加浏览量） */
    ProductVO getDetail(Long id, Long viewerId);

    /** 分页查询商品列表 */
    com.beviat.common.result.PageResult<ProductVO> getList(ProductQueryDTO query);

    /** 更新商品 */
    ProductVO update(Long id, ProductCreateDTO dto, Long userId);

    /** 删除商品（逻辑删除） */
    void delete(Long id, Long userId);

    /** 上/下架商品 */
    void changeStatus(Long id, Integer status, Long userId);

    /** 收藏/取消收藏 */
    boolean toggleFavorite(Long userId, Long productId);

    /** 检查是否已收藏 */
    boolean isFavorited(Long userId, Long productId);

    /** 获取当前用户的商品 */
    java.util.List<ProductVO> getMyProducts(Long userId, Integer status);

    /** 获取当前用户的收藏列表 */
    java.util.List<ProductVO> getMyFavorites(Long userId);
}
