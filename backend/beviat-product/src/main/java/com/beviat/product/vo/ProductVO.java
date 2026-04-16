package com.beviat.product.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 商品详情VO
 */
@Data
public class ProductVO {
    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Long categoryId;
    private String categoryName;
    private Long sellerId;
    private String sellerNickname;
    private String sellerAvatar;
    private Integer sellerCreditScore;
    private String sellerSchool;
    private Integer status;
    private Integer conditionLevel;
    private String conditionLevelText; // "全新" / "几乎全新" 等
    private Integer tradeType;
    private List<String> images;
    private String coverImage;     // 封面图URL（取images第一张）
    private Integer viewCount;
    private Integer favoriteCount;
    private String location;
    private Boolean isTop;
    private Boolean favorited;
    /** 距离(km) */
    private Double distance;
    private LocalDateTime createdAt;
}
