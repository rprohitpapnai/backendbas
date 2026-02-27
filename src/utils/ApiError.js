class ApiError extends Error{
    constructor(message, statusCode, errors=[],statck=""){
        super(message)
        this.statusCode = statusCode
        this.data =null
        this.code = code
        this.errors = errors
        this.success = false
        if (statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
export {ApiError}