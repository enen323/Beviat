package com.beviat.product.controller;

import com.beviat.common.result.R;
import com.beviat.product.service.CategoryService;
import com.beviat.product.vo.CategoryVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类控制器
 */
@Tag(name = "分类管理", description = "商品分类的查询")
@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "获取分类树（含子分类）")
    @GetMapping("/tree")
    public R<List<CategoryVO>> getCategoryTree() {
        return R.ok(categoryService.getCategoryTree());
    }

    @Operation(summary = "获取所有启用的顶级分类")
    @GetMapping("/top")
    public R<List<CategoryVO>> getTopCategories() {
        return R.ok(categoryService.getTopCategories());
    }

    @Operation(summary = "获取某分类下的子分类列表")
    @GetMapping("/{parentId}/sub")
    public R<List<CategoryVO>> getSubCategories(@PathVariable Long parentId) {
        return R.ok(categoryService.getSubCategories(parentId));
    }

    @Operation(summary = "根据ID获取分类详情")
    @GetMapping("/{id}")
    public R<CategoryVO> getById(@PathVariable Long id) {
        com.beviat.common.domain.Category cat = categoryService.getById(id);
        if (cat == null || cat.getDeleted() == 1) {
            throw new com.beviat.common.exception.BizException("分类不存在");
        }
        CategoryVO vo = new CategoryVO();
        org.springframework.beans.BeanUtils.copyProperties(cat, vo);
        return R.ok(vo);
    }
}
