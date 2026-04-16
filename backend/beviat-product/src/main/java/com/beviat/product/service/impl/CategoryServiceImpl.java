package com.beviat.product.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.beviat.common.domain.Category;
import com.beviat.product.mapper.CategoryMapper;
import com.beviat.product.service.CategoryService;
import com.beviat.product.vo.CategoryVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 分类服务实现
 */
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryMapper categoryMapper;

    @Override
    public List<CategoryVO> getCategoryTree() {
        // 1. 查询所有启用分类
        List<Category> allCategories = categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getStatus, 0)
                        .eq(Category::getDeleted, 0)
                        .orderByAsc(Category::getSortOrder)
                        .orderByAsc(Category::getId)
        );

        // 2. 构建树结构
        Map<Long, List<Category>> childrenMap = allCategories.stream()
                .filter(c -> c.getParentId() != null)
                .collect(Collectors.groupingBy(Category::getParentId));

        return allCategories.stream()
                .filter(c -> c.getParentId() == null)
                .map(c -> toCategoryVO(c, childrenMap))
                .toList();
    }

    @Override
    public List<CategoryVO> getTopCategories() {
        return categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getStatus, 0)
                        .isNull(Category::getParentId)
                        .eq(Category::getDeleted, 0)
                        .orderByAsc(Category::getSortOrder)
        ).stream().map(this::toSimpleVO).toList();
    }

    @Override
    public List<CategoryVO> getSubCategories(Long parentId) {
        return categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getParentId, parentId)
                        .eq(Category::getStatus, 0)
                        .eq(Category::getDeleted, 0)
                        .orderByAsc(Category::getSortOrder)
        ).stream().map(this::toSimpleVO).toList();
    }

    @Override
    public Category getById(Long id) {
        return categoryMapper.selectById(id);
    }

    private CategoryVO toCategoryVO(Category category, Map<Long, List<Category>> childrenMap) {
        CategoryVO vo = toSimpleVO(category);
        List<Category> children = childrenMap.getOrDefault(category.getId(), new ArrayList<>());
        if (!children.isEmpty()) {
            vo.setChildren(children.stream().map(c -> toCategoryVO(c, childrenMap)).toList());
        }
        return vo;
    }

    private CategoryVO toSimpleVO(Category category) {
        CategoryVO vo = new CategoryVO();
        BeanUtils.copyProperties(category, vo);
        return vo;
    }
}
