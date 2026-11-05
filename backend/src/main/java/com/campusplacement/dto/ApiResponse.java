package com.campusplacement.dto;
public class ApiResponse { private boolean success; private String message; private Object data; public ApiResponse(boolean s,String m,Object d){success=s;message=m;data=d;} public boolean isSuccess(){return success;} public String getMessage(){return message;} public Object getData(){return data;} }
