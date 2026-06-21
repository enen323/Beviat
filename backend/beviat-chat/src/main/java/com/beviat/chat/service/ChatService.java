package com.beviat.chat.service;

import com.beviat.chat.dto.ChatMessageDTO;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beviat.chat.vo.ChatMessageVO;
import com.beviat.chat.vo.ConversationVO;

import java.util.List;

/**
 * 聊天服务
 */
public interface ChatService {

    /** 发送消息（通过WebSocket实时推送 + 持久化到DB） */
    ChatMessageVO sendMessage(Long senderId, ChatMessageDTO dto);

    /** 获取与某用户的聊天记录（分页） */
    Page<ChatMessageVO> getMessages(Long userId1, Long userId2, int page, int size);

    /** 获取当前用户的聊天列表（最近会话列表） */
    List<ConversationVO> getChatList(Long currentUserId);

    /** 标记与某用户的消息为已读 */
    int markAsRead(Long currentUserId, Long senderId);

    /** 获取未读消息总数 */
    long getUnreadCount(Long userId);
}
