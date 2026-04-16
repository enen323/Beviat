package com.beviat.chat.config;

import com.beviat.common.constant.Constants;
import com.beviat.common.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.security.Principal;

/**
 * WebSocket STOMP 连接认证拦截器
 * 在CONNECT时校验JWT Token，将用户身份绑定到Session
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;
    private final StringRedisTemplate redisTemplate;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("WebSocket连接缺少Token");
                return null; // 拒绝连接
            }

            String token = authHeader.substring(7);
            try {
                // 检查黑名单
                String blacklisted = redisTemplate.opsForValue()
                        .get(Constants.REDIS_BLACKLIST_PREFIX + token);
                if (blacklisted != null) {
                    log.warn("WebSocket连接Token已失效");
                    return null;
                }

                Long userId = jwtUtils.getUserId(token);
                // 使用轻量级Principal，避免依赖spring-security
                accessor.setUser(new StompPrincipal(userId));
                log.info("WebSocket用户连接成功: userId={}", userId);

            } catch (Exception e) {
                log.warn("WebSocket认证失败: {}", e.getMessage());
                return null;
            }
        }

        return message;
    }

    /**
     * 轻量级Principal实现，仅承载userId用于WebSocket会话标识
     * 使Spring能正确路由 /user/{userId}/queue/messages
     */
    record StompPrincipal(Long userId) implements Principal {
        @Override
        public String getName() {
            return String.valueOf(userId);
        }
    }
}
