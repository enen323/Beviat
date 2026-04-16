package com.beviat.common.exception;

import com.beviat.common.result.R;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.TypeMismatchException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * 全局异常处理器
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public R<Void> handleBizException(BizException e) {
        log.warn("业务异常: {}", e.getMessage());
        return R.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public R<Void> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        log.warn("请求方法不支持: {} {}", e.getMethod(), e.getMessage());
        return R.fail(405, "请求方法 " + e.getMethod() + " 不支持，路径: " + e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<Void> handleValidException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldError() != null
                ? e.getBindingResult().getFieldError().getDefaultMessage()
                : "参数校验失败";
        return R.fail(400, message);
    }

    @ExceptionHandler(BindException.class)
    public R<Void> handleBindException(BindException e) {
        String message = e.getFieldError() != null
                ? e.getFieldError().getDefaultMessage()
                : "参数绑定失败";
        return R.fail(400, message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public R<Void> handleTypeMismatchException(MethodArgumentTypeMismatchException e) {
        String paramName = e.getName();
        String paramValue = e.getValue() != null ? e.getValue().toString() : "null";
        String requiredType = e.getRequiredType() != null ? e.getRequiredType().getSimpleName() : "未知";
        String message = String.format("参数 '%s' 的值 '%s' 无法转换为类型 %s", paramName, paramValue, requiredType);
        log.warn("参数类型转换异常: {}", message);
        return R.fail(400, message);
    }

    @ExceptionHandler(Exception.class)
    public R<Void> handleException(Exception e) {
        StackTraceElement[] stackTrace = e.getStackTrace();
        String location = "未知位置";
        if (stackTrace != null && stackTrace.length > 0) {
            location = stackTrace[0].getClassName() + "." + stackTrace[0].getMethodName()
                    + "(" + stackTrace[0].getFileName() + ":" + stackTrace[0].getLineNumber() + ")";
        }
        log.error("系统异常 [{}]", location, e);
        return R.fail(500, "服务器内部错误: " + e.getMessage() + " [" + location + "]");
    }
}
