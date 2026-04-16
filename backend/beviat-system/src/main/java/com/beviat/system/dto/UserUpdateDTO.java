package com.beviat.system.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

/**
 * 用户资料更新DTO
 */
@Data
public class UserUpdateDTO {
    @Size(max = 50, message = "昵称最长50个字符")
    private String nickname;

    private String email;
    private String phone;
    private String studentId;
    @URL(message = "头像URL格式不正确")
    private String avatar;
    private Integer gender;       // 0未知 1男 2女
    private String school;
    private String department;
    private String major;
    private Integer enrollYear;
    @Size(max = 200, message="简介最长200字")
    private String bio;
}
