package com.beviat.chat.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.chat.vo.ConversationVO;
import com.beviat.common.domain.ChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

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

    /** 获取当前用户的最近会话列表 */
    @Select("SELECT cm.peer_id AS id, cm.peer_id AS peer_id, " +
            "u.nickname AS peer_name, " +
            "u.avatar AS peer_avatar, " +
            "cm.product_id, " +
            "cm.content AS last_message, " +
            "cm.created_at AS last_message_time, " +
            "COALESCE(unread.unread_count, 0) AS unread_count " +
            "FROM ( " +
            "  SELECT CASE WHEN sender_id = #{userId} THEN receiver_id ELSE sender_id END AS peer_id, " +
            "         content, message_type, product_id, created_at, id, " +
            "         ROW_NUMBER() OVER ( " +
            "           PARTITION BY CASE WHEN sender_id = #{userId} THEN receiver_id ELSE sender_id END " +
            "           ORDER BY created_at DESC) AS rn " +
            "  FROM chat_message " +
            "  WHERE (sender_id = #{userId} OR receiver_id = #{userId}) " +
            "    AND deleted = 0 AND is_revoked = 0 " +
            ") cm " +
            "LEFT JOIN `user` u ON cm.peer_id = u.id " +
            "LEFT JOIN ( " +
            "  SELECT sender_id, COUNT(*) AS unread_count " +
            "  FROM chat_message " +
            "  WHERE receiver_id = #{userId} AND is_read = 0 AND deleted = 0 AND is_revoked = 0 " +
            "  GROUP BY sender_id " +
            ") unread ON cm.peer_id = unread.sender_id " +
            "WHERE cm.rn = 1 " +
            "ORDER BY cm.created_at DESC")
    List<ConversationVO> selectConversations(@Param("userId") Long userId);
}
