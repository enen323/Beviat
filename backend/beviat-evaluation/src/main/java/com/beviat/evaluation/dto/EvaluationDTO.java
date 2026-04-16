package com.beviat.evaluation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EvaluationDTO {
    @NotNull
    private Long productId;

    @NotNull
    private Integer orderType; // 1-普通 2-拍卖

    @NotNull
    @Min(1) @Max(5)
    private Integer score;

    /** 文字评价 */
    private String content;
    /** 评价图片 */
    private java.util.List<String> images;
    /** 标签 */
    private java.util.List<String> tags;
    /** 是否匿名 */
    private Boolean anonymous = false;
}
