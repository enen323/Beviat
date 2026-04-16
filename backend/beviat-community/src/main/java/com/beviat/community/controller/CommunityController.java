package com.beviat.community.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beviat.community.domain.Post;
import com.beviat.community.domain.PostComment;
import com.beviat.community.service.CommunityService;
import com.beviat.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Tag(name = "社区论坛")
@RestController
@RequestMapping("/community")
@RequiredArgsConstructor
public class CommunityController {
    private final CommunityService communityService;

    @Value("${file.storage.local.path:./uploads}")
    private String uploadPath;

    /** 图片访问的相对路径前缀 */
    private static final String RELATIVE_URL_PREFIX = "/api/v1/files/";

    @Operation(summary = "发布帖子")
    @PostMapping(value = "/posts", consumes = "multipart/form-data")
    public R<Post> createPost(@RequestParam String title,
                              @RequestParam String content,
                              @RequestParam(defaultValue = "default") String category,
                              @RequestParam(required = false) String tags,
                              @RequestParam(required = false) String coverImage,
                              @RequestPart(value = "images", required = false) MultipartFile[] imageFiles) {
        Long userId = com.beviat.common.util.RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;

        // 解析 tags JSON 字符串
        java.util.List<String> tagList = null;
        if (tags != null && !tags.isBlank()) {
            try {
                tagList = new com.fasterxml.jackson.databind.ObjectMapper().readValue(tags, java.util.List.class);
            } catch (Exception e) {
                tagList = java.util.List.of();
            }
        }

        // 处理图片上传
        List<String> imageUrls = new ArrayList<>();
        if (imageFiles != null && imageFiles.length > 0) {
            for (MultipartFile file : imageFiles) {
                String url = uploadFile(file);
                if (url != null) {
                    imageUrls.add(url);
                }
            }
        }

        return R.ok(communityService.createPost(userId, title, content, category, tagList, coverImage, imageUrls));
    }

    @Operation(summary = "获取帖子列表")
    @GetMapping("/posts")
    public R<Page<Post>> getPosts(@RequestParam(required = false) String category,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "10") int size) {
        return R.ok(communityService.getPostList(category, page, size));
    }

    @Operation(summary = "获取帖子详情")
    @GetMapping("/posts/{id}")
    public R<Post> getPostDetail(@PathVariable Long id) {
        return R.ok(communityService.getPostDetail(id));
    }

    @Operation(summary = "评论帖子")
    @PostMapping("/posts/{postId}/comments")
    public R<PostComment> addComment(@PathVariable Long postId,
                                     @RequestBody java.util.Map<String, Object> body) {
        Long userId = com.beviat.common.util.RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        String content = (String) body.get("content");
        Long parentId = body.get("parentId") != null ? Long.valueOf(body.get("parentId").toString()) : null;
        Long replyToUserId = body.get("replyToUserId") != null ? Long.valueOf(body.get("replyToUserId").toString()) : null;
        return R.ok(communityService.addComment(userId, postId, parentId, replyToUserId, content));
    }

    @Operation(summary = "获取评论列表")
    @GetMapping("/posts/{postId}/comments")
    public R<Page<PostComment>> getComments(@PathVariable Long postId,
                                            @RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return R.ok(communityService.getComments(postId, page, size));
    }

    @Operation(summary = "点赞/取消点赞")
    @PostMapping("/like")
    public R<Boolean> toggleLike(@RequestParam Integer targetType, @RequestParam Long targetId) {
        Long userId = com.beviat.common.util.RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        return R.ok(communityService.toggleLike(userId, targetType, targetId));
    }

    /** 上传单个文件并返回访问URL */
    private String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            LocalDate today = LocalDate.now();
            Path dirPath = Paths.get(uploadPath,
                    String.valueOf(today.getYear()),
                    String.valueOf(today.getMonthValue()),
                    String.valueOf(today.getDayOfMonth()));
            Files.createDirectories(dirPath);

            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf('.'));
            }
            String fileName = UUID.randomUUID() + ext;
            Path filePath = dirPath.resolve(fileName);
            file.transferTo(filePath.toFile());

            String relativePath = Paths.get(
                    String.valueOf(today.getYear()),
                    String.valueOf(today.getMonthValue()),
                    String.valueOf(today.getDayOfMonth()),
                    fileName).toString().replace("\\", "/");

            return RELATIVE_URL_PREFIX + relativePath;
        } catch (IOException e) {
            return null;
        }
    }
}
