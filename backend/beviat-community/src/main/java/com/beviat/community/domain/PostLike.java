package com.beviat.community.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * 点赞实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("community_like")
public class PostLike extends BaseEntity {
    private Long userId;           // 用户ID
    private Integer targetType;    // 1-帖子 2-评论
    private Long targetId;         // 目标ID
}
