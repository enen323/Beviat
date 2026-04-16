package com.beviat.community.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 社区帖子实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName(value = "community_post", autoResultMap = true)
public class Post extends BaseEntity {
    private Long authorId;         // 作者ID
    private String title;          // 标题
    private String content;        // 内容(富文本/Markdown)
    private String coverImage;     // 封面图
    private String category;       // 板块分类
    private String tags;           // 标签(JSON数组)
    private Integer viewCount;     // 浏览量
    private Integer likeCount;     // 点赞数
    private Integer commentCount;  // 评论数
    private Boolean isTop;         // 置顶
    private Boolean isEssence;     // 精华帖
    private Integer status;        // 0-正常 1-待审核 2-已隐藏 3-已删除
    private LocalDateTime lastCommentTime; // 最后评论时间

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> images;   // 图片URL列表(JSON)

    // ---- 非数据库字段 ----
    @TableField(exist = false)
    private String authorNickname;
    @TableField(exist = false)
    private String authorAvatar;
}
