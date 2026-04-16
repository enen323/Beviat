package com.beviat.common.domain;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 基础实体类 - 所有实体继承此类
 * 包含公共字段：创建时间、更新时间、逻辑删除标记
 */
@Data
public class BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    @TableField(fill = FieldFill.INSERT)
    private Integer deleted;
}
