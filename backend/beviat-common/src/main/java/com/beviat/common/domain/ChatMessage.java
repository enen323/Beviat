package com.beviat.common.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 聊天消息实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("chat_message")
public class ChatMessage extends BaseEntity {
    private Long senderId;       // 发送者
    private Long receiverId;     // 接收者
    private Long productId;      // 关联商品（可选）
    private Integer messageType; // 1-文本 2-图片 3-商品卡片
    private String content;      // 消息内容
    private Integer isRead;      // 0-未读 1-已读
    private LocalDateTime readAt;// 已读时间
    private Integer isRevoked;   // 0-正常 1-已撤回

    // ---- 非数据库字段 ----
    @TableField(exist = false)
    private String senderNickname;
    @TableField(exist = false)
    private String senderAvatar;
}
