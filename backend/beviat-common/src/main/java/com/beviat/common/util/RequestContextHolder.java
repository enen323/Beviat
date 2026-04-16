package com.beviat.common.util;

/**
 * 请求上下文工具类
 * 用于在Controller层获取当前登录用户ID（由JWT拦截器设置到Request属性中）
 */
public class RequestContextHolder {

    private static final ThreadLocal<Long> CURRENT_USER = new ThreadLocal<>();

    public static void setCurrentUserId(Long userId) {
        CURRENT_USER.set(userId);
    }

    public static Long getCurrentUserId() {
        return CURRENT_USER.get();
    }

    public static void clear() {
        CURRENT_USER.remove();
    }
}
