package com.beviat.product.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 商品创建DTO
 */
@Data
public class ProductCreateDTO {
    @NotBlank(message = "商品标题不能为空")
    @Size(max = 200, message = "标题最长200字")
    private String title;

    @NotBlank(message = "商品描述不能为空")
    @Size(max = 5000, message = "描述最长5000字")
    private String description;

    @NotNull(message = "价格不能为空")
    @DecimalMin(value = "0.01", message = "价格必须大于0.01")
    @DecimalMax(value = "999999", message = "价格超出范围")
    private BigDecimal price;

    private BigDecimal originalPrice; // 原价（可选）

    @NotNull(message = "请选择分类")
    private Long categoryId;

    /** 成色: 1全新 99几乎新 95轻微痕迹 90明显痕迹 80有瑕疵 */
    @NotNull(message = "请选择成色")
    private Integer conditionLevel;

    /** 交易方式: 0-自提 1-快递 2-都可以（可多选） */
    @NotNull(message = "请选择交易方式")
    private Integer tradeType;

    /** 商品图片URL列表（最多9张） */
    @Size(max = 9, message = "最多上传9张图片")
    private List<String> images;

    /** 所在地/取货地址 */
    private String location;

    /** 联系QQ */
    private String contactQq;
    /** 联系微信 */
    private String contactWechat;
}
