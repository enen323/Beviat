package com.beviat.common.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * 商品分类实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("category")
public class Category extends BaseEntity {
    private String name;         // 分类名称
    private String icon;         // 分类图标(emoji或URL)
    private Integer sortOrder;   // 排序序号（越小越靠前）
    private String description;  // 分类描述
    private Long parentId;       // 父级分类ID（null=顶级）
    private Integer status;      // 0-启用 1-禁用

    // ---- 非数据库字段 ----
    @TableField(exist = false)
    private java.util.List<Category> children; // 子分类列表
}
