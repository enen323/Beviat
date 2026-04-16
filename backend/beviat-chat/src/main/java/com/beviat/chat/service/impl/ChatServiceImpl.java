package com.beviat.chat.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beviat.chat.dto.ChatMessageDTO;
import com.beviat.chat.mapper.ChatMessageMapper;
import com.beviat.chat.service.ChatService;
import com.beviat.chat.vo.ChatMessageVO;
import com.beviat.common.domain.ChatMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * 聊天服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatMessageMapper chatMessageMapper;
    private final SimpMessagingTemplate messagingTemplate; // WebSocket消息推送模板

    @Override
    public ChatMessageVO sendMessage(Long senderId, ChatMessageDTO dto) {
        // 1. 持久化消息到数据库
        ChatMessage msg = new ChatMessage();
        msg.setSenderId(senderId);
        msg.setReceiverId(dto.getReceiverId());
        msg.setMessageType(dto.getMessageType() != null ? dto.getMessageType() : 1);
        msg.setContent(dto.getContent());
        msg.setProductId(dto.getProductId());
        msg.setIsRead(0);
        msg.setIsRevoked(0);

        chatMessageMapper.insert(msg);

        // 2. 构建VO
        ChatMessageVO vo = toVO(msg);

        // 3. 通过WebSocket实时推送给接收者（点对点消息）
        try {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(dto.getReceiverId()),
                    "/queue/messages",
                    vo
            );
            log.debug("WebSocket消息推送成功: to={}", dto.getReceiverId());
        } catch (Exception e) {
            log.warn("WebSocket消息推送失败（接收方可能不在线）: to={}, error={}", dto.getReceiverId(), e.getMessage());
        }

        log.debug("消息发送: from={} to={}, type={}", senderId, dto.getReceiverId(), dto.getMessageType());
        return vo;
    }

    @Override
    public Page<ChatMessageVO> getMessages(Long userId1, Long userId2, int page, int size) {
        LambdaQueryWrapper<ChatMessage> wrapper = new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getDeleted, 0)
                .eq(ChatMessage::getIsRevoked, 0)
                .and(w -> w
                        .and(sub -> sub.eq(ChatMessage::getSenderId, userId1).eq(ChatMessage::getReceiverId, userId2))
                        .or(sub -> sub.eq(ChatMessage::getSenderId, userId2).eq(ChatMessage::getReceiverId, userId1))
                )
                .orderByAsc(ChatMessage::getCreatedAt);

        Page<ChatMessage> pageResult = chatMessageMapper.selectPage(new Page<>(page, size), wrapper);
        Page<ChatMessageVO> voPage = new Page<>(pageResult.getCurrent(), pageResult.getSize(), pageResult.getTotal());
        voPage.setRecords(pageResult.getRecords().stream().map(this::toVO).toList());

        return voPage;
    }

    @Override
    public List<Object> getChatList(Long currentUserId) {
        // TODO: 实现最近会话列表（按最后一条消息时间排序，含未读数）
        return List.of();
    }

    @Override
    public int markAsRead(Long currentUserId, Long senderId) {
        return chatMessageMapper.markAsRead(senderId, currentUserId);
    }

    @Override
    public long getUnreadCount(Long userId) {
        return chatMessageMapper.getUnreadCount(userId);
    }

    /** 实体 -> VO */
    private ChatMessageVO toVO(ChatMessage msg) {
        ChatMessageVO vo = new ChatMessageVO();
        vo.setId(msg.getId());
        vo.setSenderId(msg.getSenderId());
        vo.setReceiverId(msg.getReceiverId());
        vo.setMessageType(msg.getMessageType());
        vo.setContent(msg.getContent());
        vo.setProductId(msg.getProductId());
        vo.setIsRead(msg.getIsRead() == 1);
        vo.setCreatedAt(msg.getCreatedAt());
        return vo;
    }
}
