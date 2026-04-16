package com.beviat.product.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

/**
 * 用户行为记录实体（用于推荐算法）
 */
@Data
@Accessors(chain = true)
@TableName("user_behavior")
public class UserBehavior {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;           // 用户ID
    private String behaviorType;   // view/click/favorite/search/purchase/chat/share
    private String targetType;     // product/post/user/category
    private Long targetId;         // 目标ID
    private String extraData;      // 扩展数据(JSON)
    private String ipAddress;
    private String userAgent;
    private java.time.LocalDateTime createdAt;
}
