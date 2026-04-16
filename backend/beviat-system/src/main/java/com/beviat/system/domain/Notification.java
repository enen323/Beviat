package com.beviat.system.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 系统通知/站内信实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("notification")
public class Notification extends BaseEntity {
    private Long userId;           // 接收用户ID
    private String type;           // system/order/auction/comment/like/follow/bid/warning
    private String title;          // 标题
    private String content;        // 内容摘要
    private String linkUrl;        // 跳转链接
    private Long relatedId;        // 关联业务ID
    private String relatedType;    // 关联类型
    private Integer isRead;        // 0-未读 1-已读
    private LocalDateTime readAt;  // 阅读时间
}
