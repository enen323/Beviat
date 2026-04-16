package com.beviat.chat.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket 通道配置（注册认证拦截器）
 * 注意：@EnableWebSocketMessageBroker 已在 WebSocketConfig 中声明，此处不再重复
 */
@Configuration
@RequiredArgsConstructor
public class WebSocketChannelConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor authInterceptor;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // 在客户端输入通道注册JWT认证拦截器
        registration.interceptors(authInterceptor);
    }
}
