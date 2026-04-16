package com.beviat.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 聊天消息发送DTO
 */
@Data
public class ChatMessageDTO {
    @NotNull(message = "接收者不能为空")
    private Long receiverId;

    @NotBlank(message = "消息内容不能为空")
    private String content;

    /** 消息类型: 1-文本 2-图片 3-商品卡片 */
    private Integer messageType = 1;

    /** 关联商品ID（可选） */
    private Long productId;
}
