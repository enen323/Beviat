package com.beviat.system.controller;

import com.beviat.common.exception.BizException;
import com.beviat.common.result.R;
import com.beviat.common.util.RequestContextHolder;
import com.beviat.system.dto.*;
import com.beviat.system.service.UserService;
import com.beviat.system.vo.UserVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@Tag(name = "认证管理", description = "登录、注册、Token刷新等")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public R<TokenVO> login(@Valid @RequestBody LoginDTO dto) {
        return R.ok(userService.login(dto));
    }

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public R<Void> register(@Valid @RequestBody RegisterDTO dto) {
        userService.register(dto);
        return R.ok("注册成功", null);
    }

    @Operation(summary = "刷新Token")
    @PostMapping("/refresh")
    public R<TokenVO> refresh(@RequestParam String refreshToken) {
        return R.ok(userService.refreshToken(refreshToken));
    }

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/me")
    public R<UserVO> getUserInfo() {
        // 从JWT Filter设置的ThreadLocal获取当前用户ID
        Long userId = getCurrentUserId();
        return R.ok(userService.getUserInfo(userId));
    }

    @Operation(summary = "退出登录")
    @PostMapping("/logout")
    public R<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = extractToken(authHeader);
        userService.logout(token);
        return R.ok("退出成功", null);
    }

    /** 从JWT拦截器设置的ThreadLocal获取当前用户ID */
    private Long getCurrentUserId() {
        Long userId = RequestContextHolder.getCurrentUserId();
        if (userId == null) {
            throw new BizException(401, "未登录或登录已过期");
        }
        return userId;
    }

    private String extractToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) return null;
        return header.substring(7);
    }
}
