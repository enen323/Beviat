package com.beviat.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Token响应VO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenVO {
    private String accessToken;
    private String refreshToken;
}
