    class AuthService {
    // 1. User Registration

    async register(dto: RegisterDto) {

    // - Check if email already exists
    // - Hash password
    // - Create user in database
    // - Return success response
    }

    // 2. User Login
    async login(dto: LoginDto) {
        // - Find user by email
        // - Compare password
        // - Generate JWT token
        // - Return token + user data
    }

    // 3. Helper: Validate User (used by login)
    async validateUser(email: string, password: string) {
        // - Find user
        // - Check password
        // - Return user or null
    }

}
