package com.beviat.system.config;

import com.beviat.common.constant.Constants;
import com.beviat.common.util.JwtUtils;
import com.beviat.common.util.RequestContextHolder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT 认证拦截器
 * - 校验Token有效性
 * - 检查Token是否在黑名单中
 * - 将userId设置到Request属性中
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthInterceptor implements HandlerInterceptor {

    private final JwtUtils jwtUtils;
    private final StringRedisTemplate redisTemplate;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 跳过非Controller请求（静态资源等）
        if (!(handler instanceof org.springframework.web.method.HandlerMethod)) {
            return true;
        }

        String authHeader = request.getHeader(Constants.JWT_HEADER);
        if (authHeader == null || !authHeader.startsWith(Constants.JWT_PREFIX)) {
            return true; // 无Token放行（由各接口的@RequiresAuth注解控制）
        }

        String token = authHeader.substring(Constants.JWT_PREFIX.length());

        try {
            // 1. 检查黑名单
            String blacklisted = redisTemplate.opsForValue()
                    .get(Constants.REDIS_BLACKLIST_PREFIX + token);
            if (blacklisted != null) {
                sendError(response, 401, "登录已过期，请重新登录");
                return false;
            }

            // 2. 解析并校验Token
            Long userId = jwtUtils.getUserId(token);

            // 3. 将用户ID存入Request属性和ThreadLocal，供后续Controller使用
            request.setAttribute("currentUserId", userId);
            com.beviat.common.util.RequestContextHolder.setCurrentUserId(userId);
            return true;

        } catch (Exception e) {
            log.warn("JWT认证失败: {}", e.getMessage());
            sendError(response, 401, "Token无效或已过期");
            return false;
        }
    }

    private void sendError(HttpServletResponse response, int code, String message) {
        response.setStatus(code);
        response.setContentType("application/json;charset=UTF-8");
        try {
            response.getWriter().write(
                    "{\"code\":" + code + ",\"message\":\"" + message + "\",\"data\":null}"
            );
        } catch (Exception ignored) {
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        // 请求结束后清理ThreadLocal，防止内存泄漏
        RequestContextHolder.clear();
    }
}
