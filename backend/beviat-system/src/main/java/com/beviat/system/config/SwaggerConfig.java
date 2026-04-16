package com.beviat.system.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger / SpringDoc 配置
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI beviatOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Beviat 校园二手交易平台 API")
                        .description("Beviat 后端 RESTful API 文档\n" +
                                "### 技术栈\n" +
                                "- Spring Boot 3.2 + Java 17\n" +
                                "- MyBatis Plus 3.5.6\n" +
                                "- MySQL 8.0 + Redis")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Beviat Team")
                                .url("https://github.com/beviat"))
                );
    }
}
