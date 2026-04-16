package com.beviat.evaluation.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 评价实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("evaluation")
public class Evaluation extends BaseEntity {
    private Integer orderType;        // 1-普通交易 2-拍卖交易
    private Long productId;            // 商品ID
    private Long evaluatorId;          // 评价人ID
    private Long evaluatedUserId;      // 被评价人ID
    private Integer score;             // 评分 1-5星
    private String content;            // 文字评价
    private String images;             // 评价图片(JSON数组)
    private String tags;               // 标签(JSON数组)
    private Boolean isAnonymous;       // 是否匿名
    private String replyContent;       // 卖家回复
    private LocalDateTime repliedAt;   // 回复时间
}
