package com.beviat.system.controller;

import com.beviat.common.exception.BizException;
import com.beviat.common.result.R;
import com.beviat.common.util.RequestContextHolder;
import com.beviat.system.dto.UserUpdateDTO;
import com.beviat.system.service.UserService;
import com.beviat.system.vo.UserVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 用户控制器
 */
@Tag(name = "用户管理", description = "用户资料修改等")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "获取当前用户资料")
    @GetMapping("/me")
    public R<UserVO> getCurrentUser() {
        Long userId = getCurrentUserId();
        return R.ok(userService.getUserInfo(userId));
    }

    @Operation(summary = "修改当前用户资料（JSON）")
    @PutMapping("/me")
    public R<UserVO> updateProfile(@Valid @RequestBody UserUpdateDTO dto) {
        Long userId = getCurrentUserId();
        userService.updateUserInfo(userId, dto);
        return R.ok(userService.getUserInfo(userId));
    }

    @Operation(summary = "修改当前用户资料（FormData，含头像上传）")
    @PutMapping(value = "/me/profile", consumes = "multipart/form-data")
    public R<UserVO> updateProfileWithAvatar(
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String bio,
            @RequestParam(required = false) Integer gender,
            @RequestParam(required = false) String school,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String major,
            @RequestParam(required = false) Integer enrollYear,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String avatar,
            @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile) {

        Long userId = getCurrentUserId();

        // 如果上传了头像文件，先处理文件上传获取URL
        String avatarUrl = avatar;
        if (avatarFile != null && !avatarFile.isEmpty()) {
            avatarUrl = userService.uploadAvatar(userId, avatarFile);
        }

        UserUpdateDTO dto = new UserUpdateDTO();
        dto.setNickname(nickname);
        dto.setBio(bio);
        dto.setGender(gender);
        dto.setSchool(school);
        dto.setDepartment(department);
        dto.setMajor(major);
        dto.setEnrollYear(enrollYear);
        dto.setEmail(email);
        dto.setPhone(phone);
        dto.setStudentId(studentId);
        dto.setAvatar(avatarUrl);

        userService.updateUserInfo(userId, dto);
        return R.ok(userService.getUserInfo(userId));
    }

    /** 从JWT拦截器设置的ThreadLocal获取当前用户ID */
    private Long getCurrentUserId() {
        Long userId = RequestContextHolder.getCurrentUserId();
        if (userId == null) {
            throw new BizException(401, "未登录或登录已过期");
        }
        return userId;
    }
}
