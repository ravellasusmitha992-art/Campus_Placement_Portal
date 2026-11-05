package com.campusplacement.exception;
import com.campusplacement.dto.ApiResponse; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class GlobalExceptionHandler {
 @ExceptionHandler(IllegalArgumentException.class) public ResponseEntity<ApiResponse> bad(IllegalArgumentException e){return ResponseEntity.badRequest().body(new ApiResponse(false,e.getMessage(),null));}
 @ExceptionHandler(Exception.class) public ResponseEntity<ApiResponse> error(Exception e){e.printStackTrace();return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false,"Server error: "+e.getMessage(),null));}
}
