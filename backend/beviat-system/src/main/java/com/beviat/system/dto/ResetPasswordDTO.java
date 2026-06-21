package com.beviat.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 重置密码请求DTO（通过重置凭证设置新密码）
 */
@Data
public class ResetPasswordDTO {

    @NotBlank(message = "重置凭证不能为空")
    private String resetToken;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度为6-32个字符")
    private String newPassword;
}
