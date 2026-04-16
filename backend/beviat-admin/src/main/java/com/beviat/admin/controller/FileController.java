package com.beviat.admin.controller;

import com.beviat.admin.domain.FileInfo;
import com.beviat.common.exception.BizException;
import com.beviat.common.result.R;

import cn.hutool.core.lang.UUID;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Set;

/**
 * 文件上传控制器
 * 开发环境使用本地存储，生产环境可切换为OSS/MinIO
 */
@Slf4j
@Tag(name = "文件管理", description = "图片/文件上传")
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    @Value("${file.storage.local.path}")
    private String uploadPath;

    @Value("${file.storage.local.url-prefix}")
    private String urlPrefix;

    /** 允许上传的文件类型（扩展名白名单） */
    // private static final Set<String> ALLOWED_TYPES = Set.of(
    //         "jpg", "jpeg", "png", "gif", "bmp", "webp",
    //         "pdf", "doc", "docx", "xls", "xlsx"
    // );
    @Value("${file.upload.allowed-types}")
    private static Set<String> ALLOWED_TYPES;

    @Operation(summary = "上传文件")
    @PostMapping("/upload")
    public R<FileInfo> upload(@RequestParam("file") MultipartFile file) {
        // 1. 校验文件
        if (file.isEmpty()) {
            throw new BizException("请选择要上传的文件");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new BizException("文件名不能为空");
        }

        // 2. 检查文件类型
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex < 0) {
            throw new BizException("无法识别的文件类型");
        }
        String ext = originalName.substring(dotIndex + 1).toLowerCase();
        if (!ALLOWED_TYPES.contains(ext)) {
            throw new BizException("不支持的文件类型: " + ext);
        }

        // 3. 文件大小限制 (10MB)
        long maxSize = 10L * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new BizException("文件大小不能超过10MB");
        }

        try {
            // 4. 构建存储路径: /yyyy/MM/dd/uuid.ext
            LocalDate today = LocalDate.now();
            Path dirPath = Paths.get(uploadPath,
                    String.valueOf(today.getYear()),
                    String.valueOf(today.getMonthValue()),
                    String.valueOf(today.getDayOfMonth())
            );
            Files.createDirectories(dirPath);

            String fileName = UUID.randomUUID() + "." + ext;
            Path filePath = dirPath.resolve(fileName);
            file.transferTo(filePath.toFile());

            // 5. 构建访问URL和相对存储路径
            String relativePath = Paths.get(
                    String.valueOf(today.getYear()),
                    String.valueOf(today.getMonthValue()),
                    String.valueOf(today.getDayOfMonth()),
                    fileName
            ).toString().replace("\\", "/");

            FileInfo fileInfo = new FileInfo();
            fileInfo.setFileName(originalName);
            fileInfo.setFilePath(relativePath);
            fileInfo.setFileSize(file.getSize());
            fileInfo.setFileExt(ext);
            fileInfo.setMimeType(file.getContentType());
            fileInfo.setStorageMode(0); // 本地存储

            log.info("文件上传成功: originalName={}, path={}", originalName, relativePath);
            return R.ok(fileInfo);

        } catch (IOException e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new BizException("文件上传失败: " + e.getMessage());
        }
    }

    @Operation(summary = "获取文件")
    @GetMapping("/{year}/{month}/{day}/{fileName}")
    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> getFile(
            @PathVariable String year, @PathVariable String month,
            @PathVariable String day, @PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadPath, year, month, day, fileName);
            if (!Files.exists(filePath)) {
                return org.springframework.http.ResponseEntity.notFound().build();
            }
            org.springframework.core.io.Resource resource = new org.springframework.core.io.FileSystemResource(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";
            return org.springframework.http.ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (IOException e) {
            log.error("文件读取失败: {}", e.getMessage());
            return org.springframework.http.ResponseEntity.notFound().build();
        }
    }
}
