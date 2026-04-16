package com.beviat.community.service;

import com.beviat.community.domain.Post;
import com.beviat.community.domain.PostComment;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

public interface CommunityService {
    /** 发布帖子 */
    Post createPost(Long authorId, String title, String content, String category,
                    List<String> tags, String coverImage, List<String> images);

    /** 获取帖子详情（增加浏览量） */
    Post getPostDetail(Long postId);

    /** 帖子列表（分页+筛选） */
    Page<Post> getPostList(String category, int page, int size);

    /** 评论帖子 */
    PostComment addComment(Long userId, Long postId, Long parentId, Long replyToUserId, String content);

    /** 获取帖子评论 */
    Page<PostComment> getComments(Long postId, int page, int size);

    /** 点赞/取消点赞 */
    boolean toggleLike(Long userId, Integer targetType, Long targetId);
}
