package com.beviat.common.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 商品实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName(value = "product", autoResultMap = true)
public class Product extends BaseEntity {
    private String title;            // 标题
    private String description;      // 描述
    private BigDecimal price;         // 价格
    private BigDecimal originalPrice;// 原价
    private Long categoryId;          // 分类ID
    private Long sellerId;           // 卖家ID
    private Integer status;          // 0-在售 1-已售出 2-已下架
    private Integer conditionLevel;  // 成色: 1全新 99几乎新 95轻微痕迹 90明显痕迹 80有瑕疵
    private Integer tradeType;       // 0-自提 1-快递 2-都可
    @TableField(typeHandler = com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler.class)
    private List<String> images;           // 商品图片(JSON数组URL列表)
    private Integer viewCount;       // 浏览次数
    private Integer favoriteCount;   // 收藏数
    private String location;         // 所在地/取货地址
    private String contactQq;        // QQ
    private String contactWechat;    // 微信
    private Boolean isTop;           // 是否置顶
    private String offlineReason;    // 下架原因
    private LocalDateTime soldAt;    // 售出时间

    // ---- 非数据库字段（关联查询填充） ----
    @TableField(exist = false)
    private String categoryName;
    @TableField(exist = false)
    private User seller;
    /** 是否被当前用户收藏 */
    @TableField(exist = false)
    private Boolean favorited;
    /** 距离(km，LBS附近商品时填充） */
    @TableField(exist = false)
    private Double distance;
}
