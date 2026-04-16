package com.beviat.product.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 商品查询DTO
 */
@Data
public class ProductQueryDTO {
    /** 搜索关键词 */
    private String keyword;

    /** 分类ID */
    private Long categoryId;

    /** 商品状态: 0-在售 1-已售出 2-全部 */
    private Integer status = 0;

    /** 成色筛选 */
    private Integer conditionLevel;

    /** 最低价 */
    private BigDecimal minPrice;
    /** 最高价 */
    private BigDecimal maxPrice;

    /** 排序方式 */
    private String sortBy; // price_asc, price_desc, time, view_count

    /** 页码（从1开始） */
    private Integer page = 1;

    /** 每页条数 */
    private Integer size = 10;

    /** 卖家用户ID（查看某人的商品） */
    private Long sellerId;

    /** 是否只看置顶 */
    private Boolean isTop;

    /** 分类ID列表（多选） */
    private List<Long> categoryIds;
}
