package com.beviat.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket (STOMP) 配置
 * - 启用STOMP消息代理
 * - 注册WebSocket端点（支持SockJS降级）
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 启用内存消息代理（单机模式）
        // 生产环境可替换为 /topic -> RabbitMQ/Redis Pub/Sub
        config.enableSimpleBroker("/topic", "/queue");
        // 设置客户端发送消息的前缀
        config.setApplicationDestinationPrefixes("/app");
        // 用户点对点消息前缀
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();  // 支持不支持WebSocket的浏览器降级为长轮询
    }
}
