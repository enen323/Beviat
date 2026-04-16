package com.beviat.common.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;
import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("user")
public class User extends BaseEntity {
    private String username;
    private String password;
    private String nickname;
    private String email;
    private String phone;
    private String studentId;     // 学号
    private String avatar;        // 头像URL
    private Integer gender;       // 0-未知 1-男 2-女
    private String school;        // 学校
    private String department;    // 学院/系
    private String major;         // 专业
    private Integer enrollYear;   // 入学年份
    private Integer status;       // 0-正常 1-禁用 2-锁定
    private LocalDateTime lastLoginTime;
    private String lastLoginIp;
    private String bio;           // 个人简介

    private Integer creditScore;   // 信用分 (1-500)
}
