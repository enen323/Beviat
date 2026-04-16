package com.beviat.chat.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.common.domain.ChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

/**
 * 聊天消息 Mapper
 */
@Mapper
public interface ChatMessageMapper extends BaseMapper<ChatMessage> {

    /** 标记消息已读 */
    @Update("UPDATE chat_message SET is_read = 1, read_at = NOW() WHERE sender_id = #{senderId} AND receiver_id = #{receiverId} AND is_read = 0 AND deleted = 0")
    int markAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    /** 获取未读消息数 */
    default Long getUnreadCount(Long userId) {
        return selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getReceiverId, userId)
                .eq(ChatMessage::getIsRead, 0)
                .eq(ChatMessage::getIsRevoked, 0)
                .eq(ChatMessage::getDeleted, 0));
    }
}
