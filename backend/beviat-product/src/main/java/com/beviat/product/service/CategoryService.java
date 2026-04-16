package com.beviat.product.service;

import com.beviat.common.domain.Category;
import com.beviat.product.vo.CategoryVO;

import java.util.List;

/**
 * 分类服务
 */
public interface CategoryService {

    /** 获取分类树（含子分类） */
    List<CategoryVO> getCategoryTree();

    /** 获取所有启用的顶级分类 */
    List<CategoryVO> getTopCategories();

    /** 获取某分类下的子分类列表 */
    List<CategoryVO> getSubCategories(Long parentId);

    /** 根据ID获取分类详情 */
    Category getById(Long id);
}
