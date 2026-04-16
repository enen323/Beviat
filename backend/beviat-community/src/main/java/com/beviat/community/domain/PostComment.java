package com.beviat.community.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * 帖子评论实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("community_comment")
public class PostComment extends BaseEntity {
    private Long postId;           // 帖子ID
    private Long userId;           // 评论者ID
    private Long parentId;         // 父评论ID(null=一级评论)
    private Long replyToUserId;    // 被回复人
    private String content;        // 评论内容
    private Integer likeCount;     // 点赞数
    private Integer status;        // 0-正常 1-已删除

    // ---- 非数据库字段 ----
    @TableField(exist = false)
    private String userNickname;
    @TableField(exist = false)
    private String userAvatar;
}
