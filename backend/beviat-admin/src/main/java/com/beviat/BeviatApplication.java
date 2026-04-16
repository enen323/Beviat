package com.beviat;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Beviat 应用启动类
 */
@SpringBootApplication(scanBasePackages = "com.beviat")
@MapperScan("com.beviat.**.mapper")
@EnableAsync
@EnableScheduling
public class BeviatApplication {

    public static void main(String[] args) {
        SpringApplication.run(BeviatApplication.class, args);
        System.out.println("========================================");
        System.out.println("  Beviat 校园二手交易平台启动成功！");
        System.out.println("  API文档: http://localhost:8080/api/v1/swagger-ui.html");
        System.out.println("========================================");
    }
}
