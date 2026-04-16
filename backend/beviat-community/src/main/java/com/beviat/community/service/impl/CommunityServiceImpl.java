package com.beviat.community.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beviat.common.domain.User;
import com.beviat.community.domain.Post;
import com.beviat.community.domain.PostComment;
import com.beviat.community.domain.PostLike;
import com.beviat.community.mapper.*;
import com.beviat.community.service.CommunityService;
import com.beviat.system.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityServiceImpl implements CommunityService {

    private final PostMapper postMapper;
    private final PostCommentMapper commentMapper;
    private final PostLikeMapper likeMapper;
    private final ObjectMapper objectMapper;
    private final UserService userService;

    @Override
    @Transactional
    public Post createPost(Long authorId, String title, String content, String category,
                           List<String> tags, String coverImage, List<String> images) {
        Post post = new Post();
        post.setAuthorId(authorId);
        post.setTitle(title);
        post.setContent(content);
        post.setCategory(category != null ? category : "default");
        post.setCoverImage(coverImage);
        post.setViewCount(0);
        post.setLikeCount(0);
        post.setCommentCount(0);
        post.setIsTop(false);
        post.setIsEssence(false);
        post.setStatus(0);
        post.setDeleted(0);
        post.setImages(images != null && !images.isEmpty() ? images : new java.util.ArrayList<>());

        try {
            if (tags != null && !tags.isEmpty())
                post.setTags(objectMapper.writeValueAsString(tags));
        } catch (Exception e) {
            log.warn("标签序列化失败", e);
        }

        postMapper.insert(post);
        log.info("帖子发布: postId={}, title={}", post.getId(), title);
        return post;
    }

    @Override
    public Post getPostDetail(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || post.getDeleted() != null && post.getDeleted() == 1)
            throw new com.beviat.common.exception.BizException("帖子不存在");

        // 增加浏览量
        post.setViewCount(post.getViewCount() + 1);
        postMapper.updateById(post);

        // 填充作者信息
        fillPostAuthorInfo(post);
        return post;
    }

    @Override
    public Page<Post> getPostList(String category, int page, int size) {
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<Post>()
                .eq(Post::getDeleted, 0).eq(Post::getStatus, 0)
                .eq(Post::getIsTop, false); // 非置顶

        if (category != null && !category.isBlank()) {
            wrapper.eq(Post::getCategory, category);
        }

        Page<Post> result = postMapper.selectPage(new Page<>(page, size),
                wrapper.orderByDesc(Post::getIsTop).orderByDesc(Post::getCreatedAt));

        // 批量填充作者信息
        fillPostListAuthorInfo(result.getRecords());
        return result;
    }

    @Override
    @Transactional
    public PostComment addComment(Long userId, Long postId, Long parentId,
                                  Long replyToUserId, String content) {
        // 校验帖子存在性
        Post post = postMapper.selectById(postId);
        if (post == null || post.getDeleted() == 1)
            throw new com.beviat.common.exception.BizException("帖子不存在");

        PostComment comment = new PostComment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setParentId(parentId);
        comment.setReplyToUserId(replyToUserId);
        comment.setContent(content);
        comment.setLikeCount(0);
        comment.setStatus(0);
        comment.setDeleted(0);

        commentMapper.insert(comment);

        // 填充评论者信息
        fillCommentUserInfo(comment);

        // 更新帖子评论数
        post.setCommentCount(post.getCommentCount() + 1);
        postMapper.updateById(post);

        log.info("新增评论: postId={}, userId={}", postId, userId);
        return comment;
    }

    @Override
    public Page<PostComment> getComments(Long postId, int page, int size) {
        Page<PostComment> result = commentMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<PostComment>()
                        .eq(PostComment::getPostId, postId)
                        .eq(PostComment::getStatus, 0).eq(PostComment::getDeleted, 0)
                        .orderByAsc(PostComment::getCreatedAt));

        // 批量填充评论者信息
        fillCommentListUserInfo(result.getRecords());
        return result;
    }

    @Override
    @Transactional
    public boolean toggleLike(Long userId, Integer targetType, Long targetId) {
        boolean exists = likeMapper.selectCount(
                new LambdaQueryWrapper<PostLike>()
                        .eq(PostLike::getUserId, userId)
                        .eq(PostLike::getTargetType, targetType)
                        .eq(PostLike::getTargetId, targetId)) > 0;

        if (exists) {
            likeMapper.delete(new LambdaQueryWrapper<PostLike>()
                    .eq(PostLike::getUserId, userId)
                    .eq(PostLike::getTargetType, targetType)
                    .eq(PostLike::getTargetId, targetId));
            if (targetType == 1) decrementLike(targetId);
            return false;
        } else {
            PostLike like = new PostLike();
            like.setUserId(userId);
            like.setTargetType(targetType);
            like.setTargetId(targetId);
            likeMapper.insert(like);
            if (targetType == 1) incrementLike(targetId);
            return true;
        }
    }

    private void incrementLike(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post != null) { post.setLikeCount(post.getLikeCount() + 1); postMapper.updateById(post); }
    }
    private void decrementLike(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post != null) { post.setLikeCount(Math.max(0, post.getLikeCount() - 1)); postMapper.updateById(post); }
    }

    // ---- 用户信息填充 ----

    private void fillPostAuthorInfo(Post post) {
        if (post == null || post.getAuthorId() == null) return;
        try {
            User author = userService.getById(post.getAuthorId());
            if (author != null) {
                post.setAuthorNickname(author.getNickname());
                post.setAuthorAvatar(author.getAvatar());
            }
        } catch (Exception e) {
            log.warn("填充帖子作者信息失败: authorId={}", post.getAuthorId());
        }
    }

    private void fillPostListAuthorInfo(List<Post> posts) {
        if (posts == null || posts.isEmpty()) return;
        Set<Long> authorIds = posts.stream()
                .map(Post::getAuthorId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        if (authorIds.isEmpty()) return;

        Map<Long, User> userMap;
        try {
            userMap = authorIds.stream()
                    .map(id -> {
                        try { return userService.getById(id); } catch (Exception e) { return null; }
                    })
                    .filter(u -> u != null)
                    .collect(Collectors.toMap(User::getId, u -> u));
        } catch (Exception e) {
            log.warn("批量获取用户信息失败", e);
            return;
        }

        for (Post post : posts) {
            User author = userMap.get(post.getAuthorId());
            if (author != null) {
                post.setAuthorNickname(author.getNickname());
                post.setAuthorAvatar(author.getAvatar());
            }
        }
    }

    private void fillCommentUserInfo(PostComment comment) {
        if (comment == null || comment.getUserId() == null) return;
        try {
            User user = userService.getById(comment.getUserId());
            if (user != null) {
                comment.setUserNickname(user.getNickname());
                comment.setUserAvatar(user.getAvatar());
            }
        } catch (Exception e) {
            log.warn("填充评论用户信息失败: userId={}", comment.getUserId());
        }
    }

    private void fillCommentListUserInfo(List<PostComment> comments) {
        if (comments == null || comments.isEmpty()) return;
        Set<Long> userIds = comments.stream()
                .map(PostComment::getUserId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        if (userIds.isEmpty()) return;

        Map<Long, User> userMap;
        try {
            userMap = userIds.stream()
                    .map(id -> {
                        try { return userService.getById(id); } catch (Exception e) { return null; }
                    })
                    .filter(u -> u != null)
                    .collect(Collectors.toMap(User::getId, u -> u));
        } catch (Exception e) {
            log.warn("批量获取评论用户信息失败", e);
            return;
        }

        for (PostComment comment : comments) {
            User user = userMap.get(comment.getUserId());
            if (user != null) {
                comment.setUserNickname(user.getNickname());
                comment.setUserAvatar(user.getAvatar());
            }
        }
    }
}
