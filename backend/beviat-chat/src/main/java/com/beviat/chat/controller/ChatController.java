package com.beviat.chat.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beviat.chat.dto.ChatMessageDTO;
import com.beviat.chat.service.ChatService;
import com.beviat.chat.vo.ChatMessageVO;
import com.beviat.chat.vo.ConversationVO;
import com.beviat.common.result.R;
import com.beviat.common.util.RequestContextHolder;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 聊天控制器
 * - REST API 用于历史消息查询、发送消息
 * - WebSocket (STOMP) 用于实时收发消息
 */
@Tag(name = "聊天管理", description = "即时通讯、消息记录")
@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ---- REST API ----

    @Operation(summary = "获取聊天列表（最近会话）")
    @GetMapping
    public R<List<ConversationVO>> getChatList() {
        Long userId = RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        return R.ok(chatService.getChatList(userId));
    }

    @Operation(summary = "获取与某用户的聊天记录")
    @GetMapping("/messages/{targetUserId}")
    public R<Page<ChatMessageVO>> getMessages(
            @PathVariable Long targetUserId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long currentUserId = RequestContextHolder.getCurrentUserId();
        if (currentUserId == null) currentUserId = 1L;
        return R.ok(chatService.getMessages(currentUserId, targetUserId, page, size));
    }

    @Operation(summary = "发送消息（REST方式）")
    @PostMapping("/send")
    public R<ChatMessageVO> sendMessage(@RequestBody ChatMessageDTO dto) {
        Long senderId = RequestContextHolder.getCurrentUserId();
        if (senderId == null) senderId = 1L;
        return R.ok(chatService.sendMessage(senderId, dto));
    }

    @Operation(summary = "标记消息已读")
    @PutMapping("/read/{senderId}")
    public R<Void> markAsRead(@PathVariable Long senderId) {
        Long currentUserId = RequestContextHolder.getCurrentUserId();
        if (currentUserId == null) currentUserId = 1L;
        chatService.markAsRead(currentUserId, senderId);
        return R.ok();
    }

    // ---- STOMP WebSocket 消息处理 ----

    /**
     * 客户端通过 STOMP 发送消息到 /app/chat/send
     * 服务端处理后推送到 /user/{receiverId}/queue/messages
     */
    @MessageMapping("/chat/send")
    public void handleChatMessage(@Payload ChatMessageDTO dto) {
        Long senderId = getCurrentUserId();
        if (senderId == null) return;
        chatService.sendMessage(senderId, dto);
    }

    private Long getCurrentUserId() {
        try {
            String name = SecurityContextHolder
                    .getContext().getAuthentication().getName();
            return Long.parseLong(name);
        } catch (Exception e) {
            return 1L;
        }
    }
}
