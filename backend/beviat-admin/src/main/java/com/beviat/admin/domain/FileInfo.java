package com.beviat.admin.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * 文件元数据实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("file_info")
public class FileInfo extends BaseEntity {
    private String fileName;       // 原始文件名
    private String filePath;       // 存储路径/URL
    private Long fileSize;         // 文件大小(字节)
    private String fileExt;        // 扩展名
    private String mimeType;       // MIME类型
    private Integer storageMode;   // 0-本地 1-MinIO 2-OSS
    private String bucketName;     // 存储桶名
    private Long uploaderId;       // 上传者ID
    private String bizType;        // avatar/product/community/chat
    private String thumbnailPath;  // 缩略图路径
    private Integer width;         // 图片宽度
    private Integer height;        // 图片高度
    private Integer durationSec;   // 视频时长(秒)
}
