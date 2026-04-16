package com.beviat.product.vo;

import lombok.Data;

import java.util.List;

/**
 * 分类树VO
 */
@Data
public class CategoryVO {
    private Long id;
    private String name;
    private String icon;
    private String description;
    private Integer sortOrder;
    private Long parentId;
    private List<CategoryVO> children;
}
