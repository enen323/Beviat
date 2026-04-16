package com.beviat.common.result;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 分页结果封装
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {

    private long total;
    private List<T> records;
    private long current;
    private long size;
    private long pages;

    public static <T> PageResult<T> of(long total, List<T> records, long current, long size) {
        return new PageResult<>(total, records, current, size,
                (total + size - 1) / size);
    }
}
