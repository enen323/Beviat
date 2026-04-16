package com.beviat.product.domain;

import com.beviat.common.domain.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * 收藏实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("favorite")
public class Favorite extends BaseEntity {
    private Long userId;
    private Long productId;
    private String folderName;  // 收藏夹名称
    private String note;        // 备注
}
