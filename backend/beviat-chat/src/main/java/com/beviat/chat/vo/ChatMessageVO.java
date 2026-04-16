package com.beviat.chat.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 聊天消息VO
 */
@Data
public class ChatMessageVO {
    private Long id;
    private Long senderId;
    private String senderNickname;
    private String senderAvatar;
    private Long receiverId;
    private String receiverNickname;
    private Long productId;
    private String productTitle;   // 商品标题（商品卡片消息用）
    private String productImage;   // 商品封面
    private Integer messageType;  // 1-文本 2-图片 3-商品卡片
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
