package com.beviat.system.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户信息VO（返回给前端的用户数据，不含敏感字段）
 */
@Data
public class UserVO {
    private Long id;
    private String username;
    private String nickname;
    private String email;
    private String phone;
    private String studentId;
    private String avatar;
    private Integer gender;
    private String school;
    private String department;
    private String major;
    private Integer enrollYear;
    private String bio;
    private Integer creditScore;
    private LocalDateTime createdAt;
}
