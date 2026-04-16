package com.beviat.common.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户实时位置实体
 */
@Data
@Accessors(chain = true)
@TableName("user_location")
public class UserLocation {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private LocalDateTime updatedAt;
}
