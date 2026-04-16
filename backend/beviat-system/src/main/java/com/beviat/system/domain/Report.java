package com.beviat.system.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 举报实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("report")
public class Report extends BaseEntity {
    private Long reporterId;       // 举报人ID
    private Integer targetType;    // 1-商品 2-用户 3-帖子 4-评论
    private Long targetId;         // 举报目标ID
    private Integer reasonType;    // 1-虚假信息 2-违禁品 3-骚扰 4-欺诈 5-侵权 6-其他
    private String reasonDetail;   // 详细说明
    private String evidenceImages; // 证据图片(JSON数组)
    private Integer status;        // 0-待处理 1-处理中 2-已成立 3-不成立
    private Long handlerId;        // 处理人(管理员)
    private String handleResult;   // 处理结果
    private LocalDateTime handledAt;// 处理时间
}
