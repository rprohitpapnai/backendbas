class ApiError extends Error{
    constructor(message, statusCode, errors=[],stack=""){
        super(message)
        this.statusCode = statusCode
        this.data =null
        this.code = code
        this.errors = errors
        this.success = false
    }
}