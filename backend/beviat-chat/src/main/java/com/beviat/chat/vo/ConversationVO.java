package com.beviat.chat.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 最近会话VO
 */
@Data
public class ConversationVO {
    private Long id;       // 会话ID = peerId（前端key用）
    private Long peerId;
    private String peerName;
    private String peerAvatar;
    private Long productId;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Integer unreadCount;
}
